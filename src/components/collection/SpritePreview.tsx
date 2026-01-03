import { useRef, memo, useMemo } from "react";
import { AnimalData } from "@/data/AnimalDatabase";
import { useVisibleSpriteAnimation } from "@/hooks/useSpriteAnimation";

interface SpritePreviewProps {
  animal: AnimalData;
  scale?: number;
}

/**
 * SpritePreview Component
 *
 * Renders an animated sprite using the centralized animation manager.
 * Uses IntersectionObserver to only animate when visible on screen.
 *
 * Performance optimizations:
 * - Uses centralized RAF loop instead of per-component RAF
 * - Only animates when visible (IntersectionObserver)
 * - Memoized style object to prevent re-renders
 * - React.memo to prevent unnecessary re-renders from parent
 */
export const SpritePreview = memo(({ animal, scale = 4 }: SpritePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spriteConfig = animal.spriteConfig;

  // Use the centralized animation system with visibility detection
  const { currentFrame } = useVisibleSpriteAnimation({
    id: `sprite-${animal.id}`,
    frameCount: spriteConfig?.frameCount ?? 1,
    animationSpeed: spriteConfig?.animationSpeed ?? 10,
    containerRef,
  });

  // Memoize style calculations to prevent object recreation
  const spriteStyle = useMemo(() => {
    if (!spriteConfig) return null;

    const { spritePath, frameCount, frameWidth, frameHeight, frameRow = 0 } = spriteConfig;
    const scaledWidth = frameWidth * scale;
    const scaledHeight = frameHeight * scale;
    const backgroundPositionX = -(currentFrame * frameWidth * scale);
    const backgroundPositionY = -(frameRow * frameHeight * scale);

    return {
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      backgroundImage: `url(${spritePath})`,
      backgroundSize: `${frameCount * scaledWidth}px auto`,
      backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
      backgroundRepeat: 'no-repeat' as const,
      imageRendering: 'pixelated' as const,
      // iOS performance hints
      willChange: 'background-position' as const,
      transform: 'translateZ(0)', // Force GPU layer
    };
  }, [spriteConfig, scale, currentFrame]);

  if (!spriteConfig || !spriteStyle) return null;

  return (
    <div
      ref={containerRef}
      className="mx-auto"
      style={spriteStyle}
      data-sprite-id={animal.id}
    />
  );
});

SpritePreview.displayName = 'SpritePreview';
