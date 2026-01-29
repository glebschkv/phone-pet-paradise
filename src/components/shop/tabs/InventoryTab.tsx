import { Snowflake, Zap, Clock, Image, Check, PawPrint } from "lucide-react";
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
    <div className="space-y-4">
      {/* Consumables Section */}
      <div>
        <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
          <span>🎒</span> Consumables
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {/* Streak Freezes */}
          <div className={cn(
            "p-3 rounded-xl border-2 transition-all",
            streakFreezeCount > 0
              ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-700"
              : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Snowflake className="w-5 h-5 text-cyan-500" />
              <span className="text-sm font-bold">Streak Freeze</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Protects your streak</span>
              <span className={cn(
                "text-lg font-black tabular-nums",
                streakFreezeCount > 0 ? "text-cyan-600 dark:text-cyan-400" : "text-gray-400"
              )}>
                {streakFreezeCount}
              </span>
            </div>
          </div>

          {/* Active Booster */}
          <div className={cn(
            "p-3 rounded-xl border-2 transition-all",
            boosterActive
              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
              : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className={cn("w-5 h-5", boosterActive ? "text-purple-500 animate-pulse" : "text-gray-400")} />
              <span className="text-sm font-bold">Booster</span>
            </div>
            {boosterActive && boosterInfo ? (
              <div>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {getCurrentMultiplier()}x {boosterInfo.name}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-purple-500 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono font-bold">{getTimeRemainingFormatted()}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">None active</span>
            )}
          </div>
        </div>
      </div>

      {/* Owned Backgrounds */}
      <div>
        <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
          <span>🖼️</span> Backgrounds
          {ownedBgData.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">({ownedBgData.length})</span>
          )}
        </h4>
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
                    "relative p-2 rounded-xl border-2 text-center transition-all active:scale-95",
                    isEquipped
                      ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-300"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  )}
                >
                  {bg.previewImage ? (
                    <div className="w-full aspect-[4/3] rounded-lg mb-1.5 overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={bg.previewImage}
                        alt={bg.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] rounded-lg mb-1.5 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                      <Image className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <span className="text-[10px] font-bold block truncate">{bg.name}</span>
                  {isEquipped && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
            <Image className="w-6 h-6 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No backgrounds yet</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Buy them from the shop!</p>
          </div>
        )}
      </div>

      {/* Owned Exclusive Pets */}
      <div>
        <h4 className="text-sm font-bold mb-2 px-1 flex items-center gap-2">
          <span>🐾</span> Exclusive Pets
          {ownedExclusivePets.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({ownedExclusivePets.length}/{allExclusivePets.length})
            </span>
          )}
        </h4>
        {ownedExclusivePets.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {ownedExclusivePets.map(pet => (
              <div
                key={pet.id}
                className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{pet.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold block truncate">{pet.name}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wide",
                      pet.rarity === 'legendary' ? 'text-amber-500' :
                      pet.rarity === 'epic' ? 'text-purple-500' :
                      pet.rarity === 'rare' ? 'text-blue-500' : 'text-gray-500'
                    )}>
                      {pet.rarity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
            <PawPrint className="w-6 h-6 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">No exclusive pets yet</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Check out the Collection tab!</p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!hasAnyItems && (
        <div className="py-8 text-center">
          <span className="text-4xl block mb-2">🎒</span>
          <p className="text-sm font-bold text-muted-foreground">Your inventory is empty</p>
          <p className="text-xs text-muted-foreground mt-1">
            Purchase items from the shop to see them here!
          </p>
        </div>
      )}
    </div>
  );
};
