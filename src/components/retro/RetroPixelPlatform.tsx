import { memo, useMemo } from 'react';
import { RetroBackground } from './RetroBackground';
import { PixelPlatform } from './PixelPlatform';
import { AnimalParade } from './AnimalParade';
import { AnimalData, getAnimalByIdOrName } from '@/data/AnimalDatabase';

interface RetroPixelPlatformProps {
  unlockedAnimals: string[]; // Animal names from XP system
  currentLevel: number;
}

export const RetroPixelPlatform = memo(({ unlockedAnimals, currentLevel }: RetroPixelPlatformProps) => {
  // Convert animal names to AnimalData objects
  const animalData = useMemo(() => {
    return unlockedAnimals
      .map(name => getAnimalByIdOrName(name))
      .filter((animal): animal is AnimalData => animal !== undefined);
  }, [unlockedAnimals]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layered Background */}
      <RetroBackground />
      
      {/* Platform Structure */}
      <PixelPlatform />
      
      {/* Walking Animals */}
      <AnimalParade unlockedAnimals={animalData} />
      
      {/* Level indicator overlay */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
          <p className="text-sm font-medium text-muted-foreground">
            Level {currentLevel}
          </p>
          <p className="text-xs text-muted-foreground">
            {animalData.length} animal{animalData.length !== 1 ? 's' : ''} unlocked
          </p>
        </div>
      </div>
    </div>
  );
});

RetroPixelPlatform.displayName = 'RetroPixelPlatform';