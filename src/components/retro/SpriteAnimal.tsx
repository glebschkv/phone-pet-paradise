import { memo, useState, useEffect, useRef } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';
import { PositionRegistry } from './useAnimalPositions';

// Configuration for random idle pauses
const IDLE_MIN_INTERVAL = 8000;  // Minimum 8 seconds between idle pauses
const IDLE_MAX_INTERVAL = 15000; // Maximum 15 seconds between idle pauses
const IDLE_DURATION_MIN = 2000;  // Minimum idle duration
const IDLE_DURATION_MAX = 4000;  // Maximum idle duration

// Movement boundaries
const LEFT_BOUNDARY = 0.08;
const RIGHT_BOUNDARY = 0.92;

interface SpriteAnimalProps {
  animal: AnimalData;
  animalId: string;
  position: number;
  speed: number;
  positionRegistry: PositionRegistry;
}

export const SpriteAnimal = memo(({ animal, animalId, position, speed, positionRegistry }: SpriteAnimalProps) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isIdle, setIsIdle] = useState(false);

  // Use refs for values that change frequently in animation loop
  const positionRef = useRef(position);
  const directionRef = useRef<'left' | 'right'>(Math.random() > 0.5 ? 'right' : 'left');
  const isIdleRef = useRef(false);
  const frameTimeRef = useRef(0);

  // State for rendering (updated less frequently)
  const [renderPosition, setRenderPosition] = useState(position);
  const [renderDirection, setRenderDirection] = useState(directionRef.current);

  // Timer refs
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
  const walkRows = spriteConfig?.walkRows ?? 1;
  const frameRow = spriteConfig?.frameRow ?? (walkRows === 2 ? 1 : walkRows === 4 ? 2 : 0);

  // Register position on mount
  useEffect(() => {
    positionRegistry.updatePosition(animalId, position);
    return () => {
      positionRegistry.removePosition(animalId);
    };
  }, [animalId, positionRegistry]);

  // Idle timer system
  useEffect(() => {
    const scheduleNextIdle = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      const interval = Math.random() * (IDLE_MAX_INTERVAL - IDLE_MIN_INTERVAL) + IDLE_MIN_INTERVAL;

      idleTimerRef.current = setTimeout(() => {
        if (!isIdleRef.current) {
          isIdleRef.current = true;
          setIsIdle(true);
          setCurrentFrame(0);

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

    scheduleNextIdle();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (idleDurationTimerRef.current) clearTimeout(idleDurationTimerRef.current);
    };
  }, []);

  // Main animation loop
  useEffect(() => {
    if (!spriteConfig) return;

    let animationFrame: number;
    let lastTime = performance.now();
    let renderUpdateAccum = 0;
    const RENDER_UPDATE_INTERVAL = 16; // ~60fps for render state updates

    const animate = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastTime, 100);
      lastTime = currentTime;

      // Update sprite frame
      const loopFrameDuration = 1000 / animationSpeed;
      frameTimeRef.current += deltaTime;

      if (frameTimeRef.current >= loopFrameDuration) {
        if (!isIdleRef.current) {
          setCurrentFrame(prev => (prev + 1) % frameCount);
        }
        frameTimeRef.current = 0;
      }

      // Update position only when not idle
      if (!isIdleRef.current) {
        const pixelsPerSecond = speed;
        const movement = (pixelsPerSecond * deltaTime / 1000) / window.innerWidth;

        let newPosition = positionRef.current;
        const currentDir = directionRef.current;

        // Apply movement
        if (currentDir === 'right') {
          newPosition += movement;
        } else {
          newPosition -= movement;
        }

        // Check for nearby animals and adjust
        const nearbyAnimal = positionRegistry.getNearestAnimal(animalId, newPosition);
        if (nearbyAnimal) {
          const distance = Math.abs(nearbyAnimal.position - newPosition);
          const minDistance = 0.08;

          if (distance < minDistance) {
            // Too close - either stop or reverse direction
            if (currentDir === 'right' && nearbyAnimal.position > newPosition) {
              // Animal ahead to the right, turn around
              directionRef.current = 'left';
              newPosition = positionRef.current - movement;
            } else if (currentDir === 'left' && nearbyAnimal.position < newPosition) {
              // Animal ahead to the left, turn around
              directionRef.current = 'right';
              newPosition = positionRef.current + movement;
            }
          }
        }

        // Boundary checks
        if (newPosition >= RIGHT_BOUNDARY) {
          newPosition = RIGHT_BOUNDARY;
          directionRef.current = 'left';
        } else if (newPosition <= LEFT_BOUNDARY) {
          newPosition = LEFT_BOUNDARY;
          directionRef.current = 'right';
        }

        positionRef.current = newPosition;
        positionRegistry.updatePosition(animalId, newPosition);
      }

      // Update render state periodically (not every frame)
      renderUpdateAccum += deltaTime;
      if (renderUpdateAccum >= RENDER_UPDATE_INTERVAL) {
        setRenderPosition(positionRef.current);
        setRenderDirection(directionRef.current);
        renderUpdateAccum = 0;
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

  if (!spriteConfig) return null;

  // Scale up the sprite
  const scale = 2.5;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;

  // Determine which sprite to use
  const currentSpritePath = isIdle ? idleSpritePath : walkSpritePath;

  // Calculate background position
  const backgroundPositionX = isIdle ? 0 : -(currentFrame * frameWidth * scale);
  const backgroundPositionY = isIdle ? 0 : -(frameRow * frameHeight * scale);

  // Ground offset
  const groundOffset = animal.groundOffset || 0;

  // Flip sprite when walking left (east sprites face right by default)
  const shouldFlip = !isIdle && renderDirection === 'left';

  return (
    <div
      className="absolute"
      style={{
        bottom: `${8 + groundOffset}%`,
        left: `${renderPosition * 100}%`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        zIndex: 10,
        transform: `translateX(-50%)`,
        willChange: 'left',
      }}
    >
      <div
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          backgroundImage: `url(${currentSpritePath})`,
          backgroundSize: isIdle
            ? `${4 * scaledWidth}px ${scaledHeight}px`
            : `${frameCount * scaledWidth}px ${walkRows * scaledHeight}px`,
          backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          transform: shouldFlip ? 'scaleX(-1)' : 'none',
        }}
      />
    </div>
  );
});

SpriteAnimal.displayName = 'SpriteAnimal';
