import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Coins, Sparkles, Zap, Shield, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarterBundle, CoinPack } from "@/data/ShopData";
import { getAnimalById } from "@/data/AnimalDatabase";
import { BOOSTER_TYPES } from "@/hooks/useCoinBooster";
import { SpritePreview } from "./ShopPreviewComponents";

interface BundleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: StarterBundle | CoinPack | null;
  onPurchase: () => void;
  isPurchasing?: boolean;
}

export const BundleConfirmDialog = ({
  open,
  onOpenChange,
  bundle,
  onPurchase,
  isPurchasing = false,
}: BundleConfirmDialogProps) => {
  if (!bundle) return null;

  const isStarterBundle = 'contents' in bundle;
  const isCoinPack = 'coinAmount' in bundle;

  // Build contents list for starter bundles
  const contentItems: { icon: React.ReactNode; label: string; sublabel?: string; highlight?: boolean }[] = [];

  if (isStarterBundle) {
    const starterBundle = bundle as StarterBundle;

    if (starterBundle.contents.coins > 0) {
      contentItems.push({
        icon: <Coins className="w-5 h-5 text-amber-400" />,
        label: `${starterBundle.contents.coins.toLocaleString()} Coins`,
        highlight: true,
      });
    }

    if (starterBundle.contents.boosterId) {
      const booster = BOOSTER_TYPES.find(b => b.id === starterBundle.contents.boosterId);
      if (booster) {
        contentItems.push({
          icon: <Zap className="w-5 h-5 text-yellow-400" />,
          label: booster.name,
          sublabel: booster.description,
        });
      }
    }

    if (starterBundle.contents.characterId) {
      const animal = getAnimalById(starterBundle.contents.characterId);
      if (animal) {
        contentItems.push({
          icon: <span className="text-lg leading-none">{animal.emoji}</span>,
          label: animal.name,
          sublabel: `${animal.rarity.charAt(0).toUpperCase() + animal.rarity.slice(1)} Pet`,
        });
      }
    }

    if (starterBundle.contents.streakFreezes && starterBundle.contents.streakFreezes > 0) {
      contentItems.push({
        icon: <Shield className="w-5 h-5 text-cyan-400" />,
        label: `${starterBundle.contents.streakFreezes} Streak Freeze${starterBundle.contents.streakFreezes > 1 ? 's' : ''}`,
        sublabel: 'Protect your streaks',
      });
    }
  } else if (isCoinPack) {
    const coinPack = bundle as CoinPack;
    contentItems.push({
      icon: <Coins className="w-5 h-5 text-amber-400" />,
      label: `${coinPack.coinAmount.toLocaleString()} Coins`,
      highlight: true,
    });
    if (coinPack.bonusCoins && coinPack.bonusCoins > 0) {
      contentItems.push({
        icon: <Sparkles className="w-5 h-5 text-green-400" />,
        label: `+${coinPack.bonusCoins.toLocaleString()} Bonus`,
        sublabel: 'Free extra coins!',
        highlight: true,
      });
    }
  }

  // Pet preview for bundles that include a character
  const petId = isStarterBundle ? (bundle as StarterBundle).contents.characterId : null;
  const pet = petId ? getAnimalById(petId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="retro-modal max-w-[300px] p-0 overflow-hidden border-0">
        <>
          {/* Header with gradient */}
          <div className="retro-modal-header p-4 text-center relative">
            <div className="retro-scanlines opacity-20" />

            {/* Pet sprite preview or bundle icon */}
            <div className="h-24 mb-2 flex items-center justify-center">
              {pet?.spriteConfig ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 rounded-full blur-xl" />
                  <SpritePreview
                    animal={pet}
                    scale={Math.min(2.5, 80 / Math.max(pet.spriteConfig.frameWidth, pet.spriteConfig.frameHeight))}
                  />
                </div>
              ) : (
                <span className="text-5xl animate-bounce" style={{ animationDuration: '2s' }}>
                  {bundle.icon}
                </span>
              )}
            </div>

            {/* Bundle name */}
            <h2 className="text-lg font-black uppercase tracking-tight text-white">
              {bundle.name}
            </h2>

            {/* Savings badge */}
            {'savings' in bundle && bundle.savings && (
              <div className="mt-2 inline-flex items-center gap-1.5">
                <span className="px-3 py-1 bg-green-500/90 text-white text-xs font-black rounded-full uppercase tracking-wide shadow-lg shadow-green-500/30">
                  Save {bundle.savings}
                </span>
              </div>
            )}

            {/* Rarity stars */}
            {'rarity' in bundle && bundle.rarity && (
              <div className="flex justify-center mt-2 gap-0.5">
                {[...Array(bundle.rarity === 'common' ? 1 : bundle.rarity === 'rare' ? 2 : bundle.rarity === 'epic' ? 3 : 4)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5",
                      bundle.rarity === 'legendary'
                        ? "text-amber-400 fill-amber-400 animate-pulse"
                        : "text-amber-400 fill-amber-400"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Contents section */}
          <div className="p-4 space-y-3 bg-card">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {bundle.description}
            </p>

            {/* Contents list */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                Includes
              </div>
              <div className="bg-muted/30 rounded-xl border-2 border-border/50 divide-y divide-border/30">
                {contentItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-background/80 border border-border/50 flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm font-bold",
                        item.highlight && "text-amber-600 dark:text-amber-400"
                      )}>
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div className="text-[10px] text-muted-foreground leading-tight">
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase button with real-money price */}
            <button
              onClick={onPurchase}
              disabled={isPurchasing}
              className={cn(
                "retro-purchase-button w-full py-3",
                isPurchasing
                  ? "retro-purchase-button-disabled"
                  : "retro-purchase-button-active"
              )}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-black uppercase tracking-wide text-sm">Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="font-black uppercase tracking-wide text-sm">
                    Buy for {bundle.iapPrice}
                  </span>
                </>
              )}
            </button>

            {/* Cancel button */}
            <button
              onClick={() => onOpenChange(false)}
              disabled={isPurchasing}
              className={cn(
                "retro-cancel-button w-full py-2",
                isPurchasing && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-xs font-bold uppercase">Cancel</span>
            </button>
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
};
