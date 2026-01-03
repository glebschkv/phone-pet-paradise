import { memo } from 'react';
import { getBiomeByName } from '@/data/AnimalDatabase';
import { ImageBackground } from './ImageBackground';

// Snowflake positions for animation
const SNOWFLAKES = [
  { top: '5%', left: '8%', size: 3, delay: 0 },
  { top: '10%', left: '22%', size: 2, delay: 1.5 },
  { top: '3%', left: '38%', size: 4, delay: 0.8 },
  { top: '8%', left: '52%', size: 2.5, delay: 2.2 },
  { top: '12%', left: '68%', size: 3, delay: 0.3 },
  { top: '6%', left: '82%', size: 2, delay: 1.8 },
  { top: '15%', left: '15%', size: 3.5, delay: 2.5 },
  { top: '18%', left: '45%', size: 2, delay: 0.5 },
  { top: '20%', left: '75%', size: 3, delay: 1.2 },
  { top: '22%', left: '90%', size: 2.5, delay: 2.8 },
];

const SNOWFLAKES_EXTENDED = [
  ...SNOWFLAKES,
  { top: '25%', left: '5%', size: 2, delay: 1.0 },
  { top: '28%', left: '30%', size: 3, delay: 2.0 },
  { top: '30%', left: '60%', size: 2.5, delay: 0.7 },
  { top: '32%', left: '85%', size: 2, delay: 1.6 },
];

/**
 * Snow Background (Sky Platform World)
 */
export const SnowHomeBackground = memo(() => {
  const biome = getBiomeByName('Snow');

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(210 40% 75%) 0%, hsl(210 35% 85%) 40%, hsl(210 30% 92%) 100%)"
      >
        {/* Animated snowflakes overlay */}
        {SNOWFLAKES.map((flake, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: flake.top,
              left: flake.left,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              boxShadow: `0 0 ${flake.size * 2}px hsl(0 0% 100% / 0.8)`,
              animation: `snowfall ${4 + i * 0.3}s linear infinite`,
              animationDelay: `${flake.delay}s`
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
          background: 'linear-gradient(180deg, hsl(210 40% 75%) 0%, hsl(210 35% 85%) 40%, hsl(210 30% 92%) 100%)'
        }}
      />
      <div
        className="absolute top-[12%] right-[18%] w-20 h-20 rounded-full opacity-50"
        style={{
          background: 'radial-gradient(circle, hsl(45 30% 95%) 0%, hsl(45 20% 90%) 40%, transparent 70%)'
        }}
      />
      <div className="absolute top-[8%] left-[10%] w-24 h-8 rounded-full bg-white/50 blur-sm" />
      <div className="absolute top-[12%] left-[35%] w-20 h-6 rounded-full bg-white/40 blur-sm" />
      <div className="absolute top-[6%] right-[25%] w-28 h-9 rounded-full bg-white/45 blur-sm" />
      <div className="absolute top-[15%] right-[10%] w-16 h-5 rounded-full bg-white/35 blur-sm" />
      {SNOWFLAKES_EXTENDED.map((flake, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: flake.top,
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            boxShadow: `0 0 ${flake.size * 2}px hsl(0 0% 100% / 0.8)`,
            animation: `snowfall ${4 + i * 0.3}s linear infinite`,
            animationDelay: `${flake.delay}s`
          }}
        />
      ))}
      {/* Snowy mountains - distant */}
      <div className="absolute bottom-[28%] w-full h-44">
        <svg viewBox="0 0 1200 180" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="snowMountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(210 20% 95%)" />
              <stop offset="40%" stopColor="hsl(210 25% 85%)" />
              <stop offset="100%" stopColor="hsl(210 30% 75%)" />
            </linearGradient>
            <linearGradient id="snowCapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(0 0% 100%)" />
              <stop offset="100%" stopColor="hsl(210 15% 95%)" />
            </linearGradient>
          </defs>
          <path d="M0,180 L0,120 L100,70 L200,100 L350,40 L500,80 L650,25 L800,70 L950,50 L1100,85 L1200,60 L1200,180 Z" fill="url(#snowMountainGradient)" />
          <path d="M100,70 L80,85 L120,85 Z" fill="url(#snowCapGradient)" />
          <path d="M350,40 L320,60 L380,60 Z" fill="url(#snowCapGradient)" />
          <path d="M650,25 L610,50 L690,50 Z" fill="url(#snowCapGradient)" />
          <path d="M950,50 L920,70 L980,70 Z" fill="url(#snowCapGradient)" />
        </svg>
      </div>
      {/* Snowy hills - foreground */}
      <div className="absolute bottom-[18%] w-full h-36">
        <svg viewBox="0 0 1200 150" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="snowHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(210 20% 98%)" />
              <stop offset="100%" stopColor="hsl(210 25% 90%)" />
            </linearGradient>
          </defs>
          <path d="M0,150 L0,90 Q100,60 200,80 Q350,100 500,65 Q650,30 800,60 Q950,90 1100,55 L1200,70 L1200,150 Z" fill="url(#snowHillGradient)" />
        </svg>
      </div>
      {/* Snow-covered pine trees */}
      <div className="absolute bottom-[20%] w-full h-28">
        <svg viewBox="0 0 1200 120" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="snowTreeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(150 30% 35%)" />
              <stop offset="100%" stopColor="hsl(150 35% 25%)" />
            </linearGradient>
          </defs>
          <path d="M50,120 L50,90 L30,90 L60,50 L40,50 L60,20 L80,50 L60,50 L90,90 L70,90 L70,120 Z" fill="url(#snowTreeGradient)" />
          <path d="M60,20 L55,25 L65,25 Z" fill="white" />
          <path d="M40,50 L50,55 L55,50 L65,50 L70,55 L80,50 L60,50 Z" fill="hsl(210 20% 95%)" />
          <path d="M180,120 L180,95 L165,95 L190,65 L175,65 L190,40 L205,65 L190,65 L215,95 L200,95 L200,120 Z" fill="url(#snowTreeGradient)" />
          <path d="M190,40 L185,45 L195,45 Z" fill="white" />
          <path d="M350,120 L350,85 L330,85 L360,45 L340,45 L360,15 L380,45 L360,45 L390,85 L370,85 L370,120 Z" fill="url(#snowTreeGradient)" />
          <path d="M360,15 L355,22 L365,22 Z" fill="white" />
          <path d="M340,45 L350,52 L360,45 L370,52 L380,45 L360,45 Z" fill="hsl(210 20% 95%)" />
          <path d="M550,120 L550,100 L540,100 L560,75 L550,75 L560,55 L570,75 L560,75 L580,100 L570,100 L570,120 Z" fill="url(#snowTreeGradient)" />
          <path d="M560,55 L555,60 L565,60 Z" fill="white" />
          <path d="M750,120 L750,90 L735,90 L760,55 L745,55 L760,30 L775,55 L760,55 L785,90 L770,90 L770,120 Z" fill="url(#snowTreeGradient)" />
          <path d="M760,30 L755,37 L765,37 Z" fill="white" />
          <path d="M745,55 L755,62 L760,55 L765,62 L775,55 L760,55 Z" fill="hsl(210 20% 95%)" />
          <path d="M920,120 L920,95 L905,95 L930,60 L915,60 L930,35 L945,60 L930,60 L955,95 L940,95 L940,120 Z" fill="url(#snowTreeGradient)" />
          <path d="M930,35 L925,42 L935,42 Z" fill="white" />
          <path d="M1100,120 L1100,88 L1085,88 L1110,50 L1095,50 L1110,25 L1125,50 L1110,50 L1135,88 L1120,88 L1120,120 Z" fill="url(#snowTreeGradient)" />
          <path d="M1110,25 L1105,32 L1115,32 Z" fill="white" />
          <path d="M1095,50 L1105,57 L1110,50 L1115,57 L1125,50 L1110,50 Z" fill="hsl(210 20% 95%)" />
        </svg>
      </div>
    </div>
  );
});
SnowHomeBackground.displayName = 'SnowHomeBackground';
