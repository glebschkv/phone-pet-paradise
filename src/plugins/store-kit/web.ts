import { WebPlugin } from '@capacitor/core';
import { storeKitLogger } from "@/lib/logger";
import type {
  StoreKitPlugin,
  StoreKitProduct,
  PurchaseResult,
  RestoreResult,
  SubscriptionStatus,
  PurchaseHistoryItem
} from './index';
import { SUBSCRIPTION_PLANS } from '@/hooks/usePremiumStatus';

// Development-only logging
const isDev = import.meta.env.DEV;
const log = (...args: unknown[]) => isDev && storeKitLogger.debug('[StoreKit Web]', ...args);

/**
 * Web fallback for StoreKit plugin.
 * Simulates purchases for development/testing ONLY.
 * In production on native devices, the native StoreKit plugin handles actual purchases.
 */
export class StoreKitWeb extends WebPlugin implements StoreKitPlugin {
  private mockPurchases: Map<string, { purchaseDate: number; expirationDate?: number }> = new Map();

  async getProducts(options: { productIds: string[] }): Promise<{ products: StoreKitProduct[] }> {
    log('Getting products:', options.productIds);

    // Return mock products based on our subscription plans
    const products: StoreKitProduct[] = options.productIds.map(id => {
      const plan = SUBSCRIPTION_PLANS.find(p => p.iapProductId === id);

      if (plan) {
        return {
          id: plan.iapProductId,
          displayName: plan.name,
          description: plan.description,
          price: plan.price.replace('$', ''),
          displayPrice: plan.price,
          type: plan.period === 'lifetime' ? 'nonConsumable' : 'autoRenewable',
          subscriptionPeriod: plan.period !== 'lifetime' ? {
            unit: plan.period === 'monthly' ? 'month' : 'year',
            value: 1
          } : undefined
        };
      }

      // Default mock product
      return {
        id,
        displayName: 'Mock Product',
        description: 'Mock product for development',
        price: '0.99',
        displayPrice: '$0.99',
        type: 'consumable'
      };
    });

    return { products };
  }

  async purchase(options: { productId: string }): Promise<PurchaseResult> {
    log('Purchasing:', options.productId);

    // In production web builds, purchases should go through the native app
    if (import.meta.env.PROD) {
      return {
        success: false,
        message: 'In-app purchases are only available in the native app.',
      };
    }

    // Development: Simulate purchase flow
    const plan = SUBSCRIPTION_PLANS.find(p => p.iapProductId === options.productId);

    const now = Date.now();
    let expirationDate: number | undefined;

    if (plan) {
      if (plan.period === 'monthly') {
        expirationDate = now + 30 * 24 * 60 * 60 * 1000;
      } else if (plan.period === 'yearly') {
        expirationDate = now + 365 * 24 * 60 * 60 * 1000;
      }
      // Lifetime has no expiration
    }

    this.mockPurchases.set(options.productId, {
      purchaseDate: now,
      expirationDate
    });

    // Generate a mock transaction ID (in production, this comes from Apple)
    const transactionId = `dev_${now}_${Math.random().toString(36).substring(7)}`;

    return {
      success: true,
      transactionId,
      productId: options.productId,
      purchaseDate: now,
      expirationDate: expirationDate || null
    };
  }

  async restorePurchases(): Promise<RestoreResult> {
    log('Restoring purchases');

    const purchases = Array.from(this.mockPurchases.entries()).map(([productId, data]) => ({
      productId,
      transactionId: `dev_restored_${Date.now()}`,
      purchaseDate: data.purchaseDate,
      expirationDate: data.expirationDate || null
    }));

    return {
      success: true,
      restoredCount: purchases.length,
      purchases
    };
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    log('Getting subscription status');

    const now = Date.now();
    const activeSubscriptions: Array<{
      productId: string;
      transactionId: string;
      purchaseDate: number;
      expirationDate: number | null;
    }> = [];
    const purchasedProducts: Array<{
      productId: string;
      transactionId: string;
      purchaseDate: number;
      expirationDate: number | null;
    }> = [];

    this.mockPurchases.forEach((data, productId) => {
      const purchase = {
        productId,
        transactionId: `dev_${data.purchaseDate}`,
        purchaseDate: data.purchaseDate,
        expirationDate: data.expirationDate || null
      };

      if (data.expirationDate) {
        // Subscription - check if still active
        if (data.expirationDate > now) {
          activeSubscriptions.push(purchase);
        }
      } else {
        // Non-consumable (lifetime)
        purchasedProducts.push(purchase);
      }
    });

    return {
      hasActiveSubscription: activeSubscriptions.length > 0 || purchasedProducts.length > 0,
      activeSubscriptions,
      purchasedProducts
    };
  }

  async getPurchaseHistory(): Promise<{ history: PurchaseHistoryItem[] }> {
    log('Getting purchase history');

    const history = Array.from(this.mockPurchases.entries()).map(([productId, data]) => ({
      productId,
      transactionId: `dev_${data.purchaseDate}`,
      purchaseDate: data.purchaseDate,
      expirationDate: data.expirationDate || null,
      revocationDate: null
    }));

    return { history };
  }

  async manageSubscriptions(): Promise<{ success: boolean }> {
    log('Opening subscription management');
    // In web, we can't open App Store subscription management
    // Could redirect to a web portal if you have one
    window.open('https://apps.apple.com/account/subscriptions', '_blank');
    return { success: true };
  }
}
