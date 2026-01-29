import { useEffect, useState } from 'react';

/**
 * Retro arcade-themed splash/loading screen.
 * Used as Suspense fallback and during auth loading.
 * Matches the inline splash in index.html for seamless transition.
 */
export const SplashScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        // Fast start, slow finish for realistic feel
        const increment = prev < 60 ? 8 : prev < 85 ? 3 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0014 0%, #1a0530 40%, #0d0020 100%)',
      }}
    >
      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute rounded-full opacity-20 blur-[80px]"
        style={{
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.6), transparent)',
          top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        }}
      />

      {/* App icon */}
      <img
        src="/app-icon.png"
        alt=""
        width={72}
        height={72}
        className="rounded-2xl mb-5 relative z-10"
        style={{
          boxShadow: '0 0 30px rgba(147, 51, 234, 0.4), 0 4px 20px rgba(0,0,0,0.5)',
        }}
      />

      {/* NOMO title */}
      <h1
        className="relative z-10 text-5xl font-black tracking-[8px] mb-2"
        style={{
          color: '#e2d4f0',
          textShadow: '0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.4), 0 2px 0 rgba(0,0,0,0.5)',
        }}
      >
        NOMO
      </h1>

      {/* Tagline */}
      <p
        className="relative z-10 text-[11px] tracking-[3px] uppercase mb-10"
        style={{ color: 'rgba(168, 130, 220, 0.6)' }}
      >
        Focus &middot; Grow &middot; Collect
      </p>

      {/* Loading bar */}
      <div className="relative z-10 w-[180px]">
        <div
          className="h-[6px] rounded-full overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-200 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #a855f7, #c084fc)',
              boxShadow: '0 0 10px rgba(168, 85, 247, 0.6)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
