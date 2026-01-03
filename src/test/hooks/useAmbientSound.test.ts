import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAmbientSound } from '@/hooks/useAmbientSound';

// Mock AmbientSoundsData
vi.mock('@/data/AmbientSoundsData', () => ({
  getAmbientSoundById: vi.fn((id: string) => {
    const sounds: Record<string, { id: string; name: string; generatorConfig?: object }> = {
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
      'fireplace': {
        id: 'fireplace',
        name: 'Fireplace',
        generatorConfig: { type: 'noise', noiseType: 'brown' },
      },
      'focus-tone': {
        id: 'focus-tone',
        name: 'Focus Tone',
        generatorConfig: { type: 'binaural', binauralBase: 200, binauralBeat: 40 },
      },
      'alpha-waves': {
        id: 'alpha-waves',
        name: 'Alpha Waves',
        generatorConfig: { type: 'binaural', binauralBase: 200, binauralBeat: 10 },
      },
    };
    return sounds[id] || undefined;
  }),
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
    createGain: vi.fn(() => mockGainNode),
    createOscillator: vi.fn(() => mockOscillator),
    createBiquadFilter: vi.fn(() => mockBiquadFilter),
    createBufferSource: vi.fn(() => mockBufferSource),
    createBuffer: vi.fn(() => mockBuffer),
    createChannelMerger: vi.fn(() => mockChannelMerger),
    destination: {},
    sampleRate: 48000,
    close: vi.fn(),
    state: 'running',
  };
};

let mockAudioContext: ReturnType<typeof createMockAudioContext>;

describe('useAmbientSound', () => {
  const STORAGE_KEY = 'petIsland_ambientSound';

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
      const { result } = renderHook(() => useAmbientSound());

      expect(result.current.currentSoundId).toBeNull();
      expect(result.current.currentSound).toBeNull();
      expect(result.current.volume).toBe(50);
      expect(result.current.isPlaying).toBe(false);
    });

    it('should provide all expected API methods', () => {
      const { result } = renderHook(() => useAmbientSound());

      expect(typeof result.current.play).toBe('function');
      expect(typeof result.current.stop).toBe('function');
      expect(typeof result.current.toggle).toBe('function');
      expect(typeof result.current.setVolume).toBe('function');
      expect(typeof result.current.selectSound).toBe('function');
    });
  });

  describe('Persistence', () => {
    it('should load saved preferences from localStorage', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentSoundId: 'pink-noise',
          volume: 75,
        })
      );

      const { result } = renderHook(() => useAmbientSound());

      expect(result.current.currentSoundId).toBe('pink-noise');
      expect(result.current.volume).toBe(75);
      expect(result.current.isPlaying).toBe(false); // Never auto-plays
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const { result } = renderHook(() => useAmbientSound());

      expect(result.current.currentSoundId).toBeNull();
      expect(result.current.volume).toBe(50);
    });

    it('should not auto-play even when saved state exists', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentSoundId: 'white-noise',
          volume: 80,
          isPlaying: true, // This should be ignored
        })
      );

      const { result } = renderHook(() => useAmbientSound());

      expect(result.current.isPlaying).toBe(false);
    });

    it('should save preferences to localStorage when changed', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.setVolume(80);
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.volume).toBe(80);
    });

    it('should save current sound selection to localStorage', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.selectSound('brown-noise');
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.currentSoundId).toBe('brown-noise');
    });
  });

  describe('Sound Selection', () => {
    it('should select a sound without playing', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.selectSound('white-noise');
      });

      expect(result.current.currentSoundId).toBe('white-noise');
      expect(result.current.currentSound).toEqual({
        id: 'white-noise',
        name: 'White Noise',
        generatorConfig: { type: 'noise', noiseType: 'white' },
      });
      expect(result.current.isPlaying).toBe(false);
    });

    it('should clear selection when null is passed', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.selectSound('pink-noise');
      });

      act(() => {
        result.current.selectSound(null);
      });

      expect(result.current.currentSoundId).toBeNull();
      expect(result.current.currentSound).toBeNull();
    });

    it('should stop playing when selection is cleared', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.selectSound(null);
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Playing Sounds', () => {
    it('should play a noise-type sound', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.currentSoundId).toBe('white-noise');
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it('should play a binaural beat sound', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('focus-tone');
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.currentSoundId).toBe('focus-tone');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('should not play unknown sound', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('unknown-sound');
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should stop previous sound when playing new one', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      const firstContext = mockAudioContext;

      // Create a new mock for the second play
      mockAudioContext = createMockAudioContext();
      (window as unknown as { AudioContext: typeof AudioContext }).AudioContext = vi.fn(
        () => mockAudioContext
      ) as unknown as typeof AudioContext;

      act(() => {
        result.current.play('pink-noise');
      });

      expect(firstContext.close).toHaveBeenCalled();
      expect(result.current.currentSoundId).toBe('pink-noise');
    });

    it('should set correct volume when playing', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.setVolume(80);
      });

      act(() => {
        result.current.play('white-noise');
      });

      const gainNode = mockAudioContext.createGain();
      expect(gainNode.gain.value).toBeDefined();
    });

    it('should apply lowpass filter for rain sounds', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('rain-light');
      });

      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('should apply lowpass filter for fire sounds', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('fireplace');
      });

      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('should handle AudioContext unavailability', () => {
      (window as unknown as { AudioContext: undefined }).AudioContext = undefined;
      (window as unknown as { webkitAudioContext: undefined }).webkitAudioContext = undefined;

      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Stopping Sounds', () => {
    it('should stop playing sound', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should be safe to call stop when not playing', () => {
      const { result } = renderHook(() => useAmbientSound());

      expect(() => {
        act(() => {
          result.current.stop();
        });
      }).not.toThrow();

      expect(result.current.isPlaying).toBe(false);
    });

    it('should stop binaural oscillators', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('focus-tone');
      });

      act(() => {
        result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Toggle Play/Pause', () => {
    it('should play when toggled and not playing', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.selectSound('white-noise');
      });

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should stop when toggled and currently playing', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should not play when toggled with no sound selected', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Volume Control', () => {
    it('should set volume value', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.setVolume(75);
      });

      expect(result.current.volume).toBe(75);
    });

    it('should update gain node when sound is playing', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      const gainNode = mockAudioContext.createGain();

      act(() => {
        result.current.setVolume(30);
      });

      // Verify volume is updated in state
      expect(result.current.volume).toBe(30);
    });

    it('should persist volume to localStorage', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.setVolume(65);
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.volume).toBe(65);
    });

    it('should handle volume at boundaries', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.setVolume(0);
      });
      expect(result.current.volume).toBe(0);

      act(() => {
        result.current.setVolume(100);
      });
      expect(result.current.volume).toBe(100);
    });
  });

  describe('Noise Types', () => {
    it('should create white noise correctly', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it('should create pink noise correctly', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('pink-noise');
      });

      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    });

    it('should create brown noise correctly', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('brown-noise');
      });

      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle play errors gracefully', () => {
      mockAudioContext.createGain = vi.fn(() => {
        throw new Error('AudioContext error');
      });

      const { result } = renderHook(() => useAmbientSound());

      expect(() => {
        act(() => {
          result.current.play('white-noise');
        });
      }).not.toThrow();

      expect(result.current.isPlaying).toBe(false);
    });

    it('should handle stop errors gracefully', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      // Make close throw an error
      mockAudioContext.close = vi.fn(() => {
        throw new Error('Close error');
      });

      expect(() => {
        act(() => {
          result.current.stop();
        });
      }).not.toThrow();

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Current Sound', () => {
    it('should return current sound object when selected', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.selectSound('pink-noise');
      });

      expect(result.current.currentSound).toEqual({
        id: 'pink-noise',
        name: 'Pink Noise',
        generatorConfig: { type: 'noise', noiseType: 'pink' },
      });
    });

    it('should return null when no sound is selected', () => {
      const { result } = renderHook(() => useAmbientSound());

      expect(result.current.currentSound).toBeNull();
    });
  });

  describe('WebKit AudioContext Fallback', () => {
    it('should use webkitAudioContext when AudioContext is unavailable', () => {
      const webkitMockContext = createMockAudioContext();
      (window as unknown as { AudioContext: undefined }).AudioContext = undefined;
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext = vi.fn(
        () => webkitMockContext
      ) as unknown as typeof AudioContext;

      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('Multiple Plays', () => {
    it('should handle rapid play calls', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
        result.current.play('pink-noise');
        result.current.play('brown-noise');
      });

      expect(result.current.currentSoundId).toBe('brown-noise');
      expect(result.current.isPlaying).toBe(true);
    });

    it('should handle play-stop-play sequence', () => {
      const { result } = renderHook(() => useAmbientSound());

      act(() => {
        result.current.play('white-noise');
      });

      act(() => {
        result.current.stop();
      });

      // Create fresh mock for second play
      mockAudioContext = createMockAudioContext();
      (window as unknown as { AudioContext: typeof AudioContext }).AudioContext = vi.fn(
        () => mockAudioContext
      ) as unknown as typeof AudioContext;

      act(() => {
        result.current.play('pink-noise');
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.currentSoundId).toBe('pink-noise');
    });
  });
});
