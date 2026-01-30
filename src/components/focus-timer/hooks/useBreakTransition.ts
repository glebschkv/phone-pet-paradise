/**
 * useBreakTransition Hook
 *
 * Handles break transitions and auto-break settings.
 * Extracted from useTimerLogic for better separation of concerns.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { timerLogger } from '@/lib/logger';
import { TIMER_PRESETS, TimerPreset } from '../constants';

const AUTO_BREAK_STORAGE_KEY = 'petIsland_autoBreak';

interface BreakTransitionState {
  showBreakModal: boolean;
  autoBreakEnabled: boolean;
}

interface BreakTransitionActions {
  openBreakModal: () => void;
  closeBreakModal: () => void;
  getBreakPreset: (duration: number) => TimerPreset | undefined;
  toggleAutoBreak: (enabled: boolean) => void;
  handleSkipBreak: () => void;
}

export function useBreakTransition(): BreakTransitionState & BreakTransitionActions {
  // Load auto-break setting from localStorage
  const [autoBreakEnabled, setAutoBreakEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTO_BREAK_STORAGE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      timerLogger.error('Failed to load auto-break setting:', error);
      return false;
    }
  });

  const [showBreakModal, setShowBreakModal] = useState(false);

  /**
   * Open the break transition modal
   */
  const openBreakModal = useCallback(() => {
    setShowBreakModal(true);
  }, []);

  /**
   * Close the break transition modal
   */
  const closeBreakModal = useCallback(() => {
    setShowBreakModal(false);
  }, []);

  /**
   * Get the break preset for a given duration
   */
  const getBreakPreset = useCallback((duration: number): TimerPreset | undefined => {
    return TIMER_PRESETS.find(p => p.type === 'break' && p.duration === duration)
      || TIMER_PRESETS.find(p => p.id === 'short-break');
  }, []);

  /**
   * Toggle auto-break setting
   */
  const toggleAutoBreak = useCallback((enabled: boolean) => {
    setAutoBreakEnabled(enabled);
    try {
      localStorage.setItem(AUTO_BREAK_STORAGE_KEY, JSON.stringify(enabled));
    } catch (error) {
      timerLogger.error('Failed to save auto-break setting:', error);
    }
  }, []);

  /**
   * Handle skipping the break
   */
  const handleSkipBreak = useCallback(() => {
    setShowBreakModal(false);
    toast.info('Break skipped', {
      description: "Remember to take breaks regularly!",
      duration: 2000,
    });
  }, []);

  return {
    // State
    showBreakModal,
    autoBreakEnabled,
    // Actions
    openBreakModal,
    closeBreakModal,
    getBreakPreset,
    toggleAutoBreak,
    handleSkipBreak,
  };
}

/**
 * Calculate recommended break duration based on session length
 */
export function getRecommendedBreakDuration(sessionMinutes: number): number {
  if (sessionMinutes >= 90) return 15;
  if (sessionMinutes >= 60) return 10;
  if (sessionMinutes >= 45) return 7;
  return 5;
}

/**
 * Break duration options
 */
export const BREAK_DURATIONS = [5, 10, 15, 20] as const;
export type BreakDuration = typeof BREAK_DURATIONS[number];
