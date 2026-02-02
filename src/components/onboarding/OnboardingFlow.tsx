import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Lock } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { getAnimalById } from '@/data/AnimalDatabase';

interface OnboardingFlowProps {
  onComplete: () => void;
}

// ─── Starter pet options (first 3 Meadow unlocks) ───────────────────────────

const STARTER_PETS = [
  {
    id: 'dewdrop-frog',
    name: 'Dewdrop Frog',
    description: 'Cheerful & refreshing',
  },
  {
    id: 'sprout-bunny',
    name: 'Sprout Bunny',
    description: 'Gentle & nurturing',
  },
  {
    id: 'petal-puff',
    name: 'Petal Puff',
    description: 'Calm & soothing',
  },
];

// Locked pet teasers shown on step 4
const TEASER_PETS = [
  { id: 'ember-fox', name: 'Ember Fox', biome: 'Sunset', level: 5 },
  { id: 'luna-moth', name: 'Luna Moth', biome: 'Night', level: 9 },
  { id: 'flame-spirit', name: 'Flame Spirit', biome: 'Forest', level: 15 },
];

const ISLAND_SUGGESTIONS = ['Pixel Paradise', 'Sunny Meadow', 'Happy Hollow', 'Cozy Island'];

// ─── Animated idle pet sprite (bounces gently) ──────────────────────────────

const IdlePetSprite = ({
  idleSprite,
  size = 64,
  scale = 2,
  bounce = true,
}: {
  idleSprite: string;
  size?: number;
  scale?: number;
  bounce?: boolean;
}) => (
  <motion.div
    animate={bounce ? { y: [0, -4, 0] } : undefined}
    transition={bounce ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : undefined}
  >
    <div
      style={{
        width: size * scale,
        height: size * scale,
        backgroundImage: `url(${idleSprite})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        imageRendering: 'pixelated',
      }}
    />
  </motion.div>
);

// ─── Walking pet sprite (animates through frames) ───────────────────────────

const WalkingPetSprite = ({
  spritePath,
  frameCount,
  frameWidth,
  frameHeight,
  scale = 2,
  frameRow = 0,
  walkRows = 1,
}: {
  spritePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  scale?: number;
  frameRow?: number;
  walkRows?: number;
}) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, 150);
    return () => clearInterval(interval);
  }, [frameCount]);

  const row = walkRows > 1 ? frameRow : 0;

  return (
    <div
      style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        backgroundImage: `url(${spritePath})`,
        backgroundPosition: `-${frame * frameWidth * scale}px -${row * frameHeight * scale}px`,
        backgroundSize: `${frameCount * frameWidth * scale}px ${walkRows * frameHeight * scale}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
};

// ─── Step indicator dots (warm tan theme) ────────────────────────────────────

const StepDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-2.5 justify-center">
    {Array.from({ length: total }).map((_, i) => (
      <motion.div
        key={i}
        initial={false}
        animate={{
          scale: i === current ? 1.2 : 1,
          width: i === current ? 24 : 10,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="h-2.5 rounded-full"
        style={{
          backgroundColor:
            i === current
              ? 'hsl(35 70% 50%)'
              : i < current
                ? 'hsl(35 50% 65%)'
                : 'hsl(35 20% 80%)',
        }}
      />
    ))}
  </div>
);

// ─── Retro styled card (tan borders, warm shadows) ──────────────────────────

const RetroCard = ({
  children,
  selected = false,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) => (
  <motion.div
    whileTap={onClick ? { scale: 0.96 } : undefined}
    animate={selected ? { scale: 1.05 } : { scale: 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    onClick={onClick}
    className={`relative rounded-xl transition-colors duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    style={{
      background: selected
        ? 'linear-gradient(180deg, hsl(45 60% 95%) 0%, hsl(40 50% 90%) 100%)'
        : 'linear-gradient(180deg, hsl(40 30% 95%) 0%, hsl(38 25% 91%) 100%)',
      border: selected ? '2.5px solid hsl(35 70% 50%)' : '2px solid hsl(30 20% 78%)',
      boxShadow: selected
        ? 'inset 0 1px 0 hsl(50 60% 96%), 0 4px 12px hsl(35 60% 40% / 0.2), 0 0 0 3px hsl(40 70% 55% / 0.15)'
        : 'inset 0 1px 0 hsl(40 30% 97%), 0 2px 6px hsl(0 0% 0% / 0.06)',
    }}
  >
    {children}
  </motion.div>
);

// ─── Mini meadow platform (CSS-drawn) ───────────────────────────────────────

const MiniPlatform = ({ children }: { children?: React.ReactNode }) => (
  <div className="relative w-full flex flex-col items-center">
    {/* Pet sits on top */}
    <div className="relative z-10 -mb-4">{children}</div>
    {/* Grass platform */}
    <div
      className="w-56 h-8 rounded-lg"
      style={{
        background: 'linear-gradient(180deg, hsl(120 45% 55%) 0%, hsl(120 40% 42%) 40%, hsl(25 40% 40%) 100%)',
        boxShadow: 'inset 0 2px 0 hsl(120 50% 65%), 0 4px 8px hsl(0 0% 0% / 0.15)',
        border: '2px solid hsl(120 30% 35%)',
      }}
    />
    {/* Ground shadow */}
    <div className="w-48 h-3 rounded-full bg-black/10 blur-sm -mt-1" />
  </div>
);

// ─── Gold game-style button ─────────────────────────────────────────────────

const GoldButton = ({
  children,
  onClick,
  disabled = false,
  size = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  size?: 'default' | 'lg';
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    size={size === 'lg' ? 'lg' : 'default'}
    className="font-bold tracking-wide text-white border-0"
    style={{
      background: disabled
        ? 'linear-gradient(180deg, hsl(35 20% 70%) 0%, hsl(35 15% 60%) 100%)'
        : 'linear-gradient(180deg, hsl(45 85% 65%) 0%, hsl(40 80% 50%) 100%)',
      border: disabled ? '2px solid hsl(35 15% 55%)' : '2px solid hsl(35 70% 40%)',
      boxShadow: disabled
        ? 'none'
        : 'inset 0 1px 0 hsl(50 90% 75%), inset 0 -1px 0 hsl(35 60% 40%), 0 3px 8px hsl(30 50% 20% / 0.25)',
      color: disabled ? 'hsl(35 10% 85%)' : 'hsl(25 50% 18%)',
      textShadow: disabled ? 'none' : '0 1px 0 hsl(45 80% 70% / 0.5)',
    }}
  >
    {children}
  </Button>
);

// ═════════════════════════════════════════════════════════════════════════════
// Main OnboardingFlow
// ═════════════════════════════════════════════════════════════════════════════

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [islandName, setIslandName] = useState('');

  const setChosenStarterPet = useOnboardingStore((s) => s.setChosenStarterPet);
  const setStoredIslandName = useOnboardingStore((s) => s.setIslandName);

  const totalSteps = 5;

  // Get sprite data for the selected starter pet
  const selectedPetData = useMemo(() => {
    if (!selectedPet) return null;
    return getAnimalById(selectedPet);
  }, [selectedPet]);

  const starterPetInfo = useMemo(
    () => STARTER_PETS.find((p) => p.id === selectedPet),
    [selectedPet]
  );

  // ── Navigation ──────────────────────────────────────────────────────────

  const canProceed = useCallback(() => {
    if (currentStep === 1) return selectedPet !== null;
    return true;
  }, [currentStep, selectedPet]);

  const nextStep = useCallback(() => {
    if (!canProceed()) return;
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      // Save choices to store before completing
      if (selectedPet) setChosenStarterPet(selectedPet);
      if (islandName.trim()) setStoredIslandName(islandName.trim());
      onComplete();
    }
  }, [currentStep, totalSteps, canProceed, onComplete, selectedPet, islandName, setChosenStarterPet, setStoredIslandName]);

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
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  // ── Step content renderers ──────────────────────────────────────────────

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepIslandAwaits />;
      case 1:
        return (
          <StepChoosePet
            selectedPet={selectedPet}
            onSelectPet={setSelectedPet}
          />
        );
      case 2:
        return (
          <StepNameIsland
            islandName={islandName}
            onSetIslandName={setIslandName}
            selectedPetData={selectedPetData}
          />
        );
      case 3:
        return <StepFocusLoop />;
      case 4:
        return (
          <StepLetsBegin
            selectedPetData={selectedPetData}
            petName={starterPetInfo?.name ?? 'your pet'}
          />
        );
      default:
        return null;
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Sky gradient background matching the main Meadow/Home view */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, hsl(200 70% 80%) 0%, hsl(200 50% 88%) 40%, hsl(180 30% 90%) 70%, hsl(35 40% 90%) 100%)',
        }}
      />

      {/* Subtle cloud shapes */}
      <div className="absolute top-[8%] left-[8%] w-20 h-7 rounded-full bg-white/30 blur-sm" />
      <div className="absolute top-[12%] right-[12%] w-24 h-8 rounded-full bg-white/25 blur-sm" />
      <div className="absolute top-[6%] left-[45%] w-16 h-5 rounded-full bg-white/20 blur-sm" />

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 max-w-md mx-auto">
        {/* Step dots */}
        <div className="absolute top-safe pt-8">
          <StepDots current={currentStep} total={totalSteps} />
        </div>

        {/* Slide content */}
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

        {/* Bottom navigation */}
        <div className="absolute bottom-safe pb-8 left-6 right-6">
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 text-sm transition-opacity ${
                currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              style={{ color: 'hsl(30 25% 40%)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <GoldButton
              onClick={nextStep}
              disabled={!canProceed()}
              size="lg"
            >
              <span className="flex items-center gap-2">
                {currentStep === totalSteps - 1 ? 'Start My Journey' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </span>
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// Step 1: Your Island Awaits
// ═════════════════════════════════════════════════════════════════════════════

const StepIslandAwaits = () => (
  <div className="text-center space-y-6">
    <div className="space-y-2">
      <h1
        className="text-3xl font-bold"
        style={{ color: 'hsl(220 25% 15%)' }}
      >
        Your island awaits
      </h1>
      <p className="text-base px-2" style={{ color: 'hsl(220 15% 45%)' }}>
        A cozy place where focus grows into something magical
      </p>
    </div>

    <div className="py-6">
      <MiniPlatform>
        {/* Empty platform with a gentle question mark hint */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 flex items-center justify-center"
        >
          <span
            className="text-4xl font-bold select-none"
            style={{
              color: 'hsl(35 60% 55%)',
              textShadow: '0 2px 4px hsl(35 40% 30% / 0.2)',
            }}
          >
            ?
          </span>
        </motion.div>
      </MiniPlatform>
    </div>

    <p
      className="text-sm px-6 italic"
      style={{ color: 'hsl(220 15% 55%)' }}
    >
      Who will be your first companion?
    </p>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Step 2: Choose Your First Friend
// ═════════════════════════════════════════════════════════════════════════════

const StepChoosePet = ({
  selectedPet,
  onSelectPet,
}: {
  selectedPet: string | null;
  onSelectPet: (id: string) => void;
}) => (
  <div className="text-center space-y-5">
    <div className="space-y-2">
      <h1
        className="text-3xl font-bold"
        style={{ color: 'hsl(220 25% 15%)' }}
      >
        Choose your first friend
      </h1>
      <p className="text-base" style={{ color: 'hsl(220 15% 45%)' }}>
        They'll keep you company while you focus
      </p>
    </div>

    <div className="flex justify-center gap-3 px-2">
      {STARTER_PETS.map((pet) => {
        const animalData = getAnimalById(pet.id);
        const isSelected = selectedPet === pet.id;

        return (
          <RetroCard
            key={pet.id}
            selected={isSelected}
            onClick={() => onSelectPet(pet.id)}
            className="flex-1 max-w-[120px]"
          >
            <div className="flex flex-col items-center py-3 px-2 gap-2">
              {/* Sprite */}
              <div className="w-[80px] h-[80px] flex items-center justify-center">
                {animalData?.spriteConfig?.idleSprite ? (
                  <IdlePetSprite
                    idleSprite={animalData.spriteConfig.idleSprite}
                    size={64}
                    scale={1.2}
                    bounce={isSelected}
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg" />
                )}
              </div>

              {/* Name */}
              <span
                className="text-xs font-bold leading-tight"
                style={{
                  color: isSelected ? 'hsl(35 60% 35%)' : 'hsl(220 15% 35%)',
                }}
              >
                {pet.name}
              </span>

              {/* Description */}
              <span
                className="text-[10px] leading-tight"
                style={{ color: 'hsl(220 15% 55%)' }}
              >
                {pet.description}
              </span>
            </div>
          </RetroCard>
        );
      })}
    </div>

    {!selectedPet && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs"
        style={{ color: 'hsl(35 50% 50%)' }}
      >
        Tap to choose your companion
      </motion.p>
    )}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Step 3: Name Your Island
// ═════════════════════════════════════════════════════════════════════════════

const StepNameIsland = ({
  islandName,
  onSetIslandName,
  selectedPetData,
}: {
  islandName: string;
  onSetIslandName: (name: string) => void;
  selectedPetData: ReturnType<typeof getAnimalById> | null;
}) => (
  <div className="text-center space-y-5">
    <div className="space-y-2">
      <h1
        className="text-3xl font-bold"
        style={{ color: 'hsl(220 25% 15%)' }}
      >
        Name your island
      </h1>
      <p className="text-base" style={{ color: 'hsl(220 15% 45%)' }}>
        Every great adventure needs a home
      </p>
    </div>

    {/* Pet on platform preview */}
    <div className="py-2">
      <MiniPlatform>
        {selectedPetData?.spriteConfig?.idleSprite && (
          <IdlePetSprite
            idleSprite={selectedPetData.spriteConfig.idleSprite}
            size={64}
            scale={1.5}
            bounce
          />
        )}
      </MiniPlatform>
    </div>

    {/* Island name input */}
    <div className="px-4 space-y-3">
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: '2px solid hsl(30 25% 72%)',
          boxShadow: 'inset 0 2px 4px hsl(0 0% 0% / 0.06), 0 2px 6px hsl(0 0% 0% / 0.04)',
        }}
      >
        <input
          type="text"
          value={islandName}
          onChange={(e) => onSetIslandName(e.target.value.slice(0, 20))}
          placeholder="Cozy Meadow"
          maxLength={20}
          className="w-full px-4 py-3 text-center text-base font-medium bg-white/80 focus:bg-white outline-none transition-colors placeholder:text-black/25"
          style={{ color: 'hsl(220 25% 15%)' }}
        />
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap justify-center gap-2">
        {ISLAND_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSetIslandName(suggestion)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
            style={{
              background:
                islandName === suggestion
                  ? 'hsl(40 60% 88%)'
                  : 'hsl(40 25% 93%)',
              border:
                islandName === suggestion
                  ? '1.5px solid hsl(35 50% 60%)'
                  : '1.5px solid hsl(30 15% 82%)',
              color: 'hsl(30 30% 35%)',
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>

    <p
      className="text-xs"
      style={{ color: 'hsl(220 15% 60%)' }}
    >
      You can always change this later
    </p>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Step 4: Focus Grows Your World
// ═════════════════════════════════════════════════════════════════════════════

const StepFocusLoop = () => (
  <div className="text-center space-y-5">
    <div className="space-y-2">
      <h1
        className="text-3xl font-bold"
        style={{ color: 'hsl(220 25% 15%)' }}
      >
        Focus grows your world
      </h1>
      <p className="text-base" style={{ color: 'hsl(220 15% 45%)' }}>
        Here's how it works
      </p>
    </div>

    {/* 3-step loop visual */}
    <div className="space-y-3 px-4">
      {[
        {
          icon: '/assets/icons/clock.png',
          fallback: '⏱',
          label: 'Start a focus session',
          sub: 'Set a timer and stay focused',
        },
        {
          icon: '/assets/icons/star.png',
          fallback: '⭐',
          label: 'Earn XP as you focus',
          sub: 'Every minute counts toward leveling up',
        },
        {
          icon: '/assets/icons/paw.png',
          fallback: '🐾',
          label: 'Unlock new pets & biomes',
          sub: '50+ creatures across 6 worlds',
        },
      ].map((step, i) => (
        <motion.div
          key={step.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
        >
          <RetroCard className="!rounded-lg">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <img
                  src={step.icon}
                  alt=""
                  className="w-7 h-7"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    if (e.target instanceof HTMLImageElement && e.target.nextSibling === null) {
                      const span = document.createElement('span');
                      span.textContent = step.fallback;
                      span.className = 'text-xl';
                      e.target.parentElement?.appendChild(span);
                    }
                  }}
                />
              </div>
              <div className="text-left">
                <p
                  className="text-sm font-bold"
                  style={{ color: 'hsl(220 25% 15%)' }}
                >
                  {step.label}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'hsl(220 15% 50%)' }}
                >
                  {step.sub}
                </p>
              </div>
            </div>
          </RetroCard>
        </motion.div>
      ))}
    </div>

    {/* Locked pet teasers */}
    <div className="pt-1">
      <p
        className="text-xs font-medium mb-2"
        style={{ color: 'hsl(220 15% 50%)' }}
      >
        Waiting to be discovered...
      </p>
      <div className="flex justify-center gap-4">
        {TEASER_PETS.map((pet) => {
          const animalData = getAnimalById(pet.id);
          return (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="relative w-12 h-12 flex items-center justify-center">
                {animalData?.spriteConfig?.idleSprite ? (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${animalData.spriteConfig.idleSprite})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      imageRendering: 'pixelated',
                      filter: 'brightness(0) opacity(0.25)',
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-black/10" />
                )}
                <Lock
                  className="absolute bottom-0 right-0 w-3.5 h-3.5"
                  style={{ color: 'hsl(35 50% 55%)' }}
                />
              </div>
              <span
                className="text-[9px] font-medium"
                style={{ color: 'hsl(220 15% 55%)' }}
              >
                Lv.{pet.level}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Step 5: Let's Begin
// ═════════════════════════════════════════════════════════════════════════════

const StepLetsBegin = ({
  selectedPetData,
  petName,
}: {
  selectedPetData: ReturnType<typeof getAnimalById> | null;
  petName: string;
}) => (
  <div className="text-center space-y-6">
    <div className="space-y-2">
      <h1
        className="text-3xl font-bold"
        style={{ color: 'hsl(220 25% 15%)' }}
      >
        Meet {petName}!
      </h1>
      <p className="text-base" style={{ color: 'hsl(220 15% 45%)' }}>
        Your first focus session is waiting
      </p>
    </div>

    <div className="py-4">
      <MiniPlatform>
        {selectedPetData?.spriteConfig ? (
          <WalkingPetSprite
            spritePath={selectedPetData.spriteConfig.spritePath}
            frameCount={selectedPetData.spriteConfig.frameCount}
            frameWidth={selectedPetData.spriteConfig.frameWidth}
            frameHeight={selectedPetData.spriteConfig.frameHeight}
            scale={2}
            frameRow={selectedPetData.spriteConfig.frameRow ?? 0}
            walkRows={selectedPetData.spriteConfig.walkRows ?? 1}
          />
        ) : (
          <div className="w-20 h-20" />
        )}
      </MiniPlatform>
    </div>

    {/* Small encouragement cards */}
    <div className="flex justify-center gap-3 px-4">
      {[
        { value: '50+', label: 'Pets to collect' },
        { value: '6', label: 'Biomes to explore' },
        { value: '∞', label: 'Focus sessions' },
      ].map((stat) => (
        <div
          key={stat.label}
          className="flex-1 py-2.5 px-2 rounded-lg text-center"
          style={{
            background: 'hsl(40 30% 94%)',
            border: '1.5px solid hsl(30 20% 82%)',
          }}
        >
          <p
            className="text-lg font-bold"
            style={{ color: 'hsl(35 60% 42%)' }}
          >
            {stat.value}
          </p>
          <p
            className="text-[10px]"
            style={{ color: 'hsl(220 15% 50%)' }}
          >
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  </div>
);
