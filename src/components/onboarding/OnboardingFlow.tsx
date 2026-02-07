import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// ─── Floating particles (stars / snowflakes) ────────────────────────────────

const Particle = ({ delay, x, size, duration, type }: {
  delay: number; x: number; size: number; duration: number; type: 'star' | 'snow';
}) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: -10 }}
    initial={{ y: -10, opacity: 0, rotate: 0 }}
    animate={{
      y: '110vh',
      opacity: [0, 0.8, 0.8, 0],
      rotate: type === 'snow' ? 360 : 0,
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  >
    {type === 'star' ? (
      <div
        style={{
          width: size,
          height: size,
          background: 'radial-gradient(circle, rgba(255,220,150,0.9) 0%, rgba(255,180,80,0) 70%)',
          borderRadius: '50%',
          boxShadow: `0 0 ${size * 2}px rgba(255,200,100,0.3)`,
        }}
      />
    ) : (
      <div
        style={{
          width: size,
          height: size,
          background: 'rgba(255,255,255,0.6)',
          borderRadius: '50%',
          filter: 'blur(0.5px)',
        }}
      />
    )}
  </motion.div>
);

const FloatingParticles = () => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    delay: Math.random() * 8,
    x: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 6 + Math.random() * 8,
    type: (Math.random() > 0.5 ? 'star' : 'snow') as 'star' | 'snow',
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <Particle key={p.id} {...p} />
      ))}
    </div>
  );
};

// ─── Sparkle burst around wizard ─────────────────────────────────────────────

const SparkleRing = () => {
  const sparkles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i * 60) + Math.random() * 20,
    distance: 50 + Math.random() * 20,
    size: 3 + Math.random() * 3,
    delay: i * 0.3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            width: s.size,
            height: s.size,
          }}
          animate={{
            x: [0, Math.cos(s.angle * Math.PI / 180) * s.distance, 0],
            y: [0, Math.sin(s.angle * Math.PI / 180) * s.distance, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0],
          }}
          transition={{
            duration: 2.5,
            delay: s.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(255,220,120,1) 0%, rgba(255,180,60,0) 70%)',
              borderRadius: '50%',
              boxShadow: '0 0 6px rgba(255,200,100,0.6)',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

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
          backgroundColor: i === current
            ? 'rgba(255,255,255,0.95)'
            : 'rgba(255,255,255,0.4)',
          boxShadow: i === current
            ? '0 0 8px rgba(255,255,255,0.4)'
            : 'none',
        }}
      />
    ))}
  </div>
);

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

// ─── Pixel icon with fallback ───────────────────────────────────────────────

const PixelIcon = ({ src, fallback, size = 32 }: { src: string; fallback: string; size?: number }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="text-2xl leading-none">{fallback}</span>;
  }

  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      onError={() => setFailed(true)}
    />
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// Main OnboardingFlow
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
        return <StepMeetCompanion />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Immersive background — dark sky fading to snow biome feel */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(230 35% 14%) 0%, hsl(225 30% 22%) 25%, hsl(220 28% 32%) 50%, hsl(215 25% 45%) 70%, hsl(210 30% 60%) 85%, hsl(200 35% 75%) 100%)',
        }}
      />

      {/* Snow biome ground image at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[35%] opacity-30"
        style={{
          backgroundImage: 'url(/assets/worlds/snowbiome1.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)',
        }}
      />

      {/* Atmospheric glow */}
      <div
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(140,120,255,0.12) 0%, rgba(100,80,200,0.05) 50%, transparent 70%)',
        }}
      />

      {/* Floating particles */}
      <FloatingParticles />

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
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={nextStep}
              size="lg"
              className="font-semibold tracking-wide border-0 min-w-[160px]"
              style={{
                background: 'linear-gradient(180deg, hsl(260 65% 62%) 0%, hsl(265 55% 48%) 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(120,60,220,0.35), 0 2px 4px rgba(0,0,0,0.2)',
                color: 'white',
              }}
            >
              <span className="flex items-center gap-2">
                {currentStep === totalSteps - 1 ? 'Begin Adventure' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </span>
            </Button>
          </div>

          {currentStep === 0 && (
            <button
              onClick={() => { skipOnboarding(); onComplete(); }}
              className="w-full text-center text-xs py-2 transition-opacity active:opacity-50"
              style={{ color: 'rgba(255,255,255,0.35)' }}
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
          textShadow: '0 0 30px rgba(160,120,255,0.3), 0 2px 4px rgba(0,0,0,0.3)',
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
      {/* Glow behind sprite */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(160,120,255,0.2) 0%, transparent 70%)',
          filter: 'blur(20px)',
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
      {/* Ground shadow */}
      <div
        className="mx-auto mt-1 rounded-full"
        style={{
          width: 80,
          height: 12,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
          filter: 'blur(3px)',
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

const steps = [
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
          textShadow: '0 0 30px rgba(160,120,255,0.3), 0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        How it works
      </h1>
      <p className="text-sm" style={{ color: 'rgba(200,210,240,0.6)' }}>
        Three simple steps to get started
      </p>
    </motion.div>

    <div className="space-y-3 px-1">
      {steps.map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div
            className="flex items-center gap-4 px-4 py-4 rounded-2xl backdrop-blur-md"
            style={{
              background: step.color,
              border: `1px solid ${step.borderColor}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Step number */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step.borderColor,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              {i + 1}
            </div>

            {/* Icon */}
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <PixelIcon src={step.icon} fallback={step.fallback} size={36} />
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
          textShadow: '0 0 30px rgba(160,120,255,0.3), 0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        Meet your companion
      </h1>
      <p className="text-base px-4 leading-relaxed" style={{ color: 'rgba(200,210,240,0.75)' }}>
        Star Wizard is ready for your first adventure together.
      </p>
    </motion.div>

    {/* Character reveal */}
    <motion.div
      className="py-4 relative"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.7, type: 'spring', stiffness: 150 }}
    >
      {/* Glow burst behind sprite */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 pointer-events-none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{
          background: 'radial-gradient(circle, rgba(160,120,255,0.25) 0%, rgba(120,80,220,0.1) 40%, transparent 70%)',
          filter: 'blur(24px)',
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
          height: 14,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
          filter: 'blur(4px)',
        }}
      />
    </motion.div>

    {/* Character card */}
    <motion.div
      className="mx-auto max-w-[260px] rounded-2xl px-5 py-4 backdrop-blur-md"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
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
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
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
            className="text-[10px] px-2 py-0.5 rounded-full"
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
