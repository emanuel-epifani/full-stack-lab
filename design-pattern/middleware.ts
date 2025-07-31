// @ts-nocheck
/* eslint-disable */

// middleware/RequestPipeline.ts

/**
 * MIDDLEWARE PATTERN (Chain of Responsibility)
 *
 * WHY: Process requests through a chain of handlers, each with specific responsibility.
 * WHEN: Need to process requests with multiple steps, order matters, some steps optional.
 *
 * REAL SCENARIO:
 * - HTTP request processing (auth, validation, rate limiting, logging)
 * - Data transformation pipeline (parse, validate, sanitize, transform)
 * - Message processing (decrypt, decompress, validate, route)
 */

// Request/Response interfaces
interface Request {
    id: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body: any;
    user?: any;
    metadata?: Record<string, any>;
}

interface Response {
    status: number;
    body: any;
    headers?: Record<string, string>;
}

// Middleware interface
interface Middleware {
    execute(request: Request, next: () => Promise<Response>): Promise<Response>;
}

// Concrete middleware implementations
class LoggingMiddleware implements Middleware {
    async execute(request: Request, next: () => Promise<Response>): Promise<Response> {
        const startTime = Date.now();

        console.log(`📝 [${request.id}] ${request.method} ${request.path} - Started`);

        try {
            const response = await next();
            const duration = Date.now() - startTime;

            console.log(`✅ [${request.id}] ${response.status} - Completed in ${duration}ms`);
            return response;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`❌ [${request.id}] Error after ${duration}ms:`, error.message);
            throw error;
        }
    }
}

class AuthenticationMiddleware implements Middleware {
    async execute(request: Request, next: () => Promise<Response>): Promise<Response> {
        console.log(`🔐 [${request.id}] Authenticating request...`);

        const authHeader = request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                status: 401,
                body: { error: 'Missing or invalid authorization header' }
            };
        }

        const token = authHeader.substring(7);

        try {
            // Mock JWT verification
            const user = await this.verifyToken(token);

            // Add user to request context
            request.user = user;

            console.log(`✅ [${request.id}] Authenticated as ${user.email}`);
            return await next();
        } catch (error) {
            return {
                status: 401,
                body: { error: 'Invalid token' }
            };
        }
    }

    private async verifyToken(token: string): Promise<any> {
        // Mock token verification
        if (token === 'valid-token') {
            return { id: 'user123', email: 'user@example.com', role: 'user' };
        }
        if (token === 'admin-token') {
            return { id: 'admin123', email: 'admin@example.com', role: 'admin' };
        }
        throw new Error('Invalid token');
    }
}

class RateLimitingMiddleware implements Middleware {
    private requests: Map<string, number[]> = new Map();
    private readonly windowMs = 60 * 1000; // 1 minute
    private readonly maxRequests = 10;

    async execute(request: Request, next: () => Promise<Response>): Promise<Response> {
        const clientId = this.getClientId(request);

        console.log(`⏱️ [${request.id}] Checking rate limit for ${clientId}...`);

        if (this.isRateLimited(clientId)) {
            console.log(`🚫 [${request.id}] Rate limit exceeded for ${clientId}`);
            return {
                status: 429,
                body: { error: 'Rate limit exceeded' },
                headers: { 'Retry-After': '60' }
            };
        }

        this.recordRequest(clientId);
        console.log(`✅ [${request.id}] Rate limit passed`);

        return await next();
    }

    private getClientId(request: Request): string {
        // Use user ID if authenticated, otherwise IP address
        return request.user?.id || request.headers['x-forwarded-for'] || 'unknown';
    }

    private isRateLimited(clientId: string): boolean {
        const now = Date.now();
        const requests = this.requests.get(clientId) || [];

        // Remove old requests outside the window
        const validRequests = requests.filter(time => now - time < this.windowMs);
        this.requests.set(clientId, validRequests);

        return validRequests.length >= this.maxRequests;
    }

    private recordRequest(clientId: string): void {
        const requests = this.requests.get(clientId) || [];
        requests.push(Date.now());
        this.requests.set(clientId, requests);
    }
}

class ValidationMiddleware implements Middleware {
    private schemas: Map<string, any> = new Map();

    constructor() {
        // Define validation schemas for different endpoints
        this.schemas.set('POST:/users', {
            body: {
                email: { required: true, type: 'email' },
                name: { required: true, type: 'string', minLength: 2 },
                age: { required: false, type: 'number', min: 18 }
            }
        });

        this.schemas.set('PUT:/users/:id', {
            body: {
                name: { required: false, type: 'string', minLength: 2 },
                age: { required: false, type: 'number', min: 18 }
            }
        });
    }

    async execute(request: Request, next: () => Promise<Response>): Promise<Response> {
        console.log(`🔍 [${request.id}] Validating request...`);

        const schemaKey = `${request.method}:${request.path}`;
        const schema = this.schemas.get(schemaKey);

        if (!schema) {
            console.log(`⚠️ [${request.id}] No validation schema found for ${schemaKey}`);
            return await next();
        }

        const validationErrors = this.validateRequest(request, schema);

        if (validationErrors.length > 0) {
            console.log(`❌ [${request.id}] Validation failed:`, validationErrors);
            return {
                status: 400,
                body: { error: 'Validation failed', details: validationErrors }
            };
        }

        console.log(`✅ [${request.id}] Validation passed`);
        return await next();
    }

    private validateRequest(request: Request, schema: any): string[] {
        const errors: string[] = [];

        if (schema.body) {
            for (const [field, rules] of Object.entries(schema.body as any)) {
                const value = request.body?.[field];
                const fieldErrors = this.validateField(field, value, rules);
                errors.push(...fieldErrors);
            }
        }

        return errors;
    }

    private validateField(field: string, value: any, rules: any): string[] {
        const errors: string[] = [];

        if (rules.required && (value === undefined || value === null)) {
            errors.push(`${field} is required`);
            return errors;
        }

        if (value !== undefined && value !== null) {
            if (rules.type === 'email' && !this.isValidEmail(value)) {
                errors.push(`${field} must be a valid email`);
            }

            if (rules.type === 'string' && typeof value !== 'string') {
                errors.push(`${field} must be a string`);
            }

            if (rules.type === 'number' && typeof value !== 'number') {
                errors.push(`${field} must be a number`);
            }

            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`${field} must be at least ${rules.minLength} characters`);
            }

            if (rules.min && value < rules.min) {
                errors.push(`${field} must be at least ${rules.min}`);
            }
        }

        return errors;
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

class AuthorizationMiddleware implements Middleware {
    private permissions: Map<string, string[]> = new Map();

    constructor() {
        // Define permissions for different endpoints
        this.permissions.set('DELETE:/users/:id', ['admin']);
        this.permissions.set('GET:/admin/users', ['admin']);
        this.permissions.set('POST:/users', ['user', 'admin']);
        this.permissions.set('GET:/users/:id', ['user', 'admin']);
    }

    async execute(request: Request, next: () => Promise<Response>): Promise<Response> {
        console.log(`🛡️ [${request.id}] Checking authorization...`);

        const requiredRoles = this.permissions.get(`${request.method}:${request.path}`);

        if (!requiredRoles) {
            console.log(`⚠️ [${request.id}] No authorization required`);
            return await next();
        }

        if (!request.user) {
            return {
                status: 401,
                body: { error: 'Authentication required' }
            };
        }

        if (!requiredRoles.includes(request.user.role)) {
            console.log(`🚫 [${request.id}] Insufficient permissions`);
            return {
                status: 403,
                body: { error: 'Insufficient permissions' }
            };
        }

        console.log(`✅ [${request.id}] Authorization passed`);
        return await next();
    }
}

// Pipeline executor - chains middleware together
class MiddlewarePipeline {
    private middlewares: Middleware[] = [];

    use(middleware: Middleware): MiddlewarePipeline {
        this.middlewares.push(middleware);
        return this;
    }

    async execute(request: Request, handler: () => Promise<Response>): Promise<Response> {
        let index = 0;

        const next = async (): Promise<Response> => {
            if (index >= this.middlewares.length) {
                // All middleware executed, call the final handler
                return await handler();
            }

            const middleware = this.middlewares[index++];
            return await middleware.execute(request, next);
        };

        return await next();
    }
}

// HTTP server simulation
class HTTPServer {
    private pipeline = new MiddlewarePipeline();
    private routes: Map<string, () => Promise<Response>> = new Map();

    constructor() {
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.pipeline
            .use(new LoggingMiddleware())
            .use(new RateLimitingMiddleware())
            .use(new AuthenticationMiddleware())
            .use(new ValidationMiddleware())
            .use(new AuthorizationMiddleware());
    }

    private setupRoutes(): void {
        this.routes.set('GET:/users/123', async () => ({
            status: 200,
            body: { id: '123', name: 'John Doe', email: 'john@example.com' }
        }));

        this.routes.set('POST:/users', async () => ({
            status: 201,
            body: { id: 'new-user', message: 'User created successfully' }
        }));

        this.routes.set('DELETE:/users/123', async () => ({
            status: 200,
            body: { message: 'User deleted successfully' }
        }));
    }

    async handleRequest(request: Request): Promise<Response> {
        const routeKey = `${request.method}:${request.path}`;
        const handler = this.routes.get(routeKey);

        if (!handler) {
            return { status: 404, body: { error: 'Route not found' } };
        }

        try {
            return await this.pipeline.execute(request, handler);
        } catch (error) {
            console.error(`💥 [${request.id}] Unhandled error:`, error);
            return {
                status: 500,
                body: { error: 'Internal server error' }
            };
        }
    }
}

// Usage demonstration
async function demonstrateMiddlewarePattern(): Promise<void> {
    const server = new HTTPServer();

    console.log('=== Valid Request Demo ===');
    const validRequest: Request = {
        id: 'req-001',
        method: 'POST',
        path: '/users',
        headers: { 'authorization': 'Bearer valid-token' },
        body: { email: 'test@example.com', name: 'Test User', age: 25 }
    };

    const response1 = await server.handleRequest(validRequest);
    console.log('Response:', response1);

    console.log('\n=== Unauthorized Request Demo ===');
    const unauthorizedRequest: Request = {
        id: 'req-002',
        method: 'DELETE',
        path: '/users/123',
        headers: { 'authorization': 'Bearer valid-token' }, // user token, not admin
        body: {}
    };

    const response2 = await server.handleRequest(unauthorizedRequest);
    console.log('Response:', response2);
}