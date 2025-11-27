import { memo } from 'react';
import { getBiomeByName } from '@/data/AnimalDatabase';

interface RetroBackgroundProps {
  theme?: string;
}

export const RetroBackground = memo(({ theme = 'day' }: RetroBackgroundProps) => {
  switch (theme) {
    case 'sunset':
      return <SunsetHomeBackground key="sunset" />;
    case 'night':
      return <NightHomeBackground key="night" />;
    case 'ocean':
      return <OceanHomeBackground key="ocean" />;
    case 'forest':
      return <ForestHomeBackground key="forest" />;
    case 'snow':
      return <SnowHomeBackground key="snow" />;
    default:
      return <DayHomeBackground key="day" />;
  }
});

RetroBackground.displayName = 'RetroBackground';

// Reusable Image Background Component
const ImageBackground = memo(({ imagePath, fallbackGradient, children }: {
  imagePath: string;
  fallbackGradient: string;
  children?: React.ReactNode;
}) => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Background Image */}
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${imagePath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
    {/* Fallback gradient overlay for loading */}
    <div
      className="absolute inset-0 opacity-0 transition-opacity duration-500"
      style={{
        background: fallbackGradient
      }}
    />
    {children}
  </div>
));
ImageBackground.displayName = 'ImageBackground';

// Day Background (Meadow - Grassy Path)
const DayHomeBackground = memo(() => {
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

// Sunset Background (Windmill)
const SunsetHomeBackground = memo(() => {
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

// Night Background (Purple Nightsky)
const NightHomeBackground = memo(() => {
  const biome = getBiomeByName('Night');

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(230 50% 10%) 0%, hsl(235 45% 15%) 40%, hsl(245 35% 22%) 100%)"
      >
        {/* Stars overlay on top of image */}
        {[
          { top: '5%', left: '8%', size: 2 },
          { top: '10%', left: '22%', size: 1.5 },
          { top: '7%', left: '38%', size: 2.5 },
          { top: '15%', left: '52%', size: 1 },
          { top: '8%', left: '75%', size: 2 },
          { top: '20%', left: '88%', size: 1.5 },
        ].map((star, i) => (
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
      {[
        { top: '5%', left: '8%', size: 2 },
        { top: '10%', left: '22%', size: 1.5 },
        { top: '7%', left: '38%', size: 2.5 },
        { top: '15%', left: '52%', size: 1 },
        { top: '8%', left: '75%', size: 2 },
        { top: '20%', left: '88%', size: 1.5 },
        { top: '25%', left: '12%', size: 1 },
        { top: '22%', left: '32%', size: 2 },
        { top: '18%', left: '58%', size: 1.5 },
        { top: '28%', left: '78%', size: 1 },
        { top: '12%', left: '5%', size: 1 },
        { top: '30%', left: '92%', size: 2 },
        { top: '35%', left: '15%', size: 1.5 },
        { top: '32%', left: '45%', size: 1 },
      ].map((star, i) => (
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

// Ocean Background
const OceanHomeBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Sky Gradient - Tropical */}
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(195 75% 70%) 0%, hsl(200 65% 78%) 40%, hsl(45 60% 85%) 100%)'
      }}
    />

    {/* Sun */}
    <div
      className="absolute top-[12%] right-[22%] w-20 h-20 rounded-full opacity-70"
      style={{
        background: 'radial-gradient(circle, hsl(45 100% 90%) 0%, transparent 70%)'
      }}
    />

    {/* Tropical clouds */}
    <div className="absolute top-[10%] left-[8%] w-24 h-9 rounded-full bg-white/45 blur-sm" />
    <div className="absolute top-[6%] left-[28%] w-18 h-6 rounded-full bg-white/35 blur-sm" />
    <div className="absolute top-[14%] left-[55%] w-28 h-10 rounded-full bg-white/40 blur-sm" />
    <div className="absolute top-[8%] right-[30%] w-16 h-5 rounded-full bg-white/30 blur-sm" />

    {/* Distant island silhouette */}
    <div className="absolute bottom-[28%] w-full h-40">
      <svg viewBox="0 0 1200 160" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="oceanIslandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(150 40% 55%)" />
            <stop offset="100%" stopColor="hsl(150 45% 45%)" />
          </linearGradient>
        </defs>
        <path d="M0,160 L0,140 L200,140 L250,100 L300,80 L400,90 L500,70 L600,85 L700,75 L800,90 L900,140 L1200,140 L1200,160 Z" fill="url(#oceanIslandGradient)" />
      </svg>
    </div>

    {/* Ocean waves */}
    <div className="absolute bottom-[18%] w-full h-32">
      <svg viewBox="0 0 1200 130" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="oceanWaveGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(200 70% 60%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(205 65% 50%)" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="oceanWaveGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(205 60% 50%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(210 55% 40%)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Back wave */}
        <path d="M0,130 L0,60 Q100,40 200,60 Q300,80 400,50 Q500,20 600,50 Q700,80 800,40 Q900,10 1000,40 Q1100,70 1200,30 L1200,130 Z" fill="url(#oceanWaveGradient1)" />
        {/* Front wave */}
        <path d="M0,130 L0,90 Q150,70 300,100 Q450,130 600,90 Q750,50 900,90 Q1050,130 1200,70 L1200,130 Z" fill="url(#oceanWaveGradient2)" />
      </svg>
    </div>
  </div>
));
OceanHomeBackground.displayName = 'OceanHomeBackground';

// Forest Background (Jungle Island)
const ForestHomeBackground = memo(() => {
  const biome = getBiomeByName('Forest');

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(175 45% 70%) 0%, hsl(160 50% 75%) 40%, hsl(140 45% 70%) 100%)"
      >
        {/* Misty overlay for jungle atmosphere */}
        <div className="absolute top-[35%] left-0 right-0 h-20 bg-white/10 blur-xl" />
      </ImageBackground>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(175 45% 70%) 0%, hsl(160 50% 75%) 40%, hsl(140 45% 70%) 100%)'
        }}
      />
      <div
        className="absolute top-0 left-[25%] w-32 h-[50%] opacity-25"
        style={{
          background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, transparent 100%)',
          clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)'
        }}
      />
      <div
        className="absolute top-0 right-[30%] w-24 h-[40%] opacity-20"
        style={{
          background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, transparent 100%)',
          clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)'
        }}
      />
      <div className="absolute top-[35%] left-0 right-0 h-20 bg-white/15 blur-xl" />
      <div className="absolute bottom-[28%] w-full h-40">
        <svg viewBox="0 0 1200 160" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="forestBackGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(150 35% 50%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(150 40% 40%)" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d="M0,160 L0,80 L40,50 L80,80 L100,40 L140,80 L160,60 L200,90 L230,50 L280,90 L320,40 L380,80 L420,50 L480,90 L520,30 L580,70 L640,50 L700,90 L760,40 L820,80 L880,50 L940,90 L1000,40 L1060,80 L1120,50 L1200,80 L1200,160 Z" fill="url(#forestBackGradient)" />
        </svg>
      </div>
      <div className="absolute bottom-[18%] w-full h-32">
        <svg viewBox="0 0 1200 130" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="forestMidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(145 40% 40%)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(145 45% 30%)" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d="M0,130 L0,70 L30,40 L60,70 L80,30 L120,70 L150,50 L190,80 L220,40 L270,80 L320,30 L370,70 L420,40 L480,80 L530,20 L590,60 L650,40 L710,80 L770,30 L830,70 L890,40 L950,80 L1010,30 L1070,70 L1130,40 L1200,70 L1200,130 Z" fill="url(#forestMidGradient)" />
        </svg>
      </div>
    </div>
  );
});
ForestHomeBackground.displayName = 'ForestHomeBackground';

// Snow Background (Sky Platform World)
const SnowHomeBackground = memo(() => {
  const biome = getBiomeByName('Snow');

  const snowflakes = [
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

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(210 40% 75%) 0%, hsl(210 35% 85%) 40%, hsl(210 30% 92%) 100%)"
      >
        {/* Animated snowflakes overlay */}
        {snowflakes.map((flake, i) => (
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
      {[
        ...snowflakes,
        { top: '25%', left: '5%', size: 2, delay: 1.0 },
        { top: '28%', left: '30%', size: 3, delay: 2.0 },
        { top: '30%', left: '60%', size: 2.5, delay: 0.7 },
        { top: '32%', left: '85%', size: 2, delay: 1.6 },
      ].map((flake, i) => (
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
