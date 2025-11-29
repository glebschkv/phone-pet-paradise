import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Coins,
  ShoppingBag,
  Zap,
  Lock,
  Check,
  Star,
  Clock,
  Sparkles,
  Crown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/hooks/useShop";
import { useCoinBooster } from "@/hooks/useCoinBooster";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import {
  ShopCategory,
  SHOP_CATEGORIES,
  getShopItemsByCategory,
  ShopItem,
  COIN_PACKS,
  STARTER_BUNDLES,
  PREMIUM_BACKGROUNDS,
  PROFILE_BADGES,
} from "@/data/ShopData";
import { getCoinExclusiveAnimals, AnimalData } from "@/data/AnimalDatabase";
import { PremiumSubscription } from "@/components/PremiumSubscription";
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
  const [activeCategory, setActiveCategory] = useState<ShopCategory>("featured");
  const [selectedItem, setSelectedItem] = useState<ShopItem | AnimalData | null>(null);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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

  const { isPremium, currentPlan } = usePremiumStatus();

  const handlePurchase = () => {
    if (!selectedItem) return;

    let result;
    if ('biome' in selectedItem) {
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

  // Featured tab - Premium CTA + Bundles + Best Sellers
  const renderFeatured = () => {
    const bestSellingPets = getCoinExclusiveAnimals().slice(0, 2);

    return (
      <div className="space-y-4">
        {/* Premium Hero Card - Clean and Focused */}
        {!isPremium ? (
          <button
            onClick={() => setShowPremiumModal(true)}
            className="w-full bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 rounded-2xl p-4 text-left shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-white text-lg">Go Premium</h3>
                <p className="text-white/80 text-sm">
                  Unlock all features & exclusive pets
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-white/80" />
            </div>
            <div className="mt-3 bg-white/20 backdrop-blur rounded-xl py-2 px-3 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Starting at $4.99/mo</span>
            </div>
          </button>
        ) : (
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl p-4 border border-green-300 dark:border-green-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-green-800 dark:text-green-300">
                  {currentPlan?.name || 'Premium'} Active
                </h3>
                <p className="text-xs text-green-600 dark:text-green-400">
                  You have full access
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Special Bundles */}
        <div>
          <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
            <span>🎁</span> Special Bundles
          </h4>
          <div className="space-y-2">
            {STARTER_BUNDLES.map((bundle) => (
              <button
                key={bundle.id}
                onClick={() => toast.info("In-app purchases coming soon!")}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-all active:scale-[0.98] border-2",
                  "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
                  "border-purple-200 dark:border-purple-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{bundle.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{bundle.name}</span>
                      <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full">
                        SAVE {bundle.savings}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {bundle.description}
                    </p>
                  </div>
                  <span className="text-lg font-black text-purple-600 dark:text-purple-400">
                    {bundle.iapPrice}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Best Selling Coin Pack */}
        <div>
          <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
            <span>💰</span> Best Value
          </h4>
          <button
            onClick={() => toast.info("In-app purchases coming soon!")}
            className="w-full p-4 rounded-xl text-left bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-2 border-amber-300 dark:border-amber-700 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Mega Pack</span>
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                    BEST VALUE
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400 font-bold">15,000</span>
                  <span className="text-green-600 dark:text-green-400 font-bold text-sm">+2,500 bonus</span>
                </div>
              </div>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                $19.99
              </span>
            </div>
          </button>
        </div>

        {/* Popular Pets Preview */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <span>🔥</span> Popular Pets
            </h4>
            <button
              onClick={() => setActiveCategory('pets')}
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold"
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
                    "p-3 rounded-xl border-2 text-center transition-all active:scale-95",
                    owned
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  )}
                >
                  <span className="text-3xl block mb-1">{pet.emoji}</span>
                  <span className="text-xs font-bold block">{pet.name}</span>
                  {owned ? (
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">Owned</span>
                  ) : (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Coins className="w-3 h-3 text-amber-500" />
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

  // Pets tab
  const renderPets = () => {
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
              <div className="retro-scanlines" />
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                RARITY_COLORS[character.rarity]
              )} />

              {owned && (
                <div className="absolute top-2 right-2 retro-badge-owned">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div className="relative pt-3 pb-2 px-3 flex flex-col items-center">
                <div className="text-4xl mb-2 retro-pixel-shadow">
                  {character.emoji}
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {getRarityStars(character.rarity)}
                </div>
                <span className="text-xs font-black text-center tracking-tight uppercase mb-2">
                  {character.name}
                </span>

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

  // Customize tab - Backgrounds + Badges
  const renderCustomize = () => {
    return (
      <div className="space-y-4">
        {/* Backgrounds Section */}
        <div>
          <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
            <span>🖼️</span> Backgrounds
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {PREMIUM_BACKGROUNDS.map((bg) => {
              const owned = isOwned(bg.id, 'customize');
              const affordable = canAfford(bg.coinPrice || 0);
              return (
                <button
                  key={bg.id}
                  onClick={() => {
                    setSelectedItem(bg);
                    if (!owned) setShowPurchaseConfirm(true);
                  }}
                  className={cn(
                    "relative p-2 rounded-xl border-2 text-center transition-all active:scale-95",
                    owned
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300"
                      : RARITY_BG[bg.rarity || 'common'],
                    !owned && RARITY_BORDER[bg.rarity || 'common']
                  )}
                >
                  {bg.isLimited && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <Clock className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  {owned && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-2xl block mb-1">{bg.icon}</span>
                  <span className="text-[10px] font-bold block leading-tight">{bg.name}</span>
                  {!owned && (
                    <div className={cn(
                      "flex items-center justify-center gap-0.5 mt-1 text-[9px] font-bold",
                      affordable ? "text-amber-600" : "text-red-500"
                    )}>
                      <Coins className="w-2.5 h-2.5" />
                      {bg.coinPrice?.toLocaleString()}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Badges Section */}
        <div>
          <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
            <span>🏅</span> Profile Badges
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {PROFILE_BADGES.map((badge) => {
              const owned = isOwned(badge.id, 'customize');
              const affordable = canAfford(badge.coinPrice || 0);
              return (
                <button
                  key={badge.id}
                  onClick={() => {
                    setSelectedItem(badge);
                    if (!owned) setShowPurchaseConfirm(true);
                  }}
                  className={cn(
                    "relative p-2 rounded-xl border-2 text-center transition-all active:scale-95",
                    owned
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300"
                      : RARITY_BG[badge.rarity || 'common'],
                    !owned && RARITY_BORDER[badge.rarity || 'common']
                  )}
                >
                  {owned && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-2xl block mb-1">{badge.icon}</span>
                  <span className="text-[10px] font-bold block leading-tight">{badge.name}</span>
                  {!owned && (
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
      </div>
    );
  };

  // Power-Ups tab - Boosters + Items + Coins
  const renderPowerUps = () => {
    const items = getShopItemsByCategory('powerups');
    const boosters = items.filter(i => i.id.includes('boost') || i.id.includes('pass'));
    const utilities = items.filter(i => i.id.includes('streak'));
    const coins = COIN_PACKS;

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

        {/* Coin Packs */}
        <div>
          <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
            <span>💰</span> Buy Coins
          </h4>
          <div className="space-y-2">
            {coins.map((pack) => (
              <button
                key={pack.id}
                onClick={() => toast.info("In-app purchases coming soon!")}
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

  const renderContent = () => {
    switch (activeCategory) {
      case 'featured':
        return renderFeatured();
      case 'pets':
        return renderPets();
      case 'customize':
        return renderCustomize();
      case 'powerups':
        return renderPowerUps();
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
      <Dialog open={showPurchaseConfirm} onOpenChange={setShowPurchaseConfirm}>
        <DialogContent className="retro-modal max-w-xs p-0 overflow-hidden border-0">
          {selectedItem && (
            <>
              <div className="retro-modal-header p-6 text-center">
                <div className="retro-scanlines opacity-30" />
                <div className="text-6xl mb-3 retro-pixel-shadow animate-bounce">
                  {'emoji' in selectedItem ? selectedItem.emoji : selectedItem.icon}
                </div>
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">
                    {selectedItem.name}
                  </DialogTitle>
                </DialogHeader>
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

              <div className="p-4 space-y-4 bg-card">
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  {selectedItem.description}
                </p>

                <div className="retro-price-display">
                  <span className="text-muted-foreground text-sm">Price:</span>
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                      {('coinPrice' in selectedItem ? selectedItem.coinPrice : 0)?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  Balance after: <span className="font-bold">{(coinBalance - ('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0)).toLocaleString()}</span> coins
                </div>

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

      {/* Premium Subscription Modal */}
      <PremiumSubscription
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};
