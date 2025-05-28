# Donation Library Examples

This file contains practical examples of how to use the donation library in different scenarios.

## Basic Setup

### 1. Simple Support Page

```tsx
// pages/support.tsx
import { DonationWidget } from '@yourname/donation-widget';
import type { DonationConfig } from '@yourname/donation-widget';

const config: DonationConfig = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  projectName: "My Awesome App",
  projectSlug: "my-awesome-app",
  monthly: { suggested: 5.00 },
  annual: { suggested: 50.00 },
  goal: {
    target: 1000,
    showProgress: true,
    description: "Help us reach our monthly goal!",
    calculateFromSubscriptions: true
  }
};

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Support Our Project</h1>
      <div className="max-w-md mx-auto">
        <DonationWidget config={config} />
      </div>
    </div>
  );
}
```

### 2. Multiple Donation Options

```tsx
// components/DonationSection.tsx
import { DonationWidget, DonationButton } from '@yourname/donation-widget';

export function DonationSection({ config }) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Main Widget */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Choose Your Support Level</h2>
        <DonationWidget config={config} />
      </div>
      
      {/* Quick Options */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Quick Support</h2>
        
        <DonationButton
          config={config}
          type="monthly"
          amount={5}
          className="w-full"
        >
          ☕ Buy me a coffee ($5/month)
        </DonationButton>
        
        <DonationButton
          config={config}
          type="monthly"
          amount={25}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
        >
          🚀 Power User ($25/month)
        </DonationButton>
        
        <DonationButton
          config={config}
          type="annual"
          amount={500}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500"
        >
          ⭐ Sponsor ($500/year)
        </DonationButton>
      </div>
    </div>
  );
}
```

## Multi-Project Configurations

### 3. Project Configuration Manager

```tsx
// config/donations.ts
import type { DonationConfig } from '@yourname/donation-widget';

interface ProjectConfig {
  name: string;
  slug: string;
  monthly: number;
  annual: number;
  goal: number;
  description: string;
}

const projects: Record<string, ProjectConfig> = {
  'project-alpha': {
    name: 'Project Alpha',
    slug: 'project-alpha',
    monthly: 5.00,
    annual: 50.00,
    goal: 500,
    description: 'Help us build the future of Alpha!'
  },
  'project-beta': {
    name: 'Project Beta',
    slug: 'project-beta', 
    monthly: 10.00,
    annual: 100.00,
    goal: 1000,
    description: 'Support Beta development and hosting'
  },
  'project-gamma': {
    name: 'Project Gamma',
    slug: 'project-gamma',
    monthly: 15.00,
    annual: 150.00,
    goal: 2000,
    description: 'Keep Gamma free and open source'
  }
};

export function getDonationConfig(projectId: string): DonationConfig {
  const project = projects[projectId];
  if (!project) {
    throw new Error(`Unknown project: ${projectId}`);
  }

  return {
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    projectName: project.name,
    projectSlug: project.slug,
    monthly: {
      suggested: project.monthly,
      min: Math.max(1, project.monthly * 0.5),
      max: project.monthly * 10
    },
    annual: {
      suggested: project.annual,
      min: Math.max(10, project.annual * 0.5),
      max: project.annual * 10
    },
    goal: {
      target: project.goal,
      showProgress: true,
      description: project.description,
      calculateFromSubscriptions: true
    },
    currency: 'usd',
    customAmounts: true,
    theme: 'auto'
  };
}

// Usage in components
export function ProjectSupportPage({ projectId }: { projectId: string }) {
  const config = getDonationConfig(projectId);
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Support {config.projectName}</h1>
      <p className="text-gray-600 mb-8">{config.goal?.description}</p>
      <DonationWidget config={config} />
    </div>
  );
}
```

## Advanced Usage

### 4. Custom Event Handling

```tsx
// components/AdvancedDonationWidget.tsx
import { DonationWidget } from '@yourname/donation-widget';
import { toast } from 'sonner';
import { analytics } from '@/lib/analytics';

export function AdvancedDonationWidget({ config }) {
  const handleSuccess = (sessionId: string) => {
    // Track successful checkout initiation
    analytics.track('donation_checkout_started', {
      sessionId,
      projectSlug: config.projectSlug,
      timestamp: new Date().toISOString()
    });
    
    // Show success message
    toast.success('Redirecting to secure checkout...');
    
    // Optional: Store in local storage for post-checkout tracking
    localStorage.setItem('pending_donation', JSON.stringify({
      sessionId,
      projectSlug: config.projectSlug,
      startedAt: Date.now()
    }));
  };

  const handleError = (error: Error) => {
    // Log error to monitoring service
    console.error('Donation error:', error);
    
    // Track error
    analytics.track('donation_error', {
      error: error.message,
      projectSlug: config.projectSlug
    });
    
    // Show user-friendly error
    toast.error('Something went wrong. Please try again or contact support.');
  };

  return (
    <DonationWidget
      config={config}
      onSuccess={handleSuccess}
      onError={handleError}
      className="border border-gray-200 rounded-lg shadow-sm"
    />
  );
}
```

### 5. Goal Override with Real-time Updates

```tsx
// components/DynamicGoalWidget.tsx
import { useState, useEffect } from 'react';
import { DonationWidget } from '@yourname/donation-widget';

interface GoalData {
  target: number;
  current: number;
  description: string;
}

export function DynamicGoalWidget({ config, goalEndpoint }) {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoalData = async () => {
      try {
        const response = await fetch(goalEndpoint);
        const data = await response.json();
        setGoalData(data);
      } catch (error) {
        console.error('Failed to fetch goal data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoalData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchGoalData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [goalEndpoint]);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />;
  }

  return (
    <DonationWidget
      config={config}
      goal={goalData?.target}
      current={goalData?.current}
      showProgress={true}
    />
  );
}
```

### 6. Themed Donation Components

```tsx
// components/ThemedDonations.tsx
import { DonationWidget, DonationButton } from '@yourname/donation-widget';

// Dark theme variant
export function DarkDonationWidget({ config }) {
  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <DonationWidget
        config={{ ...config, theme: 'dark' }}
        className="bg-gray-800 border-gray-700"
      />
    </div>
  );
}

// Branded variant
export function BrandedDonationWidget({ config }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Support Our Mission
      </h2>
      <DonationWidget
        config={config}
        className="border-2 border-blue-200 shadow-lg"
      />
    </div>
  );
}

// Minimal variant
export function MinimalDonationButtons({ config }) {
  return (
    <div className="flex gap-2">
      <DonationButton
        config={config}
        type="monthly"
        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        Monthly
      </DonationButton>
      <DonationButton
        config={config}
        type="annual"
        className="bg-blue-600 text-white hover:bg-blue-700"
      >
        Annual
      </DonationButton>
    </div>
  );
}
```

## Integration Examples

### 7. Next.js App Router Integration

```tsx
// app/support/page.tsx
import { DonationWidget } from '@yourname/donation-widget';
import { getDonationConfig } from '@/config/donations';

export default function SupportPage() {
  const config = getDonationConfig('my-project');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Support Our Work</h1>
          <p className="text-xl text-gray-600">
            Your support helps us keep building amazing tools for everyone.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Why Support Us?</h2>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                Keep our services free for everyone
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                Fund new features and improvements
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                Support ongoing maintenance and hosting
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                Enable faster development cycles
              </li>
            </ul>
          </div>
          
          <div>
            <DonationWidget config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 8. Error Boundary Integration

```tsx
// components/DonationWithErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary';
import { DonationWidget } from '@yourname/donation-widget';

function DonationErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="border border-red-200 bg-red-50 p-6 rounded-lg text-center">
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Donation Widget Unavailable
      </h3>
      <p className="text-red-600 mb-4">
        We're having trouble loading the donation form. Please try again.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}

export function SafeDonationWidget({ config }) {
  return (
    <ErrorBoundary
      FallbackComponent={DonationErrorFallback}
      onError={(error) => {
        console.error('Donation widget error:', error);
        // Report to error tracking service
      }}
    >
      <DonationWidget config={config} />
    </ErrorBoundary>
  );
}
```

### 9. Loading States and Suspense

```tsx
// components/DonationWithLoading.tsx
import { Suspense } from 'react';
import { DonationWidget } from '@yourname/donation-widget';

function DonationSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function DonationWithLoading({ config }) {
  return (
    <Suspense fallback={<DonationSkeleton />}>
      <DonationWidget config={config} />
    </Suspense>
  );
}
```

### 10. Custom Styling Examples

```tsx
// components/StyledDonations.tsx
import { DonationWidget, DonationButton } from '@yourname/donation-widget';

// Glassmorphism style
export function GlassDonationWidget({ config }) {
  return (
    <div className="backdrop-blur-lg bg-white/30 border border-white/20 rounded-2xl p-6 shadow-xl">
      <DonationWidget
        config={config}
        className="bg-transparent border-none"
      />
    </div>
  );
}

// Neumorphism style
export function NeumorphicDonationWidget({ config }) {
  return (
    <div className="bg-gray-100 p-8 rounded-3xl shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]">
      <DonationWidget
        config={config}
        className="bg-gray-100 border-none shadow-[inset_20px_20px_60px_#bebebe,inset_-20px_-20px_60px_#ffffff] rounded-2xl"
      />
    </div>
  );
}

// Gradient border style
export function GradientBorderDonationWidget({ config }) {
  return (
    <div className="p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-lg">
      <div className="bg-white rounded-lg">
        <DonationWidget
          config={config}
          className="border-none"
        />
      </div>
    </div>
  );
}
```

These examples demonstrate the flexibility and power of the donation library across different use cases and styling approaches! 