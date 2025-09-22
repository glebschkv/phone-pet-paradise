import { memo } from 'react';

export const RetroBackground = memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-sky" />
      
      {/* Animated Clouds */}
      <div className="absolute top-[10%] w-full h-32">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-drift-clouds"
            style={{
              animationDelay: `${i * 7}s`,
              top: `${i * 15}px`,
              left: `-100px`
            }}
          >
            <div className="pixel-cloud" />
          </div>
        ))}
      </div>
      
      {/* Distant Mountains */}
      <div className="absolute bottom-[30%] w-full h-32">
        <svg 
          viewBox="0 0 1200 120" 
          className="w-full h-full fill-muted/60"
          preserveAspectRatio="none"
        >
          <path d="M0,120 L0,80 L200,20 L400,60 L600,10 L800,40 L1000,30 L1200,50 L1200,120 Z" />
        </svg>
      </div>
      
      {/* Mid-ground Hills */}
      <div className="absolute bottom-[20%] w-full h-24">
        <svg 
          viewBox="0 0 1200 80" 
          className="w-full h-full fill-secondary/80"
          preserveAspectRatio="none"
        >
          <path d="M0,80 L0,60 L150,30 L350,50 L550,20 L750,45 L950,25 L1200,40 L1200,80 Z" />
        </svg>
      </div>
    </div>
  );
});

RetroBackground.displayName = 'RetroBackground';