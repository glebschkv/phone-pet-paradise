/**
 * useTimerLogic Hook
 *
 * Main timer orchestration hook that composes smaller focused hooks.
 * Refactored from 663 lines to use extracted hooks for better maintainability.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDeviceActivity } from "@/hooks/useDeviceActivity";
import { FocusCategory } from "@/types/analytics";
import { TimerPreset } from "../constants";
import { useTimerPersistence } from "./useTimerPersistence";
import { useTimerAudio } from "./useTimerAudio";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { useTimerRewards } from "./useTimerRewards";
import { useSessionNotes } from "./useSessionNotes";
import { useBreakTransition } from "./useBreakTransition";

export const useTimerLogic = () => {
  const { toast } = useToast();
  const { awardXP } = useBackendAppState();
  const { playCompletionSound } = useTimerAudio();
  const { recordSession } = useAnalytics();
  const { stop: stopAmbientSound, isPlaying: isAmbientPlaying } = useAmbientSound();

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
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [showSessionNotesModal, setShowSessionNotesModal] = useState(false);
  const [lastSessionXP, setLastSessionXP] = useState(0);

  // Refs for stable timer management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // SECURITY: Async lock to prevent race conditions in timer completion
  // Using a promise-based lock instead of a simple boolean ref
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
      const newTimeLeft = preset.duration * 60;
      setDisplayTime(newTimeLeft);
      saveTimerState({
        timeLeft: newTimeLeft,
        sessionDuration: preset.duration * 60,
        sessionType: preset.type,
        isRunning: false,
        startTime: null,
      });
    }
  }, [setSelectedPreset, saveTimerState]);

  // ============================================================================
  // SESSION COMPLETION
  // ============================================================================

  const handleComplete = useCallback(async () => {
    const state = stateRef.current;

    // SECURITY: Prevent race conditions with async lock pattern
    // Generate unique completion ID for this attempt
    const completionId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // If there's an existing completion in progress, wait for it and return
    if (completionLockRef.current) {
      await completionLockRef.current;
      // After waiting, check if this completion was already handled
      if (completionIdRef.current && completionIdRef.current !== completionId) {
        return; // Another completion already ran
      }
    }

    // Set our completion ID as the active one
    completionIdRef.current = completionId;

    // Create the lock promise with a resolver we can call later
    let releaseLock: (() => void) | undefined;
    completionLockRef.current = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    try {
      const completedMinutes = state.timerState.sessionDuration / 60;

      // Clear interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      clearPersistence();

      // Stop app blocking and get shield attempts
      let shieldAttempts = 0;
      if (state.timerState.sessionType !== 'break' && state.hasAppsConfigured) {
        const blockingResult = await stopAppBlocking();
        shieldAttempts = blockingResult.shieldAttempts;
      }

      // Stop ambient sound when session ends
      if (state.isAmbientPlaying) {
        stopAmbientSound();
      }

      if (state.timerState.soundEnabled) {
        playCompletionSound();
      }

      // Award rewards for work sessions
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

        // Trigger haptic for perfect focus
        if (rewardResult.focusBonusType === 'PERFECT FOCUS') {
          triggerHaptic('success');
        }

        // Show focus bonus toast
        showFocusBonusToast(rewardResult.focusBonusType);
      }

      // Record session to analytics
      recordSession(
        state.timerState.sessionType,
        state.timerState.sessionDuration,
        state.timerState.sessionDuration,
        'completed',
        xpEarned,
        state.timerState.category,
        state.timerState.taskLabel
      );

      // Reset display time and timer state
      setDisplayTime(state.timerState.sessionDuration);
      saveTimerState({
        isRunning: false,
        timeLeft: state.timerState.sessionDuration,
        startTime: null,
        completedSessions: state.timerState.completedSessions + 1,
        category: undefined,
        taskLabel: undefined,
      });

      // For work sessions, show session notes modal then break transition
      if (state.timerState.sessionType !== 'break') {
        setLastSessionXP(xpEarned);
        setShowSessionNotesModal(true);
      } else {
        toast({
          title: 'Break Complete!',
          description: 'Time to get back to work!',
          duration: 3000,
        });
      }
    } finally {
      // SECURITY: Always release the lock, even on error
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
    saveTimerState,
    triggerHaptic,
    toast,
  ]);

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

      // Only auto-start the break timer if autoBreakEnabled is true
      // Otherwise, set up the break but require user to press start
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
  // TIMER SYNC & COUNTDOWN
  // ============================================================================

  // Sync displayTime with timerState when not running
  useEffect(() => {
    if (!timerState.isRunning) {
      setDisplayTime(timerState.timeLeft);
    }
  }, [timerState.timeLeft, timerState.isRunning]);

  // Timer countdown effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timerState.isRunning && timerState.startTime) {
      const tick = () => {
        const now = Date.now();
        const elapsedMs = now - timerState.startTime!;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const newTimeLeft = Math.max(0, timerState.sessionDuration - elapsedSeconds);

        setDisplayTime(newTimeLeft);

        if (elapsedSeconds % 5 === 0) {
          saveTimerState({ timeLeft: newTimeLeft });
        }

        if (newTimeLeft === 0) {
          handleComplete();
        }
      };

      tick();
      intervalRef.current = setInterval(tick, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.startTime, timerState.sessionDuration, saveTimerState, handleComplete]);

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = stateRef.current;

      if (document.hidden && state.timerState.isRunning && state.timerState.sessionType !== 'break') {
        setShowLockScreen(true);
      } else if (!document.hidden && state.timerState.isRunning && state.timerState.startTime) {
        const now = Date.now();
        const elapsedMs = now - state.timerState.startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const newTimeLeft = Math.max(0, state.timerState.sessionDuration - elapsedSeconds);

        setDisplayTime(newTimeLeft);
        saveTimerState({ timeLeft: newTimeLeft });
        setShowLockScreen(false);

        if (newTimeLeft === 0) {
          handleComplete();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveTimerState, handleComplete]);

  // ============================================================================
  // TIMER CONTROLS
  // ============================================================================

  const requestStartTimer = useCallback(() => {
    if (selectedPreset.type === 'break') {
      const now = Date.now();
      setDisplayTime(timerState.timeLeft);
      saveTimerState({
        isRunning: true,
        startTime: now,
        sessionDuration: timerState.timeLeft,
        category: undefined,
        taskLabel: undefined,
      });
    } else {
      setShowIntentionModal(true);
    }
  }, [saveTimerState, timerState.timeLeft, selectedPreset.type]);

  const startTimerWithIntent = useCallback(async (category: FocusCategory, taskLabel?: string) => {
    setShowIntentionModal(false);

    if (appBlockingEnabled && hasAppsConfigured && blockedAppsCount > 0) {
      const result = await startAppBlocking();
      if (result.appsBlocked > 0) {
        triggerHaptic('light');
      }
    }

    const now = Date.now();
    setDisplayTime(timerState.timeLeft);
    saveTimerState({
      isRunning: true,
      startTime: now,
      sessionDuration: timerState.timeLeft,
      category,
      taskLabel,
    });
  }, [saveTimerState, timerState.timeLeft, appBlockingEnabled, hasAppsConfigured, blockedAppsCount, startAppBlocking, triggerHaptic]);

  const pauseTimer = useCallback(() => {
    const now = Date.now();
    let currentTimeLeft = timerState.timeLeft;

    if (timerState.startTime) {
      const elapsedMs = now - timerState.startTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      currentTimeLeft = Math.max(0, timerState.sessionDuration - elapsedSeconds);
    }

    setDisplayTime(currentTimeLeft);
    saveTimerState({
      isRunning: false,
      startTime: null,
      timeLeft: currentTimeLeft,
      sessionDuration: selectedPreset.duration * 60,
    });
  }, [saveTimerState, timerState.startTime, timerState.sessionDuration, timerState.timeLeft, selectedPreset.duration]);

  const stopTimer = useCallback(async () => {
    let elapsedSeconds = 0;
    if (timerState.startTime) {
      const now = Date.now();
      const elapsedMs = now - timerState.startTime;
      elapsedSeconds = Math.floor(elapsedMs / 1000);
    } else {
      elapsedSeconds = timerState.sessionDuration - timerState.timeLeft;
    }

    if (timerState.sessionType !== 'break' && hasAppsConfigured) {
      await stopAppBlocking();
    }

    if (timerState.isRunning && elapsedSeconds > 60) {
      recordSession(
        timerState.sessionType,
        timerState.sessionDuration,
        elapsedSeconds,
        'abandoned',
        0,
        timerState.category,
        timerState.taskLabel
      );
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const fullDuration = selectedPreset.duration * 60;
    setDisplayTime(fullDuration);
    clearPersistence();
    saveTimerState({
      isRunning: false,
      timeLeft: fullDuration,
      sessionDuration: fullDuration,
      startTime: null,
      category: undefined,
      taskLabel: undefined,
    });
  }, [clearPersistence, saveTimerState, selectedPreset.duration, timerState, recordSession, hasAppsConfigured, stopAppBlocking]);

  const skipTimer = useCallback(async () => {
    let elapsedSeconds = 0;
    if (timerState.startTime) {
      const now = Date.now();
      const elapsedMs = now - timerState.startTime;
      elapsedSeconds = Math.floor(elapsedMs / 1000);
    } else {
      elapsedSeconds = timerState.sessionDuration - timerState.timeLeft;
    }

    const completedMinutes = Math.ceil(elapsedSeconds / 60);

    if (timerState.sessionType !== 'break' && hasAppsConfigured) {
      await stopAppBlocking();
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    clearPersistence();

    let xpEarned = 0;
    if (timerState.sessionType !== 'break' && completedMinutes >= 25) {
      try {
        const reward = await awardXP(completedMinutes);
        xpEarned = reward?.xpGained || 0;
        toast({
          title: "Session Skipped",
          description: `+${xpEarned} XP for ${completedMinutes} minutes of focus!`,
          duration: 3000,
        });
      } catch {
        toast({
          title: "Timer Skipped",
          description: "Session saved locally, will sync when online",
          duration: 2000,
        });
      }
    } else {
      toast({
        title: "Timer Skipped",
        description: completedMinutes < 25 ? "Need 25+ minutes for XP rewards" : "Break completed",
        duration: 2000,
      });
    }

    if (elapsedSeconds > 60) {
      recordSession(
        timerState.sessionType,
        timerState.sessionDuration,
        elapsedSeconds,
        'skipped',
        xpEarned,
        timerState.category,
        timerState.taskLabel
      );
    }

    const fullDuration = selectedPreset.duration * 60;
    setDisplayTime(fullDuration);
    saveTimerState({
      isRunning: false,
      timeLeft: fullDuration,
      sessionDuration: fullDuration,
      startTime: null,
      category: undefined,
      taskLabel: undefined,
    });
  }, [timerState, awardXP, toast, clearPersistence, saveTimerState, selectedPreset.duration, recordSession, hasAppsConfigured, stopAppBlocking]);

  const toggleSound = useCallback(() => {
    saveTimerState({ soundEnabled: !timerState.soundEnabled });
  }, [saveTimerState, timerState.soundEnabled]);

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    // State
    timerState,
    displayTime,
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
    setShowBreakTransitionModal: openBreakModal,
    setShowLockScreen,
  };
};
