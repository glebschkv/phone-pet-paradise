import { memo } from 'react';
import { getBiomeByName } from '@/data/AnimalDatabase';
import { ImageBackground } from './ImageBackground';

/**
 * Forest Background (Jungle Island)
 */
export const ForestHomeBackground = memo(() => {
  const biome = getBiomeByName('Forest');

  if (biome?.backgroundImage) {
    return (
      <ImageBackground
        imagePath={biome.backgroundImage}
        fallbackGradient="linear-gradient(180deg, hsl(175 45% 70%) 0%, hsl(160 50% 75%) 40%, hsl(140 45% 70%) 100%)"
      >
        {/* Misty overlay for jungle atmosphere */}
        <div className="absolute top-[35%] left-0 right-0 h-20 bg-white/10 blur-xl" />
      </ImageBackground>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(175 45% 70%) 0%, hsl(160 50% 75%) 40%, hsl(140 45% 70%) 100%)'
        }}
      />
      <div
        className="absolute top-0 left-[25%] w-32 h-[50%] opacity-25"
        style={{
          background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, transparent 100%)',
          clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)'
        }}
      />
      <div
        className="absolute top-0 right-[30%] w-24 h-[40%] opacity-20"
        style={{
          background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, transparent 100%)',
          clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)'
        }}
      />
      <div className="absolute top-[35%] left-0 right-0 h-20 bg-white/15 blur-xl" />
      <div className="absolute bottom-[28%] w-full h-40">
        <svg viewBox="0 0 1200 160" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="forestBackGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(150 35% 50%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(150 40% 40%)" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d="M0,160 L0,80 L40,50 L80,80 L100,40 L140,80 L160,60 L200,90 L230,50 L280,90 L320,40 L380,80 L420,50 L480,90 L520,30 L580,70 L640,50 L700,90 L760,40 L820,80 L880,50 L940,90 L1000,40 L1060,80 L1120,50 L1200,80 L1200,160 Z" fill="url(#forestBackGradient)" />
        </svg>
      </div>
      <div className="absolute bottom-[18%] w-full h-32">
        <svg viewBox="0 0 1200 130" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="forestMidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(145 40% 40%)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(145 45% 30%)" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d="M0,130 L0,70 L30,40 L60,70 L80,30 L120,70 L150,50 L190,80 L220,40 L270,80 L320,30 L370,70 L420,40 L480,80 L530,20 L590,60 L650,40 L710,80 L770,30 L830,70 L890,40 L950,80 L1010,30 L1070,70 L1130,40 L1200,70 L1200,130 Z" fill="url(#forestMidGradient)" />
        </svg>
      </div>
    </div>
  );
});
ForestHomeBackground.displayName = 'ForestHomeBackground';
