import { memo, useState, useEffect, useRef } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';
import { PositionRegistry } from './useAnimalPositions';

interface SpriteAnimalProps {
  animal: AnimalData;
  animalId: string;
  position: number;
  speed: number;
  positionRegistry: PositionRegistry;
}

export const SpriteAnimal = memo(({ animal, animalId, position, speed, positionRegistry }: SpriteAnimalProps) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Refs for animation state
  const frameTimeRef = useRef(0);
  const positionRef = useRef(position);

  const spriteConfig = animal.spriteConfig;
  if (!spriteConfig) return null;

  const { spritePath, frameCount, frameWidth, frameHeight, animationSpeed = 10, frameRow = 0 } = spriteConfig;

  // Calculate frame duration in milliseconds (animationSpeed is FPS)
  const frameDuration = 1000 / animationSpeed;

  // Register and unregister position on mount/unmount
  useEffect(() => {
    positionRegistry.updatePosition(animalId, position);
    return () => {
      positionRegistry.removePosition(animalId);
    };
  }, [animalId, positionRegistry]);

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

      // Get dynamic speed multiplier based on proximity to other animals
      const speedMultiplier = positionRegistry.getSpeedMultiplier(
        animalId,
        positionRef.current,
        speed
      );

      // Update position with adjusted speed
      const adjustedSpeed = speed * speedMultiplier;
      const movement = (adjustedSpeed * (deltaTime / 1000)) / window.innerWidth;

      let newPosition = positionRef.current + movement;

      // When fully off-screen right, wrap to off-screen left
      if (newPosition > 1.15) {
        newPosition = -0.15;
      }

      positionRef.current = newPosition;
      positionRegistry.updatePosition(animalId, newPosition);
      setCurrentPosition(newPosition);

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [speed, frameDuration, frameCount, animalId, positionRegistry]);

  // Scale up the sprite for better visibility (2.5x for crisp pixels)
  const scale = 2.5;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;

  // Calculate pixel-perfect background position (supports multi-row sprites)
  const backgroundPositionX = -(currentFrame * frameWidth * scale);
  const backgroundPositionY = -(frameRow * frameHeight * scale);

  return (
    <div
      className="absolute"
      style={{
        // Position the animal on the ground surface (at the top of the ground platform, above tab bar)
        bottom: '8%',
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
          // Use exact pixel dimensions for the sprite sheet (auto height for multi-row support)
          backgroundSize: `${frameCount * scaledWidth}px auto`,
          backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
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
