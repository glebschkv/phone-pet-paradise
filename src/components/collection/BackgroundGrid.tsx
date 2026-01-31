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
  Clock,
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
    if (bg.comingSoon && !owned) return;
    if (owned) {
      onEquipBackground(bg.id);
    } else {
      onSelectBackground(bg);
    }
  }, [onEquipBackground, onSelectBackground]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Image className="w-4 h-4 text-[hsl(35,70%,55%)]" />
        <span className="text-xs font-bold text-[hsl(260,10%,50%)] uppercase tracking-wide">
          Shop Backgrounds
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
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
  const isComingSoon = bg.comingSoon && !owned;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-lg overflow-hidden transition-all border",
        isComingSoon
          ? "border-[hsl(260,15%,22%)] opacity-60"
          : "active:scale-[0.97]",
        !isComingSoon && isEquipped
          ? "border-[hsl(280,50%,55%)] ring-1 ring-[hsl(280,50%,55%)]"
          : !isComingSoon && owned
          ? "border-[hsl(180,40%,40%)]"
          : !isComingSoon ? "border-[hsl(260,25%,25%)]" : ""
      )}
    >
      {/* Background Preview */}
      <div className="relative h-20 overflow-hidden bg-[hsl(260,15%,12%)]">
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
        {isComingSoon && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-[hsl(260,25%,25%)] border border-[hsl(260,20%,35%)] rounded-lg px-3 py-1 shadow-lg transform -rotate-3">
              <span className="text-[10px] font-black text-[hsl(260,15%,55%)] uppercase tracking-wide">Coming Soon</span>
            </div>
          </div>
        )}
        {isEquipped && !isComingSoon && (
          <div className="absolute inset-0 bg-[hsl(280,50%,40%)]/30 flex items-center justify-center">
            <div className="bg-[hsl(280,50%,45%)] rounded-full px-2 py-0.5 flex items-center gap-1">
              <Palette className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white">EQUIPPED</span>
            </div>
          </div>
        )}
        {owned && !isEquipped && !isComingSoon && (
          <div className="absolute top-1 right-1">
            <div className="bg-[hsl(180,50%,40%)] rounded-full p-0.5">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
        {!owned && !isComingSoon && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-gradient-to-r from-[hsl(35,70%,45%)] to-[hsl(25,65%,40%)] text-white px-2 py-0.5 rounded-full flex items-center gap-1 border border-[hsl(35,60%,55%)]">
              <ShoppingBag className="w-3 h-3" />
              <span className="text-[9px] font-bold">SHOP</span>
            </div>
          </div>
        )}

        {/* Rarity dot */}
        <div className={cn(
          "absolute top-1 left-1 h-2 w-2 rounded-full",
          bg.rarity === 'legendary' ? "bg-amber-400 shadow-[0_0_4px_hsl(45,90%,55%)]" :
          bg.rarity === 'epic' ? "bg-purple-400 shadow-[0_0_4px_hsl(280,70%,60%)]" :
          bg.rarity === 'rare' ? "bg-blue-400 shadow-[0_0_4px_hsl(210,70%,55%)]" : "bg-gray-500"
        )} />
      </div>

      {/* Info */}
      <div className={cn(
        "p-2 text-left",
        isComingSoon ? "bg-[hsl(260,15%,12%)]" :
        isEquipped ? "bg-[hsl(280,20%,15%)]" :
        owned ? "bg-[hsl(260,20%,15%)]" : "bg-[hsl(260,20%,14%)]"
      )}>
        <span className="text-[11px] font-bold block leading-tight truncate text-[hsl(45,20%,80%)]">
          {bg.name}
        </span>
        {isComingSoon ? (
          <div className="flex items-center gap-1 text-[9px] font-bold text-[hsl(260,10%,40%)]">
            <Clock className="w-2.5 h-2.5" />
            Coming Soon
          </div>
        ) : owned ? (
          <span className="text-[9px] text-[hsl(280,50%,65%)] font-medium">
            {isEquipped ? "Tap to unequip" : "Tap to equip"}
          </span>
        ) : (
          <div className="flex items-center gap-0.5 text-[9px] text-[hsl(35,70%,55%)]">
            <Coins className="w-2.5 h-2.5" />
            <span className="font-bold">{bg.coinPrice?.toLocaleString()}</span>
          </div>
        )}
      </div>
    </button>
  );
});

BackgroundCard.displayName = 'BackgroundCard';
