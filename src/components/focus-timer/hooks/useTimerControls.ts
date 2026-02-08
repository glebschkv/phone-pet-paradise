/**
 * useTimerControls Hook
 *
 * Handles timer control actions: start, pause, stop, skip.
 * Extracted from useTimerLogic for better separation of concerns.
 */

import { useCallback } from "react";
import { toast } from 'sonner';
import { timerLogger } from '@/lib/logger';
import { useAnalytics } from "@/hooks/useAnalytics";
import { useStreakSystem } from "@/hooks/useStreakSystem";
import { useNotifications } from "@/hooks/useNotifications";
import { widgetDataService } from "@/plugins/widget-data";
import { FocusCategory, FocusQuality } from "@/types/analytics";
import { TimerPreset, MAX_COUNTUP_DURATION } from "../constants";
import { TimerState } from "./useTimerPersistence";
import { markBlockingActive, markBlockingStopped } from "@/hooks/useTimerExpiryGuard";
import type { StartBlockingResult, StopBlockingResult } from "@/plugins/device-activity/definitions";

interface UseTimerControlsProps {
  timerState: TimerState;
  selectedPreset: TimerPreset;
  saveTimerState: (updates: Partial<TimerState>) => void;
  clearPersistence: () => void;
  setDisplayTime: (time: number) => void;
  setShowIntentionModal: (show: boolean) => void;
  intervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  appBlockingEnabled: boolean;
  hasAppsConfigured: boolean;
  blockedAppsCount: number;
  startAppBlocking: () => Promise<StartBlockingResult>;
  stopAppBlocking: () => Promise<StopBlockingResult>;
  triggerHaptic: (style?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void | Promise<void>;
  awardXP: (minutes: number) => Promise<{ xpGained?: number } | null | undefined>;
}

export const useTimerControls = ({
  timerState,
  selectedPreset,
  saveTimerState,
  clearPersistence,
  setDisplayTime,
  setShowIntentionModal,
  intervalRef,
  appBlockingEnabled: _appBlockingEnabled,
  hasAppsConfigured,
  blockedAppsCount: _blockedAppsCount,
  startAppBlocking,
  stopAppBlocking,
  triggerHaptic,
  awardXP,
}: UseTimerControlsProps) => {
  const { recordSession } = useAnalytics();
  const { recordSession: recordStreakSession } = useStreakSystem();
  const { scheduleStreakNotification, scheduleRewardNotification, scheduleTimerCompletionNotification, cancelTimerCompletionNotification } = useNotifications();

  const requestStartTimer = useCallback(() => {
    if (selectedPreset.type === 'break') {
      const now = Date.now();
      setDisplayTime(timerState.timeLeft);
      saveTimerState({
        isRunning: true,
        startTime: now,
        // Use timeLeft as new sessionDuration so countdown math works from
        // the remaining time, but preserve the original sessionDuration for
        // analytics if this is a resume from pause.
        sessionDuration: timerState.timeLeft,
        category: undefined,
        taskLabel: undefined,
      });
    } else if (selectedPreset.isCountup) {
      // Countup mode also requires intention
      setShowIntentionModal(true);
    } else {
      setShowIntentionModal(true);
    }
  }, [saveTimerState, timerState.timeLeft, selectedPreset.type, selectedPreset.isCountup, setDisplayTime, setShowIntentionModal]);

  const startTimerWithIntent = useCallback(async (category: FocusCategory, taskLabel?: string) => {
    setShowIntentionModal(false);
    triggerHaptic('medium');

    const now = Date.now();

    // Update UI state FIRST for instant visual feedback
    if (timerState.isCountup) {
      // Countup mode: start from 0, duration is max 6 hours
      setDisplayTime(0);
      saveTimerState({
        isRunning: true,
        startTime: now,
        sessionDuration: MAX_COUNTUP_DURATION,
        elapsedTime: 0,
        category,
        taskLabel,
        isCountup: true,
      });
    } else {
      // Countdown mode: start from timeLeft
      setDisplayTime(timerState.timeLeft);
      saveTimerState({
        isRunning: true,
        startTime: now,
        sessionDuration: timerState.timeLeft,
        category,
        taskLabel,
      });
    }

    // Sync timer state to widgets
    widgetDataService.updateTimer({
      isRunning: true,
      timeRemaining: timerState.isCountup ? MAX_COUNTUP_DURATION : timerState.timeLeft,
      sessionDuration: timerState.isCountup ? MAX_COUNTUP_DURATION : timerState.timeLeft,
      sessionType: selectedPreset.type === 'break' ? 'break' : (selectedPreset.type as 'pomodoro' | 'deep-work'),
      category,
      taskLabel,
      startTime: now,
    }).catch(e => timerLogger.error('Widget timer sync failed:', e));

    // Start app blocking AFTER UI update — don't block the visual transition.
    // We intentionally use a loose guard here: startAppBlocking() does its own
    // pre-flight permission & status checks against the native plugin, so we
    // only skip the call for obviously-impossible scenarios (break sessions).
    if (selectedPreset.type !== 'break') {
      markBlockingActive();
      startAppBlocking().then((result) => {
        if (result.appsBlocked > 0 || result.categoriesBlocked > 0) {
          triggerHaptic('light');
        }
      }).catch((e) => {
        timerLogger.error('Failed to start app blocking:', e);
        toast.warning('App blocking unavailable', {
          description: 'Focus session started, but apps could not be blocked.',
        });
      });
    }

    // Schedule a notification for when the timer ends — fires even if app is killed
    const durationSec = timerState.isCountup ? MAX_COUNTUP_DURATION : timerState.timeLeft;
    scheduleTimerCompletionNotification(durationSec);
  }, [saveTimerState, timerState.timeLeft, timerState.isCountup, selectedPreset.type, startAppBlocking, triggerHaptic, setDisplayTime, setShowIntentionModal, scheduleTimerCompletionNotification]);

  const pauseTimer = useCallback(() => {
    triggerHaptic('light');
    const now = Date.now();
    let widgetTimeRemaining = 0;

    if (timerState.isCountup) {
      // Countup mode: calculate elapsed time
      let currentElapsed = timerState.elapsedTime || 0;
      if (timerState.startTime) {
        const elapsedMs = now - timerState.startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        currentElapsed = Math.min(elapsedSeconds, MAX_COUNTUP_DURATION);
      }

      widgetTimeRemaining = currentElapsed;
      setDisplayTime(currentElapsed);
      saveTimerState({
        isRunning: false,
        startTime: null,
        elapsedTime: currentElapsed,
        sessionDuration: MAX_COUNTUP_DURATION,
      });
    } else {
      // Countdown mode: calculate remaining time
      let currentTimeLeft = timerState.timeLeft;

      if (timerState.startTime) {
        const elapsedMs = now - timerState.startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        currentTimeLeft = Math.max(0, timerState.sessionDuration - elapsedSeconds);
      }

      widgetTimeRemaining = currentTimeLeft;
      setDisplayTime(currentTimeLeft);
      saveTimerState({
        isRunning: false,
        startTime: null,
        timeLeft: currentTimeLeft,
        // Preserve the actual session duration — do NOT overwrite with selectedPreset
        // which can be stale after a WebView reload / tab switch
        sessionDuration: timerState.sessionDuration,
      });
    }

    // Sync paused state to widgets
    widgetDataService.updateTimer({
      isRunning: false,
      timeRemaining: widgetTimeRemaining,
      startTime: null,
    }).catch(e => timerLogger.error('Widget timer sync failed:', e));

    // Cancel the scheduled completion notification
    cancelTimerCompletionNotification();
  }, [saveTimerState, timerState.startTime, timerState.sessionDuration, timerState.timeLeft, timerState.elapsedTime, timerState.isCountup, selectedPreset.duration, setDisplayTime, cancelTimerCompletionNotification, triggerHaptic]);

  const stopTimer = useCallback(async () => {
    triggerHaptic('light');
    let elapsedSeconds = 0;
    if (timerState.startTime) {
      const now = Date.now();
      const elapsedMs = now - timerState.startTime;
      elapsedSeconds = Math.floor(elapsedMs / 1000);
    } else if (timerState.isCountup) {
      elapsedSeconds = timerState.elapsedTime || 0;
    } else {
      elapsedSeconds = timerState.sessionDuration - timerState.timeLeft;
    }

    const isWorkSession = timerState.sessionType !== 'break';

    // Reset UI IMMEDIATELY for instant visual feedback
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    clearPersistence();

    // Cancel the scheduled completion notification
    cancelTimerCompletionNotification();

    if (timerState.isCountup || selectedPreset.isCountup) {
      // Countup mode: reset to 0
      setDisplayTime(0);
      saveTimerState({
        isRunning: false,
        timeLeft: 0,
        elapsedTime: 0,
        sessionDuration: MAX_COUNTUP_DURATION,
        startTime: null,
        category: undefined,
        taskLabel: undefined,
        isCountup: true,
      });
    } else {
      // Countdown mode: reset to full duration
      const fullDuration = selectedPreset.duration * 60;
      setDisplayTime(fullDuration);
      saveTimerState({
        isRunning: false,
        timeLeft: fullDuration,
        sessionDuration: fullDuration,
        startTime: null,
        category: undefined,
        taskLabel: undefined,
        isCountup: false,
      });
    }

    // Sync stopped state to widgets
    widgetDataService.updateTimer({
      isRunning: false,
      timeRemaining: (timerState.isCountup || selectedPreset.isCountup) ? 0 : selectedPreset.duration * 60,
      sessionType: null,
      startTime: null,
    }).catch(e => timerLogger.error('Widget timer sync failed:', e));

    // Async cleanup AFTER UI is reset — stop app blocking and record session
    // Always mark blocking stopped — even if stopAppBlocking fails, the expiry
    // guard will detect the orphaned blocking state and retry on next foreground.
    markBlockingStopped();
    let shieldAttempts = 0;
    if (isWorkSession && hasAppsConfigured) {
      try {
        const result = await stopAppBlocking();
        shieldAttempts = result.shieldAttempts;
      } catch (e) {
        timerLogger.error('Failed to stop app blocking:', e);
      }
    }

    // Determine focus quality for abandoned sessions
    // When app blocking isn't configured, quality is undefined (neutral)
    let focusQuality: FocusQuality | undefined;
    if (isWorkSession && elapsedSeconds > 0 && hasAppsConfigured) {
      focusQuality = shieldAttempts === 0
        ? 'perfect'
        : shieldAttempts <= 2
          ? 'good'
          : 'distracted';
    }

    if (timerState.isRunning && elapsedSeconds > 10) {
      try {
        recordSession(
          timerState.sessionType,
          timerState.isCountup ? elapsedSeconds : timerState.sessionDuration,
          elapsedSeconds,
          'abandoned',
          0,
          timerState.category,
          timerState.taskLabel,
          isWorkSession ? shieldAttempts : undefined,
          focusQuality,
          hasAppsConfigured,
        );
      } catch (e) {
        timerLogger.error('Failed to record abandoned session:', e);
      }
    }
  }, [clearPersistence, saveTimerState, selectedPreset.duration, selectedPreset.isCountup, timerState, recordSession, hasAppsConfigured, stopAppBlocking, intervalRef, setDisplayTime, cancelTimerCompletionNotification, triggerHaptic]);

  const skipTimer = useCallback(async () => {
    triggerHaptic('light');
    let elapsedSeconds = 0;
    if (timerState.startTime) {
      const now = Date.now();
      const elapsedMs = now - timerState.startTime;
      elapsedSeconds = Math.floor(elapsedMs / 1000);
    } else if (timerState.isCountup) {
      elapsedSeconds = timerState.elapsedTime || 0;
    } else {
      elapsedSeconds = timerState.sessionDuration - timerState.timeLeft;
    }

    const completedMinutes = Math.ceil(elapsedSeconds / 60);
    const isWorkSession = timerState.sessionType !== 'break';

    // Reset UI IMMEDIATELY for instant visual feedback
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    clearPersistence();

    // Cancel the scheduled completion notification
    cancelTimerCompletionNotification();

    if (timerState.isCountup || selectedPreset.isCountup) {
      // Countup mode: reset to 0
      setDisplayTime(0);
      saveTimerState({
        isRunning: false,
        timeLeft: 0,
        elapsedTime: 0,
        sessionDuration: MAX_COUNTUP_DURATION,
        startTime: null,
        category: undefined,
        taskLabel: undefined,
        isCountup: true,
      });
    } else {
      // Countdown mode: reset to full duration
      const fullDuration = selectedPreset.duration * 60;
      setDisplayTime(fullDuration);
      saveTimerState({
        isRunning: false,
        timeLeft: fullDuration,
        sessionDuration: fullDuration,
        startTime: null,
        category: undefined,
        taskLabel: undefined,
        isCountup: false,
      });
    }

    // Sync skipped/reset state to widgets
    widgetDataService.updateTimer({
      isRunning: false,
      timeRemaining: (timerState.isCountup || selectedPreset.isCountup) ? 0 : selectedPreset.duration * 60,
      sessionType: null,
      startTime: null,
    }).catch(e => timerLogger.error('Widget timer sync failed:', e));

    // Async cleanup AFTER UI is reset
    markBlockingStopped();
    let shieldAttempts = 0;
    if (isWorkSession && hasAppsConfigured) {
      try {
        const result = await stopAppBlocking();
        shieldAttempts = result.shieldAttempts;
      } catch (e) {
        timerLogger.error('Failed to stop app blocking:', e);
      }
    }

    let xpEarned = 0;
    // Both countdown and countup focus sessions can earn XP
    if (isWorkSession && completedMinutes >= 25) {
      try {
        const reward = await awardXP(completedMinutes);
        xpEarned = reward?.xpGained || 0;
        toast.success("Session Skipped", {
          description: `+${xpEarned} XP for ${completedMinutes} minutes of focus!`,
          duration: 3000,
        });
      } catch {
        toast.info("Timer Skipped", {
          description: "Session saved locally, will sync when online",
          duration: 2000,
        });
      }
    } else {
      toast.info("Timer Skipped", {
        description: completedMinutes < 25 ? "Need 25+ minutes for XP rewards" : "Break completed",
        duration: 2000,
      });
    }

    // Determine focus quality for skipped sessions
    // When app blocking isn't configured, quality is undefined (neutral)
    let focusQuality: FocusQuality | undefined;
    if (isWorkSession && elapsedSeconds > 0 && hasAppsConfigured) {
      focusQuality = shieldAttempts === 0
        ? 'perfect'
        : shieldAttempts <= 2
          ? 'good'
          : 'distracted';
    }

    if (elapsedSeconds > 10) {
      try {
        recordSession(
          timerState.sessionType,
          timerState.isCountup ? elapsedSeconds : timerState.sessionDuration,
          elapsedSeconds,
          'skipped',
          xpEarned,
          timerState.category,
          timerState.taskLabel,
          isWorkSession ? shieldAttempts : undefined,
          focusQuality,
          hasAppsConfigured,
        );
      } catch (e) {
        timerLogger.error('Failed to record skipped session:', e);
      }

      // Update streak and trigger notifications for qualifying work sessions
      if (isWorkSession && completedMinutes >= 25) {
        try {
          const streakReward = recordStreakSession();
          if (streakReward) {
            scheduleStreakNotification(streakReward.milestone);
          }
        } catch (e) {
          timerLogger.error('Failed to record streak session:', e);
        }
        if (xpEarned > 0) {
          scheduleRewardNotification(xpEarned);
        }
      }
    }
  }, [timerState, awardXP, clearPersistence, saveTimerState, selectedPreset.duration, selectedPreset.isCountup, recordSession, recordStreakSession, scheduleStreakNotification, scheduleRewardNotification, hasAppsConfigured, stopAppBlocking, intervalRef, setDisplayTime, cancelTimerCompletionNotification, triggerHaptic]);

  const toggleSound = useCallback(() => {
    saveTimerState({ soundEnabled: !timerState.soundEnabled });
  }, [saveTimerState, timerState.soundEnabled]);

  return {
    requestStartTimer,
    startTimerWithIntent,
    pauseTimer,
    stopTimer,
    skipTimer,
    toggleSound,
  };
};
