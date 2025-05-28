export interface DonationConfig {
    stripePublishableKey: string;
    projectName: string;
    projectSlug: string;
    monthly: {
        suggested: number;
        min?: number;
        max?: number;
    };
    annual: {
        suggested: number;
        min?: number;
        max?: number;
    };
    goal?: {
        target: number;
        current?: number;
        showProgress?: boolean;
        description?: string;
        calculateFromSubscriptions?: boolean;
    };
    theme?: 'light' | 'dark' | 'auto';
    customAmounts?: boolean;
    successUrl?: string;
    cancelUrl?: string;
    currency?: string;
}
export interface DonationButtonProps {
    config: DonationConfig;
    type: 'monthly' | 'annual';
    amount?: number;
    className?: string;
    children?: React.ReactNode;
    onSuccess?: (sessionId: string) => void;
    onError?: (error: Error) => void;
}
export interface DonationModalProps {
    config: DonationConfig;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (sessionId: string) => void;
    onError?: (error: Error) => void;
}
export interface DonationWidgetProps {
    config: DonationConfig;
    showProgress?: boolean;
    goal?: number;
    current?: number;
    className?: string;
    onSuccess?: (sessionId: string) => void;
    onError?: (error: Error) => void;
}
export interface CheckoutSessionData {
    type: 'monthly' | 'annual';
    amount: number;
    projectSlug: string;
    projectName: string;
    successUrl?: string;
    cancelUrl?: string;
}
export interface DonationStats {
    totalRevenue: number;
    monthlySubscribers: number;
    annualSubscribers: number;
    monthlyRecurringRevenue: number;
    isLoading: boolean;
    error?: string;
}
export interface SubscriptionSummary {
    monthlyRevenue: number;
    annualRevenue: number;
    monthlyEquivalent: number;
    totalMRR: number;
    monthlyCount: number;
    annualCount: number;
}
export interface WebhookHandlerOptions {
    stripeSecretKey: string;
    webhookSecret: string;
    onSubscriptionCreated?: (subscription: any) => void | Promise<void>;
    onSubscriptionUpdated?: (subscription: any) => void | Promise<void>;
    onSubscriptionDeleted?: (subscription: any) => void | Promise<void>;
    onPaymentSucceeded?: (paymentIntent: any) => void | Promise<void>;
}
//# sourceMappingURL=types.d.ts.map