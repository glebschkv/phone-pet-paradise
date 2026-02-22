/**
 * CollectionTab Component
 *
 * Merged view of pet bundles, individual pets, background bundles,
 * and individual backgrounds. Bundles are shown above individual items
 * so users see the better-value option first.
 */

import { Check, Palette, Star } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils";
import {
  ShopItem,
  Bundle,
  PREMIUM_BACKGROUNDS,
  PET_BUNDLES,
  BACKGROUND_BUNDLES,
  ShopCategory,
} from "@/data/ShopData";
import type { ShopInventory } from "@/hooks/useShop";
import { getCoinExclusiveAnimals, AnimalData, getAnimalById } from "@/data/AnimalDatabase";
import { toast } from "sonner";
import { SpritePreview, BackgroundPreview, BundlePreviewCarousel } from "../ShopPreviewComponents";
import { RARITY_COLORS, RARITY_BG, RARITY_BORDER, RARITY_GLOW } from "../styles";
import { useThemeStore } from "@/stores";
import { useCallback } from "react";

interface CollectionTabProps {
  inventory: ShopInventory;
  isOwned: (itemId: string, category: ShopCategory) => boolean;
  isBundleOwned: (bundleId: string) => boolean;
  equipBackground: (backgroundId: string | null) => void;
  setSelectedItem: (item: ShopItem | AnimalData | Bundle | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
}

export const CollectionTab = ({
  inventory,
  isOwned,
  isBundleOwned,
  equipBackground,
  setSelectedItem,
  setShowPurchaseConfirm,
  canAfford,
}: CollectionTabProps) => {
  const characters = getCoinExclusiveAnimals();
  const setHomeBackground = useThemeStore((state) => state.setHomeBackground);
  const backgroundsWithPreviews = PREMIUM_BACKGROUNDS.filter(bg => bg.previewImage);

  const handleEquipBackground = useCallback((bgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (inventory.equippedBackground === bgId) {
      equipBackground(null);
      toast.success("Background unequipped");
      setHomeBackground('day');
    } else {
      equipBackground(bgId);
      toast.success("Background equipped!");
      const background = PREMIUM_BACKGROUNDS.find(bg => bg.id === bgId);
      const imagePath = background?.previewImage || 'day';
      setHomeBackground(imagePath);
    }
  }, [inventory.equippedBackground, equipBackground, setHomeBackground]);

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

  return (
    <div className="space-y-4">
      {/* ── Pet Bundles ── */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Pet Bundles</span>
        </div>
        <div className="space-y-2">
          {PET_BUNDLES.map((bundle) => (
            <PetBundleCard
              key={bundle.id}
              bundle={bundle}
              inventory={inventory}
              setSelectedItem={setSelectedItem}
              setShowPurchaseConfirm={setShowPurchaseConfirm}
              canAfford={canAfford}
            />
          ))}
        </div>
      </div>

      {/* ── Individual Pets ── */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Pets</span>
        </div>
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
                  <div className="h-16 mb-2 flex items-center justify-center overflow-hidden">
                    {character.spriteConfig ? (
                      <SpritePreview
                        animal={character}
                        scale={Math.min(2, 64 / Math.max(character.spriteConfig.frameWidth, character.spriteConfig.frameHeight))}
                      />
                    ) : (
                      <span className="text-4xl retro-pixel-shadow">{character.emoji}</span>
                    )}
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
                      <PixelIcon name="coin" size={14} />
                      <span className="text-xs font-black">{character.coinPrice?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Background Bundles ── */}
      {BACKGROUND_BUNDLES.length > 0 && (
        <div>
          <div className="shop-section-header">
            <span className="shop-section-title">Background Bundles</span>
          </div>
          <div className="space-y-2">
            {BACKGROUND_BUNDLES.map((bundle) => (
              <BackgroundBundleCard
                key={bundle.id}
                bundle={bundle}
                isBundleOwned={isBundleOwned}
                setSelectedItem={setSelectedItem}
                setShowPurchaseConfirm={setShowPurchaseConfirm}
                canAfford={canAfford}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Individual Backgrounds ── */}
      {backgroundsWithPreviews.length > 0 && (
        <div>
          <div className="shop-section-header">
            <span className="shop-section-title">Sky Collection</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backgroundsWithPreviews.map((bg) => {
              const owned = isOwned(bg.id, 'customize');
              const affordable = canAfford(bg.coinPrice || 0);
              const isEquipped = inventory.equippedBackground === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => {
                    if (owned) {
                      handleEquipBackground(bg.id, { stopPropagation: () => {} } as React.MouseEvent);
                    } else {
                      setSelectedItem(bg);
                      setShowPurchaseConfirm(true);
                    }
                  }}
                  className={cn(
                    "shop-bg-card",
                    isEquipped && "equipped",
                    owned && !isEquipped && "owned"
                  )}
                >
                  <div className="relative h-20 overflow-hidden">
                    <BackgroundPreview imagePath={bg.previewImage!} size="large" className="border-0 rounded-none" />
                    {isEquipped && (
                      <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                        <div className="bg-purple-500 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <Palette className="w-3 h-3 text-white" />
                          <span className="text-[10px] font-bold text-white">EQUIPPED</span>
                        </div>
                      </div>
                    )}
                    {owned && !isEquipped && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="bg-green-500 rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    {bg.bundleId && !owned && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-sky-500 text-white text-[8px] font-bold rounded">
                        BUNDLE
                      </div>
                    )}
                    <div className={cn(
                      "absolute top-1 right-1 h-2 w-2 rounded-full",
                      bg.rarity === 'legendary' ? "bg-amber-400" :
                      bg.rarity === 'epic' ? "bg-purple-400" :
                      bg.rarity === 'rare' ? "bg-blue-400" : "bg-gray-400"
                    )} />
                  </div>
                  <div className={cn(
                    "p-2",
                    isEquipped ? "bg-purple-50 dark:bg-purple-900/20" :
                    owned ? "bg-green-50 dark:bg-green-900/20" : RARITY_BG[bg.rarity || 'common']
                  )}>
                    <span className="text-[10px] font-bold block leading-tight truncate">{bg.name}</span>
                    {owned ? (
                      <div className="text-[9px] font-medium text-center mt-1 text-purple-600 dark:text-purple-400">
                        {isEquipped ? "Tap to unequip" : "Tap to equip"}
                      </div>
                    ) : (
                      <div className={cn(
                        "flex items-center justify-center gap-0.5 mt-1 text-[9px] font-bold",
                        affordable ? "text-amber-600" : "text-red-500"
                      )}>
                        <PixelIcon name="coin" size={10} />
                        {bg.coinPrice?.toLocaleString()}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PET BUNDLE CARD (moved from BundlesTab)
// ============================================================================

const PetBundleCard = ({
  bundle,
  inventory,
  setSelectedItem,
  setShowPurchaseConfirm,
  canAfford,
}: {
  bundle: Bundle;
  inventory: ShopInventory;
  setSelectedItem: (item: ShopItem | AnimalData | Bundle | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
}) => {
  const ownedPets = bundle.itemIds.filter(id => inventory.ownedCharacters.includes(id));
  const allOwned = ownedPets.length === bundle.itemIds.length;
  const partialOwned = ownedPets.length > 0 && ownedPets.length < bundle.itemIds.length;
  const affordable = canAfford(bundle.coinPrice || 0);

  const previewAnimals = bundle.itemIds
    .slice(0, 3)
    .map(id => getAnimalById(id))
    .filter(Boolean) as AnimalData[];

  const handleClick = () => {
    if (!allOwned) {
      setSelectedItem(bundle as unknown as ShopItem);
      setShowPurchaseConfirm(true);
    } else {
      toast.info("You already own all pets in this bundle!");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "shop-list-card",
        allOwned ? "green" : partialOwned ? "amber" : ""
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-20 h-16 rounded-lg bg-white/50 dark:bg-black/20 flex items-center justify-center overflow-hidden">
          {previewAnimals.length > 0 && previewAnimals[0]?.spriteConfig ? (
            <SpritePreview
              animal={previewAnimals[0]}
              scale={Math.min(1.2, 56 / Math.max(
                previewAnimals[0].spriteConfig.frameWidth,
                previewAnimals[0].spriteConfig.frameHeight
              ))}
            />
          ) : (
            <PixelIcon name={bundle.icon} size={30} />
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
            <RarityBadge rarity={bundle.rarity || 'common'} />
          </div>

          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {bundle.description}
          </p>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {bundle.itemIds.length} pets
            </span>
            {partialOwned && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                ({ownedPets.length}/{bundle.itemIds.length} owned)
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
                <PixelIcon name="coin" size={12} />
                {bundle.coinPrice?.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// BACKGROUND BUNDLE CARD (moved from BundlesTab)
// ============================================================================

const BackgroundBundleCard = ({
  bundle,
  isBundleOwned,
  setSelectedItem,
  setShowPurchaseConfirm,
  canAfford,
}: {
  bundle: Bundle;
  isBundleOwned: (bundleId: string) => boolean;
  setSelectedItem: (item: ShopItem | AnimalData | Bundle | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
}) => {
  const owned = isBundleOwned(bundle.id);
  const affordable = canAfford(bundle.coinPrice || 0);

  const handleClick = () => {
    if (!owned) {
      setSelectedItem(bundle);
      setShowPurchaseConfirm(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "shop-list-card",
        owned && "green"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-20">
          {bundle.previewImages && <BundlePreviewCarousel images={bundle.previewImages} />}
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
                <PixelIcon name="coin" size={12} />
                {bundle.coinPrice?.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

const RarityBadge = ({ rarity }: { rarity: string }) => {
  const colorClass =
    rarity === 'legendary' ? "bg-amber-200 text-amber-800" :
    rarity === 'epic' ? "bg-purple-200 text-purple-800" :
    rarity === 'rare' ? "bg-blue-200 text-blue-800" :
    "bg-gray-200 text-gray-800";

  return (
    <span className={cn(
      "px-1.5 py-0.5 text-[8px] font-bold rounded capitalize",
      colorClass
    )}>
      {rarity}
    </span>
  );
};
