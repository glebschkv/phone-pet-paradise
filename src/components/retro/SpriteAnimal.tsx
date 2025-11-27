import { memo, useState, useEffect, useRef } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';

interface SpriteAnimalProps {
  animal: AnimalData;
  position: number;
  speed: number;
}

export const SpriteAnimal = memo(({ animal, position, speed }: SpriteAnimalProps) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Refs for animation state
  const frameTimeRef = useRef(0);

  const spriteConfig = animal.spriteConfig;
  if (!spriteConfig) return null;

  const { spritePath, frameCount, frameWidth, frameHeight, animationSpeed = 10 } = spriteConfig;

  // Calculate frame duration in milliseconds (animationSpeed is FPS)
  const frameDuration = 1000 / animationSpeed;

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

      // Update position - continuous left to right movement
      setCurrentPosition(prev => {
        const movement = (speed * (deltaTime / 1000)) / window.innerWidth;
        const newPosition = prev + movement; // Always move right

        // When fully off-screen right, wrap to off-screen left
        if (newPosition > 1.15) {
          return -0.15;
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

  // Scale up the sprite for better visibility (2.5x for crisp pixels)
  const scale = 2.5;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;

  // Calculate pixel-perfect background position
  const backgroundPositionX = -(currentFrame * frameWidth * scale);

  return (
    <div
      className="absolute"
      style={{
        // Position the dog on top of the grass platform
        bottom: '22%',
        left: `${currentPosition * 100}%`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        zIndex: 10,
        transform: 'translateX(-50%)',
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
    </div>
  );
});

SpriteAnimal.displayName = 'SpriteAnimal';
