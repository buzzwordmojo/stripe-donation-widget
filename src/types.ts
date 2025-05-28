export interface DonationConfig {
  stripePublishableKey: string;
  projectName: string;
  projectSlug: string; // Used for consistent Stripe product IDs
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
    target: number; // Monthly recurring revenue target
    current?: number; // Current monthly recurring revenue (calculated from subs)
    showProgress?: boolean;
    description?: string;
    calculateFromSubscriptions?: boolean; // Auto-calculate current from actual subscriptions
  };
  theme?: 'light' | 'dark' | 'auto';
  customAmounts?: boolean;
  successUrl?: string;
  cancelUrl?: string;
  currency?: string; // Default: 'usd'
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
  showProgress?: boolean; // Override config.goal.showProgress
  goal?: number; // Override config.goal.target
  current?: number; // Override config.goal.current
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
  monthlyRecurringRevenue: number; // MRR calculation
  isLoading: boolean;
  error?: string;
}

export interface SubscriptionSummary {
  monthlyRevenue: number; // Total from monthly subs
  annualRevenue: number;  // Total from annual subs
  monthlyEquivalent: number; // Annual revenue ÷ 12
  totalMRR: number; // monthlyRevenue + monthlyEquivalent
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