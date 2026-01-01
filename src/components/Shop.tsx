import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Coins,
  ShoppingBag,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/hooks/useShop";
import { useCoinBooster } from "@/hooks/useCoinBooster";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import {
  ShopCategory,
  SHOP_CATEGORIES,
  ShopItem,
  BackgroundBundle,
  PET_BUNDLES,
  PetBundle,
} from "@/data/ShopData";
import { getCoinExclusiveAnimals, AnimalData, getAnimalById } from "@/data/AnimalDatabase";
import { PremiumSubscription } from "@/components/PremiumSubscription";
import { toast } from "sonner";
import { FeaturedTab } from "@/components/shop/tabs/FeaturedTab";
import { PetsTab } from "@/components/shop/tabs/PetsTab";
import { PowerUpsTab } from "@/components/shop/tabs/PowerUpsTab";
import { PurchaseConfirmDialog } from "@/components/shop/PurchaseConfirmDialog";
import { SpritePreview, BundlePreviewCarousel } from "@/components/shop/ShopPreviewComponents";
import { RARITY_COLORS, RARITY_BG, RARITY_BORDER, RARITY_GLOW } from "@/components/shop/styles";
import { Check, Star } from "lucide-react";
import { BACKGROUND_BUNDLES } from "@/data/ShopData";

export const Shop = () => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>("featured");
  const [selectedItem, setSelectedItem] = useState<ShopItem | AnimalData | null>(null);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const {
    inventory,
    isOwned,
    isBundleOwned,
    purchaseItem,
    purchaseCharacter,
    purchaseBackgroundBundle,
    purchasePetBundle,
    purchaseStarterBundle,
    equipBadge,
    equipBackground,
    coinBalance,
    canAfford,
  } = useShop();

  const {
    isBoosterActive,
    getTimeRemainingFormatted,
    activeBooster,
    getCurrentMultiplier,
  } = useCoinBooster();

  const { isPremium, currentPlan } = usePremiumStatus();

  const handlePurchase = () => {
    if (!selectedItem) return;

    let result;
    if ('biome' in selectedItem) {
      result = purchaseCharacter(selectedItem.id);
    } else if ('backgroundIds' in selectedItem) {
      // Handle background bundle purchase
      result = purchaseBackgroundBundle(selectedItem.id);
    } else if ('petIds' in selectedItem) {
      // Handle pet bundle purchase
      result = purchasePetBundle(selectedItem.id);
    } else {
      result = purchaseItem(selectedItem.id, activeCategory);
    }

    if (result.success) {
      toast.success(result.message);
      setShowPurchaseConfirm(false);
      setSelectedItem(null);
    } else {
      toast.error(result.message);
    }
  };

  const getRarityStars = (rarity: string) => {
    const count = rarity === 'common' ? 1 : rarity === 'rare' ? 2 : rarity === 'epic' ? 3 : 4;
    return [...Array(count)].map((_, i) => (
      <Star
        key={i}
        className={cn(
          "w-3 h-3",
          rarity === 'legendary' ? "text-amber-400 fill-amber-400 animate-pulse" : "text-amber-400 fill-amber-400"
        )}
      />
    ));
  };


  // Bundles tab - Pet Bundles + Background Bundles
  const renderBundles = () => {
    return (
      <div className="space-y-4">
        {/* Pet Bundles */}
        <div>
          <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
            <span>🐾</span> Pet Bundles
          </h4>
          <div className="space-y-2">
            {PET_BUNDLES.map((bundle) => {
              // Check if user owns all pets in bundle
              const ownedPets = bundle.petIds.filter(id => inventory.ownedCharacters.includes(id));
              const allOwned = ownedPets.length === bundle.petIds.length;
              const partialOwned = ownedPets.length > 0 && ownedPets.length < bundle.petIds.length;
              const affordable = canAfford(bundle.coinPrice || 0);

              // Get preview animals for the bundle
              const previewAnimals = bundle.petIds.slice(0, 3).map(id => getAnimalById(id)).filter(Boolean) as AnimalData[];

              return (
                <button
                  key={bundle.id}
                  onClick={() => {
                    if (!allOwned) {
                      setSelectedItem(bundle as unknown as ShopItem);
                      setShowPurchaseConfirm(true);
                    } else {
                      toast.info("You already own all pets in this bundle!");
                    }
                  }}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all active:scale-[0.98] border-2 overflow-hidden",
                    allOwned
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                      : partialOwned
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
                      : RARITY_BG[bundle.rarity || 'common'],
                    !allOwned && RARITY_BORDER[bundle.rarity || 'common']
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Bundle preview - show sprites */}
                    <div className="flex-shrink-0 w-20 h-16 rounded-lg bg-white/50 dark:bg-black/20 flex items-center justify-center overflow-hidden">
                      {previewAnimals.length > 0 && previewAnimals[0]?.spriteConfig ? (
                        <SpritePreview
                          animal={previewAnimals[0]}
                          scale={Math.min(1.2, 56 / Math.max(previewAnimals[0].spriteConfig.frameWidth, previewAnimals[0].spriteConfig.frameHeight))}
                        />
                      ) : (
                        <span className="text-3xl">{bundle.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{bundle.name}</span>
                        {allOwned ? (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> OWNED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full">
                            SAVE {bundle.savings}
                          </span>
                        )}
                        <span className={cn(
                          "px-1.5 py-0.5 text-[8px] font-bold rounded capitalize",
                          bundle.rarity === 'legendary' ? "bg-amber-200 text-amber-800" :
                          bundle.rarity === 'epic' ? "bg-purple-200 text-purple-800" :
                          bundle.rarity === 'rare' ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-800"
                        )}>
                          {bundle.rarity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {bundle.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {bundle.petIds.length} pets
                        </span>
                        {partialOwned && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400">
                            ({ownedPets.length}/{bundle.petIds.length} owned)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground line-through">
                          {bundle.totalValue.toLocaleString()}
                        </span>
                        {!allOwned && (
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-bold",
                            affordable ? "text-amber-600" : "text-red-500"
                          )}>
                            <Coins className="w-3 h-3" />
                            {bundle.coinPrice?.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Background Bundles */}
        <div>
          <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
            <span>🖼️</span> Background Bundles
          </h4>
          <div className="space-y-2">
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
                    "w-full p-3 rounded-xl text-left transition-all active:scale-[0.98] border-2 overflow-hidden",
                    owned
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                      : "bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-sky-200 dark:border-sky-700"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-20">
                      <BundlePreviewCarousel images={bundle.previewImages} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{bundle.name}</span>
                        {owned ? (
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground line-through">
                          {bundle.totalValue.toLocaleString()}
                        </span>
                        {!owned && (
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-bold",
                            affordable ? "text-amber-600" : "text-red-500"
                          )}>
                            <Coins className="w-3 h-3" />
                            {bundle.coinPrice?.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'featured':
        return (
          <FeaturedTab
            inventory={inventory}
            isOwned={isOwned}
            isBundleOwned={isBundleOwned}
            purchaseBackgroundBundle={purchaseBackgroundBundle}
            purchaseStarterBundle={purchaseStarterBundle}
            setActiveCategory={setActiveCategory}
            setSelectedItem={setSelectedItem}
            setShowPurchaseConfirm={setShowPurchaseConfirm}
            setShowPremiumModal={setShowPremiumModal}
            isPremium={isPremium}
            currentPlan={currentPlan}
            coinBalance={coinBalance}
            canAfford={canAfford}
          />
        );
      case 'pets':
        return (
          <PetsTab
            inventory={inventory}
            isOwned={isOwned}
            equipBackground={equipBackground}
            setSelectedItem={setSelectedItem}
            setShowPurchaseConfirm={setShowPurchaseConfirm}
            canAfford={canAfford}
          />
        );
      case 'bundles':
        return renderBundles();
      case 'powerups':
        return (
          <PowerUpsTab
            inventory={inventory}
            isOwned={isOwned}
            equipBadge={equipBadge}
            setSelectedItem={setSelectedItem}
            setShowPurchaseConfirm={setShowPurchaseConfirm}
            canAfford={canAfford}
            isBoosterActive={isBoosterActive}
            getTimeRemainingFormatted={getTimeRemainingFormatted}
            activeBooster={activeBooster}
            getCurrentMultiplier={getCurrentMultiplier}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="retro-shop-container h-full flex flex-col">
      <div className="retro-corner retro-corner-tl" />
      <div className="retro-corner retro-corner-tr" />

      {/* Header */}
      <div className="retro-shop-header mx-3 mt-3">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="retro-shop-icon">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight">Shop</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Pets, Items & More
              </p>
            </div>
          </div>

          <div className="retro-coin-display">
            <Coins className="w-5 h-5 text-amber-600" />
            <span className="font-black text-amber-700 dark:text-amber-400">
              {coinBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Active booster indicator */}
        {isBoosterActive() && activeBooster && (
          <div className="retro-booster-banner mx-4 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600 animate-pulse" />
              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                {getCurrentMultiplier()}x Boost Active!
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
              <Clock className="w-3 h-3" />
              <span className="font-mono font-bold">{getTimeRemainingFormatted()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Category tabs - Now just 4 clean tabs */}
      <div className="mx-3 mt-3">
        <div className="flex gap-2 pb-2">
          {SHOP_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-xl flex flex-col items-center gap-1 transition-all",
                activeCategory === category.id
                  ? "bg-amber-500 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              )}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-tight">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content - Scrollable area that stops at taskbar */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 pt-3 pb-6">
          {renderContent()}
        </div>
      </ScrollArea>

      {/* Purchase Confirmation Modal */}
      <PurchaseConfirmDialog
        open={showPurchaseConfirm}
        onOpenChange={setShowPurchaseConfirm}
        selectedItem={selectedItem as ShopItem | AnimalData | BackgroundBundle | PetBundle | null}
        onPurchase={handlePurchase}
        canAfford={canAfford}
        coinBalance={coinBalance}
      />

      {/* Premium Subscription Modal */}
      <PremiumSubscription
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};
