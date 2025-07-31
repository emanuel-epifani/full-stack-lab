// @ts-nocheck
/* eslint-disable */
// repository/UserRepository.ts

/**
 * REPOSITORY PATTERN
 *
 * WHY: Abstracts data access logic from business logic.
 * WHEN: Always. Essential for testability and database independence.
 *
 * REAL SCENARIO:
 * - Start with PostgreSQL, later migrate to MongoDB
 * - Need to test business logic without hitting real DB
 * - Multiple data sources (DB + Redis + External API)
 */

interface User {
    id: string;
    email: string;
    name: string;
}

// Abstract repository - defines contract
abstract class UserRepository {
    abstract findById(id: string): Promise<User | null>;
    abstract findByEmail(email: string): Promise<User | null>;
    abstract save(user: User): Promise<void>;
    abstract delete(id: string): Promise<void>;
}

// Concrete implementation - PostgreSQL
class PostgreSQLUserRepository extends UserRepository {
    constructor(private db: any) { super(); }

    async findById(id: string): Promise<User | null> {
        const result = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await this.db.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }

    async save(user: User): Promise<void> {
        await this.db.query(
            'INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET email = $2, name = $3',
            [user.id, user.email, user.name]
        );
    }

    async delete(id: string): Promise<void> {
        await this.db.query('DELETE FROM users WHERE id = $1', [id]);
    }
}

// Mock implementation - for testing
class InMemoryUserRepository extends UserRepository {
    private users: Map<string, User> = new Map();

    async findById(id: string): Promise<User | null> {
        return this.users.get(id) || null;
    }

    async findByEmail(email: string): Promise<User | null> {
        for (const user of this.users.values()) {
            if (user.email === email) return user;
        }
        return null;
    }

    async save(user: User): Promise<void> {
        this.users.set(user.id, user);
    }

    async delete(id: string): Promise<void> {
        this.users.delete(id);
    }
}

// Business logic - completely decoupled from data access
class UserService {
    constructor(private userRepo: UserRepository) {}

    async createUser(email: string, name: string): Promise<User> {
        const existing = await this.userRepo.findByEmail(email);
        if (existing) {
            throw new Error('User already exists');
        }

        const user: User = {
            id: crypto.randomUUID(),
            email,
            name
        };

        await this.userRepo.save(user);
        return user;
    }
}

// Usage - dependency injection
const dbRepo = new PostgreSQLUserRepository(dbConnection);
const userService = new UserService(dbRepo);

// Testing - no database needed
const mockRepo = new InMemoryUserRepository();
const testService = new UserService(mockRepo);