/**
 * Test Utilities for UI/Integration Testing
 *
 * Provides render helpers, mock providers, and common test utilities
 * for comprehensive component integration testing.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { vi } from 'vitest';

// ============================================================================
// Types
// ============================================================================

interface WrapperProps {
  children: ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  routes?: Array<{ path: string; element: ReactElement }>;
  withRouter?: boolean;
  withQueryClient?: boolean;
  queryClient?: QueryClient;
  mockLocalStorage?: Record<string, string>;
}

interface RenderWithUserResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
}

// ============================================================================
// Mock Providers
// ============================================================================

/**
 * Mock NativePluginProvider for testing without Capacitor
 */
export const MockNativePluginProvider: React.FC<WrapperProps> = ({ children }) => {
  const mockValue = {
    status: {
      isNative: false,
      plugins: {
        deviceActivity: 'unavailable' as const,
        storeKit: 'unavailable' as const,
        widgetData: 'unavailable' as const,
      },
      errors: [],
    },
    isChecking: false,
    hasCriticalErrors: false,
    lastChecked: Date.now(),
    showBanner: false,
    dismissBanner: vi.fn(),
    isPluginAvailable: vi.fn().mockReturnValue(false),
    hasPluginError: vi.fn().mockReturnValue(false),
    shouldUsePlugin: vi.fn().mockReturnValue(false),
    recheckPlugins: vi.fn().mockResolvedValue(undefined),
    safeCallPlugin: vi.fn().mockResolvedValue({ success: false }),
    canUseDeviceActivity: false,
    canUseStoreKit: false,
    canUseWidgetData: false,
  };

  const NativePluginContext = React.createContext(mockValue);

  return (
    <NativePluginContext.Provider value={mockValue}>
      {children}
    </NativePluginContext.Provider>
  );
};

// ============================================================================
// Query Client Factory
// ============================================================================

/**
 * Create a new QueryClient for testing with appropriate defaults
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// ============================================================================
// All Providers Wrapper
// ============================================================================

interface AllProvidersProps extends WrapperProps {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  queryClient = createTestQueryClient(),
  initialRoute = '/',
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          {children}
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// ============================================================================
// Custom Render Functions
// ============================================================================

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderWithUserResult {
  const {
    initialRoute = '/',
    routes,
    withRouter = true,
    withQueryClient = true,
    queryClient = createTestQueryClient(),
    mockLocalStorage = {},
    ...renderOptions
  } = options;

  // Set up mock localStorage
  Object.entries(mockLocalStorage).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });

  const Wrapper: React.FC<WrapperProps> = ({ children }) => {
    let wrappedChildren = children;

    // Wrap with QueryClient if needed
    if (withQueryClient) {
      wrappedChildren = (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>{wrappedChildren}</TooltipProvider>
        </QueryClientProvider>
      );
    }

    // Wrap with Router if needed
    if (withRouter) {
      if (routes) {
        wrappedChildren = (
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Routes>
          </MemoryRouter>
        );
      } else {
        wrappedChildren = (
          <MemoryRouter initialEntries={[initialRoute]}>
            {wrappedChildren}
          </MemoryRouter>
        );
      }
    }

    return <>{wrappedChildren}</>;
  };

  const user = userEvent.setup();
  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...renderResult,
    user,
  };
}

/**
 * Render with user events setup - simpler version for basic tests
 */
export function renderWithUser(ui: ReactElement): RenderWithUserResult {
  const user = userEvent.setup();
  return {
    ...render(ui),
    user,
  };
}

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Create mock guest user localStorage state
 */
export const createGuestUserState = (overrides: Record<string, string> = {}): Record<string, string> => ({
  pet_paradise_guest_chosen: 'true',
  pet_paradise_guest_id: 'guest-test-user-' + Math.random().toString(36).substr(2, 9),
  ...overrides,
});

/**
 * Create mock XP state
 */
export const createXPState = (level = 1, xp = 0): string => {
  return JSON.stringify({
    currentXP: xp,
    currentLevel: level,
    totalXP: xp,
  });
};

/**
 * Create mock coin state
 */
export const createCoinState = (coins = 100): string => {
  return coins.toString();
};

/**
 * Create mock shop inventory state
 */
export const createShopInventoryState = (
  options: {
    ownedCharacters?: string[];
    ownedBackgrounds?: string[];
    equippedBackground?: string | null;
  } = {}
): string => {
  return JSON.stringify({
    ownedCharacters: options.ownedCharacters ?? [],
    ownedBackgrounds: options.ownedBackgrounds ?? [],
    equippedBackground: options.equippedBackground ?? null,
  });
};

/**
 * Create mock streak state
 */
export const createStreakState = (
  options: {
    currentStreak?: number;
    longestStreak?: number;
    lastCheckIn?: string;
    streakFreezes?: number;
  } = {}
): string => {
  return JSON.stringify({
    currentStreak: options.currentStreak ?? 0,
    longestStreak: options.longestStreak ?? 0,
    lastCheckIn: options.lastCheckIn ?? null,
    streakFreezes: options.streakFreezes ?? 0,
  });
};

/**
 * Create mock timer state
 */
export const createTimerState = (
  options: {
    isRunning?: boolean;
    duration?: number;
    remaining?: number;
    startedAt?: number;
  } = {}
): string => {
  return JSON.stringify({
    isRunning: options.isRunning ?? false,
    duration: options.duration ?? 25 * 60 * 1000,
    remaining: options.remaining ?? 25 * 60 * 1000,
    startedAt: options.startedAt ?? null,
  });
};

/**
 * Create complete app state for testing
 */
export const createFullAppState = (
  options: {
    coins?: number;
    level?: number;
    xp?: number;
    streak?: number;
    ownedCharacters?: string[];
  } = {}
): Record<string, string> => {
  return {
    ...createGuestUserState(),
    petparadise_coins: createCoinState(options.coins ?? 1000),
    petparadise_xp: createXPState(options.level ?? 3, options.xp ?? 500),
    petparadise_streak: createStreakState({ currentStreak: options.streak ?? 5 }),
    petIsland_shopInventory: createShopInventoryState({
      ownedCharacters: options.ownedCharacters ?? ['default-pet'],
    }),
  };
};

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Wait for element to appear with custom timeout
 */
export const waitForElement = async (
  callback: () => HTMLElement | null,
  timeout = 5000
): Promise<HTMLElement> => {
  return waitFor(
    () => {
      const element = callback();
      if (!element) throw new Error('Element not found');
      return element;
    },
    { timeout }
  );
};

/**
 * Wait for loading to complete
 */
export const waitForLoadingToComplete = async (timeout = 5000): Promise<void> => {
  await waitFor(
    () => {
      const loadingElements = screen.queryAllByRole('status');
      const spinners = screen.queryAllByText(/loading/i);
      if (loadingElements.length > 0 || spinners.length > 0) {
        throw new Error('Still loading');
      }
    },
    { timeout }
  );
};

/**
 * Simulate navigation and wait for route change
 */
export const navigateAndWait = async (
  user: ReturnType<typeof userEvent.setup>,
  linkText: string | RegExp,
  expectedUrl: string | RegExp
): Promise<void> => {
  const link = screen.getByRole('link', { name: linkText });
  await user.click(link);

  await waitFor(() => {
    // Check pathname matches expected URL
    if (typeof expectedUrl === 'string') {
      if (window.location.pathname !== expectedUrl) {
        throw new Error(`Expected ${expectedUrl} but got ${window.location.pathname}`);
      }
    } else {
      if (!expectedUrl.test(window.location.pathname)) {
        throw new Error(`Expected ${expectedUrl} but got ${window.location.pathname}`);
      }
    }
  });
};

// ============================================================================
// Common Assertions (use with expect from test file)
// ============================================================================

/**
 * Get element with specific text for assertions
 */
export const getVisibleElement = (text: string | RegExp): HTMLElement => {
  return screen.getByText(text);
};

/**
 * Query for error messages
 */
export const queryErrorMessages = (): HTMLElement[] => {
  const errorPatterns = [
    /error/i,
    /something went wrong/i,
    /oops/i,
    /failed/i,
  ];

  const allErrors: HTMLElement[] = [];
  errorPatterns.forEach((pattern) => {
    const elements = screen.queryAllByText(pattern);
    elements.forEach((el) => {
      if (!el.closest('[data-testid="error-boundary"]')) {
        allErrors.push(el);
      }
    });
  });
  return allErrors;
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Create a mock function that tracks calls and returns values
 */
export const createMockFn = <R,>(
  returnValue?: R
) => {
  const calls: unknown[][] = [];
  const mockFn = vi.fn((...args: unknown[]) => {
    calls.push(args);
    return returnValue as R;
  });
  return Object.assign(mockFn, { calls });
};

/**
 * Mock toast notifications
 */
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

vi.mock('sonner', () => ({
  toast: mockToast,
}));

// ============================================================================
// Cleanup Utilities
// ============================================================================

/**
 * Clean up all test state
 */
export const cleanupTestState = (): void => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
};

// ============================================================================
// Re-exports from Testing Library
// ============================================================================

export {
  screen,
  waitFor,
  within,
  fireEvent,
  act,
} from '@testing-library/react';

export { default as userEvent } from '@testing-library/user-event';
