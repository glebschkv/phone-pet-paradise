import { memo, useState, useEffect, useRef } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';

interface SpriteAnimalProps {
  animal: AnimalData;
  position: number;
  speed: number;
}

export const SpriteAnimal = memo(({ animal, position, speed }: SpriteAnimalProps) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [currentFrame, setCurrentFrame] = useState(0);

  // Refs for animation state
  const frameTimeRef = useRef(0);
  const directionRef = useRef<'right' | 'left'>('right');

  const spriteConfig = animal.spriteConfig;
  if (!spriteConfig) return null;

  const { spritePath, frameCount, frameWidth, frameHeight, animationSpeed = 10 } = spriteConfig;

  // Calculate frame duration in milliseconds (animationSpeed is FPS)
  const frameDuration = 1000 / animationSpeed;

  // Keep direction ref in sync
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Combined animation loop for both position and sprite frames
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update sprite frame based on time
      frameTimeRef.current += deltaTime;
      if (frameTimeRef.current >= frameDuration) {
        setCurrentFrame(prev => (prev + 1) % frameCount);
        frameTimeRef.current = 0;
      }

      // Update position
      setCurrentPosition(prev => {
        const movement = (speed * (deltaTime / 1000)) / window.innerWidth;
        const newPosition = prev + (directionRef.current === 'right' ? movement : -movement);

        // Bounce back when reaching edges
        if (newPosition > 0.85) {
          setDirection('left');
          return 0.85;
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
  }, [speed, frameDuration, frameCount]);

  // Scale up the sprite for better visibility (2x for crisp pixels)
  const scale = 2;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;

  // Calculate pixel-perfect background position
  const backgroundPositionX = -(currentFrame * frameWidth * scale);

  return (
    <div
      className="absolute bottom-[40%]"
      style={{
        left: `${currentPosition * 100}%`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        zIndex: 10,
        transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        // GPU acceleration for smooth movement
        willChange: 'transform, left',
      }}
    >
      <div
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          backgroundImage: `url(${spritePath})`,
          // Use exact pixel dimensions for the sprite sheet
          backgroundSize: `${frameCount * scaledWidth}px ${scaledHeight}px`,
          backgroundPosition: `${backgroundPositionX}px 0px`,
          backgroundRepeat: 'no-repeat',
          // Critical for pixel art - no blurring
          imageRendering: 'pixelated',
          // Prevent any smoothing
          WebkitFontSmoothing: 'none',
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
