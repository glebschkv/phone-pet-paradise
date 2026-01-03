import { memo } from 'react';
import { getBiomeByName } from '@/data/AnimalDatabase';
import { ImageBackground } from './ImageBackground';

/**
 * City Background (City for People)
 */
export const CityHomeBackground = memo(() => {
  const biome = getBiomeByName('City');

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(220 30% 70%) 0%, hsl(220 25% 80%) 40%, hsl(30 40% 85%) 100%)"
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(220 30% 70%) 0%, hsl(220 25% 80%) 40%, hsl(30 40% 85%) 100%)'
        }}
      />
    </div>
  );
});
CityHomeBackground.displayName = 'CityHomeBackground';
