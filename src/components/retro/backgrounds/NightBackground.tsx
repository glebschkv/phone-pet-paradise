import { memo } from 'react';
import { getBiomeByName } from '@/data/AnimalDatabase';
import { ImageBackground } from './ImageBackground';

// Star positions for reuse
const STARS = [
  { top: '5%', left: '8%', size: 2 },
  { top: '10%', left: '22%', size: 1.5 },
  { top: '7%', left: '38%', size: 2.5 },
  { top: '15%', left: '52%', size: 1 },
  { top: '8%', left: '75%', size: 2 },
  { top: '20%', left: '88%', size: 1.5 },
];

const STARS_EXTENDED = [
  ...STARS,
  { top: '25%', left: '12%', size: 1 },
  { top: '22%', left: '32%', size: 2 },
  { top: '18%', left: '58%', size: 1.5 },
  { top: '28%', left: '78%', size: 1 },
  { top: '12%', left: '5%', size: 1 },
  { top: '30%', left: '92%', size: 2 },
  { top: '35%', left: '15%', size: 1.5 },
  { top: '32%', left: '45%', size: 1 },
];

/**
 * Night Background (Purple Nightsky)
 */
export const NightHomeBackground = memo(() => {
  const biome = getBiomeByName('Night');

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(230 50% 10%) 0%, hsl(235 45% 15%) 40%, hsl(245 35% 22%) 100%)"
      >
        {/* Stars overlay on top of image */}
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              boxShadow: `0 0 ${star.size * 2}px hsl(0 0% 100% / 0.8)`,
              animation: `twinkle ${2 + i * 0.3}s ease-in-out infinite`
            }}
          />
        ))}
      </ImageBackground>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(230 50% 10%) 0%, hsl(235 45% 15%) 40%, hsl(245 35% 22%) 100%)'
        }}
      />
      <div
        className="absolute top-[12%] right-[18%] w-16 h-16 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, hsl(45 20% 95%) 0%, hsl(45 15% 85%) 50%, hsl(45 10% 75%) 100%)',
          boxShadow: '0 0 40px hsl(45 30% 80% / 0.4), 0 0 80px hsl(45 30% 80% / 0.2)'
        }}
      />
      {STARS_EXTENDED.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            boxShadow: `0 0 ${star.size * 2}px hsl(0 0% 100% / 0.8)`,
            animation: `twinkle ${2 + i * 0.3}s ease-in-out infinite`
          }}
        />
      ))}
      <div className="absolute bottom-[28%] w-full h-40">
        <svg viewBox="0 0 1200 160" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="nightMountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(240 30% 18%)" />
              <stop offset="100%" stopColor="hsl(240 35% 12%)" />
            </linearGradient>
          </defs>
          <path d="M0,160 L0,100 L100,60 L250,90 L400,40 L550,70 L700,30 L850,60 L1000,45 L1100,70 L1200,55 L1200,160 Z" fill="url(#nightMountainGradient)" />
        </svg>
      </div>
      <div className="absolute bottom-[18%] w-full h-32">
        <svg viewBox="0 0 1200 130" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="nightHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(180 25% 15%)" />
              <stop offset="100%" stopColor="hsl(180 30% 10%)" />
            </linearGradient>
          </defs>
          <path d="M0,130 L0,80 L80,50 L200,70 L350,35 L500,60 L650,30 L800,55 L950,40 L1100,60 L1200,50 L1200,130 Z" fill="url(#nightHillGradient)" />
        </svg>
      </div>
    </div>
  );
});
NightHomeBackground.displayName = 'NightHomeBackground';
