import { useState } from "react";
import { Crown, ChevronRight, Check, Coins, Sparkles, Zap } from "lucide-react";
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

// Neon-styled save badge
const SaveBadge = ({ text, variant = 'green' }: { text: string; variant?: 'green' | 'amber' }) => {
  const colors = variant === 'green' ? {
    bg: 'linear-gradient(180deg, hsl(120 70% 45%), hsl(120 75% 35%))',
    border: 'hsl(120 60% 55%)',
    glow: '0 0 8px hsl(120 100% 40% / 0.4)',
  } : {
    bg: 'linear-gradient(180deg, hsl(35 80% 55%), hsl(35 85% 45%))',
    border: 'hsl(35 70% 65%)',
    glow: '0 0 8px hsl(35 100% 50% / 0.4)',
  };

  return (
    <span
      className="px-2 py-0.5 text-white text-[9px] font-black rounded uppercase tracking-wider border"
      style={{
        background: colors.bg,
        borderColor: colors.border,
        boxShadow: colors.glow,
        textShadow: '0 1px 0 rgba(0,0,0,0.3)',
      }}
    >
      {text}
    </span>
  );
};

const OwnedBadge = () => (
  <span
    className="px-2 py-0.5 text-white text-[9px] font-black rounded uppercase tracking-wider border flex items-center gap-1"
    style={{
      background: 'linear-gradient(180deg, hsl(140 60% 40%), hsl(140 65% 32%))',
      borderColor: 'hsl(140 50% 50%)',
      boxShadow: '0 0 6px hsl(140 100% 40% / 0.3)',
      textShadow: '0 1px 0 rgba(0,0,0,0.3)',
    }}
  >
    <Check className="w-2.5 h-2.5" /> OWNED
  </span>
);

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

      {/* Premium Hero Card */}
      {!isPremium ? (
        <button
          onClick={() => setShowPremiumModal(true)}
          className="w-full rounded-xl p-4 text-left active:scale-[0.98] transition-transform border-[3px] overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, hsl(35 90% 55%) 0%, hsl(25 90% 50%) 100%)',
            borderColor: 'hsl(40 80% 65%)',
            boxShadow: '0 5px 0 hsl(25 80% 30%), 0 0 20px hsl(35 100% 50% / 0.3)',
          }}
        >
          <div className="retro-scanlines opacity-10" />
          <div className="flex items-center gap-3 relative z-[1]">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                background: 'hsl(35 80% 45% / 0.5)',
                border: '2px solid hsl(40 70% 70% / 0.5)',
              }}
            >
              <Crown className="w-7 h-7 text-white" style={{ filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.3))' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3
                  className="font-black text-white text-[15px] tracking-tight"
                  style={{ textShadow: '0 2px 0 rgba(0,0,0,0.3)' }}
                >
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
        <div
          className="rounded-xl p-4 border-[3px]"
          style={{
            background: 'linear-gradient(180deg, hsl(140 30% 20%) 0%, hsl(140 35% 15%) 100%)',
            borderColor: 'hsl(140 50% 40%)',
            boxShadow: '0 4px 0 hsl(140 40% 12%), 0 0 10px hsl(140 100% 40% / 0.15)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'hsl(140 60% 40%)',
                border: '2px solid hsl(140 50% 55%)',
                boxShadow: '0 3px 0 hsl(140 60% 25%)',
              }}
            >
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black retro-neon-green text-sm uppercase tracking-wider">
                {currentPlan?.name || 'Premium'} Active
              </h3>
              <p className="text-[11px]" style={{ color: 'hsl(140 20% 55%)' }}>
                You have full access
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Background Bundles */}
      <div>
        <h4
          className="text-sm font-black mb-2 px-1 flex items-center gap-2 uppercase tracking-wider"
          style={{ color: 'hsl(260 20% 75%)' }}
        >
          <PixelIcon name="picture-frame" size={16} /> Background Bundles
        </h4>
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
                className="w-full rounded-xl text-left transition-all active:scale-[0.98] border-2 overflow-hidden"
                style={owned ? {
                  background: 'linear-gradient(180deg, hsl(140 25% 18%) 0%, hsl(140 30% 14%) 100%)',
                  borderColor: 'hsl(140 40% 35%)',
                } : {
                  background: 'linear-gradient(180deg, hsl(260 25% 20%) 0%, hsl(260 30% 15%) 100%)',
                  borderColor: 'hsl(200 40% 40%)',
                  boxShadow: '0 3px 0 hsl(260 40% 10%)',
                }}
              >
                {/* Hero preview image */}
                <div className="relative w-full h-36 overflow-hidden rounded-t-xl">
                  <BundlePreviewCarousel images={bundle.previewImages} />
                  {owned && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <OwnedBadge />
                    </div>
                  )}
                  {!owned && (
                    <div className="absolute top-2 right-2">
                      <SaveBadge text={`SAVE ${bundle.savings}`} />
                    </div>
                  )}
                </div>
                {/* Info bar */}
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-bold text-sm block" style={{ color: 'hsl(260 20% 85%)' }}>{bundle.name}</span>
                    <span className="text-[10px]" style={{ color: 'hsl(260 15% 50%)' }}>{bundle.backgroundIds.length} backgrounds</span>
                  </div>
                  {!owned && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] line-through" style={{ color: 'hsl(260 15% 40%)' }}>
                        {bundle.totalValue.toLocaleString()}
                      </span>
                      <div className={cn(
                        "flex items-center gap-1 text-xs font-bold",
                        affordable ? "text-amber-400" : "text-red-400"
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
        <h4
          className="text-sm font-black mb-2 px-1 flex items-center gap-2 uppercase tracking-wider"
          style={{ color: 'hsl(260 20% 75%)' }}
        >
          <PixelIcon name="gift" size={16} /> Special Bundles
        </h4>
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
                className="w-full p-3 rounded-xl text-left transition-all active:scale-[0.98] border-2"
                style={alreadyPurchased ? {
                  background: 'linear-gradient(180deg, hsl(140 25% 18%) 0%, hsl(140 30% 14%) 100%)',
                  borderColor: 'hsl(140 40% 35%)',
                } : {
                  background: 'linear-gradient(180deg, hsl(260 25% 20%) 0%, hsl(260 30% 15%) 100%)',
                  borderColor: 'hsl(280 45% 45%)',
                  boxShadow: '0 3px 0 hsl(260 40% 10%), 0 0 10px hsl(280 80% 50% / 0.1)',
                }}
              >
                <div className="flex items-center gap-3">
                  <PixelIcon name={bundle.icon} size={30} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: 'hsl(260 20% 85%)' }}>{bundle.name}</span>
                      {alreadyPurchased ? (
                        <OwnedBadge />
                      ) : (
                        <SaveBadge text={`SAVE ${bundle.savings}`} />
                      )}
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'hsl(260 15% 50%)' }}>
                      {bundle.description}
                    </p>
                  </div>
                  {!alreadyPurchased && (
                    <span
                      className="text-lg font-black retro-pixel-text retro-neon-pink flex-shrink-0"
                    >
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
        <h4
          className="text-sm font-black mb-2 px-1 flex items-center gap-2 uppercase tracking-wider"
          style={{ color: 'hsl(260 20% 75%)' }}
        >
          <PixelIcon name="money-bag" size={16} /> Best Value
        </h4>
        <button
          onClick={() => {
            setSelectedBundle(bestValuePack);
            setShowBundleConfirm(true);
          }}
          className="w-full p-4 rounded-xl text-left active:scale-[0.98] transition-transform border-[3px] relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, hsl(260 25% 20%) 0%, hsl(260 30% 15%) 100%)',
            borderColor: 'hsl(35 80% 50%)',
            boxShadow: '0 4px 0 hsl(260 40% 10%), 0 0 15px hsl(35 100% 50% / 0.15)',
          }}
        >
          <div className="flex items-center gap-3">
            <PixelIcon name="trophy" size={36} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: 'hsl(260 20% 85%)' }}>{bestValuePack.name}</span>
                <SaveBadge text="BEST VALUE" variant="amber" />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold">{bestValuePack.coinAmount.toLocaleString()}</span>
                {bestValuePack.bonusCoins && bestValuePack.bonusCoins > 0 && (
                  <span className="retro-neon-green font-bold text-sm">+{bestValuePack.bonusCoins.toLocaleString()} bonus</span>
                )}
              </div>
            </div>
            <span className="text-xl font-black retro-pixel-text retro-neon-orange flex-shrink-0">
              {bestValuePack.iapPrice}
            </span>
          </div>
        </button>
      </div>

      {/* Popular Pets Preview */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h4
            className="text-sm font-black flex items-center gap-2 uppercase tracking-wider"
            style={{ color: 'hsl(260 20% 75%)' }}
          >
            <PixelIcon name="fire" size={16} /> Popular Pets
          </h4>
          <button
            onClick={() => setActiveCategory('pets')}
            className="text-xs font-bold retro-neon-orange"
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
                className="p-3 rounded-xl border-2 text-center transition-all active:scale-95"
                style={owned ? {
                  background: 'linear-gradient(180deg, hsl(140 25% 18%) 0%, hsl(140 30% 14%) 100%)',
                  borderColor: 'hsl(140 40% 35%)',
                } : {
                  background: 'linear-gradient(180deg, hsl(260 25% 20%) 0%, hsl(260 30% 15%) 100%)',
                  borderColor: 'hsl(260 35% 35%)',
                  boxShadow: '0 3px 0 hsl(260 40% 10%)',
                }}
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
                <span className="text-xs font-bold block" style={{ color: 'hsl(260 20% 85%)' }}>{pet.name}</span>
                {owned ? (
                  <span className="text-[10px] retro-neon-green font-semibold">Owned</span>
                ) : (
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">{pet.coinPrice?.toLocaleString()}</span>
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
