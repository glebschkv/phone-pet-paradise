import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShop } from '@/hooks/useShop';
import type { ShopInventory } from '@/hooks/useShop';
import { useShopStore } from '@/stores';

// Mock dependencies
const mockCoinSystem = {
  balance: 1000,
  canAfford: vi.fn(),
  spendCoins: vi.fn(),
  addCoins: vi.fn(),
};

const mockBoosterSystem = {
  isBoosterActive: vi.fn(),
  activateBooster: vi.fn(),
  getBoosterType: vi.fn(),
};

const mockStreakSystem = {
  earnStreakFreeze: vi.fn(),
};

vi.mock('@/hooks/useCoinSystem', () => ({
  useCoinSystem: () => mockCoinSystem,
}));

vi.mock('@/hooks/useCoinBooster', () => ({
  useCoinBooster: () => mockBoosterSystem,
}));

vi.mock('@/hooks/useStreakSystem', () => ({
  useStreakSystem: () => mockStreakSystem,
}));

// Helper to set up Zustand store state
const setShopState = (inventory: Partial<ShopInventory>) => {
  useShopStore.setState({
    ownedCharacters: inventory.ownedCharacters ?? [],
    ownedBackgrounds: inventory.ownedBackgrounds ?? [],
    ownedBadges: inventory.ownedBadges ?? [],
    equippedBadge: inventory.equippedBadge ?? null,
    equippedBackground: inventory.equippedBackground ?? null,
  });
};

// Mock achievement tracking
vi.mock('@/hooks/useAchievementTracking', () => ({
  dispatchAchievementEvent: vi.fn(),
  ACHIEVEMENT_EVENTS: {
    PURCHASE_MADE: 'PURCHASE_MADE',
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  shopLogger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock animal database
vi.mock('@/data/AnimalDatabase', () => ({
  getAnimalById: vi.fn((id: string) => {
    if (id === 'dog') {
      return {
        id: 'dog',
        name: 'Dog',
        coinPrice: 100,
        isExclusive: true,
      };
    }
    if (id === 'cat') {
      return {
        id: 'cat',
        name: 'Cat',
        coinPrice: 150,
        isExclusive: true,
      };
    }
    return null;
  }),
}));

// Mock shop data
vi.mock('@/data/ShopData', () => ({
  PREMIUM_BACKGROUNDS: [
    {
      id: 'bg-ocean',
      name: 'Ocean View',
      coinPrice: 200,
      category: 'backgrounds',
    },
    {
      id: 'bg-forest',
      name: 'Forest',
      coinPrice: 250,
      category: 'backgrounds',
    },
  ],
  PROFILE_BADGES: [
    {
      id: 'badge-gold',
      name: 'Gold Badge',
      coinPrice: 300,
      category: 'badges',
    },
  ],
  UTILITY_ITEMS: [
    {
      id: 'streak-freeze-1',
      name: 'Streak Freeze',
      quantity: 1,
      coinPrice: 50,
    },
  ],
  BACKGROUND_BUNDLES: [
    {
      id: 'bundle-nature',
      name: 'Nature Bundle',
      backgroundIds: ['bg-ocean', 'bg-forest'],
      coinPrice: 400,
    },
  ],
  PET_BUNDLES: [
    {
      id: 'bundle-pets',
      name: 'Pet Bundle',
      petIds: ['dog', 'cat'],
      coinPrice: 200,
    },
  ],
  STARTER_BUNDLES: [
    {
      id: 'starter-basic',
      name: 'Starter Pack',
      contents: {
        coins: 500,
        boosterId: 'boost-2x',
        characterId: 'dog',
        badgeId: 'badge-gold',
      },
    },
  ],
}));

describe('useShop', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Reset Zustand store to initial state
    useShopStore.setState({
      ownedCharacters: [],
      ownedBackgrounds: [],
      ownedBadges: [],
      equippedBadge: null,
      equippedBackground: null,
    });

    // Default mock implementations
    mockCoinSystem.canAfford.mockReturnValue(true);
    mockCoinSystem.spendCoins.mockReturnValue(true);
    mockBoosterSystem.isBoosterActive.mockReturnValue(false);
    mockBoosterSystem.getBoosterType.mockReturnValue({
      id: 'boost-2x',
      name: '2x Booster',
      coinPrice: 100,
    });
  });

  describe('Inventory Loading', () => {
    it('should initialize with empty inventory', () => {
      const { result } = renderHook(() => useShop());

      expect(result.current.inventory).toEqual({
        ownedCharacters: [],
        ownedBackgrounds: [],
        ownedBadges: [],
        equippedBadge: null,
        equippedBackground: null,
      });
    });

    it('should load saved inventory from store', () => {
      const savedInventory: ShopInventory = {
        ownedCharacters: ['dog'],
        ownedBackgrounds: ['bg-ocean'],
        ownedBadges: ['badge-gold'],
        equippedBadge: 'badge-gold',
        equippedBackground: 'bg-ocean',
      };

      setShopState(savedInventory);

      const { result } = renderHook(() => useShop());

      expect(result.current.inventory).toEqual(savedInventory);
    });

    it('should handle empty store gracefully', () => {
      // Store is already reset to empty in beforeEach
      const { result } = renderHook(() => useShop());

      // Should have empty inventory
      expect(result.current.inventory.ownedCharacters).toEqual([]);
    });

    it('should handle partial inventory data', () => {
      // Set only characters, others default to empty
      setShopState({
        ownedCharacters: ['dog'],
      });

      const { result } = renderHook(() => useShop());

      expect(result.current.inventory.ownedCharacters).toEqual(['dog']);
      expect(result.current.inventory.ownedBackgrounds).toEqual([]);
      expect(result.current.inventory.ownedBadges).toEqual([]);
    });
  });

  describe('isOwned Checks', () => {
    it('should correctly identify owned characters', () => {
      setShopState({
        ownedCharacters: ['dog'],
      });

      const { result } = renderHook(() => useShop());

      expect(result.current.isOwned('dog', 'pets')).toBe(true);
      expect(result.current.isOwned('cat', 'pets')).toBe(false);
    });

    it('should correctly identify owned backgrounds', () => {
      setShopState({
        ownedBackgrounds: ['bg-ocean'],
      });

      const { result } = renderHook(() => useShop());

      expect(result.current.isOwned('bg-ocean', 'customize')).toBe(true);
      expect(result.current.isOwned('bg-forest', 'customize')).toBe(false);
    });

    it('should correctly identify owned badges', () => {
      setShopState({
        ownedBadges: ['badge-gold'],
      });

      const { result } = renderHook(() => useShop());

      expect(result.current.isOwned('badge-gold', 'customize')).toBe(true);
    });
  });

  describe('Purchase Functions - Success Cases', () => {
    it('should successfully purchase a character', async () => {
      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseCharacter('dog');
      });

      expect(purchaseResult).toEqual({
        success: true,
        message: 'Dog purchased!',
        item: expect.objectContaining({ id: 'dog', name: 'Dog' }),
      });
      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(100, 'pet_unlock', 'dog');
      expect(result.current.inventory.ownedCharacters).toContain('dog');
    });

    it('should successfully purchase a background', async () => {
      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseBackground('bg-ocean');
      });

      expect(purchaseResult).toEqual({
        success: true,
        message: 'Ocean View purchased!',
        item: expect.objectContaining({ id: 'bg-ocean', name: 'Ocean View' }),
      });
      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(200, 'cosmetic', 'bg-ocean');
      expect(result.current.inventory.ownedBackgrounds).toContain('bg-ocean');
    });

    it('should successfully purchase a badge', async () => {
      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseBadge('badge-gold');
      });

      expect(purchaseResult).toEqual({
        success: true,
        message: 'Gold Badge purchased!',
        item: expect.objectContaining({ id: 'badge-gold', name: 'Gold Badge' }),
      });
      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(300, 'cosmetic', 'badge-gold');
      expect(result.current.inventory.ownedBadges).toContain('badge-gold');
    });

    it('should successfully purchase streak freeze', async () => {
      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseStreakFreeze(3, 150);
      });

      expect(purchaseResult).toEqual({
        success: true,
        message: '3 Streak Freezes added!',
      });
      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(150, 'streak_freeze', 'streak_freeze_x3');
      expect(mockStreakSystem.earnStreakFreeze).toHaveBeenCalledTimes(3);
    });

    it('should successfully purchase a background bundle', async () => {
      const { result } = renderHook(() => useShop());

      let purchaseResult: { success: boolean; message: string } | undefined;
      await act(async () => {
        purchaseResult = await result.current.purchaseBackgroundBundle('bundle-nature');
      });

      expect(purchaseResult?.success).toBe(true);
      expect(purchaseResult?.message).toContain('Nature Bundle purchased!');
      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(400, 'cosmetic', 'bundle-nature');
      expect(result.current.inventory.ownedBackgrounds).toContain('bg-ocean');
      expect(result.current.inventory.ownedBackgrounds).toContain('bg-forest');
    });

    it('should successfully purchase a pet bundle', async () => {
      const { result } = renderHook(() => useShop());

      let purchaseResult: { success: boolean; message: string } | undefined;
      await act(async () => {
        purchaseResult = await result.current.purchasePetBundle('bundle-pets');
      });

      expect(purchaseResult?.success).toBe(true);
      expect(purchaseResult?.message).toContain('Pet Bundle purchased!');
      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(200, 'pet_unlock', 'bundle-pets');
      expect(result.current.inventory.ownedCharacters).toContain('dog');
      expect(result.current.inventory.ownedCharacters).toContain('cat');
    });
  });

  describe('Purchase Functions - Failure Cases', () => {
    it('should fail to purchase non-existent character', async () => {
      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseCharacter('non-existent');
      });

      expect(purchaseResult).toEqual({
        success: false,
        message: 'Character not found',
      });
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });

    it('should fail to purchase already owned character', async () => {
      setShopState({
        ownedCharacters: ['dog'],
      });

      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseCharacter('dog');
      });

      expect(purchaseResult).toEqual({
        success: false,
        message: 'You already own this character',
      });
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });

    it('should fail to purchase when insufficient coins', async () => {
      mockCoinSystem.canAfford.mockReturnValue(false);

      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseCharacter('dog');
      });

      expect(purchaseResult).toEqual({
        success: false,
        message: 'Not enough coins',
      });
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });

    it('should fail when coin spend fails', async () => {
      mockCoinSystem.spendCoins.mockReturnValue(false);

      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseCharacter('dog');
      });

      expect(purchaseResult).toEqual({
        success: false,
        message: 'Failed to process payment',
      });
    });

    it('should fail to purchase already owned background', async () => {
      setShopState({
        ownedBackgrounds: ['bg-ocean'],
      });

      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseBackground('bg-ocean');
      });

      expect(purchaseResult).toEqual({
        success: false,
        message: 'You already own this background',
      });
    });

    it('should fail to purchase bundle when all items owned', async () => {
      setShopState({
        ownedBackgrounds: ['bg-ocean', 'bg-forest'],
      });

      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseBackgroundBundle('bundle-nature');
      });

      expect(purchaseResult).toEqual({
        success: false,
        message: 'You already own all backgrounds in this bundle',
      });
    });
  });

  describe('equipBadge Function', () => {
    it('should successfully equip owned badge', () => {
      setShopState({
        ownedBadges: ['badge-gold'],
      });

      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.equipBadge('badge-gold');
      });

      expect(success).toBe(true);
      expect(result.current.inventory.equippedBadge).toBe('badge-gold');
    });

    it('should fail to equip unowned badge', () => {
      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.equipBadge('badge-gold');
      });

      expect(success).toBe(false);
      expect(result.current.inventory.equippedBadge).toBeNull();
    });

    it('should allow unequipping badge by passing null', () => {
      setShopState({
        ownedBadges: ['badge-gold'],
        equippedBadge: 'badge-gold',
      });

      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.equipBadge(null);
      });

      expect(success).toBe(true);
      expect(result.current.inventory.equippedBadge).toBeNull();
    });
  });

  describe('equipBackground Function', () => {
    it('should successfully equip owned background', () => {
      setShopState({
        ownedBackgrounds: ['bg-ocean'],
      });

      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.equipBackground('bg-ocean');
      });

      expect(success).toBe(true);
      expect(result.current.inventory.equippedBackground).toBe('bg-ocean');
    });

    it('should fail to equip unowned background', () => {
      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.equipBackground('bg-ocean');
      });

      expect(success).toBe(false);
      expect(result.current.inventory.equippedBackground).toBeNull();
    });

    it('should allow unequipping background by passing null', () => {
      setShopState({
        ownedBackgrounds: ['bg-ocean'],
        equippedBackground: 'bg-ocean',
      });

      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.equipBackground(null);
      });

      expect(success).toBe(true);
      expect(result.current.inventory.equippedBackground).toBeNull();
    });
  });

  describe('unlockCharacter and unlockBadge', () => {
    it('should unlock character without payment', () => {
      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.unlockCharacter('dog');
      });

      expect(success).toBe(true);
      expect(result.current.inventory.ownedCharacters).toContain('dog');
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });

    it('should unlock badge without payment', () => {
      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.unlockBadge('badge-gold');
      });

      expect(success).toBe(true);
      expect(result.current.inventory.ownedBadges).toContain('badge-gold');
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });

    it('should return true if character already owned', () => {
      setShopState({
        ownedCharacters: ['dog'],
      });

      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.unlockCharacter('dog');
      });

      expect(success).toBe(true);
    });
  });

  describe('Bundle Ownership Checks', () => {
    it('should correctly check if background bundle is owned', () => {
      setShopState({
        ownedBackgrounds: ['bg-ocean', 'bg-forest'],
      });

      const { result } = renderHook(() => useShop());

      expect(result.current.isBundleOwned('bundle-nature')).toBe(true);
    });

    it('should return false if bundle partially owned', () => {
      setShopState({
        ownedBackgrounds: ['bg-ocean'],
      });

      const { result } = renderHook(() => useShop());

      expect(result.current.isBundleOwned('bundle-nature')).toBe(false);
    });

    it('should correctly check if pet bundle is owned', () => {
      setShopState({
        ownedCharacters: ['dog', 'cat'],
      });

      const { result } = renderHook(() => useShop());

      expect(result.current.isPetBundleOwned('bundle-pets')).toBe(true);
    });
  });

  describe('resetShop', () => {
    it('should reset shop inventory to defaults', () => {
      setShopState({
        ownedCharacters: ['dog'],
        ownedBackgrounds: ['bg-ocean'],
        ownedBadges: ['badge-gold'],
        equippedBadge: 'badge-gold',
        equippedBackground: 'bg-ocean',
      });

      const { result } = renderHook(() => useShop());

      act(() => {
        result.current.resetShop();
      });

      expect(result.current.inventory).toEqual({
        ownedCharacters: [],
        ownedBackgrounds: [],
        ownedBadges: [],
        equippedBadge: null,
        equippedBackground: null,
      });
    });
  });

  describe('Coin System Integration', () => {
    it('should expose coin balance from coin system', () => {
      const { result } = renderHook(() => useShop());

      expect(result.current.coinBalance).toBe(1000);
    });

    it('should expose canAfford from coin system', () => {
      const { result } = renderHook(() => useShop());

      expect(typeof result.current.canAfford).toBe('function');
    });
  });
});
