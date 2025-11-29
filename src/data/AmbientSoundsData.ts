// ═══════════════════════════════════════════════════════════════════════════
// AMBIENT SOUNDS DATA
// Ambient soundscapes for focus sessions
// ═══════════════════════════════════════════════════════════════════════════

export type AmbientSoundCategory = 'lofi' | 'nature' | 'white-noise' | 'cafe' | 'rain';

export interface AmbientSound {
  id: string;
  name: string;
  description: string;
  category: AmbientSoundCategory;
  icon: string;
  // Audio URL - in production these would be hosted audio files
  // For now we'll use Web Audio API to generate sounds
  audioType: 'generated' | 'file';
  audioUrl?: string;
  isPremium: boolean;
  // For generated sounds
  generatorConfig?: {
    type: 'noise' | 'binaural' | 'tone';
    frequency?: number;
    noiseType?: 'white' | 'pink' | 'brown';
    binauralBase?: number;
    binauralBeat?: number;
  };
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  // Free sounds (generated)
  {
    id: 'white-noise',
    name: 'White Noise',
    description: 'Classic white noise for deep focus',
    category: 'white-noise',
    icon: '📻',
    audioType: 'generated',
    isPremium: false,
    generatorConfig: {
      type: 'noise',
      noiseType: 'white',
    },
  },
  {
    id: 'pink-noise',
    name: 'Pink Noise',
    description: 'Softer, more balanced noise',
    category: 'white-noise',
    icon: '🌸',
    audioType: 'generated',
    isPremium: false,
    generatorConfig: {
      type: 'noise',
      noiseType: 'pink',
    },
  },
  {
    id: 'brown-noise',
    name: 'Brown Noise',
    description: 'Deep, rumbling ambient sound',
    category: 'white-noise',
    icon: '🟤',
    audioType: 'generated',
    isPremium: false,
    generatorConfig: {
      type: 'noise',
      noiseType: 'brown',
    },
  },
  {
    id: 'rain-light',
    name: 'Light Rain',
    description: 'Gentle rainfall on a window',
    category: 'rain',
    icon: '🌧️',
    audioType: 'generated',
    isPremium: false,
    generatorConfig: {
      type: 'noise',
      noiseType: 'pink',
    },
  },
  {
    id: 'focus-tone',
    name: 'Focus Tone',
    description: '40Hz binaural beat for concentration',
    category: 'lofi',
    icon: '🧠',
    audioType: 'generated',
    isPremium: false,
    generatorConfig: {
      type: 'binaural',
      binauralBase: 200,
      binauralBeat: 40,
    },
  },

  // Premium sounds
  {
    id: 'lofi-beats',
    name: 'Lo-Fi Beats',
    description: 'Chill lo-fi hip hop beats to study to',
    category: 'lofi',
    icon: '🎵',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'pink',
    },
  },
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    description: 'Ambient coffee shop atmosphere',
    category: 'cafe',
    icon: '☕',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'brown',
    },
  },
  {
    id: 'forest-ambience',
    name: 'Forest',
    description: 'Birds chirping in a peaceful forest',
    category: 'nature',
    icon: '🌲',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'pink',
    },
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: 'Calming waves on a beach',
    category: 'nature',
    icon: '🌊',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'brown',
    },
  },
  {
    id: 'thunderstorm',
    name: 'Thunderstorm',
    description: 'Powerful rain with distant thunder',
    category: 'rain',
    icon: '⛈️',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'brown',
    },
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    description: 'Crackling fireplace sounds',
    category: 'nature',
    icon: '🔥',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'brown',
    },
  },
  {
    id: 'alpha-waves',
    name: 'Alpha Waves',
    description: '10Hz binaural for relaxed focus',
    category: 'lofi',
    icon: '🌀',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'binaural',
      binauralBase: 200,
      binauralBeat: 10,
    },
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    description: 'Beta waves for intense concentration',
    category: 'lofi',
    icon: '💎',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'binaural',
      binauralBase: 200,
      binauralBeat: 18,
    },
  },
];

export const AMBIENT_CATEGORIES: { id: AmbientSoundCategory; name: string; icon: string }[] = [
  { id: 'white-noise', name: 'Noise', icon: '📻' },
  { id: 'nature', name: 'Nature', icon: '🌲' },
  { id: 'rain', name: 'Rain', icon: '🌧️' },
  { id: 'lofi', name: 'Focus', icon: '🧠' },
  { id: 'cafe', name: 'Cafe', icon: '☕' },
];

export const getAmbientSoundById = (id: string): AmbientSound | undefined => {
  return AMBIENT_SOUNDS.find(sound => sound.id === id);
};

export const getAmbientSoundsByCategory = (category: AmbientSoundCategory): AmbientSound[] => {
  return AMBIENT_SOUNDS.filter(sound => sound.category === category);
};

export const getFreeSounds = (): AmbientSound[] => {
  return AMBIENT_SOUNDS.filter(sound => !sound.isPremium);
};

export const getPremiumSounds = (): AmbientSound[] => {
  return AMBIENT_SOUNDS.filter(sound => sound.isPremium);
};
