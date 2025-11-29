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
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-orange-500",
};

const RARITY_BG = {
  common: "bg-slate-100 dark:bg-slate-800",
  rare: "bg-blue-50 dark:bg-blue-900/30",
  epic: "bg-purple-50 dark:bg-purple-900/30",
  legendary: "bg-amber-50 dark:bg-amber-900/30",
};

const RARITY_BORDER = {
  common: "border-slate-300 dark:border-slate-600",
  rare: "border-blue-300 dark:border-blue-500",
  epic: "border-purple-300 dark:border-purple-500",
  legendary: "border-amber-300 dark:border-amber-500",
};

const RARITY_GLOW = {
  common: "",
  rare: "shadow-blue-200/50 dark:shadow-blue-500/20",
  epic: "shadow-purple-200/50 dark:shadow-purple-500/20",
  legendary: "shadow-amber-200/50 dark:shadow-amber-500/30",
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
                "retro-shop-card group relative overflow-hidden",
                "transition-all duration-200 active:scale-95",
                owned && "retro-shop-card-owned",
                !owned && RARITY_BG[character.rarity],
                !owned && RARITY_BORDER[character.rarity],
                !owned && character.rarity !== 'common' && `shadow-lg ${RARITY_GLOW[character.rarity]}`
              )}
            >
              {/* Scanline overlay */}
              <div className="retro-scanlines" />

              {/* Rarity stripe */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                RARITY_COLORS[character.rarity]
              )} />

              {/* Owned badge */}
              {owned && (
                <div className="absolute top-2 right-2 retro-badge-owned">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              {/* Character display */}
              <div className="relative pt-3 pb-2 px-3 flex flex-col items-center">
                {/* Character emoji with pixel shadow */}
                <div className="text-4xl mb-2 retro-pixel-shadow">
                  {character.emoji}
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-1.5">
                  {getRarityStars(character.rarity)}
                </div>

                {/* Name with retro font */}
                <span className="text-xs font-black text-center tracking-tight uppercase mb-2">
                  {character.name}
                </span>

                {/* Price tag */}
                {owned ? (
                  <div className="retro-price-tag-owned">
                    <span className="text-[10px] font-black uppercase">Owned</span>
                  </div>
                ) : (
                  <div className={cn(
                    "retro-price-tag",
                    affordable ? "retro-price-tag-afford" : "retro-price-tag-expensive"
                  )}>
                    <Coins className="w-3.5 h-3.5" />
                    <span className="text-xs font-black">{character.coinPrice?.toLocaleString()}</span>
                  </div>
                )}
              </div>
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
                "retro-shop-card group relative overflow-hidden",
                "transition-all duration-200 active:scale-95",
                owned && "retro-shop-card-owned",
                !owned && item.rarity && RARITY_BG[item.rarity],
                !owned && item.rarity && RARITY_BORDER[item.rarity],
                !owned && item.rarity && item.rarity !== 'common' && `shadow-lg ${RARITY_GLOW[item.rarity]}`,
                (isBooster && boosterActive) && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Scanline overlay */}
              <div className="retro-scanlines" />

              {/* Rarity stripe */}
              {item.rarity && (
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                  RARITY_COLORS[item.rarity]
                )} />
              )}

              {/* Owned badge */}
              {owned && (
                <div className="absolute top-2 right-2 retro-badge-owned">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              {/* Limited badge */}
              {item.isLimited && (
                <div className="absolute top-2 left-2 retro-badge-limited">
                  <span className="text-[8px] font-black uppercase tracking-wider">Limited</span>
                </div>
              )}

              {/* Item display */}
              <div className="relative pt-3 pb-2 px-3 flex flex-col items-center">
                {/* Icon */}
                <div className="text-3xl mb-2 retro-pixel-shadow">
                  {item.icon}
                </div>

                {/* Stars */}
                {item.rarity && (
                  <div className="flex gap-0.5 mb-1">
                    {getRarityStars(item.rarity)}
                  </div>
                )}

                {/* Name */}
                <span className="text-[10px] font-black text-center tracking-tight uppercase mb-1">
                  {item.name}
                </span>

                {/* Description */}
                <span className="text-[9px] text-muted-foreground text-center mb-2 line-clamp-2 leading-tight px-1">
                  {item.description}
                </span>

                {/* Price */}
                {owned ? (
                  <div className="retro-price-tag-owned">
                    <span className="text-[10px] font-black uppercase">Owned</span>
                  </div>
                ) : item.coinPrice ? (
                  <div className={cn(
                    "retro-price-tag",
                    affordable ? "retro-price-tag-afford" : "retro-price-tag-expensive"
                  )}>
                    <Coins className="w-3.5 h-3.5" />
                    <span className="text-xs font-black">{item.coinPrice.toLocaleString()}</span>
                  </div>
                ) : null}
              </div>
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
              "retro-shop-card-horizontal w-full relative overflow-hidden",
              "transition-all duration-200 active:scale-[0.98]",
              pack.rarity && RARITY_BG[pack.rarity],
              pack.rarity && RARITY_BORDER[pack.rarity]
            )}
          >
            {/* Scanline overlay */}
            <div className="retro-scanlines" />

            {/* Rarity stripe */}
            {pack.rarity && (
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                RARITY_COLORS[pack.rarity]
              )} />
            )}

            {/* Best value badge */}
            {pack.isBestValue && (
              <div className="absolute -top-1 -right-1 retro-badge-best-value">
                <span className="text-[9px] font-black uppercase">Best Value</span>
              </div>
            )}

            <div className="relative flex items-center gap-4 p-4 pt-5">
              {/* Icon */}
              <div className="text-4xl retro-pixel-shadow flex-shrink-0">
                {pack.icon}
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <div className="font-black text-sm uppercase tracking-tight">{pack.name}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400 font-black">
                    {pack.coinAmount.toLocaleString()}
                  </span>
                  {pack.bonusCoins && (
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm ml-1">
                      +{pack.bonusCoins.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="retro-iap-button">
                <span className="font-black">{pack.iapPrice}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="retro-shop-container min-h-screen pb-24">
      {/* Decorative pixel corners */}
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
                Exclusive Items & Pets
              </p>
            </div>
          </div>

          {/* Coin balance */}
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
      <div className="mx-3 mt-3 overflow-x-auto scrollbar-hide">
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
              <span className="text-base">{category.icon}</span>
              <span className="text-xs font-bold uppercase tracking-tight">{category.name}</span>
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
        <DialogContent className="retro-modal max-w-xs p-0 overflow-hidden border-0">
          {selectedItem && (
            <>
              {/* Modal header with gradient */}
              <div className="retro-modal-header p-6 text-center">
                {/* Scanlines */}
                <div className="retro-scanlines opacity-30" />

                {/* Item icon */}
                <div className="text-6xl mb-3 retro-pixel-shadow animate-bounce">
                  {'emoji' in selectedItem ? selectedItem.emoji : selectedItem.icon}
                </div>

                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">
                    {selectedItem.name}
                  </DialogTitle>
                </DialogHeader>

                {/* Rarity badge */}
                {'rarity' in selectedItem && selectedItem.rarity && (
                  <div className="flex justify-center mt-3">
                    <span className={cn(
                      "retro-rarity-badge",
                      `bg-gradient-to-r ${RARITY_COLORS[selectedItem.rarity]}`
                    )}>
                      {getRarityStars(selectedItem.rarity)}
                      <span className="ml-1 text-xs font-black uppercase">
                        {selectedItem.rarity}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Modal body */}
              <div className="p-4 space-y-4 bg-card">
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  {selectedItem.description}
                </p>

                {/* Price display */}
                <div className="retro-price-display">
                  <span className="text-muted-foreground text-sm">Price:</span>
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                      {('coinPrice' in selectedItem ? selectedItem.coinPrice : 0)?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Balance after purchase */}
                <div className="text-center text-xs text-muted-foreground">
                  Balance after: <span className="font-bold">{(coinBalance - ('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0)).toLocaleString()}</span> coins
                </div>

                {/* Purchase button */}
                <button
                  onClick={handlePurchase}
                  disabled={!canAfford('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0)}
                  className={cn(
                    "retro-purchase-button w-full",
                    canAfford('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0)
                      ? "retro-purchase-button-active"
                      : "retro-purchase-button-disabled"
                  )}
                >
                  {canAfford('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0) ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span className="font-black uppercase tracking-wide">Purchase</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span className="font-black uppercase tracking-wide">Not Enough</span>
                    </>
                  )}
                </button>

                {/* Cancel button */}
                <button
                  onClick={() => setShowPurchaseConfirm(false)}
                  className="retro-cancel-button w-full"
                >
                  <span className="text-sm font-bold uppercase">Cancel</span>
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
