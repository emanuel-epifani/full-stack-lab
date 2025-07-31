// @ts-nocheck
/* eslint-disable */
// observer/EventSystem.ts

/**
 * OBSERVER PATTERN
 *
 * WHY: Loose coupling between components that need to react to state changes.
 * WHEN: One object needs to notify multiple dependents of state changes.
 *
 * REAL SCENARIO:
 * - User registration triggers: email verification, welcome email, analytics
 * - Order placement triggers: inventory update, payment processing, shipping
 * - File upload triggers: virus scan, thumbnail generation, CDN sync
 */

// Observer interface - defines what observers must implement
interface Observer<T> {
    update(data: T): Promise<void>;
}

// Subject interface - defines event emitter contract
interface Subject<T> {
    subscribe(observer: Observer<T>): void;
    unsubscribe(observer: Observer<T>): void;
    notify(data: T): Promise<void>;
}

// Generic event emitter - the subject
class EventEmitter<T> implements Subject<T> {
    private observers: Observer<T>[] = [];

    subscribe(observer: Observer<T>): void {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
            console.log(`Observer subscribed. Total: ${this.observers.length}`);
        }
    }

    unsubscribe(observer: Observer<T>): void {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
            console.log(`Observer unsubscribed. Total: ${this.observers.length}`);
        }
    }

    async notify(data: T): Promise<void> {
        console.log(`Notifying ${this.observers.length} observers...`);

        // Parallel execution for better performance
        const promises = this.observers.map(observer =>
            observer.update(data).catch(error => {
                console.error('Observer failed:', error.message);
                // Continue with other observers even if one fails
            })
        );

        await Promise.all(promises);
    }
}

// Event data interfaces
interface UserRegisteredEvent {
    userId: string;
    email: string;
    name: string;
    timestamp: Date;
}

interface OrderPlacedEvent {
    orderId: string;
    userId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    totalAmount: number;
    timestamp: Date;
}

// Concrete observers - different reactions to events
class EmailVerificationObserver implements Observer<UserRegisteredEvent> {
    async update(data: UserRegisteredEvent): Promise<void> {
        console.log(`📧 Sending verification email to ${data.email}`);

        // Mock email service call
        await this.sendVerificationEmail(data.email, data.userId);

        console.log(`✅ Verification email sent to ${data.email}`);
    }

    private async sendVerificationEmail(email: string, userId: string): Promise<void> {
        // Simulate email service delay
        await new Promise(resolve => setTimeout(resolve, 100));
        // AWS SES, SendGrid integration here
    }
}

class WelcomeEmailObserver implements Observer<UserRegisteredEvent> {
    async update(data: UserRegisteredEvent): Promise<void> {
        console.log(`📬 Sending welcome email to ${data.name}`);

        await this.sendWelcomeEmail(data.email, data.name);

        console.log(`✅ Welcome email sent to ${data.name}`);
    }

    private async sendWelcomeEmail(email: string, name: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 150));
        // Email template service integration
    }
}

class AnalyticsObserver implements Observer<UserRegisteredEvent> {
    async update(data: UserRegisteredEvent): Promise<void> {
        console.log(`📊 Recording user registration analytics`);

        await this.trackRegistration(data);

        console.log(`✅ Analytics recorded for user ${data.userId}`);
    }

    private async trackRegistration(data: UserRegisteredEvent): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 50));
        // Google Analytics, Mixpanel, Amplitude integration
    }
}

class InventoryObserver implements Observer<OrderPlacedEvent> {
    async update(data: OrderPlacedEvent): Promise<void> {
        console.log(`📦 Updating inventory for order ${data.orderId}`);

        for (const item of data.items) {
            await this.decrementStock(item.productId, item.quantity);
        }

        console.log(`✅ Inventory updated for ${data.items.length} items`);
    }

    private async decrementStock(productId: string, quantity: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 30));
        // Database update to reduce stock
        console.log(`  - Product ${productId}: -${quantity} units`);
    }
}

class PaymentProcessingObserver implements Observer<OrderPlacedEvent> {
    async update(data: OrderPlacedEvent): Promise<void> {
        console.log(`💳 Processing payment for order ${data.orderId}`);

        await this.processPayment(data.orderId, data.totalAmount);

        console.log(`✅ Payment processed: $${data.totalAmount}`);
    }

    private async processPayment(orderId: string, amount: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 200));
        // Stripe, PayPal integration
    }
}

// Business services that emit events
class UserService {
    private userRegisteredEmitter = new EventEmitter<UserRegisteredEvent>();

    constructor() {
        // Setup observers during initialization
        this.setupObservers();
    }

    private setupObservers(): void {
        this.userRegisteredEmitter.subscribe(new EmailVerificationObserver());
        this.userRegisteredEmitter.subscribe(new WelcomeEmailObserver());
        this.userRegisteredEmitter.subscribe(new AnalyticsObserver());
    }

    async registerUser(email: string, name: string): Promise<string> {
        // Core business logic
        const userId = crypto.randomUUID();

        console.log(`👤 Creating user: ${name} (${email})`);

        // Save to database
        await this.saveUserToDatabase(userId, email, name);

        // Emit event - triggers all observers
        await this.userRegisteredEmitter.notify({
            userId,
            email,
            name,
            timestamp: new Date()
        });

        return userId;
    }

    private async saveUserToDatabase(userId: string, email: string, name: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 100));
        // Database insert
    }
}

class OrderService {
    private orderPlacedEmitter = new EventEmitter<OrderPlacedEvent>();

    constructor() {
        this.setupObservers();
    }

    private setupObservers(): void {
        this.orderPlacedEmitter.subscribe(new InventoryObserver());
        this.orderPlacedEmitter.subscribe(new PaymentProcessingObserver());
    }

    async placeOrder(
        userId: string,
        items: Array<{ productId: string; quantity: number; price: number }>
    ): Promise<string> {
        // Core business logic
        const orderId = crypto.randomUUID();
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        console.log(`🛒 Creating order: ${orderId} for user ${userId}`);

        // Save to database
        await this.saveOrderToDatabase(orderId, userId, items, totalAmount);

        // Emit event - triggers all observers
        await this.orderPlacedEmitter.notify({
            orderId,
            userId,
            items,
            totalAmount,
            timestamp: new Date()
        });

        return orderId;
    }

    private async saveOrderToDatabase(
        orderId: string,
        userId: string,
        items: any[],
        totalAmount: number
    ): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 150));
        // Database insert
    }
}

// Advanced: Event aggregator for cross-service communication
class EventAggregator {
    private static instance: EventAggregator;
    private emitters: Map<string, EventEmitter<any>> = new Map();

    static getInstance(): EventAggregator {
        if (!EventAggregator.instance) {
            EventAggregator.instance = new EventAggregator();
        }
        return EventAggregator.instance;
    }

    getEmitter<T>(eventType: string): EventEmitter<T> {
        if (!this.emitters.has(eventType)) {
            this.emitters.set(eventType, new EventEmitter<T>());
        }
        return this.emitters.get(eventType)!;
    }

    subscribe<T>(eventType: string, observer: Observer<T>): void {
        const emitter = this.getEmitter<T>(eventType);
        emitter.subscribe(observer);
    }

    emit<T>(eventType: string, data: T): Promise<void> {
        const emitter = this.getEmitter<T>(eventType);
        return emitter.notify(data);
    }
}

// Cross-service observer example
class NotificationObserver implements Observer<UserRegisteredEvent | OrderPlacedEvent> {
    async update(data: UserRegisteredEvent | OrderPlacedEvent): Promise<void> {
        if ('email' in data) {
            // Handle user registration
            console.log(`🔔 New user notification: ${data.email}`);
        } else {
            // Handle order placement
            console.log(`🔔 New order notification: ${data.orderId}`);
        }
    }
}

// Usage example
async function demonstrateObserverPattern(): Promise<void> {
    console.log('=== User Registration Demo ===');
    const userService = new UserService();
    await userService.registerUser('john@example.com', 'John Doe');

    console.log('\n=== Order Placement Demo ===');
    const orderService = new OrderService();
    await orderService.placeOrder('user123', [
        { productId: 'prod1', quantity: 2, price: 29.99 },
        { productId: 'prod2', quantity: 1, price: 15.50 }
    ]);

    console.log('\n=== Cross-Service Events Demo ===');
    const eventAggregator = EventAggregator.getInstance();
    const notificationObserver = new NotificationObserver();

    // Subscribe to multiple event types
    eventAggregator.subscribe('user.registered', notificationObserver);
    eventAggregator.subscribe('order.placed', notificationObserver);

    // Emit events from anywhere
    await eventAggregator.emit('user.registered', {
        userId: 'user456',
        email: 'jane@example.com',
        name: 'Jane Smith',
        timestamp: new Date()
    });
}