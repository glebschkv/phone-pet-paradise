import { memo } from 'react';

export const PixelPlatform = memo(() => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[40%]">
      {/* Main Platform */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-platform">
        {/* Platform Surface */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-success border-t-2 border-success/80">
          {/* Grass Texture */}
          <div className="w-full h-full opacity-60">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 w-1 h-2 bg-success/40"
                style={{
                  left: `${i * 2}%`,
                  height: `${Math.random() * 8 + 4}px`,
                  transform: `rotate(${Math.random() * 20 - 10}deg)`
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Platform Depth */}
        <div className="absolute top-4 left-0 right-0 bottom-0 bg-secondary/80">
          {/* Dirt Layers */}
          <div className="w-full h-full opacity-40">
            {[...Array(3)].map((_, layerIndex) => (
              <div 
                key={layerIndex}
                className="absolute left-0 right-0 h-1 bg-muted/60"
                style={{ top: `${(layerIndex + 1) * 20}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-[60%] left-0 right-0 h-8">
        {/* Random flowers/mushrooms */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{ left: `${i * 12 + Math.random() * 8}%` }}
          >
            {Math.random() > 0.5 ? (
              /* Flower */
              <div className="relative">
                <div className="w-2 h-4 bg-success/60" />
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-accent rounded-full" />
              </div>
            ) : (
              /* Mushroom */
              <div className="relative">
                <div className="w-1 h-3 bg-muted mx-auto" />
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-destructive rounded-t-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

PixelPlatform.displayName = 'PixelPlatform';