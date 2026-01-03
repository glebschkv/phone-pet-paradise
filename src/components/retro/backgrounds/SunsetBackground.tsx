import { memo } from 'react';
import { getBiomeByName } from '@/data/AnimalDatabase';
import { ImageBackground } from './ImageBackground';

/**
 * Sunset Background (Windmill)
 */
export const SunsetHomeBackground = memo(() => {
  const biome = getBiomeByName('Sunset');

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(280 40% 45%) 0%, hsl(350 55% 55%) 25%, hsl(25 75% 60%) 50%, hsl(40 85% 70%) 100%)"
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(280 40% 45%) 0%, hsl(350 55% 55%) 25%, hsl(25 75% 60%) 50%, hsl(40 85% 70%) 100%)'
        }}
      />
      <div
        className="absolute top-[20%] right-[20%] w-28 h-28 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(40 100% 75%) 0%, hsl(30 90% 65%) 40%, transparent 70%)'
        }}
      />
      <div
        className="absolute top-[18%] right-[18%] w-40 h-40 rounded-full opacity-50"
        style={{
          background: 'radial-gradient(circle, hsl(35 100% 80%) 0%, transparent 70%)'
        }}
      />
      <div className="absolute top-[10%] left-[8%] w-24 h-8 rounded-full bg-orange-300/50 blur-sm" />
      <div className="absolute top-[15%] left-[30%] w-20 h-6 rounded-full bg-pink-300/40 blur-sm" />
      <div className="absolute top-[8%] left-[55%] w-28 h-9 rounded-full bg-purple-300/35 blur-sm" />
      <div className="absolute top-[18%] right-[25%] w-16 h-5 rounded-full bg-orange-200/30 blur-sm" />
      <div className="absolute bottom-[28%] w-full h-40">
        <svg viewBox="0 0 1200 160" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sunsetMountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(280 35% 35%)" />
              <stop offset="100%" stopColor="hsl(280 40% 25%)" />
            </linearGradient>
          </defs>
          <path d="M0,160 L0,100 L100,60 L250,90 L400,40 L550,70 L700,30 L850,60 L1000,45 L1100,70 L1200,55 L1200,160 Z" fill="url(#sunsetMountainGradient)" />
        </svg>
      </div>
      <div className="absolute bottom-[18%] w-full h-32">
        <svg viewBox="0 0 1200 130" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sunsetHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(140 30% 35%)" />
              <stop offset="100%" stopColor="hsl(140 35% 25%)" />
            </linearGradient>
          </defs>
          <path d="M0,130 L0,80 L80,50 L200,70 L350,35 L500,60 L650,30 L800,55 L950,40 L1100,60 L1200,50 L1200,130 Z" fill="url(#sunsetHillGradient)" />
        </svg>
      </div>
    </div>
  );
});
SunsetHomeBackground.displayName = 'SunsetHomeBackground';
