import { useState, useEffect, useCallback } from 'react';
import { TIER_BENEFITS, isValidSubscriptionTier, type SubscriptionTier } from './usePremiumStatus';

const FOCUS_PRESETS_STORAGE_KEY = 'petIsland_focusPresets';

export interface FocusPreset {
  id: string;
  name: string;
  description?: string;
  icon: string;
  // Timer settings
  focusDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  // Sound settings (optional)
  ambientSoundIds?: string[];
  soundVolumes?: Record<string, number>;
  // Created timestamp
  createdAt: string;
  updatedAt: string;
  // Is default preset (can't be deleted)
  isDefault?: boolean;
}

// Default presets available to all users
export const DEFAULT_PRESETS: FocusPreset[] = [
  {
    id: 'default-pomodoro',
    name: 'Classic Pomodoro',
    description: 'Traditional 25/5 technique',
    icon: '🍅',
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'default-deep-work',
    name: 'Deep Work',
    description: '50 minute focused sessions',
    icon: '🧠',
    focusDuration: 50,
    breakDuration: 10,
    longBreakDuration: 30,
    sessionsBeforeLongBreak: 3,
    autoStartBreaks: false,
    autoStartFocus: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'default-quick',
    name: 'Quick Focus',
    description: 'Short bursts for quick tasks',
    icon: '⚡',
    focusDuration: 15,
    breakDuration: 3,
    longBreakDuration: 10,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
  },
];

interface FocusPresetsState {
  presets: FocusPreset[];
  activePresetId: string | null;
}

export const useFocusPresets = () => {
  const [state, setState] = useState<FocusPresetsState>({
    presets: [...DEFAULT_PRESETS],
    activePresetId: 'default-pomodoro',
  });

  // Get max presets based on subscription
  const getMaxCustomPresets = useCallback((): number => {
    const premiumData = localStorage.getItem('petIsland_premium');
    if (premiumData) {
      try {
        const parsed = JSON.parse(premiumData);
        if (isValidSubscriptionTier(parsed.tier)) {
          return TIER_BENEFITS[parsed.tier as SubscriptionTier].focusPresetSlots;
        }
      } catch {
        // Invalid data
      }
    }
    return 1; // Free tier = 1 custom preset
  }, []);

  // Load saved presets
  useEffect(() => {
    const saved = localStorage.getItem(FOCUS_PRESETS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge default presets with saved custom presets
        const customPresets = (parsed.presets || []).filter(
          (p: FocusPreset) => !p.isDefault
        );
        setState({
          presets: [...DEFAULT_PRESETS, ...customPresets],
          activePresetId: parsed.activePresetId || 'default-pomodoro',
        });
      } catch {
        // Invalid saved data
      }
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newState: Partial<FocusPresetsState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      // Only save custom presets (not defaults)
      const customPresets = updated.presets.filter(p => !p.isDefault);
      localStorage.setItem(FOCUS_PRESETS_STORAGE_KEY, JSON.stringify({
        presets: customPresets,
        activePresetId: updated.activePresetId,
      }));
      return updated;
    });
  }, []);

  // Get active preset
  const getActivePreset = useCallback((): FocusPreset | null => {
    return state.presets.find(p => p.id === state.activePresetId) || null;
  }, [state.presets, state.activePresetId]);

  // Set active preset
  const setActivePreset = useCallback((presetId: string) => {
    if (state.presets.some(p => p.id === presetId)) {
      saveState({ activePresetId: presetId });
    }
  }, [state.presets, saveState]);

  // Get custom presets count
  const getCustomPresetsCount = useCallback(() => {
    return state.presets.filter(p => !p.isDefault).length;
  }, [state.presets]);

  // Check if can create more presets
  const canCreatePreset = useCallback(() => {
    return getCustomPresetsCount() < getMaxCustomPresets();
  }, [getCustomPresetsCount, getMaxCustomPresets]);

  // Create a new preset
  const createPreset = useCallback((preset: Omit<FocusPreset, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>): FocusPreset | null => {
    if (!canCreatePreset()) {
      return null;
    }

    const newPreset: FocusPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    };

    saveState({ presets: [...state.presets, newPreset] });
    return newPreset;
  }, [state.presets, canCreatePreset, saveState]);

  // Update a preset
  const updatePreset = useCallback((presetId: string, updates: Partial<FocusPreset>): boolean => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset || preset.isDefault) {
      return false; // Can't update default presets
    }

    const updatedPresets = state.presets.map(p =>
      p.id === presetId
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    );

    saveState({ presets: updatedPresets });
    return true;
  }, [state.presets, saveState]);

  // Delete a preset
  const deletePreset = useCallback((presetId: string): boolean => {
    const preset = state.presets.find(p => p.id === presetId);
    if (!preset || preset.isDefault) {
      return false; // Can't delete default presets
    }

    const filteredPresets = state.presets.filter(p => p.id !== presetId);

    // If deleting the active preset, switch to default
    let newActiveId = state.activePresetId;
    if (state.activePresetId === presetId) {
      newActiveId = 'default-pomodoro';
    }

    saveState({ presets: filteredPresets, activePresetId: newActiveId });
    return true;
  }, [state.presets, state.activePresetId, saveState]);

  // Duplicate a preset
  const duplicatePreset = useCallback((presetId: string, newName?: string): FocusPreset | null => {
    if (!canCreatePreset()) {
      return null;
    }

    const preset = state.presets.find(p => p.id === presetId);
    if (!preset) {
      return null;
    }

    const duplicated: FocusPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
      name: newName || `${preset.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    };

    saveState({ presets: [...state.presets, duplicated] });
    return duplicated;
  }, [state.presets, canCreatePreset, saveState]);

  // Get all presets (default + custom)
  const getAllPresets = useCallback(() => {
    return state.presets;
  }, [state.presets]);

  // Get custom presets only
  const getCustomPresets = useCallback(() => {
    return state.presets.filter(p => !p.isDefault);
  }, [state.presets]);

  // Get default presets only
  const getDefaultPresets = useCallback(() => {
    return state.presets.filter(p => p.isDefault);
  }, [state.presets]);

  return {
    presets: state.presets,
    activePresetId: state.activePresetId,
    maxCustomPresets: getMaxCustomPresets(),
    customPresetsCount: getCustomPresetsCount(),
    // Actions
    getActivePreset,
    setActivePreset,
    createPreset,
    updatePreset,
    deletePreset,
    duplicatePreset,
    // Helpers
    getAllPresets,
    getCustomPresets,
    getDefaultPresets,
    canCreatePreset,
  };
};
