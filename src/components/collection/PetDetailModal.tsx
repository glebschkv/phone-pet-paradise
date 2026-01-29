import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Lock, Home, Star, ShoppingBag, Coins, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimalData } from "@/data/AnimalDatabase";
import { SpritePreview } from "./SpritePreview";

const RARITY_STARS = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4
};

interface PetDetailModalProps {
  pet: AnimalData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isUnlocked: boolean;
  isShopExclusive: boolean;
  isStudyHoursGated: boolean;
  totalStudyHours: number;
  isFavorite: boolean;
  isHomeActive: boolean;
  onToggleFavorite: () => void;
  onToggleHomeActive: () => void;
  onNavigateToShop: () => void;
}

export const PetDetailModal = ({
  pet,
  open,
  onOpenChange,
  isUnlocked,
  isShopExclusive,
  isStudyHoursGated,
  totalStudyHours,
  isFavorite,
  isHomeActive,
  onToggleFavorite,
  onToggleHomeActive,
  onNavigateToShop,
}: PetDetailModalProps) => {
  if (!pet) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs retro-card border-2 border-border p-0 overflow-hidden">
        <>
          {/* Header with sprite animation */}
          <div className="p-6 text-center" style={{
            background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, hsl(var(--card)) 100%)'
          }}>
            {/* Show animated sprite for unlocked pets, silhouette for locked */}
            {isUnlocked && pet.spriteConfig ? (
              <div className="mb-3 flex items-center justify-center h-[180px] overflow-hidden">
                <SpritePreview
                  animal={pet}
                  scale={Math.min(4, 180 / Math.max(pet.spriteConfig.frameWidth, pet.spriteConfig.frameHeight))}
                />
              </div>
            ) : !isUnlocked && pet.spriteConfig ? (
              <div className="mb-3 flex items-center justify-center h-[180px] overflow-hidden relative">
                <div style={{ filter: 'brightness(0) opacity(0.4)' }}>
                  <SpritePreview
                    animal={pet}
                    scale={Math.min(4, 180 / Math.max(pet.spriteConfig.frameWidth, pet.spriteConfig.frameHeight))}
                  />
                </div>
              </div>
            ) : (
              <div className="text-5xl mb-3">
                {isUnlocked ? pet.emoji : "❓"}
              </div>
            )}

            {/* Stars */}
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(RARITY_STARS[pet.rarity])].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-amber-400 fill-amber-400"
                />
              ))}
            </div>

            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {isUnlocked ? pet.name : "???"}
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="retro-stat-pill px-2 py-0.5 text-[10px] font-semibold capitalize">
                {pet.rarity}
              </span>
              <span className="retro-stat-pill px-2 py-0.5 text-[10px] font-semibold">
                {pet.biome}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {isUnlocked ? (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  {pet.description}
                </p>

                {/* Show on Home toggle */}
                <button
                  onClick={onToggleHomeActive}
                  className={cn(
                    "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95",
                    isHomeActive
                      ? "bg-green-100 text-green-700 border-2 border-green-300"
                      : "retro-stat-pill"
                  )}
                >
                  <Home className={cn(
                    "w-4 h-4 inline mr-2",
                    isHomeActive && "fill-green-500/50"
                  )} />
                  {isHomeActive ? "Showing on Home" : "Show on Home"}
                </button>

                {/* Favorite toggle */}
                <button
                  onClick={onToggleFavorite}
                  className={cn(
                    "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95",
                    isFavorite
                      ? "bg-red-100 text-red-600 border-2 border-red-200"
                      : "retro-stat-pill"
                  )}
                >
                  <Heart className={cn(
                    "w-4 h-4 inline mr-2",
                    isFavorite && "fill-red-500"
                  )} />
                  {isFavorite ? "Favorited" : "Add to Favorites"}
                </button>
              </>
            ) : isShopExclusive ? (
              // Shop-exclusive pet that isn't purchased yet
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  {pet.description}
                </p>
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center border-2 border-amber-300">
                  <ShoppingBag className="w-7 h-7 text-amber-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  This pet is available in the Shop
                </p>
                <div className="flex items-center justify-center gap-1 mb-3 text-amber-600 dark:text-amber-400">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold">{pet.coinPrice?.toLocaleString()}</span>
                </div>
                <button
                  onClick={onNavigateToShop}
                  className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Buy from Shop
                </button>
              </div>
            ) : isStudyHoursGated && pet.requiredStudyHours ? (
              // Study hours locked pet
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  {pet.description}
                </p>
                <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center border-2 border-blue-300">
                  <Clock className="w-7 h-7 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Unlock by studying
                </p>
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-300 inline-block px-4 py-2 rounded-lg mb-3">
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {Math.floor(totalStudyHours)}h / {pet.requiredStudyHours}h studied
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full max-w-[200px] mx-auto bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (totalStudyHours / pet.requiredStudyHours) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.max(0, Math.ceil(pet.requiredStudyHours - totalStudyHours))}h remaining
                </p>
              </div>
            ) : (
              // Level-locked pet
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-3 retro-stat-pill rounded-full flex items-center justify-center">
                  <Lock className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Keep leveling up to unlock this pet!
                </p>
                <div className="retro-level-badge inline-block px-4 py-2 text-sm font-bold">
                  Reach Level {pet.unlockLevel}
                </div>
              </div>
            )}
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
};
