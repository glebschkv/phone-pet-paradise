import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Lock, Home, ShoppingBag, Coins, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimalData } from "@/data/AnimalDatabase";
import { SpritePreview } from "./SpritePreview";

const RARITY_CONFIG = {
  common: { label: "Common", color: "hsl(220, 10%, 55%)", glow: "none" },
  rare: { label: "Rare", color: "hsl(210, 70%, 55%)", glow: "0 0 6px hsl(210, 70%, 55%, 0.4)" },
  epic: { label: "Epic", color: "hsl(280, 70%, 60%)", glow: "0 0 8px hsl(280, 70%, 60%, 0.4)" },
  legendary: { label: "Legendary", color: "hsl(45, 90%, 55%)", glow: "0 0 10px hsl(45, 90%, 55%, 0.5)" },
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

  const rarityConf = RARITY_CONFIG[pet.rarity];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xs p-0 overflow-hidden border-0"
        style={{
          background: 'linear-gradient(180deg, hsl(260, 25%, 16%) 0%, hsl(255, 22%, 12%) 100%)',
          border: '1.5px solid hsl(260, 25%, 25%)',
          borderRadius: '14px',
          boxShadow: '0 16px 48px hsl(0, 0%, 0%, 0.5), 0 0 0 1px hsl(260, 30%, 20%)',
        }}
      >
        <>
          {/* Header with sprite animation */}
          <div className="p-6 text-center" style={{
            background: 'linear-gradient(180deg, hsl(260, 20%, 20%) 0%, hsl(255, 22%, 14%) 100%)',
            borderBottom: '1px solid hsl(260, 25%, 22%)',
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
                <div style={{ filter: 'brightness(0.2) saturate(0)' }}>
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

            {/* Rarity badge */}
            <div className="flex justify-center mb-2">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color: rarityConf.color,
                  border: `1px solid ${rarityConf.color}`,
                  background: `${rarityConf.color}15`,
                  boxShadow: rarityConf.glow,
                }}
              >
                {rarityConf.label}
              </span>
            </div>

            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[hsl(45,20%,85%)]">
                {isUnlocked ? pet.name : "???"}
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[hsl(260,20%,18%)] text-[hsl(260,15%,55%)] border border-[hsl(260,20%,25%)]">
                {pet.biome}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {isUnlocked ? (
              <>
                <p className="text-sm text-[hsl(260,10%,55%)] text-center">
                  {pet.description}
                </p>

                {/* Show on Home toggle */}
                <button
                  onClick={onToggleHomeActive}
                  className={cn(
                    "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95 border",
                    isHomeActive
                      ? "bg-[hsl(180,30%,20%)] text-[hsl(180,70%,65%)] border-[hsl(180,40%,35%)]"
                      : "bg-[hsl(260,20%,18%)] text-[hsl(260,15%,55%)] border-[hsl(260,20%,25%)]"
                  )}
                >
                  <Home className={cn(
                    "w-4 h-4 inline mr-2",
                    isHomeActive && "fill-[hsl(180,50%,45%)]/50"
                  )} />
                  {isHomeActive ? "Showing on Home" : "Show on Home"}
                </button>

                {/* Favorite toggle */}
                <button
                  onClick={onToggleFavorite}
                  className={cn(
                    "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95 border",
                    isFavorite
                      ? "bg-[hsl(350,30%,18%)] text-[hsl(350,70%,65%)] border-[hsl(350,40%,30%)]"
                      : "bg-[hsl(260,20%,18%)] text-[hsl(260,15%,55%)] border-[hsl(260,20%,25%)]"
                  )}
                >
                  <Heart className={cn(
                    "w-4 h-4 inline mr-2",
                    isFavorite && "fill-[hsl(350,60%,55%)]"
                  )} />
                  {isFavorite ? "Favorited" : "Add to Favorites"}
                </button>
              </>
            ) : isShopExclusive ? (
              <div className="text-center py-4">
                <p className="text-sm text-[hsl(260,10%,55%)] mb-3">
                  {pet.description}
                </p>
                <div className="w-14 h-14 mx-auto mb-3 bg-[hsl(35,25%,18%)] rounded-full flex items-center justify-center border-2 border-[hsl(35,50%,40%)]">
                  <ShoppingBag className="w-7 h-7 text-[hsl(35,70%,55%)]" />
                </div>
                <p className="text-sm text-[hsl(260,10%,50%)] mb-2">
                  This pet is available in the Shop
                </p>
                <div className="flex items-center justify-center gap-1 mb-3 text-[hsl(35,70%,55%)]">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold">{pet.coinPrice?.toLocaleString()}</span>
                </div>
                <button
                  onClick={onNavigateToShop}
                  className="bg-gradient-to-r from-[hsl(35,70%,45%)] to-[hsl(25,65%,40%)] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 inline-flex items-center gap-2 border border-[hsl(35,60%,55%)] shadow-[0_0_10px_hsl(35,80%,50%,0.3)]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Buy from Shop
                </button>
              </div>
            ) : isStudyHoursGated && pet.requiredStudyHours ? (
              <div className="text-center py-4">
                <p className="text-sm text-[hsl(260,10%,55%)] mb-3">
                  {pet.description}
                </p>
                <div className="w-14 h-14 mx-auto mb-3 bg-[hsl(220,25%,16%)] rounded-full flex items-center justify-center border-2 border-[hsl(220,40%,38%)]">
                  <Clock className="w-7 h-7 text-[hsl(220,60%,60%)]" />
                </div>
                <p className="text-sm text-[hsl(260,10%,50%)] mb-2">
                  Unlock by studying
                </p>
                <div className="bg-[hsl(220,20%,16%)] border border-[hsl(220,30%,30%)] inline-block px-4 py-2 rounded-lg mb-3">
                  <span className="text-sm font-bold text-[hsl(220,60%,65%)]">
                    {Math.floor(totalStudyHours)}h / {pet.requiredStudyHours}h studied
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full max-w-[200px] mx-auto bg-[hsl(260,15%,15%)] rounded-full h-2.5 overflow-hidden border border-[hsl(260,20%,22%)]">
                  <div
                    className="bg-gradient-to-r from-[hsl(220,60%,50%)] to-[hsl(260,50%,55%)] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (totalStudyHours / pet.requiredStudyHours) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[hsl(260,10%,45%)] mt-2">
                  {Math.max(0, Math.ceil(pet.requiredStudyHours - totalStudyHours))}h remaining
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-3 bg-[hsl(260,20%,18%)] rounded-full flex items-center justify-center border border-[hsl(260,20%,25%)]">
                  <Lock className="w-7 h-7 text-[hsl(260,10%,40%)]" />
                </div>
                <p className="text-sm text-[hsl(260,10%,50%)] mb-1">
                  Keep leveling up to unlock this pet!
                </p>
                <div className="inline-block px-4 py-2 text-sm font-bold rounded-md bg-[hsl(35,25%,18%)] text-[hsl(35,70%,60%)] border border-[hsl(35,40%,35%)]">
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
