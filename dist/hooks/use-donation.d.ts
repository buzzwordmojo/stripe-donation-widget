import type { DonationConfig } from '../types';
interface UseDonationReturn {
    createCheckoutSession: (type: 'monthly' | 'annual', amount?: number) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}
export declare function useDonation(config: DonationConfig): UseDonationReturn;
export {};
//# sourceMappingURL=use-donation.d.ts.map