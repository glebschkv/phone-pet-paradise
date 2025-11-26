import { memo, useMemo } from 'react';
import { RetroBackground } from './RetroBackground';
import { PixelPlatform } from './PixelPlatform';
import { AnimalParade } from './AnimalParade';
import { AnimalData, getAnimalByIdOrName } from '@/data/AnimalDatabase';

interface RetroPixelPlatformProps {
  unlockedAnimals: string[]; // Animal names from XP system
  currentLevel: number;
  backgroundTheme?: string;
}

export const RetroPixelPlatform = memo(({ unlockedAnimals, currentLevel, backgroundTheme = 'day' }: RetroPixelPlatformProps) => {
  // Convert animal names to animal data
  const animalData = useMemo(() => {
    const foundAnimals = unlockedAnimals
      .map(name => getAnimalByIdOrName(name))
      .filter((animal): animal is AnimalData => animal !== undefined);

    return foundAnimals;
  }, [unlockedAnimals]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layered Background */}
      <RetroBackground theme={backgroundTheme} />

      {/* Platform Structure */}
      <PixelPlatform />

      {/* Walking Animals */}
      <AnimalParade unlockedAnimals={animalData} />
    </div>
  );
});

RetroPixelPlatform.displayName = 'RetroPixelPlatform';
