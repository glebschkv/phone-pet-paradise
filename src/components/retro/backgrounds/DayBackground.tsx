import { memo } from 'react';
import { getBiomeByName } from '@/data/AnimalDatabase';
import { ImageBackground } from './ImageBackground';

/**
 * Day Background (Meadow - Grassy Path)
 */
export const DayHomeBackground = memo(() => {
  const biome = getBiomeByName('Meadow');

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(200 70% 80%) 0%, hsl(200 50% 88%) 40%, hsl(35 60% 90%) 100%)"
      />
    );
  }

  // Fallback CSS background
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(200 70% 80%) 0%, hsl(200 50% 88%) 40%, hsl(35 60% 90%) 100%)'
        }}
      />
      <div
        className="absolute top-[15%] right-[15%] w-24 h-24 rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, hsl(45 100% 85%) 0%, transparent 70%)'
        }}
      />
      <div className="absolute top-[12%] left-[10%] w-20 h-8 rounded-full bg-white/40 blur-sm" />
      <div className="absolute top-[8%] left-[25%] w-16 h-6 rounded-full bg-white/30 blur-sm" />
      <div className="absolute top-[18%] left-[60%] w-24 h-8 rounded-full bg-white/35 blur-sm" />
      <div className="absolute top-[10%] right-[20%] w-14 h-5 rounded-full bg-white/25 blur-sm" />
      <div className="absolute bottom-[28%] w-full h-40">
        <svg viewBox="0 0 1200 160" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dayMountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(250 30% 75%)" />
              <stop offset="100%" stopColor="hsl(250 25% 80%)" />
            </linearGradient>
          </defs>
          <path d="M0,160 L0,100 L100,60 L250,90 L400,40 L550,70 L700,30 L850,60 L1000,45 L1100,70 L1200,55 L1200,160 Z" fill="url(#dayMountainGradient)" />
        </svg>
      </div>
      <div className="absolute bottom-[18%] w-full h-32">
        <svg viewBox="0 0 1200 130" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dayHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(140 35% 65%)" />
              <stop offset="100%" stopColor="hsl(140 40% 55%)" />
            </linearGradient>
          </defs>
          <path d="M0,130 L0,80 L80,50 L200,70 L350,35 L500,60 L650,30 L800,55 L950,40 L1100,60 L1200,50 L1200,130 Z" fill="url(#dayHillGradient)" />
        </svg>
      </div>
    </div>
  );
});
DayHomeBackground.displayName = 'DayHomeBackground';
