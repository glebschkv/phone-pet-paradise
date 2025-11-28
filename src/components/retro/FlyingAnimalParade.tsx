import { memo, useMemo } from 'react';
import { FlyingSprite } from './FlyingSprite';
import { AnimalData } from '@/data/AnimalDatabase';
import { useFlyingPositionRegistry } from './useAnimalPositions';

interface FlyingAnimalParadeProps {
  flyingAnimals: AnimalData[];
}

export const FlyingAnimalParade = memo(({ flyingAnimals }: FlyingAnimalParadeProps) => {
  // Create shared position registry for collision-aware spacing
  const positionRegistry = useFlyingPositionRegistry();

  // Create flying formation - birds fly in the sky with staggered heights
  const flyingFormation = useMemo(() => {
    if (flyingAnimals.length === 0) return [];

    // Distribute flying animals evenly across the screen
    const totalAnimals = flyingAnimals.length;
    const spacing = 1.0 / Math.max(totalAnimals, 1);

    return flyingAnimals.map((animal, index) => ({
      animal,
      // Distribute starting positions evenly
      startPosition: (index * spacing) % 1.0,
      // Vary heights - each bird at a different altitude
      heightOffset: 0.12 + (index * 0.06), // 12% to 30% from top
      // Same base speed for all - dynamic spacing will handle the rest
      speed: 28,
      key: `flying-${animal.id}-${index}`
    }));
  }, [flyingAnimals]);

  if (flyingFormation.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {flyingFormation.map(({ animal, startPosition, heightOffset, speed, key }) => (
        <FlyingSprite
          key={key}
          animalId={key}
          animal={animal}
          startPosition={startPosition}
          heightOffset={heightOffset}
          speed={speed}
          positionRegistry={positionRegistry}
        />
      ))}
    </div>
  );
});

FlyingAnimalParade.displayName = 'FlyingAnimalParade';
