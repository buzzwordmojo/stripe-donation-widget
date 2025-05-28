# Donation Library Package Structure

This document outlines the complete structure of the donation library for NPM packaging.

## 📁 Package Structure

```
donation-widget/
├── 📄 package.json                 # NPM package configuration
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 rollup.config.js            # Build configuration
├── 📄 README.md                   # Main documentation
├── 📄 EXAMPLES.md                 # Usage examples
├── 📄 CHANGELOG.md                # Version history
├── 📄 LICENSE                     # MIT license
├── 📁 src/
│   ├── 📄 index.ts                # Main exports
│   ├── 📄 types.ts                # TypeScript interfaces
│   ├── 📄 config.ts               # Configuration & validation
│   ├── 📁 components/
│   │   ├── 📄 DonationWidget.tsx  # Main widget component
│   │   └── 📄 DonationButton.tsx  # Simple button component
│   ├── 📁 hooks/
│   │   ├── 📄 use-donation.ts     # Main donation hook
│   │   └── 📄 use-donation-stats.ts # MRR stats hook
│   └── 📁 server/
│       └── 📄 stripe.ts           # Server-side Stripe utilities
├── 📁 dist/                       # Built files (generated)
│   ├── 📄 index.js                # CommonJS build
│   ├── 📄 index.esm.js           # ES modules build
│   ├── 📄 index.d.ts             # TypeScript declarations
│   └── 📄 *.map                   # Source maps
└── 📁 examples/                   # Example implementations
    ├── 📄 basic-usage.tsx
    ├── 📄 multi-project.tsx
    └── 📄 advanced-features.tsx
```

## 🚀 Extraction Steps

### 1. Create New Repository

```bash
mkdir donation-widget
cd donation-widget
git init
```

### 2. Copy Library Files

Copy the following files from `src/lib/donation/`:

```bash
# Core library files
cp -r src/lib/donation/* ./src/
cp src/lib/donation/package.json ./
cp src/lib/donation/tsconfig.json ./
cp src/lib/donation/rollup.config.js ./
cp src/lib/donation/README.md ./
cp src/lib/donation/EXAMPLES.md ./
```

### 3. Add Required UI Components

Since the library depends on ShadCN/UI components, you'll need to include them:

```bash
mkdir -p src/ui
# Copy these components from your project:
cp src/components/ui/button.tsx src/ui/
cp src/components/ui/card.tsx src/ui/
cp src/components/ui/input.tsx src/ui/
cp src/components/ui/label.tsx src/ui/
cp src/components/ui/progress.tsx src/ui/
cp src/components/ui/slider.tsx src/ui/
cp src/components/ui/tabs.tsx src/ui/
```

### 4. Update Import Paths

Update all imports in the library files to use relative paths:

```typescript
// Change from:
import { Button } from '@/components/ui/button';

// To:
import { Button } from '../ui/button';
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Build Package

```bash
npm run build
```

### 7. Test Package

```bash
npm pack
# This creates a .tgz file you can test in other projects
```

### 8. Publish to NPM

```bash
npm login
npm publish --access public
```

## 📦 Package Configuration

### package.json Key Fields

```json
{
  "name": "@yourname/donation-widget",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md"],
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "next": ">=13.0.0"
  }
}
```

### Build Output

The build process creates:
- **CommonJS**: `dist/index.js` (for Node.js)
- **ES Modules**: `dist/index.esm.js` (for bundlers)
- **TypeScript**: `dist/index.d.ts` (type definitions)
- **Source Maps**: For debugging

## 🔧 Usage After Publishing

### Installation

```bash
npm install @yourname/donation-widget
```

### Basic Usage

```tsx
import { DonationWidget } from '@yourname/donation-widget';

const config = {
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  projectName: "My Project",
  projectSlug: "my-project",
  monthly: { suggested: 5.00 },
  annual: { suggested: 50.00 }
};

export function SupportPage() {
  return <DonationWidget config={config} />;
}
```

## 🎯 Key Features

### ✅ What's Included

- **React Components**: DonationWidget, DonationButton
- **React Hooks**: useDonation, useDonationStats
- **Server Utilities**: DonationStripeManager
- **TypeScript Support**: Full type definitions
- **Real MRR Calculation**: Live subscription tracking
- **Slider Interface**: Modern amount selection
- **Goal Progress**: Visual progress tracking
- **Multi-Project Support**: Isolated configurations
- **Error Handling**: Comprehensive error management

### 🔄 What Users Need to Provide

- **Stripe Keys**: Publishable and secret keys
- **API Routes**: Two simple Next.js API routes
- **UI Dependencies**: ShadCN/UI components (or custom styling)
- **Configuration**: Project-specific settings

## 📋 Required API Routes

Users need to create these API routes in their Next.js app:

### `/api/donation/create-checkout-session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { DonationStripeManager } from '@yourname/donation-widget/server';

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();
    const manager = new DonationStripeManager(process.env.STRIPE_SECRET_KEY!);
    const result = await manager.createCheckoutSession(sessionData);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
```

### `/api/donation/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { DonationStripeManager } from '@yourname/donation-widget/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectSlug = searchParams.get('projectSlug');
    
    const manager = new DonationStripeManager(process.env.STRIPE_SECRET_KEY!);
    const stats = await manager.getSubscriptionSummary(projectSlug!);
    
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
```

## 🎨 Styling Options

### Option 1: Include ShadCN/UI Components

Bundle the UI components with the package for zero-config usage.

### Option 2: Peer Dependencies

Require users to install ShadCN/UI components separately.

### Option 3: Headless Components

Provide unstyled components that users can style themselves.

## 📈 Versioning Strategy

### Semantic Versioning

- **Major (1.0.0)**: Breaking changes
- **Minor (1.1.0)**: New features, backward compatible
- **Patch (1.0.1)**: Bug fixes

### Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Build and test
5. Publish to NPM
6. Create GitHub release

## 🧪 Testing Strategy

### Unit Tests

```bash
npm run test
```

Test coverage for:
- Component rendering
- Hook functionality
- Configuration validation
- Stripe integration
- Error handling

### Integration Tests

Test with real Stripe test keys to ensure:
- Checkout session creation
- Subscription tracking
- MRR calculations
- Multi-project isolation

## 📚 Documentation

### README.md
- Quick start guide
- Configuration options
- API reference
- Troubleshooting

### EXAMPLES.md
- Real-world usage examples
- Advanced configurations
- Custom styling
- Error handling

### API Documentation
- TypeScript interfaces
- Function signatures
- Return types
- Error codes

## 🔒 Security Considerations

### Environment Variables
- Never expose secret keys
- Validate all inputs
- Sanitize user data

### Stripe Integration
- Use latest Stripe API version
- Implement proper error handling
- Follow Stripe security best practices

### Data Privacy
- No sensitive data storage
- Minimal data collection
- GDPR compliance ready

## 🌟 Future Enhancements

### Planned Features
- [ ] Multiple payment methods
- [ ] Cryptocurrency support
- [ ] Advanced analytics
- [ ] Custom themes
- [ ] Webhook management
- [ ] A/B testing support
- [ ] Internationalization

### Community Features
- [ ] Plugin system
- [ ] Custom components
- [ ] Theme marketplace
- [ ] Integration guides

---

**Ready to package and share with the world!** 🚀 