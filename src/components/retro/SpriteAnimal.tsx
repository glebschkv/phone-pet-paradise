import { memo, useState, useEffect, useRef } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';
import { PositionRegistry } from './useAnimalPositions';
import { getRandomSpecialAnimation, hasSpecialAnimations, SpecialAnimationConfig } from '@/data/SpecialAnimations';

// Configuration for random special animations
const SPECIAL_ANIMATION_MIN_INTERVAL = 5000; // Minimum 5 seconds between special animations
const SPECIAL_ANIMATION_MAX_INTERVAL = 15000; // Maximum 15 seconds between special animations

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

  // State for special animations (only for triggering re-renders when sprite changes)
  const [activeSpecialAnimation, setActiveSpecialAnimation] = useState<SpecialAnimationConfig | null>(null);

  // Refs for animation state
  const frameTimeRef = useRef(0);
  const positionRef = useRef(position);
  const specialAnimationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const specialFrameCountRef = useRef(0);
  const isPlayingSpecialRef = useRef(false);
  // Ref to track special animation without causing effect restarts
  const activeSpecialAnimationRef = useRef<SpecialAnimationConfig | null>(null);

  const spriteConfig = animal.spriteConfig;

  // Get sprite config values (use defaults if no config)
  const spritePath = spriteConfig?.spritePath ?? '';
  const frameCount = spriteConfig?.frameCount ?? 1;
  const frameWidth = spriteConfig?.frameWidth ?? 32;
  const frameHeight = spriteConfig?.frameHeight ?? 32;
  const animationSpeed = spriteConfig?.animationSpeed ?? 10;
  const frameRow = spriteConfig?.frameRow ?? 0;
  const flipX = spriteConfig?.flipX ?? false;

  // Check if this animal has special animations available
  const canPlaySpecialAnimations = spriteConfig ? hasSpecialAnimations(spritePath) : false;

  // Current animation config (either special or base)
  const currentAnimConfig = isPlayingSpecialRef.current && activeSpecialAnimation
    ? {
        spritePath: activeSpecialAnimation.spritePath,
        frameCount: activeSpecialAnimation.frameCount,
        frameWidth: activeSpecialAnimation.frameWidth,
        frameHeight: activeSpecialAnimation.frameHeight,
        animationSpeed: activeSpecialAnimation.animationSpeed || animationSpeed
      }
    : { spritePath, frameCount, frameWidth, frameHeight, animationSpeed };

  // Calculate frame duration in milliseconds (animationSpeed is FPS)
  const frameDuration = 1000 / currentAnimConfig.animationSpeed;

  // Register and unregister position on mount/unmount
  useEffect(() => {
    positionRegistry.updatePosition(animalId, position);
    return () => {
      positionRegistry.removePosition(animalId);
    };
  }, [animalId, position, positionRegistry]);

  // Set up special animation timer
  useEffect(() => {
    if (!canPlaySpecialAnimations) return;

    const scheduleNextSpecialAnimation = () => {
      if (specialAnimationTimerRef.current) {
        clearTimeout(specialAnimationTimerRef.current);
      }

      const interval = Math.random() * (SPECIAL_ANIMATION_MAX_INTERVAL - SPECIAL_ANIMATION_MIN_INTERVAL) + SPECIAL_ANIMATION_MIN_INTERVAL;

      specialAnimationTimerRef.current = setTimeout(() => {
        // Only trigger if not already playing a special animation
        if (!isPlayingSpecialRef.current) {
          const specialAnim = getRandomSpecialAnimation(spritePath);
          if (specialAnim) {
            isPlayingSpecialRef.current = true;
            specialFrameCountRef.current = 0;
            activeSpecialAnimationRef.current = specialAnim;
            setActiveSpecialAnimation(specialAnim);
            setCurrentFrame(0);
          }
        }
        // Schedule the next one
        scheduleNextSpecialAnimation();
      }, interval);
    };

    // Start the scheduling
    scheduleNextSpecialAnimation();

    return () => {
      if (specialAnimationTimerRef.current) {
        clearTimeout(specialAnimationTimerRef.current);
      }
    };
  }, [canPlaySpecialAnimations, spritePath]);

  // Combined animation loop for both position and sprite frames
  useEffect(() => {
    if (!spriteConfig) return;

    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      // Clamp deltaTime to prevent large jumps after tab switches (max 100ms)
      const deltaTime = Math.min(currentTime - lastTime, 100);
      lastTime = currentTime;

      // Get the current config inside the loop using ref to avoid stale closure issues
      const specialAnim = activeSpecialAnimationRef.current;
      const loopAnimConfig = isPlayingSpecialRef.current && specialAnim
        ? {
            frameCount: specialAnim.frameCount,
            animationSpeed: specialAnim.animationSpeed || animationSpeed
          }
        : { frameCount, animationSpeed };

      const loopFrameDuration = 1000 / loopAnimConfig.animationSpeed;

      // Update sprite frame based on time
      frameTimeRef.current += deltaTime;
      if (frameTimeRef.current >= loopFrameDuration) {
        // Check if special animation has completed one full cycle BEFORE frame update
        if (isPlayingSpecialRef.current) {
          specialFrameCountRef.current++;
          if (specialFrameCountRef.current >= loopAnimConfig.frameCount) {
            // Special animation finished, update refs synchronously first
            isPlayingSpecialRef.current = false;
            specialFrameCountRef.current = 0;
            activeSpecialAnimationRef.current = null;
            // Then update state for re-render (won't restart the animation loop)
            setActiveSpecialAnimation(null);
            setCurrentFrame(0);
            frameTimeRef.current = 0;
            animationFrame = requestAnimationFrame(animate);
            return;
          }
        }

        setCurrentFrame(prev => (prev + 1) % loopAnimConfig.frameCount);
        frameTimeRef.current = 0;
      }

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

      let newPosition = positionRef.current + movement + separationOffset;

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
    // Note: activeSpecialAnimation removed from deps - we use activeSpecialAnimationRef to avoid animation loop restarts
  }, [spriteConfig, speed, animalId, positionRegistry, frameCount, animationSpeed]);

  // Early return AFTER all hooks
  if (!spriteConfig) return null;

  // Scale up the sprite for better visibility (2.5x for crisp pixels)
  const scale = 2.5;
  const scaledWidth = currentAnimConfig.frameWidth * scale;
  const scaledHeight = currentAnimConfig.frameHeight * scale;

  // Calculate pixel-perfect background position (supports multi-row sprites)
  const backgroundPositionX = -(currentFrame * currentAnimConfig.frameWidth * scale);
  const backgroundPositionY = -(frameRow * currentAnimConfig.frameHeight * scale);

  // Get ground offset for positioning adjustment (handles sprites with empty space)
  const groundOffset = animal.groundOffset || 0;

  return (
    <div
      className="absolute"
      style={{
        // Position the animal on the ground surface (at the top of the ground platform, above tab bar)
        // groundOffset adjusts for sprites with empty space (negative = lower position)
        bottom: `${8 + groundOffset}%`,
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
          backgroundImage: `url(${currentAnimConfig.spritePath})`,
          // Use exact pixel dimensions for the sprite sheet (auto height for multi-row support)
          backgroundSize: `${currentAnimConfig.frameCount * scaledWidth}px auto`,
          backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
          backgroundRepeat: 'no-repeat',
          // Critical for pixel art - no blurring
          imageRendering: 'pixelated',
          // Prevent any smoothing
          WebkitFontSmoothing: 'none',
          // Flip horizontally if sprite faces left
          transform: flipX ? 'scaleX(-1)' : undefined,
        }}
      />
    </div>
  );
});

SpriteAnimal.displayName = 'SpriteAnimal';
