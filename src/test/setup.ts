import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }));

  // Mock Capacitor
  vi.mock('@capacitor/core', () => ({
    Capacitor: {
      isNativePlatform: () => false,
      getPlatform: () => 'web',
    },
    registerPlugin: vi.fn(() => ({
      checkPermissions: vi.fn().mockResolvedValue({ status: 'granted' }),
      requestPermissions: vi.fn().mockResolvedValue({ status: 'granted' }),
      startMonitoring: vi.fn().mockResolvedValue({ monitoring: true }),
      stopMonitoring: vi.fn().mockResolvedValue({ success: true }),
      startAppBlocking: vi.fn().mockResolvedValue({ success: true, appsBlocked: 0 }),
      stopAppBlocking: vi.fn().mockResolvedValue({ success: true, shieldAttempts: 0 }),
      getBlockingStatus: vi.fn().mockResolvedValue({ isBlocking: false }),
      getUsageData: vi.fn().mockResolvedValue({ timeAwayMinutes: 0 }),
      recordActiveTime: vi.fn().mockResolvedValue({ success: true }),
      triggerHapticFeedback: vi.fn().mockResolvedValue({ success: true }),
      getProducts: vi.fn().mockResolvedValue({ products: [] }),
      purchase: vi.fn().mockResolvedValue({ success: true }),
      restorePurchases: vi.fn().mockResolvedValue({ success: true }),
      getSubscriptionStatus: vi.fn().mockResolvedValue({ hasActiveSubscription: false }),
    })),
  }));
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
