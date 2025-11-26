import { memo } from 'react';

export const PixelPlatform = memo(() => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[25%]">
      {/* Main grass platform */}
      <div className="absolute inset-0">
        {/* Grass surface with gradient */}
        <svg
          viewBox="0 0 1200 200"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Grass gradient */}
            <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(120 45% 50%)" />
              <stop offset="30%" stopColor="hsl(120 40% 45%)" />
              <stop offset="100%" stopColor="hsl(120 35% 35%)" />
            </linearGradient>
            {/* Dirt gradient */}
            <linearGradient id="dirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(30 40% 45%)" />
              <stop offset="100%" stopColor="hsl(25 35% 35%)" />
            </linearGradient>
          </defs>

          {/* Grass top with slight wave */}
          <path
            d="M0,20 Q100,10 200,18 Q300,25 400,15 Q500,8 600,20 Q700,28 800,15 Q900,10 1000,22 Q1100,30 1200,18 L1200,60 L0,60 Z"
            fill="url(#grassGradient)"
          />

          {/* Dirt/ground layer */}
          <rect x="0" y="55" width="1200" height="145" fill="url(#dirtGradient)" />

          {/* Grass highlight line */}
          <path
            d="M0,22 Q100,12 200,20 Q300,27 400,17 Q500,10 600,22 Q700,30 800,17 Q900,12 1000,24 Q1100,32 1200,20"
            fill="none"
            stroke="hsl(120 50% 60%)"
            strokeWidth="3"
          />
        </svg>
      </div>

      {/* Small decorative grass tufts */}
      <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none">
        {[15, 30, 45, 65, 80].map((pos, i) => (
          <div
            key={i}
            className="absolute bottom-0"
            style={{ left: `${pos}%` }}
          >
            <div
              className="w-1.5 rounded-t-full"
              style={{
                height: `${8 + (i % 3) * 4}px`,
                background: `hsl(120 ${45 + i * 5}% ${55 - i * 3}%)`
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

PixelPlatform.displayName = 'PixelPlatform';
