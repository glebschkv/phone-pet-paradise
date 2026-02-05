import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, Sparkles, Star, Loader2 } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils";
import { ShopItem, BackgroundBundle, PetBundle } from "@/data/ShopData";
import { AnimalData } from "@/data/AnimalDatabase";
import { SpritePreview, BackgroundPreview, BundlePreviewCarousel, PetBundlePreviewCarousel } from "./ShopPreviewComponents";
import { RARITY_COLORS } from "./styles";

interface PurchaseConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: ShopItem | AnimalData | BackgroundBundle | PetBundle | null;
  onPurchase: () => void;
  canAfford: (price: number) => boolean;
  coinBalance: number;
  isPurchasing?: boolean;
}

export const PurchaseConfirmDialog = ({
  open,
  onOpenChange,
  selectedItem,
  onPurchase,
  canAfford,
  coinBalance,
  isPurchasing = false,
}: PurchaseConfirmDialogProps) => {
  const getRarityStars = (rarity: string) => {
    const count = rarity === 'common' ? 1 : rarity === 'rare' ? 2 : rarity === 'epic' ? 3 : 4;
    return [...Array(count)].map((_, i) => (
      <Star
        key={i}
        className={cn(
          "w-3 h-3",
          rarity === 'legendary' ? "text-amber-400 fill-amber-400 animate-pulse" : "text-amber-400 fill-amber-400"
        )}
      />
    ));
  };

  if (!selectedItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="retro-modal max-w-[280px] p-0 overflow-hidden border-0">
        <>
          <div className="retro-modal-header p-4 text-center">
            <div className="retro-scanlines opacity-30" />
            <div className="h-28 mb-2 flex items-center justify-center overflow-hidden">
              {'petIds' in selectedItem ? (
                // Pet bundle preview carousel
                <PetBundlePreviewCarousel petIds={(selectedItem as PetBundle).petIds} />
              ) : 'spriteConfig' in selectedItem && selectedItem.spriteConfig ? (
                <SpritePreview
                  animal={selectedItem as AnimalData}
                  scale={Math.min(2.5, 90 / Math.max((selectedItem as AnimalData).spriteConfig!.frameWidth, (selectedItem as AnimalData).spriteConfig!.frameHeight))}
                />
              ) : 'previewImages' in selectedItem ? (
                // Background bundle preview carousel
                <div className="w-full">
                  <BundlePreviewCarousel images={(selectedItem as BackgroundBundle).previewImages} />
                </div>
              ) : 'previewImage' in selectedItem && typeof selectedItem.previewImage === 'string' && selectedItem.previewImage ? (
                // Single background preview
                <BackgroundPreview imagePath={selectedItem.previewImage} size="large" className="w-full" />
              ) : 'emoji' in selectedItem ? (
                <span className="text-5xl retro-pixel-shadow animate-bounce">
                  {selectedItem.emoji}
                </span>
              ) : (
                <div className="animate-bounce">
                  <PixelIcon name={selectedItem.icon} size={48} className="retro-pixel-shadow" />
                </div>
              )}
            </div>
            <DialogHeader>
              <DialogTitle className="text-lg font-black uppercase tracking-tight">
                {selectedItem.name}
              </DialogTitle>
            </DialogHeader>
            {'rarity' in selectedItem && selectedItem.rarity && (
              <div className="flex justify-center mt-2">
                <span className={cn(
                  "retro-rarity-badge",
                  `bg-gradient-to-r ${RARITY_COLORS[selectedItem.rarity]}`
                )}>
                  {getRarityStars(selectedItem.rarity)}
                  <span className="ml-1 text-xs font-black uppercase">
                    {selectedItem.rarity}
                  </span>
                </span>
              </div>
            )}
            {'backgroundIds' in selectedItem && (
              <div className="mt-1 text-xs text-muted-foreground">
                Includes {(selectedItem as BackgroundBundle).backgroundIds.length} backgrounds
              </div>
            )}
            {'petIds' in selectedItem && (
              <div className="mt-1 text-xs text-muted-foreground">
                Includes {(selectedItem as PetBundle).petIds.length} pets
              </div>
            )}
          </div>

          <div className="p-3 space-y-3 bg-card">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {selectedItem.description}
            </p>

            {'totalValue' in selectedItem && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground line-through">
                  {(selectedItem as BackgroundBundle | PetBundle).totalValue.toLocaleString()}
                </span>
                <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">
                  SAVE {(selectedItem as BackgroundBundle | PetBundle).savings}
                </span>
              </div>
            )}

            <div className="retro-price-display py-2">
              <span className="text-muted-foreground text-xs">Price:</span>
              <div className="flex items-center gap-1.5">
                <PixelIcon name="coin" size={16} />
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {('coinPrice' in selectedItem ? selectedItem.coinPrice : 0)?.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-center text-[10px] text-muted-foreground">
              Balance after: <span className="font-bold">{(coinBalance - ('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0)).toLocaleString()}</span> coins
            </div>

            <button
              onClick={onPurchase}
              disabled={isPurchasing || !canAfford('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0)}
              className={cn(
                "retro-purchase-button w-full py-2.5",
                !isPurchasing && canAfford('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0)
                  ? "retro-purchase-button-active"
                  : "retro-purchase-button-disabled"
              )}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-black uppercase tracking-wide text-sm">Processing...</span>
                </>
              ) : canAfford('coinPrice' in selectedItem ? selectedItem.coinPrice || 0 : 0) ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="font-black uppercase tracking-wide text-sm">Purchase</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span className="font-black uppercase tracking-wide text-sm">Not Enough</span>
                </>
              )}
            </button>

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
