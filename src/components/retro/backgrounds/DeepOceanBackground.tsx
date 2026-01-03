import { memo } from 'react';
import { getBiomeByName } from '@/data/AnimalDatabase';
import { ImageBackground } from './ImageBackground';

// Bubble positions for underwater animation
const BUBBLES = [
  { bottom: '20%', left: '10%', size: 4, delay: 0 },
  { bottom: '30%', left: '25%', size: 3, delay: 1.2 },
  { bottom: '15%', left: '45%', size: 5, delay: 0.5 },
  { bottom: '25%', left: '65%', size: 3.5, delay: 1.8 },
  { bottom: '35%', left: '80%', size: 4, delay: 0.8 },
  { bottom: '10%', left: '90%', size: 3, delay: 2.2 },
];

/**
 * Deep Ocean Background
 */
export const DeepOceanHomeBackground = memo(() => {
  const biome = getBiomeByName('Deep Ocean');

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(210 60% 25%) 0%, hsl(200 55% 35%) 40%, hsl(190 50% 45%) 100%)"
      >
        {/* Bubble effects for underwater atmosphere */}
        {BUBBLES.map((bubble, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              bottom: bubble.bottom,
              left: bubble.left,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              background: 'hsl(200 80% 90% / 0.4)',
              boxShadow: `0 0 ${bubble.size}px hsl(200 80% 90% / 0.3)`,
              animation: `float ${3 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${bubble.delay}s`
            }}
          />
        ))}
      </ImageBackground>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(210 60% 25%) 0%, hsl(200 55% 35%) 40%, hsl(190 50% 45%) 100%)'
        }}
      />
    </div>
  );
});
DeepOceanHomeBackground.displayName = 'DeepOceanHomeBackground';
