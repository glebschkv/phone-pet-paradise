import { memo, useState, useEffect, useRef } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';
import { PositionRegistry } from './useAnimalPositions';

interface FlyingSpriteProps {
  animal: AnimalData;
  animalId: string;
  startPosition: number;
  heightOffset: number; // Percentage from top (0-1)
  speed: number;
  positionRegistry: PositionRegistry;
}

export const FlyingSprite = memo(({ animal, animalId, startPosition, heightOffset, speed, positionRegistry }: FlyingSpriteProps) => {
  const [currentPosition, setCurrentPosition] = useState(startPosition);
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameTimeRef = useRef(0);
  const positionRef = useRef(startPosition);

  const spriteConfig = animal.spriteConfig;
  if (!spriteConfig) return null;

  const { spritePath, frameCount, frameWidth, frameHeight, animationSpeed = 10, frameRow = 0 } = spriteConfig;
  const frameDuration = 1000 / animationSpeed;

  // Register and unregister position on mount/unmount
  useEffect(() => {
    positionRegistry.updatePosition(animalId, startPosition);
    return () => {
      positionRegistry.removePosition(animalId);
    };
  }, [animalId, positionRegistry]);

  // Combined animation loop for position and sprite frames
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update sprite frame
      frameTimeRef.current += deltaTime;
      if (frameTimeRef.current >= frameDuration) {
        setCurrentFrame(prev => (prev + 1) % frameCount);
        frameTimeRef.current = 0;
      }

      // Get dynamic speed multiplier based on proximity to other flying animals
      const speedMultiplier = positionRegistry.getSpeedMultiplier(
        animalId,
        positionRef.current,
        speed
      );

      // Get separation offset to push apart from nearby animals
      const separationOffset = positionRegistry.getSeparationOffset(
        animalId,
        positionRef.current
      );

      // Update position with adjusted speed and separation
      const adjustedSpeed = speed * speedMultiplier;
      const movement = (adjustedSpeed * (deltaTime / 1000)) / window.innerWidth;

      let newPosition = positionRef.current + movement + separationOffset;

      // Wrap around when off screen
      if (newPosition > 1.2) {
        newPosition = -0.2;
      }

      positionRef.current = newPosition;
      positionRegistry.updatePosition(animalId, newPosition);
      setCurrentPosition(newPosition);

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [speed, frameDuration, frameCount, animalId, positionRegistry]);

  // Scale for flying creatures (slightly smaller than ground animals)
  const scale = 2;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;
  const backgroundPositionX = -(currentFrame * frameWidth * scale);
  const backgroundPositionY = -(frameRow * frameHeight * scale);

  return (
    <div
      className="absolute"
      style={{
        top: `${heightOffset * 100}%`,
        left: `${currentPosition * 100}%`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        transform: 'translateX(-50%)',
        willChange: 'transform, left',
      }}
    >
      <div
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          backgroundImage: `url(${spritePath})`,
          backgroundSize: `${frameCount * scaledWidth}px auto`,
          backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
});

FlyingSprite.displayName = 'FlyingSprite';
