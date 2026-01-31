import { useState } from "react";
import { Crown, ChevronRight, Check, Coins } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils";
// Note: PixelIcon still used for starter bundle icons and best value icon
import { BackgroundBundle, ShopItem, COIN_PACKS, StarterBundle, CoinPack } from "@/data/ShopData";
import { BACKGROUND_BUNDLES, STARTER_BUNDLES } from "@/data/ShopData";
import type { ShopInventory } from "@/hooks/useShop";
import { getCoinExclusiveAnimals, AnimalData } from "@/data/AnimalDatabase";
import { toast } from "sonner";
import { SpritePreview, BundlePreviewCarousel } from "../ShopPreviewComponents";
import { BundleConfirmDialog } from "../BundleConfirmDialog";
import type { ShopCategory } from "@/data/ShopData";
import { useStoreKit } from "@/hooks/useStoreKit";

interface FeaturedTabProps {
  inventory: ShopInventory;
  isOwned: (itemId: string, category: ShopCategory) => boolean;
  isBundleOwned: (bundleId: string) => boolean;
  purchaseBackgroundBundle: (bundleId: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  purchaseStarterBundle: (bundleId: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  setActiveCategory: (category: ShopCategory) => void;
  setSelectedItem: (item: ShopItem | AnimalData | BackgroundBundle | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  setShowPremiumModal: (show: boolean) => void;
  isPremium: boolean;
  currentPlan: { name: string } | null | undefined;
  coinBalance: number;
  canAfford: (price: number) => boolean;
}

export const FeaturedTab = ({
  inventory,
  isBundleOwned,
  purchaseBackgroundBundle: _purchaseBackgroundBundle, // Available for future use
  purchaseStarterBundle,
  setActiveCategory,
  setSelectedItem,
  setShowPurchaseConfirm,
  setShowPremiumModal,
  isPremium,
  currentPlan,
  canAfford,
}: FeaturedTabProps) => {
  const bestSellingPets = getCoinExclusiveAnimals().slice(0, 2);
  const storeKit = useStoreKit();
  const bestValuePack = COIN_PACKS.find(pack => pack.isBestValue) || COIN_PACKS[COIN_PACKS.length - 1];

  // State for IAP bundle confirmation dialog
  const [selectedBundle, setSelectedBundle] = useState<StarterBundle | CoinPack | null>(null);
  const [showBundleConfirm, setShowBundleConfirm] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleIAPPurchase = async () => {
    if (!selectedBundle?.iapProductId) {
      toast.error("Product not available");
      return;
    }

    setIsPurchasing(true);
    try {
      // Check if it's a starter bundle (has contents to grant)
      const isStarterBundle = 'contents' in selectedBundle;

      const result = await storeKit.purchaseProduct(selectedBundle.iapProductId);
      if (result.success) {
        // For starter bundles, also grant the in-app contents
        if (isStarterBundle) {
          const grantResult = await purchaseStarterBundle(selectedBundle.id);
          toast.success(grantResult.message || `Successfully purchased ${selectedBundle.name}!`);
        } else {
          toast.success(`Successfully purchased ${selectedBundle.name}!`);
        }
        setShowBundleConfirm(false);
      } else if (result.cancelled) {
        // User cancelled — no toast needed
      } else {
        toast.error(result.message || "Purchase failed");
      }
    } catch (_error) {
      toast.error("Unable to complete purchase");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* IAP Bundle Confirmation Dialog */}
      <BundleConfirmDialog
        open={showBundleConfirm}
        onOpenChange={(open) => {
          if (!isPurchasing) {
            setShowBundleConfirm(open);
            if (!open) setSelectedBundle(null);
          }
        }}
        bundle={selectedBundle}
        onPurchase={handleIAPPurchase}
        isPurchasing={isPurchasing}
      />

      {/* Premium Strip - Compact */}
      {!isPremium ? (
        <button
          onClick={() => setShowPremiumModal(true)}
          className="shop-premium-strip active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-black text-white text-sm">Go Premium</span>
              <span className="text-white/70 text-xs ml-1.5">Unlock everything</span>
            </div>
            <span className="text-white/90 font-bold text-xs whitespace-nowrap">$4.99/mo</span>
            <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0" />
          </div>
        </button>
      ) : (
        <div className="shop-premium-active">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-emerald-800 text-sm">
                {currentPlan?.name || 'Premium'} Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Background Bundles */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Background Bundles</span>
        </div>
        <div className="space-y-3">
          {BACKGROUND_BUNDLES.map((bundle) => {
            const owned = isBundleOwned(bundle.id);
            const affordable = canAfford(bundle.coinPrice || 0);
            return (
              <button
                key={bundle.id}
                onClick={() => {
                  if (!owned) {
                    setSelectedItem(bundle);
                    setShowPurchaseConfirm(true);
                  }
                }}
                className={cn(
                  "shop-bundle-card w-full text-left",
                  owned && "owned"
                )}
              >
                {/* Hero preview image */}
                <div className="relative w-full h-36 overflow-hidden rounded-t-xl">
                  <BundlePreviewCarousel images={bundle.previewImages} />
                  {owned && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                      <div className="bg-emerald-500 rounded-full px-3 py-1 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs font-bold text-white">OWNED</span>
                      </div>
                    </div>
                  )}
                  {!owned && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
                      SAVE {bundle.savings}
                    </div>
                  )}
                </div>
                {/* Info bar */}
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-amber-900 block">{bundle.name}</span>
                    <span className="text-[10px] text-amber-700/60">{bundle.backgroundIds.length} backgrounds</span>
                  </div>
                  {!owned && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] text-amber-700/40 line-through">
                        {bundle.totalValue.toLocaleString()}
                      </span>
                      <div className={cn(
                        "shop-price-pill",
                        !affordable && "expensive"
                      )}>
                        <Coins className="w-3 h-3" />
                        <span>{bundle.coinPrice?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Bundles */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Special Bundles</span>
        </div>
        <div className="space-y-2">
          {STARTER_BUNDLES.map((bundle) => {
            // Check if user already has all bundle contents
            const hasCharacter = bundle.contents.characterId ? inventory.ownedCharacters.includes(bundle.contents.characterId) : true;
            const alreadyPurchased = hasCharacter;

            return (
              <button
                key={bundle.id}
                onClick={() => {
                  if (alreadyPurchased) {
                    toast.info("You already have all items from this bundle!");
                    return;
                  }
                  setSelectedBundle(bundle);
                  setShowBundleConfirm(true);
                }}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-all active:scale-[0.98] border-2",
                  alreadyPurchased
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                    : "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <PixelIcon name={bundle.icon} size={30} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{bundle.name}</span>
                      {alreadyPurchased ? (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> OWNED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full">
                          SAVE {bundle.savings}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {bundle.description}
                    </p>
                  </div>
                  {!alreadyPurchased && (
                    <span className="text-lg font-black text-purple-600 dark:text-purple-400">
                      {bundle.iapPrice}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Best Value Coin Pack */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Best Value</span>
        </div>
        <button
          onClick={() => {
            setSelectedBundle(bestValuePack);
            setShowBundleConfirm(true);
          }}
          className="w-full p-4 rounded-xl text-left bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-2 border-amber-300 dark:border-amber-700 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <PixelIcon name="trophy" size={36} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">{bestValuePack.name}</span>
                <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                  BEST VALUE
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-bold">{bestValuePack.coinAmount.toLocaleString()}</span>
                {bestValuePack.bonusCoins && bestValuePack.bonusCoins > 0 && (
                  <span className="text-green-600 dark:text-green-400 font-bold text-sm">+{bestValuePack.bonusCoins.toLocaleString()} bonus</span>
                )}
              </div>
            </div>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              {bestValuePack.iapPrice}
            </span>
          </div>
        </button>
      </div>

      {/* Popular Pets Preview */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Popular Pets</span>
          <button
            onClick={() => setActiveCategory('pets')}
            className="shop-see-all-btn"
          >
            See All →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {bestSellingPets.map((pet) => {
            const owned = inventory.ownedCharacters.includes(pet.id);
            return (
              <button
                key={pet.id}
                onClick={() => {
                  setSelectedItem(pet);
                  if (!owned) setShowPurchaseConfirm(true);
                }}
                className={cn(
                  "shop-pet-card",
                  owned && "owned"
                )}
              >
                <div className="h-14 mb-1.5 flex items-center justify-center overflow-hidden">
                  {pet.spriteConfig ? (
                    <SpritePreview
                      animal={pet}
                      scale={Math.min(1.8, 56 / Math.max(pet.spriteConfig.frameWidth, pet.spriteConfig.frameHeight))}
                    />
                  ) : (
                    <span className="text-3xl">{pet.emoji}</span>
                  )}
                </div>
                <span className="text-xs font-bold block text-amber-900">{pet.name}</span>
                {owned ? (
                  <span className="text-[10px] text-emerald-600 font-bold">Owned</span>
                ) : (
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <Coins className="w-3 h-3 text-amber-500" />
                    <span className="text-xs font-bold text-amber-700">{pet.coinPrice?.toLocaleString()}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
