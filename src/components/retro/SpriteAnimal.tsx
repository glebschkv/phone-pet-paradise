import { memo, useState, useEffect } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';

interface SpriteAnimalProps {
  animal: AnimalData;
  position: number;
  speed: number;
}

export const SpriteAnimal = memo(({ animal, position, speed }: SpriteAnimalProps) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [isWalking, setIsWalking] = useState(true);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setCurrentPosition(prev => {
        const newPosition = prev + (speed * deltaTime) / window.innerWidth;
        // Reset position when animal walks off screen (allowing for wrap-around)
        return newPosition > 1.2 ? -0.2 : newPosition;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [speed]);

  const spriteConfig = animal.spriteConfig;
  if (!spriteConfig) return null;

  const { spritePath, frameCount, frameWidth, frameHeight } = spriteConfig;

  // Scale up the sprite for better visibility
  const scale = 3;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;

  return (
    <div
      className="absolute bottom-[40%] transition-transform duration-100"
      style={{
        left: `${currentPosition * 100}%`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        zIndex: 10,
        border: '2px solid red' // DEBUG: Remove this later
      }}
    >
      <div
        className={`w-full h-full ${isWalking ? `animate-sprite-walk-${frameCount}` : ''}`}
        style={{
          backgroundImage: `url(${spritePath})`,
          backgroundSize: `${frameCount * 100}% 100%`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0 0',
          imageRendering: 'pixelated'
        }}
      />
      
      {/* Animal name tooltip on hover */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-card/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium whitespace-nowrap border border-border">
          {animal.name}
        </div>
      </div>
    </div>
  );
});

SpriteAnimal.displayName = 'SpriteAnimal';