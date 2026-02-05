/**
 * BundlesTab Component
 *
 * Displays pet bundles and background bundles for purchase in the shop.
 * Extracted from Shop.tsx for better maintainability.
 */

import { Check } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ShopItem,
  BackgroundBundle,
  PetBundle,
  PET_BUNDLES,
  BACKGROUND_BUNDLES,
} from "@/data/ShopData";
import type { ShopInventory } from "@/hooks/useShop";
import { AnimalData, getAnimalById } from "@/data/AnimalDatabase";
import { SpritePreview, BundlePreviewCarousel } from "../ShopPreviewComponents";

interface BundlesTabProps {
  inventory: ShopInventory;
  isBundleOwned: (bundleId: string) => boolean;
  setSelectedItem: (item: ShopItem | AnimalData | BackgroundBundle | PetBundle | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
}

export const BundlesTab = ({
  inventory,
  isBundleOwned,
  setSelectedItem,
  setShowPurchaseConfirm,
  canAfford,
}: BundlesTabProps) => {
  return (
    <div className="space-y-4">
      {/* Pet Bundles */}
      <PetBundlesSection
        inventory={inventory}
        setSelectedItem={setSelectedItem}
        setShowPurchaseConfirm={setShowPurchaseConfirm}
        canAfford={canAfford}
      />

      {/* Background Bundles */}
      <BackgroundBundlesSection
        isBundleOwned={isBundleOwned}
        setSelectedItem={setSelectedItem}
        setShowPurchaseConfirm={setShowPurchaseConfirm}
        canAfford={canAfford}
      />
    </div>
  );
};

// ============================================================================
// PET BUNDLES SECTION
// ============================================================================

interface PetBundlesSectionProps {
  inventory: ShopInventory;
  setSelectedItem: (item: ShopItem | AnimalData | BackgroundBundle | PetBundle | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
}

const PetBundlesSection = ({
  inventory,
  setSelectedItem,
  setShowPurchaseConfirm,
  canAfford,
}: PetBundlesSectionProps) => {
  return (
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
  );
};

// ============================================================================
// PET BUNDLE CARD
// ============================================================================

interface PetBundleCardProps {
  bundle: PetBundle;
  inventory: ShopInventory;
  setSelectedItem: (item: ShopItem | AnimalData | BackgroundBundle | PetBundle | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
}

const PetBundleCard = ({
  bundle,
  inventory,
  setSelectedItem,
  setShowPurchaseConfirm,
  canAfford,
}: PetBundleCardProps) => {
  // Check if user owns all pets in bundle
  const ownedPets = bundle.petIds.filter(id => inventory.ownedCharacters.includes(id));
  const allOwned = ownedPets.length === bundle.petIds.length;
  const partialOwned = ownedPets.length > 0 && ownedPets.length < bundle.petIds.length;
  const affordable = canAfford(bundle.coinPrice || 0);

  // Get preview animals for the bundle
  const previewAnimals = bundle.petIds
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
        {/* Bundle preview - show sprites */}
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
          {/* Title row */}
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

          {/* Description */}
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {bundle.description}
          </p>

          {/* Pet count */}
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

          {/* Price */}
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
// BACKGROUND BUNDLES SECTION
// ============================================================================

interface BackgroundBundlesSectionProps {
  isBundleOwned: (bundleId: string) => boolean;
  setSelectedItem: (item: ShopItem | AnimalData | BackgroundBundle | PetBundle | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
}

const BackgroundBundlesSection = ({
  isBundleOwned,
  setSelectedItem,
  setShowPurchaseConfirm,
  canAfford,
}: BackgroundBundlesSectionProps) => {
  return (
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
  );
};

// ============================================================================
// BACKGROUND BUNDLE CARD
// ============================================================================

interface BackgroundBundleCardProps {
  bundle: BackgroundBundle;
  isBundleOwned: (bundleId: string) => boolean;
  setSelectedItem: (item: ShopItem | AnimalData | BackgroundBundle | PetBundle | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
}

const BackgroundBundleCard = ({
  bundle,
  isBundleOwned,
  setSelectedItem,
  setShowPurchaseConfirm,
  canAfford,
}: BackgroundBundleCardProps) => {
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
          <BundlePreviewCarousel images={bundle.previewImages} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title row */}
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

          {/* Description */}
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {bundle.description}
          </p>

          {/* Price */}
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
