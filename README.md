# 🎯 Stripe Donation Widget for React/Next.js

A complete, reusable donation system with Stripe integration, real-time MRR tracking, and beautiful UI components.

## ✨ Features

- **🎨 Beautiful UI Components** - Pre-built donation widgets and buttons
- **💳 Stripe Integration** - Secure payment processing with automatic product creation
- **📊 Real-time MRR Tracking** - Live subscription analytics and goal progress
- **🔧 Configuration-driven** - Single config object controls all behavior
- **🎯 Multi-project Support** - Isolated configurations per project
- **📱 Responsive Design** - Works perfectly on all devices
- **⚡ TypeScript Support** - Full type safety and IntelliSense
- **🚀 Zero Setup** - Just add your Stripe keys and go

## 📦 Installation

```bash
npm install stripe-donation-widget
```

## 🚀 Quick Start

### 1. Install the Package

```bash
npm install stripe-donation-widget
```

### 2. Set Up Environment Variables

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Create API Routes

Create these API routes in your Next.js app:

**`app/api/donation/create-checkout-session/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { DonationStripeManager } from 'stripe-donation-widget/server';

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
    
    const manager = new DonationStripeManager(stripeSecretKey);
    const result = await manager.createCheckoutSession(sessionData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

**`app/api/donation/stats/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { DonationStripeManager } from 'stripe-donation-widget/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectSlug = searchParams.get('projectSlug');
    
    if (!projectSlug) {
      return NextResponse.json({ error: 'Project slug required' }, { status: 400 });
    }
    
    const manager = new DonationStripeManager(process.env.STRIPE_SECRET_KEY!);
    const stats = await manager.getSubscriptionSummary(projectSlug);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
```

### 4. Use the Components

```tsx
import { DonationWidget, DonationButton } from 'stripe-donation-widget';
import type { DonationConfig } from 'stripe-donation-widget';

const config: DonationConfig = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  projectName: "My Project",
  projectSlug: "my-project", // Creates unique Stripe products
  monthly: { suggested: 5.00 },
  annual: { suggested: 50.00 },
  goal: {
    target: 100,
    showProgress: true,
    description: "Help keep this project running",
    calculateFromSubscriptions: true // Uses real Stripe data
  }
};

export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Support Our Project</h1>
      
      {/* Full donation widget */}
      <DonationWidget config={config} />
      
      {/* Quick donation button */}
      <DonationButton 
        config={config} 
        type="monthly" 
        amount={10}
        className="mt-4"
      >
        Support for $10/month
      </DonationButton>
    </div>
  );
}
```

## Components

### DonationWidget

The main donation component with slider interface and goal tracking.

```tsx
<DonationWidget
  config={donationConfig}
  showProgress={true}
  goal={1000}           // Override config goal
  current={250}         // Override current amount
  className="max-w-md"
  onSuccess={(sessionId) => console.log('Success:', sessionId)}
  onError={(error) => console.error('Error:', error)}
/>
```

**Features:**
- Interactive slider for amount selection
- Preset amount buttons
- Monthly/Annual tabs
- Real-time goal progress
- Responsive design

### DonationButton

Simple button for quick donations.

```tsx
<DonationButton
  config={donationConfig}
  type="monthly"
  amount={25}
  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
>
  ❤️ Become a Supporter
</DonationButton>
```

## Configuration Options

### DonationConfig

```typescript
interface DonationConfig {
  // Required
  stripePublishableKey: string;
  projectName: string;
  projectSlug: string; // Used for Stripe product IDs
  
  // Amount settings
  monthly: {
    suggested: number;
    min?: number;      // Defaults to 50% of suggested, minimum $1
    max?: number;      // Defaults to 10x suggested
  };
  annual: {
    suggested: number;
    min?: number;
    max?: number;
  };
  
  // Goal tracking
  goal?: {
    target: number;                    // Monthly goal amount
    current?: number;                  // Static current amount
    showProgress?: boolean;            // Show progress bar
    description?: string;              // Goal description
    calculateFromSubscriptions?: boolean; // Use real Stripe data
  };
  
  // Customization
  theme?: 'light' | 'dark' | 'auto';
  customAmounts?: boolean;             // Allow custom amounts
  currency?: string;                   // Default: 'usd'
  successUrl?: string;                 // Post-checkout redirect
  cancelUrl?: string;                  // Checkout cancel redirect
}
```

## Real MRR Calculation

When `calculateFromSubscriptions: true`, the library automatically:

1. **Fetches active subscriptions** from Stripe
2. **Filters by project** using `projectSlug`
3. **Calculates MRR** as: Monthly Revenue + (Annual Revenue ÷ 12)
4. **Updates progress** in real-time

Example calculation:
- 5 monthly subscribers at $10/month = $50 MRR
- 2 annual subscribers at $100/year = $16.67 MRR ($200 ÷ 12)
- **Total MRR: $66.67**

## Stripe Integration

### Automatic Product Creation

The library automatically creates Stripe products using consistent IDs:
- Monthly: `{projectSlug}-monthly-donation`
- Annual: `{projectSlug}-annual-donation`

### Dynamic Pricing

Uses `price_data` for flexible amount selection without pre-creating prices.

### Subscription Tracking

Subscriptions are tagged with `projectSlug` metadata for accurate filtering.

## Multi-Project Usage

### Project A Configuration
```typescript
const projectAConfig: DonationConfig = {
  projectName: "Project Alpha",
  projectSlug: "project-alpha",
  monthly: { suggested: 5.00 },
  annual: { suggested: 50.00 },
  // ... other config
};
```

### Project B Configuration
```typescript
const projectBConfig: DonationConfig = {
  projectName: "Project Beta", 
  projectSlug: "project-beta",
  monthly: { suggested: 10.00 },
  annual: { suggested: 100.00 },
  // ... other config
};
```

Each project gets:
- ✅ Separate Stripe products
- ✅ Independent MRR tracking
- ✅ Isolated subscription data
- ✅ Custom branding and amounts

## Styling & Theming

### Custom Styling
```tsx
<DonationWidget 
  config={config}
  className="border-2 border-purple-500 rounded-xl shadow-lg"
/>

<DonationButton
  config={config}
  type="monthly"
  className="bg-gradient-to-r from-blue-500 to-green-500 hover:scale-105"
>
  🚀 Launch Support
</DonationButton>
```

### Theme Support
The library respects your app's theme system through CSS variables.

## Error Handling

```tsx
<DonationWidget
  config={config}
  onError={(error) => {
    // Log to your error tracking service
    console.error('Donation error:', error);
    
    // Show user-friendly message
    toast.error('Something went wrong. Please try again.');
  }}
  onSuccess={(sessionId) => {
    // Track successful checkout initiation
    analytics.track('donation_checkout_started', { sessionId });
  }}
/>
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { 
  DonationConfig,
  DonationWidgetProps,
  DonationButtonProps,
  SubscriptionSummary,
  CheckoutSessionData
} from '@/lib/donation';
```

## Best Practices

### 1. Configuration Management
```typescript
// config/donations.ts
export const getDonationConfig = (project: string): DonationConfig => {
  const baseConfig = {
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    currency: 'usd',
    customAmounts: true,
  };
  
  switch (project) {
    case 'project-a':
      return { ...baseConfig, projectName: 'Project A', projectSlug: 'project-a', /* ... */ };
    case 'project-b':
      return { ...baseConfig, projectName: 'Project B', projectSlug: 'project-b', /* ... */ };
    default:
      throw new Error(`Unknown project: ${project}`);
  }
};
```

### 2. Error Boundaries
```tsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<div>Donation widget unavailable</div>}>
  <DonationWidget config={config} />
</ErrorBoundary>
```

### 3. Loading States
```tsx
import { Suspense } from 'react';

<Suspense fallback={<DonationSkeleton />}>
  <DonationWidget config={config} />
</Suspense>
```

## Migration Guide

### From Static Goals to Real MRR

**Before:**
```typescript
goal: {
  target: 100,
  current: 25, // Static value
  showProgress: true
}
```

**After:**
```typescript
goal: {
  target: 100,
  showProgress: true,
  calculateFromSubscriptions: true // Uses real Stripe data
}
```

### From Text Inputs to Sliders

The new slider interface is automatically enabled. To revert to text inputs, you would need to modify the component (not recommended).

## Troubleshooting

### Common Issues

**1. "Event handlers cannot be passed to Client Component props"**
- Remove `onSuccess` and `onError` from server components
- Move to client components if needed

**2. "Stripe product not found"**
- Ensure `projectSlug` is consistent
- Check Stripe dashboard for auto-created products

**3. "MRR calculation shows 0"**
- Verify `calculateFromSubscriptions: true`
- Check that subscriptions have correct metadata
- Ensure API route is accessible

**4. "Slider not working on mobile"**
- Ensure `@radix-ui/react-slider` is installed
- Check for CSS conflicts

### Debug Mode

```typescript
const config: DonationConfig = {
  // ... your config
  debug: true // Enable console logging (if implemented)
};
```

## License

MIT License - feel free to use in your projects!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

---

**Ready to accept donations in minutes!** 🚀 