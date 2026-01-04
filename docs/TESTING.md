# Testing Guide

This guide covers testing practices, patterns, and commands for Phone Pet Paradise.

## Overview

The project uses a comprehensive testing strategy with two main testing frameworks:

| Framework | Purpose | Location |
|-----------|---------|----------|
| **Vitest** | Unit & Integration tests | `src/test/` |
| **Playwright** | End-to-end tests | `e2e/` |

## Quick Start

```bash
# Run unit tests in watch mode
npm test

# Run unit tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Unit Testing with Vitest

### Configuration

The Vitest configuration is in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          branches: 70,
          functions: 30,
          lines: 20,
          statements: 20,
        },
      },
    },
  },
});
```

### Test File Structure

```
src/test/
├── setup.ts              # Global test setup and mocks
├── utils/
│   └── test-utils.tsx    # Render helpers and factories
├── stores/               # Zustand store tests
│   ├── shopStore.test.ts
│   ├── themeStore.test.ts
│   └── collectionStore.test.ts
├── hooks/                # Custom hook tests
│   ├── useAuth.test.ts
│   ├── useShop.test.ts
│   ├── useFocusMode.test.ts
│   └── ... (24 hook tests)
├── services/             # Service tests
│   └── achievementService.test.ts
├── lib/                  # Utility function tests
│   ├── logger.test.ts
│   ├── debounce.test.ts
│   └── apiUtils.test.ts
├── components/           # Component tests
│   └── FeatureErrorBoundary.test.tsx
└── integration/          # Integration tests
    ├── Shop.integration.test.tsx
    ├── FocusTimer.integration.test.tsx
    └── Navigation.integration.test.tsx
```

### Writing Store Tests

Test Zustand stores by accessing state and actions directly:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useShopStore } from '@/stores/shopStore';

describe('shopStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useShopStore.setState({
      ownedCharacters: [],
      ownedBackgrounds: [],
    });
  });

  it('should add a character to owned characters', () => {
    const { addOwnedCharacter } = useShopStore.getState();

    act(() => {
      addOwnedCharacter('golden-cat');
    });

    const state = useShopStore.getState();
    expect(state.ownedCharacters).toContain('golden-cat');
  });

  it('should not add duplicate characters', () => {
    const { addOwnedCharacter } = useShopStore.getState();

    act(() => {
      addOwnedCharacter('golden-cat');
      addOwnedCharacter('golden-cat');
    });

    const state = useShopStore.getState();
    expect(state.ownedCharacters.filter(c => c === 'golden-cat')).toHaveLength(1);
  });
});
```

### Writing Hook Tests

Test custom hooks using `renderHook`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCoinSystem } from '@/hooks/useCoinSystem';

describe('useCoinSystem', () => {
  it('should add coins correctly', () => {
    const { result } = renderHook(() => useCoinSystem());

    act(() => {
      result.current.addCoins(100);
    });

    expect(result.current.coins).toBeGreaterThanOrEqual(100);
  });

  it('should prevent negative balance', () => {
    const { result } = renderHook(() => useCoinSystem());

    act(() => {
      result.current.spendCoins(999999);
    });

    expect(result.current.coins).toBeGreaterThanOrEqual(0);
  });
});
```

### Writing Component Tests

Use the custom render utilities for component testing:

```typescript
import { describe, it, expect } from 'vitest';
import {
  renderWithProviders,
  screen,
  createFullAppState
} from '@/test/utils/test-utils';
import { Shop } from '@/components/shop/Shop';

describe('Shop Component', () => {
  it('should render shop tabs', async () => {
    renderWithProviders(<Shop />, {
      mockLocalStorage: createFullAppState({ coins: 1000 }),
    });

    expect(screen.getByRole('tab')).toBeVisible();
  });

  it('should display coin balance', async () => {
    renderWithProviders(<Shop />, {
      mockLocalStorage: createFullAppState({ coins: 500 }),
    });

    expect(screen.getByText(/500/)).toBeVisible();
  });
});
```

### Test Utilities

The `src/test/utils/test-utils.tsx` file provides:

#### Render Helpers

```typescript
import { renderWithProviders, renderWithUser } from '@/test/utils/test-utils';

// Full provider setup (QueryClient, Router, Tooltip)
const { user } = renderWithProviders(<MyComponent />, {
  initialRoute: '/shop',
  mockLocalStorage: { key: 'value' },
});

// Simple render with user events
const { user } = renderWithUser(<SimpleComponent />);
```

#### State Factories

```typescript
import {
  createGuestUserState,
  createXPState,
  createCoinState,
  createShopInventoryState,
  createStreakState,
  createFullAppState,
} from '@/test/utils/test-utils';

// Create mock localStorage state
const mockState = createFullAppState({
  coins: 1000,
  level: 5,
  xp: 2500,
  streak: 7,
  ownedCharacters: ['cat-1', 'dog-1'],
});
```

#### Async Utilities

```typescript
import {
  waitForElement,
  waitForLoadingToComplete
} from '@/test/utils/test-utils';

// Wait for specific element
const element = await waitForElement(() => screen.getByRole('button'));

// Wait for loading spinners to disappear
await waitForLoadingToComplete();
```

### Mocking

#### Mocking Capacitor Plugins

The setup file (`src/test/setup.ts`) mocks Capacitor:

```typescript
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
  registerPlugin: vi.fn(() => ({
    checkPermissions: vi.fn().mockResolvedValue({ status: 'granted' }),
    startMonitoring: vi.fn().mockResolvedValue({ monitoring: true }),
    // ... other plugin methods
  })),
}));
```

#### Mocking Modules

```typescript
// Mock before importing the module under test
vi.mock('@/lib/logger', () => ({
  shopLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
```

#### Mocking Supabase

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
}));
```

## End-to-End Testing with Playwright

### Configuration

The Playwright configuration is in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

### E2E Test Structure

```
e2e/
├── auth.spec.ts              # Authentication flows
├── collection.spec.ts        # Pet collection tests
├── focus-timer.spec.ts       # Focus mode tests
├── navigation.spec.ts        # Navigation tests
├── shop.spec.ts              # Shop & purchases
├── streaks.spec.ts           # Streak system tests
└── integration/
    ├── error-handling.spec.ts
    ├── rewards-achievements.spec.ts
    └── user-journey.spec.ts
```

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Shop Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up guest mode with some coins
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'guest-test-user');
      localStorage.setItem('petparadise_coins', '1000');
    });
  });

  test('should navigate to shop page', async ({ page }) => {
    await page.goto('/');

    // Click on shop navigation
    const shopNav = page.getByRole('link', { name: /shop|store/i }).first();
    await shopNav.click();

    // Should be on the shop page
    await expect(page).toHaveURL(/.*shop/);
  });

  test('should display coin balance', async ({ page }) => {
    await page.goto('/shop');

    const coinDisplay = page.locator('text=/\\d+\\s*(coins?)/i');
    await expect(coinDisplay.first()).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/shop.spec.ts

# Run specific test by name
npx playwright test -g "should navigate to shop"

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=mobile-chrome
```

### Debugging E2E Tests

```bash
# Debug mode with inspector
npx playwright test --debug

# Generate test code by recording
npx playwright codegen http://localhost:5173

# View trace file
npx playwright show-trace trace.zip
```

## Testing Commands Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:e2e` | Run E2E tests headless |
| `npm run test:e2e:ui` | Open Playwright UI |
| `npm run test:e2e:headed` | Run E2E with visible browser |

## CI/CD Integration

The CI pipeline (`.github/workflows/ci.yml`) runs:

1. **Lint & Type Check**
   - ESLint
   - TypeScript type checking

2. **Unit & Integration Tests**
   - Vitest with coverage
   - Coverage uploaded to Codecov

3. **Build**
   - Production build

4. **E2E Tests**
   - Playwright tests on Chromium
   - Artifacts uploaded on failure

## Best Practices

### General

1. **Isolate tests** - Each test should be independent
2. **Clear state** - Reset stores and localStorage in `beforeEach`
3. **Use descriptive names** - Test names should describe behavior
4. **Test behavior, not implementation** - Focus on what users see

### Unit Tests

1. **Test one thing** - Each test should verify one behavior
2. **Use factories** - Use test utilities for consistent state
3. **Mock external dependencies** - Isolate from network/native plugins
4. **Test edge cases** - Empty arrays, null values, large inputs

### E2E Tests

1. **Set up state via localStorage** - Use `addInitScript` for consistent state
2. **Use semantic selectors** - Prefer `getByRole`, `getByText` over CSS
3. **Wait for elements** - Use `expect().toBeVisible()` not `page.waitForTimeout`
4. **Handle flakiness** - Add retries for CI, use specific waits

### Coverage Thresholds

Current thresholds (enforced in CI):

| Metric | Threshold |
|--------|-----------|
| Lines | 20% |
| Statements | 20% |
| Functions | 30% |
| Branches | 70% |

To view coverage report:

```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## Troubleshooting

### Common Issues

**Tests fail with "Cannot find module"**
- Ensure path aliases are configured in `vitest.config.ts`
- Check that imports use `@/` prefix correctly

**Capacitor plugin errors**
- Mocks should be set up in `src/test/setup.ts`
- Ensure mocks return expected structure

**Flaky E2E tests**
- Add explicit waits for elements
- Check for race conditions in state updates
- Use `test.slow()` for naturally slow tests

**localStorage not persisting**
- localStorage is cleared in `afterEach` - this is intentional
- Set up state in `beforeEach` for each test

### Debug Tips

```typescript
// Print current state in unit tests
console.log(JSON.stringify(useShopStore.getState(), null, 2));

// Pause E2E test for debugging
await page.pause();

// Screenshot at specific point
await page.screenshot({ path: 'debug.png' });
```
