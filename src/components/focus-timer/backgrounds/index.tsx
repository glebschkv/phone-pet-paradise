import { memo } from 'react';

// Dynamic Background Component for Focus Page
export const FocusBackground = ({ theme }: { theme: string }) => {
  switch (theme) {
    case 'sunset':
      return <SunsetBackground key="sunset" />;
    case 'night':
      return <NightBackground key="night" />;
    case 'forest':
      return <ForestBackground key="forest" />;
    case 'snow':
      return <SnowBackground key="snow" />;
    case 'sky':
      return <SkyBackground key="sky" />;
    default:
      return <MeadowBackground key="meadow" />;
  }
};

// Meadow Background (Default - Pixel Art)
export const MeadowBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Background image - fills screen with ground positioned above taskbar */}
    <div
      className="absolute left-0 right-0"
      style={{
        top: 0,
        bottom: '70px', // Leave space above the taskbar
        backgroundImage: 'url(/assets/backgrounds/meadow-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
    {/* Grass extension below to fill the taskbar area */}
    <div
      className="absolute bottom-0 left-0 right-0"
      style={{
        height: '70px',
        background: 'linear-gradient(to bottom, #7ec850 0%, #5da83a 100%)',
      }}
    />
  </div>
));
MeadowBackground.displayName = 'MeadowBackground';

// Sky Background (Default - Day)
export const SkyBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(200 65% 82%) 0%, hsl(200 45% 90%) 50%, hsl(40 50% 92%) 100%)'
      }}
    />
    <div
      className="absolute top-[10%] right-[12%] w-28 h-28 rounded-full opacity-50"
      style={{
        background: 'radial-gradient(circle, hsl(45 100% 88%) 0%, transparent 70%)'
      }}
    />
    <div className="absolute top-[15%] left-[8%] w-24 h-10 rounded-full bg-white/35 blur-sm" />
    <div className="absolute top-[10%] left-[30%] w-18 h-7 rounded-full bg-white/25 blur-sm" />
    <div className="absolute top-[20%] right-[15%] w-28 h-10 rounded-full bg-white/30 blur-sm" />
    <div className="absolute top-[12%] right-[35%] w-16 h-6 rounded-full bg-white/20 blur-sm" />
    <div className="absolute bottom-0 w-full h-48">
      <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="skyHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(140 30% 70%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(140 35% 60%)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d="M0,200 L0,120 Q150,80 300,100 Q450,120 600,90 Q750,60 900,80 Q1050,100 1200,70 L1200,200 Z" fill="url(#skyHillGradient)" />
      </svg>
    </div>
  </div>
));
SkyBackground.displayName = 'SkyBackground';

// Sunset Background
export const SunsetBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(280 40% 45%) 0%, hsl(350 60% 55%) 30%, hsl(30 80% 65%) 60%, hsl(45 90% 75%) 100%)'
      }}
    />
    <div
      className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-32 h-32 rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(40 100% 70%) 0%, hsl(30 90% 60%) 40%, transparent 70%)'
      }}
    />
    <div
      className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-48 h-24 rounded-full opacity-40"
      style={{
        background: 'radial-gradient(ellipse, hsl(35 100% 75%) 0%, transparent 70%)'
      }}
    />
    <div className="absolute top-[12%] left-[5%] w-28 h-8 rounded-full bg-orange-200/40 blur-sm" />
    <div className="absolute top-[8%] left-[25%] w-20 h-6 rounded-full bg-pink-200/30 blur-sm" />
    <div className="absolute top-[15%] right-[10%] w-32 h-10 rounded-full bg-purple-200/35 blur-sm" />
    <div className="absolute top-[10%] right-[30%] w-18 h-5 rounded-full bg-orange-100/25 blur-sm" />
    <div className="absolute bottom-0 w-full h-48">
      <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sunsetHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(280 30% 25%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(280 35% 15%)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M0,200 L0,100 Q100,60 200,90 Q350,130 500,80 Q650,30 800,70 Q950,110 1100,60 L1200,80 L1200,200 Z" fill="url(#sunsetHillGradient)" />
      </svg>
    </div>
  </div>
));
SunsetBackground.displayName = 'SunsetBackground';

// Night Background
export const NightBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(230 50% 12%) 0%, hsl(240 45% 18%) 40%, hsl(250 35% 25%) 100%)'
      }}
    />
    <div
      className="absolute top-[8%] right-[15%] w-16 h-16 rounded-full"
      style={{
        background: 'radial-gradient(circle at 30% 30%, hsl(45 20% 95%) 0%, hsl(45 15% 85%) 50%, hsl(45 10% 75%) 100%)',
        boxShadow: '0 0 40px hsl(45 30% 80% / 0.4), 0 0 80px hsl(45 30% 80% / 0.2)'
      }}
    />
    {[
      { top: '5%', left: '10%', size: 2 },
      { top: '12%', left: '25%', size: 1.5 },
      { top: '8%', left: '40%', size: 2.5 },
      { top: '15%', left: '55%', size: 1 },
      { top: '6%', left: '70%', size: 2 },
      { top: '18%', left: '85%', size: 1.5 },
      { top: '22%', left: '15%', size: 1 },
      { top: '25%', left: '35%', size: 2 },
      { top: '20%', left: '60%', size: 1.5 },
      { top: '28%', left: '75%', size: 1 },
      { top: '10%', left: '5%', size: 1 },
      { top: '30%', left: '90%', size: 2 },
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
    <div className="absolute bottom-0 w-full h-48">
      <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="nightHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(240 30% 18%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(240 35% 10%)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M0,200 L0,130 Q150,90 300,110 Q450,130 600,100 Q750,70 900,90 Q1050,110 1200,80 L1200,200 Z" fill="url(#nightHillGradient)" />
      </svg>
    </div>
  </div>
));
NightBackground.displayName = 'NightBackground';

// Forest Background
export const ForestBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(180 40% 75%) 0%, hsl(160 45% 70%) 40%, hsl(140 40% 60%) 100%)'
      }}
    />
    <div
      className="absolute top-0 left-[30%] w-32 h-[60%] opacity-20"
      style={{
        background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, transparent 100%)',
        clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)'
      }}
    />
    <div
      className="absolute top-0 right-[25%] w-24 h-[50%] opacity-15"
      style={{
        background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, transparent 100%)',
        clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)'
      }}
    />
    <div className="absolute top-[40%] left-0 right-0 h-24 bg-white/10 blur-xl" />
    <div className="absolute bottom-0 w-full h-64">
      <svg viewBox="0 0 1200 280" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="forestBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(150 35% 45%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(150 40% 35%)" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="forestMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(145 40% 38%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(145 45% 28%)" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="forestFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(140 45% 30%)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="hsl(140 50% 20%)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M0,280 L0,140 L50,100 L100,140 L120,90 L180,140 L200,110 L260,150 L280,100 L340,150 L380,80 L440,140 L480,100 L540,150 L580,90 L640,140 L700,70 L760,130 L800,100 L860,150 L920,80 L980,140 L1020,100 L1080,150 L1140,90 L1200,140 L1200,280 Z" fill="url(#forestBack)" />
        <path d="M0,280 L0,160 L40,120 L80,160 L110,100 L160,160 L190,130 L240,170 L280,110 L340,170 L400,90 L460,160 L520,120 L580,170 L640,100 L700,160 L760,130 L820,180 L880,110 L940,170 L1000,120 L1060,180 L1120,100 L1200,160 L1200,280 Z" fill="url(#forestMid)" />
        <path d="M0,280 L0,180 L30,140 L70,180 L100,120 L150,180 L180,150 L230,190 L270,130 L330,190 L390,110 L450,180 L510,140 L570,200 L630,120 L690,180 L750,150 L810,200 L870,130 L930,190 L990,140 L1050,200 L1110,120 L1170,180 L1200,160 L1200,280 Z" fill="url(#forestFront)" />
      </svg>
    </div>
  </div>
));
ForestBackground.displayName = 'ForestBackground';

// Snow Background
export const SnowBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(210 40% 75%) 0%, hsl(210 35% 85%) 40%, hsl(210 30% 92%) 100%)'
      }}
    />
    <div
      className="absolute top-[10%] right-[15%] w-24 h-24 rounded-full opacity-50"
      style={{
        background: 'radial-gradient(circle, hsl(45 30% 95%) 0%, hsl(45 20% 90%) 40%, transparent 70%)'
      }}
    />
    <div className="absolute top-[8%] left-[5%] w-28 h-10 rounded-full bg-white/50 blur-sm" />
    <div className="absolute top-[12%] left-[30%] w-22 h-7 rounded-full bg-white/40 blur-sm" />
    <div className="absolute top-[6%] right-[20%] w-32 h-10 rounded-full bg-white/45 blur-sm" />
    <div className="absolute top-[15%] right-[8%] w-18 h-6 rounded-full bg-white/35 blur-sm" />
    {[
      { top: '3%', left: '5%', size: 3, delay: 0 },
      { top: '8%', left: '18%', size: 2.5, delay: 1.2 },
      { top: '2%', left: '32%', size: 4, delay: 0.6 },
      { top: '6%', left: '48%', size: 2, delay: 2.0 },
      { top: '10%', left: '62%', size: 3.5, delay: 0.3 },
      { top: '4%', left: '78%', size: 2.5, delay: 1.5 },
      { top: '12%', left: '10%', size: 3, delay: 2.3 },
      { top: '15%', left: '40%', size: 2, delay: 0.9 },
      { top: '18%', left: '70%', size: 3, delay: 1.8 },
      { top: '20%', left: '88%', size: 2.5, delay: 2.6 },
      { top: '22%', left: '3%', size: 2, delay: 0.4 },
      { top: '25%', left: '25%', size: 3.5, delay: 1.7 },
      { top: '28%', left: '55%', size: 2.5, delay: 2.1 },
      { top: '30%', left: '82%', size: 3, delay: 0.8 },
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
    <div className="absolute bottom-0 w-full h-56">
      <svg viewBox="0 0 1200 240" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="focusSnowMountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(210 20% 95%)" />
            <stop offset="40%" stopColor="hsl(210 25% 85%)" />
            <stop offset="100%" stopColor="hsl(210 30% 75%)" />
          </linearGradient>
          <linearGradient id="focusSnowCapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(0 0% 100%)" />
            <stop offset="100%" stopColor="hsl(210 15% 95%)" />
          </linearGradient>
          <linearGradient id="focusSnowHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(210 20% 98%)" />
            <stop offset="100%" stopColor="hsl(210 25% 90%)" />
          </linearGradient>
          <linearGradient id="focusSnowTreeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(150 30% 35%)" />
            <stop offset="100%" stopColor="hsl(150 35% 25%)" />
          </linearGradient>
        </defs>
        <path d="M0,240 L0,160 L100,100 L200,140 L350,60 L500,110 L650,40 L800,90 L950,70 L1100,115 L1200,80 L1200,240 Z" fill="url(#focusSnowMountainGradient)" />
        <path d="M100,100 L75,120 L125,120 Z" fill="url(#focusSnowCapGradient)" />
        <path d="M350,60 L315,85 L385,85 Z" fill="url(#focusSnowCapGradient)" />
        <path d="M650,40 L605,70 L695,70 Z" fill="url(#focusSnowCapGradient)" />
        <path d="M950,70 L915,95 L985,95 Z" fill="url(#focusSnowCapGradient)" />
        <path d="M0,240 L0,180 Q150,150 300,170 Q450,190 600,160 Q750,130 900,155 Q1050,180 1200,150 L1200,240 Z" fill="url(#focusSnowHillGradient)" />
        <path d="M80,240 L80,210 L60,210 L90,170 L70,170 L90,140 L110,170 L90,170 L120,210 L100,210 L100,240 Z" fill="url(#focusSnowTreeGradient)" />
        <path d="M90,140 L85,148 L95,148 Z" fill="white" />
        <path d="M280,240 L280,215 L265,215 L290,180 L275,180 L290,155 L305,180 L290,180 L315,215 L300,215 L300,240 Z" fill="url(#focusSnowTreeGradient)" />
        <path d="M290,155 L285,163 L295,163 Z" fill="white" />
        <path d="M520,240 L520,205 L500,205 L530,160 L510,160 L530,125 L550,160 L530,160 L560,205 L540,205 L540,240 Z" fill="url(#focusSnowTreeGradient)" />
        <path d="M530,125 L524,135 L536,135 Z" fill="white" />
        <path d="M510,160 L520,168 L530,160 L540,168 L550,160 L530,160 Z" fill="hsl(210 20% 95%)" />
        <path d="M780,240 L780,218 L768,218 L790,185 L778,185 L790,162 L802,185 L790,185 L812,218 L800,218 L800,240 Z" fill="url(#focusSnowTreeGradient)" />
        <path d="M790,162 L785,170 L795,170 Z" fill="white" />
        <path d="M1050,240 L1050,208 L1032,208 L1060,165 L1042,165 L1060,130 L1078,165 L1060,165 L1088,208 L1070,208 L1070,240 Z" fill="url(#focusSnowTreeGradient)" />
        <path d="M1060,130 L1054,140 L1066,140 Z" fill="white" />
        <path d="M1042,165 L1052,174 L1060,165 L1068,174 L1078,165 L1060,165 Z" fill="hsl(210 20% 95%)" />
      </svg>
    </div>
  </div>
));
SnowBackground.displayName = 'SnowBackground';
