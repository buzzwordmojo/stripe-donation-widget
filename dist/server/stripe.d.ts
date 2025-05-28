import type { CheckoutSessionData, SubscriptionSummary, WebhookHandlerOptions } from '../types';
export declare class DonationStripeManager {
    private stripe;
    constructor(secretKey: string);
    /**
     * Ensure donation products exist in Stripe, create them if they don't
     */
    ensureProductsExist(projectSlug: string, projectName: string): Promise<{
        monthlyPriceId: string;
        annualPriceId: string;
    }>;
    /**
     * Get or create a price for a product
     */
    private getOrCreatePrice;
    /**
     * Create a checkout session for donations
     */
    createCheckoutSession(sessionData: CheckoutSessionData): Promise<{
        sessionId: string;
        url: string;
    }>;
    /**
     * Handle Stripe webhooks
     */
    handleWebhook(payload: string | Buffer, signature: string, webhookSecret: string, options: Omit<WebhookHandlerOptions, 'stripeSecretKey' | 'webhookSecret'>): Promise<{
        received: boolean;
    }>;
    /**
     * Get subscription statistics for a project (legacy method)
     */
    getSubscriptionStats(projectSlug: string): Promise<{
        monthlySubscribers: number;
        annualSubscribers: number;
        totalRevenue: number;
    }>;
    /**
     * Get detailed subscription summary with MRR calculations
     */
    getSubscriptionSummary(projectSlug: string): Promise<SubscriptionSummary>;
}
/**
 * Convenience function to create a checkout session
 */
export declare function createCheckoutSession(stripeSecretKey: string, sessionData: CheckoutSessionData): Promise<{
    sessionId: string;
    url: string;
}>;
/**
 * Convenience function to handle webhooks
 */
export declare function handleDonationWebhook(request: Request, options: WebhookHandlerOptions): Promise<Response>;
//# sourceMappingURL=stripe.d.ts.map