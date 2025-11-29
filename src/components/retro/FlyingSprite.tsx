import { memo, useState, useEffect, useRef, useCallback } from 'react';
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

  // State for special animations
  const [activeSpecialAnimation, setActiveSpecialAnimation] = useState<SpecialAnimationConfig | null>(null);
  const [isPlayingSpecial, setIsPlayingSpecial] = useState(false);

  const frameTimeRef = useRef(0);
  const positionRef = useRef(startPosition);
  const specialAnimationTimerRef = useRef<number | null>(null);
  const specialFrameCountRef = useRef(0);

  const spriteConfig = animal.spriteConfig;
  if (!spriteConfig) return null;

  const { spritePath, frameCount, frameWidth, frameHeight, animationSpeed = 10, frameRow = 0 } = spriteConfig;

  // Check if this animal has special animations available
  const canPlaySpecialAnimations = hasSpecialAnimations(spritePath);

  // Get a random interval for the next special animation
  const getRandomInterval = useCallback(() => {
    return Math.random() * (SPECIAL_ANIMATION_MAX_INTERVAL - SPECIAL_ANIMATION_MIN_INTERVAL) + SPECIAL_ANIMATION_MIN_INTERVAL;
  }, []);

  // Trigger a random special animation
  const triggerSpecialAnimation = useCallback(() => {
    if (!canPlaySpecialAnimations || isPlayingSpecial) return;

    const specialAnim = getRandomSpecialAnimation(spritePath);
    if (specialAnim) {
      setActiveSpecialAnimation(specialAnim);
      setIsPlayingSpecial(true);
      setCurrentFrame(0);
      specialFrameCountRef.current = 0;
    }
  }, [canPlaySpecialAnimations, isPlayingSpecial, spritePath]);

  // Schedule the next special animation
  const scheduleNextSpecialAnimation = useCallback(() => {
    if (!canPlaySpecialAnimations) return;

    if (specialAnimationTimerRef.current) {
      clearTimeout(specialAnimationTimerRef.current);
    }

    const interval = getRandomInterval();
    specialAnimationTimerRef.current = window.setTimeout(() => {
      triggerSpecialAnimation();
    }, interval);
  }, [canPlaySpecialAnimations, getRandomInterval, triggerSpecialAnimation]);

  // Current animation config (either special or base)
  const currentAnimConfig = isPlayingSpecial && activeSpecialAnimation
    ? {
        spritePath: activeSpecialAnimation.spritePath,
        frameCount: activeSpecialAnimation.frameCount,
        frameWidth: activeSpecialAnimation.frameWidth,
        frameHeight: activeSpecialAnimation.frameHeight,
        animationSpeed: activeSpecialAnimation.animationSpeed || animationSpeed
      }
    : { spritePath, frameCount, frameWidth, frameHeight, animationSpeed };

  const frameDuration = 1000 / currentAnimConfig.animationSpeed;

  // Register and unregister position on mount/unmount
  useEffect(() => {
    positionRegistry.updatePosition(animalId, startPosition);
    return () => {
      positionRegistry.removePosition(animalId);
    };
  }, [animalId, positionRegistry]);

  // Set up special animation timer
  useEffect(() => {
    if (canPlaySpecialAnimations) {
      scheduleNextSpecialAnimation();
    }

    return () => {
      if (specialAnimationTimerRef.current) {
        clearTimeout(specialAnimationTimerRef.current);
      }
    };
  }, [canPlaySpecialAnimations, scheduleNextSpecialAnimation]);

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
        setCurrentFrame(prev => {
          const nextFrame = (prev + 1) % currentAnimConfig.frameCount;

          // Check if special animation has completed one full cycle
          if (isPlayingSpecial && activeSpecialAnimation) {
            specialFrameCountRef.current++;
            if (specialFrameCountRef.current >= currentAnimConfig.frameCount) {
              // Special animation finished, return to normal
              setIsPlayingSpecial(false);
              setActiveSpecialAnimation(null);
              specialFrameCountRef.current = 0;
              // Schedule the next special animation
              scheduleNextSpecialAnimation();
              return 0; // Reset to first frame of normal animation
            }
          }

          return nextFrame;
        });
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
  }, [speed, frameDuration, currentAnimConfig.frameCount, animalId, positionRegistry, isPlayingSpecial, activeSpecialAnimation, scheduleNextSpecialAnimation]);

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
        }}
      />
    </div>
  );
});

FlyingSprite.displayName = 'FlyingSprite';
