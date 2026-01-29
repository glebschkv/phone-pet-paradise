/**
 * Shop Database Tests
 *
 * Tests the shop purchase flows as they interact with the database layer,
 * including server-validated coin spending, inventory persistence,
 * and error handling when the backend rejects operations.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShop } from '@/hooks/useShop';
import { useShopStore } from '@/stores';
import { useCoinStore } from '@/stores/coinStore';
import type { ShopInventory } from '@/hooks/useShop';

// ─── Mock Dependencies ───────────────────────────────────────────────

const mockCoinSystem = {
  balance: 1000,
  canAfford: vi.fn(),
  spendCoins: vi.fn(),
  addCoins: vi.fn(),
  syncFromServer: vi.fn().mockResolvedValue(undefined),
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

vi.mock('@/hooks/useAchievementTracking', () => ({
  dispatchAchievementEvent: vi.fn(),
  ACHIEVEMENT_EVENTS: { PURCHASE_MADE: 'PURCHASE_MADE' },
}));

vi.mock('@/lib/logger', () => {
  const l = () => ({ error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() });
  return {
    shopLogger: l(),
    coinLogger: l(),
    storageLogger: l(),
    createLogger: () => l(),
  };
});

vi.mock('@/data/AnimalDatabase', () => ({
  getAnimalById: vi.fn((id: string) => {
    const animals: Record<string, object> = {
      dog: { id: 'dog', name: 'Dog', coinPrice: 100, isExclusive: true },
      cat: { id: 'cat', name: 'Cat', coinPrice: 150, isExclusive: true },
      parrot: { id: 'parrot', name: 'Parrot', coinPrice: 500, isExclusive: true },
      hamster: { id: 'hamster', name: 'Hamster', isExclusive: false },
    };
    return animals[id] || null;
  }),
}));

vi.mock('@/data/ShopData', () => ({
  PREMIUM_BACKGROUNDS: [
    { id: 'bg-ocean', name: 'Ocean View', coinPrice: 200, category: 'backgrounds' },
    { id: 'bg-forest', name: 'Forest', coinPrice: 250, category: 'backgrounds' },
    { id: 'bg-mountain', name: 'Mountain', coinPrice: 300, category: 'backgrounds' },
  ],
  UTILITY_ITEMS: [
    { id: 'streak-freeze-1', name: 'Streak Freeze', quantity: 1, coinPrice: 50 },
    { id: 'streak-freeze-3', name: 'Streak Freeze x3', quantity: 3, coinPrice: 120 },
  ],
  BACKGROUND_BUNDLES: [
    { id: 'bundle-nature', name: 'Nature Bundle', backgroundIds: ['bg-ocean', 'bg-forest'], coinPrice: 400 },
  ],
  PET_BUNDLES: [
    { id: 'bundle-pets', name: 'Pet Bundle', petIds: ['dog', 'cat'], coinPrice: 200 },
  ],
  STARTER_BUNDLES: [
    { id: 'starter-basic', name: 'Starter Pack', contents: { coins: 500, boosterId: 'boost-2x', characterId: 'dog' } },
  ],
}));

// ─── Helper ──────────────────────────────────────────────────────────

const setShopState = (inventory: Partial<ShopInventory>) => {
  useShopStore.setState({
    ownedCharacters: inventory.ownedCharacters ?? [],
    ownedBackgrounds: inventory.ownedBackgrounds ?? [],
    equippedBackground: inventory.equippedBackground ?? null,
  });
};

// ─── Tests ───────────────────────────────────────────────────────────

describe('Shop Database – Purchase Flows', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useShopStore.setState({ ownedCharacters: [], ownedBackgrounds: [], equippedBackground: null });
    mockCoinSystem.balance = 1000;
    mockCoinSystem.canAfford.mockReturnValue(true);
    mockCoinSystem.spendCoins.mockResolvedValue(true);
    mockBoosterSystem.isBoosterActive.mockReturnValue(false);
    mockBoosterSystem.getBoosterType.mockReturnValue({ id: 'boost-2x', name: '2x Booster', coinPrice: 100 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Character Purchases ──────────────────────────────────────────

  describe('Character Purchase – Server Validation', () => {
    it('should call server-validated spendCoins for character purchase', async () => {
      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseCharacter('dog');
      });

      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(100, 'pet_unlock', 'dog');
    });

    it('should add character to inventory only after server confirms spend', async () => {
      const { result } = renderHook(() => useShop());

      await act(async () => {
        const res = await result.current.purchaseCharacter('dog');
        expect(res.success).toBe(true);
      });

      expect(result.current.inventory.ownedCharacters).toContain('dog');
    });

    it('should NOT add character when server rejects coin spend', async () => {
      mockCoinSystem.spendCoins.mockResolvedValue(false);

      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseCharacter('dog');
      });

      expect(purchaseResult).toMatchObject({ success: false });
      expect(result.current.inventory.ownedCharacters).not.toContain('dog');
    });

    it('should trigger balance sync when server rejects spend', async () => {
      mockCoinSystem.spendCoins.mockResolvedValue(false);

      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseCharacter('dog');
      });

      expect(mockCoinSystem.syncFromServer).toHaveBeenCalled();
    });

    it('should reject purchase of non-exclusive character', async () => {
      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseCharacter('hamster');
      });

      expect(purchaseResult).toMatchObject({
        success: false,
        message: 'This character cannot be purchased',
      });
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });
  });

  // ── Background Purchases ─────────────────────────────────────────

  describe('Background Purchase – Server Validation', () => {
    it('should call server-validated spendCoins for background purchase', async () => {
      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseBackground('bg-ocean');
      });

      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(200, 'cosmetic', 'bg-ocean');
    });

    it('should NOT add background when server rejects spend', async () => {
      mockCoinSystem.spendCoins.mockResolvedValue(false);

      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseBackground('bg-ocean');
      });

      expect(result.current.inventory.ownedBackgrounds).not.toContain('bg-ocean');
    });
  });

  // ── Bundle Purchases ──────────────────────────────────────────────

  describe('Bundle Purchases – Server Validation', () => {
    it('should purchase background bundle and add all items', async () => {
      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseBackgroundBundle('bundle-nature');
      });

      expect(purchaseResult).toMatchObject({ success: true });
      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(400, 'cosmetic', 'bundle-nature');
      expect(result.current.inventory.ownedBackgrounds).toContain('bg-ocean');
      expect(result.current.inventory.ownedBackgrounds).toContain('bg-forest');
    });

    it('should skip already-owned items in bundle but still charge full price', async () => {
      setShopState({ ownedBackgrounds: ['bg-ocean'] });

      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseBackgroundBundle('bundle-nature');
      });

      // Should only add bg-forest since bg-ocean already owned
      const backgrounds = result.current.inventory.ownedBackgrounds;
      expect(backgrounds.filter(b => b === 'bg-ocean')).toHaveLength(1);
      expect(backgrounds).toContain('bg-forest');
    });

    it('should reject bundle if all items already owned', async () => {
      setShopState({ ownedBackgrounds: ['bg-ocean', 'bg-forest'] });

      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseBackgroundBundle('bundle-nature');
      });

      expect(purchaseResult).toMatchObject({
        success: false,
        message: 'You already own all backgrounds in this bundle',
      });
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });

    it('should NOT add bundle items when server rejects spend', async () => {
      mockCoinSystem.spendCoins.mockResolvedValue(false);

      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseBackgroundBundle('bundle-nature');
      });

      expect(result.current.inventory.ownedBackgrounds).toEqual([]);
    });

    it('should purchase pet bundle and add all pets', async () => {
      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchasePetBundle('bundle-pets');
      });

      expect(purchaseResult).toMatchObject({ success: true });
      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(200, 'pet_unlock', 'bundle-pets');
      expect(result.current.inventory.ownedCharacters).toContain('dog');
      expect(result.current.inventory.ownedCharacters).toContain('cat');
    });

    it('should reject pet bundle if all pets already owned', async () => {
      setShopState({ ownedCharacters: ['dog', 'cat'] });

      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchasePetBundle('bundle-pets');
      });

      expect(purchaseResult).toMatchObject({
        success: false,
        message: 'You already own all pets in this bundle',
      });
    });
  });

  // ── Booster Purchases ─────────────────────────────────────────────

  describe('Booster Purchase – Server Validation', () => {
    it('should activate booster after server confirms spend', async () => {
      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseBooster('boost-2x');
      });

      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(100, 'booster', 'boost-2x');
      expect(mockBoosterSystem.activateBooster).toHaveBeenCalledWith('boost-2x');
    });

    it('should NOT activate booster when server rejects spend', async () => {
      mockCoinSystem.spendCoins.mockResolvedValue(false);

      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseBooster('boost-2x');
      });

      expect(mockBoosterSystem.activateBooster).not.toHaveBeenCalled();
    });

    it('should reject booster if one is already active', async () => {
      mockBoosterSystem.isBoosterActive.mockReturnValue(true);

      const { result } = renderHook(() => useShop());

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseBooster('boost-2x');
      });

      expect(purchaseResult).toMatchObject({
        success: false,
        message: 'You already have an active booster',
      });
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });
  });

  // ── Streak Freeze Purchase ────────────────────────────────────────

  describe('Streak Freeze Purchase – Server Validation', () => {
    it('should award streak freezes after server confirms spend', async () => {
      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseStreakFreeze(3, 120);
      });

      expect(mockCoinSystem.spendCoins).toHaveBeenCalledWith(120, 'streak_freeze', 'streak_freeze_x3');
      expect(mockStreakSystem.earnStreakFreeze).toHaveBeenCalledTimes(3);
    });

    it('should NOT award streak freezes when server rejects', async () => {
      mockCoinSystem.spendCoins.mockResolvedValue(false);

      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseStreakFreeze(3, 120);
      });

      expect(mockStreakSystem.earnStreakFreeze).not.toHaveBeenCalled();
    });
  });

  // ── Insufficient Coins ────────────────────────────────────────────

  describe('Insufficient Coins – No Server Call', () => {
    it('should not call server when client knows balance is too low', async () => {
      mockCoinSystem.canAfford.mockReturnValue(false);

      const { result } = renderHook(() => useShop());

      const res = await act(async () => result.current.purchaseCharacter('dog'));

      expect(res).toMatchObject({ success: false, message: 'Not enough coins' });
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });

    it('should not call server for background when balance too low', async () => {
      mockCoinSystem.canAfford.mockReturnValue(false);

      const { result } = renderHook(() => useShop());

      const res = await act(async () => result.current.purchaseBackground('bg-ocean'));

      expect(res).toMatchObject({ success: false, message: 'Not enough coins' });
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });
  });

  // ── Inventory Persistence ─────────────────────────────────────────

  describe('Inventory State Persistence', () => {
    it('should persist purchased character in Zustand store', async () => {
      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseCharacter('dog');
      });

      const storeState = useShopStore.getState();
      expect(storeState.ownedCharacters).toContain('dog');
    });

    it('should persist across hook re-renders', async () => {
      const { result, rerender } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseCharacter('dog');
      });

      rerender();

      expect(result.current.inventory.ownedCharacters).toContain('dog');
    });

    it('should persist to localStorage via Zustand', async () => {
      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseCharacter('dog');
      });

      // Wait for Zustand persistence
      await new Promise(resolve => setTimeout(resolve, 50));

      const saved = localStorage.getItem('petIsland_shopInventory');
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.state.ownedCharacters).toContain('dog');
    });
  });

  // ── Duplicate Prevention ──────────────────────────────────────────

  describe('Duplicate Purchase Prevention', () => {
    it('should prevent buying the same character twice', async () => {
      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseCharacter('dog');
      });

      vi.clearAllMocks();

      let secondPurchase;
      await act(async () => {
        secondPurchase = await result.current.purchaseCharacter('dog');
      });

      expect(secondPurchase).toMatchObject({
        success: false,
        message: 'You already own this character',
      });
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });

    it('should prevent buying the same background twice', async () => {
      const { result } = renderHook(() => useShop());

      await act(async () => {
        await result.current.purchaseBackground('bg-ocean');
      });

      vi.clearAllMocks();

      let secondPurchase;
      await act(async () => {
        secondPurchase = await result.current.purchaseBackground('bg-ocean');
      });

      expect(secondPurchase).toMatchObject({
        success: false,
        message: 'You already own this background',
      });
      expect(mockCoinSystem.spendCoins).not.toHaveBeenCalled();
    });
  });

  // ── Equip Operations ──────────────────────────────────────────────

  describe('Equip Background – Ownership Check', () => {
    it('should allow equipping an owned background', () => {
      setShopState({ ownedBackgrounds: ['bg-ocean'] });

      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.equipBackground('bg-ocean');
      });

      expect(success).toBe(true);
      expect(result.current.inventory.equippedBackground).toBe('bg-ocean');
    });

    it('should reject equipping an unowned background', () => {
      const { result } = renderHook(() => useShop());

      let success;
      act(() => {
        success = result.current.equipBackground('bg-ocean');
      });

      expect(success).toBe(false);
      expect(result.current.inventory.equippedBackground).toBeNull();
    });
  });
});

describe('Shop Database – Coin Store Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useCoinStore.setState({
      balance: 500,
      totalEarned: 500,
      totalSpent: 0,
      lastServerSync: null,
      pendingServerValidation: false,
    });
  });

  it('should track balance correctly after adding coins', () => {
    const { addCoins } = useCoinStore.getState();

    act(() => {
      addCoins(100);
    });

    const state = useCoinStore.getState();
    expect(state.balance).toBe(600);
    expect(state.totalEarned).toBe(600);
    expect(state.pendingServerValidation).toBe(true);
  });

  it('should deduct balance and track spending', () => {
    const { spendCoins } = useCoinStore.getState();

    let success;
    act(() => {
      success = spendCoins(200);
    });

    expect(success).toBe(true);
    const state = useCoinStore.getState();
    expect(state.balance).toBe(300);
    expect(state.totalSpent).toBe(200);
  });

  it('should reject spending more than balance', () => {
    const { spendCoins } = useCoinStore.getState();

    let success;
    act(() => {
      success = spendCoins(999);
    });

    expect(success).toBe(false);
    expect(useCoinStore.getState().balance).toBe(500);
  });

  it('should override local state on server sync', () => {
    const { addCoins, syncFromServer } = useCoinStore.getState();

    act(() => {
      addCoins(100); // Local: 600
    });

    act(() => {
      syncFromServer(550, 550, 0); // Server says 550
    });

    const state = useCoinStore.getState();
    expect(state.balance).toBe(550);
    expect(state.totalEarned).toBe(550);
    expect(state.pendingServerValidation).toBe(false);
    expect(state.lastServerSync).not.toBeNull();
  });

  it('should reject negative coin amounts', () => {
    const { addCoins } = useCoinStore.getState();

    act(() => {
      addCoins(-100);
    });

    expect(useCoinStore.getState().balance).toBe(500);
  });

  it('should correctly report canAfford', () => {
    const state = useCoinStore.getState();

    expect(state.canAfford(500)).toBe(true);
    expect(state.canAfford(501)).toBe(false);
    expect(state.canAfford(0)).toBe(true);
  });
});
