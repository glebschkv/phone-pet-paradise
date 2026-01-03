import { memo } from 'react';
import { getBiomeByName } from '@/data/AnimalDatabase';
import { ImageBackground } from './ImageBackground';

/**
 * Ruins Background (Ancient Ruins)
 */
export const RuinsHomeBackground = memo(() => {
  const biome = getBiomeByName('Ruins');

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(35 50% 65%) 0%, hsl(30 45% 70%) 40%, hsl(25 40% 75%) 100%)"
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(35 50% 65%) 0%, hsl(30 45% 70%) 40%, hsl(25 40% 75%) 100%)'
        }}
      />
    </div>
  );
});
RuinsHomeBackground.displayName = 'RuinsHomeBackground';
