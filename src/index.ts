// Client-side exports
export { DonationButton } from './components/DonationButton';
export { DonationWidget } from './components/DonationWidget';
export { useDonation } from './hooks/use-donation';
export { useDonationStats } from './hooks/use-donation-stats';

// Types
export type {
    CheckoutSessionData, DonationButtonProps, DonationConfig, DonationStats, DonationWidgetProps, SubscriptionSummary
} from './types';

// Server-side exports (for API routes)
export { DonationStripeManager, createCheckoutSession, handleDonationWebhook } from './server/stripe';

// Configuration utilities
export { formatCurrency, generateProductIds, validateDonationConfig } from './config';

