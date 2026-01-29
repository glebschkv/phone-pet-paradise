import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, ShoppingBag, Zap, Clock, Star, PawPrint, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/hooks/useShop";
import { useCoinBooster } from "@/hooks/useCoinBooster";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import {
  ShopCategory,
  SHOP_CATEGORIES,
  ShopItem,
  BackgroundBundle,
  PetBundle,
} from "@/data/ShopData";
import { AnimalData } from "@/data/AnimalDatabase";
import { PremiumSubscription } from "@/components/PremiumSubscription";
import { toast } from "sonner";
import { FeaturedTab } from "@/components/shop/tabs/FeaturedTab";
import { PetsTab } from "@/components/shop/tabs/PetsTab";
import { PowerUpsTab } from "@/components/shop/tabs/PowerUpsTab";
import { BundlesTab } from "@/components/shop/tabs/BundlesTab";
import { PurchaseConfirmDialog } from "@/components/shop/PurchaseConfirmDialog";
import { CharacterUnlockModal } from "@/components/shop/CharacterUnlockModal";

const CATEGORY_ICONS: Record<ShopCategory, React.ComponentType<{ className?: string }>> = {
  featured: Star,
  pets: PawPrint,
  bundles: Gift,
  powerups: Zap,
};

export const Shop = () => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>("featured");
  const [selectedItem, setSelectedItem] = useState<ShopItem | AnimalData | null>(null);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [unlockedAnimal, setUnlockedAnimal] = useState<AnimalData | null>(null);

  const {
    inventory,
    isOwned,
    isBundleOwned,
    purchaseItem,
    purchaseCharacter,
    purchaseBackgroundBundle,
    purchasePetBundle,
    purchaseStarterBundle,
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

  const handlePurchase = async () => {
    if (!selectedItem || isPurchasing) return;

    setIsPurchasing(true);
    try {
      let result;
      if ('biome' in selectedItem) {
        result = await purchaseCharacter(selectedItem.id);
      } else if ('backgroundIds' in selectedItem) {
        // Handle background bundle purchase
        result = await purchaseBackgroundBundle(selectedItem.id);
      } else if ('petIds' in selectedItem) {
        // Handle pet bundle purchase
        result = await purchasePetBundle(selectedItem.id);
      } else {
        result = await purchaseItem(selectedItem.id, activeCategory);
      }

      if (result.success) {
        setShowPurchaseConfirm(false);
        // Show unlock celebration for character purchases
        if ('biome' in selectedItem) {
          setUnlockedAnimal(selectedItem as AnimalData);
        } else {
          toast.success(result.message);
        }
        setSelectedItem(null);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsPurchasing(false);
    }
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
        return (
          <BundlesTab
            inventory={inventory}
            isBundleOwned={isBundleOwned}
            setSelectedItem={setSelectedItem}
            setShowPurchaseConfirm={setShowPurchaseConfirm}
            canAfford={canAfford}
          />
        );
      case 'powerups':
        return (
          <PowerUpsTab
            inventory={inventory}
            isOwned={isOwned}
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

      {/* Category tabs */}
      <div className="mx-3 mt-3">
        <div className="flex gap-2 pb-2">
          {SHOP_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "retro-category-tab",
                activeCategory === category.id && "retro-category-tab-active"
              )}
            >
              <div className={`retro-category-icon retro-category-icon-${category.id}`}>
                {(() => {
                  const Icon = CATEGORY_ICONS[category.id];
                  return <Icon className="w-[18px] h-[18px] text-white drop-shadow-sm" />;
                })()}
              </div>
              <span className="retro-category-tab-label">{category.name}</span>
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
        isPurchasing={isPurchasing}
      />

      {/* Character Unlock Celebration Modal */}
      <CharacterUnlockModal
        animal={unlockedAnimal}
        open={!!unlockedAnimal}
        onClose={() => setUnlockedAnimal(null)}
      />

      {/* Premium Subscription Modal */}
      <PremiumSubscription
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};
