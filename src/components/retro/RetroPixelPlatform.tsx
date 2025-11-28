import { memo, useMemo, useState, useEffect } from 'react';
import { RetroBackground } from './RetroBackground';
import { PixelPlatform } from './PixelPlatform';
import { AnimalParade } from './AnimalParade';
import { FlyingAnimalParade } from './FlyingAnimalParade';
import { AnimalData, getAnimalById, getFlyingAnimals, getGroundAnimals } from '@/data/AnimalDatabase';

const ACTIVE_HOME_PETS_KEY = 'petparadise-active-home-pets';

interface RetroPixelPlatformProps {
  unlockedAnimals: string[]; // Animal names from XP system
  currentLevel: number;
  backgroundTheme?: string;
}

export const RetroPixelPlatform = memo(({ unlockedAnimals, currentLevel, backgroundTheme = 'day' }: RetroPixelPlatformProps) => {
  const [activeHomePets, setActiveHomePets] = useState<string[]>([]);

  // Load active home pets from localStorage and listen for changes
  useEffect(() => {
    const loadActivePets = () => {
      const saved = localStorage.getItem(ACTIVE_HOME_PETS_KEY);
      if (saved) {
        try {
          setActiveHomePets(JSON.parse(saved));
        } catch {
          setActiveHomePets(['hare']); // Default to hare
        }
      } else {
        setActiveHomePets(['hare']); // Default to hare
      }
    };

    loadActivePets();

    // Listen for changes from collection page
    const handleChange = (e: CustomEvent) => {
      setActiveHomePets(e.detail);
    };

    window.addEventListener('activeHomePetsChange', handleChange as EventListener);
    return () => {
      window.removeEventListener('activeHomePetsChange', handleChange as EventListener);
    };
  }, []);

  // Get active unlocked animals data
  const activeAnimalData = useMemo(() => {
    return activeHomePets
      .map(id => getAnimalById(id))
      .filter((animal): animal is AnimalData =>
        animal !== undefined &&
        animal.unlockLevel <= currentLevel &&
        animal.spriteConfig !== undefined
      );
  }, [activeHomePets, currentLevel]);

  // Separate ground and flying animals
  const groundAnimals = useMemo(() => getGroundAnimals(activeAnimalData), [activeAnimalData]);
  const flyingAnimals = useMemo(() => getFlyingAnimals(activeAnimalData), [activeAnimalData]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Layered Background */}
      <RetroBackground theme={backgroundTheme} />

      {/* Flying Animals in the sky */}
      <FlyingAnimalParade flyingAnimals={flyingAnimals} />

      {/* Platform Structure */}
      <PixelPlatform />

      {/* Walking Animals on ground */}
      <AnimalParade unlockedAnimals={groundAnimals} />
    </div>
  );
});

RetroPixelPlatform.displayName = 'RetroPixelPlatform';
