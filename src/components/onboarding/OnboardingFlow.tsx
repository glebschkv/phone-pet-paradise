import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// ─── Preload images on mount ────────────────────────────────────────────────

const PRELOAD_SRCS = [
  '/assets/sprites/humanoid/star-wizard-walk.png',
  '/assets/worlds/snowbiome1.png',
  '/assets/worlds/meadowbiome.png',
  '/assets/worlds/NIGHT_LAVENDER.png',
  '/assets/worlds/autumnbiome1.png',
  '/assets/worlds/junglerealbackground.png',
  '/assets/worlds/CITY_NIGHT.png',
  '/assets/icons/wizard.png',
];

function usePreloadImages(srcs: string[]) {
  useEffect(() => {
    srcs.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─── Floating particles — pure CSS ─────────────────────────────────────────

interface ParticleConfig {
  id: number;
  left: string;
  size: number;
  opacity: number;
  dur: string;
  delay: string;
}

function generateParticles(): ParticleConfig[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: `${5 + Math.random() * 90}%`,
    size: 1.5 + Math.random() * 2,
    opacity: 0.25 + Math.random() * 0.35,
    dur: `${10 + Math.random() * 14}s`,
    delay: `${-Math.random() * 16}s`,
  }));
}

const FloatingParticles = memo(() => {
  const particles = useMemo(generateParticles, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: '-1%',
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            borderRadius: '50%',
            background: '#fff',
            animationName: 'onb-fall',
            animationDuration: p.dur,
            animationDelay: p.delay,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
});
FloatingParticles.displayName = 'FloatingParticles';

// ─── Sparkles around wizard ─────────────────────────────────────────────────

function generateSparkles() {
  return Array.from({ length: 5 }, (_, i) => {
    const angle = i * 72 + Math.random() * 15;
    const dist = 40 + Math.random() * 15;
    return {
      id: i,
      tx: Math.cos((angle * Math.PI) / 180) * dist,
      ty: Math.sin((angle * Math.PI) / 180) * dist,
      size: 2.5 + Math.random() * 1.5,
      delay: `${i * 0.5}s`,
    };
  });
}

const SparkleRing = memo(() => {
  const sparkles = useMemo(generateSparkles, []);
  return (
    <div className="absolute inset-0 pointer-events-none">
      {sparkles.map((s) => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: 'rgba(168,85,247,0.9)',
            boxShadow: '0 0 4px rgba(168,85,247,0.6)',
            '--sp-tx': `${s.tx}px`,
            '--sp-ty': `${s.ty}px`,
            animationName: 'onb-sparkle',
            animationDuration: '3s',
            animationDelay: s.delay,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            willChange: 'transform, opacity',
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});
SparkleRing.displayName = 'SparkleRing';

// ─── Step dots ──────────────────────────────────────────────────────────────

const StepDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-2 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        initial={false}
        animate={{
          width: i === current ? 20 : 6,
          opacity: i === current ? 1 : 0.3,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          height: 6,
          borderRadius: 3,
          background: i === current ? '#a855f7' : 'rgba(168,140,210,0.4)',
        }}
      />
    ))}
  </div>
);

// ─── Walking sprite ─────────────────────────────────────────────────────────

const WalkingSprite = memo(({
  src,
  frames,
  w,
  h,
  scale,
}: {
  src: string;
  frames: number;
  w: number;
  h: number;
  scale: number;
}) => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % frames), 150);
    return () => clearInterval(id);
  }, [frames]);

  return (
    <div className="flex items-center justify-center">
      <div
        style={{
          width: w * scale,
          height: h * scale,
          backgroundImage: `url(${src})`,
          backgroundPosition: `-${frame * w * scale}px 0`,
          backgroundSize: `${frames * w * scale}px ${h * scale}px`,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
});
WalkingSprite.displayName = 'WalkingSprite';

// ═════════════════════════════════════════════════════════════════════════════
// OnboardingFlow
// ═════════════════════════════════════════════════════════════════════════════

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  usePreloadImages(PRELOAD_SRCS);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(0);
  const skip = useOnboardingStore((s) => s.skipOnboarding);
  const total = 3;

  const next = useCallback(() => {
    if (step < total - 1) { setDir(1); setStep(step + 1); }
    else onComplete();
  }, [step, onComplete]);

  const prev = useCallback(() => {
    if (step > 0) { setDir(-1); setStep(step - 1); }
  }, [step]);

  const onDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -50 || info.velocity.x < -500) next();
    else if (info.offset.x > 50 || info.velocity.x > 500) prev();
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 280 : -280, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -280 : 280, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <Keyframes />

      {/* Background — matches splash screen palette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #080012 0%, #16042a 40%, #0e0020 100%)',
        }}
      />

      {/* Scanline texture — same as splash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          background:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)',
        }}
      />

      {/* Center glow */}
      <div
        className="absolute top-[30%] left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 320,
          height: 320,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(168,85,247,0.14) 0%, rgba(126,34,206,0.04) 50%, transparent 70%)',
        }}
      />

      <FloatingParticles />

      <div className="relative h-full flex flex-col max-w-md mx-auto px-6">
        {/* Step dots */}
        <div
          className="flex-shrink-0 flex justify-center pb-3"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px) + 12px, 24px)' }}
        >
          <StepDots current={step} total={total} />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex items-center overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={onDragEnd}
              dragMomentum={false}
              className="w-full touch-pan-y"
            >
              {step === 0 && <ScreenWelcome />}
              {step === 1 && <ScreenWorlds />}
              {step === 2 && <ScreenCompanion />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div
          className="flex-shrink-0 pt-3"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 8px, 24px)' }}
        >
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={prev}
              className={`flex items-center gap-1 text-sm rounded-xl active:scale-95 transition-transform ${
                step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              style={{
                color: 'rgba(168,140,210,0.6)',
                minHeight: 44,
                minWidth: 44,
                padding: '0 12px',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={next}
              className="active:scale-[0.97] transition-transform"
              style={{
                minHeight: 48,
                minWidth: step === total - 1 ? 200 : 160,
                padding: '0 28px',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: '0.3px',
                color: '#fff',
                background: 'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)',
                border: '1px solid rgba(168,85,247,0.4)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 #5b21b6, 0 6px 16px rgba(88,28,135,0.4)',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                {step === total - 1 ? 'Begin Adventure' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          </div>

          {step === 0 && (
            <button
              onClick={() => { skip(); onComplete(); }}
              className="w-full text-center active:opacity-30 transition-opacity"
              style={{
                color: 'rgba(168,140,210,0.3)',
                fontSize: 12,
                minHeight: 44,
                lineHeight: '44px',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Keyframes ──────────────────────────────────────────────────────────────

const Keyframes = memo(() => (
  <style>{`
    @keyframes onb-fall {
      0%   { transform: translate3d(0,0,0); }
      100% { transform: translate3d(0, calc(100vh + 10px), 0); }
    }
    @keyframes onb-sparkle {
      0%   { transform: translate3d(0,0,0) scale(0); opacity: 0; }
      40%  { transform: translate3d(var(--sp-tx),var(--sp-ty),0) scale(1); opacity: 0.8; }
      100% { transform: translate3d(0,0,0) scale(0); opacity: 0; }
    }
  `}</style>
));
Keyframes.displayName = 'Keyframes';

// ═════════════════════════════════════════════════════════════════════════════
// Screen 1 — Welcome
// ═════════════════════════════════════════════════════════════════════════════

const ScreenWelcome = () => (
  <div className="text-center">
    {/* Title — matching splash screen style */}
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
    >
      <h1
        style={{
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: 8,
          color: '#f0e6ff',
          textShadow: '0 0 20px rgba(168,85,247,0.4), 0 0 50px rgba(168,85,247,0.15)',
        }}
      >
        NOMO
      </h1>
      <p
        style={{
          marginTop: 8,
          fontSize: 15,
          color: 'rgba(168,140,210,0.65)',
          letterSpacing: 0.5,
        }}
      >
        Focus more. Collect them all.
      </p>
    </motion.div>

    {/* Wizard */}
    <motion.div
      className="relative mt-10 mb-6"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.5, type: 'spring' }}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 65%)',
        }}
      />
      <div className="relative">
        <SparkleRing />
        <WalkingSprite
          src="/assets/sprites/humanoid/star-wizard-walk.png"
          frames={6} w={64} h={64} scale={2.5}
        />
      </div>
      <div
        className="mx-auto mt-1"
        style={{
          width: 60,
          height: 8,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.15) 0%, transparent 70%)',
        }}
      />
    </motion.div>

    {/* Snow biome peek — shows the real game world */}
    <motion.div
      className="mx-auto overflow-hidden"
      style={{
        maxWidth: 280,
        height: 80,
        borderRadius: 16,
        border: '1px solid rgba(168,85,247,0.15)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
    >
      <img
        src="/assets/worlds/snowbiome1.png"
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 30%',
          imageRendering: 'pixelated',
          opacity: 0.6,
        }}
      />
    </motion.div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Screen 2 — Worlds
// ═════════════════════════════════════════════════════════════════════════════

const biomes = [
  { name: 'Snow',    img: '/assets/worlds/snowbiome1.png',          pos: 'center 25%' },
  { name: 'Meadow',  img: '/assets/worlds/meadowbiome.png',         pos: 'center 30%' },
  { name: 'Night',   img: '/assets/worlds/NIGHT_LAVENDER.png',      pos: 'center 20%' },
  { name: 'Jungle',  img: '/assets/worlds/junglerealbackground.png', pos: 'center 30%' },
  { name: 'Sunset',  img: '/assets/worlds/autumnbiome1.png',        pos: 'center 25%' },
  { name: 'City',    img: '/assets/worlds/CITY_NIGHT.png',          pos: 'center 30%' },
];

const ScreenWorlds = () => (
  <div>
    <motion.div
      className="text-center mb-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <h2
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#f0e6ff',
          letterSpacing: 0.5,
        }}
      >
        6 worlds to explore
      </h2>
      <p
        style={{
          marginTop: 6,
          fontSize: 14,
          color: 'rgba(168,140,210,0.5)',
        }}
      >
        Each one full of creatures to discover
      </p>
    </motion.div>

    {/* 2x3 biome grid */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}
    >
      {biomes.map((b, i) => (
        <motion.div
          key={b.name}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 200, damping: 18 }}
          style={{
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            height: 88,
            border: '1px solid rgba(168,85,247,0.12)',
          }}
        >
          <img
            src={b.img}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: b.pos,
              imageRendering: 'pixelated',
            }}
          />
          {/* Gradient overlay for label legibility */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 60%)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: 8,
              left: 10,
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: 0.3,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {b.name}
          </span>
        </motion.div>
      ))}
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Screen 3 — Your Companion
// ═════════════════════════════════════════════════════════════════════════════

const ScreenCompanion = () => (
  <div className="text-center">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <h2
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#f0e6ff',
          letterSpacing: 0.5,
        }}
      >
        Your first companion
      </h2>
    </motion.div>

    {/* Wizard — big reveal */}
    <motion.div
      className="relative mt-8 mb-6"
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 120 }}
    >
      {/* Glow burst */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 65%)',
        }}
      />
      <div className="relative">
        <SparkleRing />
        <WalkingSprite
          src="/assets/sprites/humanoid/star-wizard-walk.png"
          frames={6} w={64} h={64} scale={3}
        />
      </div>
      <div
        className="mx-auto mt-1"
        style={{
          width: 80,
          height: 10,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.12) 0%, transparent 70%)',
        }}
      />
    </motion.div>

    {/* Name + rarity — clean, no info dump */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <div className="flex items-center justify-center gap-2.5">
        <img
          src="/assets/icons/wizard.png"
          alt=""
          style={{ width: 22, height: 22, imageRendering: 'pixelated' }}
        />
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#f0e6ff',
          }}
        >
          Star Wizard
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 20,
            background: 'rgba(168,85,247,0.2)',
            color: '#c4b5fd',
            border: '1px solid rgba(168,85,247,0.25)',
            letterSpacing: 0.5,
          }}
        >
          RARE
        </span>
      </div>

      <p
        style={{
          marginTop: 10,
          fontSize: 14,
          color: 'rgba(168,140,210,0.5)',
          lineHeight: 1.5,
        }}
      >
        Start focusing to unlock 50+ more.
      </p>
    </motion.div>
  </div>
);
