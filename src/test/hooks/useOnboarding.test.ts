import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnboarding } from '@/hooks/useOnboarding';

describe('useOnboarding', () => {
  const STORAGE_KEY = 'pet_paradise_onboarding_completed';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should resolve to false when no localStorage value exists', async () => {
      const { result } = renderHook(() => useOnboarding());

      // After useEffect runs, hasCompletedOnboarding should be false
      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });
    });

    it('should set hasCompletedOnboarding to false when no localStorage value', async () => {
      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });
    });

    it('should set hasCompletedOnboarding to true when localStorage is true', async () => {
      localStorage.setItem(STORAGE_KEY, 'true');

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(true);
      });
    });

    it('should set hasCompletedOnboarding to false when localStorage is not true', async () => {
      localStorage.setItem(STORAGE_KEY, 'false');

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });
    });

    it('should set hasCompletedOnboarding to false for invalid localStorage value', async () => {
      localStorage.setItem(STORAGE_KEY, 'invalid');

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });
    });
  });

  describe('API Methods', () => {
    it('should provide all expected methods', async () => {
      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).not.toBeNull();
      });

      expect(typeof result.current.completeOnboarding).toBe('function');
      expect(typeof result.current.resetOnboarding).toBe('function');
    });
  });

  describe('completeOnboarding', () => {
    it('should set hasCompletedOnboarding to true', async () => {
      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });

      act(() => {
        result.current.completeOnboarding();
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
    });

    it('should persist completion to localStorage', async () => {
      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });

      act(() => {
        result.current.completeOnboarding();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('should remain true after multiple calls', async () => {
      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });

      act(() => {
        result.current.completeOnboarding();
        result.current.completeOnboarding();
        result.current.completeOnboarding();
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });
  });

  describe('resetOnboarding', () => {
    it('should set hasCompletedOnboarding to false', async () => {
      localStorage.setItem(STORAGE_KEY, 'true');

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(true);
      });

      act(() => {
        result.current.resetOnboarding();
      });

      expect(result.current.hasCompletedOnboarding).toBe(false);
    });

    it('should remove value from localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, 'true');

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(true);
      });

      act(() => {
        result.current.resetOnboarding();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should work even when already false', async () => {
      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });

      act(() => {
        result.current.resetOnboarding();
      });

      expect(result.current.hasCompletedOnboarding).toBe(false);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('Complete and Reset Flow', () => {
    it('should handle complete -> reset -> complete flow', async () => {
      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });

      // Complete onboarding
      act(() => {
        result.current.completeOnboarding();
      });
      expect(result.current.hasCompletedOnboarding).toBe(true);

      // Reset onboarding
      act(() => {
        result.current.resetOnboarding();
      });
      expect(result.current.hasCompletedOnboarding).toBe(false);

      // Complete again
      act(() => {
        result.current.completeOnboarding();
      });
      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });
  });

  describe('Persistence Across Remounts', () => {
    it('should persist completed state across remounts', async () => {
      const { result, unmount } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });

      act(() => {
        result.current.completeOnboarding();
      });

      unmount();

      // Remount
      const { result: newResult } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(newResult.current.hasCompletedOnboarding).toBe(true);
      });
    });

    it('should persist reset state across remounts', async () => {
      localStorage.setItem(STORAGE_KEY, 'true');

      const { result, unmount } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(true);
      });

      act(() => {
        result.current.resetOnboarding();
      });

      unmount();

      // Remount
      const { result: newResult } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(newResult.current.hasCompletedOnboarding).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string in localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, '');

      const { result } = renderHook(() => useOnboarding());

      await waitFor(() => {
        expect(result.current.hasCompletedOnboarding).toBe(false);
      });
    });
  });
});
