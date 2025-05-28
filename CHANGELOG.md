# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-27

### Added
- 🛠️ **CLI Tool** - One-command setup with `npx stripe-donation-widget init`
- 🔍 **Smart project detection** - Automatically detects App Router vs Pages Router
- 📁 **Complete file generation** - Creates API routes, components, and documentation
- 🔐 **Environment setup** - Generates .env templates with proper Stripe configuration
- 📖 **Documentation generation** - Creates setup guides and usage examples
- ⚠️ **Safety checks** - Won't overwrite existing files
- 🎯 **Zero configuration** - Works out of the box with sensible defaults

### CLI Features
- 🚀 **One-command initialization** - `npx stripe-donation-widget init`
- 📁 **Auto-generated files**:
  - `app/api/donation/create-checkout-session/route.ts` - Stripe checkout handling
  - `app/api/donation/stats/route.ts` - MRR and subscription analytics
  - `app/api/donation/webhook/route.ts` - Webhook processing (optional)
  - `app/support/page.tsx` - Complete example support page
  - `.env.example` - Environment variables template
  - `.env.local` - Local environment file (if not exists)
  - `DONATION_SETUP.md` - Comprehensive setup documentation

### Improved Developer Experience
- ⚡ **Setup time reduced from 15-30 minutes to 30 seconds**
- 🎯 **Zero manual configuration required**
- 📚 **Automatic documentation generation**
- 🔧 **Smart framework detection**

## [1.0.0] - 2024-12-27

### Added
- 🎉 Initial release of the Stripe donation widget library
- 🎨 **DonationWidget** component with interactive slider and preset amounts
- 🔘 **DonationButton** component for quick donations
- 💳 **Stripe Integration** with automatic product creation
- 📊 **Real-time MRR tracking** and subscription analytics
- 🎯 **Goal progress tracking** with visual progress bars
- 🔧 **Configuration-driven setup** with TypeScript support
- 📱 **Responsive design** optimized for all devices
- 🎭 **Customizable styling** with Tailwind CSS classes
- 🚀 **Multi-project support** with isolated configurations
- ⚡ **React hooks** for donation flow and stats
- 🛡️ **Type-safe** with full TypeScript definitions
- 📦 **Dual exports** for client and server-side usage
- 🔄 **Automatic Stripe product management**
- 💰 **Dynamic pricing** without pre-creating prices
- 📈 **MRR calculation** from live subscription data
- 🎨 **ShadCN/UI components** included
- 📚 **Comprehensive documentation** and examples
- 🧪 **Example API routes** for Next.js integration

### CLI Features
- 🚀 **One-command initialization** - `npx stripe-donation-widget init`
- 🔍 **Smart project detection** - Automatically detects App Router vs Pages Router
- 📁 **Complete file generation** - Creates API routes, components, and documentation
- 🔐 **Environment setup** - Generates .env templates with proper Stripe configuration
- 📖 **Documentation generation** - Creates setup guides and usage examples
- ⚠️ **Safety checks** - Won't overwrite existing files
- 🎯 **Zero configuration** - Works out of the box with sensible defaults

### Generated Files
The CLI automatically creates:
- `app/api/donation/create-checkout-session/route.ts` - Stripe checkout handling
- `app/api/donation/stats/route.ts` - MRR and subscription analytics
- `app/api/donation/webhook/route.ts` - Webhook processing (optional)
- `app/support/page.tsx` - Complete example support page
- `.env.example` - Environment variables template
- `.env.local` - Local environment file (if not exists)
- `DONATION_SETUP.md` - Comprehensive setup documentation

### Features
- Interactive amount selection with slider
- Monthly and annual subscription options
- Real-time goal progress tracking
- Automatic Stripe product creation
- Live MRR calculation from subscriptions
- Customizable themes and styling
- Error handling and loading states
- Mobile-optimized touch interactions
- TypeScript support with full type definitions
- Server-side utilities for API routes
- Webhook handling (optional)
- Multi-currency support
- Custom amount validation
- Responsive design for all screen sizes

### Technical Details
- Built with React 18+ and TypeScript
- Compatible with Next.js 13+ (App Router)
- Uses Stripe API v2023-10-16
- Bundled with Rollup for optimal tree-shaking
- Includes both ESM and CommonJS builds
- Peer dependencies for React, Next.js, and Stripe
- Full TypeScript declarations included
- Zero runtime dependencies (peer deps only)

### Package Structure
```
stripe-donation-widget
├── dist/
│   ├── index.cjs         # CommonJS build
│   ├── index.esm.js      # ES Module build
│   ├── server.cjs        # Server utilities (CJS)
│   ├── server.esm.js     # Server utilities (ESM)
│   └── *.d.ts           # TypeScript declarations
├── examples/
│   ├── api/             # Example API routes
│   └── demo-page.tsx    # Example usage
└── README.md
```

### Getting Started
```bash
npm install stripe-donation-widget
```

See README.md for complete setup instructions and examples. 