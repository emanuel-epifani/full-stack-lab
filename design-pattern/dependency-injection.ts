// @ts-nocheck
/* eslint-disable */

// dependency-injection/DIContainer.ts

/**
 * DEPENDENCY INJECTION PATTERN
 *
 * WHY: Removes hard dependencies, enables testing, improves flexibility.
 * WHEN: Classes depend on interfaces/abstractions, need to swap implementations.
 *
 * REAL SCENARIO:
 * - Different database implementations (PostgreSQL, MongoDB, Redis)
 * - Email services (SendGrid, AWS SES, SMTP)
 * - Payment providers (Stripe, PayPal, Square)
 * - Environment-specific configs (dev, staging, prod)
 */

// Service interfaces - contracts that implementations must follow
interface IUserRepository {
    findById(id: string): Promise<User | null>;
    save(user: User): Promise<void>;
    delete(id: string): Promise<void>;
}

interface IEmailService {
    sendEmail(to: string, subject: string, body: string): Promise<void>;
}

interface ILogger {
    info(message: string): void;
    error(message: string): void;
}

interface IPaymentService {
    processPayment(amount: number, token: string): Promise<PaymentResult>;
}

// Data models
interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

interface PaymentResult {
    success: boolean;
    transactionId?: string;
    error?: string;
}

// Concrete implementations
class PostgreSQLUserRepository implements IUserRepository {
    constructor(private connectionString: string) {}

    async findById(id: string): Promise<User | null> {
        console.log(`🐘 PostgreSQL: Finding user ${id}`);
        // Mock database query
        return {
            id,
            email: `user${id}@example.com`,
            name: `User ${id}`,
            createdAt: new Date()
        };
    }

    async save(user: User): Promise<void> {
        console.log(`🐘 PostgreSQL: Saving user ${user.id}`);
        // Mock save operation
    }

    async delete(id: string): Promise<void> {
        console.log(`🐘 PostgreSQL: Deleting user ${id}`);
        // Mock delete operation
    }
}

class MongoUserRepository implements IUserRepository {
    constructor(private connectionString: string) {}

    async findById(id: string): Promise<User | null> {
        console.log(`🍃 MongoDB: Finding user ${id}`);
        // Mock MongoDB query
        return {
            id,
            email: `mongo-user${id}@example.com`,
            name: `Mongo User ${id}`,
            createdAt: new Date()
        };
    }

    async save(user: User): Promise<void> {
        console.log(`🍃 MongoDB: Saving user ${user.id}`);
    }

    async delete(id: string): Promise<void> {
        console.log(`🍃 MongoDB: Deleting user ${id}`);
    }
}

class SendGridEmailService implements IEmailService {
    constructor(private apiKey: string) {}

    async sendEmail(to: string, subject: string, body: string): Promise<void> {
        console.log(`📧 SendGrid: Sending email to ${to}`);
        console.log(`   Subject: ${subject}`);
        // SendGrid API integration
    }
}

class SMTPEmailService implements IEmailService {
    constructor(private host: string, private port: number) {}

    async sendEmail(to: string, subject: string, body: string): Promise<void> {
        console.log(`📮 SMTP: Sending email to ${to} via ${this.host}:${this.port}`);
        console.log(`   Subject: ${subject}`);
        // SMTP server integration
    }
}

class ConsoleLogger implements ILogger {
    info(message: string): void {
        console.log(`ℹ️ [INFO] ${new Date().toISOString()}: ${message}`);
    }

    error(message: string): void {
        console.error(`❌ [ERROR] ${new Date().toISOString()}: ${message}`);
    }
}

class FileLogger implements ILogger {
    constructor(private filePath: string) {}

    info(message: string): void {
        console.log(`📝 [FILE-INFO] Writing to ${this.filePath}: ${message}`);
        // Write to file
    }

    error(message: string): void {
        console.log(`📝 [FILE-ERROR] Writing to ${this.filePath}: ${message}`);
        // Write to file
    }
}

class StripePaymentService implements IPaymentService {
    constructor(private secretKey: string) {}

    async processPayment(amount: number, token: string): Promise<PaymentResult> {
        console.log(`💳 Stripe: Processing $${amount} payment`);

        // Mock Stripe API call
        if (token === 'valid-token') {
            return {
                success: true,
                transactionId: `stripe_${Date.now()}`
            };
        }

        return {
            success: false,
            error: 'Invalid payment token'
        };
    }
}

// Dependency Injection Container
class DIContainer {
    private services: Map<string, any> = new Map();
    private singletons: Map<string, any> = new Map();

    // Register a service factory
    register<T>(name: string, factory: (container: DIContainer) => T): void {
        this.services.set(name, factory);
    }

    // Register a singleton service
    registerSingleton<T>(name: string, factory: (container: DIContainer) => T): void {
        this.services.set(name, factory);
        this.services.set(`${name}:singleton`, true);
    }

    // Resolve a service by name
    resolve<T>(name: string): T {
        // Check if it's a singleton and already created
        if (this.services.get(`${name}:singleton`) && this.singletons.has(name)) {
            return this.singletons.get(name);
        }

        const factory = this.services.get(name);
        if (!factory) {
            throw new Error(`Service '${name}' not registered`);
        }

        const instance = factory(this);

        // Store singleton instance
        if (this.services.get(`${name}:singleton`)) {
            this.singletons.set(name, instance);
        }

        return instance;
    }

    // Register instance directly
    registerInstance<T>(name: string, instance: T): void {
        this.singletons.set(name, instance);
        this.services.set(`${name}:singleton`, true);
    }
}

// Business service with dependencies
class UserService {
    constructor(
        private userRepository: IUserRepository,
        private emailService: IEmailService,
        private logger: ILogger
    ) {}

    async createUser(email: string, name: string): Promise<User> {
        this.logger.info(`Creating user: ${email}`);

        try {
            const user: User = {
                id: crypto.randomUUID(),
                email,
                name,
                createdAt: new Date()
            };

            await this.userRepository.save(user);

            await this.emailService.sendEmail(
                email,
                'Welcome!',
                `Welcome ${name}! Your account has been created.`
            );

            this.logger.info(`User created successfully: ${user.id}`);
            return user;
        } catch (error) {
            this.logger.error(`Failed to create user: ${error.message}`);
            throw error;
        }
    }

    async getUserById(id: string): Promise<User | null> {
        this.logger.info(`Fetching user: ${id}`);
        return await this.userRepository.findById(id);
    }
}

class OrderService {
    constructor(
        private userRepository: IUserRepository,
        private paymentService: IPaymentService,
        private emailService: IEmailService,
        private logger: ILogger
    ) {}

    async processOrder(userId: string, amount: number, paymentToken: string): Promise<void> {
        this.logger.info(`Processing order for user ${userId}, amount: $${amount}`);

        try {
            // Get user info
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Process payment
            const paymentResult = await this.paymentService.processPayment(amount, paymentToken);
            if (!paymentResult.success) {
                throw new Error(paymentResult.error || 'Payment failed');
            }

            // Send confirmation email
            await this.emailService.sendEmail(
                user.email,
                'Order Confirmation',
                `Your order of $${amount} has been processed successfully.`
            );

            this.logger.info(`Order processed successfully for user ${userId}`);
        } catch (error) {
            this.logger.error(`Order processing failed: ${error.message}`);
            throw error;
        }
    }
}

// Configuration for different environments
class AppConfig {
    static setupDevelopmentContainer(): DIContainer {
        const container = new DIContainer();

        // Development configuration - use local services
        container.register<IUserRepository>('userRepository', () =>
            new PostgreSQLUserRepository('postgresql://localhost:5432/dev_db')
        );

        container.register<IEmailService>('emailService', () =>
            new SMTPEmailService('localhost', 1025) // MailHog for testing
        );

        container.registerSingleton<ILogger>('logger', () =>
            new ConsoleLogger()
        );

        container.register<IPaymentService>('paymentService', () =>
            new StripePaymentService('sk_test_fake_key')
        );

        // Register business services
        container.register<UserService>('userService', (c) =>
            new UserService(
                c.resolve('userRepository'),
                c.resolve('emailService'),
                c.resolve('logger')
            )
        );

        container.register<OrderService>('orderService', (c) =>
            new OrderService(
                c.resolve('userRepository'),
                c.resolve('paymentService'),
                c.resolve('emailService'),
                c.resolve('logger')
            )
        );

        return container;
    }

    static setupProductionContainer(): DIContainer {
        const container = new DIContainer();

        // Production configuration - use cloud services
        container.register<IUserRepository>('userRepository', () =>
            new PostgreSQLUserRepository(process.env.DATABASE_URL!)
        );

        container.register<IEmailService>('emailService', () =>
            new SendGridEmailService(process.env.SENDGRID_API_KEY!)
        );

        container.registerSingleton<ILogger>('logger', () =>
            new FileLogger('/var/log/app.log')
        );

        container.register<IPaymentService>('paymentService', () =>
            new StripePaymentService(process.env.STRIPE_SECRET_KEY!)
        );

        // Register business services (same as dev)
        container.register<UserService>('userService', (c) =>
            new UserService(
                c.resolve('userRepository'),
                c.resolve('emailService'),
                c.resolve('logger')
            )
        );

        container.register<OrderService>('orderService', (c) =>
            new OrderService(
                c.resolve('userRepository'),
                c.resolve('paymentService'),
                c.resolve('emailService'),
                c.resolve('logger')
            )
        );

        return container;
    }

    static setupTestContainer(): DIContainer {
        const container = new DIContainer();

        // Test configuration - use mocks
        const mockUserRepo: IUserRepository = {
            findById: async (id) => ({ id, email: 'test@example.com', name: 'Test User', createdAt: new Date() }),
            save: async () => {},
            delete: async () => {}
        };

        const mockEmailService: IEmailService = {
            sendEmail: async (to, subject, body) => {
                console.log(`📧 MOCK: Email sent to ${to}`);
            }
        };

        const mockLogger: ILogger = {
            info: (msg) => console.log(`TEST-INFO: ${msg}`),
            error: (msg) => console.log(`TEST-ERROR: ${msg}`)
        };

        const mockPaymentService: IPaymentService = {
            processPayment: async (amount, token) => ({
                success: token === 'valid-token',
                transactionId: token === 'valid-token' ? 'mock-transaction' : undefined,
                error: token === 'valid-token' ? undefined : 'Mock payment failed'
            })
        };

        // Register mocks
        container.registerInstance('userRepository', mockUserRepo);
        container.registerInstance('emailService', mockEmailService);
        container.registerInstance('logger', mockLogger);
        container.registerInstance('paymentService', mockPaymentService);

        // Register business services
        container.register<UserService>('userService', (c) =>
            new UserService(
                c.resolve('userRepository'),
                c.resolve('emailService'),
                c.resolve('logger')
            )
        );

        container.register<OrderService>('orderService', (c) =>
            new OrderService(
                c.resolve('userRepository'),
                c.resolve('paymentService'),
                c.resolve('emailService'),
                c.resolve('logger')
            )
        );

        return container;
    }
}

// Application bootstrap
class Application {
    private container: DIContainer;

    constructor(environment: 'development' | 'production' | 'test' = 'development') {
        switch (environment) {
            case 'development':
                this.container = AppConfig.setupDevelopmentContainer();
                break;
            case 'production':
                this.container = AppConfig.setupProductionContainer();
                break;
            case 'test':
                this.container = AppConfig.setupTestContainer();
                break;
        }
    }

    getUserService(): UserService {
        return this.container.resolve<UserService>('userService');
    }

    getOrderService(): OrderService {
        return this.container.resolve<OrderService>('orderService');
    }
}

// Usage examples
async function demonstrateDependencyInjection(): Promise<void> {
    console.log('=== Development Environment Demo ===');
    const devApp = new Application('development');
    const devUserService = devApp.getUserService();
    const devOrderService = devApp.getOrderService();

    const user = await devUserService.createUser('dev@example.com', 'Dev User');
    await devOrderService.processOrder(user.id, 99.99, 'valid-token');

    console.log('\n=== Production Environment Demo ===');
    const prodApp = new Application('production');
    const prodUserService = prodApp.getUserService();

    await prodUserService.createUser('prod@example.com', 'Prod User');

    console.log('\n=== Test Environment Demo ===');
    const testApp = new Application('test');
    const testUserService = testApp.getUserService();
    const testOrderService = testApp.getOrderService();

    const testUser = await testUserService.createUser('test@example.com', 'Test User');
    await testOrderService.processOrder(testUser.id, 50.00, 'valid-token');

    // Test failure case
    try {
        await testOrderService.processOrder(testUser.id, 25.00, 'invalid-token');
    } catch (error) {
        console.log('Expected error caught:', error.message);
    }
}

// Advanced: Decorator pattern for dependency injection
function Injectable(name: string) {
    return function(target: any) {
        target.serviceName = name;
        return target;
    };
}

function Inject(serviceName: string) {
    return function(target: any, propertyKey: string | symbol, parameterIndex: number) {
        const existingTokens = Reflect.getMetadata('design:paramtypes', target) || [];
        const injectionTokens = Reflect.getMetadata('injection:tokens', target) || [];
        injectionTokens[parameterIndex] = serviceName;
        Reflect.defineMetadata('injection:tokens', injectionTokens, target);
    };
}

// Example with decorators (requires reflect-metadata)
@Injectable('decoratedUserService')
class DecoratedUserService {
    constructor(
        @Inject('userRepository') private userRepository: IUserRepository,
        @Inject('emailService') private emailService: IEmailService,
        @Inject('logger') private logger: ILogger
    ) {}

    async createUser(email: string, name: string): Promise<User> {
        // Same implementation as UserService
        return { id: crypto.randomUUID(), email, name, createdAt: new Date() };
    }
}

export { DIContainer, Application, AppConfig };