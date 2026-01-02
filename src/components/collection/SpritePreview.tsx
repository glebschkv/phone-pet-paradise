import { useState, useEffect, useRef, memo } from "react";
import { AnimalData } from "@/data/AnimalDatabase";

interface SpritePreviewProps {
  animal: AnimalData;
  scale?: number;
}

export const SpritePreview = memo(({ animal, scale = 4 }: SpritePreviewProps) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameTimeRef = useRef(0);
  const spriteConfig = animal.spriteConfig;

  useEffect(() => {
    if (!spriteConfig) return;

    const { frameCount, animationSpeed = 10 } = spriteConfig;
    const frameDuration = 1000 / animationSpeed;

    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      frameTimeRef.current += deltaTime;
      if (frameTimeRef.current >= frameDuration) {
        setCurrentFrame(prev => (prev + 1) % frameCount);
        frameTimeRef.current = 0;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [spriteConfig]);

  if (!spriteConfig) return null;

  const { spritePath, frameCount, frameWidth, frameHeight, frameRow = 0 } = spriteConfig;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;
  const backgroundPositionX = -(currentFrame * frameWidth * scale);
  const backgroundPositionY = -(frameRow * frameHeight * scale);

  return (
    <div
      className="mx-auto"
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
  );
});

SpritePreview.displayName = 'SpritePreview';
