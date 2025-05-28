"use client";

import { useCallback, useState } from 'react';
import { getDefaultMinAmount, getDefaultUrls, validateDonationConfig } from '../config';
import type { CheckoutSessionData, DonationConfig } from '../types';

interface UseDonationReturn {
  createCheckoutSession: (type: 'monthly' | 'annual', amount?: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useDonation(config: DonationConfig): UseDonationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate config on hook initialization
  const validatedConfig = validateDonationConfig(config);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createCheckoutSession = useCallback(async (
    type: 'monthly' | 'annual',
    customAmount?: number
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine the amount to use
      const configAmount = type === 'monthly' 
        ? validatedConfig.monthly.suggested 
        : validatedConfig.annual.suggested;
      
      const amount = customAmount || configAmount;

      // Validate amount against config limits
      const limits = type === 'monthly' ? validatedConfig.monthly : validatedConfig.annual;
      const minAmount = limits.min ?? getDefaultMinAmount(limits.suggested);
      
      if (amount < minAmount) {
        throw new Error(`Amount must be at least ${minAmount}`);
      }
      if (limits.max && amount > limits.max) {
        throw new Error(`Amount must not exceed ${limits.max}`);
      }

      // Get default URLs if not provided
      const { successUrl, cancelUrl } = getDefaultUrls();

      const sessionData: CheckoutSessionData = {
        type,
        amount,
        projectSlug: validatedConfig.projectSlug,
        projectName: validatedConfig.projectName,
        successUrl: validatedConfig.successUrl || successUrl,
        cancelUrl: validatedConfig.cancelUrl || cancelUrl,
      };

      // Call the API to create checkout session
      const response = await fetch('/api/donation/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Donation checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [validatedConfig]);

  return {
    createCheckoutSession,
    isLoading,
    error,
    clearError,
  };
} 