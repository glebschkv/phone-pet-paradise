import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Shield, Lock, Settings, Sparkles } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useDeviceActivity } from '@/hooks/useDeviceActivity';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Capacitor } from '@capacitor/core';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// ─── Preload critical images so sprites don't flash blank ────────────────────

const PRELOAD_SRCS = [
  '/assets/sprites/humanoid/star-wizard-walk.png',
  '/assets/worlds/snowbiome1.png',
  '/assets/icons/clock.png',
  '/assets/icons/star.png',
  '/assets/icons/paw.png',
  '/assets/icons/wizard.png',
];

function usePreloadImages(srcs: string[]) {
  useEffect(() => {
    srcs.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─── Floating particles — pure CSS for GPU performance ──────────────────────
// Uses CSS @keyframes + inline style for each particle instead of Framer Motion.
// This avoids 12+ concurrent JS-driven animation loops on mobile.

interface ParticleConfig {
  id: number;
  left: string;
  size: number;
  opacity: number;
  animDuration: string;
  animDelay: string;
  type: 'star' | 'snow';
}

function generateParticles(): ParticleConfig[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 3,
    opacity: 0.4 + Math.random() * 0.4,
    animDuration: `${8 + Math.random() * 10}s`,
    animDelay: `${-Math.random() * 12}s`,
    type: (i % 2 === 0 ? 'star' : 'snow') as 'star' | 'snow',
  }));
}

const FloatingParticles = memo(() => {
  // Stable across re-renders — generated once
  const particles = useMemo(generateParticles, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="onboarding-particle"
          style={{
            position: 'absolute',
            left: p.left,
            top: '-2%',
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            borderRadius: '50%',
            background: p.type === 'star'
              ? 'radial-gradient(circle, rgba(255,220,150,0.9) 0%, rgba(255,180,80,0) 70%)'
              : 'rgba(255,255,255,0.6)',
            boxShadow: p.type === 'star'
              ? `0 0 ${p.size * 2}px rgba(255,200,100,0.25)`
              : 'none',
            animationName: 'onboarding-fall',
            animationDuration: p.animDuration,
            animationDelay: p.animDelay,
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

// ─── Sparkle burst around wizard — CSS-driven ───────────────────────────────

interface SparkleConfig {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: string;
  duration: string;
}

function generateSparkles(): SparkleConfig[] {
  return Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i * 60) + Math.random() * 20,
    distance: 45 + Math.random() * 20,
    size: 3 + Math.random() * 2,
    delay: `${i * 0.4}s`,
    duration: '2.5s',
  }));
}

const SparkleRing = memo(() => {
  const sparkles = useMemo(generateSparkles, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {sparkles.map((s) => {
        const tx = Math.cos((s.angle * Math.PI) / 180) * s.distance;
        const ty = Math.sin((s.angle * Math.PI) / 180) * s.distance;
        return (
          <div
            key={s.id}
            className="onboarding-sparkle"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,220,120,1) 0%, rgba(255,180,60,0) 70%)',
              boxShadow: '0 0 6px rgba(255,200,100,0.5)',
              // Custom properties drive the CSS keyframes
              '--sparkle-tx': `${tx}px`,
              '--sparkle-ty': `${ty}px`,
              animationName: 'onboarding-sparkle',
              animationDuration: s.duration,
              animationDelay: s.delay,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              willChange: 'transform, opacity',
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
});
SparkleRing.displayName = 'SparkleRing';

// ─── Step indicator dots ────────────────────────────────────────────────────

const StepDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-2.5 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        initial={false}
        animate={{
          width: i === current ? 24 : 8,
          opacity: i === current ? 1 : i < current ? 0.6 : 0.3,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="h-2 rounded-full"
        style={{
          backgroundColor:
            i === current
              ? 'rgba(255,255,255,0.95)'
              : 'rgba(255,255,255,0.4)',
          boxShadow:
            i === current ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
        }}
      />
    ))}
  </div>
);

// ─── Walking pet sprite ─────────────────────────────────────────────────────

const SPRITE_IMAGE_RENDERING: React.CSSProperties = {
  // Standard
  imageRendering: 'pixelated',
  // Safari fallback — typed as `any` because React CSSProperties
  // doesn't include the -webkit- vendor prefix
  ...(({ '-webkit-image-rendering': 'pixelated' } as unknown) as React.CSSProperties),
};

const WalkingPetSprite = ({
  spritePath,
  frameCount,
  frameWidth,
  frameHeight,
  scale = 2,
}: {
  spritePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  scale?: number;
}) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, 150);
    return () => clearInterval(interval);
  }, [frameCount]);

  return (
    <div className="flex items-center justify-center">
      <div
        style={{
          width: frameWidth * scale,
          height: frameHeight * scale,
          backgroundImage: `url(${spritePath})`,
          backgroundPosition: `-${frame * frameWidth * scale}px 0px`,
          backgroundSize: `${frameCount * frameWidth * scale}px ${frameHeight * scale}px`,
          ...SPRITE_IMAGE_RENDERING,
        }}
      />
    </div>
  );
};

// ─── Pixel icon with fallback ───────────────────────────────────────────────

const PixelIcon = ({
  src,
  fallback,
  size = 32,
}: {
  src: string;
  fallback: string;
  size?: number;
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="text-2xl leading-none">{fallback}</span>;
  }

  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size, ...SPRITE_IMAGE_RENDERING }}
      onError={() => setFailed(true)}
    />
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// Main OnboardingFlow
// ═════════════════════════════════════════════════════════════════════════════

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  usePreloadImages(PRELOAD_SRCS);
  const prefersReducedMotion = useReducedMotion();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const skipOnboarding = useOnboardingStore((s) => s.skipOnboarding);

  const isNativePlatform = Capacitor.isNativePlatform();
  // Show Focus Shield step only on native iOS/Android
  const totalSteps = isNativePlatform ? 4 : 3;

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  }, [currentStep, totalSteps, onComplete]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    if (
      info.offset.x < -swipeThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      nextStep();
    } else if (
      info.offset.x > swipeThreshold ||
      info.velocity.x > velocityThreshold
    ) {
      prevStep();
    }
  };

  const slideVariants = prefersReducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
      };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepWelcome />;
      case 1:
        return <StepHowItWorks />;
      case 2:
        return isNativePlatform ? <StepFocusShield /> : <StepMeetCompanion />;
      case 3:
        return <StepMeetCompanion />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Inject CSS keyframes once */}
      <OnboardingKeyframes />

      {/* Immersive background — dark sky fading to snow biome feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, hsl(230 35% 14%) 0%, hsl(225 30% 22%) 25%, hsl(220 28% 32%) 50%, hsl(215 25% 45%) 70%, hsl(210 30% 60%) 85%, hsl(200 35% 75%) 100%)',
        }}
      />

      {/* Snow biome ground image at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '35%',
          opacity: 0.3,
          backgroundImage: 'url(/assets/worlds/snowbiome1.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 40%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 40%)',
        }}
      />

      {/* Atmospheric glow — uses box-shadow trick instead of filter:blur */}
      <div
        className="absolute top-[20%] left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(140,120,255,0.12) 0%, rgba(100,80,200,0.05) 50%, transparent 70%)',
        }}
      />

      {/* Floating particles — pure CSS, GPU-accelerated */}
      <FloatingParticles />

      <div className="relative h-full flex flex-col max-w-md mx-auto px-5">
        {/* Top: Step dots — respects safe area on notched phones */}
        <div
          className="flex-shrink-0 flex justify-center pb-4"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px) + 12px, 24px)',
          }}
        >
          <StepDots current={currentStep} total={totalSteps} />
        </div>

        {/* Middle: Content — overflow-hidden prevents iOS rubber-band bounce */}
        <div className="flex-1 min-h-0 flex items-center overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={prefersReducedMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 300, damping: 30 }}
              drag={prefersReducedMotion ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="w-full touch-pan-y"
              // Prevent drag from triggering near screen edges (iOS back gesture)
              dragListener
              dragMomentum={false}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: Navigation — safe area with sane max() padding */}
        <div
          className="flex-shrink-0 pt-4 space-y-2"
          style={{
            paddingBottom:
              'max(env(safe-area-inset-bottom, 0px) + 8px, 24px)',
          }}
        >
          <div className="flex justify-between items-center gap-4">
            {/* Back button — min 44px tap target */}
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 text-sm transition-all duration-200 rounded-xl active:scale-95 ${
                currentStep === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'opacity-100'
              }`}
              style={{
                color: 'rgba(255,255,255,0.6)',
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

            {/* Primary CTA — 48px tall, prominent active state */}
            <Button
              onClick={nextStep}
              size="lg"
              className="font-semibold tracking-wide border-0 min-w-[160px] active:scale-[0.97] transition-transform duration-150"
              style={{
                background:
                  'linear-gradient(180deg, hsl(260 65% 62%) 0%, hsl(265 55% 48%) 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(120,60,220,0.35), 0 2px 4px rgba(0,0,0,0.2)',
                color: 'white',
                minHeight: 48,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              <span className="flex items-center gap-2">
                {currentStep === totalSteps - 1
                  ? 'Begin Adventure'
                  : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </span>
            </Button>
          </div>

          {/* Skip — 44px minimum tap target */}
          {currentStep === 0 && (
            <button
              onClick={() => {
                skipOnboarding();
                onComplete();
              }}
              className="w-full text-center text-xs transition-opacity duration-150 active:opacity-30"
              style={{
                color: 'rgba(255,255,255,0.35)',
                minHeight: 44,
                lineHeight: '44px',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              Skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── CSS keyframes injected once ────────────────────────────────────────────
// Keeps all particle/sparkle animation on the GPU via transform3d.

const OnboardingKeyframes = memo(() => (
  <style>{`
    @keyframes onboarding-fall {
      0%   { transform: translate3d(0, 0, 0); opacity: 0; }
      5%   { opacity: 1; }
      90%  { opacity: 1; }
      100% { transform: translate3d(0, calc(100vh + 20px), 0); opacity: 0; }
    }
    @keyframes onboarding-sparkle {
      0%   { transform: translate3d(0, 0, 0) scale(0); opacity: 0; }
      40%  { transform: translate3d(var(--sparkle-tx), var(--sparkle-ty), 0) scale(1.2); opacity: 1; }
      100% { transform: translate3d(0, 0, 0) scale(0); opacity: 0; }
    }
  `}</style>
));
OnboardingKeyframes.displayName = 'OnboardingKeyframes';

// ═════════════════════════════════════════════════════════════════════════════
// Step 1: Welcome — "Your adventure begins"
// ═════════════════════════════════════════════════════════════════════════════

const StepWelcome = () => (
  <div className="text-center space-y-6">
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6 }}
    >
      <h1
        className="text-4xl font-extrabold tracking-tight"
        style={{
          color: 'rgba(255,255,255,0.95)',
          textShadow:
            '0 0 30px rgba(160,120,255,0.3), 0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        Welcome to NoMo
      </h1>
      <p
        className="text-base px-2 leading-relaxed"
        style={{ color: 'rgba(200,210,240,0.8)' }}
      >
        Put your phone down. Watch your world come alive.
      </p>
    </motion.div>

    <motion.div
      className="py-6 relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
    >
      {/* Glow behind sprite — gradient only, no filter:blur */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(160,120,255,0.18) 0%, transparent 65%)',
        }}
      />
      <div className="relative">
        <SparkleRing />
        <WalkingPetSprite
          spritePath="/assets/sprites/humanoid/star-wizard-walk.png"
          frameCount={6}
          frameWidth={64}
          frameHeight={64}
          scale={2.5}
        />
      </div>
      {/* Ground shadow — simple gradient, no filter:blur */}
      <div
        className="mx-auto mt-1 rounded-full"
        style={{
          width: 80,
          height: 10,
          background:
            'radial-gradient(ellipse, rgba(0,0,0,0.2) 0%, transparent 70%)',
        }}
      />
    </motion.div>

    <motion.p
      className="text-sm px-8 leading-relaxed"
      style={{ color: 'rgba(180,190,220,0.65)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      Collect magical companions, unlock new worlds, and grow your focus.
    </motion.p>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Step 2: How It Works — glass cards with stagger
// ═════════════════════════════════════════════════════════════════════════════

const howItWorksSteps = [
  {
    icon: '/assets/icons/clock.png',
    fallback: '\u23F1',
    label: 'Start a focus session',
    sub: 'Set a timer and put your phone aside',
    color: 'rgba(100,180,255,0.15)',
    borderColor: 'rgba(100,180,255,0.2)',
  },
  {
    icon: '/assets/icons/star.png',
    fallback: '\u2B50',
    label: 'Earn XP as you focus',
    sub: 'Every minute counts toward leveling up',
    color: 'rgba(255,200,80,0.12)',
    borderColor: 'rgba(255,200,80,0.2)',
  },
  {
    icon: '/assets/icons/paw.png',
    fallback: '\uD83D\uDC3E',
    label: 'Unlock new companions',
    sub: '50+ creatures across 6 worlds to discover',
    color: 'rgba(200,120,255,0.12)',
    borderColor: 'rgba(200,120,255,0.2)',
  },
];

const StepHowItWorks = () => (
  <div className="text-center space-y-6">
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
    >
      <h1
        className="text-4xl font-extrabold tracking-tight"
        style={{
          color: 'rgba(255,255,255,0.95)',
          textShadow:
            '0 0 30px rgba(160,120,255,0.3), 0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        How it works
      </h1>
      <p className="text-sm" style={{ color: 'rgba(200,210,240,0.6)' }}>
        Three simple steps to get started
      </p>
    </motion.div>

    <div className="space-y-3 px-1">
      {howItWorksSteps.map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2 + i * 0.12,
            type: 'spring',
            stiffness: 200,
            damping: 20,
          }}
        >
          <div
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl backdrop-blur-sm"
            style={{
              background: step.color,
              border: `1px solid ${step.borderColor}`,
              boxShadow:
                '0 2px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Step number */}
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step.borderColor,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              {i + 1}
            </div>

            {/* Icon */}
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
              <PixelIcon src={step.icon} fallback={step.fallback} size={32} />
            </div>

            {/* Text */}
            <div className="text-left min-w-0 flex-1">
              <p
                className="text-sm font-semibold leading-snug"
                style={{ color: 'rgba(255,255,255,0.9)' }}
              >
                {step.label}
              </p>
              <p
                className="text-xs leading-snug mt-0.5"
                style={{ color: 'rgba(200,210,240,0.55)' }}
              >
                {step.sub}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Step 3: Meet Your Companion
// ═════════════════════════════════════════════════════════════════════════════

const StepMeetCompanion = () => (
  <div className="text-center space-y-5">
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
    >
      <h1
        className="text-4xl font-extrabold tracking-tight"
        style={{
          color: 'rgba(255,255,255,0.95)',
          textShadow:
            '0 0 30px rgba(160,120,255,0.3), 0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        Meet your companion
      </h1>
      <p
        className="text-base px-4 leading-relaxed"
        style={{ color: 'rgba(200,210,240,0.75)' }}
      >
        Star Wizard is ready for your first adventure together.
      </p>
    </motion.div>

    {/* Character reveal */}
    <motion.div
      className="py-4 relative"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 0.25,
        duration: 0.7,
        type: 'spring',
        stiffness: 150,
      }}
    >
      {/* Glow burst behind sprite — no filter:blur, pure gradient */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{
          width: 220,
          height: 220,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(160,120,255,0.22) 0%, rgba(120,80,220,0.08) 40%, transparent 70%)',
        }}
      />

      <div className="relative">
        <SparkleRing />
        <WalkingPetSprite
          spritePath="/assets/sprites/humanoid/star-wizard-walk.png"
          frameCount={6}
          frameWidth={64}
          frameHeight={64}
          scale={3}
        />
      </div>

      {/* Ground shadow */}
      <div
        className="mx-auto mt-1 rounded-full"
        style={{
          width: 100,
          height: 12,
          background:
            'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
        }}
      />
    </motion.div>

    {/* Character card */}
    <motion.div
      className="mx-auto max-w-[260px] rounded-2xl px-5 py-4 backdrop-blur-sm"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow:
          '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <PixelIcon src="/assets/icons/wizard.png" fallback="" size={20} />
        <p
          className="text-lg font-bold"
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          Star Wizard
        </p>
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(160,120,255,0.2)',
            color: 'rgba(200,180,255,0.9)',
            border: '1px solid rgba(160,120,255,0.25)',
          }}
        >
          RARE
        </span>
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{ color: 'rgba(200,210,240,0.55)' }}
      >
        A young wizard in training who casts spells of concentration.
      </p>

      {/* Abilities */}
      <div className="flex gap-1.5 justify-center mt-3 flex-wrap">
        {['Magic Focus', 'Star Spell', 'Wizard Wisdom'].map((ability) => (
          <span
            key={ability}
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(200,210,240,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {ability}
          </span>
        ))}
      </div>
    </motion.div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Step: Focus Shield — Set up app blocking
// ═════════════════════════════════════════════════════════════════════════════

const shieldBenefits = [
  {
    icon: Shield,
    label: 'Auto-block distracting apps',
    sub: 'Activated when you start a focus session',
    color: 'rgba(160,120,255,0.15)',
    borderColor: 'rgba(160,120,255,0.25)',
  },
  {
    icon: Lock,
    label: 'Automatically unblocked',
    sub: 'Apps return when your session ends',
    color: 'rgba(120,100,220,0.12)',
    borderColor: 'rgba(120,100,220,0.2)',
  },
  {
    icon: Sparkles,
    label: 'Earn +25% bonus XP',
    sub: 'Extra rewards for distraction-free focus',
    color: 'rgba(200,120,255,0.12)',
    borderColor: 'rgba(200,120,255,0.2)',
  },
];

const StepFocusShield = () => {
  const {
    isPermissionGranted,
    isLoading,
    requestPermissions,
    openSettings,
    openAppPicker,
  } = useDeviceActivity();
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleEnable = async () => {
    setHasAttempted(true);
    await requestPermissions();
  };

  return (
    <div className="text-center space-y-6">
      {/* Title — same pattern as all other steps */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h1
          className="text-4xl font-extrabold tracking-tight"
          style={{
            color: 'rgba(255,255,255,0.95)',
            textShadow:
              '0 0 30px rgba(160,120,255,0.3), 0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          Focus Shield
        </h1>
        <p className="text-sm" style={{ color: 'rgba(200,210,240,0.6)' }}>
          Block distracting apps while you focus
        </p>
      </motion.div>

      {/* Shield icon with cosmic glow — matches sprite glow in Welcome/MeetCompanion */}
      <motion.div
        className="py-4 relative flex justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25, duration: 0.6, type: 'spring' }}
      >
        {/* Radial glow behind shield */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: isPermissionGranted
              ? 'radial-gradient(circle, rgba(140,180,255,0.2) 0%, transparent 65%)'
              : 'radial-gradient(circle, rgba(160,120,255,0.18) 0%, transparent 65%)',
          }}
        />
        <div
          className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: isPermissionGranted
              ? 'linear-gradient(180deg, rgba(140,180,255,0.25) 0%, rgba(120,100,220,0.15) 100%)'
              : 'linear-gradient(180deg, rgba(160,120,255,0.25) 0%, rgba(120,80,220,0.1) 100%)',
            border: `2px solid ${isPermissionGranted ? 'rgba(140,180,255,0.35)' : 'rgba(160,120,255,0.3)'}`,
            boxShadow: `0 4px 20px ${isPermissionGranted ? 'rgba(140,180,255,0.2)' : 'rgba(160,120,255,0.15)'}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          <Shield
            className="w-12 h-12"
            style={{ color: isPermissionGranted ? 'rgba(180,200,255,0.9)' : 'rgba(200,180,255,0.8)' }}
          />
        </div>
      </motion.div>

      {/* Benefits — staggered glass cards matching StepHowItWorks pattern */}
      <div className="space-y-3 px-1">
        {shieldBenefits.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.2 + i * 0.12,
                type: 'spring',
                stiffness: 200,
                damping: 20,
              }}
            >
              <div
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl backdrop-blur-sm"
                style={{
                  background: step.color,
                  border: `1px solid ${step.borderColor}`,
                  boxShadow:
                    '0 2px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: step.borderColor,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.9)' }} />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold leading-snug"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                  >
                    {step.label}
                  </p>
                  <p
                    className="text-xs leading-snug mt-0.5"
                    style={{ color: 'rgba(200,210,240,0.55)' }}
                  >
                    {step.sub}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action area */}
      <motion.div
        className="px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        {!isPermissionGranted ? (
          <div className="space-y-2.5">
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(180deg, hsl(260 65% 62%) 0%, hsl(265 55% 48%) 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(120,60,220,0.35)',
                color: 'white',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              {isLoading ? 'Requesting...' : 'Enable Focus Shield'}
            </button>
            {hasAttempted && (
              <button
                onClick={() => openSettings()}
                className="w-full py-3 px-4 rounded-2xl font-medium text-sm transition-all active:scale-[0.97]"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(200,210,240,0.7)',
                }}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Open Settings
              </button>
            )}
            <p className="text-xs" style={{ color: 'rgba(200,210,240,0.4)' }}>
              You can set this up later in Settings
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="py-3 px-4 rounded-2xl text-sm font-semibold backdrop-blur-sm"
              style={{
                background: 'rgba(140,180,255,0.12)',
                border: '1px solid rgba(140,180,255,0.25)',
                color: 'rgba(180,200,255,0.9)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              Focus Shield enabled
            </div>
            <button
              onClick={() => openAppPicker()}
              className="w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(180deg, hsl(260 65% 62%) 0%, hsl(265 55% 48%) 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(120,60,220,0.35)',
                color: 'white',
              }}
            >
              Select Apps to Block
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
