import { Snowflake, Zap, Clock, Image, Check, PawPrint, Palette } from "lucide-react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils";
import { useStreakFreezeCount } from "@/stores/streakStore";
import { useOwnedBackgrounds, useOwnedCharacters, useEquippedBackground } from "@/stores/shopStore";
import { PREMIUM_BACKGROUNDS } from "@/data/ShopData";
import { getCoinExclusiveAnimals } from "@/data/AnimalDatabase";
import { useCoinBooster } from "@/hooks/useCoinBooster";


interface InventoryTabProps {
  equipBackground: (backgroundId: string | null) => boolean;
}

export const InventoryTab = ({ equipBackground }: InventoryTabProps) => {
  const streakFreezeCount = useStreakFreezeCount();
  const ownedBackgrounds = useOwnedBackgrounds();
  const ownedCharacters = useOwnedCharacters();
  const equippedBackground = useEquippedBackground();

  const {
    isBoosterActive,
    activeBooster,
    getTimeRemainingFormatted,
    getCurrentMultiplier,
    getBoosterType,
  } = useCoinBooster();

  const boosterActive = isBoosterActive();
  const boosterInfo = activeBooster ? getBoosterType(activeBooster.boosterId) : null;

  // Get owned premium backgrounds with their data
  const ownedBgData = PREMIUM_BACKGROUNDS.filter(bg => ownedBackgrounds.includes(bg.id));

  // Get owned exclusive pets (shop-purchased pets)
  const allExclusivePets = getCoinExclusiveAnimals();
  const ownedExclusivePets = allExclusivePets.filter(pet => ownedCharacters.includes(pet.id));

  const hasAnyItems = streakFreezeCount > 0 || boosterActive || ownedBgData.length > 0 || ownedExclusivePets.length > 0;

  return (
    <div className="space-y-5">
      {/* Consumables Section */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">Consumables</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Streak Freezes */}
          <div className={cn(
            "retro-shop-card relative overflow-hidden",
            streakFreezeCount > 0
              ? ""
              : "opacity-50"
          )}>
            <div className="retro-scanlines" />
            {/* Colored top bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 to-cyan-600" />
            <div className="relative pt-3 pb-2.5 px-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-sm border border-cyan-500/50">
                  <Snowflake className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-tight">Streak Freeze</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Protects your streak</span>
                <span className={cn(
                  "text-lg font-black tabular-nums",
                  streakFreezeCount > 0 ? "text-cyan-600 dark:text-cyan-400" : "text-gray-400"
                )}>
                  {streakFreezeCount}
                </span>
              </div>
            </div>
          </div>

          {/* Active Booster */}
          <div className={cn(
            "retro-shop-card relative overflow-hidden",
            boosterActive
              ? ""
              : "opacity-50"
          )}>
            <div className="retro-scanlines" />
            {/* Colored top bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-400 to-purple-600" />
            <div className="relative pt-3 pb-2.5 px-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border",
                  boosterActive
                    ? "bg-gradient-to-br from-purple-400 to-purple-600 border-purple-500/50"
                    : "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 border-gray-400/50"
                )}>
                  <Zap className={cn("w-4 h-4 text-white", boosterActive && "animate-pulse")} />
                </div>
                <span className="text-xs font-black uppercase tracking-tight">Booster</span>
              </div>
              {boosterActive && boosterInfo ? (
                <div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                    {getCurrentMultiplier()}x {boosterInfo.name}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-purple-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono font-bold">{getTimeRemainingFormatted()}</span>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">None active</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Owned Backgrounds */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">
            Backgrounds
            {ownedBgData.length > 0 && (
              <span className="ml-1.5 text-[10px] font-bold text-amber-700/50">({ownedBgData.length})</span>
            )}
          </span>
        </div>
        {ownedBgData.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {ownedBgData.map(bg => {
              const isEquipped = equippedBackground === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => {
                    if (isEquipped) {
                      equipBackground(null);
                    } else {
                      equipBackground(bg.id);
                    }
                  }}
                  className={cn(
                    "retro-shop-card relative overflow-hidden text-center transition-all active:scale-95",
                    isEquipped && "retro-shop-card-owned"
                  )}
                >
                  <div className="retro-scanlines" />
                  {bg.previewImage ? (
                    <div className="w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={bg.previewImage}
                        alt={bg.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                      <Image className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="px-1.5 py-1.5">
                    <span className="text-[10px] font-black block truncate uppercase tracking-tight">{bg.name}</span>
                  </div>
                  {isEquipped && (
                    <div className="absolute top-1 right-1 retro-badge-owned">
                      <Palette className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="retro-shop-card relative overflow-hidden">
            <div className="retro-scanlines" />
            <div className="py-5 px-4 text-center">
              <Image className="w-7 h-7 text-gray-300 dark:text-gray-600 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-muted-foreground">No backgrounds yet</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Buy them from the shop!</p>
            </div>
          </div>
        )}
      </div>

      {/* Owned Exclusive Pets */}
      <div>
        <div className="shop-section-header">
          <span className="shop-section-title">
            Exclusive Pets
            {ownedExclusivePets.length > 0 && (
              <span className="ml-1.5 text-[10px] font-bold text-amber-700/50">
                ({ownedExclusivePets.length}/{allExclusivePets.length})
              </span>
            )}
          </span>
        </div>
        {ownedExclusivePets.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {ownedExclusivePets.map(pet => (
              <div
                key={pet.id}
                className="retro-shop-card retro-shop-card-owned relative overflow-hidden"
              >
                <div className="retro-scanlines" />
                {/* Rarity top bar */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r",
                  pet.rarity === 'legendary' ? 'from-amber-400 to-orange-500' :
                  pet.rarity === 'epic' ? 'from-purple-400 to-purple-600' :
                  pet.rarity === 'rare' ? 'from-blue-400 to-blue-600' : 'from-slate-400 to-slate-500'
                )} />
                <div className="relative pt-3 pb-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{pet.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-black block truncate uppercase tracking-tight">{pet.name}</span>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wide",
                        pet.rarity === 'legendary' ? 'text-amber-500' :
                        pet.rarity === 'epic' ? 'text-purple-500' :
                        pet.rarity === 'rare' ? 'text-blue-500' : 'text-gray-500'
                      )}>
                        {pet.rarity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="retro-shop-card relative overflow-hidden">
            <div className="retro-scanlines" />
            <div className="py-5 px-4 text-center">
              <PawPrint className="w-7 h-7 text-gray-300 dark:text-gray-600 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-muted-foreground">No exclusive pets yet</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Check out the Collection tab!</p>
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!hasAnyItems && (
        <div className="py-8 text-center">
          <div className="block mb-2"><PixelIcon name="backpack" size={36} /></div>
          <p className="text-sm font-bold text-muted-foreground">Your inventory is empty</p>
          <p className="text-xs text-muted-foreground mt-1">
            Purchase items from the shop to see them here!
          </p>
        </div>
      )}
    </div>
  );
};
