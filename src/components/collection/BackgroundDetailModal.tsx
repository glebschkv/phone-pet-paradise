/**
 * BackgroundDetailModal Component
 *
 * Modal for viewing and purchasing/equipping premium backgrounds.
 * Extracted from PetCollectionGrid for better maintainability.
 */

import { memo, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ShoppingBag, Coins, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumBackground } from "@/data/ShopData";

interface BackgroundDetailModalProps {
  background: PremiumBackground | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwned: boolean;
  isEquipped: boolean;
  onEquip: () => void;
  onNavigateToShop: () => void;
}

export const BackgroundDetailModal = memo(({
  background,
  open,
  onOpenChange,
  isOwned,
  isEquipped,
  onEquip,
  onNavigateToShop,
}: BackgroundDetailModalProps) => {
  const handleEquip = useCallback(() => {
    onEquip();
    onOpenChange(false);
  }, [onEquip, onOpenChange]);

  const handleBuyFromShop = useCallback(() => {
    onOpenChange(false);
    onNavigateToShop();
  }, [onOpenChange, onNavigateToShop]);

  if (!background) return null;

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
        {/* Preview Image */}
        <div className="relative h-36 overflow-hidden">
          {background.previewImage ? (
            <img
              src={background.previewImage}
              alt={background.name}
              className="w-full h-full object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-[hsl(260,15%,12%)]">
              {background.icon}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(260,25%,10%)] to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <h3 className="text-white font-bold text-lg">{background.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <RarityBadge rarity={background.rarity || 'common'} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-[hsl(260,10%,55%)] text-center">
            {background.description}
          </p>

          {isOwned ? (
            <button
              onClick={handleEquip}
              className={cn(
                "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95 border",
                isEquipped
                  ? "bg-[hsl(280,25%,20%)] text-[hsl(280,60%,70%)] border-[hsl(280,40%,35%)]"
                  : "bg-gradient-to-r from-[hsl(280,50%,45%)] to-[hsl(300,40%,45%)] text-white border-[hsl(280,40%,55%)]"
              )}
            >
              <Palette className="w-4 h-4 inline mr-2" />
              {isEquipped ? "Unequip" : "Equip Background"}
            </button>
          ) : (
            <ShopPrompt
              coinPrice={background.coinPrice}
              onBuyFromShop={handleBuyFromShop}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

BackgroundDetailModal.displayName = 'BackgroundDetailModal';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface RarityBadgeProps {
  rarity: string;
}

const RARITY_COLORS: Record<string, { color: string; glow: string }> = {
  legendary: { color: "hsl(45, 90%, 55%)", glow: "0 0 6px hsl(45, 90%, 55%, 0.4)" },
  epic: { color: "hsl(280, 70%, 60%)", glow: "0 0 6px hsl(280, 70%, 60%, 0.4)" },
  rare: { color: "hsl(210, 70%, 55%)", glow: "0 0 4px hsl(210, 70%, 55%, 0.3)" },
  common: { color: "hsl(220, 10%, 55%)", glow: "none" },
};

const RarityBadge = memo(({ rarity }: RarityBadgeProps) => {
  const conf = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
      style={{
        color: conf.color,
        border: `1px solid ${conf.color}`,
        background: `${conf.color}15`,
        boxShadow: conf.glow,
      }}
    >
      {rarity}
    </span>
  );
});

RarityBadge.displayName = 'RarityBadge';

interface ShopPromptProps {
  coinPrice?: number;
  onBuyFromShop: () => void;
}

const ShopPrompt = memo(({ coinPrice, onBuyFromShop }: ShopPromptProps) => {
  return (
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-3 bg-[hsl(35,25%,18%)] rounded-full flex items-center justify-center border-2 border-[hsl(35,50%,40%)]">
        <ShoppingBag className="w-6 h-6 text-[hsl(35,70%,55%)]" />
      </div>
      <p className="text-sm text-[hsl(260,10%,50%)] mb-2">
        Purchase this background from the Shop
      </p>
      <div className="flex items-center justify-center gap-1 mb-3 text-[hsl(35,70%,55%)]">
        <Coins className="w-4 h-4" />
        <span className="font-bold">{coinPrice?.toLocaleString()}</span>
      </div>
      <button
        onClick={onBuyFromShop}
        className="bg-gradient-to-r from-[hsl(35,70%,45%)] to-[hsl(25,65%,40%)] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 inline-flex items-center gap-2 border border-[hsl(35,60%,55%)] shadow-[0_0_10px_hsl(35,80%,50%,0.3)]"
      >
        <ShoppingBag className="w-4 h-4" />
        Buy from Shop
      </button>
    </div>
  );
});

ShopPrompt.displayName = 'ShopPrompt';
