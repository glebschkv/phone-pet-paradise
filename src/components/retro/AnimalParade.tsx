import { memo, useMemo } from 'react';
import { SpriteAnimal } from './SpriteAnimal';
import { AnimalData } from '@/data/AnimalDatabase';

interface AnimalParadeProps {
  unlockedAnimals: AnimalData[];
}

export const AnimalParade = memo(({ unlockedAnimals }: AnimalParadeProps) => {
  // Create parade formation from active ground animals
  const paradeAnimals = useMemo(() => {
    // Only show animals with sprite configs
    const spriteAnimals = unlockedAnimals.filter(a => a.spriteConfig);

    if (spriteAnimals.length === 0) return [];

    // Stagger starting positions so animals walk in a line behind each other
    // Each animal starts further to the left, creating a parade effect
    return spriteAnimals.map((animal, index) => ({
      animal,
      position: 0.3 - (index * 0.15), // Each animal starts further left
      speed: 30, // Same speed so they maintain spacing
      key: `ground-${animal.id}-${index}`
    }));
  }, [unlockedAnimals]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {paradeAnimals.map(({ animal, position, speed, key }) => (
        <SpriteAnimal
          key={key}
          animal={animal}
          position={position}
          speed={speed}
        />
      ))}
    </div>
  );
});

AnimalParade.displayName = 'AnimalParade';
