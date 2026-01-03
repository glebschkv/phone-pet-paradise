import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBattlePass, dispatchBattlePassXP } from '@/hooks/useBattlePass';

// Mock storage module
vi.mock('@/lib/storage-keys', () => ({
  STORAGE_KEYS: {
    BATTLE_PASS: 'nomo_battle_pass',
  },
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock premium status hook
vi.mock('./usePremiumStatus', () => ({
  TIER_BENEFITS: {
    free: { battlePassIncluded: false },
    premium: { battlePassIncluded: true },
    pro: { battlePassIncluded: true },
  },
  BATTLE_PASS_PLANS: [
    { id: 'bp-standard', name: 'Battle Pass', price: 9.99 },
    { id: 'bp-bundle', name: 'Battle Pass + 10 Tiers', price: 19.99 },
  ],
}));

// Mock gamification data
vi.mock('@/data/GamificationData', () => ({
  getCurrentSeason: vi.fn(() => ({
    id: 'test-season',
    name: 'Test Season',
    theme: 'winter',
    description: 'Test description',
    startDate: '2024-01-01',
    endDate: '2025-12-31',
    tiers: [
      { tier: 1, xpRequired: 100, freeReward: { type: 'coins', amount: 50, itemName: '50 Coins', rarity: 'common', icon: '🪙' } },
      { tier: 2, xpRequired: 150, freeReward: { type: 'xp', amount: 100, itemName: '100 XP', rarity: 'common', icon: '⭐' } },
      { tier: 3, xpRequired: 200, freeReward: { type: 'coins', amount: 100, itemName: '100 Coins', rarity: 'rare', icon: '💰' }, premiumReward: { type: 'badge', itemId: 'tier-3', itemName: 'Tier 3 Badge', rarity: 'rare', icon: '🎖️' } },
      { tier: 4, xpRequired: 250, freeReward: { type: 'coins', amount: 150, itemName: '150 Coins', rarity: 'rare', icon: '💰' } },
      { tier: 5, xpRequired: 300, freeReward: { type: 'coins', amount: 200, itemName: '200 Coins', rarity: 'epic', icon: '💎' }, premiumReward: { type: 'pet', itemId: 'season-pet', itemName: 'Season Pet', rarity: 'legendary', icon: '🏆' } },
    ],
    exclusivePet: 'test-pet',
    backgroundGradient: 'from-blue-900 to-purple-900',
    accentColor: '#60a5fa',
  })),
  SEASONS: [],
}));

import { storage } from '@/lib/storage-keys';

const mockStorage = storage as unknown as {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

describe('useBattlePass', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockStorage.get.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state when no saved data', () => {
      const { result } = renderHook(() => useBattlePass());

      expect(result.current.state.currentTier).toBe(0);
      expect(result.current.state.currentXP).toBe(0);
      expect(result.current.state.isPremium).toBe(false);
      expect(result.current.state.claimedTiers).toEqual([]);
      expect(result.current.state.premiumClaimedTiers).toEqual([]);
    });

    it('should load saved state from storage', () => {
      const savedState = {
        seasonId: 'test-season',
        currentTier: 3,
        currentXP: 500,
        isPremium: true,
        claimedTiers: [1, 2],
        premiumClaimedTiers: [1],
      };
      mockStorage.get.mockReturnValue(savedState);

      const { result } = renderHook(() => useBattlePass());

      expect(result.current.state.currentTier).toBe(3);
      expect(result.current.state.currentXP).toBe(500);
      expect(result.current.state.isPremium).toBe(true);
    });

    it('should have current season available', () => {
      const { result } = renderHook(() => useBattlePass());

      expect(result.current.currentSeason).toBeTruthy();
      expect(result.current.currentSeason?.id).toBe('test-season');
    });

    it('should have all required functions available', () => {
      const { result } = renderHook(() => useBattlePass());

      expect(typeof result.current.addBattlePassXP).toBe('function');
      expect(typeof result.current.claimTierReward).toBe('function');
      expect(typeof result.current.upgradeToPremium).toBe('function');
      expect(typeof result.current.purchaseBattlePass).toBe('function');
      expect(typeof result.current.getProgress).toBe('function');
      expect(typeof result.current.getUnclaimedRewards).toBe('function');
      expect(typeof result.current.isTierClaimed).toBe('function');
      expect(typeof result.current.isFromSubscription).toBe('function');
      expect(typeof result.current.getBattlePassProducts).toBe('function');
    });
  });

  describe('addBattlePassXP', () => {
    it('should add XP and update state', () => {
      const { result } = renderHook(() => useBattlePass());

      act(() => {
        result.current.addBattlePassXP(150);
      });

      expect(result.current.state.currentXP).toBe(150);
      expect(mockStorage.set).toHaveBeenCalled();
    });

    it('should tier up when reaching tier threshold', () => {
      const { result } = renderHook(() => useBattlePass());

      act(() => {
        const tierResult = result.current.addBattlePassXP(100);
        expect(tierResult.newTier).toBe(1);
        expect(tierResult.tieredUp).toBe(true);
      });
    });

    it('should handle multiple tier ups in one XP grant', () => {
      const { result } = renderHook(() => useBattlePass());

      act(() => {
        const tierResult = result.current.addBattlePassXP(500); // Enough for tier 3
        expect(tierResult.newTier).toBeGreaterThanOrEqual(2);
      });
    });

    it('should accumulate XP over multiple additions', () => {
      const { result } = renderHook(() => useBattlePass());

      act(() => {
        result.current.addBattlePassXP(50);
      });
      act(() => {
        result.current.addBattlePassXP(75);
      });

      expect(result.current.state.currentXP).toBe(125);
    });
  });

  describe('claimTierReward', () => {
    it('should claim free tier reward successfully', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'test-season',
        currentTier: 2,
        currentXP: 250,
        isPremium: false,
        claimedTiers: [],
        premiumClaimedTiers: [],
      });

      const { result } = renderHook(() => useBattlePass());

      let reward;
      act(() => {
        reward = result.current.claimTierReward(1, false);
      });

      expect(reward).not.toBeNull();
      expect(result.current.state.claimedTiers).toContain(1);
    });

    it('should not allow claiming tier higher than current', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'test-season',
        currentTier: 1,
        currentXP: 100,
        isPremium: true,
        claimedTiers: [],
        premiumClaimedTiers: [],
      });

      const { result } = renderHook(() => useBattlePass());

      let reward;
      act(() => {
        reward = result.current.claimTierReward(5, false);
      });

      expect(reward).toBeNull();
    });

    it('should not allow claiming premium reward without premium', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'test-season',
        currentTier: 3,
        currentXP: 450,
        isPremium: false,
        claimedTiers: [],
        premiumClaimedTiers: [],
      });

      const { result } = renderHook(() => useBattlePass());

      let reward;
      act(() => {
        reward = result.current.claimTierReward(3, true);
      });

      expect(reward).toBeNull();
    });

    it('should claim premium reward with premium subscription', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'test-season',
        currentTier: 3,
        currentXP: 450,
        isPremium: true,
        claimedTiers: [],
        premiumClaimedTiers: [],
      });

      const { result } = renderHook(() => useBattlePass());

      let reward;
      act(() => {
        reward = result.current.claimTierReward(3, true);
      });

      expect(reward).not.toBeNull();
      expect(result.current.state.premiumClaimedTiers).toContain(3);
    });

    it('should not allow double claiming', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'test-season',
        currentTier: 3,
        currentXP: 450,
        isPremium: false,
        claimedTiers: [1, 2],
        premiumClaimedTiers: [],
      });

      const { result } = renderHook(() => useBattlePass());

      let reward;
      act(() => {
        reward = result.current.claimTierReward(1, false);
      });

      expect(reward).toBeNull();
    });
  });

  describe('upgradeToPremium', () => {
    it('should upgrade to premium status', () => {
      const { result } = renderHook(() => useBattlePass());

      expect(result.current.state.isPremium).toBe(false);

      act(() => {
        result.current.upgradeToPremium();
      });

      expect(result.current.state.isPremium).toBe(true);
      expect(mockStorage.set).toHaveBeenCalled();
    });
  });

  describe('purchaseBattlePass', () => {
    it('should purchase battle pass without bonus tiers', () => {
      const { result } = renderHook(() => useBattlePass());

      let success;
      act(() => {
        success = result.current.purchaseBattlePass(0);
      });

      expect(success).toBe(true);
      expect(result.current.state.isPremium).toBe(true);
    });

    it('should purchase battle pass with bonus tiers', () => {
      const { result } = renderHook(() => useBattlePass());

      act(() => {
        result.current.purchaseBattlePass(3);
      });

      expect(result.current.state.isPremium).toBe(true);
      expect(result.current.state.currentTier).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getProgress', () => {
    it('should return correct progress information', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'test-season',
        currentTier: 1,
        currentXP: 100,
        isPremium: false,
        claimedTiers: [],
        premiumClaimedTiers: [],
      });

      const { result } = renderHook(() => useBattlePass());

      const progress = result.current.getProgress();

      expect(progress.currentTier).toBe(1);
      expect(progress.currentXP).toBe(100);
      expect(progress.season).toBeTruthy();
      expect(progress.daysRemaining).toBeGreaterThanOrEqual(0);
    });

    it('should return null season when no season active', () => {
      vi.doMock('@/data/GamificationData', () => ({
        getCurrentSeason: vi.fn(() => null),
      }));

      const { result } = renderHook(() => useBattlePass());

      const progress = result.current.getProgress();

      expect(progress.progressPercent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUnclaimedRewards', () => {
    it('should return unclaimed free rewards', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'test-season',
        currentTier: 3,
        currentXP: 450,
        isPremium: false,
        claimedTiers: [1],
        premiumClaimedTiers: [],
      });

      const { result } = renderHook(() => useBattlePass());

      const unclaimed = result.current.getUnclaimedRewards();

      expect(unclaimed.length).toBe(2); // Tiers 2 and 3
      expect(unclaimed.some(r => r.tier === 2 && r.isFree)).toBe(true);
      expect(unclaimed.some(r => r.tier === 3 && r.isFree)).toBe(true);
    });

    it('should return unclaimed premium rewards for premium users', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'test-season',
        currentTier: 3,
        currentXP: 450,
        isPremium: true,
        claimedTiers: [1, 2, 3],
        premiumClaimedTiers: [1],
      });

      const { result } = renderHook(() => useBattlePass());

      const unclaimed = result.current.getUnclaimedRewards();

      // Should include unclaimed premium rewards for tiers 2 and 3
      expect(unclaimed.some(r => r.isFree === false)).toBe(true);
    });
  });

  describe('isTierClaimed', () => {
    it('should return true for claimed free tier', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'test-season',
        currentTier: 3,
        currentXP: 450,
        isPremium: false,
        claimedTiers: [1, 2],
        premiumClaimedTiers: [],
      });

      const { result } = renderHook(() => useBattlePass());

      expect(result.current.isTierClaimed(1, false)).toBe(true);
      expect(result.current.isTierClaimed(2, false)).toBe(true);
      expect(result.current.isTierClaimed(3, false)).toBe(false);
    });

    it('should return true for claimed premium tier', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'test-season',
        currentTier: 3,
        currentXP: 450,
        isPremium: true,
        claimedTiers: [],
        premiumClaimedTiers: [1, 2],
      });

      const { result } = renderHook(() => useBattlePass());

      expect(result.current.isTierClaimed(1, true)).toBe(true);
      expect(result.current.isTierClaimed(2, true)).toBe(true);
      expect(result.current.isTierClaimed(3, true)).toBe(false);
    });
  });

  describe('getBattlePassProducts', () => {
    it('should return available battle pass products', () => {
      const { result } = renderHook(() => useBattlePass());

      const products = result.current.getBattlePassProducts();

      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
    });
  });

  describe('XP Event Dispatching', () => {
    it('should respond to battle pass XP update events', async () => {
      const { result } = renderHook(() => useBattlePass());

      act(() => {
        dispatchBattlePassXP(200);
      });

      await waitFor(() => {
        expect(result.current.state.currentXP).toBe(200);
      });
    });

    it('should accumulate XP from multiple events', async () => {
      const { result } = renderHook(() => useBattlePass());

      act(() => {
        dispatchBattlePassXP(100);
      });

      await waitFor(() => {
        expect(result.current.state.currentXP).toBe(100);
      });

      act(() => {
        dispatchBattlePassXP(150);
      });

      await waitFor(() => {
        expect(result.current.state.currentXP).toBe(250);
      });
    });
  });

  describe('Season Transitions', () => {
    it('should reset state for new season', () => {
      mockStorage.get.mockReturnValue({
        seasonId: 'old-season', // Different from current season
        currentTier: 5,
        currentXP: 1000,
        isPremium: false,
        claimedTiers: [1, 2, 3, 4, 5],
        premiumClaimedTiers: [],
      });

      const { result } = renderHook(() => useBattlePass());

      // Should reset for new season
      expect(result.current.state.seasonId).toBe('test-season');
      expect(result.current.state.currentTier).toBe(0);
      expect(result.current.state.currentXP).toBe(0);
      expect(result.current.state.claimedTiers).toEqual([]);
    });
  });
});
