"use client";

import { useEffect, useState } from 'react';
import type { DonationConfig, SubscriptionSummary } from '../types';

interface UseDonationStatsReturn {
  stats: SubscriptionSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDonationStats(config: DonationConfig): UseDonationStatsReturn {
  const [stats, setStats] = useState<SubscriptionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/donation/stats?projectSlug=${config.projectSlug}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch donation stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(errorMessage);
      console.error('Donation stats error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we want to calculate from subscriptions
    if (config.goal?.calculateFromSubscriptions) {
      fetchStats();
    }
  }, [config.projectSlug, config.goal?.calculateFromSubscriptions]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
} 