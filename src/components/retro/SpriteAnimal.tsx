import { memo, useState, useEffect, useRef } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';
import { PositionRegistry } from './useAnimalPositions';

// Configuration for random idle pauses
const IDLE_MIN_INTERVAL = 8000;
const IDLE_MAX_INTERVAL = 15000;
const IDLE_DURATION_MIN = 2000;
const IDLE_DURATION_MAX = 4000;

// Movement boundaries
const LEFT_BOUNDARY = 0.08;
const RIGHT_BOUNDARY = 0.92;

// Collision settings
const COLLISION_DISTANCE = 0.06;
const COLLISION_CHANCE = 0.15;
const COLLISION_COOLDOWN = 3000;

interface SpriteAnimalProps {
  animal: AnimalData;
  animalId: string;
  position: number;
  speed: number;
  positionRegistry: PositionRegistry;
  groundLevel?: number; // Base ground level from background (default: 8)
}

export const SpriteAnimal = memo(({ animal, animalId, position, speed, positionRegistry, groundLevel = 8 }: SpriteAnimalProps) => {
  // All animation state managed via refs to avoid race conditions
  const positionRef = useRef(position);
  const directionRef = useRef<'left' | 'right'>(Math.random() > 0.5 ? 'right' : 'left');
  const isIdleRef = useRef(false);
  const frameRef = useRef(0);
  const frameTimeRef = useRef(0);
  const shouldResetFrameRef = useRef(false);

  // Collision cooldown tracking
  const collisionCooldownRef = useRef<Map<string, number>>(new Map());

  // Render state - only these trigger re-renders
  const [renderState, setRenderState] = useState({
    position: position,
    direction: directionRef.current,
    frame: 0,
    isIdle: false,
  });

  // Timer refs
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spriteConfig = animal.spriteConfig;

  // Get sprite config values - use || to catch empty strings too
  const walkSpritePath = spriteConfig?.spritePath || '';
  const idleSpritePath = spriteConfig?.idleSprite || walkSpritePath;
  const frameCount = spriteConfig?.frameCount || 6;
  const frameWidth = spriteConfig?.frameWidth || 64;
  const frameHeight = spriteConfig?.frameHeight || 64;
  const animationSpeed = spriteConfig?.animationSpeed || 8;
  const walkRows = spriteConfig?.walkRows || 1;
  const frameRow = spriteConfig?.frameRow ?? (walkRows === 2 ? 1 : walkRows === 4 ? 2 : 0);
  const facesLeft = spriteConfig?.facesLeft || false;

  // Register position on mount and sync when position prop changes
  useEffect(() => {
    positionRegistry.updatePosition(animalId, position);
    positionRef.current = position;
    return () => {
      positionRegistry.removePosition(animalId);
    };
  }, [animalId, positionRegistry, position]);

  // Idle timer system - only sets refs, animation loop handles state updates
  useEffect(() => {
    const scheduleNextIdle = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      const interval = Math.random() * (IDLE_MAX_INTERVAL - IDLE_MIN_INTERVAL) + IDLE_MIN_INTERVAL;

      idleTimerRef.current = setTimeout(() => {
        if (!isIdleRef.current) {
          // Enter idle
          isIdleRef.current = true;
          shouldResetFrameRef.current = true;

          const idleDuration = Math.random() * (IDLE_DURATION_MAX - IDLE_DURATION_MIN) + IDLE_DURATION_MIN;
          idleDurationTimerRef.current = setTimeout(() => {
            // Exit idle
            isIdleRef.current = false;
            shouldResetFrameRef.current = true;
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

  // Main animation loop - single source of truth for state updates
  useEffect(() => {
    if (!spriteConfig) return;

    let animationFrame: number;
    let lastTime = performance.now();
    let renderUpdateAccum = 0;
    const RENDER_UPDATE_INTERVAL = 16;

    const animate = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastTime, 100);
      lastTime = currentTime;

      // Handle frame reset request (from idle transitions)
      if (shouldResetFrameRef.current) {
        frameRef.current = 0;
        frameTimeRef.current = 0;
        shouldResetFrameRef.current = false;
      }

      // Update sprite frame
      const loopFrameDuration = 1000 / animationSpeed;
      frameTimeRef.current += deltaTime;

      if (frameTimeRef.current >= loopFrameDuration) {
        if (!isIdleRef.current) {
          // Only increment frames when walking
          frameRef.current = (frameRef.current + 1) % frameCount;
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

        // Clean up expired collision cooldowns
        const now = Date.now();
        collisionCooldownRef.current.forEach((expiry, id) => {
          if (now > expiry) {
            collisionCooldownRef.current.delete(id);
          }
        });

        // Check for nearby animals - but only sometimes collide
        const nearbyAnimals = positionRegistry.getAnimalsInRange(animalId, newPosition, COLLISION_DISTANCE);

        for (const nearby of nearbyAnimals) {
          if (collisionCooldownRef.current.has(nearby.id)) {
            continue;
          }

          if (Math.random() < COLLISION_CHANCE) {
            const isBlocking = (currentDir === 'right' && nearby.position > positionRef.current) ||
                              (currentDir === 'left' && nearby.position < positionRef.current);

            if (isBlocking) {
              directionRef.current = currentDir === 'right' ? 'left' : 'right';
              newPosition = positionRef.current;
              collisionCooldownRef.current.set(nearby.id, now + COLLISION_COOLDOWN);
              break;
            }
          } else {
            collisionCooldownRef.current.set(nearby.id, now + 500);
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

      // Update render state periodically - all in one setState to avoid partial updates
      renderUpdateAccum += deltaTime;
      if (renderUpdateAccum >= RENDER_UPDATE_INTERVAL) {
        setRenderState({
          position: positionRef.current,
          direction: directionRef.current,
          frame: frameRef.current,
          isIdle: isIdleRef.current,
        });
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

  if (!spriteConfig || !walkSpritePath) return null;

  // Scale up the sprite
  const scale = 2.5;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;

  // Use render state for all display calculations
  const { position: renderPosition, direction: renderDirection, frame: currentFrame, isIdle } = renderState;

  // Determine which sprite to use
  const currentSpritePath = isIdle ? idleSpritePath : walkSpritePath;
  const hasSeperateIdleSprite = spriteConfig?.idleSprite && spriteConfig.idleSprite !== walkSpritePath;

  // Calculate background position - ensure frame is valid
  const safeFrame = isIdle ? 0 : Math.min(currentFrame, frameCount - 1);
  const backgroundPositionX = -(safeFrame * frameWidth * scale);
  // When idle without separate idle sprite, use row 0 (front-facing); otherwise use frameRow for walking
  const backgroundPositionY = isIdle ? 0 : -(frameRow * frameHeight * scale);

  // Calculate background size
  // If idle with separate idle sprite, assume 4 frames; otherwise use walk sprite's frameCount
  const bgWidth = (isIdle && hasSeperateIdleSprite) ? 4 * scaledWidth : frameCount * scaledWidth;
  const bgHeight = (isIdle && hasSeperateIdleSprite) ? scaledHeight : walkRows * scaledHeight;

  // Ground offset (per-animal adjustment on top of biome ground level)
  const manualGroundOffset = animal.groundOffset || 0;

  // Auto-adjust for legacy sprites (non-64px frames)
  // Standard chibi sprites are 64px - legacy sprites need adjustment based on their size
  const STANDARD_FRAME_SIZE = 64;
  const legacyGroundAdjustment = frameHeight !== STANDARD_FRAME_SIZE
    ? -((frameHeight - STANDARD_FRAME_SIZE) / STANDARD_FRAME_SIZE) * 4  // Lower larger sprites, raise smaller ones
    : 0;

  const totalGroundOffset = manualGroundOffset + legacyGroundAdjustment;

  // Flip sprite when walking opposite to its natural facing direction
  // If sprite faces left naturally, flip when walking right; otherwise flip when walking left
  const shouldFlip = !isIdle && (facesLeft ? renderDirection === 'right' : renderDirection === 'left');

  return (
    <div
      className="absolute"
      style={{
        bottom: `${groundLevel + totalGroundOffset}%`,
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
          backgroundSize: `${bgWidth}px ${bgHeight}px`,
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
