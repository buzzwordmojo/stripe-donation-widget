#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COMMANDS = {
  init: 'Initialize donation widget in your Next.js project',
  help: 'Show this help message',
};

function showHelp() {
  console.log(`
🎯 Stripe Donation Widget CLI

Usage: npx stripe-donation-widget <command>

Commands:
${Object.entries(COMMANDS).map(([cmd, desc]) => `  ${cmd.padEnd(12)} ${desc}`).join('\n')}

Examples:
  npx stripe-donation-widget init
  npx stripe-donation-widget help
`);
}

function checkNextJsProject() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ No package.json found. Please run this command in your Next.js project root.');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.dependencies?.next && !packageJson.devDependencies?.next) {
    console.error('❌ This doesn\'t appear to be a Next.js project. Please run this command in your Next.js project root.');
    process.exit(1);
  }

  console.log('✅ Next.js project detected');
  return packageJson;
}

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  createDirectory(dir);
  
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  File already exists: ${filePath} (skipping)`);
    return false;
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`📄 Created file: ${filePath}`);
  return true;
}

function createApiRoutes() {
  console.log('\n📡 Creating API routes...');

  // Create checkout session route
  const checkoutRoute = `import { NextRequest, NextResponse } from 'next/server';
import { DonationStripeManager } from 'stripe-donation-widget/server';

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }
    
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
}`;

  // Create stats route
  const statsRoute = `import { NextRequest, NextResponse } from 'next/server';
import { DonationStripeManager } from 'stripe-donation-widget/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectSlug = searchParams.get('projectSlug');
    
    if (!projectSlug) {
      return NextResponse.json({ error: 'Project slug required' }, { status: 400 });
    }
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }
    
    const manager = new DonationStripeManager(stripeSecretKey);
    const stats = await manager.getSubscriptionSummary(projectSlug);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}`;

  // Create webhook route
  const webhookRoute = `import { NextRequest, NextResponse } from 'next/server';
import { handleDonationWebhook } from 'stripe-donation-widget/server';

export async function POST(request: NextRequest) {
  try {
    return await handleDonationWebhook(request, {
      stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      onSubscriptionCreated: async (subscription) => {
        console.log('New subscription created:', subscription.id);
        // Add your custom logic here
      },
      onSubscriptionUpdated: async (subscription) => {
        console.log('Subscription updated:', subscription.id);
        // Add your custom logic here
      },
      onSubscriptionDeleted: async (subscription) => {
        console.log('Subscription cancelled:', subscription.id);
        // Add your custom logic here
      },
      onPaymentSucceeded: async (paymentIntent) => {
        console.log('Payment succeeded:', paymentIntent.id);
        // Add your custom logic here
      },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}`;

  // Detect app router vs pages router
  const hasAppDir = fs.existsSync(path.join(process.cwd(), 'app'));
  const hasPagesDir = fs.existsSync(path.join(process.cwd(), 'pages'));

  if (hasAppDir) {
    // App Router
    writeFile('app/api/donation/create-checkout-session/route.ts', checkoutRoute);
    writeFile('app/api/donation/stats/route.ts', statsRoute);
    writeFile('app/api/donation/webhook/route.ts', webhookRoute);
  } else if (hasPagesDir) {
    // Pages Router
    console.log('⚠️  Pages Router detected. You\'ll need to manually convert these to pages/api format:');
    writeFile('api-routes-example/donation/create-checkout-session.ts', checkoutRoute.replace(/export async function POST/g, 'export default async function handler'));
    writeFile('api-routes-example/donation/stats.ts', statsRoute.replace(/export async function GET/g, 'export default async function handler'));
    writeFile('api-routes-example/donation/webhook.ts', webhookRoute.replace(/export async function POST/g, 'export default async function handler'));
  } else {
    console.log('⚠️  No app/ or pages/ directory found. Creating in app/ format:');
    writeFile('app/api/donation/create-checkout-session/route.ts', checkoutRoute);
    writeFile('app/api/donation/stats/route.ts', statsRoute);
    writeFile('app/api/donation/webhook/route.ts', webhookRoute);
  }
}

function createExampleComponent() {
  console.log('\n🎨 Creating example component...');

  const exampleComponent = `'use client';

import { DonationWidget, DonationButton } from 'stripe-donation-widget';
import type { DonationConfig } from 'stripe-donation-widget';

const donationConfig: DonationConfig = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  projectName: "Your Project Name",
  projectSlug: "your-project-slug", // Used for Stripe product IDs
  monthly: {
    suggested: 5.00,
    min: 1.00,
    max: 100.00
  },
  annual: {
    suggested: 50.00,
    min: 10.00,
    max: 1000.00
  },
  goal: {
    target: 100, // Monthly goal in dollars
    showProgress: true,
    description: "Help keep this project running and growing",
    calculateFromSubscriptions: true // Use real Stripe data
  },
  currency: 'usd',
  customAmounts: true,
  theme: 'auto'
};

export default function SupportPage() {
  const handleSuccess = (sessionId: string) => {
    console.log('Donation checkout initiated:', sessionId);
    // You could track this event, show a success message, etc.
  };

  const handleError = (error: Error) => {
    console.error('Donation error:', error);
    // You could show an error toast, track the error, etc.
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Support Our Project</h1>
      
      {/* Full donation widget */}
      <DonationWidget 
        config={donationConfig}
        onSuccess={handleSuccess}
        onError={handleError}
        className="mb-8"
      />
      
      {/* Quick donation buttons */}
      <div className="space-y-4">
        <DonationButton 
          config={donationConfig} 
          type="monthly" 
          amount={5}
          onSuccess={handleSuccess}
          onError={handleError}
          className="w-full"
        >
          ☕ Support for $5/month
        </DonationButton>
        
        <DonationButton 
          config={donationConfig} 
          type="annual" 
          amount={50}
          onSuccess={handleSuccess}
          onError={handleError}
          className="w-full"
        >
          🚀 Annual Supporter - $50/year
        </DonationButton>
      </div>
    </div>
  );
}`;

  const hasAppDir = fs.existsSync(path.join(process.cwd(), 'app'));
  
  if (hasAppDir) {
    writeFile('app/support/page.tsx', exampleComponent);
  } else {
    writeFile('components/SupportPage.tsx', exampleComponent);
  }
}

function createEnvExample() {
  console.log('\n🔐 Creating environment variables example...');

  const envExample = `# Stripe Configuration
# Get these from your Stripe Dashboard: https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Webhook Secret (optional, for webhook handling)
# Get this from your Stripe Dashboard: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here`;

  writeFile('.env.example', envExample);
  
  if (!fs.existsSync('.env.local')) {
    writeFile('.env.local', envExample);
    console.log('📝 Please update .env.local with your actual Stripe keys');
  }
}

function createReadme() {
  console.log('\n📚 Creating setup documentation...');

  const readme = `# Donation Widget Setup

This project has been configured with the Stripe Donation Widget.

## 🔧 Setup Steps

### 1. Install Dependencies
The donation widget should already be installed. If not:
\`\`\`bash
npm install stripe-donation-widget
\`\`\`

### 2. Configure Environment Variables
Update your \`.env.local\` file with your Stripe keys:
\`\`\`env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
\`\`\`

Get your keys from: https://dashboard.stripe.com/apikeys

### 3. Update Configuration
Edit the donation configuration in your component:
- \`projectName\`: Your project's display name
- \`projectSlug\`: Unique identifier (used for Stripe products)
- \`monthly.suggested\`: Default monthly amount
- \`annual.suggested\`: Default annual amount
- \`goal.target\`: Monthly funding goal

### 4. Test the Integration
1. Start your development server: \`npm run dev\`
2. Visit your support page
3. Test with Stripe test cards: https://stripe.com/docs/testing

### 5. Go Live
1. Replace test keys with live keys in production
2. Set up webhooks in Stripe Dashboard (optional)
3. Configure your domain in Stripe settings

## 📁 Generated Files

- \`app/api/donation/\` - API routes for Stripe integration
- \`app/support/page.tsx\` - Example support page (or \`components/SupportPage.tsx\`)
- \`.env.example\` - Environment variables template

## 🎯 Usage

\`\`\`tsx
import { DonationWidget } from 'stripe-donation-widget';

<DonationWidget config={donationConfig} />
\`\`\`

## 📖 Documentation

For full documentation, visit: https://github.com/buzzwordmojo/stripe-donation-widget

## 🆘 Support

If you need help, please open an issue on GitHub or check the documentation.
`;

  writeFile('DONATION_SETUP.md', readme);
}

function installDependencies() {
  console.log('\n📦 Checking dependencies...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const hasStripeDonationWidget = 
    packageJson.dependencies?.['stripe-donation-widget'] || 
    packageJson.devDependencies?.['stripe-donation-widget'];
  
  if (!hasStripeDonationWidget) {
    console.log('📦 Installing stripe-donation-widget...');
    try {
      execSync('npm install stripe-donation-widget', { stdio: 'inherit' });
      console.log('✅ stripe-donation-widget installed successfully');
    } catch (error) {
      console.error('❌ Failed to install stripe-donation-widget');
      console.log('Please run manually: npm install stripe-donation-widget');
    }
  } else {
    console.log('✅ stripe-donation-widget already installed');
  }
}

function init() {
  console.log('🎯 Initializing Stripe Donation Widget...\n');
  
  // Check if this is a Next.js project
  const packageJson = checkNextJsProject();
  
  // Install dependencies
  installDependencies();
  
  // Create all the files
  createApiRoutes();
  createExampleComponent();
  createEnvExample();
  createReadme();
  
  console.log(`
🎉 Stripe Donation Widget initialized successfully!

📋 Next steps:
1. Update .env.local with your Stripe keys
2. Customize the donation configuration in your component
3. Test the integration: npm run dev
4. Visit your support page to see the widget in action

📚 Documentation: DONATION_SETUP.md
🔗 GitHub: https://github.com/buzzwordmojo/stripe-donation-widget

Happy fundraising! 🚀
`);
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'init':
    init();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (!command) {
      showHelp();
    } else {
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
    }
} 