import { memo, useMemo } from 'react';
import { SpriteAnimal } from './SpriteAnimal';
import { AnimalData, getAnimalById } from '@/data/AnimalDatabase';

interface AnimalParadeProps {
  unlockedAnimals: AnimalData[];
}

export const AnimalParade = memo(({ unlockedAnimals }: AnimalParadeProps) => {
  // Use actual unlocked animals, filter to only those with sprite configs
  const paradeAnimals = useMemo(() => {
    // Default to meadow hare if no animals unlocked (first animal in database)
    const defaultAnimal = getAnimalById('hare') || {
      id: 'hare',
      name: 'Meadow Hare',
      emoji: '🐰',
      rarity: 'common' as const,
      unlockLevel: 0,
      description: 'Your first loyal companion!',
      abilities: ['Quick Focus', 'Gentle Support', 'Speed Boost'],
      biome: 'Meadow',
      spriteConfig: {
        spritePath: '/assets/sprites/HARE_WALK.png',
        frameCount: 4,
        frameWidth: 28,
        frameHeight: 28,
        animationSpeed: 10
      }
    };

    const animals = unlockedAnimals.length > 0 ? unlockedAnimals : [defaultAnimal];

    // Only show animals with sprite configs for now
    const spriteAnimals = animals.filter(a => a.spriteConfig);

    // Stagger starting positions so animals run sequentially behind each other
    // Each animal starts further to the left, creating a parade effect
    return spriteAnimals.map((animal, index) => ({
      animal,
      position: 0.3 - (index * 0.2), // Each animal starts further left
      speed: 30, // Same speed so they maintain spacing
      key: `${animal.id}-${index}`
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

      {/* Show welcome message if no animals at all */}
      {paradeAnimals.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="retro-card text-center p-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Welcome to Pixel Paradise!</h2>
            <p className="text-muted-foreground mb-4">
              Complete focus sessions to unlock adorable pixel animals
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

AnimalParade.displayName = 'AnimalParade';
