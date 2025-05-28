import { z } from 'zod';
import type { DonationConfig } from './types';

export const donationConfigSchema = z.object({
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

export function validateDonationConfig(config: unknown): DonationConfig {
  return donationConfigSchema.parse(config);
}

export function generateProductIds(projectSlug: string) {
  return {
    monthly: `${projectSlug}-monthly-donation`,
    annual: `${projectSlug}-annual-donation`,
  };
}

export function formatCurrency(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

export function getDefaultUrls(baseUrl?: string) {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return {
    successUrl: `${base}/donation/success`,
    cancelUrl: `${base}/donation/cancel`,
  };
}

export function getDefaultMinAmount(suggestedAmount: number): number {
  // Default minimum is 50% of suggested amount, with a floor of $1
  return Math.max(1, Math.round(suggestedAmount * 0.5));
} 