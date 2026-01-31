/**
 * WorldGrid Component
 *
 * Renders the biome/world selection grid.
 * Extracted from PetCollectionGrid for better maintainability.
 */

import { memo, useCallback, useRef } from "react";
import {
  TreePine,
  Snowflake,
  MapPin,
  Sun,
  Sunset,
  Moon,
  Building2,
  Waves,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BIOME_DATABASE } from "@/data/AnimalDatabase";

// Biome icons match background themes
const BIOME_ICONS = {
  'Meadow': Sun,
  'Sunset': Sunset,
  'Night': Moon,
  'Forest': TreePine,
  'Snow': Snowflake,
  'City': Building2,
  'Deep Ocean': Waves,
} as const;

interface WorldGridProps {
  currentLevel: number;
  currentBiome: string;
  equippedBackground: string | null;
  onSwitchBiome: (biomeName: string) => void;
}

export const WorldGrid = memo(({
  currentLevel,
  currentBiome,
  equippedBackground,
  onSwitchBiome,
}: WorldGridProps) => {
  const listRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((biome: typeof BIOME_DATABASE[number], isUnlocked: boolean) => {
    if (isUnlocked) {
      onSwitchBiome(biome.name);
    }
  }, [onSwitchBiome]);

  // Keyboard navigation for arrow keys within the list
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    const total = BIOME_DATABASE.length;
    let nextIndex = currentIndex;
    let handled = false;

    switch (e.key) {
      case 'ArrowUp':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : total - 1;
        handled = true;
        break;
      case 'ArrowDown':
        nextIndex = currentIndex < total - 1 ? currentIndex + 1 : 0;
        handled = true;
        break;
      case 'Home':
        nextIndex = 0;
        handled = true;
        break;
      case 'End':
        nextIndex = total - 1;
        handled = true;
        break;
      default:
        return;
    }

    if (handled) {
      e.preventDefault();
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button');
      if (buttons && buttons[nextIndex]) {
        buttons[nextIndex].focus();
      }
    }
  }, []);

  return (
    <div ref={listRef} className="space-y-2" role="listbox" aria-label="World selection">
      {BIOME_DATABASE.map((biome, index) => {
        const Icon = BIOME_ICONS[biome.name as keyof typeof BIOME_ICONS] || Sun;
        const isActive = biome.name === currentBiome && !equippedBackground;
        const isUnlocked = biome.unlockLevel <= currentLevel;

        return (
          <button
            key={biome.name}
            onClick={() => handleClick(biome, isUnlocked)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={!isUnlocked}
            role="option"
            aria-selected={isActive}
            aria-label={isUnlocked ? `${biome.name} world${isActive ? ', currently selected' : ''}` : `${biome.name} world, locked, unlocks at level ${biome.unlockLevel}`}
            className={cn(
              "w-full overflow-hidden transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[hsl(180,60%,50%)] rounded-lg",
              isActive
                ? "ring-2 ring-[hsl(180,60%,50%)] bg-[hsl(260,20%,17%)] border border-[hsl(180,40%,35%)]"
                : "bg-[hsl(260,20%,15%)] border border-[hsl(260,25%,25%)]",
              !isUnlocked && "opacity-40"
            )}
          >
            <div className="flex items-stretch">
              {/* Preview Image */}
              <div className="w-20 h-16 flex-shrink-0 bg-[hsl(260,15%,12%)] overflow-hidden">
                {biome.backgroundImage && isUnlocked ? (
                  <img
                    src={biome.backgroundImage}
                    alt={biome.name}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {isUnlocked ? (
                      <Icon className="w-6 h-6 text-[hsl(260,15%,40%)]" />
                    ) : (
                      <Lock className="w-5 h-5 text-[hsl(260,10%,35%)]" />
                    )}
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 flex items-center justify-between px-3 py-2">
                <div className="text-left">
                  <div className="font-bold text-sm text-[hsl(45,20%,80%)]">
                    {isUnlocked ? biome.name : "???"}
                  </div>
                  <div className="text-[10px] text-[hsl(260,10%,45%)]">
                    {isUnlocked ? (
                      isActive ? 'Currently here' : `Level ${biome.unlockLevel}+`
                    ) : (
                      `Unlock at Lv.${biome.unlockLevel}`
                    )}
                  </div>
                </div>

                {isUnlocked && (
                  isActive ? (
                    <div className="px-2 py-1 text-[10px] font-bold flex items-center gap-1 rounded-md bg-[hsl(180,40%,30%)] text-[hsl(180,80%,75%)] border border-[hsl(180,40%,40%)]">
                      <MapPin className="w-3 h-3" />
                      Here
                    </div>
                  ) : (
                    <div className="px-3 py-1 text-xs font-semibold rounded-md bg-[hsl(260,20%,22%)] text-[hsl(260,15%,55%)] border border-[hsl(260,20%,30%)]">
                      Visit
                    </div>
                  )
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
});

WorldGrid.displayName = 'WorldGrid';
