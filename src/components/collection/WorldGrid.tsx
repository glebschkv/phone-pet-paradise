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
              "w-full retro-card overflow-hidden transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              isActive && "ring-2 ring-green-400",
              !isUnlocked && "opacity-50"
            )}
          >
            <div className="flex items-stretch">
              {/* Preview Image */}
              <div className="w-20 h-16 flex-shrink-0 bg-muted overflow-hidden">
                {biome.backgroundImage && isUnlocked ? (
                  <img
                    src={biome.backgroundImage}
                    alt={biome.name}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    {isUnlocked ? (
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 flex items-center justify-between px-3 py-2">
                <div className="text-left">
                  <div className="font-bold text-sm">
                    {isUnlocked ? biome.name : "???"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {isUnlocked ? (
                      isActive ? 'Currently here' : `Level ${biome.unlockLevel}+`
                    ) : (
                      `Unlock at Lv.${biome.unlockLevel}`
                    )}
                  </div>
                </div>

                {isUnlocked && (
                  isActive ? (
                    <div className="retro-level-badge px-2 py-1 text-[10px] font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Here
                    </div>
                  ) : (
                    <div className="retro-stat-pill px-3 py-1 text-xs font-semibold">
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
