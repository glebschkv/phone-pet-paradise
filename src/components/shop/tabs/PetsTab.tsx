import { Check, Coins, Palette, Clock, Star } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils";
import { ShopItem, PREMIUM_BACKGROUNDS, ShopCategory } from "@/data/ShopData";
import type { ShopInventory } from "@/hooks/useShop";
import { getCoinExclusiveAnimals, AnimalData } from "@/data/AnimalDatabase";
import { toast } from "sonner";
import { SpritePreview, BackgroundPreview } from "../ShopPreviewComponents";
import { RARITY_COLORS, RARITY_BG, RARITY_BORDER, RARITY_GLOW } from "../styles";
import { useThemeStore } from "@/stores";
import { useCallback } from "react";

interface PetsTabProps {
  inventory: ShopInventory;
  isOwned: (itemId: string, category: ShopCategory) => boolean;
  equipBackground: (backgroundId: string | null) => void;
  setSelectedItem: (item: ShopItem | AnimalData | null) => void;
  setShowPurchaseConfirm: (show: boolean) => void;
  canAfford: (price: number) => boolean;
}

export const PetsTab = ({
  inventory,
  isOwned,
  equipBackground,
  setSelectedItem,
  setShowPurchaseConfirm,
  canAfford,
}: PetsTabProps) => {
  const characters = getCoinExclusiveAnimals();
  const setHomeBackground = useThemeStore((state) => state.setHomeBackground);

  // Separate backgrounds with previews from those without
  const backgroundsWithPreviews = PREMIUM_BACKGROUNDS.filter(bg => bg.previewImage);
  const backgroundsWithoutPreviews = PREMIUM_BACKGROUNDS.filter(bg => !bg.previewImage);

  const handleEquipBackground = useCallback((bgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (inventory.equippedBackground === bgId) {
      // Unequip - reset to default theme
      equipBackground(null);
      toast.success("Background unequipped");
      setHomeBackground('day');
    } else {
      equipBackground(bgId);
      toast.success("Background equipped!");
      // Find the background and get its preview image path
      const background = PREMIUM_BACKGROUNDS.find(bg => bg.id === bgId);
      const imagePath = background?.previewImage || 'day';
      setHomeBackground(imagePath);
    }
  }, [inventory.equippedBackground, equipBackground, setHomeBackground]);

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

  return (
    <div className="space-y-4">
      {/* Pets Section */}
      <div>
        <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
          <PixelIcon name="paw" size={16} /> Pets
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {characters.map((character) => {
            const owned = inventory.ownedCharacters.includes(character.id);
            const affordable = canAfford(character.coinPrice || 0);

            return (
              <button
                key={character.id}
                onClick={() => {
                  setSelectedItem(character);
                  if (!owned) setShowPurchaseConfirm(true);
                }}
                className={cn(
                  "retro-shop-card group relative overflow-hidden",
                  "transition-all duration-200 active:scale-95",
                  owned && "retro-shop-card-owned",
                  !owned && RARITY_BG[character.rarity],
                  !owned && RARITY_BORDER[character.rarity],
                  !owned && character.rarity !== 'common' && `shadow-lg ${RARITY_GLOW[character.rarity]}`
                )}
              >
                <div className="retro-scanlines" />
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                  RARITY_COLORS[character.rarity]
                )} />

                {owned && (
                  <div className="absolute top-2 right-2 retro-badge-owned">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div className="relative pt-3 pb-2 px-3 flex flex-col items-center">
                  <div className="h-16 mb-2 flex items-center justify-center overflow-hidden">
                    {character.spriteConfig ? (
                      <SpritePreview
                        animal={character}
                        scale={Math.min(2, 64 / Math.max(character.spriteConfig.frameWidth, character.spriteConfig.frameHeight))}
                      />
                    ) : (
                      <span className="text-4xl retro-pixel-shadow">{character.emoji}</span>
                    )}
                  </div>
                  <div className="flex gap-0.5 mb-1.5">
                    {getRarityStars(character.rarity)}
                  </div>
                  <span className="text-xs font-black text-center tracking-tight uppercase mb-2">
                    {character.name}
                  </span>

                  {owned ? (
                    <div className="retro-price-tag-owned">
                      <span className="text-[10px] font-black uppercase">Owned</span>
                    </div>
                  ) : (
                    <div className={cn(
                      "retro-price-tag",
                      affordable ? "retro-price-tag-afford" : "retro-price-tag-expensive"
                    )}>
                      <Coins className="w-3.5 h-3.5" />
                      <span className="text-xs font-black">{character.coinPrice?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backgrounds with Previews Section */}
      {backgroundsWithPreviews.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
            <PixelIcon name="sun-cloud" size={16} /> Sky Collection
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {backgroundsWithPreviews.map((bg) => {
              const owned = isOwned(bg.id, 'customize');
              const affordable = canAfford(bg.coinPrice || 0);
              const isEquipped = inventory.equippedBackground === bg.id;
              const isComingSoon = bg.comingSoon && !owned;
              return (
                <button
                  key={bg.id}
                  onClick={() => {
                    if (isComingSoon) return;
                    if (owned) {
                      handleEquipBackground(bg.id, { stopPropagation: () => {} } as React.MouseEvent);
                    } else {
                      setSelectedItem(bg);
                      setShowPurchaseConfirm(true);
                    }
                  }}
                  className={cn(
                    "relative rounded-xl border-2 overflow-hidden transition-all",
                    isComingSoon
                      ? "border-gray-300 dark:border-gray-600 opacity-80"
                      : "active:scale-95",
                    !isComingSoon && isEquipped
                      ? "border-purple-400 dark:border-purple-500 ring-2 ring-purple-300"
                      : !isComingSoon && owned
                      ? "border-green-300 dark:border-green-700"
                      : !isComingSoon && RARITY_BORDER[bg.rarity || 'common']
                  )}
                >
                  {/* Background Preview Image */}
                  <div className="relative h-20 overflow-hidden">
                    <BackgroundPreview imagePath={bg.previewImage!} size="large" className="border-0 rounded-none" />
                    {isComingSoon && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="bg-amber-500 border-2 border-amber-600 rounded-lg px-3 py-1 shadow-lg transform -rotate-3">
                          <span className="text-[10px] font-black text-white uppercase tracking-wide drop-shadow-sm">Coming Soon</span>
                        </div>
                      </div>
                    )}
                    {isEquipped && !isComingSoon && (
                      <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                        <div className="bg-purple-500 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <Palette className="w-3 h-3 text-white" />
                          <span className="text-[10px] font-bold text-white">EQUIPPED</span>
                        </div>
                      </div>
                    )}
                    {owned && !isEquipped && !isComingSoon && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="bg-green-500 rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    {bg.bundleId && !owned && !isComingSoon && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-sky-500 text-white text-[8px] font-bold rounded">
                        BUNDLE
                      </div>
                    )}
                    <div className={cn(
                      "absolute top-1 right-1 h-2 w-2 rounded-full",
                      bg.rarity === 'legendary' ? "bg-amber-400" :
                      bg.rarity === 'epic' ? "bg-purple-400" :
                      bg.rarity === 'rare' ? "bg-blue-400" : "bg-gray-400"
                    )} />
                  </div>
                  {/* Info */}
                  <div className={cn(
                    "p-2",
                    isComingSoon ? "bg-gray-100 dark:bg-gray-800/40" :
                    isEquipped ? "bg-purple-50 dark:bg-purple-900/20" :
                    owned ? "bg-green-50 dark:bg-green-900/20" : RARITY_BG[bg.rarity || 'common']
                  )}>
                    <span className="text-[10px] font-bold block leading-tight truncate">{bg.name}</span>
                    {isComingSoon ? (
                      <div className="flex items-center justify-center gap-1 mt-1 text-[9px] font-bold text-gray-400 dark:text-gray-500">
                        <Clock className="w-2.5 h-2.5" />
                        Coming Soon
                      </div>
                    ) : owned ? (
                      <div className="text-[9px] font-medium text-center mt-1 text-purple-600 dark:text-purple-400">
                        {isEquipped ? "Tap to unequip" : "Tap to equip"}
                      </div>
                    ) : (
                      <div className={cn(
                        "flex items-center justify-center gap-0.5 mt-1 text-[9px] font-bold",
                        affordable ? "text-amber-600" : "text-red-500"
                      )}>
                        <Coins className="w-2.5 h-2.5" />
                        {bg.coinPrice?.toLocaleString()}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Backgrounds Section */}
      {backgroundsWithoutPreviews.length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
            <PixelIcon name="picture-frame" size={16} /> Backgrounds
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {backgroundsWithoutPreviews.map((bg) => {
              const owned = isOwned(bg.id, 'customize');
              const affordable = canAfford(bg.coinPrice || 0);
              const isEquipped = inventory.equippedBackground === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => {
                    if (owned) {
                      handleEquipBackground(bg.id, { stopPropagation: () => {} } as React.MouseEvent);
                    } else {
                      setSelectedItem(bg);
                      setShowPurchaseConfirm(true);
                    }
                  }}
                  className={cn(
                    "relative p-2 rounded-xl border-2 text-center transition-all active:scale-95",
                    isEquipped
                      ? "bg-purple-50 dark:bg-purple-900/20 border-purple-400 ring-2 ring-purple-300"
                      : owned
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300"
                      : RARITY_BG[bg.rarity || 'common'],
                    !owned && RARITY_BORDER[bg.rarity || 'common']
                  )}
                >
                  {bg.isLimited && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <Clock className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  {isEquipped ? (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                      <Palette className="w-2.5 h-2.5 text-white" />
                    </div>
                  ) : owned && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <PixelIcon name={bg.icon} size={24} className="block mb-1" />
                  <span className="text-[10px] font-bold block leading-tight">{bg.name}</span>
                  {owned ? (
                    <div className="text-[8px] font-medium mt-1 text-purple-600 dark:text-purple-400">
                      {isEquipped ? "Unequip" : "Equip"}
                    </div>
                  ) : (
                    <div className={cn(
                      "flex items-center justify-center gap-0.5 mt-1 text-[9px] font-bold",
                      affordable ? "text-amber-600" : "text-red-500"
                    )}>
                      <Coins className="w-2.5 h-2.5" />
                      {bg.coinPrice?.toLocaleString()}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
