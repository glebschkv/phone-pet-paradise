import { memo, useMemo } from 'react';
import { SpriteAnimal } from './SpriteAnimal';
import { AnimalData } from '@/data/AnimalDatabase';

interface AnimalParadeProps {
  unlockedAnimals: AnimalData[];
}

export const AnimalParade = memo(({ unlockedAnimals }: AnimalParadeProps) => {
  // Use actual unlocked animals, filter to only those with sprite configs
  const paradeAnimals = useMemo(() => {
    // Default to black dog if no animals unlocked
    const animals = unlockedAnimals.length > 0 ? unlockedAnimals : [{
      id: 'black-dog',
      name: 'Black Dog',
      emoji: '🐕‍⬛',
      rarity: 'common' as const,
      unlockLevel: 0,
      description: 'Your first loyal companion that brings comfort and motivation to your focus sessions.',
      abilities: ['Loyal Support', 'Energy Boost'],
      biome: 'Meadow',
      spriteConfig: {
        spritePath: '/assets/sprites/Walk.png',
        frameCount: 6,
        frameWidth: 32,
        frameHeight: 32,
        animationSpeed: 0.8
      }
    }];

    // Only show animals with sprite configs for now
    const spriteAnimals = animals.filter(a => a.spriteConfig);

    return spriteAnimals.map((animal, index) => ({
      animal,
      position: 0.5, // Start centered
      speed: 20 + (index * 5), // Gentle walking speed
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
