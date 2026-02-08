import { registerPlugin } from '@capacitor/core';

export interface StoreKitProduct {
  id: string;
  displayName: string;
  description: string;
  price: string;
  displayPrice: string;
  type: 'consumable' | 'nonConsumable' | 'autoRenewable' | 'nonRenewable' | 'unknown';
  subscriptionPeriod?: {
    unit: 'day' | 'week' | 'month' | 'year' | 'unknown';
    value: number;
  };
}

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  pending?: boolean;
  message?: string;
  transactionId?: string;
  originalTransactionId?: string;
  productId?: string;
  purchaseDate?: number;
  expirationDate?: number | null;
  signedTransaction?: string;
  environment?: 'sandbox' | 'production';
  storefrontCountryCode?: string;
}

export interface RestoredPurchase {
  productId: string;
  transactionId: string;
  originalTransactionId?: string;
  purchaseDate: number;
  expirationDate?: number | null;
  signedTransaction?: string;
  environment?: 'sandbox' | 'production';
  isUpgraded?: boolean;
}

export interface RestoreResult {
  success: boolean;
  restoredCount: number;
  purchases: RestoredPurchase[];
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  activeSubscriptions: RestoredPurchase[];
  purchasedProducts: RestoredPurchase[];
}

export interface PurchaseHistoryItem {
  productId: string;
  transactionId: string;
  purchaseDate: number;
  expirationDate?: number | null;
  revocationDate?: number | null;
}

export interface StoreKitPlugin {
  /**
   * Get products from the App Store
   */
  getProducts(options: { productIds: string[] }): Promise<{ products: StoreKitProduct[] }>;

  /**
   * Purchase a product.
   * The transaction is NOT finished on the native side — call finishTransaction()
   * after successful server validation.
   */
  purchase(options: { productId: string }): Promise<PurchaseResult>;

  /**
   * Finish a transaction after server validation.
   * Must be called after purchase + server validation to tell Apple the purchase is complete.
   */
  finishTransaction(options: { transactionId: string }): Promise<{ success: boolean }>;

  /**
   * Restore previous purchases
   */
  restorePurchases(): Promise<RestoreResult>;

  /**
   * Get current subscription status
   */
  getSubscriptionStatus(): Promise<SubscriptionStatus>;

  /**
   * Get full purchase history
   */
  getPurchaseHistory(): Promise<{ history: PurchaseHistoryItem[] }>;

  /**
   * Open subscription management in App Store
   */
  manageSubscriptions(): Promise<{ success: boolean }>;

  /**
   * Listen for transaction updates
   */
  addListener(
    eventName: 'transactionUpdated',
    listenerFunc: (data: { productId: string; transactionId: string; purchaseDate: number }) => void
  ): Promise<{ remove: () => void }>;
}

const StoreKit = registerPlugin<StoreKitPlugin>('StoreKit', {
  web: () => import('./web').then(m => new m.StoreKitWeb()),
});

export { StoreKit };
