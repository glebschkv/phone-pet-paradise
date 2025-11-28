import { memo, useMemo } from 'react';
import { SpriteAnimal } from './SpriteAnimal';
import { AnimalData } from '@/data/AnimalDatabase';
import { useAnimalPositionRegistry } from './useAnimalPositions';

interface AnimalParadeProps {
  unlockedAnimals: AnimalData[];
}

export const AnimalParade = memo(({ unlockedAnimals }: AnimalParadeProps) => {
  // Create shared position registry for collision-aware spacing
  const positionRegistry = useAnimalPositionRegistry();

  // Create parade formation from active ground animals
  const paradeAnimals = useMemo(() => {
    // Only show animals with sprite configs
    const spriteAnimals = unlockedAnimals.filter(a => a.spriteConfig);

    if (spriteAnimals.length === 0) return [];

    // Distribute animals evenly across the screen
    // This ensures better initial spacing to prevent bunching
    const totalAnimals = spriteAnimals.length;
    const spacing = 1.0 / Math.max(totalAnimals, 1);

    return spriteAnimals.map((animal, index) => ({
      animal,
      // Distribute starting positions evenly across the screen
      position: (index * spacing) % 1.0,
      speed: 30, // Base speed - will be adjusted dynamically
      key: `ground-${animal.id}-${index}`
    }));
  }, [unlockedAnimals]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {paradeAnimals.map(({ animal, position, speed, key }) => (
        <SpriteAnimal
          key={key}
          animalId={key}
          animal={animal}
          position={position}
          speed={speed}
          positionRegistry={positionRegistry}
        />
      ))}
    </div>
  );
});

AnimalParade.displayName = 'AnimalParade';
