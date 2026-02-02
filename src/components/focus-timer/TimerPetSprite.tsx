/**
 * TimerPetSprite Component
 *
 * Displays the user's active pet on the timer screen during focus sessions.
 * The pet sits/idles in the center, providing emotional connection during focus.
 * Uses the first active home pet from the collection store.
 */

import { useMemo } from 'react';
import { useActiveHomePets } from '@/stores';
import { getAnimalById } from '@/data/AnimalDatabase';

interface TimerPetSpriteProps {
  isRunning: boolean;
}

export const TimerPetSprite = ({ isRunning }: TimerPetSpriteProps) => {
  const activeHomePets = useActiveHomePets();

  // Get the first active pet's data
  const petData = useMemo(() => {
    if (activeHomePets.length === 0) return null;
    return getAnimalById(activeHomePets[0]) || null;
  }, [activeHomePets]);

  if (!petData?.spriteConfig) return null;

  const spriteConfig = petData.spriteConfig;
  const idleSpritePath = spriteConfig.idleSprite || spriteConfig.spritePath;
  const frameWidth = spriteConfig.frameWidth || 64;
  const frameHeight = spriteConfig.frameHeight || 64;

  if (!idleSpritePath) return null;

  // Scale up for visibility
  const scale = 2.5;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;

  // For idle sprite, show first frame (row 0, frame 0)
  const hasIdleSprite = spriteConfig.idleSprite && spriteConfig.idleSprite !== spriteConfig.spritePath;
  const bgWidth = hasIdleSprite ? 4 * scaledWidth : (spriteConfig.frameCount || 6) * scaledWidth;
  const bgHeight = hasIdleSprite ? scaledHeight : (spriteConfig.walkRows || 1) * scaledHeight;

  return (
    <div className="flex justify-center mb-2">
      <div
        className={`transition-opacity duration-300 ${isRunning ? 'opacity-100' : 'opacity-70'}`}
        style={{
          width: scaledWidth,
          height: scaledHeight,
          backgroundImage: `url(${idleSpritePath})`,
          backgroundSize: `${bgWidth}px ${bgHeight}px`,
          backgroundPosition: '0px 0px',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          filter: isRunning ? 'drop-shadow(0 4px 12px hsl(260 60% 50% / 0.3))' : 'none',
        }}
      />
    </div>
  );
};
