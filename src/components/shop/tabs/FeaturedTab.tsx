import { useState } from "react";
import { Crown, ChevronRight, Check, Sparkles, Zap } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils";
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
  purchaseBackgroundBundle: _purchaseBackgroundBundle,
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
      const isStarterBundle = 'contents' in selectedBundle;
      const result = await storeKit.purchaseProduct(selectedBundle.iapProductId);

      if (result.success && result.validationResult?.success) {
        if (isStarterBundle && result.validationResult.bundle) {
          // For bundles: grant non-coin contents (characters, boosters, streak freezes)
          // Coins are already granted server-side and synced via event
          const grantResult = await purchaseStarterBundle(selectedBundle.id);
          toast.success(grantResult.message || `Successfully purchased ${selectedBundle.name}!`);
        } else if (result.validationResult.coinPack) {
          // For coin packs: coins are already granted server-side and synced via event
          const coinsGranted = result.validationResult.coinPack.coinsGranted;
          toast.success(`${coinsGranted.toLocaleString()} coins added to your balance!`);
        } else {
          toast.success(`Successfully purchased ${selectedBundle.name}!`);
        }
        setShowBundleConfirm(false);
      } else if (result.cancelled) {
        // User cancelled - no action needed
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

      {/* Premium Hero Card — dark purple stands out as special CTA */}
      {!isPremium ? (
        <button
          onClick={() => setShowPremiumModal(true)}
          className="shop-premium-card"
        >
          <div className="shop-premium-shimmer" />
          <div className="flex items-center gap-3 relative z-[1]">
            <div className="shop-premium-crown">
              <Crown className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.3))' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-white text-[15px] tracking-tight" style={{ textShadow: '0 1px 0 rgba(0,0,0,0.3)' }}>
                  Go Premium
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 text-[9px] font-bold text-white/90">
                  <Zap className="w-2.5 h-2.5" /> 2x Coins
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 text-[9px] font-bold text-white/90">
                  <Sparkles className="w-2.5 h-2.5" /> All Sounds
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 text-[9px] font-bold text-white/90">
                  <Crown className="w-2.5 h-2.5" /> Exclusive Pets
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <span className="font-black text-white text-sm">$4.99</span>
              <span className="text-white/50 text-[10px] font-bold">/month</span>
            </div>
          </div>
          <div className="relative z-[1] flex items-center justify-center gap-1.5 mt-2.5 pt-2 border-t border-white/10">
            <span className="text-white/80 text-[11px] font-bold tracking-wide uppercase">See all plans</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/50" />
          </div>
        </button>
      ) : (
        <div className="shop-list-card green">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-green-700 dark:text-green-400">
                {currentPlan?.name || 'Premium'} Active
              </span>
              <p className="text-xs text-muted-foreground">You have full access</p>
            </div>
          </div>
        </div>
      )}

      {/* Background Bundles — hero image cards */}
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
                className={cn("shop-bundle-card", owned && "green")}
              >
                {/* Hero preview */}
                <div className="relative w-full h-32 overflow-hidden rounded-t-[10px]">
                  <BundlePreviewCarousel images={bundle.previewImages} />
                  {owned && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> OWNED
                      </span>
                    </div>
                  )}
                  {!owned && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full">
                        SAVE {bundle.savings}
                      </span>
                    </div>
                  )}
                </div>
                {/* Info bar */}
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-bold text-sm block">{bundle.name}</span>
                    <span className="text-[10px] text-muted-foreground">{bundle.backgroundIds.length} backgrounds</span>
                  </div>
                  {!owned && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground line-through">
                        {bundle.totalValue.toLocaleString()}
                      </span>
                      <div className={cn(
                        "flex items-center gap-1 text-xs font-bold",
                        affordable ? "text-amber-600" : "text-red-500"
                      )}>
                        <PixelIcon name="coin" size={12} />
                        {bundle.coinPrice?.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Bundles — purple list cards for IAP items */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Special Bundles</span>
        </div>
        <div className="space-y-2">
          {STARTER_BUNDLES.map((bundle) => {
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
                  "shop-list-card",
                  alreadyPurchased ? "green" : "purple"
                )}
              >
                <div className="flex items-center gap-3">
                  <PixelIcon name={bundle.icon} size={30} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{bundle.name}</span>
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
                    <div className="iap-price-button">
                      {bundle.iapPrice}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Best Value Coin Pack — amber card matching PowerUpsTab */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Best Value</span>
        </div>
        <button
          onClick={() => {
            setSelectedBundle(bestValuePack);
            setShowBundleConfirm(true);
          }}
          className="shop-list-card amber best-value"
        >
          <div className="flex items-center gap-3">
            <PixelIcon name="trophy" size={36} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{bestValuePack.name}</span>
                <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded">BEST</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <PixelIcon name="coin" size={12} />
                <span className="text-amber-600 font-bold text-xs">{bestValuePack.coinAmount.toLocaleString()}</span>
                {bestValuePack.bonusCoins && bestValuePack.bonusCoins > 0 && (
                  <span className="text-green-600 text-xs font-semibold">+{bestValuePack.bonusCoins.toLocaleString()}</span>
                )}
              </div>
            </div>
            <div className="iap-price-button best-value">
              {bestValuePack.iapPrice}
            </div>
          </div>
        </button>
      </div>

      {/* Popular Pets — matching CollectionTab pet cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="shop-section-header" style={{ marginBottom: 0 }}>
            <span className="shop-section-title">Popular Pets</span>
          </div>
          <button
            onClick={() => setActiveCategory('pets')}
            className="text-xs text-amber-600 font-bold"
          >
            See All →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
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
                <div className="h-14 mb-1 flex items-center justify-center overflow-hidden">
                  {pet.spriteConfig ? (
                    <SpritePreview
                      animal={pet}
                      scale={Math.min(1.8, 56 / Math.max(pet.spriteConfig.frameWidth, pet.spriteConfig.frameHeight))}
                    />
                  ) : (
                    <span className="text-3xl">{pet.emoji}</span>
                  )}
                </div>
                <span className="text-xs font-bold block">{pet.name}</span>
                {owned ? (
                  <span className="text-[10px] text-green-600 font-semibold">Owned</span>
                ) : (
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <PixelIcon name="coin" size={12} />
                    <span className="text-xs font-bold text-amber-600">{pet.coinPrice?.toLocaleString()}</span>
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
