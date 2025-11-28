import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Coins,
  ShoppingBag,
  Zap,
  Lock,
  Check,
  Star,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/hooks/useShop";
import { useCoinBooster } from "@/hooks/useCoinBooster";
import {
  ShopCategory,
  SHOP_CATEGORIES,
  getShopItemsByCategory,
  ShopItem,
  COIN_PACKS,
} from "@/data/ShopData";
import { getCoinExclusiveAnimals, AnimalData } from "@/data/AnimalDatabase";
import { toast } from "sonner";

const RARITY_COLORS = {
  common: "from-slate-400 to-slate-500",
  rare: "from-blue-400 to-blue-500",
  epic: "from-purple-400 to-purple-500",
  legendary: "from-amber-400 to-amber-500",
};

const RARITY_BORDERS = {
  common: "border-slate-300",
  rare: "border-blue-300",
  epic: "border-purple-300",
  legendary: "border-amber-300",
};

export const Shop = () => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>("characters");
  const [selectedItem, setSelectedItem] = useState<ShopItem | AnimalData | null>(null);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);

  const {
    inventory,
    isOwned,
    purchaseItem,
    purchaseCharacter,
    coinBalance,
    canAfford,
  } = useShop();

  const {
    isBoosterActive,
    getTimeRemainingFormatted,
    activeBooster,
    getCurrentMultiplier,
  } = useCoinBooster();

  const handlePurchase = () => {
    if (!selectedItem) return;

    let result;
    if ('biome' in selectedItem) {
      // It's an animal
      result = purchaseCharacter(selectedItem.id);
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

  const renderCharacters = () => {
    const characters = getCoinExclusiveAnimals();

    return (
      <div className="grid grid-cols-2 gap-3">
        {characters.map((character) => {
          const owned = inventory.ownedCharacters.includes(character.id);
          const affordable = canAfford(character.coinPrice || 0);

          return (
            <button
              key={character.id}
              onClick={() => {
                setSelectedItem(character);
                if (!owned) setShowPurchaseConfirm(true);
              }}
              className={cn(
                "rounded-xl p-4 flex flex-col items-center relative transition-all active:scale-95",
                "border-2",
                owned ? "bg-green-50 border-green-200" : "bg-card",
                !owned && RARITY_BORDERS[character.rarity]
              )}
              style={{
                boxShadow: '0 3px 0 hsl(var(--border) / 0.6)',
              }}
            >
              {/* Owned badge */}
              {owned && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Rarity gradient header */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-gradient-to-r",
                RARITY_COLORS[character.rarity]
              )} />

              {/* Character emoji */}
              <div className="text-4xl mb-2 mt-1">
                {character.emoji}
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-1">
                {[...Array(character.rarity === 'common' ? 1 : character.rarity === 'rare' ? 2 : character.rarity === 'epic' ? 3 : 4)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3 h-3 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>

              {/* Name */}
              <span className="text-xs font-bold text-center mb-2">
                {character.name}
              </span>

              {/* Price or Owned */}
              {owned ? (
                <span className="text-xs font-semibold text-green-600">
                  Owned
                </span>
              ) : (
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                  affordable ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"
                )}>
                  <Coins className="w-3 h-3" />
                  {character.coinPrice?.toLocaleString()}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderShopItems = () => {
    if (activeCategory === "characters") {
      return renderCharacters();
    }

    if (activeCategory === "coins") {
      return renderCoinPacks();
    }

    const items = getShopItemsByCategory(activeCategory);

    return (
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const owned = isOwned(item.id, activeCategory);
          const affordable = item.coinPrice ? canAfford(item.coinPrice) : true;
          const isBooster = activeCategory === "boosters";
          const boosterActive = isBooster && isBoosterActive();

          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedItem(item);
                if (!owned && !(isBooster && boosterActive)) {
                  setShowPurchaseConfirm(true);
                }
              }}
              disabled={isBooster && boosterActive && !owned}
              className={cn(
                "rounded-xl p-4 flex flex-col items-center relative transition-all active:scale-95",
                "border-2",
                owned ? "bg-green-50 border-green-200" : "bg-card border-border",
                (isBooster && boosterActive) && "opacity-50",
                item.rarity && !owned && RARITY_BORDERS[item.rarity]
              )}
              style={{
                boxShadow: '0 3px 0 hsl(var(--border) / 0.6)',
              }}
            >
              {/* Owned badge */}
              {owned && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Limited badge */}
              {item.isLimited && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded">
                  LIMITED
                </div>
              )}

              {/* Rarity gradient header */}
              {item.rarity && (
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-gradient-to-r",
                  RARITY_COLORS[item.rarity]
                )} />
              )}

              {/* Icon */}
              <div className="text-3xl mb-2 mt-1">
                {item.icon}
              </div>

              {/* Name */}
              <span className="text-xs font-bold text-center mb-1">
                {item.name}
              </span>

              {/* Description */}
              <span className="text-[10px] text-muted-foreground text-center mb-2 line-clamp-2">
                {item.description}
              </span>

              {/* Price */}
              {owned ? (
                <span className="text-xs font-semibold text-green-600">
                  Owned
                </span>
              ) : item.coinPrice ? (
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                  affordable ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"
                )}>
                  <Coins className="w-3 h-3" />
                  {item.coinPrice.toLocaleString()}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  };

  const renderCoinPacks = () => {
    return (
      <div className="space-y-3">
        {COIN_PACKS.map((pack) => (
          <button
            key={pack.id}
            onClick={() => {
              toast.info("In-app purchases coming soon!");
            }}
            className={cn(
              "w-full rounded-xl p-4 flex items-center gap-4 relative transition-all active:scale-[0.98]",
              "border-2 bg-card",
              pack.rarity && RARITY_BORDERS[pack.rarity]
            )}
            style={{
              boxShadow: '0 3px 0 hsl(var(--border) / 0.6)',
            }}
          >
            {/* Best value badge */}
            {pack.isBestValue && (
              <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold rounded-full shadow">
                BEST VALUE
              </div>
            )}

            {/* Rarity gradient header */}
            {pack.rarity && (
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-gradient-to-r",
                RARITY_COLORS[pack.rarity]
              )} />
            )}

            {/* Icon */}
            <div className="text-4xl">
              {pack.icon}
            </div>

            {/* Info */}
            <div className="flex-1 text-left">
              <div className="font-bold text-sm">{pack.name}</div>
              <div className="text-amber-600 font-bold">
                {pack.coinAmount.toLocaleString()} coins
                {pack.bonusCoins && (
                  <span className="text-green-600 ml-1">
                    +{pack.bonusCoins.toLocaleString()} bonus!
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-bold">
              {pack.iapPrice}
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24" style={{
      background: 'linear-gradient(180deg, hsl(45 60% 90%) 0%, hsl(45 40% 95%) 50%, hsl(200 30% 95%) 100%)'
    }}>
      {/* Header with coin balance */}
      <div className="retro-card mx-3 mt-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold">Shop</div>
              <div className="text-xs text-muted-foreground">
                Exclusive items & characters
              </div>
            </div>
          </div>

          {/* Coin balance */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-200 px-4 py-2 rounded-full border-2 border-amber-300">
            <Coins className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-700">
              {coinBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Active booster indicator */}
        {isBoosterActive() && activeBooster && (
          <div className="mt-3 flex items-center gap-2 bg-gradient-to-r from-purple-100 to-purple-200 px-3 py-2 rounded-lg border border-purple-300">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">
              {getCurrentMultiplier()}x Coin Boost Active
            </span>
            <div className="flex items-center gap-1 ml-auto text-xs text-purple-600">
              <Clock className="w-3 h-3" />
              {getTimeRemainingFormatted()}
            </div>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="mx-3 mt-3 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {SHOP_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all",
                activeCategory === category.id
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md"
                  : "bg-card border-2 border-border text-muted-foreground"
              )}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shop items */}
      <div className="px-3 pt-3">
        {renderShopItems()}
      </div>

      {/* Purchase Confirmation Modal */}
      <Dialog open={showPurchaseConfirm} onOpenChange={setShowPurchaseConfirm}>
        <DialogContent className="max-w-xs retro-card border-2 border-border p-0 overflow-hidden">
          {selectedItem && (
            <>
              <div className="p-6 text-center" style={{
                background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, hsl(var(--card)) 100%)'
              }}>
                {/* Item icon/emoji */}
                <div className="text-5xl mb-3">
                  {'emoji' in selectedItem ? selectedItem.emoji : selectedItem.icon}
                </div>

                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">
                    {selectedItem.name}
                  </DialogTitle>
                </DialogHeader>

                {/* Rarity badge */}
                {'rarity' in selectedItem && selectedItem.rarity && (
                  <div className="flex justify-center mt-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold capitalize text-white",
                      `bg-gradient-to-r ${RARITY_COLORS[selectedItem.rarity]}`
                    )}>
                      {selectedItem.rarity}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {selectedItem.description}
                </p>

                {/* Price display */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-muted-foreground">Price:</span>
                  <div className="flex items-center gap-1 text-amber-600 font-bold text-lg">
                    <Coins className="w-5 h-5" />
                    {('coinPrice' in selectedItem ? selectedItem.coinPrice : 0)?.toLocaleString()}
                  </div>
                </div>

                {/* Balance after purchase */}
                <div className="text-center text-sm text-muted-foreground">
                  Balance after: {(coinBalance - ('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0)).toLocaleString()} coins
                </div>

                {/* Purchase button */}
                <button
                  onClick={handlePurchase}
                  disabled={!canAfford('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0)}
                  className={cn(
                    "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2",
                    canAfford('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0)
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {canAfford('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0) ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Purchase
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Not Enough Coins
                    </>
                  )}
                </button>

                {/* Cancel button */}
                <button
                  onClick={() => setShowPurchaseConfirm(false)}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
