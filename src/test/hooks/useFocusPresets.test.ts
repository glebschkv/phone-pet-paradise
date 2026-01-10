import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusPresets, DEFAULT_PRESETS } from '@/hooks/useFocusPresets';

// Mock usePremiumStatus
vi.mock('@/hooks/usePremiumStatus', () => ({
  TIER_BENEFITS: {
    free: { focusPresetSlots: 1 },
    premium: { focusPresetSlots: 3 },
    premium_plus: { focusPresetSlots: 5 },
    lifetime: { focusPresetSlots: 10 },
  },
  isValidSubscriptionTier: (value: unknown): value is 'free' | 'premium' | 'premium_plus' | 'lifetime' => {
    return typeof value === 'string' && ['free', 'premium', 'premium_plus', 'lifetime'].includes(value);
  },
}));

describe('useFocusPresets', () => {
  const STORAGE_KEY = 'petIsland_focusPresets';
  const PREMIUM_KEY = 'petIsland_premium';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default presets', () => {
      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.presets).toHaveLength(DEFAULT_PRESETS.length);
      expect(result.current.presets.some(p => p.id === 'default-pomodoro')).toBe(true);
      expect(result.current.presets.some(p => p.id === 'default-deep-work')).toBe(true);
      expect(result.current.presets.some(p => p.id === 'default-quick')).toBe(true);
    });

    it('should set default-pomodoro as active preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.activePresetId).toBe('default-pomodoro');
    });

    it('should have correct max custom presets for free tier', () => {
      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.maxCustomPresets).toBe(1);
    });

    it('should have zero custom presets initially', () => {
      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.customPresetsCount).toBe(0);
    });

    it('should provide all expected API methods', () => {
      const { result } = renderHook(() => useFocusPresets());

      expect(typeof result.current.getActivePreset).toBe('function');
      expect(typeof result.current.setActivePreset).toBe('function');
      expect(typeof result.current.createPreset).toBe('function');
      expect(typeof result.current.updatePreset).toBe('function');
      expect(typeof result.current.deletePreset).toBe('function');
      expect(typeof result.current.duplicatePreset).toBe('function');
      expect(typeof result.current.getAllPresets).toBe('function');
      expect(typeof result.current.getCustomPresets).toBe('function');
      expect(typeof result.current.getDefaultPresets).toBe('function');
      expect(typeof result.current.canCreatePreset).toBe('function');
    });
  });

  describe('Premium Tier Limits', () => {
    it('should allow 3 custom presets for premium tier', () => {
      localStorage.setItem(PREMIUM_KEY, JSON.stringify({ tier: 'premium' }));

      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.maxCustomPresets).toBe(3);
    });

    it('should allow 5 custom presets for premium_plus tier', () => {
      localStorage.setItem(PREMIUM_KEY, JSON.stringify({ tier: 'premium_plus' }));

      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.maxCustomPresets).toBe(5);
    });

    it('should allow 10 custom presets for lifetime tier', () => {
      localStorage.setItem(PREMIUM_KEY, JSON.stringify({ tier: 'lifetime' }));

      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.maxCustomPresets).toBe(10);
    });

    it('should handle invalid premium data gracefully', () => {
      localStorage.setItem(PREMIUM_KEY, 'invalid-json');

      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.maxCustomPresets).toBe(1);
    });
  });

  describe('Persistence', () => {
    it('should load saved custom presets from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        presets: [{
          id: 'custom-1234',
          name: 'My Custom Preset',
          icon: '🔥',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: true,
          autoStartFocus: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          isDefault: false,
        }],
        activePresetId: 'custom-1234',
      }));

      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.presets.length).toBe(DEFAULT_PRESETS.length + 1);
      expect(result.current.presets.some(p => p.name === 'My Custom Preset')).toBe(true);
      expect(result.current.activePresetId).toBe('custom-1234');
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.presets).toHaveLength(DEFAULT_PRESETS.length);
    });

    it('should only save custom presets to localStorage', () => {
      const { result } = renderHook(() => useFocusPresets());

      act(() => {
        result.current.createPreset({
          name: 'Custom',
          icon: '🔥',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.presets).toHaveLength(1);
      expect(saved.presets[0].name).toBe('Custom');
    });
  });

  describe('getActivePreset', () => {
    it('should return the active preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      const activePreset = result.current.getActivePreset();

      expect(activePreset).not.toBeNull();
      expect(activePreset?.id).toBe('default-pomodoro');
      expect(activePreset?.focusDuration).toBe(25);
    });

    it('should return null if active preset not found', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        presets: [],
        activePresetId: 'non-existent',
      }));

      const { result } = renderHook(() => useFocusPresets());

      // After loading, it should still have default presets
      const activePreset = result.current.getActivePreset();
      expect(activePreset).toBeDefined();
    });
  });

  describe('setActivePreset', () => {
    it('should change the active preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      act(() => {
        result.current.setActivePreset('default-deep-work');
      });

      expect(result.current.activePresetId).toBe('default-deep-work');
    });

    it('should not change if preset does not exist', () => {
      const { result } = renderHook(() => useFocusPresets());

      act(() => {
        result.current.setActivePreset('non-existent');
      });

      expect(result.current.activePresetId).toBe('default-pomodoro');
    });

    it('should persist active preset to localStorage', () => {
      const { result } = renderHook(() => useFocusPresets());

      act(() => {
        result.current.setActivePreset('default-quick');
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.activePresetId).toBe('default-quick');
    });
  });

  describe('createPreset', () => {
    it('should create a new custom preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      let newPreset: ReturnType<typeof result.current.createPreset> | undefined;
      act(() => {
        newPreset = result.current.createPreset({
          name: 'My Preset',
          icon: '💪',
          focusDuration: 40,
          breakDuration: 8,
          longBreakDuration: 20,
          sessionsBeforeLongBreak: 3,
          autoStartBreaks: true,
          autoStartFocus: true,
        });
      });

      expect(newPreset).not.toBeNull();
      expect(newPreset?.name).toBe('My Preset');
      expect(newPreset?.focusDuration).toBe(40);
      expect(newPreset?.isDefault).toBe(false);
      expect(newPreset?.id).toMatch(/^custom-/);
    });

    it('should return null when at max capacity', () => {
      const { result } = renderHook(() => useFocusPresets());

      // Create first preset (max for free tier)
      act(() => {
        result.current.createPreset({
          name: 'First',
          icon: '1️⃣',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      expect(result.current.canCreatePreset()).toBe(false);

      // Try to create second preset
      let secondPreset: ReturnType<typeof result.current.createPreset> | undefined;
      act(() => {
        secondPreset = result.current.createPreset({
          name: 'Second',
          icon: '2️⃣',
          focusDuration: 45,
          breakDuration: 10,
          longBreakDuration: 20,
          sessionsBeforeLongBreak: 3,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      expect(secondPreset).toBeNull();
      expect(result.current.customPresetsCount).toBe(1);
    });

    it('should set correct timestamps', () => {
      const { result } = renderHook(() => useFocusPresets());

      let newPreset: ReturnType<typeof result.current.createPreset> | undefined;
      act(() => {
        newPreset = result.current.createPreset({
          name: 'Timed Preset',
          icon: '⏰',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      expect(newPreset?.createdAt).toBe('2025-01-15T10:00:00.000Z');
      expect(newPreset?.updatedAt).toBe('2025-01-15T10:00:00.000Z');
    });
  });

  describe('updatePreset', () => {
    it('should update a custom preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      let newPreset: ReturnType<typeof result.current.createPreset> | undefined;
      act(() => {
        newPreset = result.current.createPreset({
          name: 'Original',
          icon: '📝',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      vi.advanceTimersByTime(60000); // Advance 1 minute

      let success: boolean = false;
      act(() => {
        success = result.current.updatePreset(newPreset!.id, {
          name: 'Updated',
          focusDuration: 45,
        });
      });

      expect(success).toBe(true);
      const updated = result.current.presets.find(p => p.id === newPreset!.id);
      expect(updated?.name).toBe('Updated');
      expect(updated?.focusDuration).toBe(45);
    });

    it('should not update default presets', () => {
      const { result } = renderHook(() => useFocusPresets());

      let success: boolean = false;
      act(() => {
        success = result.current.updatePreset('default-pomodoro', {
          name: 'Hacked Pomodoro',
        });
      });

      expect(success).toBe(false);
      const preset = result.current.presets.find(p => p.id === 'default-pomodoro');
      expect(preset?.name).toBe('Classic Pomodoro');
    });

    it('should return false for non-existent preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      let success: boolean = false;
      act(() => {
        success = result.current.updatePreset('non-existent', {
          name: 'Whatever',
        });
      });

      expect(success).toBe(false);
    });

    it('should update the updatedAt timestamp', () => {
      const { result } = renderHook(() => useFocusPresets());

      let newPreset: ReturnType<typeof result.current.createPreset>;
      act(() => {
        newPreset = result.current.createPreset({
          name: 'Original',
          icon: '📝',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      const originalUpdatedAt = newPreset!.updatedAt;

      vi.advanceTimersByTime(60000); // Advance 1 minute

      act(() => {
        result.current.updatePreset(newPreset!.id, { name: 'Updated' });
      });

      const updated = result.current.presets.find(p => p.id === newPreset!.id);
      expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('deletePreset', () => {
    it('should delete a custom preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      let newPreset: ReturnType<typeof result.current.createPreset>;
      act(() => {
        newPreset = result.current.createPreset({
          name: 'To Delete',
          icon: '🗑️',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      expect(result.current.customPresetsCount).toBe(1);

      let success: boolean = false;
      act(() => {
        success = result.current.deletePreset(newPreset!.id);
      });

      expect(success).toBe(true);
      expect(result.current.customPresetsCount).toBe(0);
      expect(result.current.presets.find(p => p.id === newPreset!.id)).toBeUndefined();
    });

    it('should not delete default presets', () => {
      const { result } = renderHook(() => useFocusPresets());

      let success: boolean = false;
      act(() => {
        success = result.current.deletePreset('default-pomodoro');
      });

      expect(success).toBe(false);
      expect(result.current.presets.find(p => p.id === 'default-pomodoro')).toBeDefined();
    });

    it('should switch to default preset when deleting active custom preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      let newPreset: ReturnType<typeof result.current.createPreset>;
      act(() => {
        newPreset = result.current.createPreset({
          name: 'Active Custom',
          icon: '⭐',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      act(() => {
        result.current.setActivePreset(newPreset!.id);
      });

      expect(result.current.activePresetId).toBe(newPreset!.id);

      act(() => {
        result.current.deletePreset(newPreset!.id);
      });

      expect(result.current.activePresetId).toBe('default-pomodoro');
    });

    it('should return false for non-existent preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      let success: boolean = false;
      act(() => {
        success = result.current.deletePreset('non-existent');
      });

      expect(success).toBe(false);
    });
  });

  describe('duplicatePreset', () => {
    it('should duplicate a preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      let duplicated: ReturnType<typeof result.current.duplicatePreset> | undefined;
      act(() => {
        duplicated = result.current.duplicatePreset('default-pomodoro');
      });

      expect(duplicated).not.toBeNull();
      expect(duplicated?.name).toBe('Classic Pomodoro (Copy)');
      expect(duplicated?.focusDuration).toBe(25);
      expect(duplicated?.isDefault).toBe(false);
    });

    it('should use custom name when provided', () => {
      const { result } = renderHook(() => useFocusPresets());

      let duplicated: ReturnType<typeof result.current.duplicatePreset> | undefined;
      act(() => {
        duplicated = result.current.duplicatePreset('default-deep-work', 'My Deep Work');
      });

      expect(duplicated?.name).toBe('My Deep Work');
    });

    it('should return null when at max capacity', () => {
      const { result } = renderHook(() => useFocusPresets());

      act(() => {
        result.current.duplicatePreset('default-pomodoro');
      });

      expect(result.current.canCreatePreset()).toBe(false);

      let secondDuplicate: ReturnType<typeof result.current.duplicatePreset> | undefined;
      act(() => {
        secondDuplicate = result.current.duplicatePreset('default-deep-work');
      });

      expect(secondDuplicate).toBeNull();
    });

    it('should return null for non-existent preset', () => {
      const { result } = renderHook(() => useFocusPresets());

      let duplicated: ReturnType<typeof result.current.duplicatePreset> | undefined;
      act(() => {
        duplicated = result.current.duplicatePreset('non-existent');
      });

      expect(duplicated).toBeNull();
    });
  });

  describe('canCreatePreset', () => {
    it('should return true when under limit', () => {
      const { result } = renderHook(() => useFocusPresets());

      expect(result.current.canCreatePreset()).toBe(true);
    });

    it('should return false when at limit', () => {
      const { result } = renderHook(() => useFocusPresets());

      act(() => {
        result.current.createPreset({
          name: 'Max',
          icon: '🔒',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      expect(result.current.canCreatePreset()).toBe(false);
    });
  });

  describe('Preset Getters', () => {
    it('should get all presets', () => {
      const { result } = renderHook(() => useFocusPresets());

      const all = result.current.getAllPresets();
      expect(all).toHaveLength(DEFAULT_PRESETS.length);
    });

    it('should get only default presets', () => {
      const { result } = renderHook(() => useFocusPresets());

      act(() => {
        result.current.createPreset({
          name: 'Custom',
          icon: '🔥',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      const defaults = result.current.getDefaultPresets();
      expect(defaults).toHaveLength(DEFAULT_PRESETS.length);
      expect(defaults.every(p => p.isDefault)).toBe(true);
    });

    it('should get only custom presets', () => {
      const { result } = renderHook(() => useFocusPresets());

      act(() => {
        result.current.createPreset({
          name: 'Custom',
          icon: '🔥',
          focusDuration: 30,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        });
      });

      const customs = result.current.getCustomPresets();
      expect(customs).toHaveLength(1);
      expect(customs[0].name).toBe('Custom');
      expect(customs[0].isDefault).toBe(false);
    });
  });
});
