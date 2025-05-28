import Stripe from 'stripe';
import { z } from 'zod';

z.object({
    stripePublishableKey: z.string().min(1, 'Stripe publishable key is required'),
    projectName: z.string().min(1, 'Project name is required'),
    projectSlug: z.string()
        .min(1, 'Project slug is required')
        .regex(/^[a-z0-9-]+$/, 'Project slug must contain only lowercase letters, numbers, and hyphens'),
    monthly: z.object({
        suggested: z.number().positive('Monthly suggested amount must be positive'),
        min: z.number().min(0, 'Monthly minimum amount must be non-negative').optional(),
        max: z.number().positive().optional(),
    }).refine(data => !data.max || !data.min || data.max >= data.min, {
        message: 'Monthly maximum must be greater than or equal to minimum',
    }),
    annual: z.object({
        suggested: z.number().positive('Annual suggested amount must be positive'),
        min: z.number().min(0, 'Annual minimum amount must be non-negative').optional(),
        max: z.number().positive().optional(),
    }).refine(data => !data.max || !data.min || data.max >= data.min, {
        message: 'Annual maximum must be greater than or equal to minimum',
    }),
    goal: z.object({
        target: z.number().positive('Goal target must be positive'),
        current: z.number().min(0, 'Goal current amount must be non-negative').optional().default(0),
        showProgress: z.boolean().optional().default(true),
        description: z.string().optional(),
        calculateFromSubscriptions: z.boolean().optional().default(false),
    }).optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional().default('auto'),
    customAmounts: z.boolean().optional().default(true),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
    currency: z.string().length(3).optional().default('usd'),
});
function generateProductIds(projectSlug) {
    return {
        monthly: `${projectSlug}-monthly-donation`,
        annual: `${projectSlug}-annual-donation`,
    };
}

class DonationStripeManager {
    constructor(secretKey) {
        this.stripe = new Stripe(secretKey, {
            apiVersion: '2023-10-16',
        });
    }
    /**
     * Ensure donation products exist in Stripe, create them if they don't
     */
    async ensureProductsExist(projectSlug, projectName) {
        const productIds = generateProductIds(projectSlug);
        // Check if products already exist
        const existingProducts = await this.stripe.products.list({
            ids: [productIds.monthly, productIds.annual],
        });
        const existingProductMap = new Map(existingProducts.data.map((product) => [product.id, product]));
        // Create monthly product if it doesn't exist
        let monthlyProduct = existingProductMap.get(productIds.monthly);
        if (!monthlyProduct) {
            monthlyProduct = await this.stripe.products.create({
                id: productIds.monthly,
                name: `${projectName} - Monthly Support`,
                description: `Monthly recurring donation to support ${projectName}`,
                type: 'service',
            });
        }
        // Create annual product if it doesn't exist
        let annualProduct = existingProductMap.get(productIds.annual);
        if (!annualProduct) {
            annualProduct = await this.stripe.products.create({
                id: productIds.annual,
                name: `${projectName} - Annual Support`,
                description: `Annual recurring donation to support ${projectName}`,
                type: 'service',
            });
        }
        // Get or create prices for the products
        const monthlyPriceId = await this.getOrCreatePrice(monthlyProduct.id, 'month');
        const annualPriceId = await this.getOrCreatePrice(annualProduct.id, 'year');
        return {
            monthlyPriceId,
            annualPriceId,
        };
    }
    /**
     * Get or create a price for a product
     */
    async getOrCreatePrice(productId, interval) {
        // Check if a price already exists for this product
        const existingPrices = await this.stripe.prices.list({
            product: productId,
            active: true,
        });
        const existingPrice = existingPrices.data.find((price) => price.recurring?.interval === interval);
        if (existingPrice) {
            return existingPrice.id;
        }
        // Create a new price (we'll use a placeholder amount that gets overridden in checkout)
        const price = await this.stripe.prices.create({
            product: productId,
            currency: 'usd',
            recurring: {
                interval,
            },
            unit_amount: 100, // $1.00 placeholder - actual amount set in checkout
        });
        return price.id;
    }
    /**
     * Create a checkout session for donations
     */
    async createCheckoutSession(sessionData) {
        // Create checkout session with dynamic pricing
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: sessionData.type === 'monthly'
                                ? `${sessionData.projectName} - Monthly Support`
                                : `${sessionData.projectName} - Annual Support`,
                            description: sessionData.type === 'monthly'
                                ? `Monthly recurring donation to support ${sessionData.projectName}`
                                : `Annual recurring donation to support ${sessionData.projectName}`,
                        },
                        unit_amount: Math.round(sessionData.amount * 100), // Convert to cents
                        recurring: {
                            interval: sessionData.type === 'monthly' ? 'month' : 'year',
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: sessionData.successUrl,
            cancel_url: sessionData.cancelUrl,
            metadata: {
                projectSlug: sessionData.projectSlug,
                donationType: sessionData.type,
                amount: sessionData.amount.toString(),
            },
        });
        if (!session.url) {
            throw new Error('Failed to create checkout session URL');
        }
        return {
            sessionId: session.id,
            url: session.url,
        };
    }
    /**
     * Handle Stripe webhooks
     */
    async handleWebhook(payload, signature, webhookSecret, options) {
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (err) {
            console.error('Webhook signature verification failed:', err);
            throw new Error('Invalid webhook signature');
        }
        // Handle the event
        switch (event.type) {
            case 'customer.subscription.created':
                if (options.onSubscriptionCreated) {
                    await options.onSubscriptionCreated(event.data.object);
                }
                break;
            case 'customer.subscription.updated':
                if (options.onSubscriptionUpdated) {
                    await options.onSubscriptionUpdated(event.data.object);
                }
                break;
            case 'customer.subscription.deleted':
                if (options.onSubscriptionDeleted) {
                    await options.onSubscriptionDeleted(event.data.object);
                }
                break;
            case 'payment_intent.succeeded':
                if (options.onPaymentSucceeded) {
                    await options.onPaymentSucceeded(event.data.object);
                }
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        return { received: true };
    }
    /**
     * Get subscription statistics for a project (legacy method)
     */
    async getSubscriptionStats(projectSlug) {
        const summary = await this.getSubscriptionSummary(projectSlug);
        return {
            monthlySubscribers: summary.monthlyCount,
            annualSubscribers: summary.annualCount,
            totalRevenue: summary.monthlyRevenue + summary.annualRevenue,
        };
    }
    /**
     * Get detailed subscription summary with MRR calculations
     */
    async getSubscriptionSummary(projectSlug) {
        // Get all active subscriptions
        const subscriptions = await this.stripe.subscriptions.list({
            status: 'active',
            limit: 100, // Adjust as needed for larger projects
        });
        let monthlyRevenue = 0;
        let annualRevenue = 0;
        let monthlyCount = 0;
        let annualCount = 0;
        // Process each subscription
        for (const subscription of subscriptions.data) {
            // Check if this subscription belongs to our project by looking at metadata
            const belongsToProject = subscription.metadata?.projectSlug === projectSlug;
            if (!belongsToProject) {
                // Also check by examining the subscription items for our project's products
                let foundProjectProduct = false;
                for (const item of subscription.items.data) {
                    const price = await this.stripe.prices.retrieve(item.price.id);
                    if (typeof price.product === 'string') {
                        const product = await this.stripe.products.retrieve(price.product);
                        const productIds = generateProductIds(projectSlug);
                        if (product.id === productIds.monthly || product.id === productIds.annual) {
                            foundProjectProduct = true;
                            break;
                        }
                    }
                }
                if (!foundProjectProduct)
                    continue;
            }
            // Calculate revenue from this subscription
            for (const item of subscription.items.data) {
                const price = await this.stripe.prices.retrieve(item.price.id);
                const amount = (price.unit_amount || 0) / 100; // Convert from cents
                const quantity = item.quantity || 1;
                const totalAmount = amount * quantity;
                if (price.recurring?.interval === 'month') {
                    monthlyRevenue += totalAmount;
                    monthlyCount++;
                }
                else if (price.recurring?.interval === 'year') {
                    annualRevenue += totalAmount;
                    annualCount++;
                }
            }
        }
        // Calculate monthly equivalent of annual subscriptions
        const monthlyEquivalent = annualRevenue / 12;
        const totalMRR = monthlyRevenue + monthlyEquivalent;
        return {
            monthlyRevenue,
            annualRevenue,
            monthlyEquivalent,
            totalMRR,
            monthlyCount,
            annualCount,
        };
    }
}
/**
 * Convenience function to create a checkout session
 */
async function createCheckoutSession(stripeSecretKey, sessionData) {
    const manager = new DonationStripeManager(stripeSecretKey);
    return manager.createCheckoutSession(sessionData);
}
/**
 * Convenience function to handle webhooks
 */
async function handleDonationWebhook(request, options) {
    try {
        const payload = await request.text();
        const signature = request.headers.get('stripe-signature');
        if (!signature) {
            return new Response('Missing stripe-signature header', { status: 400 });
        }
        const manager = new DonationStripeManager(options.stripeSecretKey);
        const result = await manager.handleWebhook(payload, signature, options.webhookSecret, options);
        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export { DonationStripeManager, createCheckoutSession, generateProductIds, handleDonationWebhook };
//# sourceMappingURL=server.esm.js.map
