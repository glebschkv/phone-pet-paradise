/**
 * useSpriteAnimation Hook
 *
 * React hook for sprite animations using the centralized animation manager.
 * This ensures all sprites share a single RAF loop for optimal performance.
 *
 * Usage:
 * ```tsx
 * const { currentFrame, isAnimating } = useSpriteAnimation({
 *   id: `sprite-${pet.id}`,
 *   frameCount: 4,
 *   animationSpeed: 10,
 *   enabled: isVisible
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getSpriteAnimationManager, createSpriteState } from '@/lib/spriteAnimationManager';

interface UseSpriteAnimationOptions {
  /** Unique ID for this animation (required) */
  id: string;
  /** Total number of frames in the sprite sheet */
  frameCount: number;
  /** Animation speed in frames per second (default: 10) */
  animationSpeed?: number;
  /** Whether the animation is enabled (default: true) */
  enabled?: boolean;
  /** Initial frame to start from (default: 0) */
  initialFrame?: number;
}

interface UseSpriteAnimationResult {
  /** Current frame index (0 to frameCount-1) */
  currentFrame: number;
  /** Whether the animation is currently running */
  isAnimating: boolean;
  /** Manually reset to initial frame */
  reset: () => void;
  /** Pause the animation */
  pause: () => void;
  /** Resume the animation */
  resume: () => void;
}

export function useSpriteAnimation({
  id,
  frameCount,
  animationSpeed = 10,
  enabled = true,
  initialFrame = 0,
}: UseSpriteAnimationOptions): UseSpriteAnimationResult {
  const [currentFrame, setCurrentFrame] = useState(initialFrame);
  const [isAnimating, setIsAnimating] = useState(enabled);

  // Create stable sprite state that persists across renders
  const spriteStateRef = useRef<ReturnType<typeof createSpriteState> | null>(null);

  // Initialize sprite state
  if (!spriteStateRef.current) {
    spriteStateRef.current = createSpriteState(frameCount, animationSpeed);
  }

  // Track if animation is paused by user
  const isPausedByUserRef = useRef(false);

  // Stable callback for animation frame
  const animationCallback = useCallback(
    (deltaTime: number) => {
      if (!spriteStateRef.current) return;

      const newFrame = spriteStateRef.current.update(deltaTime);
      setCurrentFrame(newFrame);
    },
    []
  );

  // Register/unregister with animation manager
  useEffect(() => {
    const manager = getSpriteAnimationManager();

    if (enabled && !isPausedByUserRef.current) {
      manager.register(id, animationCallback);
      setIsAnimating(true);
    } else {
      manager.unregister(id);
      setIsAnimating(false);
    }

    // Cleanup on unmount
    return () => {
      manager.unregister(id);
    };
  }, [id, enabled, animationCallback]);

  // Reset when frameCount or animationSpeed changes
  useEffect(() => {
    spriteStateRef.current = createSpriteState(frameCount, animationSpeed);
    setCurrentFrame(initialFrame);
  }, [frameCount, animationSpeed, initialFrame]);

  // Manual controls
  const reset = useCallback(() => {
    if (spriteStateRef.current) {
      spriteStateRef.current.reset();
      setCurrentFrame(initialFrame);
    }
  }, [initialFrame]);

  const pause = useCallback(() => {
    isPausedByUserRef.current = true;
    const manager = getSpriteAnimationManager();
    manager.unregister(id);
    setIsAnimating(false);
  }, [id]);

  const resume = useCallback(() => {
    isPausedByUserRef.current = false;
    if (enabled) {
      const manager = getSpriteAnimationManager();
      manager.register(id, animationCallback);
      setIsAnimating(true);
    }
  }, [id, enabled, animationCallback]);

  return {
    currentFrame,
    isAnimating,
    reset,
    pause,
    resume,
  };
}

// ============================================================================
// VISIBILITY-AWARE SPRITE ANIMATION
// ============================================================================

interface UseVisibleSpriteAnimationOptions extends Omit<UseSpriteAnimationOptions, 'enabled'> {
  /** Ref to the sprite container element */
  containerRef: React.RefObject<HTMLElement>;
}

/**
 * Sprite animation hook that automatically pauses when not visible
 * Uses IntersectionObserver for efficient visibility detection
 */
export function useVisibleSpriteAnimation({
  id,
  frameCount,
  animationSpeed = 10,
  initialFrame = 0,
  containerRef,
}: UseVisibleSpriteAnimationOptions): UseSpriteAnimationResult {
  const [isVisible, setIsVisible] = useState(false);

  // Set up intersection observer
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        root: null,
        rootMargin: '50px', // Start animating slightly before visible
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [containerRef]);

  // Use the base hook with visibility-based enabling
  return useSpriteAnimation({
    id,
    frameCount,
    animationSpeed,
    enabled: isVisible,
    initialFrame,
  });
}

// ============================================================================
// BATCH SPRITE STATE (for grid rendering)
// ============================================================================

interface BatchSpriteState {
  frames: Map<string, number>;
  frameTime: number;
}

/**
 * Hook for managing multiple sprite animations with the same timing
 * Useful for grids where all sprites should be in sync
 */
export function useBatchSpriteAnimation({
  spriteIds,
  frameCount,
  animationSpeed = 10,
  enabled = true,
}: {
  spriteIds: string[];
  frameCount: number;
  animationSpeed?: number;
  enabled?: boolean;
}): {
  getFrame: (id: string) => number;
  isAnimating: boolean;
} {
  const [batchState, setBatchState] = useState<BatchSpriteState>({
    frames: new Map(),
    frameTime: 0,
  });

  const frameDuration = useMemo(() => 1000 / animationSpeed, [animationSpeed]);

  // Single animation callback for all sprites
  const animationCallback = useCallback(
    (deltaTime: number) => {
      setBatchState((prev) => {
        const newFrameTime = prev.frameTime + deltaTime;

        if (newFrameTime >= frameDuration) {
          // Update all frames at once
          const newFrames = new Map(prev.frames);
          spriteIds.forEach((id) => {
            const currentFrame = prev.frames.get(id) ?? 0;
            newFrames.set(id, (currentFrame + 1) % frameCount);
          });

          return {
            frames: newFrames,
            frameTime: 0,
          };
        }

        return {
          ...prev,
          frameTime: newFrameTime,
        };
      });
    },
    [spriteIds, frameCount, frameDuration]
  );

  // Register single animation for all sprites
  useEffect(() => {
    const manager = getSpriteAnimationManager();
    const batchId = `batch-${spriteIds.join('-').slice(0, 50)}`;

    if (enabled && spriteIds.length > 0) {
      manager.register(batchId, animationCallback, 1); // Higher priority
    }

    return () => {
      manager.unregister(batchId);
    };
  }, [enabled, spriteIds, animationCallback]);

  // Initialize frames for new sprites
  useEffect(() => {
    setBatchState((prev) => {
      const newFrames = new Map(prev.frames);
      spriteIds.forEach((id) => {
        if (!newFrames.has(id)) {
          newFrames.set(id, 0);
        }
      });
      return { ...prev, frames: newFrames };
    });
  }, [spriteIds]);

  const getFrame = useCallback(
    (id: string): number => {
      return batchState.frames.get(id) ?? 0;
    },
    [batchState.frames]
  );

  return {
    getFrame,
    isAnimating: enabled && spriteIds.length > 0,
  };
}
