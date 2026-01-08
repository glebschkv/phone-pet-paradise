/**
 * Shared Test Utilities and Mocks
 *
 * Centralized mock factories to reduce duplication across test files.
 */

import { vi } from 'vitest';

// ============================================================================
// SUPABASE MOCKS
// ============================================================================

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  const mockSubscription = {
    unsubscribe: vi.fn(),
  };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: mockSubscription },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      }),
      signInWithOtp: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: { success: true },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    _subscription: mockSubscription,
  };
}

/**
 * Create a mock authenticated session
 */
export function createMockSession(overrides: Partial<{
  userId: string;
  email: string;
  accessToken: string;
  expiresAt: number;
}> = {}) {
  const defaults = {
    userId: 'test-user-id',
    email: 'test@example.com',
    accessToken: 'mock-access-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };

  const config = { ...defaults, ...overrides };

  return {
    access_token: config.accessToken,
    refresh_token: 'mock-refresh-token',
    expires_at: config.expiresAt,
    expires_in: 3600,
    token_type: 'bearer',
    user: createMockUser({ id: config.userId, email: config.email }),
  };
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides: Partial<{
  id: string;
  email: string;
  isGuest: boolean;
}> = {}) {
  const defaults = {
    id: 'test-user-id',
    email: 'test@example.com',
    isGuest: false,
  };

  const config = { ...defaults, ...overrides };

  return {
    id: config.id,
    email: config.email,
    aud: config.isGuest ? 'guest' : 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_metadata: {
      is_guest: config.isGuest,
    },
    app_metadata: {},
  };
}

// ============================================================================
// TOAST MOCKS
// ============================================================================

/**
 * Create mock toast functions
 */
export function createMockToast() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  };
}

// ============================================================================
// LOGGER MOCKS
// ============================================================================

/**
 * Create a mock logger
 */
export function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

// ============================================================================
// STORAGE MOCKS
// ============================================================================

/**
 * Create a mock localStorage with optional initial data
 */
export function createMockStorage(initialData: Record<string, string> = {}) {
  let storage: Record<string, string> = { ...initialData };

  return {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      storage = {};
    }),
    get length() {
      return Object.keys(storage).length;
    },
    key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
    _getData: () => ({ ...storage }),
    _setData: (data: Record<string, string>) => {
      storage = { ...data };
    },
  };
}

// ============================================================================
// NAVIGATION MOCKS
// ============================================================================

/**
 * Create a mock navigate function for react-router
 */
export function createMockNavigate() {
  return vi.fn();
}

// ============================================================================
// TIMER UTILITIES
// ============================================================================

/**
 * Advance timers and flush promises
 */
export async function advanceTimersAndFlush(ms: number) {
  vi.advanceTimersByTime(ms);
  await vi.runAllTimersAsync();
}

/**
 * Wait for all pending promises to resolve
 */
export async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// ============================================================================
// CRYPTO MOCKS
// ============================================================================

/**
 * Mock crypto.getRandomValues for deterministic testing
 */
export function mockCryptoGetRandomValues(values: number[]) {
  let index = 0;
  return vi.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
    if (array instanceof Uint8Array || array instanceof Uint32Array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = values[index % values.length];
        index++;
      }
    }
    return array;
  });
}

// ============================================================================
// EVENT HELPERS
// ============================================================================

/**
 * Create and dispatch a custom event
 */
export function dispatchCustomEvent(name: string, detail?: unknown) {
  const event = new CustomEvent(name, { detail });
  window.dispatchEvent(event);
  return event;
}

/**
 * Create a mock event handler that tracks calls
 */
export function createMockEventHandler() {
  const handler = vi.fn();
  return {
    handler,
    getCallCount: () => handler.mock.calls.length,
    getLastCall: () => handler.mock.calls[handler.mock.calls.length - 1],
    reset: () => handler.mockClear(),
  };
}
