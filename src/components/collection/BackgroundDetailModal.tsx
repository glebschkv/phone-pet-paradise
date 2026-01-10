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
      <DialogContent className="max-w-xs retro-card border-2 border-border p-0 overflow-hidden">
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
            <div className="w-full h-full flex items-center justify-center text-5xl bg-muted">
              {background.icon}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <h3 className="text-white font-bold text-lg">{background.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <RarityBadge rarity={background.rarity || 'common'} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {background.description}
          </p>

          {isOwned ? (
            <button
              onClick={handleEquip}
              className={cn(
                "w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95",
                isEquipped
                  ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                  : "bg-gradient-to-r from-purple-400 to-pink-400 text-white"
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

const RarityBadge = memo(({ rarity }: RarityBadgeProps) => {
  const colorClasses = {
    legendary: "bg-amber-400 text-amber-900",
    epic: "bg-purple-400 text-purple-900",
    rare: "bg-blue-400 text-blue-900",
    common: "bg-gray-400 text-gray-900",
  };

  const colorClass = colorClasses[rarity as keyof typeof colorClasses] || colorClasses.common;

  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
      colorClass
    )}>
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
      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center border-2 border-amber-300">
        <ShoppingBag className="w-6 h-6 text-amber-600" />
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        Purchase this background from the Shop
      </p>
      <div className="flex items-center justify-center gap-1 mb-3 text-amber-600">
        <Coins className="w-4 h-4" />
        <span className="font-bold">{coinPrice?.toLocaleString()}</span>
      </div>
      <button
        onClick={onBuyFromShop}
        className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 inline-flex items-center gap-2"
      >
        <ShoppingBag className="w-4 h-4" />
        Buy from Shop
      </button>
    </div>
  );
});

ShopPrompt.displayName = 'ShopPrompt';
