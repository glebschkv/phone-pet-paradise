import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Create stable mock functions that persist across tests using vi.hoisted
const {
  mockGetProducts,
  mockPurchase,
  mockRestorePurchases,
  mockGetSubscriptionStatus,
  mockManageSubscriptions,
  mockAddListener,
  mockToastFn,
  mockIsNativePlatform,
} = vi.hoisted(() => ({
  mockGetProducts: vi.fn(),
  mockPurchase: vi.fn(),
  mockRestorePurchases: vi.fn(),
  mockGetSubscriptionStatus: vi.fn(),
  mockManageSubscriptions: vi.fn(),
  mockAddListener: vi.fn(),
  mockToastFn: vi.fn(),
  mockIsNativePlatform: vi.fn(),
}));

// Mock StoreKit plugin
vi.mock('@/plugins/store-kit', () => ({
  StoreKit: {
    getProducts: mockGetProducts,
    purchase: mockPurchase,
    restorePurchases: mockRestorePurchases,
    getSubscriptionStatus: mockGetSubscriptionStatus,
    manageSubscriptions: mockManageSubscriptions,
    addListener: mockAddListener,
  },
}));

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: mockIsNativePlatform,
    getPlatform: vi.fn(() => 'ios'),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToastFn,
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  storeKitLogger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id' },
            access_token: 'test-token',
          },
        },
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: {
          success: true,
          subscription: {
            tier: 'premium',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            purchasedAt: new Date().toISOString(),
            productId: 'co.nomoinc.nomo.premium.monthly',
            environment: 'sandbox',
          },
        },
        error: null,
      }),
    },
  },
}));

// Mock usePremiumStatus exports
vi.mock('@/hooks/usePremiumStatus', () => ({
  SUBSCRIPTION_PLANS: [
    {
      id: 'premium-monthly',
      tier: 'premium',
      name: 'Premium',
      description: 'Double your progress',
      price: '$5.99',
      priceValue: 5.99,
      period: 'monthly',
      features: [],
      iapProductId: 'co.nomoinc.nomo.premium.monthly',
      bonusCoins: 1000,
    },
    {
      id: 'premium-yearly',
      tier: 'premium',
      name: 'Premium',
      description: 'Double your progress',
      price: '$44.99',
      priceValue: 44.99,
      period: 'yearly',
      features: [],
      iapProductId: 'co.nomoinc.nomo.premium.yearly',
      bonusCoins: 2500,
    },
    {
      id: 'premium-lifetime',
      tier: 'lifetime',
      name: 'Lifetime',
      description: 'Forever access',
      price: '$199.99',
      priceValue: 199.99,
      period: 'lifetime',
      features: [],
      iapProductId: 'co.nomoinc.nomo.lifetime',
      bonusCoins: 10000,
    },
  ],
  dispatchSubscriptionChange: vi.fn(),
}));

// Import after mocks are set up
import { useStoreKit } from '@/hooks/useStoreKit';

// Mock data for tests
const mockProducts = [
  {
    id: 'co.nomoinc.nomo.premium.monthly',
    displayName: 'Premium Monthly',
    description: 'Double your progress',
    price: '5.99',
    displayPrice: '$5.99',
    type: 'autoRenewable' as const,
    subscriptionPeriod: { unit: 'month' as const, value: 1 },
  },
  {
    id: 'co.nomoinc.nomo.premium.yearly',
    displayName: 'Premium Yearly',
    description: 'Double your progress - save 37%',
    price: '44.99',
    displayPrice: '$44.99',
    type: 'autoRenewable' as const,
    subscriptionPeriod: { unit: 'year' as const, value: 1 },
  },
  {
    id: 'co.nomoinc.nomo.lifetime',
    displayName: 'Lifetime',
    description: 'Forever access',
    price: '199.99',
    displayPrice: '$199.99',
    type: 'nonConsumable' as const,
  },
  {
    id: 'co.nomoinc.nomo.coins.starter',
    displayName: 'Starter Coins',
    description: '500 coins',
    price: '0.99',
    displayPrice: '$0.99',
    type: 'consumable' as const,
  },
];

const mockSubscriptionStatus = {
  hasActiveSubscription: false,
  activeSubscriptions: [],
  purchasedProducts: [],
};

const mockActiveSubscriptionStatus = {
  hasActiveSubscription: true,
  activeSubscriptions: [
    {
      productId: 'co.nomoinc.nomo.premium.monthly',
      transactionId: 'txn_123',
      purchaseDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      expirationDate: Date.now() + 23 * 24 * 60 * 60 * 1000, // 23 days from now
      signedTransaction: 'signed_txn_data',
      environment: 'sandbox' as const,
    },
  ],
  purchasedProducts: [],
};

const mockLifetimeStatus = {
  hasActiveSubscription: true,
  activeSubscriptions: [],
  purchasedProducts: [
    {
      productId: 'co.nomoinc.nomo.lifetime',
      transactionId: 'txn_lifetime_123',
      purchaseDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      expirationDate: null,
      signedTransaction: 'signed_lifetime_txn',
      environment: 'production' as const,
    },
  ],
};

describe('useStoreKit', () => {
  const PREMIUM_STORAGE_KEY = 'petIsland_premium';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default mock implementations - set defaults for ALL mocks
    mockIsNativePlatform.mockReturnValue(true);
    mockGetProducts.mockResolvedValue({ products: mockProducts });
    mockGetSubscriptionStatus.mockResolvedValue(mockSubscriptionStatus);
    mockAddListener.mockResolvedValue({ remove: vi.fn() });
    mockPurchase.mockResolvedValue({ success: true, transactionId: 'default_txn' });
    mockRestorePurchases.mockResolvedValue({ success: true, restoredCount: 0, purchases: [] });
    mockManageSubscriptions.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with empty products array', async () => {
      const { result } = renderHook(() => useStoreKit());

      // Initially products should be empty
      expect(result.current.products).toEqual([]);

      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should initialize with isLoading true', async () => {
      const { result } = renderHook(() => useStoreKit());

      // isLoading should be true initially
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should initialize with no subscription status', async () => {
      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // With mock returning no subscription, status should reflect that
      expect(result.current.subscriptionStatus?.hasActiveSubscription).toBe(false);
    });

    it('should initialize with isPurchasing false', async () => {
      const { result } = renderHook(() => useStoreKit());

      expect(result.current.isPurchasing).toBe(false);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should initialize with no error', async () => {
      const { result } = renderHook(() => useStoreKit());

      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should call loadProducts and checkSubscriptionStatus on mount', async () => {
      renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(mockGetProducts).toHaveBeenCalled();
        expect(mockGetSubscriptionStatus).toHaveBeenCalled();
      });
    });

    it('should set up transaction listener on native platform', async () => {
      mockIsNativePlatform.mockReturnValue(true);

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAddListener).toHaveBeenCalledWith(
        'transactionUpdated',
        expect.any(Function)
      );
    });

    it('should not set up transaction listener on web platform', async () => {
      mockIsNativePlatform.mockReturnValue(false);

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Since we're on web, addListener should not be called
      expect(mockAddListener).not.toHaveBeenCalled();
    });
  });

  describe('loadProducts', () => {
    it('should fetch and cache products', async () => {
      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toEqual(mockProducts);
      expect(mockGetProducts).toHaveBeenCalledWith({
        productIds: expect.arrayContaining([
          'co.nomoinc.nomo.premium.monthly',
          'co.nomoinc.nomo.premium.yearly',
          'co.nomoinc.nomo.lifetime',
        ]),
      });
    });

    it('should set isLoading to true while fetching', async () => {
      mockGetProducts.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ products: mockProducts }), 100))
      );

      const { result } = renderHook(() => useStoreKit());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set isLoading to false after fetching', async () => {
      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.products).toHaveLength(4);
    });

    it('should handle error when fetching products fails', async () => {
      mockGetProducts.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load products. Please try again.');
      expect(result.current.products).toEqual([]);
    });

    it('should clear error on successful reload', async () => {
      // First set up to always reject
      mockGetProducts.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useStoreKit());

      // Wait for the error to be set after failed load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Failed to load products. Please try again.');
      });

      // Reset mock to succeed for retry
      mockGetProducts.mockResolvedValue({ products: mockProducts });

      await act(async () => {
        await result.current.loadProducts();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.products).toEqual(mockProducts);
    });
  });

  describe('purchaseProduct - Success Cases', () => {
    it('should successfully purchase a product', async () => {
      const mockPurchaseResult = {
        success: true,
        transactionId: 'txn_123',
        productId: 'co.nomoinc.nomo.premium.monthly',
        purchaseDate: Date.now(),
        expirationDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      mockPurchase.mockResolvedValue(mockPurchaseResult);

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      expect(purchaseResult).toEqual(expect.objectContaining({ success: true }));
      expect(mockPurchase).toHaveBeenCalledWith({
        productId: 'co.nomoinc.nomo.premium.monthly',
      });
    });

    it('should set isPurchasing to false after purchase completes', async () => {
      mockPurchase.mockResolvedValue({
        success: true,
        transactionId: 'txn_123',
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Before purchase, isPurchasing should be false
      expect(result.current.isPurchasing).toBe(false);

      await act(async () => {
        await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      // After purchase completes, isPurchasing should be false
      expect(result.current.isPurchasing).toBe(false);
    });

    it('should show success toast on successful purchase', async () => {
      mockPurchase.mockResolvedValue({
        success: true,
        transactionId: 'txn_123',
        signedTransaction: 'mock_signed_transaction',
        productId: 'co.nomoinc.nomo.premium.monthly',
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/Purchase|Processing|Successful/),
        })
      );
    });

    it('should refresh subscription status after successful purchase', async () => {
      mockPurchase.mockResolvedValue({
        success: true,
        transactionId: 'txn_123',
        signedTransaction: 'mock_signed_transaction',
        productId: 'co.nomoinc.nomo.premium.monthly',
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = mockGetSubscriptionStatus.mock.calls.length;

      await act(async () => {
        await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      expect(mockGetSubscriptionStatus.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('purchaseProduct - User Cancellation', () => {
    it('should handle user cancellation', async () => {
      mockPurchase.mockResolvedValue({
        success: false,
        cancelled: true,
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      expect(purchaseResult).toEqual(expect.objectContaining({ cancelled: true }));
      expect(result.current.error).toBeNull();
    });

    it('should not show toast on user cancellation', async () => {
      mockPurchase.mockResolvedValue({
        success: false,
        cancelled: true,
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockToastFn.mockClear();

      await act(async () => {
        await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      // Toast should not be called for cancellation
      expect(mockToastFn).not.toHaveBeenCalled();
    });

    it('should set isPurchasing back to false after cancellation', async () => {
      mockPurchase.mockResolvedValue({
        success: false,
        cancelled: true,
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      expect(result.current.isPurchasing).toBe(false);
    });
  });

  describe('purchaseProduct - Pending Purchase', () => {
    it('should handle pending purchase', async () => {
      mockPurchase.mockResolvedValue({
        success: false,
        pending: true,
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Purchase Pending',
          description: 'Your purchase is awaiting approval.',
        })
      );
    });
  });

  describe('purchaseProduct - Error Handling', () => {
    it('should handle purchase error', async () => {
      mockPurchase.mockRejectedValue(new Error('Payment failed'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      // safeStoreKitCall returns a generic failed result with default message
      expect(purchaseResult).toEqual({
        success: false,
        message: 'Purchase failed',
      });
      expect(result.current.error).toBe('Purchase failed. Please try again.');
    });

    it('should show error toast on purchase failure', async () => {
      mockPurchase.mockRejectedValue(new Error('Payment declined'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      // Toast shows generic error message from implementation
      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Purchase Failed',
          description: 'Unable to complete the purchase. Please try again.',
          variant: 'destructive',
        })
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockPurchase.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let purchaseResult;
      await act(async () => {
        purchaseResult = await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      expect(purchaseResult).toEqual({
        success: false,
        message: 'Purchase failed',
      });
    });

    it('should set isPurchasing back to false after error', async () => {
      mockPurchase.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      expect(result.current.isPurchasing).toBe(false);
    });
  });

  describe('restorePurchases - Success Cases', () => {
    it('should restore purchases successfully', async () => {
      mockRestorePurchases.mockResolvedValue({
        success: true,
        restoredCount: 2,
        purchases: [
          {
            productId: 'co.nomoinc.nomo.premium.monthly',
            transactionId: 'txn_restored_1',
            signedTransaction: 'mock_signed_transaction_1',
            purchaseDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
          },
          {
            productId: 'co.nomoinc.nomo.lifetime',
            transactionId: 'txn_restored_2',
            signedTransaction: 'mock_signed_transaction_2',
            purchaseDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
          },
        ],
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let restoreResult;
      await act(async () => {
        restoreResult = await result.current.restorePurchases();
      });

      expect(restoreResult).toBe(true);
      expect(mockRestorePurchases).toHaveBeenCalled();
    });

    it('should show success toast when purchases are restored', async () => {
      mockRestorePurchases.mockResolvedValue({
        success: true,
        restoredCount: 1,
        purchases: [{
          productId: 'co.nomoinc.nomo.premium.monthly',
          transactionId: 'txn_restored_1',
          signedTransaction: 'mock_signed_transaction',
        }],
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.restorePurchases();
      });

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Purchases Restored!',
          description: '1 purchase(s) restored successfully.',
        })
      );
    });

    it('should refresh subscription status after restore', async () => {
      mockRestorePurchases.mockResolvedValue({
        success: true,
        restoredCount: 1,
        purchases: [{
          productId: 'co.nomoinc.nomo.premium.monthly',
          transactionId: 'txn_restored_1',
          signedTransaction: 'mock_signed_transaction',
        }],
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = mockGetSubscriptionStatus.mock.calls.length;

      await act(async () => {
        await result.current.restorePurchases();
      });

      expect(mockGetSubscriptionStatus.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('restorePurchases - No Purchases Found', () => {
    it('should handle no purchases to restore', async () => {
      mockRestorePurchases.mockResolvedValue({
        success: true,
        restoredCount: 0,
        purchases: [],
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let restoreResult;
      await act(async () => {
        restoreResult = await result.current.restorePurchases();
      });

      expect(restoreResult).toBe(false);
    });

    it('should show info toast when no purchases found', async () => {
      mockRestorePurchases.mockResolvedValue({
        success: true,
        restoredCount: 0,
        purchases: [],
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.restorePurchases();
      });

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No Purchases Found',
          description: 'No previous purchases were found to restore.',
        })
      );
    });
  });

  describe('restorePurchases - Error Handling', () => {
    it('should handle restore error', async () => {
      mockRestorePurchases.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let restoreResult;
      await act(async () => {
        restoreResult = await result.current.restorePurchases();
      });

      expect(restoreResult).toBe(false);
      expect(result.current.error).toBe('Failed to restore purchases. Please try again.');
    });

    it('should show error toast on restore failure', async () => {
      mockRestorePurchases.mockRejectedValue(new Error('Connection failed'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.restorePurchases();
      });

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Restore Failed',
          description: 'Unable to restore purchases. Please try again.',
          variant: 'destructive',
        })
      );
    });
  });

  describe('checkSubscriptionStatus', () => {
    it('should return correct status for no subscription', async () => {
      mockGetSubscriptionStatus.mockResolvedValue(mockSubscriptionStatus);

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus?.hasActiveSubscription).toBe(false);
      expect(result.current.subscriptionStatus?.activeSubscriptions).toEqual([]);
    });

    it('should return correct status for active subscription', async () => {
      mockGetSubscriptionStatus.mockResolvedValue(mockActiveSubscriptionStatus);

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus?.hasActiveSubscription).toBe(true);
      expect(result.current.subscriptionStatus?.activeSubscriptions).toHaveLength(1);
    });

    it('should update localStorage for active subscription', async () => {
      mockGetSubscriptionStatus.mockResolvedValue(mockActiveSubscriptionStatus);

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stored = localStorage.getItem(PREMIUM_STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.tier).toBe('premium');
    });

    it('should clear localStorage when no active subscription', async () => {
      // Start with some stored data
      localStorage.setItem(
        PREMIUM_STORAGE_KEY,
        JSON.stringify({ tier: 'premium', expiresAt: null })
      );

      mockGetSubscriptionStatus.mockResolvedValue(mockSubscriptionStatus);

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stored = localStorage.getItem(PREMIUM_STORAGE_KEY);
      expect(stored).toBeNull();
    });

    it('should handle subscription status error gracefully', async () => {
      mockGetSubscriptionStatus.mockRejectedValue(new Error('Failed to check'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not crash, subscription status remains null
      expect(result.current.subscriptionStatus).toBeNull();
    });
  });

  describe('Premium Status Detection', () => {
    it('should detect monthly subscription correctly', async () => {
      mockGetSubscriptionStatus.mockResolvedValue({
        hasActiveSubscription: true,
        activeSubscriptions: [
          {
            productId: 'co.nomoinc.nomo.premium.monthly',
            transactionId: 'txn_monthly',
            purchaseDate: Date.now(),
            expirationDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          },
        ],
        purchasedProducts: [],
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stored = localStorage.getItem(PREMIUM_STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.tier).toBe('premium');
      expect(parsed.expiresAt).toBeDefined();
    });

    it('should detect yearly subscription correctly', async () => {
      mockGetSubscriptionStatus.mockResolvedValue({
        hasActiveSubscription: true,
        activeSubscriptions: [
          {
            productId: 'co.nomoinc.nomo.premium.yearly',
            transactionId: 'txn_yearly',
            purchaseDate: Date.now(),
            expirationDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
          },
        ],
        purchasedProducts: [],
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stored = localStorage.getItem(PREMIUM_STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.tier).toBe('premium');
    });

    it('should detect lifetime purchase correctly', async () => {
      mockGetSubscriptionStatus.mockResolvedValue(mockLifetimeStatus);

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stored = localStorage.getItem(PREMIUM_STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.tier).toBe('lifetime');
      expect(parsed.expiresAt).toBeNull(); // Lifetime has no expiry
    });

    it('should prioritize active subscription over purchased products', async () => {
      mockGetSubscriptionStatus.mockResolvedValue({
        hasActiveSubscription: true,
        activeSubscriptions: [
          {
            productId: 'co.nomoinc.nomo.premium.monthly',
            transactionId: 'txn_active',
            purchaseDate: Date.now(),
            expirationDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          },
        ],
        purchasedProducts: [
          {
            productId: 'co.nomoinc.nomo.lifetime',
            transactionId: 'txn_lifetime',
            purchaseDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
          },
        ],
      });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptionStatus?.hasActiveSubscription).toBe(true);
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const product = result.current.getProductById('co.nomoinc.nomo.premium.monthly');

      expect(product).toEqual(
        expect.objectContaining({
          id: 'co.nomoinc.nomo.premium.monthly',
          displayName: 'Premium Monthly',
        })
      );
    });

    it('should return undefined for non-existent product', async () => {
      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const product = result.current.getProductById('non.existent.product');

      expect(product).toBeUndefined();
    });

    it('should return undefined when products are empty', async () => {
      mockGetProducts.mockResolvedValue({ products: [] });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const product = result.current.getProductById('co.nomoinc.nomo.premium.monthly');

      expect(product).toBeUndefined();
    });
  });

  describe('manageSubscriptions', () => {
    it('should call StoreKit manageSubscriptions', async () => {
      mockManageSubscriptions.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.manageSubscriptions();
      });

      expect(mockManageSubscriptions).toHaveBeenCalled();
    });

    it('should show error toast on manage subscriptions failure', async () => {
      mockManageSubscriptions.mockRejectedValue(new Error('Failed to open'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.manageSubscriptions();
      });

      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Failed to open subscription management.',
          variant: 'destructive',
        })
      );
    });
  });

  describe('Error Handling for Network Failures', () => {
    it('should handle network timeout on getProducts', async () => {
      mockGetProducts.mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load products. Please try again.');
      expect(result.current.products).toEqual([]);
    });

    it('should handle network failure on purchase', async () => {
      mockPurchase.mockRejectedValue(new Error('No internet connection'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.purchaseProduct('co.nomoinc.nomo.premium.monthly');
      });

      // safeStoreKitCall wraps errors into generic messages
      expect(result.current.error).toBe('Purchase failed. Please try again.');
      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Purchase Failed',
          variant: 'destructive',
        })
      );
    });

    it('should handle network failure on restore', async () => {
      mockRestorePurchases.mockRejectedValue(new Error('Server unavailable'));

      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.restorePurchases();
      });

      // safeStoreKitCall wraps errors into generic messages
      expect(result.current.error).toBe('Failed to restore purchases. Please try again.');
    });

    it('should allow retry after network failure', async () => {
      // First set up to always reject
      mockGetProducts.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useStoreKit());

      // Wait for error to be set after failed load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Failed to load products. Please try again.');
      });

      // Reset mock to succeed for retry
      mockGetProducts.mockResolvedValue({ products: mockProducts });

      await act(async () => {
        await result.current.loadProducts();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.products).toEqual(mockProducts);
    });
  });

  describe('Listener Cleanup', () => {
    it('should clean up transaction listener on unmount', async () => {
      const removeListenerMock = vi.fn();
      mockAddListener.mockResolvedValue({ remove: removeListenerMock });

      const { unmount, result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      unmount();

      // Give time for cleanup
      await waitFor(() => {
        expect(removeListenerMock).toHaveBeenCalled();
      });
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties and methods', async () => {
      const { result } = renderHook(() => useStoreKit());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // State properties
      expect(result.current).toHaveProperty('products');
      expect(result.current).toHaveProperty('subscriptionStatus');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isPurchasing');
      expect(result.current).toHaveProperty('error');

      // Methods
      expect(typeof result.current.loadProducts).toBe('function');
      expect(typeof result.current.purchaseProduct).toBe('function');
      expect(typeof result.current.restorePurchases).toBe('function');
      expect(typeof result.current.checkSubscriptionStatus).toBe('function');
      expect(typeof result.current.manageSubscriptions).toBe('function');
      expect(typeof result.current.getProductById).toBe('function');
    });
  });
});
