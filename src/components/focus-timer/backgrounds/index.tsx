import { memo, useMemo } from 'react';

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
    case 'city':
      return <CityBackground key="city" />;
    default:
      return <SkyBackground key="sky" />;
  }
};

// ============================================================================
// SKY BACKGROUND (Default - Meadow)
// Premium: Layered clouds, atmospheric depth, warm golden hour feel
// ============================================================================
export const SkyBackground = memo(() => (
  <div className="fixed inset-0 overflow-hidden focus-bg-transition">
    {/* Base sky gradient - rich atmospheric layers */}
    <div
      className="absolute inset-0"
      style={{
        background: `
          linear-gradient(180deg,
            hsl(200 75% 78%) 0%,
            hsl(200 60% 82%) 20%,
            hsl(195 50% 86%) 40%,
            hsl(45 45% 88%) 70%,
            hsl(40 55% 90%) 100%
          )
        `
      }}
    />

    {/* Atmospheric haze layer */}
    <div
      className="absolute inset-0 opacity-30"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 100%, hsl(40 60% 85%) 0%, transparent 70%)'
      }}
    />

    {/* Sun with glow */}
    <div
      className="absolute top-[8%] right-[15%] w-24 h-24 rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(45 100% 92%) 0%, hsl(45 90% 85%) 30%, hsl(40 80% 75% / 0.4) 60%, transparent 80%)',
        boxShadow: '0 0 60px hsl(45 90% 80% / 0.5), 0 0 120px hsl(40 80% 75% / 0.3)'
      }}
    />

    {/* Cloud layer - back */}
    <div className="absolute top-[12%] left-[5%] w-32 h-12 rounded-full bg-white/50 blur-md animate-cloud-drift-slow" />
    <div className="absolute top-[8%] left-[25%] w-24 h-9 rounded-full bg-white/40 blur-md animate-cloud-drift-slow" style={{ animationDelay: '-5s' }} />
    <div className="absolute top-[15%] right-[8%] w-36 h-14 rounded-full bg-white/45 blur-md animate-cloud-drift-slow" style={{ animationDelay: '-10s' }} />

    {/* Cloud layer - front (more defined) */}
    <div className="absolute top-[18%] left-[15%] w-28 h-10 rounded-full bg-white/60 blur-sm animate-cloud-drift" />
    <div className="absolute top-[22%] right-[20%] w-20 h-8 rounded-full bg-white/55 blur-sm animate-cloud-drift" style={{ animationDelay: '-8s' }} />
    <div className="absolute top-[10%] left-[50%] w-16 h-6 rounded-full bg-white/35 blur-sm animate-cloud-drift" style={{ animationDelay: '-3s' }} />

    {/* Distant hills - back layer */}
    <div className="absolute bottom-0 w-full h-56">
      <svg viewBox="0 0 1200 220" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="skyHillBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(150 25% 70%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(150 30% 60%)" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="skyHillMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(145 30% 65%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(145 35% 55%)" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="skyHillFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(140 35% 58%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(140 40% 48%)" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        {/* Back hills */}
        <path d="M0,220 L0,160 Q100,130 200,145 Q350,165 500,140 Q650,115 800,135 Q950,155 1100,125 L1200,140 L1200,220 Z" fill="url(#skyHillBack)" />
        {/* Mid hills */}
        <path d="M0,220 L0,170 Q80,140 180,155 Q320,175 480,145 Q640,115 800,140 Q920,160 1050,130 L1200,150 L1200,220 Z" fill="url(#skyHillMid)" />
        {/* Front hills */}
        <path d="M0,220 L0,180 Q120,150 260,165 Q400,180 560,155 Q720,130 880,155 Q1020,175 1150,145 L1200,160 L1200,220 Z" fill="url(#skyHillFront)" />
      </svg>
    </div>

    {/* Subtle vignette */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, hsl(200 30% 70% / 0.15) 100%)'
      }}
    />
  </div>
));
SkyBackground.displayName = 'SkyBackground';

// ============================================================================
// SUNSET BACKGROUND
// Premium: Rich color bands, dramatic sun, silhouette layers
// ============================================================================
export const SunsetBackground = memo(() => (
  <div className="fixed inset-0 overflow-hidden focus-bg-transition">
    {/* Rich sunset gradient - dramatic color bands */}
    <div
      className="absolute inset-0"
      style={{
        background: `
          linear-gradient(180deg,
            hsl(270 45% 35%) 0%,
            hsl(300 50% 40%) 15%,
            hsl(340 60% 50%) 30%,
            hsl(15 75% 55%) 45%,
            hsl(35 85% 60%) 60%,
            hsl(45 90% 70%) 80%,
            hsl(50 85% 78%) 100%
          )
        `
      }}
    />

    {/* Atmospheric glow near horizon */}
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse 100% 50% at 50% 85%, hsl(40 90% 70% / 0.4) 0%, transparent 60%)'
      }}
    />

    {/* Setting sun */}
    <div
      className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-28 h-28 rounded-full animate-pulse-subtle"
      style={{
        background: 'radial-gradient(circle, hsl(45 100% 80%) 0%, hsl(35 95% 65%) 40%, hsl(25 85% 55% / 0.6) 70%, transparent 100%)',
        boxShadow: '0 0 80px hsl(40 100% 70% / 0.6), 0 0 150px hsl(35 90% 60% / 0.4)'
      }}
    />

    {/* Sun reflection glow */}
    <div
      className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-56 h-20 rounded-full opacity-50"
      style={{
        background: 'radial-gradient(ellipse, hsl(40 100% 75%) 0%, transparent 70%)'
      }}
    />

    {/* Scattered clouds with sunset colors */}
    <div className="absolute top-[8%] left-[3%] w-32 h-10 rounded-full blur-md animate-cloud-drift-slow"
      style={{ background: 'linear-gradient(90deg, hsl(340 50% 65% / 0.5), hsl(25 70% 70% / 0.4))' }} />
    <div className="absolute top-[12%] left-[22%] w-24 h-7 rounded-full blur-md animate-cloud-drift-slow"
      style={{ background: 'linear-gradient(90deg, hsl(300 40% 60% / 0.4), hsl(340 60% 65% / 0.35))', animationDelay: '-6s' }} />
    <div className="absolute top-[6%] right-[15%] w-36 h-12 rounded-full blur-md animate-cloud-drift-slow"
      style={{ background: 'linear-gradient(90deg, hsl(280 45% 55% / 0.45), hsl(320 55% 60% / 0.4))', animationDelay: '-12s' }} />
    <div className="absolute top-[15%] right-[30%] w-20 h-6 rounded-full blur-sm animate-cloud-drift"
      style={{ background: 'linear-gradient(90deg, hsl(320 50% 60% / 0.5), hsl(350 60% 65% / 0.4))', animationDelay: '-4s' }} />

    {/* Birds silhouette */}
    <div className="absolute top-[25%] left-[20%] opacity-60">
      <svg width="60" height="20" viewBox="0 0 60 20" className="animate-bird-drift">
        <path d="M5,10 Q8,5 12,10 M8,10 Q11,5 15,10" stroke="hsl(280 30% 25%)" strokeWidth="1.5" fill="none" />
        <path d="M25,8 Q29,3 34,8 M29,8 Q33,3 38,8" stroke="hsl(280 30% 25%)" strokeWidth="1.5" fill="none" />
        <path d="M45,12 Q48,7 52,12 M48,12 Q51,7 55,12" stroke="hsl(280 30% 25%)" strokeWidth="1.5" fill="none" />
      </svg>
    </div>

    {/* Silhouette hills */}
    <div className="absolute bottom-0 w-full h-52">
      <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sunsetHillBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(280 35% 25%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(280 40% 18%)" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="sunsetHillFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(275 40% 18%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(270 45% 12%)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M0,200 L0,120 Q80,80 180,100 Q320,130 480,85 Q640,40 800,75 Q920,105 1080,60 L1200,90 L1200,200 Z" fill="url(#sunsetHillBack)" />
        <path d="M0,200 L0,140 Q100,100 220,120 Q380,145 540,105 Q700,65 860,95 Q980,120 1120,80 L1200,100 L1200,200 Z" fill="url(#sunsetHillFront)" />
      </svg>
    </div>

    {/* Warm vignette */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 40%, hsl(280 40% 25% / 0.2) 100%)'
      }}
    />
  </div>
));
SunsetBackground.displayName = 'SunsetBackground';

// ============================================================================
// NIGHT BACKGROUND
// Premium: Deep space feel, twinkling stars, moon glow, aurora hints
// ============================================================================
export const NightBackground = memo(() => {
  // Generate stars with varied properties
  const stars = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      top: `${Math.random() * 45}%`,
      left: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
      brightness: 0.6 + Math.random() * 0.4,
    })), []
  );

  return (
    <div className="fixed inset-0 overflow-hidden focus-bg-transition">
      {/* Deep night gradient with subtle color variation */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg,
              hsl(230 55% 8%) 0%,
              hsl(235 50% 12%) 25%,
              hsl(245 45% 16%) 50%,
              hsl(255 40% 20%) 75%,
              hsl(260 35% 24%) 100%
            )
          `
        }}
      />

      {/* Subtle aurora hint at horizon */}
      <div
        className="absolute bottom-[20%] left-0 right-0 h-48 opacity-20 animate-aurora"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, hsl(160 60% 50% / 0.3) 25%, hsl(200 70% 55% / 0.4) 50%, hsl(280 50% 55% / 0.3) 75%, transparent 100%)',
          filter: 'blur(40px)'
        }}
      />

      {/* Moon with realistic glow */}
      <div
        className="absolute top-[6%] right-[12%] w-20 h-20 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, hsl(45 25% 98%) 0%, hsl(45 20% 92%) 40%, hsl(45 15% 85%) 70%, hsl(220 20% 70%) 100%)',
          boxShadow: '0 0 50px hsl(45 30% 90% / 0.4), 0 0 100px hsl(45 25% 85% / 0.25), inset -8px -5px 15px hsl(220 30% 60% / 0.3)'
        }}
      />

      {/* Moon outer glow */}
      <div
        className="absolute top-[4%] right-[10%] w-28 h-28 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, hsl(45 30% 90%) 0%, transparent 70%)'
        }}
      />

      {/* Stars layer */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-twinkle"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: `hsl(45 ${10 + Math.random() * 20}% ${85 + Math.random() * 15}%)`,
            boxShadow: `0 0 ${star.size * 3}px hsl(45 20% 95% / ${star.brightness})`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      {/* Shooting star (occasional) */}
      <div className="absolute top-[15%] left-[60%] animate-shooting-star">
        <div
          className="w-1 h-1 bg-white rounded-full"
          style={{
            boxShadow: '0 0 6px 2px hsl(200 80% 90%), -20px 0 15px 1px hsl(200 60% 80% / 0.5), -40px 0 20px 0 hsl(200 40% 70% / 0.3)'
          }}
        />
      </div>

      {/* Night hills */}
      <div className="absolute bottom-0 w-full h-52">
        <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="nightHillBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(250 35% 18%)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(250 40% 12%)" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="nightHillFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(245 40% 12%)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="hsl(240 45% 8%)" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d="M0,200 L0,140 Q120,100 260,120 Q420,145 580,110 Q740,75 900,100 Q1040,125 1180,85 L1200,95 L1200,200 Z" fill="url(#nightHillBack)" />
          <path d="M0,200 L0,155 Q100,120 220,140 Q380,165 540,130 Q700,95 860,120 Q1000,145 1140,105 L1200,115 L1200,200 Z" fill="url(#nightHillFront)" />
        </svg>
      </div>

      {/* Deep vignette for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, hsl(230 50% 5% / 0.4) 100%)'
        }}
      />
    </div>
  );
});
NightBackground.displayName = 'NightBackground';

// ============================================================================
// FOREST BACKGROUND
// Premium: Dappled light, mist layers, detailed tree silhouettes, fireflies
// ============================================================================
export const ForestBackground = memo(() => {
  // Generate fireflies
  const fireflies = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      top: `${40 + Math.random() * 35}%`,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 2,
    })), []
  );

  return (
    <div className="fixed inset-0 overflow-hidden focus-bg-transition">
      {/* Forest sky gradient - filtered through canopy */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg,
              hsl(175 45% 72%) 0%,
              hsl(165 50% 68%) 25%,
              hsl(155 45% 62%) 50%,
              hsl(145 40% 55%) 75%,
              hsl(140 38% 48%) 100%
            )
          `
        }}
      />

      {/* God rays / dappled light */}
      <div
        className="absolute top-0 left-[25%] w-40 h-[65%] opacity-25 animate-ray-sway"
        style={{
          background: 'linear-gradient(180deg, hsl(50 70% 90%) 0%, transparent 100%)',
          clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
          filter: 'blur(8px)'
        }}
      />
      <div
        className="absolute top-0 right-[30%] w-32 h-[55%] opacity-20 animate-ray-sway"
        style={{
          background: 'linear-gradient(180deg, hsl(50 65% 88%) 0%, transparent 100%)',
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
          filter: 'blur(10px)',
          animationDelay: '-2s'
        }}
      />
      <div
        className="absolute top-0 left-[60%] w-28 h-[50%] opacity-15 animate-ray-sway"
        style={{
          background: 'linear-gradient(180deg, hsl(55 60% 85%) 0%, transparent 100%)',
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',
          filter: 'blur(12px)',
          animationDelay: '-4s'
        }}
      />

      {/* Mist layer */}
      <div className="absolute top-[35%] left-0 right-0 h-32 bg-white/10 blur-2xl animate-mist-drift" />
      <div className="absolute top-[50%] left-0 right-0 h-24 bg-white/8 blur-xl animate-mist-drift" style={{ animationDelay: '-5s' }} />

      {/* Fireflies */}
      {fireflies.map((fly, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full animate-firefly"
          style={{
            top: fly.top,
            left: fly.left,
            backgroundColor: 'hsl(60 100% 75%)',
            boxShadow: '0 0 8px 3px hsl(60 100% 70% / 0.7), 0 0 15px 5px hsl(60 90% 65% / 0.4)',
            animationDelay: `${fly.delay}s`,
            animationDuration: `${fly.duration}s`,
          }}
        />
      ))}

      {/* Multi-layer forest trees */}
      <div className="absolute bottom-0 w-full h-72">
        <svg viewBox="0 0 1200 300" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="forestBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(155 35% 48%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(155 40% 38%)" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="forestMid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(150 40% 40%)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="hsl(150 45% 30%)" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="forestFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(145 45% 32%)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(145 50% 22%)" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Back trees - softer, more distant */}
          <path d="M0,300 L0,180 L30,140 L60,180 L80,120 L120,180 L150,100 L190,180 L220,130 L260,185 L300,90 L350,180 L390,110 L440,185 L490,80 L540,180 L590,120 L640,190 L700,85 L760,180 L810,100 L860,185 L920,75 L980,180 L1030,110 L1090,185 L1150,90 L1200,170 L1200,300 Z" fill="url(#forestBack)" />
          {/* Mid trees */}
          <path d="M0,300 L0,200 L25,155 L55,200 L75,130 L115,200 L145,110 L185,200 L215,140 L255,205 L295,100 L345,200 L385,120 L435,205 L485,90 L535,200 L585,130 L635,210 L695,95 L755,200 L805,110 L855,205 L915,85 L975,200 L1025,120 L1085,205 L1145,100 L1200,185 L1200,300 Z" fill="url(#forestMid)" />
          {/* Front trees - darker, more detail */}
          <path d="M0,300 L0,220 L20,170 L50,220 L70,145 L110,220 L140,125 L180,220 L210,155 L250,225 L290,115 L340,220 L380,135 L430,225 L480,105 L530,220 L580,145 L630,230 L690,110 L750,220 L800,125 L850,225 L910,100 L970,220 L1020,135 L1080,225 L1140,115 L1200,200 L1200,300 Z" fill="url(#forestFront)" />
        </svg>
      </div>

      {/* Subtle forest vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 40%, hsl(145 40% 20% / 0.25) 100%)'
        }}
      />
    </div>
  );
});
ForestBackground.displayName = 'ForestBackground';

// ============================================================================
// SNOW BACKGROUND
// Premium: Realistic snowfall, layered mountains, soft winter light
// ============================================================================
export const SnowBackground = memo(() => {
  // Generate snowflakes with varied properties
  const snowflakes = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 4,
      sway: 15 + Math.random() * 20,
      opacity: 0.5 + Math.random() * 0.5,
    })), []
  );

  return (
    <div className="fixed inset-0 overflow-hidden focus-bg-transition">
      {/* Winter sky gradient - soft, cold tones */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg,
              hsl(215 35% 75%) 0%,
              hsl(212 32% 82%) 30%,
              hsl(210 28% 88%) 60%,
              hsl(208 25% 93%) 100%
            )
          `
        }}
      />

      {/* Soft winter sun glow */}
      <div
        className="absolute top-[8%] right-[18%] w-28 h-28 rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, hsl(45 35% 95%) 0%, hsl(45 25% 90%) 40%, transparent 70%)',
          boxShadow: '0 0 60px hsl(45 30% 92% / 0.4)'
        }}
      />

      {/* Soft clouds */}
      <div className="absolute top-[5%] left-[3%] w-36 h-14 rounded-full bg-white/60 blur-lg" />
      <div className="absolute top-[10%] left-[28%] w-28 h-10 rounded-full bg-white/50 blur-lg" />
      <div className="absolute top-[3%] right-[25%] w-40 h-12 rounded-full bg-white/55 blur-lg" />
      <div className="absolute top-[12%] right-[5%] w-24 h-9 rounded-full bg-white/45 blur-md" />

      {/* Snowflakes */}
      {snowflakes.map((flake, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-snowfall"
          style={{
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            boxShadow: `0 0 ${flake.size}px hsl(0 0% 100% / 0.6)`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            ['--sway' as string]: `${flake.sway}px`,
          }}
        />
      ))}

      {/* Mountain layers with snow */}
      <div className="absolute bottom-0 w-full h-64">
        <svg viewBox="0 0 1200 260" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="snowMtnBack" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(215 22% 88%)" />
              <stop offset="40%" stopColor="hsl(215 25% 80%)" />
              <stop offset="100%" stopColor="hsl(215 28% 72%)" />
            </linearGradient>
            <linearGradient id="snowMtnFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(212 20% 94%)" />
              <stop offset="30%" stopColor="hsl(212 24% 85%)" />
              <stop offset="100%" stopColor="hsl(212 28% 75%)" />
            </linearGradient>
            <linearGradient id="snowCap" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(0 0% 100%)" />
              <stop offset="100%" stopColor="hsl(210 15% 96%)" />
            </linearGradient>
            <linearGradient id="snowGround" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(210 18% 97%)" />
              <stop offset="100%" stopColor="hsl(210 22% 92%)" />
            </linearGradient>
            <linearGradient id="snowTreeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(155 28% 38%)" />
              <stop offset="100%" stopColor="hsl(155 32% 28%)" />
            </linearGradient>
          </defs>

          {/* Back mountains */}
          <path d="M0,260 L0,180 L80,120 L160,160 L280,70 L400,130 L520,50 L640,110 L760,60 L880,120 L1000,80 L1100,140 L1200,100 L1200,260 Z" fill="url(#snowMtnBack)" />
          {/* Snow caps - back */}
          <path d="M280,70 L250,95 L310,95 Z" fill="url(#snowCap)" />
          <path d="M520,50 L485,80 L555,80 Z" fill="url(#snowCap)" />
          <path d="M760,60 L725,90 L795,90 Z" fill="url(#snowCap)" />

          {/* Front mountains */}
          <path d="M0,260 L0,200 L100,140 L200,175 L340,95 L480,150 L600,85 L720,140 L840,100 L960,155 L1080,110 L1200,160 L1200,260 Z" fill="url(#snowMtnFront)" />
          {/* Snow caps - front */}
          <path d="M340,95 L305,125 L375,125 Z" fill="url(#snowCap)" />
          <path d="M600,85 L560,120 L640,120 Z" fill="url(#snowCap)" />
          <path d="M840,100 L805,130 L875,130 Z" fill="url(#snowCap)" />

          {/* Snowy ground */}
          <path d="M0,260 L0,210 Q150,190 300,205 Q450,220 600,200 Q750,180 900,198 Q1050,215 1200,195 L1200,260 Z" fill="url(#snowGround)" />

          {/* Snow-covered trees */}
          <g>
            <path d="M100,260 L100,235 L82,235 L108,195 L90,195 L108,165 L126,195 L108,195 L134,235 L116,235 L116,260 Z" fill="url(#snowTreeGrad)" />
            <path d="M108,165 L102,175 L114,175 Z" fill="white" />
            <path d="M90,195 L100,205 L108,195 L116,205 L126,195 L108,195 Z" fill="hsl(210 20% 95%)" />
          </g>
          <g>
            <path d="M350,260 L350,230 L330,230 L358,185 L338,185 L358,150 L378,185 L358,185 L386,230 L366,230 L366,260 Z" fill="url(#snowTreeGrad)" />
            <path d="M358,150 L351,162 L365,162 Z" fill="white" />
            <path d="M338,185 L350,197 L358,185 L366,197 L378,185 L358,185 Z" fill="hsl(210 20% 95%)" />
          </g>
          <g>
            <path d="M620,260 L620,228 L598,228 L628,180 L606,180 L628,142 L650,180 L628,180 L658,228 L636,228 L636,260 Z" fill="url(#snowTreeGrad)" />
            <path d="M628,142 L620,155 L636,155 Z" fill="white" />
            <path d="M606,180 L618,193 L628,180 L638,193 L650,180 L628,180 Z" fill="hsl(210 20% 95%)" />
          </g>
          <g>
            <path d="M920,260 L920,238 L905,238 L928,200 L913,200 L928,172 L943,200 L928,200 L951,238 L936,238 L936,260 Z" fill="url(#snowTreeGrad)" />
            <path d="M928,172 L922,182 L934,182 Z" fill="white" />
          </g>
          <g>
            <path d="M1100,260 L1100,232 L1082,232 L1110,188 L1092,188 L1110,155 L1128,188 L1110,188 L1138,232 L1120,232 L1120,260 Z" fill="url(#snowTreeGrad)" />
            <path d="M1110,155 L1103,167 L1117,167 Z" fill="white" />
            <path d="M1092,188 L1102,200 L1110,188 L1118,200 L1128,188 L1110,188 Z" fill="hsl(210 20% 95%)" />
          </g>
        </svg>
      </div>

      {/* Soft cold vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, hsl(215 30% 80% / 0.2) 100%)'
        }}
      />
    </div>
  );
});
SnowBackground.displayName = 'SnowBackground';

// ============================================================================
// CITY BACKGROUND (NEW)
// Premium: Neon-lit skyline, animated windows, urban night atmosphere
// ============================================================================
export const CityBackground = memo(() => {
  // Generate building windows that light up
  const buildings = useMemo(() => [
    { left: '2%', width: 45, height: 140, windows: 12 },
    { left: '10%', width: 38, height: 180, windows: 16 },
    { left: '17%', width: 50, height: 160, windows: 14 },
    { left: '27%', width: 42, height: 200, windows: 18 },
    { left: '35%', width: 55, height: 150, windows: 12 },
    { left: '45%', width: 48, height: 220, windows: 20 },
    { left: '54%', width: 40, height: 170, windows: 15 },
    { left: '62%', width: 52, height: 190, windows: 17 },
    { left: '72%', width: 45, height: 145, windows: 12 },
    { left: '80%', width: 58, height: 175, windows: 15 },
    { left: '90%', width: 42, height: 155, windows: 13 },
  ], []);

  return (
    <div className="fixed inset-0 overflow-hidden focus-bg-transition">
      {/* Night city sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg,
              hsl(255 50% 10%) 0%,
              hsl(260 45% 14%) 25%,
              hsl(270 40% 18%) 50%,
              hsl(280 35% 22%) 70%,
              hsl(300 30% 28%) 100%
            )
          `
        }}
      />

      {/* City glow at horizon */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, hsl(280 40% 30% / 0.3) 50%, hsl(300 50% 35% / 0.5) 100%)'
        }}
      />

      {/* Distant stars (fewer, city light pollution) */}
      {Array.from({ length: 15 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/60 animate-twinkle"
          style={{
            top: `${5 + Math.random() * 25}%`,
            left: `${Math.random() * 100}%`,
            width: `${1 + Math.random()}px`,
            height: `${1 + Math.random()}px`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Moon (smaller, urban setting) */}
      <div
        className="absolute top-[8%] left-[15%] w-12 h-12 rounded-full opacity-70"
        style={{
          background: 'radial-gradient(circle at 35% 35%, hsl(45 20% 95%) 0%, hsl(45 15% 85%) 60%, hsl(260 20% 60%) 100%)',
          boxShadow: '0 0 30px hsl(45 25% 85% / 0.3)'
        }}
      />

      {/* City skyline */}
      <div className="absolute bottom-0 w-full h-64">
        <svg viewBox="0 0 1200 260" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="buildingDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(260 30% 12%)" />
              <stop offset="100%" stopColor="hsl(260 35% 8%)" />
            </linearGradient>
            <linearGradient id="buildingMid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(265 28% 15%)" />
              <stop offset="100%" stopColor="hsl(265 32% 10%)" />
            </linearGradient>
            <linearGradient id="buildingLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(270 25% 18%)" />
              <stop offset="50%" stopColor="hsl(270 28% 20%)" />
              <stop offset="100%" stopColor="hsl(270 25% 16%)" />
            </linearGradient>
          </defs>

          {/* Back buildings */}
          <rect x="0" y="140" width="60" height="120" fill="url(#buildingDark)" />
          <rect x="70" y="100" width="50" height="160" fill="url(#buildingDark)" />
          <rect x="130" y="120" width="65" height="140" fill="url(#buildingDark)" />
          <rect x="210" y="80" width="55" height="180" fill="url(#buildingDark)" />
          <rect x="280" y="130" width="70" height="130" fill="url(#buildingDark)" />
          <rect x="365" y="60" width="60" height="200" fill="url(#buildingDark)" />
          <rect x="440" y="110" width="55" height="150" fill="url(#buildingDark)" />
          <rect x="510" y="70" width="65" height="190" fill="url(#buildingDark)" />
          <rect x="590" y="125" width="50" height="135" fill="url(#buildingDark)" />
          <rect x="655" y="90" width="70" height="170" fill="url(#buildingDark)" />
          <rect x="740" y="135" width="55" height="125" fill="url(#buildingDark)" />
          <rect x="810" y="100" width="60" height="160" fill="url(#buildingDark)" />
          <rect x="885" y="75" width="50" height="185" fill="url(#buildingDark)" />
          <rect x="950" y="115" width="65" height="145" fill="url(#buildingDark)" />
          <rect x="1030" y="85" width="55" height="175" fill="url(#buildingDark)" />
          <rect x="1100" y="130" width="60" height="130" fill="url(#buildingDark)" />
          <rect x="1170" y="110" width="40" height="150" fill="url(#buildingDark)" />

          {/* Front buildings with more detail */}
          <rect x="30" y="160" width="70" height="100" fill="url(#buildingMid)" />
          <rect x="115" y="130" width="55" height="130" fill="url(#buildingMid)" />
          <rect x="185" y="150" width="80" height="110" fill="url(#buildingMid)" />
          <rect x="280" y="105" width="60" height="155" fill="url(#buildingMid)" />
          <rect x="355" y="145" width="75" height="115" fill="url(#buildingMid)" />
          <rect x="450" y="85" width="55" height="175" fill="url(#buildingMid)" />
          <rect x="520" y="140" width="65" height="120" fill="url(#buildingMid)" />
          <rect x="600" y="95" width="70" height="165" fill="url(#buildingMid)" />
          <rect x="690" y="155" width="50" height="105" fill="url(#buildingMid)" />
          <rect x="755" y="120" width="60" height="140" fill="url(#buildingMid)" />
          <rect x="830" y="150" width="55" height="110" fill="url(#buildingMid)" />
          <rect x="905" y="100" width="65" height="160" fill="url(#buildingMid)" />
          <rect x="985" y="135" width="50" height="125" fill="url(#buildingMid)" />
          <rect x="1050" y="160" width="60" height="100" fill="url(#buildingMid)" />
          <rect x="1125" y="125" width="55" height="135" fill="url(#buildingMid)" />
        </svg>
      </div>

      {/* Animated building windows */}
      <div className="absolute bottom-0 w-full h-64 pointer-events-none">
        {buildings.map((building, bi) => (
          <div
            key={bi}
            className="absolute bottom-0"
            style={{
              left: building.left,
              width: `${building.width}px`,
              height: `${building.height}px`,
            }}
          >
            {Array.from({ length: building.windows }, (_, wi) => (
              <div
                key={wi}
                className="absolute w-1.5 h-2 animate-window-flicker"
                style={{
                  left: `${15 + (wi % 3) * 30}%`,
                  bottom: `${10 + Math.floor(wi / 3) * 18}%`,
                  backgroundColor: Math.random() > 0.3 ? 'hsl(45 70% 70%)' : 'hsl(200 60% 60%)',
                  opacity: Math.random() > 0.4 ? 0.8 : 0.2,
                  boxShadow: Math.random() > 0.5 ? '0 0 4px hsl(45 60% 65%)' : 'none',
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${5 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Neon sign glow accents */}
      <div className="absolute bottom-[25%] left-[20%] w-8 h-2 rounded-full opacity-60 animate-neon-pulse"
        style={{ backgroundColor: 'hsl(320 80% 60%)', boxShadow: '0 0 15px hsl(320 80% 60%)' }} />
      <div className="absolute bottom-[30%] right-[25%] w-6 h-1.5 rounded-full opacity-50 animate-neon-pulse"
        style={{ backgroundColor: 'hsl(180 80% 55%)', boxShadow: '0 0 12px hsl(180 80% 55%)', animationDelay: '-2s' }} />
      <div className="absolute bottom-[22%] left-[55%] w-10 h-2 rounded-full opacity-55 animate-neon-pulse"
        style={{ backgroundColor: 'hsl(280 70% 60%)', boxShadow: '0 0 18px hsl(280 70% 60%)', animationDelay: '-4s' }} />

      {/* Moving car lights on street level */}
      <div className="absolute bottom-[8%] left-0 w-full overflow-hidden h-4">
        <div className="animate-car-left">
          <div className="w-2 h-1 rounded-full bg-white" style={{ boxShadow: '0 0 6px hsl(45 80% 70%)' }} />
        </div>
        <div className="animate-car-right" style={{ animationDelay: '-3s' }}>
          <div className="w-2 h-1 rounded-full bg-red-400" style={{ boxShadow: '0 0 6px hsl(0 70% 55%)' }} />
        </div>
      </div>

      {/* Urban vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, hsl(260 50% 8% / 0.5) 100%)'
        }}
      />
    </div>
  );
});
CityBackground.displayName = 'CityBackground';
