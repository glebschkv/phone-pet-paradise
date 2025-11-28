import { memo, useEffect, useState } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';

interface PixelAnimalProps {
  animal: AnimalData;
  position: number; // 0 to 1, position across the platform
  speed: number; // pixels per second
}

export const PixelAnimal = memo(({ animal, position, speed }: PixelAnimalProps) => {
  // Original CSS-based pixel animal logic (sprite animals use SpriteAnimal directly now)
  const [currentPosition, setCurrentPosition] = useState(position);
  
  useEffect(() => {
    const startTime = Date.now();
    const platformWidth = window.innerWidth;
    const animalWidth = 40; // approximate width
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      const pixelsMovedPerSecond = speed;
      const newPosition = (position * platformWidth + elapsed * pixelsMovedPerSecond) % (platformWidth + animalWidth);
      
      setCurrentPosition(newPosition / platformWidth);
      requestAnimationFrame(animate);
    };
    
    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [position, speed]);
  
  // Get animal colors based on rarity
  const getRarityColors = (rarity: string) => {
    switch (rarity) {
      case 'Common': return { primary: 'bg-success', accent: 'bg-success/70' };
      case 'Uncommon': return { primary: 'bg-primary', accent: 'bg-primary/70' };
      case 'Rare': return { primary: 'bg-accent', accent: 'bg-accent/70' };
      case 'Epic': return { primary: 'bg-destructive', accent: 'bg-destructive/70' };
      case 'Legendary': return { primary: 'bg-warning', accent: 'bg-warning/70' };
      default: return { primary: 'bg-muted', accent: 'bg-muted/70' };
    }
  };
  
  const colors = getRarityColors(animal.rarity);
  
  return (
    <div
      className="absolute bottom-[15%] transition-transform duration-100 ease-linear"
      style={{
        left: `${currentPosition * 100}%`,
        transform: `translateX(-50%)`,
      }}
    >
      {/* Pixel Art Animal Body */}
      <div className="relative animate-pixel-walk">
        {/* Shadow */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-muted/30 rounded-full blur-sm" />
        
        {/* Main Body - Different shapes based on animal type */}
        {animal.name.toLowerCase().includes('fox') && (
          <FoxPixelArt colors={colors} />
        )}
        {animal.name.toLowerCase().includes('panda') && (
          <PandaPixelArt colors={colors} />
        )}
        {animal.name.toLowerCase().includes('elephant') && (
          <ElephantPixelArt colors={colors} />
        )}
        {!['fox', 'panda', 'elephant'].some(type => animal.name.toLowerCase().includes(type)) && (
          <GenericPixelArt colors={colors} emoji={animal.emoji} />
        )}
      </div>
    </div>
  );
});

// Pixel art components for different animal types
const FoxPixelArt = memo(({ colors }: { colors: { primary: string; accent: string } }) => (
  <div className="relative w-8 h-8">
    {/* Ears */}
    <div className={`absolute top-0 left-1 w-2 h-2 ${colors.accent}`} />
    <div className={`absolute top-0 right-1 w-2 h-2 ${colors.accent}`} />
    {/* Head */}
    <div className={`absolute top-1 left-0 w-8 h-4 ${colors.primary}`} />
    {/* Body */}
    <div className={`absolute top-4 left-1 w-6 h-3 ${colors.primary}`} />
    {/* Tail */}
    <div className={`absolute top-3 right-0 w-2 h-4 ${colors.accent}`} />
    {/* Eyes */}
    <div className="absolute top-2 left-2 w-1 h-1 bg-foreground" />
    <div className="absolute top-2 right-2 w-1 h-1 bg-foreground" />
  </div>
));

const PandaPixelArt = memo(({ colors: _colors }: { colors: { primary: string; accent: string } }) => (
  <div className="relative w-8 h-8">
    {/* Ears */}
    <div className="absolute top-0 left-1 w-2 h-2 bg-foreground rounded-full" />
    <div className="absolute top-0 right-1 w-2 h-2 bg-foreground rounded-full" />
    {/* Head */}
    <div className="absolute top-1 left-0 w-8 h-5 bg-background border-2 border-foreground" />
    {/* Body */}
    <div className="absolute top-5 left-1 w-6 h-3 bg-background border border-foreground" />
    {/* Eye patches */}
    <div className="absolute top-2 left-1 w-2 h-2 bg-foreground rounded-full" />
    <div className="absolute top-2 right-1 w-2 h-2 bg-foreground rounded-full" />
    {/* Eyes */}
    <div className="absolute top-2.5 left-1.5 w-1 h-1 bg-background" />
    <div className="absolute top-2.5 right-1.5 w-1 h-1 bg-background" />
  </div>
));

const ElephantPixelArt = memo(({ colors }: { colors: { primary: string; accent: string } }) => (
  <div className="relative w-10 h-8">
    {/* Ears */}
    <div className={`absolute top-0 left-0 w-3 h-4 ${colors.accent} rounded-l-full`} />
    <div className={`absolute top-0 right-0 w-3 h-4 ${colors.accent} rounded-r-full`} />
    {/* Head */}
    <div className={`absolute top-1 left-1 w-8 h-4 ${colors.primary}`} />
    {/* Trunk */}
    <div className={`absolute top-4 left-2 w-2 h-4 ${colors.primary}`} />
    {/* Body */}
    <div className={`absolute top-4 left-3 w-4 h-4 ${colors.primary}`} />
    {/* Eyes */}
    <div className="absolute top-2 left-3 w-1 h-1 bg-foreground" />
    <div className="absolute top-2 right-3 w-1 h-1 bg-foreground" />
  </div>
));

const GenericPixelArt = memo(({ colors, emoji }: { colors: { primary: string; accent: string }; emoji: string }) => (
  <div className="relative w-8 h-8 flex items-center justify-center">
    {/* Simple pixel body */}
    <div className={`w-6 h-6 ${colors.primary} rounded-sm`} />
    {/* Emoji overlay for identification */}
    <div className="absolute inset-0 flex items-center justify-center text-xs opacity-80">
      {emoji}
    </div>
  </div>
));

PixelAnimal.displayName = 'PixelAnimal';