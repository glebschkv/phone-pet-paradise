import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Sparkles, Star, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimalData } from '@/data/AnimalDatabase';
import { SpritePreview } from './ShopPreviewComponents';

interface CharacterUnlockModalProps {
  animal: AnimalData | null;
  open: boolean;
  onClose: () => void;
}

const RARITY_STYLES = {
  common: {
    gradient: 'from-slate-400 to-slate-600',
    border: 'border-slate-400',
    glow: 'shadow-[0_0_30px_rgba(148,163,184,0.4)]',
    neon: 'text-slate-200',
    badgeClass: 'bg-gradient-to-b from-slate-400 to-slate-500 border-2 border-slate-300',
    ringColor: 'border-slate-400/50',
    particleColor: 'text-slate-300',
  },
  rare: {
    gradient: 'from-blue-400 to-blue-600',
    border: 'border-blue-400',
    glow: 'shadow-[0_0_35px_rgba(59,130,246,0.5)]',
    neon: 'retro-neon-text',
    badgeClass: 'bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-300',
    ringColor: 'border-blue-400/50',
    particleColor: 'text-blue-300',
  },
  epic: {
    gradient: 'from-purple-400 to-purple-600',
    border: 'border-purple-400',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.6)]',
    neon: 'retro-neon-pink',
    badgeClass: 'bg-gradient-to-b from-purple-400 to-purple-500 border-2 border-purple-300',
    ringColor: 'border-purple-400/50',
    particleColor: 'text-purple-300',
  },
  legendary: {
    gradient: 'from-amber-400 to-orange-500',
    border: 'border-amber-400',
    glow: 'shadow-[0_0_50px_rgba(245,158,11,0.7)]',
    neon: 'retro-neon-yellow',
    badgeClass: 'bg-gradient-to-b from-amber-400 to-orange-500 border-2 border-amber-300',
    ringColor: 'border-amber-400/50',
    particleColor: 'text-yellow-300',
  },
};

const RARITY_STARS: Record<string, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export const CharacterUnlockModal: React.FC<CharacterUnlockModalProps> = ({
  animal,
  open,
  onClose,
}) => {
  const [phase, setPhase] = useState<'enter' | 'reveal' | 'idle'>('enter');

  useEffect(() => {
    if (open && animal) {
      setPhase('enter');
      const revealTimer = setTimeout(() => setPhase('reveal'), 100);
      const idleTimer = setTimeout(() => setPhase('idle'), 1100);
      return () => {
        clearTimeout(revealTimer);
        clearTimeout(idleTimer);
      };
    }
  }, [open, animal]);

  if (!animal) return null;

  const style = RARITY_STYLES[animal.rarity];
  const starCount = RARITY_STARS[animal.rarity] ?? 1;
  const isAnimating = phase === 'reveal';
  const spriteScale = animal.spriteConfig
    ? Math.min(3, 100 / Math.max(animal.spriteConfig.frameWidth, animal.spriteConfig.frameHeight))
    : 1;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent
        className={cn(
          "max-w-[320px] p-0 overflow-hidden border-0 rounded-xl",
          "retro-arcade-container retro-modal"
        )}
      >
        <VisuallyHidden>
          <DialogTitle>New Pet Unlocked</DialogTitle>
        </VisuallyHidden>

        {/* Scanlines overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
            }}
          />
        </div>

        {/* Burst particles */}
        {(isAnimating || phase === 'idle') && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            <Sparkles
              className={cn("absolute top-4 left-5 w-5 h-5 animate-ping", style.particleColor)}
            />
            <Sparkles
              className={cn("absolute top-8 right-8 w-4 h-4 animate-ping", style.particleColor)}
              style={{ animationDelay: '0.15s' }}
            />
            <Sparkles
              className={cn("absolute bottom-28 left-8 w-4 h-4 animate-ping", style.particleColor)}
              style={{ animationDelay: '0.3s' }}
            />
            <Star
              className={cn("absolute top-14 right-5 w-4 h-4 animate-spin", style.particleColor)}
            />
            <Star
              className={cn("absolute bottom-36 right-10 w-3 h-3 animate-spin", style.particleColor)}
              style={{ animationDelay: '0.25s' }}
            />
            <Sparkles
              className={cn("absolute top-20 left-10 w-3 h-3 animate-ping", style.particleColor)}
              style={{ animationDelay: '0.45s' }}
            />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 p-6 text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <PartyPopper className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-bold retro-pixel-text retro-neon-yellow uppercase tracking-wider">
              New Pet Unlocked!
            </span>
            <PartyPopper className="w-5 h-5 text-yellow-400" />
          </div>

          {/* Character showcase */}
          <div
            className={cn(
              "relative mx-auto w-28 h-28 mb-4 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br",
              style.gradient,
              style.border,
              "border-4",
              style.glow,
              isAnimating && "animate-bounce"
            )}
          >
            {animal.spriteConfig ? (
              <SpritePreview animal={animal} scale={spriteScale} />
            ) : (
              <span className="text-5xl">{animal.emoji}</span>
            )}

            {/* Shine sweep */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent",
                  "transform -skew-x-12 -translate-x-full",
                  isAnimating && "animate-[shine_1s_ease-in-out]"
                )}
              />
            </div>
          </div>

          {/* Rarity badge */}
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full mb-3",
              style.badgeClass
            )}
          >
            {[...Array(starCount)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3 text-white fill-white",
                  animal.rarity === 'legendary' && "animate-pulse"
                )}
              />
            ))}
            <span className="text-xs font-bold uppercase text-white ml-0.5">
              {animal.rarity}
            </span>
          </div>

          {/* Character name */}
          <h2
            className={cn(
              "text-2xl font-bold mb-2 retro-pixel-text",
              style.neon
            )}
          >
            {animal.name}
          </h2>

          {/* Description */}
          <p className="text-sm text-purple-300/80 mb-2 px-2 leading-relaxed">
            {animal.description}
          </p>

          {/* Abilities */}
          {animal.abilities.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-5">
              {animal.abilities.map((ability) => (
                <span
                  key={ability}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-white/10 text-purple-200/80 border border-white/10"
                >
                  {ability}
                </span>
              ))}
            </div>
          )}

          {/* Dismiss button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-lg font-bold text-lg retro-pixel-text uppercase tracking-wider retro-arcade-btn retro-arcade-btn-yellow transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Awesome!
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
