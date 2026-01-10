import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Timer,
  Heart,
  Sparkles,
  Star,
  ChevronRight,
  ChevronLeft,
  Zap
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// Animated pet sprite component
const AnimatedPet = ({
  spritePath,
  frameCount,
  frameWidth,
  frameHeight,
  delay = 0,
  speed = 150,
  scale = 1,
  startX = -100,
  y = 60
}: {
  spritePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  delay?: number;
  speed?: number;
  scale?: number;
  startX?: number;
  y?: number;
}) => {
  const [frame, setFrame] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % frameCount);
    }, speed);
    return () => clearInterval(interval);
  }, [isVisible, frameCount, speed]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ x: startX, opacity: 0 }}
      animate={{ x: '120vw', opacity: 1 }}
      transition={{
        x: { duration: 12, ease: 'linear', repeat: Infinity },
        opacity: { duration: 0.5 }
      }}
      className="absolute pointer-events-none"
      style={{ bottom: `${y}px`, transform: `scale(${scale})` }}
    >
      <div
        style={{
          width: frameWidth,
          height: frameHeight,
          backgroundImage: `url(${spritePath})`,
          backgroundPosition: `-${frame * frameWidth}px 0`,
          imageRendering: 'pixelated',
        }}
      />
    </motion.div>
  );
};

// Floating sparkle particles
const Sparkle = ({ delay }: { delay: number }) => {
  const randomX = Math.random() * 100;
  const randomDuration = 3 + Math.random() * 4;
  const randomSize = 4 + Math.random() * 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: '100vh', x: `${randomX}vw` }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: '-20vh',
      }}
      transition={{
        duration: randomDuration,
        delay,
        repeat: Infinity,
        ease: 'linear'
      }}
      className="absolute pointer-events-none"
    >
      <Star
        className="text-yellow-300/60"
        style={{ width: randomSize, height: randomSize }}
        fill="currentColor"
      />
    </motion.div>
  );
};

// Step indicator dots
const StepDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-2 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        initial={false}
        animate={{
          scale: i === current ? 1.2 : 1,
          backgroundColor: i === current
            ? 'hsl(var(--primary))'
            : i < current
              ? 'hsl(var(--primary) / 0.5)'
              : 'hsl(var(--muted-foreground) / 0.3)',
        }}
        className="w-2.5 h-2.5 rounded-full transition-colors"
      />
    ))}
  </div>
);

// Pet showcase carousel for step 3
const PetShowcase = () => {
  const pets = [
    { emoji: '🐸', name: 'Dewdrop Frog', color: 'from-green-400 to-emerald-500' },
    { emoji: '🌱', name: 'Sprout Bunny', color: 'from-lime-400 to-green-500' },
    { emoji: '🦊', name: 'Ember Fox', color: 'from-orange-400 to-red-500' },
    { emoji: '🦉', name: 'Dusk Owl', color: 'from-purple-400 to-indigo-500' },
    { emoji: '🐲', name: 'Baby Dragon', color: 'from-red-400 to-orange-500' },
  ];

  return (
    <div className="flex justify-center items-end gap-3 h-32">
      {pets.map((pet, i) => (
        <motion.div
          key={pet.name}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pet.color} flex items-center justify-center shadow-lg`}
          >
            <span className="text-2xl">{pet.emoji}</span>
          </motion.div>
          <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
            {pet.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

// Timer preview animation for step 2
const TimerPreview = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : p + 2));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-40 h-40 mx-auto">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />

      {/* Timer ring */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="6"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="url(#timerGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={264}
          strokeDashoffset={264 - (264 * progress) / 100}
        />
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Timer className="w-8 h-8 text-primary mb-1" />
        <span className="text-2xl font-bold text-foreground">25:00</span>
        <span className="text-xs text-muted-foreground">Focus Time</span>
      </div>

      {/* XP indicator */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="absolute -right-2 -top-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-2 py-1 flex items-center gap-1 shadow-lg"
      >
        <Zap className="w-3 h-3 text-white" />
        <span className="text-xs font-bold text-white">+50 XP</span>
      </motion.div>
    </div>
  );
};

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);


  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to',
      highlight: 'Pet Paradise',
      description: 'Build your magical island and care for adorable pixel pets',
      content: (
        <div className="relative h-48 flex items-center justify-center overflow-hidden">
          {/* Animated pets walking across */}
          <AnimatedPet
            spritePath="/assets/sprites/meadow/dewdrop-frog-walk.png"
            frameCount={6}
            frameWidth={64}
            frameHeight={64}
            delay={0}
            scale={1.5}
            y={20}
          />
          <AnimatedPet
            spritePath="/assets/sprites/sunset/ember-fox-walk.png"
            frameCount={6}
            frameWidth={64}
            frameHeight={64}
            delay={2000}
            scale={1.5}
            y={40}
          />
          <AnimatedPet
            spritePath="/assets/sprites/meadow/sprout-bunny-walk.png"
            frameCount={6}
            frameWidth={64}
            frameHeight={64}
            delay={4000}
            scale={1.5}
            y={60}
          />

          {/* Central heart icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="relative z-10"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-pink-500/30 backdrop-blur-sm flex items-center justify-center border border-primary/20 shadow-2xl">
              <Heart className="w-14 h-14 text-primary" fill="currentColor" />
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'timer',
      title: 'Focus to',
      highlight: 'Level Up',
      description: 'Complete focus sessions to earn XP and unlock new pets',
      content: <TimerPreview />,
    },
    {
      id: 'pets',
      title: 'Collect',
      highlight: 'Cute Pets',
      description: 'Discover 30+ unique creatures across 7 magical biomes',
      content: <PetShowcase />,
    },
    {
      id: 'ready',
      title: 'Ready to',
      highlight: 'Begin?',
      description: 'Your paradise awaits. Start focusing and watch it grow!',
      content: (
        <div className="relative h-48 flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="relative"
          >
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-16 h-16 text-white" />
            </div>
            {/* Orbiting elements */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 2.67
                }}
                className="absolute inset-0"
                style={{ transformOrigin: 'center center' }}
              >
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg"
                >
                  <Star className="w-4 h-4 text-yellow-900" fill="currentColor" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ),
    },
  ];

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  }, [currentStep, steps.length, onComplete]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Handle swipe gestures
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
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.15) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Floating sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <Sparkle key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 max-w-md mx-auto">
        {/* Step dots - top */}
        <div className="absolute top-safe-top pt-8">
          <StepDots current={currentStep} total={steps.length} />
        </div>

        {/* Content area */}
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
            <div className="text-center space-y-6">
              {/* Title */}
              <div className="space-y-1">
                <h1 className="text-2xl font-medium text-muted-foreground">
                  {steps[currentStep].title}
                </h1>
                <motion.h2
                  className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {steps[currentStep].highlight}
                </motion.h2>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-lg px-4">
                {steps[currentStep].description}
              </p>

              {/* Step-specific content */}
              <div className="py-4">
                {steps[currentStep].content}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons - bottom */}
        <div className="absolute bottom-safe-bottom pb-8 left-6 right-6">
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 transition-opacity ${
                currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={nextStep}
              size="lg"
              className="flex items-center gap-2 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25"
            >
              {currentStep === steps.length - 1 ? "Let's Go!" : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
