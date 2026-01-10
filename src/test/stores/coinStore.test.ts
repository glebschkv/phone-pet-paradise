import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useCoinStore,
  useCoinBalance,
  useTotalEarned,
  useTotalSpent,
  subscribeToCoinChanges,
} from '@/stores/coinStore';

// Mock the logger to avoid console noise
vi.mock('@/lib/logger', () => ({
  coinLogger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock the validated storage
vi.mock('@/lib/validated-zustand-storage', () => ({
  createValidatedStorage: () => ({
    getItem: () => null,
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }),
}));

describe('coinStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useCoinStore.getState().resetCoins();
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have zero balance initially', () => {
      const { balance } = useCoinStore.getState();
      expect(balance).toBe(0);
    });

    it('should have zero totalEarned initially', () => {
      const { totalEarned } = useCoinStore.getState();
      expect(totalEarned).toBe(0);
    });

    it('should have zero totalSpent initially', () => {
      const { totalSpent } = useCoinStore.getState();
      expect(totalSpent).toBe(0);
    });

    it('should not have pending server validation initially', () => {
      const { pendingServerValidation } = useCoinStore.getState();
      expect(pendingServerValidation).toBe(false);
    });

    it('should have null lastServerSync initially', () => {
      const { lastServerSync } = useCoinStore.getState();
      expect(lastServerSync).toBeNull();
    });
  });

  describe('addCoins', () => {
    it('should add coins to balance', () => {
      const { addCoins } = useCoinStore.getState();

      act(() => {
        addCoins(100);
      });

      expect(useCoinStore.getState().balance).toBe(100);
    });

    it('should update totalEarned when adding coins', () => {
      const { addCoins } = useCoinStore.getState();

      act(() => {
        addCoins(100);
      });

      expect(useCoinStore.getState().totalEarned).toBe(100);
    });

    it('should accumulate coins over multiple additions', () => {
      const { addCoins } = useCoinStore.getState();

      act(() => {
        addCoins(50);
        addCoins(75);
        addCoins(25);
      });

      expect(useCoinStore.getState().balance).toBe(150);
      expect(useCoinStore.getState().totalEarned).toBe(150);
    });

    it('should mark pending server validation after adding', () => {
      const { addCoins } = useCoinStore.getState();

      act(() => {
        addCoins(100);
      });

      expect(useCoinStore.getState().pendingServerValidation).toBe(true);
    });

    it('should not add negative amounts', () => {
      const { addCoins } = useCoinStore.getState();

      act(() => {
        addCoins(-50);
      });

      expect(useCoinStore.getState().balance).toBe(0);
    });

    it('should not add zero coins', () => {
      const { addCoins } = useCoinStore.getState();

      act(() => {
        addCoins(0);
      });

      expect(useCoinStore.getState().balance).toBe(0);
      expect(useCoinStore.getState().pendingServerValidation).toBe(false);
    });

    it('should handle decimal amounts', () => {
      const { addCoins } = useCoinStore.getState();

      act(() => {
        addCoins(100.99);
      });

      // validateCoinTransaction clamps the value but doesn't floor it
      expect(useCoinStore.getState().balance).toBe(100.99);
    });
  });

  describe('spendCoins', () => {
    beforeEach(() => {
      // Setup initial balance
      act(() => {
        useCoinStore.getState().addCoins(500);
        useCoinStore.getState().setPendingValidation(false); // reset for test clarity
      });
    });

    it('should spend coins and reduce balance', () => {
      const { spendCoins } = useCoinStore.getState();

      act(() => {
        spendCoins(200);
      });

      expect(useCoinStore.getState().balance).toBe(300);
    });

    it('should update totalSpent when spending', () => {
      const { spendCoins } = useCoinStore.getState();

      act(() => {
        spendCoins(200);
      });

      expect(useCoinStore.getState().totalSpent).toBe(200);
    });

    it('should return true on successful spend', () => {
      const { spendCoins } = useCoinStore.getState();

      let result = false;
      act(() => {
        result = spendCoins(200);
      });

      expect(result).toBe(true);
    });

    it('should return false when insufficient balance', () => {
      const { spendCoins } = useCoinStore.getState();

      let result = true;
      act(() => {
        result = spendCoins(1000);
      });

      expect(result).toBe(false);
      expect(useCoinStore.getState().balance).toBe(500); // unchanged
    });

    it('should not allow spending negative amounts', () => {
      const { spendCoins } = useCoinStore.getState();

      let result = true;
      act(() => {
        result = spendCoins(-50);
      });

      expect(result).toBe(false);
      expect(useCoinStore.getState().balance).toBe(500);
    });

    it('should mark pending server validation after spending', () => {
      const { spendCoins } = useCoinStore.getState();

      act(() => {
        spendCoins(100);
      });

      expect(useCoinStore.getState().pendingServerValidation).toBe(true);
    });

    it('should allow spending exact balance', () => {
      const { spendCoins } = useCoinStore.getState();

      let result = false;
      act(() => {
        result = spendCoins(500);
      });

      expect(result).toBe(true);
      expect(useCoinStore.getState().balance).toBe(0);
    });
  });

  describe('canAfford', () => {
    beforeEach(() => {
      act(() => {
        useCoinStore.getState().addCoins(100);
      });
    });

    it('should return true when balance is sufficient', () => {
      const { canAfford } = useCoinStore.getState();
      expect(canAfford(50)).toBe(true);
    });

    it('should return true when amount equals balance', () => {
      const { canAfford } = useCoinStore.getState();
      expect(canAfford(100)).toBe(true);
    });

    it('should return false when balance is insufficient', () => {
      const { canAfford } = useCoinStore.getState();
      expect(canAfford(150)).toBe(false);
    });

    it('should return true for zero amount', () => {
      const { canAfford } = useCoinStore.getState();
      expect(canAfford(0)).toBe(true);
    });

    it('should return false for negative amount', () => {
      const { canAfford } = useCoinStore.getState();
      expect(canAfford(-10)).toBe(false);
    });
  });

  describe('setBalance', () => {
    it('should set balance directly', () => {
      const { setBalance } = useCoinStore.getState();

      act(() => {
        setBalance(1000);
      });

      expect(useCoinStore.getState().balance).toBe(1000);
    });

    it('should not set negative balance', () => {
      const { setBalance } = useCoinStore.getState();

      act(() => {
        setBalance(-100);
      });

      // validateCoinAmount should clamp to 0
      expect(useCoinStore.getState().balance).toBe(0);
    });
  });

  describe('syncFromServer', () => {
    it('should sync all values from server', () => {
      const { syncFromServer } = useCoinStore.getState();

      act(() => {
        syncFromServer(500, 1000, 500);
      });

      const state = useCoinStore.getState();
      expect(state.balance).toBe(500);
      expect(state.totalEarned).toBe(1000);
      expect(state.totalSpent).toBe(500);
    });

    it('should set lastServerSync timestamp', () => {
      const { syncFromServer } = useCoinStore.getState();
      const beforeSync = Date.now();

      act(() => {
        syncFromServer(500, 1000, 500);
      });

      const { lastServerSync } = useCoinStore.getState();
      expect(lastServerSync).toBeGreaterThanOrEqual(beforeSync);
    });

    it('should clear pending validation', () => {
      const { addCoins, syncFromServer } = useCoinStore.getState();

      act(() => {
        addCoins(100); // Sets pending to true
      });

      expect(useCoinStore.getState().pendingServerValidation).toBe(true);

      act(() => {
        syncFromServer(100, 100, 0);
      });

      expect(useCoinStore.getState().pendingServerValidation).toBe(false);
    });

    it('should override local state with server values', () => {
      const { addCoins, syncFromServer } = useCoinStore.getState();

      act(() => {
        addCoins(999);
      });

      act(() => {
        syncFromServer(50, 50, 0);
      });

      // Server value should win
      expect(useCoinStore.getState().balance).toBe(50);
    });
  });

  describe('resetCoins', () => {
    it('should reset all coin state to initial values', () => {
      const { addCoins, spendCoins, resetCoins } = useCoinStore.getState();

      act(() => {
        addCoins(1000);
        spendCoins(500);
      });

      act(() => {
        resetCoins();
      });

      const state = useCoinStore.getState();
      expect(state.balance).toBe(0);
      expect(state.totalEarned).toBe(0);
      expect(state.totalSpent).toBe(0);
      expect(state.pendingServerValidation).toBe(false);
      expect(state.lastServerSync).toBeNull();
    });
  });

  describe('setPendingValidation', () => {
    it('should set pending validation flag', () => {
      const { setPendingValidation } = useCoinStore.getState();

      act(() => {
        setPendingValidation(true);
      });

      expect(useCoinStore.getState().pendingServerValidation).toBe(true);

      act(() => {
        setPendingValidation(false);
      });

      expect(useCoinStore.getState().pendingServerValidation).toBe(false);
    });
  });

  describe('Selector Hooks', () => {
    it('useCoinBalance should return current balance', () => {
      act(() => {
        useCoinStore.getState().addCoins(250);
      });

      const { result } = renderHook(() => useCoinBalance());
      expect(result.current).toBe(250);
    });

    it('useTotalEarned should return total earned', () => {
      act(() => {
        useCoinStore.getState().addCoins(300);
      });

      const { result } = renderHook(() => useTotalEarned());
      expect(result.current).toBe(300);
    });

    it('useTotalSpent should return total spent', () => {
      act(() => {
        useCoinStore.getState().addCoins(500);
        useCoinStore.getState().spendCoins(150);
      });

      const { result } = renderHook(() => useTotalSpent());
      expect(result.current).toBe(150);
    });

    it('selector hooks should update on state change', () => {
      const { result } = renderHook(() => useCoinBalance());
      expect(result.current).toBe(0);

      act(() => {
        useCoinStore.getState().addCoins(100);
      });

      expect(result.current).toBe(100);
    });
  });

  describe('subscribeToCoinChanges', () => {
    it('should call callback on coin changes', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToCoinChanges(callback);

      act(() => {
        useCoinStore.getState().addCoins(100);
      });

      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });

    it('should not call callback after unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToCoinChanges(callback);

      unsubscribe();

      act(() => {
        useCoinStore.getState().addCoins(100);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should receive updated state in callback', () => {
      let receivedBalance = 0;
      const callback = vi.fn((state: { balance: number }) => {
        receivedBalance = state.balance;
      });

      const unsubscribe = subscribeToCoinChanges(callback);

      act(() => {
        useCoinStore.getState().addCoins(200);
      });

      expect(receivedBalance).toBe(200);
      unsubscribe();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large coin amounts', () => {
      const { addCoins, canAfford } = useCoinStore.getState();

      act(() => {
        addCoins(Number.MAX_SAFE_INTEGER);
      });

      expect(canAfford(1000000)).toBe(true);
    });

    it('should handle rapid successive operations', () => {
      const { addCoins, spendCoins } = useCoinStore.getState();

      act(() => {
        for (let i = 0; i < 100; i++) {
          addCoins(10);
        }
        for (let i = 0; i < 50; i++) {
          spendCoins(10);
        }
      });

      expect(useCoinStore.getState().balance).toBe(500);
      expect(useCoinStore.getState().totalEarned).toBe(1000);
      expect(useCoinStore.getState().totalSpent).toBe(500);
    });
  });
});
