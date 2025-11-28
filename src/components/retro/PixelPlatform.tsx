import { memo, useState, useEffect } from "react";

// Ground image mapping for each theme
const GROUND_IMAGES: Record<string, string> = {
  day: "/assets/worlds/GRASSYPATH_GROUND.png",
  sunset: "/assets/worlds/WINDMILL_GROUND.png",
  night: "/assets/worlds/PURPLE_NIGHTSKY_GROUND.png",
  forest: "/assets/worlds/JUNGLE_ISLAND_GROUND.png",
  snow: "/assets/worlds/SKYPLATFORM_WORLD_GROUND.png",
};

interface PixelPlatformProps {
  theme?: string;
}

export const PixelPlatform = memo(({ theme = "day" }: PixelPlatformProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const groundImage = GROUND_IMAGES[theme] || GROUND_IMAGES.day;

  useEffect(() => {
    // Reset state when theme changes
    setImageLoaded(false);
    setImageError(false);

    // Preload the image
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageError(true);
    };
    img.src = groundImage;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [groundImage]);

  return (
    <div className="absolute bottom-[30%] left-0 right-0 h-[25%]">
      {/* Ground image background */}
      {!imageError && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${groundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
            opacity: imageLoaded ? 1 : 0,
          }}
        />
      )}

      {/* Fallback gradient (shown while loading or on error) */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: imageLoaded && !imageError ? 0 : 1,
        }}
      >
        <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(120 45% 50%)" />
              <stop offset="30%" stopColor="hsl(120 40% 45%)" />
              <stop offset="100%" stopColor="hsl(120 35% 35%)" />
            </linearGradient>
            <linearGradient id="dirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(30 40% 45%)" />
              <stop offset="100%" stopColor="hsl(25 35% 35%)" />
            </linearGradient>
          </defs>
          <path
            d="M0,20 Q100,10 200,18 Q300,25 400,15 Q500,8 600,20 Q700,28 800,15 Q900,10 1000,22 Q1100,30 1200,18 L1200,60 L0,60 Z"
            fill="url(#grassGradient)"
          />
          <rect x="0" y="55" width="1200" height="145" fill="url(#dirtGradient)" />
          <path
            d="M0,22 Q100,12 200,20 Q300,27 400,17 Q500,10 600,22 Q700,30 800,17 Q900,12 1000,24 Q1100,32 1200,20"
            fill="none"
            stroke="hsl(120 50% 60%)"
            strokeWidth="3"
          />
        </svg>
      </div>
    </div>
  );
});

PixelPlatform.displayName = "PixelPlatform";
