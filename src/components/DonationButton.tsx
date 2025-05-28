"use client";

import { Heart, Loader2 } from 'lucide-react';
import { formatCurrency } from '../config';
import { useDonation } from '../hooks/use-donation';
import { cn } from '../lib/utils';
import type { DonationButtonProps } from '../types';
import { Button } from '../ui/button';

export function DonationButton({
  config,
  type,
  amount,
  className,
  children,
  onSuccess,
  onError,
}: DonationButtonProps) {
  const { createCheckoutSession, isLoading, error } = useDonation(config);

  // Use provided amount or fall back to suggested amount
  const effectiveAmount = amount || (type === 'monthly' ? config.monthly.suggested : config.annual.suggested);

  const handleClick = async () => {
    try {
      await createCheckoutSession(type, effectiveAmount);
      onSuccess?.('checkout-initiated');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      onError?.(error);
    }
  };

  const formattedAmount = formatCurrency(effectiveAmount, config.currency);
  const frequency = type === 'monthly' ? '/month' : '/year';

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          "hover:scale-105 active:scale-95",
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Heart className="mr-2 h-4 w-4" />
            {children || (
              <>
                Support with {formattedAmount}
                <span className="text-sm opacity-80 ml-1">{frequency}</span>
              </>
            )}
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}
    </div>
  );
} 