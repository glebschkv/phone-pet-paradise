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
  // ═══════════════════════════════════════════════════════════════════════════
  // FREE SOUNDS - Give users a great experience without paying
  // ═══════════════════════════════════════════════════════════════════════════
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
    description: '40Hz gamma waves for concentration',
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
  {
    id: 'wind-gentle',
    name: 'Gentle Wind',
    description: 'Soft breeze rustling through leaves',
    category: 'nature',
    icon: '🍃',
    audioType: 'generated',
    isPremium: false,
    generatorConfig: {
      type: 'noise',
      noiseType: 'pink',
    },
  },
  {
    id: 'stream',
    name: 'Babbling Stream',
    description: 'Peaceful water flowing over rocks',
    category: 'nature',
    icon: '💧',
    audioType: 'generated',
    isPremium: false,
    generatorConfig: {
      type: 'noise',
      noiseType: 'brown',
    },
  },
  {
    id: 'fan-noise',
    name: 'Fan Noise',
    description: 'Steady electric fan hum',
    category: 'white-noise',
    icon: '🌀',
    audioType: 'generated',
    isPremium: false,
    generatorConfig: {
      type: 'noise',
      noiseType: 'pink',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PREMIUM SOUNDS - Enhanced variety and quality
  // ═══════════════════════════════════════════════════════════════════════════

  // Nature category
  {
    id: 'forest-ambience',
    name: 'Forest Birds',
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
    id: 'night-crickets',
    name: 'Night Crickets',
    description: 'Summer night with chirping crickets',
    category: 'nature',
    icon: '🦗',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'white',
    },
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    description: 'Powerful cascading waterfall',
    category: 'nature',
    icon: '🏞️',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'brown',
    },
  },

  // Rain category
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
    id: 'rain-heavy',
    name: 'Heavy Rain',
    description: 'Intense downpour on a roof',
    category: 'rain',
    icon: '🌧️',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'brown',
    },
  },
  {
    id: 'rain-car',
    name: 'Rain in Car',
    description: 'Rain hitting car windows while parked',
    category: 'rain',
    icon: '🚗',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'pink',
    },
  },

  // Cafe category
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
    id: 'library',
    name: 'Quiet Library',
    description: 'Soft pages turning and distant whispers',
    category: 'cafe',
    icon: '📚',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'pink',
    },
  },
  {
    id: 'train-journey',
    name: 'Train Journey',
    description: 'Rhythmic train on tracks',
    category: 'cafe',
    icon: '🚂',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'brown',
    },
  },
  {
    id: 'airplane-cabin',
    name: 'Airplane Cabin',
    description: 'Airplane white noise at cruising altitude',
    category: 'cafe',
    icon: '✈️',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'noise',
      noiseType: 'pink',
    },
  },

  // Focus/Lo-Fi category - Binaural beats
  {
    id: 'alpha-waves',
    name: 'Alpha Waves',
    description: '10Hz for relaxed alertness',
    category: 'lofi',
    icon: '🌊',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'binaural',
      binauralBase: 200,
      binauralBeat: 10,
    },
  },
  {
    id: 'theta-waves',
    name: 'Theta Waves',
    description: '6Hz for creativity and meditation',
    category: 'lofi',
    icon: '🔮',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'binaural',
      binauralBase: 180,
      binauralBeat: 6,
    },
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    description: '18Hz beta waves for intense work',
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
  {
    id: 'study-tone',
    name: 'Study Tone',
    description: '14Hz for learning and memory',
    category: 'lofi',
    icon: '📖',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'binaural',
      binauralBase: 220,
      binauralBeat: 14,
    },
  },
  {
    id: 'sleep-delta',
    name: 'Sleep Delta',
    description: '2Hz delta waves for deep rest',
    category: 'lofi',
    icon: '😴',
    audioType: 'generated',
    isPremium: true,
    generatorConfig: {
      type: 'binaural',
      binauralBase: 150,
      binauralBeat: 2,
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
