import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimalData, getAnimalById } from "@/data/AnimalDatabase";

// Animated sprite preview component for shop
export const SpritePreview = ({ animal, scale = 4 }: { animal: AnimalData; scale?: number }) => {
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
};

// Background preview component for shop
export const BackgroundPreview = ({
  imagePath,
  size = 'medium',
  className = ''
}: {
  imagePath: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const sizeClasses = {
    small: 'w-12 h-8',
    medium: 'w-20 h-14',
    large: 'w-full h-24',
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border-2 border-white/20",
      sizeClasses[size],
      className
    )}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-200 to-blue-300 animate-pulse" />
      )}
      {error && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <span className="text-xl">🖼️</span>
        </div>
      )}
      <img
        src={imagePath}
        alt="Background preview"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        style={{ imageRendering: 'pixelated' }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};

// Bundle preview carousel component
export const BundlePreviewCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative w-full h-32 overflow-hidden rounded-xl">
      {images.map((img, idx) => (
        <div
          key={img}
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            idx === currentIndex ? "opacity-100" : "opacity-0"
          )}
        >
          <img
            src={img}
            alt={`Preview ${idx + 1}`}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      ))}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              idx === currentIndex ? "bg-white w-3" : "bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
};

// Pet bundle preview carousel - shows all pets in the bundle
export const PetBundlePreviewCarousel = ({ petIds }: { petIds: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const pets = petIds.map(id => getAnimalById(id)).filter(Boolean) as AnimalData[];

  useEffect(() => {
    if (pets.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % pets.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [pets.length]);

  if (pets.length === 0) return null;

  const currentPet = pets[currentIndex];
  const scale = currentPet?.spriteConfig
    ? Math.min(2.5, 80 / Math.max(currentPet.spriteConfig.frameWidth, currentPet.spriteConfig.frameHeight))
    : 1;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="flex-1 flex items-center justify-center min-h-0">
        {currentPet?.spriteConfig ? (
          <SpritePreview animal={currentPet} scale={scale} />
        ) : (
          <span className="text-4xl">{currentPet?.emoji}</span>
        )}
      </div>
      <div className="text-xs text-white/80 font-medium mb-1">{currentPet?.name}</div>
      <div className="flex gap-1">
        {pets.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              idx === currentIndex ? "bg-white w-3" : "bg-white/50"
            )}
          />
        ))}
      </div>
    </div>
  );
};
