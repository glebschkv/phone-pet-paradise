import { memo, useMemo } from "react";
import { Heart, Lock, Home, Star, ShoppingBag } from "lucide-react";
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
  isFavorited: boolean;
  isHomeActive: boolean;
  onClick: () => void;
}

export const PetCard = memo(({
  pet,
  isLocked,
  isShopPet,
  isFavorited,
  isHomeActive,
  onClick,
}: PetCardProps) => {
  // Shop pets show differently - not really "locked", just purchasable
  const showAsLocked = isLocked && !isShopPet;
  const showAsShopPet = isLocked && isShopPet;
  const stars = RARITY_STARS[pet.rarity];

  // Memoize inline styles to avoid recreation on every render
  const buttonStyle = useMemo(() => ({
    border: showAsShopPet
      ? '2px solid hsl(35 80% 60%)'
      : '2px solid hsl(var(--border))',
    boxShadow: showAsLocked
      ? 'none'
      : '0 3px 0 hsl(var(--border) / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
  }), [showAsShopPet, showAsLocked]);

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

      {/* Sprite or Lock */}
      <div className={cn(
        "mb-1.5 h-12 flex items-center justify-center overflow-hidden relative",
        showAsLocked && "opacity-60"
      )}>
        {showAsLocked && pet.spriteConfig ? (
          // Silhouette preview for locked pets - shows shape without details
          <>
            <div style={{ filter: 'brightness(0) opacity(0.5)' }}>
              <SpritePreview
                animal={pet}
                scale={Math.min(1.5, 48 / pet.spriteConfig.frameHeight)}
              />
            </div>
            <Lock className="w-4 h-4 text-muted-foreground absolute bottom-0 right-0 drop-shadow-md" />
          </>
        ) : showAsLocked ? (
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
              showAsLocked
                ? "text-muted-foreground/40"
                : "text-amber-400 fill-amber-400"
            )}
          />
        ))}
      </div>

      {/* Name */}
      <span className={cn(
        "text-[11px] font-semibold truncate w-full text-center",
        showAsLocked ? "text-muted-foreground" : "text-foreground"
      )}>
        {showAsLocked ? "???" : pet.name}
      </span>
    </button>
  );
});

PetCard.displayName = 'PetCard';
