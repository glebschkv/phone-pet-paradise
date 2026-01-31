import { useState } from "react";
import { Coins } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils";
import { ShopItem, getShopItemsByCategory, COIN_PACKS, CoinPack } from "@/data/ShopData";
import type { ShopInventory } from "@/hooks/useShop";
import { AnimalData } from "@/data/AnimalDatabase";
import { toast } from "sonner";
import type { ShopCategory } from "@/data/ShopData";
import { useStoreKit } from "@/hooks/useStoreKit";
import { BundleConfirmDialog } from "../BundleConfirmDialog";

interface PowerUpsTabProps {
  inventory: ShopInventory;
  isOwned: (itemId: string, category: ShopCategory) => boolean;
  setSelectedItem: (item: ShopItem | AnimalData | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
  isBoosterActive: () => boolean;
  getTimeRemainingFormatted: () => string;
  activeBooster: { boosterId: string; multiplier: number; activatedAt: number; expiresAt: number } | null;
  getCurrentMultiplier: () => number;
}

export const PowerUpsTab = ({
  setSelectedItem,
  setShowPurchaseConfirm,
  canAfford,
  isBoosterActive,
}: PowerUpsTabProps) => {
  const items = getShopItemsByCategory('powerups');
  const boosters = items.filter(i => i.id.includes('boost') || i.id.includes('pass'));
  const utilities = items.filter(i => i.id.includes('streak'));
  const coins = COIN_PACKS;
  const storeKit = useStoreKit();

  // State for coin pack confirmation dialog
  const [selectedPack, setSelectedPack] = useState<CoinPack | null>(null);
  const [showPackConfirm, setShowPackConfirm] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleConfirmPurchase = async () => {
    if (!selectedPack?.iapProductId) {
      toast.error("Product not available");
      return;
    }

    setIsPurchasing(true);
    try {
      const result = await storeKit.purchaseProduct(selectedPack.iapProductId);
      if (result.success) {
        toast.success(`Successfully purchased ${selectedPack.name}!`);
        setShowPackConfirm(false);
      } else if (result.cancelled) {
        // User cancelled - no toast needed
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
      {/* Coin Pack Confirmation Dialog */}
      <BundleConfirmDialog
        open={showPackConfirm}
        onOpenChange={(open) => {
          if (!isPurchasing) {
            setShowPackConfirm(open);
            if (!open) setSelectedPack(null);
          }
        }}
        bundle={selectedPack}
        onPurchase={handleConfirmPurchase}
        isPurchasing={isPurchasing}
      />

      {/* Coin Boosters */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Coin Boosters</span>
        </div>
        <div className="space-y-2">
          {boosters.map((booster) => {
            const boosterActive = isBoosterActive();
            return (
              <button
                key={booster.id}
                onClick={() => {
                  if (!boosterActive) {
                    setSelectedItem(booster);
                    setShowPurchaseConfirm(true);
                  }
                }}
                disabled={boosterActive}
                className={cn(
                  "shop-list-card purple",
                  boosterActive && "disabled"
                )}
              >
                <div className="flex items-center gap-3">
                  <PixelIcon name={booster.icon} size={24} />
                  <div className="flex-1">
                    <span className="font-bold text-sm">{booster.name}</span>
                    <p className="text-xs text-muted-foreground">{booster.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                      <Coins className="w-3.5 h-3.5" />
                      {booster.coinPrice?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Utility Items */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Streak Protection</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {utilities.map((item) => {
            const affordable = canAfford(item.coinPrice || 0);
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setShowPurchaseConfirm(true);
                }}
                className="shop-grid-card cyan"
              >
                <PixelIcon name={item.icon} size={24} className="block mb-1 mx-auto" />
                <span className="text-[10px] font-bold block">{item.name}</span>
                <div className={cn(
                  "flex items-center justify-center gap-0.5 mt-1 text-xs font-bold",
                  affordable ? "text-amber-600" : "text-red-500"
                )}>
                  <Coins className="w-3 h-3" />
                  {item.coinPrice?.toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coin Packs */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Buy Coins</span>
        </div>
        <div className="space-y-2">
          {coins.map((pack) => (
            <button
              key={pack.id}
              onClick={() => {
                setSelectedPack(pack);
                setShowPackConfirm(true);
              }}
              className={cn(
                "shop-list-card",
                pack.isBestValue ? "amber best-value" : ""
              )}
            >
              <div className="flex items-center gap-3">
                <PixelIcon name={pack.icon} size={24} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{pack.name}</span>
                    {pack.isBestValue && (
                      <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded">BEST</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Coins className="w-3 h-3 text-amber-500" />
                    <span className="text-amber-600 font-bold text-xs">{pack.coinAmount.toLocaleString()}</span>
                    {pack.bonusCoins && (
                      <span className="text-green-600 text-xs font-semibold">+{pack.bonusCoins.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-green-500 rounded-lg">
                  <span className="font-bold text-white text-sm">{pack.iapPrice}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
