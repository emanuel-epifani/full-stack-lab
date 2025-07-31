// @ts-nocheck
/* eslint-disable */
// singleton/DatabaseConnection.ts

/**
 * SINGLETON PATTERN
 *
 * WHY: Ensures only one instance exists globally.
 * WHEN: Expensive resources (DB connections, caches, config managers).
 *
 * REAL SCENARIO:
 * - Database connection pool (PostgreSQL allows max 100 connections)
 * - Redis cache client (connection overhead expensive)
 * - Application configuration (loaded once from environment)
 * - Logger instance (file handle management)
 *
 * WARNING: Use sparingly - can create hidden dependencies and testing issues.
 */

class DatabaseConnection {
    private static instance: DatabaseConnection | null = null;
    private isConnected: boolean = false;
    private connectionPool: any = null;

    // Private constructor prevents direct instantiation
    private constructor() {}

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    public async connect(): Promise<void> {
        if (this.isConnected) {
            console.log('Already connected to database');
            return;
        }

        console.log('Establishing database connection...');
        // Expensive operation - connection pool creation
        this.connectionPool = {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            maxConnections: 20,
            idleTimeout: 30000
        };

        this.isConnected = true;
        console.log('Database connected successfully');
    }

    public async query(sql: string, params: any[] = []): Promise<any> {
        if (!this.isConnected) {
            await this.connect();
        }

        console.log(`Executing query: ${sql}`);
        // Use the single connection pool
        return { rows: [], count: 0 };
    }

    public async disconnect(): Promise<void> {
        if (this.isConnected) {
            console.log('Closing database connection...');
            this.connectionPool = null;
            this.isConnected = false;
        }
    }
}

// Configuration Singleton - loaded once from environment
class AppConfig {
    private static instance: AppConfig | null = null;
    private config: Record<string, any> = {};

    private constructor() {
        this.loadConfig();
    }

    public static getInstance(): AppConfig {
        if (!AppConfig.instance) {
            AppConfig.instance = new AppConfig();
        }
        return AppConfig.instance;
    }

    private loadConfig(): void {
        console.log('Loading application configuration...');
        // Expensive operation - file I/O, environment parsing
        this.config = {
            port: process.env.PORT || 3000,
            jwtSecret: process.env.JWT_SECRET || 'default-secret',
            dbUrl: process.env.DATABASE_URL || 'postgres://localhost:5432/app',
            redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
            logLevel: process.env.LOG_LEVEL || 'info'
        };
    }

    public get(key: string): any {
        return this.config[key];
    }

    public getAll(): Record<string, any> {
        return { ...this.config };
    }
}

// Logger Singleton - single file handle
class Logger {
    private static instance: Logger | null = null;
    private fileHandle: any = null;

    private constructor() {
        this.initializeLogger();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private initializeLogger(): void {
        console.log('Initializing logger...');
        // Expensive operation - file system access
        this.fileHandle = {
            path: './app.log',
            writeStream: 'mock-write-stream'
        };
    }

    public info(message: string): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] INFO: ${message}`;
        console.log(logEntry);
        // Write to single file handle
    }

    public error(message: string): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ERROR: ${message}`;
        console.error(logEntry);
        // Write to single file handle
    }
}

// Usage - same instance everywhere
class UserService {
    private db = DatabaseConnection.getInstance();
    private config = AppConfig.getInstance();
    private logger = Logger.getInstance();

    async createUser(email: string, name: string): Promise<void> {
        this.logger.info(`Creating user: ${email}`);

        const maxUsers = this.config.get('maxUsers');
        if (maxUsers && await this.getUserCount() >= maxUsers) {
            throw new Error('User limit reached');
        }

        await this.db.query(
            'INSERT INTO users (email, name) VALUES (?, ?)',
            [email, name]
        );

        this.logger.info(`User created successfully: ${email}`);
    }

    private async getUserCount(): Promise<number> {
        const result = await this.db.query('SELECT COUNT(*) FROM users');
        return result.rows[0].count;
    }
}

class OrderService {
    private db = DatabaseConnection.getInstance(); // Same instance
    private logger = Logger.getInstance();         // Same instance

    async createOrder(userId: string, items: any[]): Promise<void> {
        this.logger.info(`Creating order for user: ${userId}`);

        await this.db.query(
            'INSERT INTO orders (user_id, items) VALUES (?, ?)',
            [userId, JSON.stringify(items)]
        );
    }
}

// Application startup - initialize singletons once
async function initializeApp(): Promise<void> {
    const db = DatabaseConnection.getInstance();
    await db.connect();

    const config = AppConfig.getInstance();
    console.log('App config loaded:', config.getAll());

    const logger = Logger.getInstance();
    logger.info('Application initialized successfully');
}

// Both services use the same instances
const userService = new UserService();
const orderService = new OrderService();