import { memo, useMemo } from 'react';
import { PixelAnimal } from './PixelAnimal';
import { AnimalData } from '@/data/AnimalDatabase';

interface AnimalParadeProps {
  unlockedAnimals: AnimalData[];
}

export const AnimalParade = memo(({ unlockedAnimals }: AnimalParadeProps) => {
  // Generate parade data with staggered positions and speeds
  const paradeAnimals = useMemo(() => {
    if (!unlockedAnimals.length) return [];
    
    return unlockedAnimals.map((animal, index) => ({
      animal,
      // Stagger starting positions across the screen
      position: (index * 0.2) % 1.2 - 0.2, // Some start off-screen left
      // Vary speeds slightly for natural movement
      speed: 30 + (index % 3) * 10, // 30-50 pixels per second
      key: `${animal.id}-${index}`
    }));
  }, [unlockedAnimals]);
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {paradeAnimals.map(({ animal, position, speed, key }) => (
        <PixelAnimal
          key={key}
          animal={animal}
          position={position}
          speed={speed}
        />
      ))}
      
      {/* Show welcome message if no animals */}
      {unlockedAnimals.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8 bg-card/90 backdrop-blur-sm rounded-lg border-2 border-border">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Welcome to Pixel Paradise!</h2>
            <p className="text-muted-foreground mb-4">
              Complete focus sessions to unlock adorable pixel animals
            </p>
            <p className="text-sm text-muted-foreground">
              🏆 Level up to discover new creatures for your parade!
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

AnimalParade.displayName = 'AnimalParade';