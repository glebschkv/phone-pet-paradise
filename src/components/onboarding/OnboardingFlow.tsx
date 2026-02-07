import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// ─── Step indicator dots ────────────────────────────────────────────────────

const StepDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-2 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        initial={false}
        animate={{
          width: i === current ? 20 : 8,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="h-2 rounded-full"
        style={{
          backgroundColor:
            i === current
              ? 'hsl(210 50% 55%)'
              : i < current
                ? 'hsl(210 35% 70%)'
                : 'hsl(210 15% 82%)',
        }}
      />
    ))}
  </div>
);

// ─── Pixel icon with fallback ───────────────────────────────────────────────

const PixelIcon = ({ src, fallback }: { src: string; fallback: string }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="text-xl leading-none">{fallback}</span>;
  }

  return (
    <img
      src={src}
      alt=""
      className="w-7 h-7"
      style={{ imageRendering: 'pixelated' }}
      onError={() => setFailed(true)}
    />
  );
};

// ─── Walking pet sprite ─────────────────────────────────────────────────────

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
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};

// ─── Snow platform (matches starting biome) ─────────────────────────────────

const SnowPlatform = ({ children }: { children?: React.ReactNode }) => (
  <div className="relative w-full flex flex-col items-center">
    <div className="relative z-10 -mb-3">{children}</div>
    <div
      className="w-48 sm:w-56 h-7 sm:h-8 rounded-lg"
      style={{
        background: 'linear-gradient(180deg, hsl(200 30% 92%) 0%, hsl(210 25% 82%) 40%, hsl(220 20% 65%) 100%)',
        boxShadow: 'inset 0 2px 0 hsl(200 40% 96%), 0 4px 8px hsl(0 0% 0% / 0.12)',
        border: '2px solid hsl(210 20% 75%)',
      }}
    />
    <div className="w-40 sm:w-48 h-2 rounded-full bg-black/8 blur-sm -mt-0.5" />
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Main OnboardingFlow — streamlined 3-step intro
// ═════════════════════════════════════════════════════════════════════════════

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const skipOnboarding = useOnboardingStore((s) => s.skipOnboarding);

  const totalSteps = 3;

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

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      nextStep();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      prevStep();
    }
  };

  const slideVariants = {
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
        return <StepReady />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Soft winter sky background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, hsl(215 40% 78%) 0%, hsl(210 35% 85%) 35%, hsl(200 25% 90%) 65%, hsl(220 20% 92%) 100%)',
        }}
      />

      {/* Subtle snow/cloud wisps */}
      <div className="absolute top-[8%] left-[10%] w-20 h-6 rounded-full bg-white/35 blur-sm" />
      <div className="absolute top-[5%] right-[15%] w-24 h-7 rounded-full bg-white/30 blur-sm" />
      <div className="absolute top-[14%] left-[50%] w-14 h-5 rounded-full bg-white/25 blur-sm" />

      <div className="relative h-full flex flex-col max-w-md mx-auto px-5">
        {/* Top: Step dots */}
        <div className="pt-safe flex-shrink-0 flex justify-center pt-6 pb-4">
          <StepDots current={currentStep} total={totalSteps} />
        </div>

        {/* Middle: Content */}
        <div className="flex-1 min-h-0 flex items-center overflow-y-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="w-full touch-pan-y"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: Navigation */}
        <div className="flex-shrink-0 pb-safe pb-6 pt-4 space-y-3">
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 text-sm transition-opacity ${
                currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              style={{ color: 'hsl(220 20% 45%)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={nextStep}
              size="lg"
              className="font-semibold tracking-wide border-0"
              style={{
                background: 'linear-gradient(180deg, hsl(210 55% 58%) 0%, hsl(215 50% 48%) 100%)',
                border: '2px solid hsl(215 45% 40%)',
                boxShadow: 'inset 0 1px 0 hsl(210 60% 72%), 0 3px 8px hsl(220 40% 20% / 0.2)',
                color: 'white',
              }}
            >
              <span className="flex items-center gap-2">
                {currentStep === totalSteps - 1 ? "Let's Go" : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </span>
            </Button>
          </div>

          {currentStep === 0 && (
            <button
              onClick={() => { skipOnboarding(); onComplete(); }}
              className="w-full text-center text-xs py-2"
              style={{ color: 'hsl(220 15% 60%)' }}
            >
              Skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// Step 1: Welcome
// ═════════════════════════════════════════════════════════════════════════════

const StepWelcome = () => (
  <div className="text-center space-y-5">
    <div className="space-y-2">
      <h1
        className="text-3xl font-bold"
        style={{ color: 'hsl(220 30% 18%)' }}
      >
        Welcome to NoMo
      </h1>
      <p className="text-base px-4 leading-relaxed" style={{ color: 'hsl(220 15% 42%)' }}>
        Put your phone down, collect pets, and watch your world grow.
      </p>
    </div>

    <div className="py-4">
      <SnowPlatform>
        <WalkingPetSprite
          spritePath="/assets/sprites/humanoid/mushroom-kid-walk.png"
          frameCount={6}
          frameWidth={64}
          frameHeight={64}
          scale={1.8}
        />
      </SnowPlatform>
    </div>

    <p
      className="text-sm px-6 leading-relaxed"
      style={{ color: 'hsl(220 12% 52%)' }}
    >
      Every focus session earns you XP to unlock new pets and biomes.
    </p>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Step 2: How It Works
// ═════════════════════════════════════════════════════════════════════════════

const StepHowItWorks = () => (
  <div className="text-center space-y-5">
    <div className="space-y-2">
      <h1
        className="text-3xl font-bold"
        style={{ color: 'hsl(220 30% 18%)' }}
      >
        How it works
      </h1>
      <p className="text-base" style={{ color: 'hsl(220 15% 42%)' }}>
        Three simple steps
      </p>
    </div>

    <div className="space-y-2.5 px-1">
      {[
        {
          icon: '/assets/icons/clock.png',
          fallback: '\u23F1',
          label: 'Start a focus session',
          sub: 'Set a timer and put your phone aside',
        },
        {
          icon: '/assets/icons/star.png',
          fallback: '\u2B50',
          label: 'Earn XP as you focus',
          sub: 'Every minute counts toward leveling up',
        },
        {
          icon: '/assets/icons/paw.png',
          fallback: '\uD83D\uDC3E',
          label: 'Unlock new pets & biomes',
          sub: '50+ creatures across 6 worlds to discover',
        },
      ].map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, hsl(210 20% 96%) 0%, hsl(210 15% 93%) 100%)',
              border: '1.5px solid hsl(210 15% 85%)',
              boxShadow: 'inset 0 1px 0 white, 0 1px 3px hsl(0 0% 0% / 0.04)',
            }}
          >
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
              <PixelIcon src={step.icon} fallback={step.fallback} />
            </div>
            <div className="text-left min-w-0">
              <p
                className="text-sm font-semibold leading-snug"
                style={{ color: 'hsl(220 25% 18%)' }}
              >
                {step.label}
              </p>
              <p
                className="text-xs leading-snug"
                style={{ color: 'hsl(220 12% 50%)' }}
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
// Step 3: Ready to Start
// ═════════════════════════════════════════════════════════════════════════════

const StepReady = () => (
  <div className="text-center space-y-5">
    <div className="space-y-2">
      <h1
        className="text-3xl font-bold"
        style={{ color: 'hsl(220 30% 18%)' }}
      >
        You're all set
      </h1>
      <p className="text-base px-4 leading-relaxed" style={{ color: 'hsl(220 15% 42%)' }}>
        Your first pet is waiting for you. Start a focus session to begin collecting.
      </p>
    </div>

    <div className="py-3">
      <SnowPlatform>
        <WalkingPetSprite
          spritePath="/assets/sprites/humanoid/bunny-hood-walk.png"
          frameCount={6}
          frameWidth={64}
          frameHeight={64}
          scale={1.8}
        />
      </SnowPlatform>
    </div>

    {/* Stats */}
    <div className="flex justify-center gap-2.5 px-2">
      {[
        { value: '50+', label: 'Pets' },
        { value: '6', label: 'Biomes' },
        { value: '\u221E', label: 'Sessions' },
      ].map((stat) => (
        <div
          key={stat.label}
          className="flex-1 py-2.5 px-1.5 rounded-xl text-center"
          style={{
            background: 'hsl(210 18% 95%)',
            border: '1.5px solid hsl(210 12% 85%)',
          }}
        >
          <p
            className="text-lg font-bold leading-tight"
            style={{ color: 'hsl(215 45% 45%)' }}
          >
            {stat.value}
          </p>
          <p
            className="text-[10px] leading-tight mt-0.5"
            style={{ color: 'hsl(220 12% 52%)' }}
          >
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  </div>
);
