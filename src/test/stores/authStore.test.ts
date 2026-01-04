import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock logger before importing store
vi.mock('@/lib/logger', () => ({
  authLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-1234-5678-90ab-cdef';
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockUUID),
});

import {
  useAuthStore,
  useGuestId,
  useIsGuestMode,
  useHasChosenGuestMode,
} from '@/stores/authStore';

describe('authStore', () => {
  const STORAGE_KEY = 'nomo_auth';

  beforeEach(() => {
    localStorage.clear();
    // Reset store to initial state
    useAuthStore.setState({
      guestId: null,
      isGuestMode: false,
      hasChosenGuestMode: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with null guestId', () => {
      const state = useAuthStore.getState();
      expect(state.guestId).toBeNull();
    });

    it('should initialize with isGuestMode as false', () => {
      const state = useAuthStore.getState();
      expect(state.isGuestMode).toBe(false);
    });

    it('should initialize with hasChosenGuestMode as false', () => {
      const state = useAuthStore.getState();
      expect(state.hasChosenGuestMode).toBe(false);
    });

    it('should have all required actions available', () => {
      const state = useAuthStore.getState();
      expect(typeof state.setGuestId).toBe('function');
      expect(typeof state.generateGuestId).toBe('function');
      expect(typeof state.setGuestMode).toBe('function');
      expect(typeof state.setGuestChosen).toBe('function');
      expect(typeof state.clearAuth).toBe('function');
      expect(typeof state.getOrCreateGuestId).toBe('function');
    });
  });

  describe('setGuestId', () => {
    it('should set the guest ID', () => {
      const { setGuestId } = useAuthStore.getState();

      act(() => {
        setGuestId('custom-guest-id');
      });

      const state = useAuthStore.getState();
      expect(state.guestId).toBe('custom-guest-id');
    });

    it('should overwrite existing guest ID', () => {
      const { setGuestId } = useAuthStore.getState();

      act(() => {
        setGuestId('first-id');
        setGuestId('second-id');
      });

      const state = useAuthStore.getState();
      expect(state.guestId).toBe('second-id');
    });
  });

  describe('generateGuestId', () => {
    it('should generate and set a new guest ID', () => {
      const { generateGuestId } = useAuthStore.getState();

      let generatedId: string;
      act(() => {
        generatedId = generateGuestId();
      });

      const state = useAuthStore.getState();
      expect(state.guestId).toBe(`guest-${mockUUID}`);
      expect(generatedId!).toBe(`guest-${mockUUID}`);
    });

    it('should return the generated ID', () => {
      const { generateGuestId } = useAuthStore.getState();

      let result: string;
      act(() => {
        result = generateGuestId();
      });

      expect(result!).toBe(`guest-${mockUUID}`);
    });
  });

  describe('setGuestMode', () => {
    it('should enable guest mode', () => {
      const { setGuestMode } = useAuthStore.getState();

      act(() => {
        setGuestMode(true);
      });

      const state = useAuthStore.getState();
      expect(state.isGuestMode).toBe(true);
    });

    it('should disable guest mode', () => {
      const { setGuestMode } = useAuthStore.getState();

      act(() => {
        setGuestMode(true);
        setGuestMode(false);
      });

      const state = useAuthStore.getState();
      expect(state.isGuestMode).toBe(false);
    });
  });

  describe('setGuestChosen', () => {
    it('should set guest chosen flag to true', () => {
      const { setGuestChosen } = useAuthStore.getState();

      act(() => {
        setGuestChosen(true);
      });

      const state = useAuthStore.getState();
      expect(state.hasChosenGuestMode).toBe(true);
    });

    it('should set guest chosen flag to false', () => {
      const { setGuestChosen } = useAuthStore.getState();

      act(() => {
        setGuestChosen(true);
        setGuestChosen(false);
      });

      const state = useAuthStore.getState();
      expect(state.hasChosenGuestMode).toBe(false);
    });
  });

  describe('clearAuth', () => {
    it('should reset all auth state to initial values', () => {
      const { setGuestId, setGuestMode, setGuestChosen, clearAuth } = useAuthStore.getState();

      act(() => {
        setGuestId('some-id');
        setGuestMode(true);
        setGuestChosen(true);
        clearAuth();
      });

      const state = useAuthStore.getState();
      expect(state.guestId).toBeNull();
      expect(state.isGuestMode).toBe(false);
      expect(state.hasChosenGuestMode).toBe(false);
    });
  });

  describe('getOrCreateGuestId', () => {
    it('should return existing guest ID if present', () => {
      const { setGuestId, getOrCreateGuestId } = useAuthStore.getState();

      act(() => {
        setGuestId('existing-id');
      });

      let result: string;
      act(() => {
        result = useAuthStore.getState().getOrCreateGuestId();
      });

      expect(result!).toBe('existing-id');
    });

    it('should generate new ID if none exists', () => {
      let result: string;
      act(() => {
        result = useAuthStore.getState().getOrCreateGuestId();
      });

      expect(result!).toBe(`guest-${mockUUID}`);
    });
  });

  describe('Selector Hooks', () => {
    it('useGuestId should return guestId', () => {
      const { setGuestId } = useAuthStore.getState();

      act(() => {
        setGuestId('hook-test-id');
      });

      const { result } = renderHook(() => useGuestId());
      expect(result.current).toBe('hook-test-id');
    });

    it('useIsGuestMode should return isGuestMode', () => {
      const { setGuestMode } = useAuthStore.getState();

      act(() => {
        setGuestMode(true);
      });

      const { result } = renderHook(() => useIsGuestMode());
      expect(result.current).toBe(true);
    });

    it('useHasChosenGuestMode should return hasChosenGuestMode', () => {
      const { setGuestChosen } = useAuthStore.getState();

      act(() => {
        setGuestChosen(true);
      });

      const { result } = renderHook(() => useHasChosenGuestMode());
      expect(result.current).toBe(true);
    });

    it('selector hooks should update when state changes', () => {
      const { result: guestIdResult } = renderHook(() => useGuestId());
      const { result: guestModeResult } = renderHook(() => useIsGuestMode());

      expect(guestIdResult.current).toBeNull();
      expect(guestModeResult.current).toBe(false);

      act(() => {
        useAuthStore.getState().setGuestId('updated-id');
        useAuthStore.getState().setGuestMode(true);
      });

      expect(guestIdResult.current).toBe('updated-id');
      expect(guestModeResult.current).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should persist state to localStorage', async () => {
      const { setGuestId, setGuestMode } = useAuthStore.getState();

      act(() => {
        setGuestId('persisted-id');
        setGuestMode(true);
      });

      // Wait for persistence middleware to save
      await new Promise(resolve => setTimeout(resolve, 50));

      const saved = localStorage.getItem(STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.state.guestId).toBe('persisted-id');
      expect(parsed.state.isGuestMode).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string guest ID', () => {
      const { setGuestId } = useAuthStore.getState();

      act(() => {
        setGuestId('');
      });

      const state = useAuthStore.getState();
      expect(state.guestId).toBe('');
    });

    it('should handle special characters in guest ID', () => {
      const { setGuestId } = useAuthStore.getState();
      const specialId = 'guest-äöü-!@#$%^&*()';

      act(() => {
        setGuestId(specialId);
      });

      const state = useAuthStore.getState();
      expect(state.guestId).toBe(specialId);
    });

    it('should handle rapid state changes', () => {
      const { setGuestId, setGuestMode, setGuestChosen } = useAuthStore.getState();

      act(() => {
        for (let i = 0; i < 100; i++) {
          setGuestId(`id-${i}`);
          setGuestMode(i % 2 === 0);
          setGuestChosen(i % 3 === 0);
        }
      });

      const state = useAuthStore.getState();
      expect(state.guestId).toBe('id-99');
      expect(state.isGuestMode).toBe(false);
      expect(state.hasChosenGuestMode).toBe(true);
    });
  });
});
