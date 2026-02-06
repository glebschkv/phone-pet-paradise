/**
 * Account Creation Database Tests
 *
 * Tests the account creation and authentication flows including:
 * - Guest mode creation and persistence
 * - Supabase session detection and user setup
 * - Auth state transitions (guest → signed in → signed out)
 * - Error handling during authentication
 * - Data isolation between guest and authenticated users
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, _resetAuthForTesting } from '@/hooks/useAuth';

// ─── Mock Dependencies ───────────────────────────────────────────────

vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  };
  return {
    supabase: mockSupabase,
    isSupabaseConfigured: true,
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  authLogger: { debug: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';
const mockSupabase = supabase as unknown as {
  auth: {
    getSession: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
};

// ─── Constants ────────────────────────────────────────────────────────

const GUEST_ID_KEY = 'pet_paradise_guest_id';
const GUEST_CHOSEN_KEY = 'pet_paradise_guest_chosen';

const mockSession = {
  user: {
    id: 'user-abc-123',
    email: 'player@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
  access_token: 'token-abc-123',
};

// ─── Tests ───────────────────────────────────────────────────────────

describe('Account Database – Guest Mode', () => {
  const mockSubscription = { unsubscribe: vi.fn() };

  beforeEach(() => {
    _resetAuthForTesting();
    localStorage.clear();
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a guest user with unique ID', async () => {
    localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isGuestMode).toBe(true);
    expect(result.current.user).toBeTruthy();
    expect(result.current.user?.id).toMatch(/^guest-/);
    expect(result.current.user?.email).toBe('guest@local');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should persist guest ID to localStorage', async () => {
    localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const savedGuestId = localStorage.getItem(GUEST_ID_KEY);
    expect(savedGuestId).toBeTruthy();
    expect(savedGuestId).toMatch(/^guest-/);
    expect(result.current.user?.id).toBe(savedGuestId);
  });

  it('should reuse existing guest ID across sessions', async () => {
    const existingGuestId = 'guest-persistent-id';
    localStorage.setItem(GUEST_ID_KEY, existingGuestId);
    localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user?.id).toBe(existingGuestId);
    expect(localStorage.getItem(GUEST_ID_KEY)).toBe(existingGuestId);
  });

  it('should not auto-enable guest mode without explicit choice', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isGuestMode).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should enable guest mode via continueAsGuest', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.continueAsGuest();
    });

    expect(result.current.isGuestMode).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem(GUEST_CHOSEN_KEY)).toBe('true');
  });

  it('should mark guest user metadata correctly', async () => {
    localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user?.user_metadata.is_guest).toBe(true);
    expect(result.current.user?.aud).toBe('guest');
  });
});

describe('Account Database – Supabase Authentication', () => {
  const mockSubscription = { unsubscribe: vi.fn() };

  beforeEach(() => {
    _resetAuthForTesting();
    localStorage.clear();
    vi.clearAllMocks();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect existing Supabase session on init', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.isGuestMode).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should clear guest mode when real session exists', async () => {
    localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isGuestMode).toBe(false);
    expect(localStorage.getItem(GUEST_CHOSEN_KEY)).toBeNull();
  });

  it('should handle auth state change to SIGNED_IN', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];

    act(() => {
      callback('SIGNED_IN', mockSession);
    });

    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.isGuestMode).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle auth state change to SIGNED_OUT', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];

    act(() => {
      callback('SIGNED_OUT', null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isGuestMode).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set up auth state change subscription', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderHook(() => useAuth());

    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(typeof mockSupabase.auth.onAuthStateChange.mock.calls[0][0]).toBe('function');
  });

  it('should manage auth subscription at module level (singleton)', async () => {
    // With the singleton auth pattern, the subscription is registered once
    // at module level and shared by all hook instances. Individual hook
    // unmounts do NOT unsubscribe — the subscription persists for the
    // lifetime of the app. _resetAuthForTesting() handles test cleanup.
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderHook(() => useAuth());

    // Subscription is registered once at module level
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });
});

describe('Account Database – Error Handling', () => {
  const mockSubscription = { unsubscribe: vi.fn() };

  beforeEach(() => {
    _resetAuthForTesting();
    localStorage.clear();
    vi.clearAllMocks();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle session check error gracefully', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Network error' },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not crash, just leave user as null
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should fallback to guest mode on error if previously chosen', async () => {
    localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Service unavailable' },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isGuestMode).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle getSession throwing an exception', async () => {
    mockSupabase.auth.getSession.mockRejectedValue(new Error('Catastrophic failure'));

    localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should recover gracefully to guest mode
    expect(result.current.isGuestMode).toBe(true);
  });
});

describe('Account Database – Sign Out', () => {
  const mockSubscription = { unsubscribe: vi.fn() };

  beforeEach(() => {
    _resetAuthForTesting();
    localStorage.clear();
    vi.clearAllMocks();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });

    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should clear all auth state on sign out from Supabase session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isGuestMode).toBe(false);
    expect(localStorage.getItem(GUEST_ID_KEY)).toBeNull();
    expect(localStorage.getItem(GUEST_CHOSEN_KEY)).toBeNull();
  });

  it('should call supabase.auth.signOut with global scope', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  it('should clear all state on guest mode sign out', async () => {
    localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isGuestMode).toBe(true);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isGuestMode).toBe(false);
    expect(localStorage.getItem(GUEST_ID_KEY)).toBeNull();
  });

  it('should complete sign out successfully so React Router can redirect', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    // Navigation to /auth is handled by React Router in Index.tsx when
    // isAuthenticated becomes false, not by setting window.location.href
    expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should handle sign out error without crashing', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    mockSupabase.auth.signOut.mockResolvedValue({
      error: { message: 'Sign out failed' },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // signOut re-throws errors after showing a toast, so we must catch it
    await expect(async () => {
      await act(async () => {
        await result.current.signOut();
      });
    }).rejects.toThrow();

    // User state should remain since sign out failed
    expect(result.current.user).toBeTruthy();
  });
});

describe('Account Database – Session Transition Flows', () => {
  const mockSubscription = { unsubscribe: vi.fn() };

  beforeEach(() => {
    _resetAuthForTesting();
    localStorage.clear();
    vi.clearAllMocks();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('guest → signed in: should transition from guest to authenticated user', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Start as guest
    act(() => {
      result.current.continueAsGuest();
    });

    expect(result.current.isGuestMode).toBe(true);

    // Simulate Supabase auth event
    const callback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];
    act(() => {
      callback('SIGNED_IN', mockSession);
    });

    expect(result.current.isGuestMode).toBe(false);
    expect(result.current.user?.id).toBe('user-abc-123');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('signed in → signed out → guest: full lifecycle', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should start authenticated
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isGuestMode).toBe(false);

    // Sign out event
    const callback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];
    act(() => {
      callback('SIGNED_OUT', null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    // Continue as guest
    act(() => {
      result.current.continueAsGuest();
    });

    expect(result.current.isGuestMode).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
