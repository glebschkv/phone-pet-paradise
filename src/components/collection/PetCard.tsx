import { memo, useMemo } from "react";
import { Heart, Lock, Home, ShoppingBag, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimalData } from "@/data/AnimalDatabase";
import { SpritePreview } from "./SpritePreview";
import { ariaLabel } from "@/lib/accessibility";

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
  const showAsLocked = isLocked && !isShopPet && !isStudyHoursGated;
  const showAsShopPet = isLocked && isShopPet;
  const showAsStudyHours = isLocked && isStudyHoursGated;
  const isUnavailable = showAsLocked || showAsStudyHours;

  const accessibleLabel = useMemo(() =>
    ariaLabel.petCard(pet.name, isLocked, pet.unlockLevel),
    [pet.name, isLocked, pet.unlockLevel]
  );

  // Build inventory slot class names
  const slotClasses = cn(
    "inventory-slot",
    `rarity-${pet.rarity}`,
    !isLocked && "unlocked",
    showAsLocked && "locked",
    showAsShopPet && "shop-pet",
    showAsStudyHours && "study-gated",
  );

  return (
    <button
      onClick={onClick}
      aria-label={accessibleLabel}
      className={slotClasses}
    >
      {/* Favorite heart */}
      {!isLocked && isFavorited && (
        <div className="inventory-fav">
          <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
        </div>
      )}

      {/* Home active indicator */}
      {!isLocked && isHomeActive && (
        <div className="inventory-home">
          <Home className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30" />
        </div>
      )}

      {/* Level badge for locked (non-shop) */}
      {showAsLocked && (
        <div className="inventory-badge level-badge">
          <span>Lv.{pet.unlockLevel}</span>
        </div>
      )}

      {/* Shop badge */}
      {showAsShopPet && (
        <div className="inventory-badge shop-badge">
          <ShoppingBag className="w-2.5 h-2.5" />
          <span>SHOP</span>
        </div>
      )}

      {/* Study hours badge */}
      {showAsStudyHours && pet.requiredStudyHours && (
        <div className="inventory-badge study-badge">
          <Clock className="w-2.5 h-2.5" />
          <span>{pet.requiredStudyHours}h</span>
        </div>
      )}

      {/* Sprite area */}
      <div className={cn("inventory-sprite-area", isUnavailable && "opacity-50")}>
        {(isUnavailable) && pet.spriteConfig ? (
          <div style={{ filter: 'brightness(0.3) saturate(0)' }}>
            <SpritePreview
              animal={pet}
              scale={Math.min(1.5, 48 / pet.spriteConfig.frameHeight)}
            />
          </div>
        ) : (isUnavailable) ? (
          <Lock className="w-6 h-6 text-[hsl(260,10%,35%)]" />
        ) : pet.spriteConfig ? (
          <SpritePreview
            animal={pet}
            scale={Math.min(1.5, 48 / pet.spriteConfig.frameHeight)}
          />
        ) : (
          <span className="text-3xl">{pet.emoji}</span>
        )}
      </div>

      {/* Rarity dot */}
      <div className={cn("rarity-dot", pet.rarity)} />

      {/* Name */}
      <span className="inventory-pet-name">
        {isUnavailable ? "???" : pet.name}
      </span>
    </button>
  );
});

PetCard.displayName = 'PetCard';
