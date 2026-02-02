/**
 * useTimerLogic Hook
 *
 * Main timer orchestration hook that composes smaller focused hooks.
 * Coordinates timer state, controls, countdown, rewards, and breaks.
 *
 * Extracted hooks:
 * - useTimerPersistence: State persistence to localStorage
 * - useTimerAudio: Completion sound effects
 * - useTimerRewards: XP/coin rewards for sessions
 * - useSessionNotes: Post-session reflection notes
 * - useBreakTransition: Break modal and auto-break logic
 * - useTimerControls: Timer start/pause/stop/skip actions
 * - useTimerCountdown: Countdown interval and visibility handling
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from 'sonner';
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDeviceActivity } from "@/hooks/useDeviceActivity";
import { useStreakSystem } from "@/hooks/useStreakSystem";
import { useNotifications } from "@/hooks/useNotifications";
import { TimerPreset, MAX_COUNTUP_DURATION } from "../constants";
import { useTimerPersistence } from "./useTimerPersistence";
import { useTimerAudio } from "./useTimerAudio";
import { useSoundMixer } from "@/hooks/useSoundMixer";
import { useTimerRewards } from "./useTimerRewards";
import { useSessionNotes } from "./useSessionNotes";
import { useBreakTransition } from "./useBreakTransition";
import { useTimerControls } from "./useTimerControls";
import { useTimerCountdown } from "./useTimerCountdown";

export const useTimerLogic = () => {
  const { awardXP } = useBackendAppState();
  const { playCompletionSound } = useTimerAudio();
  const { recordSession } = useAnalytics();
  const { stopAll: stopAmbientSound, isPlaying: isAmbientPlaying } = useSoundMixer();
  const { recordSession: recordStreakSession } = useStreakSystem();
  const { scheduleStreakNotification, scheduleRewardNotification } = useNotifications();

  // Composed hooks
  const { awardSessionRewards, showFocusBonusToast } = useTimerRewards();
  const { saveSessionNote } = useSessionNotes();
  const {
    showBreakModal: showBreakTransitionModal,
    autoBreakEnabled,
    openBreakModal,
    closeBreakModal,
    getBreakPreset,
    toggleAutoBreak,
    handleSkipBreak: breakSkipHandler,
  } = useBreakTransition();

  // App blocking integration
  const {
    isPermissionGranted: appBlockingEnabled,
    hasAppsConfigured,
    blockedAppsCount,
    startAppBlocking,
    stopAppBlocking,
    triggerHaptic,
  } = useDeviceActivity();

  const {
    timerState,
    selectedPreset,
    setSelectedPreset,
    saveTimerState,
    clearPersistence
  } = useTimerPersistence();

  // Local state
  const [displayTime, setDisplayTime] = useState<number>(timerState.timeLeft);
  const [elapsedTime, setElapsedTime] = useState<number>(timerState.elapsedTime || 0);
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [showSessionNotesModal, setShowSessionNotesModal] = useState(false);
  const [lastSessionXP, setLastSessionXP] = useState(0);

  // Refs for stable timer management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // SECURITY: Async lock to prevent race conditions in timer completion
  const completionLockRef = useRef<Promise<void> | null>(null);
  const completionIdRef = useRef<string | null>(null);

  // Store latest values in refs to avoid callback dependency bloat
  const stateRef = useRef({
    timerState,
    hasAppsConfigured,
    blockedAppsCount,
    isAmbientPlaying,
  });

  useEffect(() => {
    stateRef.current = {
      timerState,
      hasAppsConfigured,
      blockedAppsCount,
      isAmbientPlaying,
    };
  });

  // ============================================================================
  // PRESET SELECTION
  // ============================================================================

  const setPreset = useCallback((preset: TimerPreset) => {
    if (!stateRef.current.timerState.isRunning) {
      setSelectedPreset(preset);

      if (preset.isCountup) {
        // Countup mode: start at 0, max duration is 6 hours
        setElapsedTime(0);
        setDisplayTime(0);
        saveTimerState({
          timeLeft: 0,
          elapsedTime: 0,
          sessionDuration: MAX_COUNTUP_DURATION,
          sessionType: 'countup',
          isRunning: false,
          startTime: null,
          isCountup: true,
        });
      } else {
        // Countdown mode: start at preset duration
        const newTimeLeft = preset.duration * 60;
        setDisplayTime(newTimeLeft);
        setElapsedTime(0);
        saveTimerState({
          timeLeft: newTimeLeft,
          elapsedTime: 0,
          sessionDuration: preset.duration * 60,
          sessionType: preset.type,
          isRunning: false,
          startTime: null,
          isCountup: false,
        });
      }
    }
  }, [setSelectedPreset, saveTimerState]);

  // ============================================================================
  // SESSION COMPLETION
  // ============================================================================

  const handleComplete = useCallback(async () => {
    const state = stateRef.current;

    // SECURITY: Prevent race conditions with async lock pattern
    const completionId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    if (completionLockRef.current) {
      await completionLockRef.current;
      if (completionIdRef.current && completionIdRef.current !== completionId) {
        return;
      }
    }

    completionIdRef.current = completionId;

    let releaseLock: (() => void) | undefined;
    completionLockRef.current = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    try {
      // For countup mode, use elapsed time; for countdown, use session duration
      const completedMinutes = state.timerState.isCountup
        ? (state.timerState.elapsedTime || 0) / 60
        : state.timerState.sessionDuration / 60;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      clearPersistence();

      let shieldAttempts = 0;
      if (state.timerState.sessionType !== 'break' && state.hasAppsConfigured) {
        try {
          const blockingResult = await stopAppBlocking();
          shieldAttempts = blockingResult.shieldAttempts;
        } catch (e) {
          console.error('Failed to stop app blocking:', e);
        }
      }

      if (state.isAmbientPlaying) {
        stopAmbientSound();
      }

      if (state.timerState.soundEnabled) {
        playCompletionSound();
      }

      let xpEarned = 0;
      if (state.timerState.sessionType !== 'break') {
        const rewardResult = await awardSessionRewards(
          completedMinutes,
          shieldAttempts,
          state.hasAppsConfigured,
          state.blockedAppsCount,
          {
            sessionType: state.timerState.sessionType,
            sessionDuration: state.timerState.sessionDuration,
            category: state.timerState.category,
            taskLabel: state.timerState.taskLabel,
          }
        );

        xpEarned = rewardResult.xpEarned;

        if (rewardResult.focusBonusType === 'PERFECT FOCUS') {
          triggerHaptic('success');
        }

        showFocusBonusToast(rewardResult.focusBonusType);
      }

      // Determine focus quality from shield attempts
      // When app blocking isn't configured, quality is undefined (neutral) rather
      // than 'distracted' — users shouldn't be penalized for not using app blocking
      const focusQuality = state.timerState.sessionType !== 'break'
        ? (state.hasAppsConfigured
            ? (shieldAttempts === 0
                ? 'perfect' as const
                : shieldAttempts <= 2
                  ? 'good' as const
                  : 'distracted' as const)
            : undefined)
        : undefined;

      // For countup sessions, actualDuration is the elapsed time, not the max duration
      const actualDuration = state.timerState.isCountup
        ? (state.timerState.elapsedTime || 0)
        : state.timerState.sessionDuration;

      recordSession(
        state.timerState.sessionType,
        state.timerState.sessionDuration,
        actualDuration,
        'completed',
        xpEarned,
        state.timerState.category,
        state.timerState.taskLabel,
        state.timerState.sessionType !== 'break' ? shieldAttempts : undefined,
        focusQuality,
        state.hasAppsConfigured,
      );

      // Update streak system and trigger notifications for work sessions
      if (state.timerState.sessionType !== 'break') {
        const streakReward = recordStreakSession();
        if (streakReward) {
          scheduleStreakNotification(streakReward.milestone);
        }
        if (xpEarned > 0) {
          scheduleRewardNotification(xpEarned);
        }
      }

      // Reset display based on mode
      if (state.timerState.isCountup) {
        // For countup, reset to 0
        setElapsedTime(0);
        setDisplayTime(0);
        saveTimerState({
          isRunning: false,
          timeLeft: 0,
          elapsedTime: 0,
          startTime: null,
          completedSessions: state.timerState.completedSessions + 1,
          category: undefined,
          taskLabel: undefined,
        });
      } else {
        // For countdown, reset to session duration
        setDisplayTime(state.timerState.sessionDuration);
        saveTimerState({
          isRunning: false,
          timeLeft: state.timerState.sessionDuration,
          startTime: null,
          completedSessions: state.timerState.completedSessions + 1,
          category: undefined,
          taskLabel: undefined,
        });
      }

      if (state.timerState.sessionType !== 'break') {
        setLastSessionXP(xpEarned);
        setShowSessionNotesModal(true);
      } else {
        toast.info('Break Complete!', {
          description: 'Time to get back to work!',
          duration: 3000,
        });
      }
    } finally {
      completionLockRef.current = null;
      if (releaseLock) releaseLock();
    }
  }, [
    clearPersistence,
    stopAppBlocking,
    stopAmbientSound,
    playCompletionSound,
    awardSessionRewards,
    showFocusBonusToast,
    recordSession,
    recordStreakSession,
    scheduleStreakNotification,
    scheduleRewardNotification,
    saveTimerState,
    triggerHaptic,
  ]);

  // ============================================================================
  // TIMER CONTROLS (Composed)
  // ============================================================================

  const {
    requestStartTimer,
    startTimerWithIntent,
    pauseTimer,
    stopTimer,
    skipTimer,
    toggleSound,
  } = useTimerControls({
    timerState,
    selectedPreset,
    saveTimerState,
    clearPersistence,
    setDisplayTime,
    setShowIntentionModal,
    intervalRef,
    appBlockingEnabled,
    hasAppsConfigured,
    blockedAppsCount,
    startAppBlocking,
    stopAppBlocking,
    triggerHaptic,
    awardXP,
  });

  // ============================================================================
  // TIMER COUNTDOWN (Composed)
  // ============================================================================

  useTimerCountdown({
    timerState,
    saveTimerState,
    setDisplayTime,
    setElapsedTime,
    setShowLockScreen,
    handleComplete,
    intervalRef,
  });

  // ============================================================================
  // SESSION NOTES
  // ============================================================================

  const handleSessionNotesSave = useCallback((notes: string, rating: number) => {
    const state = stateRef.current;

    saveSessionNote({
      notes,
      rating,
      sessionDuration: state.timerState.sessionDuration,
      category: state.timerState.category,
      taskLabel: state.timerState.taskLabel,
      xpEarned: lastSessionXP,
    });

    setShowSessionNotesModal(false);
    openBreakModal();
  }, [saveSessionNote, lastSessionXP, openBreakModal]);

  // ============================================================================
  // BREAK HANDLING
  // ============================================================================

  const handleStartBreak = useCallback((duration: number) => {
    closeBreakModal();

    const breakPreset = getBreakPreset(duration);
    if (breakPreset) {
      setSelectedPreset(breakPreset);
      const newTimeLeft = duration * 60;
      setDisplayTime(newTimeLeft);

      if (autoBreakEnabled) {
        const now = Date.now();
        saveTimerState({
          timeLeft: newTimeLeft,
          sessionDuration: newTimeLeft,
          sessionType: 'break',
          isRunning: true,
          startTime: now,
          category: undefined,
          taskLabel: undefined,
        });
      } else {
        saveTimerState({
          timeLeft: newTimeLeft,
          sessionDuration: newTimeLeft,
          sessionType: 'break',
          isRunning: false,
          startTime: null,
          category: undefined,
          taskLabel: undefined,
        });
      }
    }
  }, [closeBreakModal, getBreakPreset, setSelectedPreset, saveTimerState, autoBreakEnabled]);

  const handleSkipBreak = useCallback(() => {
    breakSkipHandler();
  }, [breakSkipHandler]);

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    // State
    timerState,
    displayTime,
    elapsedTime,
    selectedPreset,
    showIntentionModal,
    showLockScreen,
    showSessionNotesModal,
    showBreakTransitionModal,
    lastSessionXP,
    autoBreakEnabled,

    // Actions
    setPreset,
    requestStartTimer,
    startTimerWithIntent,
    pauseTimer,
    stopTimer,
    skipTimer,
    toggleSound,
    handleSessionNotesSave,
    handleStartBreak,
    handleSkipBreak,
    toggleAutoBreak,
    setShowIntentionModal,
    setShowSessionNotesModal,
    setShowBreakTransitionModal: (show: boolean) => { if (show) openBreakModal(); else closeBreakModal(); },
    setShowLockScreen,
  };
};
