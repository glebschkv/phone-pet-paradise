import { Crown, ChevronRight, Check, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShopInventory, BackgroundBundle, ShopItem } from "@/data/ShopData";
import { BACKGROUND_BUNDLES, STARTER_BUNDLES } from "@/data/ShopData";
import { getCoinExclusiveAnimals, AnimalData } from "@/data/AnimalDatabase";
import { toast } from "sonner";
import { SpritePreview, BundlePreviewCarousel } from "../ShopPreviewComponents";
import type { ShopCategory } from "@/data/ShopData";

interface FeaturedTabProps {
  inventory: ShopInventory;
  isOwned: (itemId: string, category: ShopCategory) => boolean;
  isBundleOwned: (bundleId: string) => boolean;
  purchaseBackgroundBundle: (bundleId: string) => { success: boolean; message: string };
  purchaseStarterBundle: (bundleId: string) => { success: boolean; message: string };
  setActiveCategory: (category: ShopCategory) => void;
  setSelectedItem: (item: ShopItem | AnimalData | BackgroundBundle | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  setShowPremiumModal: (show: boolean) => void;
  isPremium: boolean;
  currentPlan: { name: string } | null;
  coinBalance: number;
  canAfford: (price: number) => boolean;
}

export const FeaturedTab = ({
  inventory,
  isBundleOwned,
  purchaseBackgroundBundle,
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
                  <div className="flex-shrink-0 w-16">
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

      {/* Special Bundles */}
      <div>
        <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
          <span>🎁</span> Special Bundles
        </h4>
        <div className="space-y-2">
          {STARTER_BUNDLES.map((bundle) => {
            // Check if user already has all bundle contents
            const hasCharacter = bundle.contents.characterId ? inventory.ownedCharacters.includes(bundle.contents.characterId) : true;
            const hasBadge = bundle.contents.badgeId ? inventory.ownedBadges.includes(bundle.contents.badgeId) : true;
            const alreadyPurchased = hasCharacter && hasBadge;

            return (
              <button
                key={bundle.id}
                onClick={() => {
                  if (alreadyPurchased) {
                    toast.info("You already have all items from this bundle!");
                    return;
                  }
                  const result = purchaseStarterBundle(bundle.id);
                  if (result.success) {
                    toast.success(result.message);
                  } else {
                    toast.error(result.message);
                  }
                }}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-all active:scale-[0.98] border-2",
                  alreadyPurchased
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                    : "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{bundle.icon}</span>
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
                <div className="h-12 mb-1 flex items-center justify-center overflow-hidden">
                  {pet.spriteConfig ? (
                    <SpritePreview
                      animal={pet}
                      scale={Math.min(1.5, 48 / Math.max(pet.spriteConfig.frameWidth, pet.spriteConfig.frameHeight))}
                    />
                  ) : (
                    <span className="text-3xl">{pet.emoji}</span>
                  )}
                </div>
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
