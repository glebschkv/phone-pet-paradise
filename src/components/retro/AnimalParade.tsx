import { memo, useMemo } from 'react';
import { PixelAnimal } from './PixelAnimal';
import { AnimalData } from '@/data/AnimalDatabase';

interface AnimalParadeProps {
  unlockedAnimals: AnimalData[];
}

export const AnimalParade = memo(({ unlockedAnimals }: AnimalParadeProps) => {
  // TEMPORARY: Force both black dog and panda to appear
  const paradeAnimals = useMemo(() => {
    const blackDogData: AnimalData = {
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
    };
    
    const pandaData: AnimalData = {
      id: 'panda',
      name: 'Panda',
      emoji: '🐼',
      rarity: 'common' as const,
      unlockLevel: 1,
      description: 'A calm bamboo-loving friend that inspires gentle focus.',
      abilities: ['Calm Focus', 'Gentle Strength'],
      biome: 'Meadow',
      modelConfig: { type: 'glb', modelPath: '/assets/models/Panda.glb', scale: 0.9, animationName: 'Walk' }
    };
    
    const hardcodedAnimals = [blackDogData, pandaData];
    console.log('AnimalParade: hardcoded animals', hardcodedAnimals);
    
    return hardcodedAnimals.map((animal, index) => ({
      animal,
      position: (index * 0.4) - 0.2, // Spread them out more
      speed: 30 + (index * 15), // Different speeds
      key: `${animal.id}-${index}`
    }));
  }, []);
  
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