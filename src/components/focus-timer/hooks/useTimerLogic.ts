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
import { timerLogger } from "@/lib/logger";
import { widgetDataService } from "@/plugins/widget-data";
import { DeviceActivity } from "@/plugins/device-activity";
import { markBlockingStopped } from "@/hooks/useTimerExpiryGuard";

export const useTimerLogic = () => {
  const { awardXP, coinSystem, xpSystem } = useBackendAppState();
  const { playCompletionSound } = useTimerAudio();
  const { recordSession } = useAnalytics();
  const { stopAll: stopAmbientSound, isPlaying: isAmbientPlaying } = useSoundMixer();
  const { recordSession: recordStreakSession } = useStreakSystem();
  const { scheduleStreakNotification, scheduleRewardNotification, cancelTimerCompletionNotification } = useNotifications();

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
  // Preserve category/taskLabel for session notes — handleComplete clears
  // them from timerState before the notes modal opens, so we snapshot here.
  const lastSessionMetaRef = useRef<{ category?: string; taskLabel?: string; sessionDuration: number }>({
    sessionDuration: timerState.sessionDuration,
  });

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
      triggerHaptic('light');
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
  }, [setSelectedPreset, saveTimerState, triggerHaptic]);

  // ============================================================================
  // SESSION COMPLETION
  // ============================================================================

  const handleComplete = useCallback(async () => {
    const state = stateRef.current;

    // Guard: if the timer was already stopped/reset by stopTimer or skipTimer,
    // bail out. This prevents double-completion when the tick fires at 0:00
    // concurrently with the user pressing Stop.
    if (!state.timerState.isRunning) {
      timerLogger.debug('handleComplete: timer not running, skipping');
      return;
    }

    // SECURITY: Prevent race conditions with async lock pattern
    const completionId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    if (completionLockRef.current) {
      await completionLockRef.current;
      // After waiting for the lock, re-check if timer is still running
      // (stopTimer may have run while we waited)
      if (!stateRef.current.timerState.isRunning) {
        timerLogger.debug('handleComplete: timer stopped while waiting for lock');
        return;
      }
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

      // Cancel the OS-scheduled notification — the in-app completion UI is showing instead
      cancelTimerCompletionNotification();

      // NOTE: clearPersistence() is intentionally NOT called here.
      // It runs after rewards/recording so that if iOS kills the WebView
      // during async work below, the timer is still marked "running" on
      // relaunch and the expiry guard will stop blocking. The session can
      // then be re-completed rather than silently lost.

      let shieldAttempts = 0;
      if (state.timerState.sessionType !== 'break') {
        // Mark blocking as stopped FIRST so the expiry guard won't try to
        // stop it again if the WebView reloads during cleanup
        markBlockingStopped();
        // Always attempt to stop blocking — don't rely on hasAppsConfigured
        // which can be stale if plugin init had issues
        let blockingStopped = false;
        try {
          const blockingResult = await stopAppBlocking();
          shieldAttempts = blockingResult.shieldAttempts;
          blockingStopped = blockingResult.success;
        } catch (e) {
          timerLogger.error('Failed to stop app blocking via hook:', e);
        }

        // Fallback: direct plugin call if hook-based call failed or bailed
        if (!blockingStopped) {
          try {
            await DeviceActivity.stopAppBlocking();
            timerLogger.info('Stopped app blocking via direct plugin call fallback');
          } catch {
            // Plugin not available — nothing more we can do
          }
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

          // Apply streak milestone bonuses (XP and coins)
          if (streakReward.xpBonus && xpSystem && 'addDirectXP' in xpSystem) {
            (xpSystem as { addDirectXP: (xp: number) => void }).addDirectXP(streakReward.xpBonus);
          }
          if (streakReward.coinBonus && coinSystem) {
            coinSystem.addCoins(streakReward.coinBonus);
          }
        }
        if (xpEarned > 0) {
          scheduleRewardNotification(xpEarned);
        }
      }

      // All critical async work (rewards, recording, streak) is done.
      // NOW clear persistence so the timer won't re-complete on WebView reload.
      clearPersistence();

      // Sync completed session to widgets: stop the timer, then pull
      // accumulated totals (streak, progress, stats) from localStorage
      widgetDataService.updateTimer({
        isRunning: false,
        timeRemaining: 0,
        sessionType: null,
        startTime: null,
      }).catch(e => timerLogger.error('Widget timer sync failed:', e));

      // Full sync picks up updated streak, daily progress, and XP/stats
      // from the stores that were just written above.
      widgetDataService.syncFromAppState()
        .catch(e => timerLogger.error('Widget full sync failed:', e));

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
        // Snapshot metadata BEFORE it gets cleared by saveTimerState below
        lastSessionMetaRef.current = {
          category: state.timerState.category,
          taskLabel: state.timerState.taskLabel,
          sessionDuration: state.timerState.sessionDuration,
        };
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
    cancelTimerCompletionNotification,
    saveTimerState,
    triggerHaptic,
    coinSystem,
    xpSystem,
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
    // Use the snapshot taken before handleComplete cleared the metadata
    const meta = lastSessionMetaRef.current;

    saveSessionNote({
      notes,
      rating,
      sessionDuration: meta.sessionDuration,
      category: meta.category,
      taskLabel: meta.taskLabel,
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
