import { memo, useMemo } from "react";
import { Heart, Lock, Home, Star, ShoppingBag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimalData } from "@/data/AnimalDatabase";
import { SpritePreview } from "./SpritePreview";
import { ariaLabel } from "@/lib/accessibility";

const RARITY_STARS = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4
};

interface PetCardProps {
  pet: AnimalData;
  isLocked: boolean;
  isShopPet: boolean;
  isStudyHoursGated: boolean;
  isFavorited: boolean;
  isHomeActive: boolean;
  onClick: () => void;
}

export const PetCard = memo(({
  pet,
  isLocked,
  isShopPet,
  isStudyHoursGated,
  isFavorited,
  isHomeActive,
  onClick,
}: PetCardProps) => {
  // Shop pets show differently - not really "locked", just purchasable
  const showAsLocked = isLocked && !isShopPet && !isStudyHoursGated;
  const showAsShopPet = isLocked && isShopPet;
  const showAsStudyHours = isLocked && isStudyHoursGated;
  const stars = RARITY_STARS[pet.rarity];

  // Memoize inline styles to avoid recreation on every render
  const buttonStyle = useMemo(() => ({
    border: showAsShopPet
      ? '2px solid hsl(35 80% 60%)'
      : showAsStudyHours
      ? '2px solid hsl(220 70% 60%)'
      : '2px solid hsl(var(--border))',
    boxShadow: (showAsLocked || showAsStudyHours)
      ? 'none'
      : '0 3px 0 hsl(var(--border) / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
  }), [showAsShopPet, showAsLocked, showAsStudyHours]);

  // Generate accessible label
  const accessibleLabel = useMemo(() =>
    ariaLabel.petCard(pet.name, isLocked, pet.unlockLevel),
    [pet.name, isLocked, pet.unlockLevel]
  );

  return (
    <button
      onClick={onClick}
      aria-label={accessibleLabel}
      className={cn(
        "rounded-lg p-3 flex flex-col items-center relative transition-all active:scale-95",
        showAsLocked ? "bg-muted/50" :
        showAsStudyHours ? "bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20" :
        showAsShopPet ? "bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20" :
        "bg-card"
      )}
      style={buttonStyle}
    >
      {/* Favorite heart */}
      {!isLocked && isFavorited && (
        <div className="absolute top-1.5 left-1.5">
          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
        </div>
      )}

      {/* Home active indicator */}
      {!isLocked && isHomeActive && (
        <div className="absolute top-1.5 right-1.5">
          <Home className="w-4 h-4 text-green-500 fill-green-500/30" />
        </div>
      )}

      {/* Level badge for locked (non-shop) */}
      {showAsLocked && (
        <div className="absolute top-1.5 right-1.5 retro-stat-pill px-1.5 py-0.5">
          <span className="text-[9px] font-bold">Lv.{pet.unlockLevel}</span>
        </div>
      )}

      {/* Shop badge for shop-exclusive pets */}
      {showAsShopPet && (
        <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <ShoppingBag className="w-2.5 h-2.5" />
          <span className="text-[8px] font-bold">SHOP</span>
        </div>
      )}

      {/* Study hours badge */}
      {showAsStudyHours && pet.requiredStudyHours && (
        <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          <span className="text-[8px] font-bold">{pet.requiredStudyHours}h</span>
        </div>
      )}

      {/* Sprite or Lock */}
      <div className={cn(
        "mb-1.5 h-12 flex items-center justify-center overflow-hidden",
        (showAsLocked || showAsStudyHours) && "opacity-30 grayscale"
      )}>
        {(showAsLocked || showAsStudyHours) ? (
          <Lock className="w-7 h-7 text-muted-foreground" />
        ) : pet.spriteConfig ? (
          <SpritePreview
            animal={pet}
            scale={Math.min(1.5, 48 / pet.spriteConfig.frameHeight)}
          />
        ) : (
          <span className="text-4xl">{pet.emoji}</span>
        )}
      </div>

      {/* Stars for rarity */}
      <div className="flex gap-0.5 mb-1">
        {[...Array(stars)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-3 h-3",
              (showAsLocked || showAsStudyHours)
                ? "text-muted-foreground/40"
                : "text-amber-400 fill-amber-400"
            )}
          />
        ))}
      </div>

      {/* Name */}
      <span className={cn(
        "text-[11px] font-semibold truncate w-full text-center",
        (showAsLocked || showAsStudyHours) ? "text-muted-foreground" : "text-foreground"
      )}>
        {(showAsLocked || showAsStudyHours) ? "???" : pet.name}
      </span>
    </button>
  );
});

PetCard.displayName = 'PetCard';
