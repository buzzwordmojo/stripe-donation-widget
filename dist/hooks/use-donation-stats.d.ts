import type { DonationConfig, SubscriptionSummary } from '../types';
interface UseDonationStatsReturn {
    stats: SubscriptionSummary | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}
export declare function useDonationStats(config: DonationConfig): UseDonationStatsReturn;
export {};
//# sourceMappingURL=use-donation-stats.d.ts.map