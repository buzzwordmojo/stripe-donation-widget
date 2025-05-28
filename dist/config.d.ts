import { z } from 'zod';
import type { DonationConfig } from './types';
export declare const donationConfigSchema: z.ZodObject<{
    stripePublishableKey: z.ZodString;
    projectName: z.ZodString;
    projectSlug: z.ZodString;
    monthly: z.ZodEffects<z.ZodObject<{
        suggested: z.ZodNumber;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    }>, {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    }>;
    annual: z.ZodEffects<z.ZodObject<{
        suggested: z.ZodNumber;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    }>, {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    }>;
    goal: z.ZodOptional<z.ZodObject<{
        target: z.ZodNumber;
        current: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        showProgress: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        description: z.ZodOptional<z.ZodString>;
        calculateFromSubscriptions: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        target: number;
        current: number;
        showProgress: boolean;
        calculateFromSubscriptions: boolean;
        description?: string | undefined;
    }, {
        target: number;
        current?: number | undefined;
        showProgress?: boolean | undefined;
        description?: string | undefined;
        calculateFromSubscriptions?: boolean | undefined;
    }>>;
    theme: z.ZodDefault<z.ZodOptional<z.ZodEnum<["light", "dark", "auto"]>>>;
    customAmounts: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    successUrl: z.ZodOptional<z.ZodString>;
    cancelUrl: z.ZodOptional<z.ZodString>;
    currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    monthly: {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    };
    annual: {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    };
    stripePublishableKey: string;
    projectName: string;
    projectSlug: string;
    theme: "light" | "dark" | "auto";
    customAmounts: boolean;
    currency: string;
    goal?: {
        target: number;
        current: number;
        showProgress: boolean;
        calculateFromSubscriptions: boolean;
        description?: string | undefined;
    } | undefined;
    successUrl?: string | undefined;
    cancelUrl?: string | undefined;
}, {
    monthly: {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    };
    annual: {
        suggested: number;
        min?: number | undefined;
        max?: number | undefined;
    };
    stripePublishableKey: string;
    projectName: string;
    projectSlug: string;
    goal?: {
        target: number;
        current?: number | undefined;
        showProgress?: boolean | undefined;
        description?: string | undefined;
        calculateFromSubscriptions?: boolean | undefined;
    } | undefined;
    theme?: "light" | "dark" | "auto" | undefined;
    customAmounts?: boolean | undefined;
    successUrl?: string | undefined;
    cancelUrl?: string | undefined;
    currency?: string | undefined;
}>;
export declare function validateDonationConfig(config: unknown): DonationConfig;
export declare function generateProductIds(projectSlug: string): {
    monthly: string;
    annual: string;
};
export declare function formatCurrency(amount: number, currency?: string): string;
export declare function getDefaultUrls(baseUrl?: string): {
    successUrl: string;
    cancelUrl: string;
};
export declare function getDefaultMinAmount(suggestedAmount: number): number;
//# sourceMappingURL=config.d.ts.map