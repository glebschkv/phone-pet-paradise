import { memo, useState, useEffect } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';

interface SpriteAnimalProps {
  animal: AnimalData;
  position: number;
  speed: number;
}

export const SpriteAnimal = memo(({ animal, position, speed }: SpriteAnimalProps) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [direction, setDirection] = useState<'right' | 'left'>('right');

  const spriteConfig = animal.spriteConfig;
  if (!spriteConfig) return null;

  const { spritePath, frameCount } = spriteConfig;

  // Animate position and handle direction changes
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setCurrentPosition(prev => {
        const movement = (speed * deltaTime) / window.innerWidth;
        const newPosition = prev + (direction === 'right' ? movement : -movement);
        
        // Bounce back when reaching edges
        if (newPosition > 0.9) {
          setDirection('left');
          return 0.9;
        } else if (newPosition < 0.1) {
          setDirection('right');
          return 0.1;
        }
        
        return newPosition;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [speed, direction]);

  // Scale up the sprite for better visibility
  const scale = 3;
  const frameWidth = spriteConfig.frameWidth || 32;
  const frameHeight = spriteConfig.frameHeight || 32;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;

  return (
    <div
      className="absolute bottom-[40%]"
      style={{
        left: `${currentPosition * 100}%`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        zIndex: 10,
        transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        transition: 'transform 0.3s ease'
      }}
    >
      <div
        className="w-full h-full animate-sprite-walk-6"
        style={{
          backgroundImage: `url(${spritePath})`,
          backgroundSize: `${frameCount * 100}% 100%`,
          backgroundRepeat: 'no-repeat',
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
