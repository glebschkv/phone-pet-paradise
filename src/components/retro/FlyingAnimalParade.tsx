import { memo, useMemo } from 'react';
import { FlyingSprite } from './FlyingSprite';
import { AnimalData } from '@/data/AnimalDatabase';

interface FlyingAnimalParadeProps {
  flyingAnimals: AnimalData[];
}

export const FlyingAnimalParade = memo(({ flyingAnimals }: FlyingAnimalParadeProps) => {
  // Create flying formation - birds fly in the sky with staggered heights
  const flyingFormation = useMemo(() => {
    if (flyingAnimals.length === 0) return [];

    return flyingAnimals.map((animal, index) => ({
      animal,
      // Stagger starting positions so birds are spread out
      startPosition: 0.1 + (index * 0.25),
      // Vary heights - each bird at a different altitude
      heightOffset: 0.12 + (index * 0.06), // 12% to 30% from top
      // Vary speeds slightly for natural movement
      speed: 25 + (index * 3),
      key: `flying-${animal.id}-${index}`
    }));
  }, [flyingAnimals]);

  if (flyingFormation.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {flyingFormation.map(({ animal, startPosition, heightOffset, speed, key }) => (
        <FlyingSprite
          key={key}
          animal={animal}
          startPosition={startPosition}
          heightOffset={heightOffset}
          speed={speed}
        />
      ))}
    </div>
  );
});

FlyingAnimalParade.displayName = 'FlyingAnimalParade';
