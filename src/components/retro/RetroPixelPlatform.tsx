import { memo, useMemo } from 'react';
import { RetroBackground } from './RetroBackground';
import { PixelPlatform } from './PixelPlatform';
import { AnimalParade } from './AnimalParade';
import { FlyingAnimalParade } from './FlyingAnimalParade';
import { AnimalData, getAnimalById, getFlyingAnimals, getGroundAnimals, getGroundLevelForTheme } from '@/data/AnimalDatabase';
import { useActiveHomePets, useOwnedCharacters } from '@/stores';

interface RetroPixelPlatformProps {
  unlockedAnimals: string[]; // Animal names from XP system
  currentLevel: number;
  backgroundTheme?: string;
}

export const RetroPixelPlatform = memo(({ unlockedAnimals: _unlockedAnimals, currentLevel, backgroundTheme = 'day' }: RetroPixelPlatformProps) => {
  // Use Zustand stores instead of local state + custom events
  const activeHomePets = useActiveHomePets();
  const shopOwnedCharacters = useOwnedCharacters();

  // Convert array to Set for O(1) lookups instead of O(n)
  const shopOwnedSet = useMemo(() => new Set(shopOwnedCharacters), [shopOwnedCharacters]);

  // Get active unlocked animals data
  // Check both level-based unlock AND shop purchase
  const activeAnimalData = useMemo(() => {
    return activeHomePets
      .map(id => getAnimalById(id))
      .filter((animal): animal is AnimalData =>
        animal !== undefined &&
        (animal.unlockLevel <= currentLevel || shopOwnedSet.has(animal.id)) &&
        animal.spriteConfig !== undefined
      );
  }, [activeHomePets, currentLevel, shopOwnedSet]);

  // Separate ground and flying animals
  const groundAnimals = useMemo(() => getGroundAnimals(activeAnimalData), [activeAnimalData]);
  const flyingAnimals = useMemo(() => getFlyingAnimals(activeAnimalData), [activeAnimalData]);

  // Get the ground level for the current background theme
  const groundLevel = useMemo(() => getGroundLevelForTheme(backgroundTheme), [backgroundTheme]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layered Background */}
      <RetroBackground theme={backgroundTheme} />

      {/* Flying Animals in the sky */}
      <FlyingAnimalParade flyingAnimals={flyingAnimals} />

      {/* Platform Structure */}
      <PixelPlatform theme={backgroundTheme} />

      {/* Walking Animals on ground */}
      <AnimalParade unlockedAnimals={groundAnimals} groundLevel={groundLevel} />
    </div>
  );
});

RetroPixelPlatform.displayName = 'RetroPixelPlatform';
