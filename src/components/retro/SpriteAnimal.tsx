import { memo, useState, useEffect, useRef } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';
import { PositionRegistry } from './useAnimalPositions';

// Configuration for random idle pauses
const IDLE_MIN_INTERVAL = 8000;  // Minimum 8 seconds between idle pauses
const IDLE_MAX_INTERVAL = 15000; // Maximum 15 seconds between idle pauses
const IDLE_DURATION_MIN = 2000;  // Minimum idle duration
const IDLE_DURATION_MAX = 4000;  // Maximum idle duration

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
  const [direction, setDirection] = useState<'left' | 'right'>(() => Math.random() > 0.5 ? 'right' : 'left');
  const [isIdle, setIsIdle] = useState(false);

  // Refs for animation state
  const frameTimeRef = useRef(0);
  const positionRef = useRef(position);
  const directionRef = useRef(direction);
  const isIdleRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spriteConfig = animal.spriteConfig;

  // Get sprite config values (use defaults if no config)
  const walkSpritePath = spriteConfig?.spritePath ?? '';
  const idleSpritePath = spriteConfig?.idleSprite ?? walkSpritePath;
  const frameCount = spriteConfig?.frameCount ?? 6;
  const frameWidth = spriteConfig?.frameWidth ?? 64;
  const frameHeight = spriteConfig?.frameHeight ?? 64;
  const animationSpeed = spriteConfig?.animationSpeed ?? 8;
  const walkRows = spriteConfig?.walkRows ?? 1;      // Total rows in walk sprite
  const frameRow = spriteConfig?.frameRow ?? (walkRows === 2 ? 1 : walkRows === 4 ? 2 : 0); // Default to east row

  // Update direction ref when state changes
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Update idle ref when state changes
  useEffect(() => {
    isIdleRef.current = isIdle;
  }, [isIdle]);

  // Register and unregister position on mount/unmount
  useEffect(() => {
    positionRegistry.updatePosition(animalId, position);
    return () => {
      positionRegistry.removePosition(animalId);
    };
  }, [animalId, position, positionRegistry]);

  // Set up idle timer for occasional pauses
  useEffect(() => {
    const scheduleNextIdle = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      const interval = Math.random() * (IDLE_MAX_INTERVAL - IDLE_MIN_INTERVAL) + IDLE_MIN_INTERVAL;

      idleTimerRef.current = setTimeout(() => {
        // Only trigger idle if not already idle
        if (!isIdleRef.current) {
          isIdleRef.current = true;
          setIsIdle(true);
          setCurrentFrame(0);

          // Schedule end of idle
          const idleDuration = Math.random() * (IDLE_DURATION_MAX - IDLE_DURATION_MIN) + IDLE_DURATION_MIN;
          idleDurationTimerRef.current = setTimeout(() => {
            isIdleRef.current = false;
            setIsIdle(false);
            setCurrentFrame(0);
            scheduleNextIdle();
          }, idleDuration);
        } else {
          scheduleNextIdle();
        }
      }, interval);
    };

    // Start the scheduling
    scheduleNextIdle();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (idleDurationTimerRef.current) {
        clearTimeout(idleDurationTimerRef.current);
      }
    };
  }, []);

  // Combined animation loop for both position and sprite frames
  useEffect(() => {
    if (!spriteConfig) return;

    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      // Clamp deltaTime to prevent large jumps after tab switches (max 100ms)
      const deltaTime = Math.min(currentTime - lastTime, 100);
      lastTime = currentTime;

      const loopFrameDuration = 1000 / animationSpeed;

      // Update sprite frame based on time
      frameTimeRef.current += deltaTime;
      if (frameTimeRef.current >= loopFrameDuration) {
        if (isIdleRef.current) {
          // For idle, just show static frame (south direction from 4-direction sprite)
          // The idle sprite is a 4-direction sheet, south is typically row 0 or first frame
          setCurrentFrame(0);
        } else {
          // Walking animation
          setCurrentFrame(prev => (prev + 1) % frameCount);
        }
        frameTimeRef.current = 0;
      }

      // Only move if not idle
      if (!isIdleRef.current) {
        // Get dynamic speed multiplier based on proximity to other animals
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

        // Apply movement based on direction
        const directionMultiplier = directionRef.current === 'right' ? 1 : -1;
        let newPosition = positionRef.current + (movement * directionMultiplier) + separationOffset;

        // Check boundaries and flip direction
        const leftBoundary = 0.1;  // 10% from left
        const rightBoundary = 0.9; // 90% from left (10% from right)

        if (newPosition > rightBoundary && directionRef.current === 'right') {
          // Hit right edge, turn around
          directionRef.current = 'left';
          setDirection('left');
          newPosition = rightBoundary;
        } else if (newPosition < leftBoundary && directionRef.current === 'left') {
          // Hit left edge, turn around
          directionRef.current = 'right';
          setDirection('right');
          newPosition = leftBoundary;
        }

        positionRef.current = newPosition;
        positionRegistry.updatePosition(animalId, newPosition);
        setCurrentPosition(newPosition);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [spriteConfig, speed, animalId, positionRegistry, frameCount, animationSpeed]);

  // Early return AFTER all hooks
  if (!spriteConfig) return null;

  // Scale up the sprite for better visibility
  const scale = 2.5;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;

  // Determine which sprite to use
  const currentSpritePath = isIdle ? idleSpritePath : walkSpritePath;

  // For idle, we use the south-facing direction from the 4-direction static sprite
  // The static sprite has 4 directions (64x256): South, West, East, North (top to bottom typically)
  // or arranged as 4 columns (256x64): South, West, East, North
  // For our sprites, they are 4 directions x 64px = 256x64 (horizontal)
  // We want south (first frame) for idle
  const backgroundPositionX = isIdle ? 0 : -(currentFrame * frameWidth * scale);
  // For walking, use frameRow to select the east-facing row in multi-row sprites
  const backgroundPositionY = isIdle ? 0 : -(frameRow * frameHeight * scale);

  // Get ground offset for positioning adjustment
  const groundOffset = animal.groundOffset || 0;

  // Flip sprite horizontally when walking left
  const shouldFlip = !isIdle && direction === 'left';

  return (
    <div
      className="absolute"
      style={{
        bottom: `${8 + groundOffset}%`,
        left: `${currentPosition * 100}%`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        zIndex: 10,
        transform: `translateX(-50%) ${shouldFlip ? 'scaleX(-1)' : ''}`,
        willChange: 'transform, left',
      }}
    >
      <div
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          backgroundImage: `url(${currentSpritePath})`,
          backgroundSize: isIdle
            ? `${4 * scaledWidth}px ${scaledHeight}px`  // 4 directions for static sprite
            : `${frameCount * scaledWidth}px ${walkRows * scaledHeight}px`,  // Walk animation with rows
          backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          WebkitFontSmoothing: 'none',
        }}
      />
    </div>
  );
});

SpriteAnimal.displayName = 'SpriteAnimal';
