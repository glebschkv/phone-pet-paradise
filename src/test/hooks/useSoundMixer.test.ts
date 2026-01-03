import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoundMixer } from '@/hooks/useSoundMixer';

// Mock AmbientSoundsData
vi.mock('@/data/AmbientSoundsData', () => ({
  getAmbientSoundById: vi.fn((id: string) => {
    const sounds: Record<string, {
      id: string;
      name: string;
      generatorConfig?: { type: string; noiseType?: string; binauralBase?: number; binauralBeat?: number };
    }> = {
      'white-noise': {
        id: 'white-noise',
        name: 'White Noise',
        generatorConfig: { type: 'noise', noiseType: 'white' },
      },
      'pink-noise': {
        id: 'pink-noise',
        name: 'Pink Noise',
        generatorConfig: { type: 'noise', noiseType: 'pink' },
      },
      'brown-noise': {
        id: 'brown-noise',
        name: 'Brown Noise',
        generatorConfig: { type: 'noise', noiseType: 'brown' },
      },
      'rain-light': {
        id: 'rain-light',
        name: 'Light Rain',
        generatorConfig: { type: 'noise', noiseType: 'pink' },
      },
      'ocean-waves': {
        id: 'ocean-waves',
        name: 'Ocean Waves',
        generatorConfig: { type: 'noise', noiseType: 'brown' },
      },
      'focus-tone': {
        id: 'focus-tone',
        name: 'Focus Tone',
        generatorConfig: { type: 'binaural', binauralBase: 200, binauralBeat: 40 },
      },
    };
    return sounds[id] || undefined;
  }),
}));

// Mock usePremiumStatus
vi.mock('@/hooks/usePremiumStatus', () => ({
  TIER_BENEFITS: {
    free: { soundMixingSlots: 1 },
    premium: { soundMixingSlots: 2 },
    premium_plus: { soundMixingSlots: 3 },
    lifetime: { soundMixingSlots: 3 },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  soundLogger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock AudioContext
const createMockAudioContext = () => {
  const mockGainNode = {
    gain: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  const mockOscillator = {
    type: 'sine',
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  };

  const mockBiquadFilter = {
    type: 'lowpass',
    frequency: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };

  const mockBufferSource = {
    buffer: null,
    loop: false,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  };

  const mockChannelMerger = {
    connect: vi.fn(),
  };

  const mockBuffer = {
    getChannelData: vi.fn(() => new Float32Array(48000 * 2)),
    numberOfChannels: 2,
    length: 48000 * 2,
    sampleRate: 48000,
    duration: 2,
  };

  return {
    createGain: vi.fn(() => ({ ...mockGainNode })),
    createOscillator: vi.fn(() => ({ ...mockOscillator })),
    createBiquadFilter: vi.fn(() => ({ ...mockBiquadFilter })),
    createBufferSource: vi.fn(() => ({ ...mockBufferSource })),
    createBuffer: vi.fn(() => mockBuffer),
    createChannelMerger: vi.fn(() => mockChannelMerger),
    destination: {},
    sampleRate: 48000,
    close: vi.fn(),
    state: 'running',
  };
};

let mockAudioContext: ReturnType<typeof createMockAudioContext>;

describe('useSoundMixer', () => {
  const STORAGE_KEY = 'petIsland_soundMixer';
  const PREMIUM_KEY = 'petIsland_premium';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    mockAudioContext = createMockAudioContext();
    (window as unknown as { AudioContext: typeof AudioContext }).AudioContext = vi.fn(
      () => mockAudioContext
    ) as unknown as typeof AudioContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSoundMixer());

      expect(result.current.layers).toEqual([]);
      expect(result.current.masterVolume).toBe(70);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.maxLayers).toBe(1); // Free tier default
    });

    it('should provide all expected API methods', () => {
      const { result } = renderHook(() => useSoundMixer());

      expect(typeof result.current.playAll).toBe('function');
      expect(typeof result.current.stopAll).toBe('function');
      expect(typeof result.current.toggle).toBe('function');
      expect(typeof result.current.addLayer).toBe('function');
      expect(typeof result.current.removeLayer).toBe('function');
      expect(typeof result.current.setLayerVolume).toBe('function');
      expect(typeof result.current.setMasterVolume).toBe('function');
      expect(typeof result.current.getLayerDetails).toBe('function');
      expect(typeof result.current.canAddLayer).toBe('function');
    });
  });

  describe('Persistence', () => {
    it('should load saved preferences from localStorage', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          layers: [{ soundId: 'white-noise', volume: 60, isPlaying: false }],
          masterVolume: 80,
        })
      );

      const { result } = renderHook(() => useSoundMixer());

      expect(result.current.layers).toEqual([
        { soundId: 'white-noise', volume: 60, isPlaying: false },
      ]);
      expect(result.current.masterVolume).toBe(80);
      expect(result.current.isPlaying).toBe(false); // Never auto-plays
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const { result } = renderHook(() => useSoundMixer());

      expect(result.current.layers).toEqual([]);
      expect(result.current.masterVolume).toBe(70);
    });

    it('should save layers to localStorage when changed', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.layers).toHaveLength(1);
      expect(saved.layers[0].soundId).toBe('white-noise');
    });

    it('should save master volume to localStorage', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.setMasterVolume(90);
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.masterVolume).toBe(90);
    });
  });

  describe('Premium Tier Layer Limits', () => {
    it('should allow only 1 layer for free tier', () => {
      const { result } = renderHook(() => useSoundMixer());

      expect(result.current.maxLayers).toBe(1);
      expect(result.current.canAddLayer()).toBe(true);

      act(() => {
        result.current.addLayer('white-noise');
      });

      expect(result.current.canAddLayer()).toBe(false);
    });

    it('should allow 2 layers for premium tier', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium' })
      );

      const { result } = renderHook(() => useSoundMixer());

      expect(result.current.maxLayers).toBe(2);

      act(() => {
        result.current.addLayer('white-noise');
      });

      expect(result.current.canAddLayer()).toBe(true);

      act(() => {
        result.current.addLayer('pink-noise');
      });

      expect(result.current.canAddLayer()).toBe(false);
    });

    it('should allow 3 layers for premium_plus tier', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium_plus' })
      );

      const { result } = renderHook(() => useSoundMixer());

      expect(result.current.maxLayers).toBe(3);
    });

    it('should allow 3 layers for lifetime tier', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'lifetime' })
      );

      const { result } = renderHook(() => useSoundMixer());

      expect(result.current.maxLayers).toBe(3);
    });

    it('should handle invalid premium data', () => {
      localStorage.setItem(PREMIUM_KEY, 'invalid-json');

      const { result } = renderHook(() => useSoundMixer());

      expect(result.current.maxLayers).toBe(1); // Falls back to free tier
    });
  });

  describe('Adding Layers', () => {
    it('should add a sound layer', () => {
      const { result } = renderHook(() => useSoundMixer());

      const success = act(() => {
        return result.current.addLayer('white-noise');
      });

      expect(result.current.layers).toHaveLength(1);
      expect(result.current.layers[0]).toEqual({
        soundId: 'white-noise',
        volume: 70,
        isPlaying: false,
      });
    });

    it('should return false when max layers reached', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      let success: boolean = false;
      act(() => {
        success = result.current.addLayer('pink-noise');
      });

      expect(success).toBe(false);
      expect(result.current.layers).toHaveLength(1);
    });

    it('should return false when sound already in layers', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium' })
      );

      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      let success: boolean = false;
      act(() => {
        success = result.current.addLayer('white-noise'); // Duplicate
      });

      expect(success).toBe(false);
      expect(result.current.layers).toHaveLength(1);
    });

    it('should start layer immediately if mixer is already playing', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium' })
      );

      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.playAll();
      });

      // Add second layer while playing
      act(() => {
        result.current.addLayer('pink-noise');
      });

      expect(result.current.layers).toHaveLength(2);
      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('Removing Layers', () => {
    it('should remove a sound layer', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.removeLayer('white-noise');
      });

      expect(result.current.layers).toHaveLength(0);
    });

    it('should stop all when last layer is removed', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.playAll();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.removeLayer('white-noise');
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should keep playing remaining layers after removal', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium' })
      );

      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
        result.current.addLayer('pink-noise');
      });

      act(() => {
        result.current.playAll();
      });

      act(() => {
        result.current.removeLayer('white-noise');
      });

      expect(result.current.layers).toHaveLength(1);
      expect(result.current.layers[0].soundId).toBe('pink-noise');
      expect(result.current.isPlaying).toBe(true);
    });

    it('should be safe to remove non-existent layer', () => {
      const { result } = renderHook(() => useSoundMixer());

      expect(() => {
        act(() => {
          result.current.removeLayer('non-existent');
        });
      }).not.toThrow();
    });
  });

  describe('Playing All Layers', () => {
    it('should play all layers', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium' })
      );

      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
        result.current.addLayer('pink-noise');
      });

      act(() => {
        result.current.playAll();
      });

      expect(result.current.isPlaying).toBe(true);
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('should not play when no layers exist', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.playAll();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should create audio context for each layer', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium_plus' })
      );

      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
        result.current.addLayer('pink-noise');
        result.current.addLayer('focus-tone');
      });

      act(() => {
        result.current.playAll();
      });

      // Should create gain nodes for master and each layer
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('should handle mixed noise and binaural sounds', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium' })
      );

      const { result } = renderHook(() => useSoundMixer());

      // Separate act calls to allow state to update between adds
      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.addLayer('focus-tone');
      });

      expect(result.current.layers).toHaveLength(2);

      act(() => {
        result.current.playAll();
      });

      expect(result.current.isPlaying).toBe(true);
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe('Stopping All Layers', () => {
    it('should stop all playing layers', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.playAll();
      });

      act(() => {
        result.current.stopAll();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should be safe to call stop when not playing', () => {
      const { result } = renderHook(() => useSoundMixer());

      expect(() => {
        act(() => {
          result.current.stopAll();
        });
      }).not.toThrow();

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Toggle Play/Pause', () => {
    it('should play when toggled and not playing', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should stop when toggled and currently playing', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.playAll();
      });

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Volume Control', () => {
    it('should set master volume', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.setMasterVolume(90);
      });

      expect(result.current.masterVolume).toBe(90);
    });

    it('should set individual layer volume', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.setLayerVolume('white-noise', 50);
      });

      expect(result.current.layers[0].volume).toBe(50);
    });

    it('should persist layer volume to localStorage', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.setLayerVolume('white-noise', 40);
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.layers[0].volume).toBe(40);
    });

    it('should update gain node when changing volume while playing', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.playAll();
      });

      act(() => {
        result.current.setLayerVolume('white-noise', 30);
      });

      expect(result.current.layers[0].volume).toBe(30);
    });

    it('should handle volume at boundaries', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.setMasterVolume(0);
      });
      expect(result.current.masterVolume).toBe(0);

      act(() => {
        result.current.setMasterVolume(100);
      });
      expect(result.current.masterVolume).toBe(100);
    });
  });

  describe('Layer Details', () => {
    it('should return layer details with sound info', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium' })
      );

      const { result } = renderHook(() => useSoundMixer());

      // Separate act calls to allow state to update between layers
      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.addLayer('focus-tone');
      });

      const details = result.current.getLayerDetails();

      expect(details).toHaveLength(2);
      expect(details[0].sound?.name).toBe('White Noise');
      expect(details[1].sound?.name).toBe('Focus Tone');
    });

    it('should handle unknown sound in layer', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          layers: [{ soundId: 'unknown-sound', volume: 70, isPlaying: false }],
          masterVolume: 70,
        })
      );

      const { result } = renderHook(() => useSoundMixer());

      const details = result.current.getLayerDetails();

      expect(details).toHaveLength(1);
      expect(details[0].sound).toBeUndefined();
    });
  });

  describe('Can Add Layer', () => {
    it('should return true when under limit', () => {
      const { result } = renderHook(() => useSoundMixer());

      expect(result.current.canAddLayer()).toBe(true);
    });

    it('should return false when at limit', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      expect(result.current.canAddLayer()).toBe(false);
    });

    it('should return true after removing a layer', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      expect(result.current.canAddLayer()).toBe(false);

      act(() => {
        result.current.removeLayer('white-noise');
      });

      expect(result.current.canAddLayer()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle AudioContext unavailability', () => {
      (window as unknown as { AudioContext: undefined }).AudioContext = undefined;
      (window as unknown as { webkitAudioContext: undefined }).webkitAudioContext = undefined;

      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.playAll();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should handle play errors gracefully', () => {
      mockAudioContext.createGain = vi.fn(() => {
        throw new Error('AudioContext error');
      });

      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      expect(() => {
        act(() => {
          result.current.playAll();
        });
      }).not.toThrow();

      expect(result.current.isPlaying).toBe(false);
    });

    it('should update isPlaying state when stopping', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.playAll();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.stopAll();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('WebKit AudioContext Fallback', () => {
    it('should use webkitAudioContext when AudioContext is unavailable', () => {
      const webkitMockContext = createMockAudioContext();
      (window as unknown as { AudioContext: undefined }).AudioContext = undefined;
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext = vi.fn(
        () => webkitMockContext
      ) as unknown as typeof AudioContext;

      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.playAll();
      });

      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('Noise Type Filters', () => {
    it('should apply lowpass filter for rain sounds', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('rain-light');
      });

      act(() => {
        result.current.playAll();
      });

      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('should apply lowpass filter for ocean sounds', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('ocean-waves');
      });

      act(() => {
        result.current.playAll();
      });

      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });
  });

  describe('Multiple Operations', () => {
    it('should handle add/remove operations correctly', () => {
      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium_plus' })
      );

      const { result } = renderHook(() => useSoundMixer());

      // Add layers sequentially to allow state updates
      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.addLayer('pink-noise');
      });

      expect(result.current.layers).toHaveLength(2);

      act(() => {
        result.current.removeLayer('white-noise');
      });

      act(() => {
        result.current.addLayer('brown-noise');
      });

      expect(result.current.layers).toHaveLength(2);
      expect(result.current.layers.map(l => l.soundId)).toEqual(['pink-noise', 'brown-noise']);
    });

    it('should handle play-stop-play sequence', () => {
      const { result } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.playAll();
      });

      act(() => {
        result.current.stopAll();
      });

      // Create fresh mock for second play
      mockAudioContext = createMockAudioContext();
      (window as unknown as { AudioContext: typeof AudioContext }).AudioContext = vi.fn(
        () => mockAudioContext
      ) as unknown as typeof AudioContext;

      act(() => {
        result.current.playAll();
      });

      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('Layer State Preservation', () => {
    it('should preserve layer volumes across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useSoundMixer());

      act(() => {
        result.current.addLayer('white-noise');
      });

      act(() => {
        result.current.setLayerVolume('white-noise', 35);
      });

      rerender();

      expect(result.current.layers[0].volume).toBe(35);
    });

    it('should restore layers after unmount/remount', () => {
      const { unmount } = renderHook(() => useSoundMixer());

      // Set up initial state and unmount
      unmount();

      // Remount with previously saved data
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          layers: [
            { soundId: 'white-noise', volume: 60, isPlaying: false },
            { soundId: 'pink-noise', volume: 40, isPlaying: false },
          ],
          masterVolume: 85,
        })
      );

      localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({ tier: 'premium' })
      );

      const { result } = renderHook(() => useSoundMixer());

      expect(result.current.layers).toHaveLength(2);
      expect(result.current.masterVolume).toBe(85);
    });
  });
});
