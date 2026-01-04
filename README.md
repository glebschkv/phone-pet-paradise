# Phone Pet Paradise 🐾

A gamified mobile app that helps users develop healthier phone habits by rewarding phone-free time with adorable virtual pets, achievements, and daily quests.

## Overview

Phone Pet Paradise is a full-stack React + Capacitor mobile application that turns digital wellness into a fun, engaging experience. Users earn rewards, collect pets, complete quests, and build streaks by spending time away from their phones.

### Key Features

- **Virtual Pet Collection** - Collect and bond with 50+ unique animated pets
- **Focus Timer** - Set phone-free sessions with app blocking
- **Achievement System** - Unlock achievements as you build better habits
- **Daily Quests** - Complete daily challenges for rewards
- **Streak Tracking** - Maintain streaks for consistent phone-free time
- **Shop & Inventory** - Spend coins on items, themes, and upgrades
- **Battle Pass** - Season-based progression with exclusive rewards
- **Premium Features** - Subscription tiers with enhanced benefits
- **Offline Support** - Full functionality even without internet connection

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18.3 + TypeScript |
| **Build Tool** | Vite 6.0 |
| **Mobile Framework** | Capacitor 7.4 (iOS/Android) |
| **State Management** | Zustand 5.0 |
| **Server State** | TanStack React Query 5.5 |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **UI Components** | shadcn/ui + Radix UI |
| **Styling** | Tailwind CSS 3.4 |
| **3D Graphics** | Three.js + React Three Fiber |
| **Forms** | React Hook Form + Zod |
| **Testing** | Vitest + Playwright |
| **Error Tracking** | Sentry |

## Getting Started

### Prerequisites

- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm 9+
- For mobile development:
  - Xcode 15+ (iOS)
  - Android Studio (Android)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd phone-pet-paradise

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Open Playwright UI |
| `npm run test:e2e:headed` | Run E2E tests with browser visible |

### Project Structure

```
src/
├── components/          # React components (137 files)
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── collection/     # Pet collection components
│   ├── shop/           # Shop/marketplace
│   ├── focus-timer/    # Focus mode UI
│   ├── gamification/   # Achievements, XP, rewards
│   └── settings/       # App settings
├── hooks/              # Custom React hooks (54 hooks)
├── stores/             # Zustand state stores (15 stores)
├── services/           # Business logic services
├── lib/                # Utilities and helpers
├── types/              # TypeScript type definitions
├── data/               # Static game data (pets, items, etc.)
├── contexts/           # React context providers
├── pages/              # Route page components
├── plugins/            # Native Capacitor plugins
├── integrations/       # External service integrations
└── test/               # Test setup and utilities
```

### Key Architectural Patterns

- **State Management**: Zustand stores for client-side state, React Query for server state
- **Offline-First**: Actions queue in `offlineSyncStore` when offline, sync when online
- **Lazy Loading**: Pages and heavy components are code-split for performance
- **Error Boundaries**: Graceful error handling with fallback UI
- **Type Safety**: Full TypeScript coverage with strict mode

## Testing

### Unit Tests (Vitest)

Unit tests cover stores, hooks, and utility functions:

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Open interactive UI
npm run test:ui
```

Coverage thresholds:
- Lines: 20%
- Statements: 20%
- Functions: 30%
- Branches: 70%

### E2E Tests (Playwright)

End-to-end tests cover critical user flows:

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed
```

Test targets:
- Desktop Chrome
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Mobile Development

### iOS Setup

1. Install Xcode 15+ from the Mac App Store
2. Install CocoaPods: `sudo gem install cocoapods`
3. Build the web app: `npm run build`
4. Sync Capacitor: `npx cap sync ios`
5. Open in Xcode: `npx cap open ios`

See [ios_setup_instructions.md](./ios_setup_instructions.md) for detailed setup.

### Android Setup

1. Install Android Studio
2. Build the web app: `npm run build`
3. Sync Capacitor: `npx cap sync android`
4. Open in Android Studio: `npx cap open android`

### Native Plugins

The app uses custom Capacitor plugins for:
- **Device Activity** - Monitor phone-free time
- **App Blocking** - Block distracting apps during focus sessions
- **StoreKit** - In-app purchases (iOS)
- **Widget Data** - Sync data to home screen widgets

## Documentation

- [Widget Integration Guide](./docs/WIDGETS.md)
- [Privacy Policy](./docs/PRIVACY_POLICY.md)
- [Terms of Service](./docs/TERMS_OF_SERVICE.md)
- [App Store Metadata](./docs/APP_STORE_METADATA.md)
- [iOS Setup Instructions](./ios_setup_instructions.md)
- [Performance Analysis](./PERFORMANCE_ANALYSIS.md)
- [iOS Improvement Plan](./IOS_APP_IMPROVEMENT_PLAN.md)
- [Testing Guide](./docs/TESTING.md)
- [API Documentation](./docs/API.md)

## Contributing

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure tests pass: `npm run test:run && npm run test:e2e`
4. Run linting: `npm run lint`
5. Submit a pull request

## License

Private - All rights reserved.
