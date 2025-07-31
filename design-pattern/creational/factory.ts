// @ts-nocheck
/* eslint-disable */
// factory/NotificationFactory.ts

/**
 * FACTORY PATTERN
 * Un oggetto (o funzione) che decide quale classe o oggetto istanziare in base a parametri.
 * Il successivo utilizzo dell'oggetto istanziato è gestito dalla classe factory e nasconderà il cosa di diverso farà.
 * WHY: Creates objects without exposing instantiation logic.
 * WHEN: Multiple implementations of same interface, selection logic complex.
 *
 * REAL SCENARIO:
 * - Send notifications via Email/SMS/Push based on user preferences
 * - Payment processing via Stripe/PayPal/Bank based on region
 * - Different database connections based on environment
 */

interface Notification {
    send(message: string, recipient: string): Promise<void>;
}

// Concrete implementations
class EmailNotification implements Notification {
    async send(message: string, recipient: string): Promise<void> {
        console.log(`📧 Email to ${recipient}: ${message}`);
        // AWS SES, SendGrid, etc.
        await this.sendEmail(recipient, message);
    }

    private async sendEmail(to: string, content: string): Promise<void> {
        // Email service integration
    }
}

class SMSNotification implements Notification {
    async send(message: string, recipient: string): Promise<void> {
        console.log(`📱 SMS to ${recipient}: ${message}`);
        // Twilio, AWS SNS, etc.
        await this.sendSMS(recipient, message);
    }

    private async sendSMS(phone: string, content: string): Promise<void> {
        // SMS service integration
    }
}

class PushNotification implements Notification {
    async send(message: string, recipient: string): Promise<void> {
        console.log(`🔔 Push to ${recipient}: ${message}`);
        // Firebase, OneSignal, etc.
        await this.sendPush(recipient, message);
    }

    private async sendPush(deviceId: string, content: string): Promise<void> {
        // Push service integration
    }
}

// Factory - encapsulates creation logic
class NotificationFactory {
    static create(type: 'email' | 'sms' | 'push'): Notification {
        switch (type) {
            case 'email':
                return new EmailNotification();
            case 'sms':
                return new SMSNotification();
            case 'push':
                return new PushNotification();
            default:
                throw new Error(`Unsupported notification type: ${type}`);
        }
    }

    // Advanced factory - based on user preferences
    static createForUser(userPreferences: UserPrefs): Notification[] {
        const notifications: Notification[] = [];

        if (userPreferences.emailEnabled) {
            notifications.push(this.create('email'));
        }

        if (userPreferences.smsEnabled && userPreferences.phoneNumber) {
            notifications.push(this.create('sms'));
        }

        if (userPreferences.pushEnabled && userPreferences.deviceId) {
            notifications.push(this.create('push'));
        }

        return notifications;
    }
}

interface UserPrefs {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    phoneNumber?: string;
    deviceId?: string;
}

// Usage - business logic doesn't know about concrete classes
class NotificationService {
    async sendAlert(message: string, userId: string): Promise<void> {
        const user = await this.getUserPreferences(userId);
        const notifications = NotificationFactory.createForUser(user);

        // Send via all enabled channels
        const promises = notifications.map(notification =>
            notification.send(message, this.getRecipientId(user, notification))
        );

        await Promise.all(promises);
    }

    private async getUserPreferences(userId: string): Promise<UserPrefs> {
        // Fetch from database
        return {
            emailEnabled: true,
            smsEnabled: false,
            pushEnabled: true,
            deviceId: 'device123'
        };
    }

    private getRecipientId(user: UserPrefs, notification: Notification): string {
        // Return appropriate identifier based on notification type
        if (notification instanceof EmailNotification) return 'user@example.com';
        if (notification instanceof SMSNotification) return user.phoneNumber || '';
        if (notification instanceof PushNotification) return user.deviceId || '';
        return '';
    }
}

// Clean usage - no complex instantiation logic in business code
const notificationService = new NotificationService();
await notificationService.sendAlert('Payment processed!', 'user123');