import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Coins, Sparkles, Zap, Shield, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarterBundle, CoinPack } from "@/data/ShopData";
import { getAnimalById } from "@/data/AnimalDatabase";
import { BOOSTER_TYPES } from "@/hooks/useCoinBooster";
import { SpritePreview } from "./ShopPreviewComponents";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PixelIcon } from "@/components/ui/PixelIcon";

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
  const contentItems: { icon: React.ReactNode; label: string; sublabel?: string; highlight?: boolean; glowColor?: string }[] = [];

  if (isStarterBundle) {
    const starterBundle = bundle as StarterBundle;

    if (starterBundle.contents.coins > 0) {
      contentItems.push({
        icon: <Coins className="w-4.5 h-4.5 text-amber-400" />,
        label: `${starterBundle.contents.coins.toLocaleString()} Coins`,
        highlight: true,
        glowColor: 'hsl(35 100% 50% / 0.3)',
      });
    }

    if (starterBundle.contents.boosterId) {
      const booster = BOOSTER_TYPES.find(b => b.id === starterBundle.contents.boosterId);
      if (booster) {
        contentItems.push({
          icon: <Zap className="w-4.5 h-4.5 text-yellow-400" />,
          label: booster.name,
          sublabel: booster.description,
          glowColor: 'hsl(50 100% 50% / 0.3)',
        });
      }
    }

    if (starterBundle.contents.characterId) {
      const animal = getAnimalById(starterBundle.contents.characterId);
      if (animal) {
        contentItems.push({
          icon: <span className="text-base leading-none">{animal.emoji}</span>,
          label: animal.name,
          sublabel: `${animal.rarity.charAt(0).toUpperCase() + animal.rarity.slice(1)} Pet`,
          glowColor: 'hsl(280 100% 50% / 0.3)',
        });
      }
    }

    if (starterBundle.contents.streakFreezes && starterBundle.contents.streakFreezes > 0) {
      contentItems.push({
        icon: <Shield className="w-4.5 h-4.5 text-cyan-400" />,
        label: `${starterBundle.contents.streakFreezes} Streak Freeze${starterBundle.contents.streakFreezes > 1 ? 's' : ''}`,
        sublabel: 'Protect your streaks',
        glowColor: 'hsl(190 100% 50% / 0.3)',
      });
    }
  } else if (isCoinPack) {
    const coinPack = bundle as CoinPack;
    contentItems.push({
      icon: <Coins className="w-4.5 h-4.5 text-amber-400" />,
      label: `${coinPack.coinAmount.toLocaleString()} Coins`,
      highlight: true,
      glowColor: 'hsl(35 100% 50% / 0.3)',
    });
    if (coinPack.bonusCoins && coinPack.bonusCoins > 0) {
      contentItems.push({
        icon: <Sparkles className="w-4.5 h-4.5 text-green-400" />,
        label: `+${coinPack.bonusCoins.toLocaleString()} Bonus`,
        sublabel: 'Free extra coins!',
        highlight: true,
        glowColor: 'hsl(140 100% 50% / 0.3)',
      });
    }
  }

  // Pet preview for bundles that include a character
  const petId = isStarterBundle ? (bundle as StarterBundle).contents.characterId : null;
  const pet = petId ? getAnimalById(petId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="retro-modal max-w-[300px] p-0 overflow-hidden border-0">
        <VisuallyHidden>
          <DialogTitle>{bundle.name}</DialogTitle>
        </VisuallyHidden>
        <>
          {/* Header */}
          <div className="retro-modal-header p-4 text-center relative">
            <div className="retro-scanlines opacity-20" />

            {/* Pet sprite preview or bundle icon */}
            <div className="h-24 mb-2 flex items-center justify-center relative z-[1]">
              {pet?.spriteConfig ? (
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full blur-xl scale-[2]"
                    style={{ background: 'hsl(280 80% 60% / 0.25)' }}
                  />
                  <SpritePreview
                    animal={pet}
                    scale={Math.min(2.5, 80 / Math.max(pet.spriteConfig.frameWidth, pet.spriteConfig.frameHeight))}
                  />
                </div>
              ) : (
                <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
                  <div
                    className="absolute inset-0 rounded-full blur-xl scale-[2.5]"
                    style={{ background: 'hsl(35 100% 50% / 0.2)' }}
                  />
                  <PixelIcon name={bundle.icon} size={64} />
                </div>
              )}
            </div>

            {/* Bundle name */}
            <h2
              className="text-lg font-black uppercase tracking-tight text-white relative z-[1]"
              style={{ textShadow: '0 0 10px hsl(260 80% 70% / 0.5), 0 2px 0 rgba(0,0,0,0.3)' }}
            >
              {bundle.name}
            </h2>

            {/* Savings badge — neon green */}
            {'savings' in bundle && bundle.savings && (
              <div className="mt-2 inline-flex items-center gap-1.5 relative z-[1]">
                <span
                  className="px-3 py-1 text-white text-[10px] font-black rounded uppercase tracking-wider border"
                  style={{
                    background: 'linear-gradient(180deg, hsl(120 70% 45%), hsl(120 75% 35%))',
                    borderColor: 'hsl(120 60% 55%)',
                    boxShadow: '0 0 10px hsl(120 100% 40% / 0.5)',
                    textShadow: '0 1px 0 rgba(0,0,0,0.3)',
                  }}
                >
                  Save {bundle.savings}
                </span>
              </div>
            )}

            {/* Rarity stars with glow */}
            {'rarity' in bundle && bundle.rarity && (
              <div className="flex justify-center mt-2 gap-1 relative z-[1]">
                {[...Array(bundle.rarity === 'common' ? 1 : bundle.rarity === 'rare' ? 2 : bundle.rarity === 'epic' ? 3 : 4)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      bundle.rarity === 'legendary'
                        ? "text-amber-400 fill-amber-400 animate-pulse"
                        : "text-amber-400 fill-amber-400"
                    )}
                    style={{ filter: 'drop-shadow(0 0 4px hsl(35 100% 50% / 0.6))' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Contents section — dark retro body */}
          <div
            className="p-4 space-y-3"
            style={{ background: 'linear-gradient(180deg, hsl(260 28% 13%) 0%, hsl(275 22% 10%) 100%)' }}
          >
            {/* Top shine */}
            <div
              className="absolute top-0 left-0 right-0 h-[1px]"
              style={{ background: 'linear-gradient(90deg, transparent 0%, hsl(260 40% 40%) 50%, transparent 100%)' }}
            />

            <p className="text-[11px] text-center leading-relaxed" style={{ color: 'hsl(260 20% 55%)' }}>
              {bundle.description}
            </p>

            {/* Contents list — retro styled */}
            <div className="space-y-1.5">
              <div
                className="text-[9px] font-black uppercase tracking-[0.2em] text-center"
                style={{ color: 'hsl(260 25% 45%)' }}
              >
                Includes
              </div>
              <div className="space-y-1.5">
                {contentItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border"
                    style={{
                      background: 'linear-gradient(180deg, hsl(260 25% 22%) 0%, hsl(260 30% 17%) 100%)',
                      borderColor: 'hsl(260 35% 30%)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'hsl(260 30% 18%)',
                        border: '2px solid hsl(260 35% 32%)',
                        boxShadow: item.glowColor ? `0 0 8px ${item.glowColor}` : undefined,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-bold"
                        style={{ color: item.highlight ? 'hsl(35 90% 65%)' : 'hsl(260 20% 80%)' }}
                      >
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div className="text-[10px] leading-tight" style={{ color: 'hsl(260 15% 50%)' }}>
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase button — retro arcade style */}
            <button
              onClick={onPurchase}
              disabled={isPurchasing}
              className="w-full py-3 rounded-lg border-[3px] font-black uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 text-white active:translate-y-1"
              style={isPurchasing ? {
                background: 'linear-gradient(180deg, hsl(260 20% 25%) 0%, hsl(260 25% 18%) 100%)',
                borderColor: 'hsl(260 20% 35%)',
                color: 'hsl(260 15% 45%)',
                boxShadow: '0 4px 0 hsl(260 30% 12%)',
                cursor: 'not-allowed',
              } : {
                background: 'linear-gradient(180deg, hsl(140 65% 45%) 0%, hsl(140 70% 38%) 50%, hsl(140 75% 30%) 100%)',
                borderColor: 'hsl(140 55% 55%)',
                boxShadow: '0 5px 0 hsl(140 75% 20%), inset 0 2px 0 hsl(140 50% 60%), 0 0 15px hsl(140 100% 40% / 0.3)',
                textShadow: '0 2px 0 rgba(0,0,0,0.3)',
              }}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Buy for {bundle.iapPrice}</span>
                </>
              )}
            </button>

            {/* Cancel button — subtle retro border */}
            <button
              onClick={() => onOpenChange(false)}
              disabled={isPurchasing}
              className={cn(
                "w-full py-2.5 rounded-lg flex items-center justify-center text-xs font-bold uppercase tracking-wide transition-all",
                isPurchasing && "opacity-50 cursor-not-allowed"
              )}
              style={{
                background: 'transparent',
                border: '2px solid hsl(260 30% 30%)',
                color: 'hsl(260 20% 55%)',
              }}
            >
              Cancel
            </button>
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
};
