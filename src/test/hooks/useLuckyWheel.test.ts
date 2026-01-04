import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLuckyWheel } from '@/hooks/useLuckyWheel';

// Mock storage module
vi.mock('@/lib/storage-keys', () => ({
  STORAGE_KEYS: {
    LUCKY_WHEEL: 'nomo_lucky_wheel',
  },
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock achievement tracking
vi.mock('@/hooks/useAchievementTracking', () => ({
  dispatchAchievementEvent: vi.fn(),
  ACHIEVEMENT_EVENTS: {
    WHEEL_SPIN: 'wheel_spin',
  },
}));

// Mock gamification data
const mockPrizes = [
  { id: 'coins-100', name: '100 Coins', emoji: '🪙', type: 'coins', amount: 100, probability: 30, rarity: 'common', color: '#64748b' },
  { id: 'coins-200', name: '200 Coins', emoji: '💰', type: 'coins', amount: 200, probability: 25, rarity: 'common', color: '#71717a' },
  { id: 'xp-50', name: '50 XP', emoji: '⭐', type: 'xp', amount: 50, probability: 20, rarity: 'common', color: '#6366f1' },
  { id: 'xp-100', name: '100 XP', emoji: '✨', type: 'xp', amount: 100, probability: 15, rarity: 'rare', color: '#8b5cf6' },
  { id: 'jackpot', name: 'JACKPOT!', emoji: '🎰', type: 'jackpot', amount: 2500, probability: 10, rarity: 'legendary', color: '#ef4444' },
];

vi.mock('@/data/GamificationData', () => ({
  LUCKY_WHEEL_PRIZES: [
    { id: 'coins-100', name: '100 Coins', emoji: '🪙', type: 'coins', amount: 100, probability: 30, rarity: 'common', color: '#64748b' },
    { id: 'coins-200', name: '200 Coins', emoji: '💰', type: 'coins', amount: 200, probability: 25, rarity: 'common', color: '#71717a' },
    { id: 'xp-50', name: '50 XP', emoji: '⭐', type: 'xp', amount: 50, probability: 20, rarity: 'common', color: '#6366f1' },
    { id: 'xp-100', name: '100 XP', emoji: '✨', type: 'xp', amount: 100, probability: 15, rarity: 'rare', color: '#8b5cf6' },
    { id: 'jackpot', name: 'JACKPOT!', emoji: '🎰', type: 'jackpot', amount: 2500, probability: 10, rarity: 'legendary', color: '#ef4444' },
  ],
  spinWheel: vi.fn(() => mockPrizes[0]), // Default to first prize
}));

import { storage } from '@/lib/storage-keys';
import { spinWheel } from '@/data/GamificationData';
import { dispatchAchievementEvent } from '@/hooks/useAchievementTracking';

const mockStorage = storage as unknown as {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

const mockSpinWheel = spinWheel as ReturnType<typeof vi.fn>;
const mockDispatchAchievementEvent = dispatchAchievementEvent as ReturnType<typeof vi.fn>;

describe('useLuckyWheel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockStorage.get.mockReturnValue(null);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state when no saved data', () => {
      const { result } = renderHook(() => useLuckyWheel());

      expect(result.current.state.lastSpinDate).toBeNull();
      expect(result.current.state.totalSpins).toBe(0);
      expect(result.current.state.jackpotsWon).toBe(0);
      expect(result.current.state.totalCoinsWon).toBe(0);
      expect(result.current.state.totalXPWon).toBe(0);
      expect(result.current.state.spinHistory).toEqual([]);
    });

    it('should load saved state from storage', () => {
      mockStorage.get.mockReturnValue({
        lastSpinDate: '2024-01-01T00:00:00.000Z',
        totalSpins: 10,
        jackpotsWon: 2,
        totalCoinsWon: 5000,
        totalXPWon: 1000,
        spinHistory: [],
      });

      const { result } = renderHook(() => useLuckyWheel());

      expect(result.current.state.totalSpins).toBe(10);
      expect(result.current.state.jackpotsWon).toBe(2);
    });

    it('should not be spinning initially', () => {
      const { result } = renderHook(() => useLuckyWheel());

      expect(result.current.isSpinning).toBe(false);
      expect(result.current.currentPrize).toBeNull();
    });

    it('should have all required functions available', () => {
      const { result } = renderHook(() => useLuckyWheel());

      expect(typeof result.current.canSpinToday).toBe('function');
      expect(typeof result.current.getTimeUntilNextSpin).toBe('function');
      expect(typeof result.current.spin).toBe('function');
      expect(typeof result.current.getWinningSegmentIndex).toBe('function');
      expect(typeof result.current.getWheelConfig).toBe('function');
      expect(typeof result.current.getStats).toBe('function');
      expect(typeof result.current.getRecentWins).toBe('function');
      expect(typeof result.current.getRarityDistribution).toBe('function');
    });
  });

  describe('canSpinToday', () => {
    it('should return true when never spun before', () => {
      const { result } = renderHook(() => useLuckyWheel());

      expect(result.current.canSpinToday()).toBe(true);
    });

    it('should return false when already spun today', () => {
      const today = new Date().toISOString();
      mockStorage.get.mockReturnValue({
        lastSpinDate: today,
        totalSpins: 1,
        jackpotsWon: 0,
        totalCoinsWon: 100,
        totalXPWon: 0,
        spinHistory: [],
      });

      const { result } = renderHook(() => useLuckyWheel());

      expect(result.current.canSpinToday()).toBe(false);
    });

    it('should return true when last spin was yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockStorage.get.mockReturnValue({
        lastSpinDate: yesterday.toISOString(),
        totalSpins: 1,
        jackpotsWon: 0,
        totalCoinsWon: 100,
        totalXPWon: 0,
        spinHistory: [],
      });

      const { result } = renderHook(() => useLuckyWheel());

      expect(result.current.canSpinToday()).toBe(true);
    });
  });

  describe('getTimeUntilNextSpin', () => {
    it('should return 0 hours and minutes when can spin', () => {
      const { result } = renderHook(() => useLuckyWheel());

      const time = result.current.getTimeUntilNextSpin();

      expect(time.hours).toBe(0);
      expect(time.minutes).toBe(0);
    });

    it('should return time until midnight when already spun', () => {
      const today = new Date().toISOString();
      mockStorage.get.mockReturnValue({
        lastSpinDate: today,
        totalSpins: 1,
        jackpotsWon: 0,
        totalCoinsWon: 100,
        totalXPWon: 0,
        spinHistory: [],
      });

      const { result } = renderHook(() => useLuckyWheel());

      const time = result.current.getTimeUntilNextSpin();

      expect(time.hours).toBeGreaterThanOrEqual(0);
      expect(time.minutes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('spin', () => {
    it('should spin and return prize', async () => {
      mockSpinWheel.mockReturnValue(mockPrizes[0]);
      const { result } = renderHook(() => useLuckyWheel());

      let prize: typeof mockPrizes[0] | undefined;

      await act(async () => {
        const spinPromise = result.current.spin();
        vi.advanceTimersByTime(200);
        prize = await spinPromise;
      });

      expect(prize).toBeTruthy();
      expect(prize!.id).toBe('coins-100');
    });

    it('should update state after spin', async () => {
      mockSpinWheel.mockReturnValue(mockPrizes[0]); // coins-100
      const { result } = renderHook(() => useLuckyWheel());

      await act(async () => {
        const spinPromise = result.current.spin();
        vi.advanceTimersByTime(200);
        await spinPromise;
      });

      expect(result.current.state.totalSpins).toBe(1);
      expect(result.current.state.totalCoinsWon).toBe(100);
      expect(result.current.state.lastSpinDate).toBeTruthy();
    });

    it('should track jackpot wins', async () => {
      mockSpinWheel.mockReturnValue(mockPrizes[4]); // jackpot
      const { result } = renderHook(() => useLuckyWheel());

      await act(async () => {
        const spinPromise = result.current.spin();
        vi.advanceTimersByTime(200);
        await spinPromise;
      });

      expect(result.current.state.jackpotsWon).toBe(1);
    });

    it('should track XP wins', async () => {
      mockSpinWheel.mockReturnValue(mockPrizes[2]); // xp-50
      const { result } = renderHook(() => useLuckyWheel());

      await act(async () => {
        const spinPromise = result.current.spin();
        vi.advanceTimersByTime(200);
        await spinPromise;
      });

      expect(result.current.state.totalXPWon).toBe(50);
    });

    it('should reject when already spun today', async () => {
      const today = new Date().toISOString();
      mockStorage.get.mockReturnValue({
        lastSpinDate: today,
        totalSpins: 1,
        jackpotsWon: 0,
        totalCoinsWon: 100,
        totalXPWon: 0,
        spinHistory: [],
      });

      const { result } = renderHook(() => useLuckyWheel());

      await expect(result.current.spin()).rejects.toThrow('Already spun today');
    });

    it('should reject when already spinning', async () => {
      const { result } = renderHook(() => useLuckyWheel());

      // Start first spin
      act(() => {
        result.current.spin();
      });

      // Try second spin immediately
      await expect(result.current.spin()).rejects.toThrow('Already spinning');

      // Clean up first spin
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
    });

    it('should dispatch achievement event', async () => {
      mockSpinWheel.mockReturnValue(mockPrizes[0]);
      const { result } = renderHook(() => useLuckyWheel());

      await act(async () => {
        const spinPromise = result.current.spin();
        vi.advanceTimersByTime(200);
        await spinPromise;
      });

      expect(mockDispatchAchievementEvent).toHaveBeenCalled();
    });

    it('should add to spin history', async () => {
      mockSpinWheel.mockReturnValue(mockPrizes[0]);
      const { result } = renderHook(() => useLuckyWheel());

      await act(async () => {
        const spinPromise = result.current.spin();
        vi.advanceTimersByTime(200);
        await spinPromise;
      });

      expect(result.current.state.spinHistory.length).toBe(1);
      expect(result.current.state.spinHistory[0].prize.id).toBe('coins-100');
    });

    it('should limit spin history to 20 entries', async () => {
      mockStorage.get.mockReturnValue({
        lastSpinDate: null, // Reset to allow spinning
        totalSpins: 20,
        jackpotsWon: 0,
        totalCoinsWon: 2000,
        totalXPWon: 0,
        spinHistory: Array(20).fill({ prize: mockPrizes[0], timestamp: new Date().toISOString() }),
      });

      // Need to reset the date to allow spinning
      const { result, rerender } = renderHook(() => useLuckyWheel());

      mockSpinWheel.mockReturnValue(mockPrizes[1]);

      await act(async () => {
        const spinPromise = result.current.spin();
        vi.advanceTimersByTime(200);
        await spinPromise;
      });

      expect(result.current.state.spinHistory.length).toBeLessThanOrEqual(20);
    });
  });

  describe('getWinningSegmentIndex', () => {
    it('should return correct segment index for prize', () => {
      const { result } = renderHook(() => useLuckyWheel());

      expect(result.current.getWinningSegmentIndex(mockPrizes[0])).toBe(0);
      expect(result.current.getWinningSegmentIndex(mockPrizes[4])).toBe(4);
    });
  });

  describe('getWheelConfig', () => {
    it('should return wheel configuration', () => {
      const { result } = renderHook(() => useLuckyWheel());

      const config = result.current.getWheelConfig();

      expect(config.segments).toBeTruthy();
      expect(Array.isArray(config.segments)).toBe(true);
      expect(config.segmentCount).toBe(5);
    });

    it('should include segment details', () => {
      const { result } = renderHook(() => useLuckyWheel());

      const config = result.current.getWheelConfig();
      const segment = config.segments[0];

      expect(segment.id).toBeTruthy();
      expect(segment.label).toBeTruthy();
      expect(segment.emoji).toBeTruthy();
      expect(segment.color).toBeTruthy();
      expect(segment.rarity).toBeTruthy();
    });
  });

  describe('getStats', () => {
    it('should return all stats', () => {
      mockStorage.get.mockReturnValue({
        lastSpinDate: '2024-01-01T00:00:00.000Z',
        totalSpins: 10,
        jackpotsWon: 2,
        totalCoinsWon: 5000,
        totalXPWon: 1000,
        spinHistory: [],
      });

      const { result } = renderHook(() => useLuckyWheel());

      const stats = result.current.getStats();

      expect(stats.totalSpins).toBe(10);
      expect(stats.jackpotsWon).toBe(2);
      expect(stats.totalCoinsWon).toBe(5000);
      expect(stats.totalXPWon).toBe(1000);
      expect(stats.averageCoinsPerSpin).toBe(500);
      expect(stats.averageXPPerSpin).toBe(100);
    });

    it('should handle zero spins', () => {
      const { result } = renderHook(() => useLuckyWheel());

      const stats = result.current.getStats();

      expect(stats.averageCoinsPerSpin).toBe(0);
      expect(stats.averageXPPerSpin).toBe(0);
    });
  });

  describe('getRecentWins', () => {
    it('should return recent wins', () => {
      mockStorage.get.mockReturnValue({
        lastSpinDate: null,
        totalSpins: 3,
        jackpotsWon: 0,
        totalCoinsWon: 300,
        totalXPWon: 0,
        spinHistory: [
          { prize: mockPrizes[0], timestamp: '2024-01-03' },
          { prize: mockPrizes[1], timestamp: '2024-01-02' },
          { prize: mockPrizes[2], timestamp: '2024-01-01' },
        ],
      });

      const { result } = renderHook(() => useLuckyWheel());

      const recentWins = result.current.getRecentWins(2);

      expect(recentWins.length).toBe(2);
      expect(recentWins[0].prize.id).toBe('coins-100');
    });

    it('should default to 5 recent wins', () => {
      mockStorage.get.mockReturnValue({
        lastSpinDate: null,
        totalSpins: 10,
        jackpotsWon: 0,
        totalCoinsWon: 1000,
        totalXPWon: 0,
        spinHistory: Array(10).fill({ prize: mockPrizes[0], timestamp: new Date().toISOString() }),
      });

      const { result } = renderHook(() => useLuckyWheel());

      const recentWins = result.current.getRecentWins();

      expect(recentWins.length).toBe(5);
    });
  });

  describe('getRarityDistribution', () => {
    it('should return rarity distribution from history', () => {
      mockStorage.get.mockReturnValue({
        lastSpinDate: null,
        totalSpins: 4,
        jackpotsWon: 1,
        totalCoinsWon: 2700,
        totalXPWon: 0,
        spinHistory: [
          { prize: mockPrizes[0], timestamp: '2024-01-04' }, // common
          { prize: mockPrizes[1], timestamp: '2024-01-03' }, // common
          { prize: mockPrizes[3], timestamp: '2024-01-02' }, // rare
          { prize: mockPrizes[4], timestamp: '2024-01-01' }, // legendary
        ],
      });

      const { result } = renderHook(() => useLuckyWheel());

      const distribution = result.current.getRarityDistribution();

      expect(distribution.common).toBe(2);
      expect(distribution.rare).toBe(1);
      expect(distribution.legendary).toBe(1);
    });

    it('should return empty distribution for no history', () => {
      const { result } = renderHook(() => useLuckyWheel());

      const distribution = result.current.getRarityDistribution();

      expect(distribution.common).toBe(0);
      expect(distribution.rare).toBe(0);
      expect(distribution.epic).toBe(0);
      expect(distribution.legendary).toBe(0);
    });
  });

  describe('prizes', () => {
    it('should expose all prizes', () => {
      const { result } = renderHook(() => useLuckyWheel());

      expect(Array.isArray(result.current.prizes)).toBe(true);
      expect(result.current.prizes.length).toBe(5);
    });
  });
});
