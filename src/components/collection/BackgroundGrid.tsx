/**
 * BackgroundGrid Component
 *
 * Renders the premium backgrounds grid for the shop.
 * Extracted from PetCollectionGrid for better maintainability.
 */

import { memo, useCallback } from "react";
import {
  ShoppingBag,
  Coins,
  Image,
  Check,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PREMIUM_BACKGROUNDS, PremiumBackground } from "@/data/ShopData";

interface BackgroundGridProps {
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  onEquipBackground: (bgId: string) => void;
  onSelectBackground: (bg: PremiumBackground) => void;
}

export const BackgroundGrid = memo(({
  ownedBackgrounds,
  equippedBackground,
  onEquipBackground,
  onSelectBackground,
}: BackgroundGridProps) => {
  const handleClick = useCallback((bg: PremiumBackground, owned: boolean) => {
    if (owned) {
      onEquipBackground(bg.id);
    } else {
      onSelectBackground(bg);
    }
  }, [onEquipBackground, onSelectBackground]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Image className="w-4 h-4 text-amber-600" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          Shop Backgrounds
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PREMIUM_BACKGROUNDS.map((bg) => {
          const owned = ownedBackgrounds.includes(bg.id);
          const isEquipped = equippedBackground === bg.id;

          return (
            <BackgroundCard
              key={bg.id}
              background={bg}
              owned={owned}
              isEquipped={isEquipped}
              onClick={() => handleClick(bg, owned)}
            />
          );
        })}
      </div>
    </div>
  );
});

BackgroundGrid.displayName = 'BackgroundGrid';

// ============================================================================
// BACKGROUND CARD COMPONENT
// ============================================================================

interface BackgroundCardProps {
  background: PremiumBackground;
  owned: boolean;
  isEquipped: boolean;
  onClick: () => void;
}

const BackgroundCard = memo(({
  background: bg,
  owned,
  isEquipped,
  onClick,
}: BackgroundCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-xl border-2 overflow-hidden transition-all active:scale-95",
        isEquipped
          ? "border-purple-400 ring-2 ring-purple-300"
          : owned
          ? "border-green-400"
          : "border-border"
      )}
    >
      {/* Background Preview */}
      <div className="relative h-20 overflow-hidden bg-muted">
        {bg.previewImage ? (
          <img
            src={bg.previewImage}
            alt={bg.name}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {bg.icon}
          </div>
        )}

        {/* Status overlay */}
        {isEquipped && (
          <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
            <div className="bg-purple-500 rounded-full px-2 py-0.5 flex items-center gap-1">
              <Palette className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white">EQUIPPED</span>
            </div>
          </div>
        )}
        {owned && !isEquipped && (
          <div className="absolute top-1 right-1">
            <div className="bg-green-500 rounded-full p-0.5">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
        {!owned && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" />
              <span className="text-[9px] font-bold">SHOP</span>
            </div>
          </div>
        )}

        {/* Rarity dot */}
        <div className={cn(
          "absolute top-1 left-1 h-2 w-2 rounded-full",
          bg.rarity === 'legendary' ? "bg-amber-400" :
          bg.rarity === 'epic' ? "bg-purple-400" :
          bg.rarity === 'rare' ? "bg-blue-400" : "bg-gray-400"
        )} />
      </div>

      {/* Info */}
      <div className={cn(
        "p-2 text-left",
        isEquipped ? "bg-purple-50 dark:bg-purple-900/20" :
        owned ? "bg-green-50 dark:bg-green-900/20" : "bg-card"
      )}>
        <span className="text-[11px] font-bold block leading-tight truncate">
          {bg.name}
        </span>
        {owned ? (
          <span className="text-[9px] text-purple-600 dark:text-purple-400 font-medium">
            {isEquipped ? "Tap to unequip" : "Tap to equip"}
          </span>
        ) : (
          <div className="flex items-center gap-0.5 text-[9px] text-amber-600">
            <Coins className="w-2.5 h-2.5" />
            <span className="font-bold">{bg.coinPrice?.toLocaleString()}</span>
          </div>
        )}
      </div>
    </button>
  );
});

BackgroundCard.displayName = 'BackgroundCard';
