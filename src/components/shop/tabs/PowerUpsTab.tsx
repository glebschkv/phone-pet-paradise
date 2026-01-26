import { Coins, Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShopItem, getShopItemsByCategory, COIN_PACKS, PROFILE_BADGES, CoinPack } from "@/data/ShopData";
import type { ShopInventory } from "@/hooks/useShop";
import { AnimalData } from "@/data/AnimalDatabase";
import { toast } from "sonner";
import { RARITY_BG, RARITY_BORDER } from "../styles";
import type { ShopCategory } from "@/data/ShopData";
import { useStoreKit } from "@/hooks/useStoreKit";

interface PowerUpsTabProps {
  inventory: ShopInventory;
  isOwned: (itemId: string, category: ShopCategory) => boolean;
  equipBadge: (badgeId: string | null) => void;
  setSelectedItem: (item: ShopItem | AnimalData | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
  isBoosterActive: () => boolean;
}

export const PowerUpsTab = ({
  inventory,
  isOwned,
  equipBadge,
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

  const handlePurchaseCoinPack = async (pack: CoinPack) => {
    if (!pack.iapProductId) {
      toast.error("Product not available");
      return;
    }

    try {
      const result = await storeKit.purchaseProduct(pack.iapProductId);
      if (result.success) {
        toast.success(`Successfully purchased ${pack.name}!`);
      } else if (result.cancelled) {
        // User cancelled - no toast needed
      } else {
        toast.error(result.message || "Purchase failed");
      }
    } catch (_error) {
      toast.error("Unable to complete purchase");
    }
  };

  const handleEquipBadge = (badgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (inventory.equippedBadge === badgeId) {
      // Unequip
      equipBadge(null);
      toast.success("Badge unequipped");
    } else {
      equipBadge(badgeId);
      toast.success("Badge equipped!");
    }
  };

  return (
    <div className="space-y-4">
      {/* Coin Boosters */}
      <div>
        <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
          <span>🚀</span> Coin Boosters
        </h4>
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
                  "w-full p-3 rounded-xl text-left transition-all active:scale-[0.98] border-2",
                  boosterActive
                    ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300"
                    : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{booster.icon}</span>
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
        <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
          <span>🧊</span> Streak Protection
        </h4>
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
                className={cn(
                  "p-3 rounded-xl border-2 text-center transition-all active:scale-95",
                  "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-700"
                )}
              >
                <span className="text-2xl block mb-1">{item.icon}</span>
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

      {/* Profile Badges */}
      <div>
        <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
          <span>🏅</span> Profile Badges
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {PROFILE_BADGES.map((badge) => {
            const owned = isOwned(badge.id, 'customize');
            const affordable = canAfford(badge.coinPrice || 0);
            const isEquipped = inventory.equippedBadge === badge.id;
            return (
              <button
                key={badge.id}
                onClick={() => {
                  if (owned) {
                    handleEquipBadge(badge.id, { stopPropagation: () => {} } as React.MouseEvent);
                  } else {
                    setSelectedItem(badge);
                    setShowPurchaseConfirm(true);
                  }
                }}
                className={cn(
                  "relative p-2 rounded-xl border-2 text-center transition-all active:scale-95",
                  isEquipped
                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-400 ring-2 ring-purple-300"
                    : owned
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300"
                    : RARITY_BG[badge.rarity || 'common'],
                  !owned && RARITY_BORDER[badge.rarity || 'common']
                )}
              >
                {isEquipped ? (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                    <Palette className="w-2.5 h-2.5 text-white" />
                  </div>
                ) : owned && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <span className="text-2xl block mb-1">{badge.icon}</span>
                <span className="text-[10px] font-bold block leading-tight">{badge.name}</span>
                {owned ? (
                  <div className="text-[8px] font-medium mt-1 text-purple-600 dark:text-purple-400">
                    {isEquipped ? "Unequip" : "Equip"}
                  </div>
                ) : (
                  <div className={cn(
                    "flex items-center justify-center gap-0.5 mt-1 text-[9px] font-bold",
                    affordable ? "text-amber-600" : "text-red-500"
                  )}>
                    <Coins className="w-2.5 h-2.5" />
                    {badge.coinPrice?.toLocaleString()}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Coin Packs */}
      <div>
        <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
          <span>💰</span> Buy Coins
        </h4>
        <div className="space-y-2">
          {coins.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handlePurchaseCoinPack(pack)}
              className={cn(
                "w-full p-3 rounded-xl text-left transition-all active:scale-[0.98] border-2",
                pack.isBestValue
                  ? "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-300"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{pack.icon}</span>
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
