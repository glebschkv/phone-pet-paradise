import { memo, useState, useEffect, useRef } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';
import { PositionRegistry } from './useAnimalPositions';
import { getRandomSpecialAnimation, hasSpecialAnimations, SpecialAnimationConfig } from '@/data/SpecialAnimations';

// Configuration for random special animations
const SPECIAL_ANIMATION_MIN_INTERVAL = 5000; // Minimum 5 seconds between special animations
const SPECIAL_ANIMATION_MAX_INTERVAL = 15000; // Maximum 15 seconds between special animations

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

  // State for special animations (only for triggering re-renders when sprite changes)
  const [activeSpecialAnimation, setActiveSpecialAnimation] = useState<SpecialAnimationConfig | null>(null);

  // Refs for animation state
  const frameTimeRef = useRef(0);
  const positionRef = useRef(startPosition);
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

  // Register and unregister position on mount/unmount
  useEffect(() => {
    positionRegistry.updatePosition(animalId, startPosition);
    return () => {
      positionRegistry.removePosition(animalId);
    };
  }, [animalId, startPosition, positionRegistry]);

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

  // Combined animation loop for position and sprite frames
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

      // Update sprite frame
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
    // Note: activeSpecialAnimation removed from deps - we use activeSpecialAnimationRef to avoid animation loop restarts
  }, [spriteConfig, speed, animalId, positionRegistry, frameCount, animationSpeed]);

  // Early return AFTER all hooks
  if (!spriteConfig) return null;

  // Scale for flying creatures (slightly smaller than ground animals)
  const scale = 2;
  const scaledWidth = currentAnimConfig.frameWidth * scale;
  const scaledHeight = currentAnimConfig.frameHeight * scale;
  const backgroundPositionX = -(currentFrame * currentAnimConfig.frameWidth * scale);
  const backgroundPositionY = -(frameRow * currentAnimConfig.frameHeight * scale);

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
          backgroundImage: `url(${currentAnimConfig.spritePath})`,
          backgroundSize: `${currentAnimConfig.frameCount * scaledWidth}px auto`,
          backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          // Flip sprite horizontally so it faces the direction of movement (right)
          transform: 'scaleX(-1)',
        }}
      />
    </div>
  );
});

FlyingSprite.displayName = 'FlyingSprite';
