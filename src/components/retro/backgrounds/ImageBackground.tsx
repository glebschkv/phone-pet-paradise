import { memo, useState, useEffect } from 'react';

interface ImageBackgroundProps {
  imagePath: string;
  fallbackGradient: string;
  children?: React.ReactNode;
}

/**
 * Reusable Image Background Component with proper loading/error handling.
 * Shows a gradient fallback while loading, then transitions to the image.
 */
export const ImageBackground = memo(({ imagePath, fallbackGradient, children }: ImageBackgroundProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Reset state when imagePath changes
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
    img.src = imagePath;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imagePath]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Fallback gradient - shown while loading or on error */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: fallbackGradient,
          opacity: imageLoaded && !imageError ? 0 : 1
        }}
      />
      {/* Background Image - only visible when loaded successfully */}
      {!imageError && (
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${imagePath})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
            opacity: imageLoaded ? 1 : 0
          }}
        />
      )}
      {children}
    </div>
  );
});
ImageBackground.displayName = 'ImageBackground';

/**
 * Custom Image Background for premium/shop backgrounds.
 */
export const CustomImageBackground = memo(({ imagePath }: { imagePath: string }) => {
  return (
    <ImageBackground
      imagePath={imagePath}
      fallbackGradient="linear-gradient(180deg, hsl(200 70% 80%) 0%, hsl(200 50% 88%) 40%, hsl(35 60% 90%) 100%)"
    />
  );
});
CustomImageBackground.displayName = 'CustomImageBackground';
