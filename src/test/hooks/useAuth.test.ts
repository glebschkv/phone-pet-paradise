import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

// Mock the Supabase module
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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  authLogger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Import the mocked supabase after mocking
import { supabase } from '@/integrations/supabase/client';
const mockSupabase = supabase as unknown as {
  auth: {
    getSession: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
  };
};

describe('useAuth', () => {
  const GUEST_ID_KEY = 'pet_paradise_guest_id';
  const GUEST_CHOSEN_KEY = 'pet_paradise_guest_chosen';

  // Mock subscription object
  const mockSubscription = {
    unsubscribe: vi.fn(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Default mock: no session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Mock auth state change listener
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Guest Mode Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should create guest user when no session exists and guest mode chosen', async () => {
      localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isGuestMode).toBe(true);
      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.email).toBe('guest@local');
      expect(result.current.user?.user_metadata.is_guest).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should generate and persist guest ID', async () => {
      localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const guestId = localStorage.getItem(GUEST_ID_KEY);
      expect(guestId).toBeTruthy();
      expect(guestId).toMatch(/^guest-/);
      expect(result.current.user?.id).toBe(guestId);
    });

    it('should reuse existing guest ID', async () => {
      const existingGuestId = 'guest-existing-id';
      localStorage.setItem(GUEST_ID_KEY, existingGuestId);
      localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user?.id).toBe(existingGuestId);
      expect(localStorage.getItem(GUEST_ID_KEY)).toBe(existingGuestId);
    });

    it('should not automatically enable guest mode without choice', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isGuestMode).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Supabase Authentication', () => {
    it('should set user when valid session exists', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'token-123',
      };

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

    it('should clear guest mode choice when Supabase session exists', async () => {
      localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'token-123',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(localStorage.getItem(GUEST_CHOSEN_KEY)).toBeNull();
      expect(result.current.isGuestMode).toBe(false);
    });

    it('should handle session check errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Network error' },
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should fallback to guest mode on error if previously chosen', async () => {
      localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Network error' },
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isGuestMode).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('continueAsGuest', () => {
    it('should enable guest mode when called', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.continueAsGuest();
      });

      expect(result.current.isGuestMode).toBe(true);
      expect(result.current.user).toBeTruthy();
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem(GUEST_CHOSEN_KEY)).toBe('true');
    });
  });

  describe('Sign Out Functionality', () => {
    it('should sign out from Supabase session successfully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'token-123',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isGuestMode).toBe(false);
      expect(localStorage.getItem(GUEST_CHOSEN_KEY)).toBeNull();
      expect(localStorage.getItem(GUEST_ID_KEY)).toBeNull();
    });

    it('should sign out from guest mode successfully', async () => {
      localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true,
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
      expect(localStorage.getItem(GUEST_CHOSEN_KEY)).toBeNull();
      expect(localStorage.getItem(GUEST_ID_KEY)).toBeNull();
    });

    it('should handle sign out errors gracefully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'token-123',
      };

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

      await act(async () => {
        await result.current.signOut();
      });

      // Should still have user since sign out failed
      expect(result.current.user).toBeTruthy();
    });
  });

  describe('Auth State Changes', () => {
    it('should handle SIGNED_OUT event', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Get the callback function passed to onAuthStateChange
      const callback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];

      // Simulate SIGNED_OUT event
      act(() => {
        callback('SIGNED_OUT', null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isGuestMode).toBe(false);
      expect(localStorage.getItem(GUEST_CHOSEN_KEY)).toBeNull();
    });

    it('should handle new session from auth state change', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newSession = {
        user: {
          id: 'new-user-123',
          email: 'newuser@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'new-token-123',
      };

      // Get the callback function passed to onAuthStateChange
      const callback = mockSupabase.auth.onAuthStateChange.mock.calls[0][0];

      // Simulate SIGNED_IN event
      act(() => {
        callback('SIGNED_IN', newSession);
      });

      expect(result.current.user).toEqual(newSession.user);
      expect(result.current.session).toEqual(newSession);
      expect(result.current.isGuestMode).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuestMode).toBe(false);
    });

    it('should provide continueAsGuest function', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.continueAsGuest).toBe('function');
    });

    it('should provide signOut function', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.signOut).toBe('function');
    });

    it('should correctly calculate isAuthenticated for Supabase user', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'token-123',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should correctly calculate isAuthenticated for guest user', async () => {
      localStorage.setItem(GUEST_CHOSEN_KEY, 'true');

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });
});
