import { useEffect, useState } from 'react';

/**
 * Branded splash/loading screen.
 * Used as Suspense fallback and during auth loading.
 * Matches the inline splash in index.html for seamless transition.
 */
export const SplashScreen = () => {
  const [progress, setProgress] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Trigger entrance animation on mount
    requestAnimationFrame(() => setEntered(true));

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        const increment = prev < 60 ? 8 : prev < 85 ? 3 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #080012 0%, #16042a 40%, #0a0018 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', sans-serif",
      }}
    >
      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 360, height: 360,
          top: '50%', left: '50%',
          transform: 'translate(-50%, calc(-50% - 60px))',
          background: 'radial-gradient(circle, rgba(168,85,247,0.22) 0%, rgba(126,34,206,0.08) 45%, transparent 100%)',
          animation: 'splash-glow 3s ease-in-out infinite alternate',
        }}
      />

      {/* Content wrapper with entrance animation */}
      <div
        className="flex flex-col items-center relative z-10 transition-all duration-[600ms] ease-out"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(14px)',
        }}
      >
        {/* App icon */}
        <img
          src="/app-icon.png"
          alt=""
          width={96}
          height={96}
          className="mb-6"
          style={{
            borderRadius: 22,
            boxShadow: '0 0 48px rgba(168, 85, 247, 0.5), 0 6px 24px rgba(0,0,0,0.5)',
          }}
        />

        {/* NOMO title */}
        <h1
          className="text-[42px] font-extrabold tracking-[12px] mb-2.5"
          style={{
            color: '#f0e6ff',
            textShadow: '0 0 16px rgba(168, 85, 247, 0.55), 0 0 40px rgba(168, 85, 247, 0.25)',
          }}
        >
          NOMO
        </h1>

        {/* Tagline */}
        <p
          className="text-[11px] font-semibold tracking-[4px] uppercase mb-11"
          style={{ color: 'rgba(168, 140, 210, 0.55)' }}
        >
          Focus &middot; Grow &middot; Collect
        </p>

        {/* Loading bar */}
        <div className="w-[220px]">
          <div
            className="h-1 rounded-sm overflow-hidden relative"
            style={{ background: 'rgba(168, 85, 247, 0.08)' }}
          >
            <div
              className="h-full rounded-sm transition-all duration-200 ease-out relative"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #a855f7, #c084fc)',
              }}
            >
              {/* Shimmer */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                  animation: 'splash-shimmer 1.6s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes splash-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes splash-glow {
          0% { transform: translate(-50%, calc(-50% - 60px)) scale(1); opacity: 1; }
          100% { transform: translate(-50%, calc(-50% - 60px)) scale(1.12); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};
