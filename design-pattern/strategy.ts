// @ts-nocheck
/* eslint-disable */
// strategy/PaymentStrategy.ts

/**
 * STRATEGY PATTERN
 *
 * WHY: Encapsulates algorithms and makes them interchangeable at runtime.
 * WHEN: Multiple ways to perform same operation, algorithm selection dynamic.
 *
 * REAL SCENARIO:
 * - Payment processing (Stripe, PayPal, Bank transfer)
 * - File compression (ZIP, GZIP, BROTLI)
 * - Sorting algorithms (QuickSort, MergeSort, HeapSort)
 * - Pricing strategies (Regular, Premium, Discount)
 */

// Strategy interface - defines algorithm contract
interface PaymentStrategy {
    processPayment(amount: number, paymentData: any): Promise<PaymentResult>;
    validatePaymentData(data: any): boolean;
    getProcessingFee(amount: number): number;
}

interface PaymentResult {
    success: boolean;
    transactionId?: string;
    error?: string;
    processingFee: number;
}

// Concrete strategies - different payment methods
class StripeStrategy implements PaymentStrategy {
    async processPayment(amount: number, paymentData: any): Promise<PaymentResult> {
        console.log(`Processing $${amount} via Stripe...`);

        // Stripe-specific logic
        if (!paymentData.cardToken) {
            return {
                success: false,
                error: 'Invalid card token',
                processingFee: 0
            };
        }

        // Mock Stripe API call
        const fee = this.getProcessingFee(amount);

        return {
            success: true,
            transactionId: `stripe_${Date.now()}`,
            processingFee: fee
        };
    }

    validatePaymentData(data: any): boolean {
        return !!(data.cardToken && data.cvv && data.expiryDate);
    }

    getProcessingFee(amount: number): number {
        return amount * 0.029 + 0.30; // Stripe's typical fee structure
    }
}

class PayPalStrategy implements PaymentStrategy {
    async processPayment(amount: number, paymentData: any): Promise<PaymentResult> {
        console.log(`Processing $${amount} via PayPal...`);

        // PayPal-specific logic
        if (!paymentData.paypalEmail) {
            return {
                success: false,
                error: 'Invalid PayPal email',
                processingFee: 0
            };
        }

        // Mock PayPal API call
        const fee = this.getProcessingFee(amount);

        return {
            success: true,
            transactionId: `paypal_${Date.now()}`,
            processingFee: fee
        };
    }

    validatePaymentData(data: any): boolean {
        return !!(data.paypalEmail && data.paypalEmail.includes('@'));
    }

    getProcessingFee(amount: number): number {
        return amount * 0.034 + 0.49; // PayPal's fee structure
    }
}

class BankTransferStrategy implements PaymentStrategy {
    async processPayment(amount: number, paymentData: any): Promise<PaymentResult> {
        console.log(`Processing $${amount} via Bank Transfer...`);

        // Bank transfer specific logic
        if (!paymentData.iban || !paymentData.bic) {
            return {
                success: false,
                error: 'Invalid bank details',
                processingFee: 0
            };
        }

        // Mock bank API call
        const fee = this.getProcessingFee(amount);

        return {
            success: true,
            transactionId: `bank_${Date.now()}`,
            processingFee: fee
        };
    }

    validatePaymentData(data: any): boolean {
        return !!(data.iban && data.bic && data.accountHolder);
    }

    getProcessingFee(amount: number): number {
        return amount > 1000 ? 5.00 : 2.50; // Flat fee for bank transfers
    }
}

// Context class - uses strategies
class PaymentProcessor {
    private strategy: PaymentStrategy;

    constructor(strategy: PaymentStrategy) {
        this.strategy = strategy;
    }

    // Runtime strategy switching
    setStrategy(strategy: PaymentStrategy): void {
        this.strategy = strategy;
    }

    async processPayment(amount: number, paymentData: any): Promise<PaymentResult> {
        // Validate using current strategy
        if (!this.strategy.validatePaymentData(paymentData)) {
            return {
                success: false,
                error: 'Invalid payment data for selected method',
                processingFee: 0
            };
        }

        // Process using current strategy
        return await this.strategy.processPayment(amount, paymentData);
    }

    calculateTotalCost(amount: number): number {
        const fee = this.strategy.getProcessingFee(amount);
        return amount + fee;
    }
}

// Factory for strategy selection
class PaymentStrategyFactory {
    static create(paymentMethod: string): PaymentStrategy {
        switch (paymentMethod.toLowerCase()) {
            case 'stripe':
            case 'card':
                return new StripeStrategy();
            case 'paypal':
                return new PayPalStrategy();
            case 'bank':
            case 'transfer':
                return new BankTransferStrategy();
            default:
                throw new Error(`Unsupported payment method: ${paymentMethod}`);
        }
    }

    // Smart selection based on criteria
    static selectOptimalStrategy(amount: number, region: string): PaymentStrategy {
        // Business logic for optimal payment method selection
        if (region === 'EU' && amount > 500) {
            return new BankTransferStrategy(); // Lower fees for large EU transactions
        }

        if (amount < 50) {
            return new StripeStrategy(); // Better for small amounts
        }

        return new PayPalStrategy(); // Default choice
    }
}

// Usage - dynamic strategy selection
class OrderService {
    async processOrder(
        amount: number,
        paymentMethod: string,
        paymentData: any,
        userRegion: string = 'US'
    ): Promise<PaymentResult> {

        // Option 1: User-selected strategy
        let strategy = PaymentStrategyFactory.create(paymentMethod);

        // Option 2: System-optimized strategy (override user choice if beneficial)
        const optimalStrategy = PaymentStrategyFactory.selectOptimalStrategy(amount, userRegion);
        const userCost = strategy.getProcessingFee(amount);
        const optimalCost = optimalStrategy.getProcessingFee(amount);

        if (optimalCost < userCost * 0.8) { // 20% savings threshold
            console.log(`Switching to optimal payment method for better rates`);
            strategy = optimalStrategy;
        }

        // Process payment with selected strategy
        const processor = new PaymentProcessor(strategy);
        return await processor.processPayment(amount, paymentData);
    }
}

// Example usage
async function demonstratePaymentProcessing(): Promise<void> {
    const orderService = new OrderService();

    // Different payment methods with different data requirements
    const stripePayment = await orderService.processOrder(
        100,
        'stripe',
        { cardToken: 'tok_123', cvv: '123', expiryDate: '12/25' }
    );

    const paypalPayment = await orderService.processOrder(
        200,
        'paypal',
        { paypalEmail: 'user@example.com' }
    );

    const bankPayment = await orderService.processOrder(
        1500,
        'bank',
        { iban: 'GB123456789', bic: 'ABCDGB2L', accountHolder: 'John Doe' },
        'EU'
    );

    console.log('Payment results:', { stripePayment, paypalPayment, bankPayment });
}



// 🧠 STRATEGY – Comportamento intercambiabile a runtime in base al contesto

//Es1. Login multi-provider
interface AuthStrategy {
    login(credentials: any): Promise<User>;
}

class GoogleAuth implements AuthStrategy { /* ... */ }
class GitHubAuth implements AuthStrategy { /* ... */ }

const strategies = {
    google: new GoogleAuth(),
    github: new GitHubAuth(),
};
const auth = strategies[provider];
const user = await auth.login(credentials);


//Es2. Sorting dinamico
const sortStrategies = {
    newest: (posts) => posts.sort((a, b) => b.date - a.date),
    popular: (posts) => posts.sort((a, b) => b.likes - a.likes),
};
const sorted = sortStrategies[sortKey](posts);
