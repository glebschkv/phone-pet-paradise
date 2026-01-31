/**
 * useTimerControls Hook
 *
 * Handles timer control actions: start, pause, stop, skip.
 * Extracted from useTimerLogic for better separation of concerns.
 */

import { useCallback } from "react";
import { toast } from 'sonner';
import { useAnalytics } from "@/hooks/useAnalytics";
import { FocusCategory, FocusQuality } from "@/types/analytics";
import { TimerPreset, MAX_COUNTUP_DURATION } from "../constants";
import { TimerState } from "./useTimerPersistence";

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
  startAppBlocking: () => Promise<{ appsBlocked: number }>;
  stopAppBlocking: () => Promise<{ shieldAttempts: number }>;
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
  appBlockingEnabled,
  hasAppsConfigured,
  blockedAppsCount,
  startAppBlocking,
  stopAppBlocking,
  triggerHaptic,
  awardXP,
}: UseTimerControlsProps) => {
  const { recordSession } = useAnalytics();

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
    } else if (selectedPreset.isCountup) {
      // Countup mode also requires intention
      setShowIntentionModal(true);
    } else {
      setShowIntentionModal(true);
    }
  }, [saveTimerState, timerState.timeLeft, selectedPreset.type, selectedPreset.isCountup, setDisplayTime, setShowIntentionModal]);

  const startTimerWithIntent = useCallback(async (category: FocusCategory, taskLabel?: string) => {
    setShowIntentionModal(false);

    if (appBlockingEnabled && hasAppsConfigured && blockedAppsCount > 0) {
      const result = await startAppBlocking();
      if (result.appsBlocked > 0) {
        triggerHaptic('light');
      }
    }

    const now = Date.now();

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
  }, [saveTimerState, timerState.timeLeft, timerState.isCountup, appBlockingEnabled, hasAppsConfigured, blockedAppsCount, startAppBlocking, triggerHaptic, setDisplayTime, setShowIntentionModal]);

  const pauseTimer = useCallback(() => {
    const now = Date.now();

    if (timerState.isCountup) {
      // Countup mode: calculate elapsed time
      let currentElapsed = timerState.elapsedTime || 0;
      if (timerState.startTime) {
        const elapsedMs = now - timerState.startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        currentElapsed = Math.min(elapsedSeconds, MAX_COUNTUP_DURATION);
      }

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

      setDisplayTime(currentTimeLeft);
      saveTimerState({
        isRunning: false,
        startTime: null,
        timeLeft: currentTimeLeft,
        sessionDuration: selectedPreset.duration * 60,
      });
    }
  }, [saveTimerState, timerState.startTime, timerState.sessionDuration, timerState.timeLeft, timerState.elapsedTime, timerState.isCountup, selectedPreset.duration, setDisplayTime]);

  const stopTimer = useCallback(async () => {
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

    // Stop app blocking with error handling — always clean up even if this fails
    let shieldAttempts = 0;
    const isWorkSession = timerState.sessionType !== 'break';
    if (isWorkSession && hasAppsConfigured) {
      try {
        const result = await stopAppBlocking();
        shieldAttempts = result.shieldAttempts;
      } catch (e) {
        console.error('Failed to stop app blocking:', e);
      }
    }

    // Determine focus quality for abandoned sessions
    let focusQuality: FocusQuality | undefined;
    if (isWorkSession && elapsedSeconds > 0) {
      focusQuality = shieldAttempts === 0 && hasAppsConfigured
        ? 'perfect'
        : shieldAttempts <= 2 && hasAppsConfigured
          ? 'good'
          : 'distracted';
    }

    if (timerState.isRunning && elapsedSeconds > 10) {
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
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    clearPersistence();

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
  }, [clearPersistence, saveTimerState, selectedPreset.duration, selectedPreset.isCountup, timerState, recordSession, hasAppsConfigured, stopAppBlocking, intervalRef, setDisplayTime]);

  const skipTimer = useCallback(async () => {
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

    // Stop app blocking with error handling
    let shieldAttempts = 0;
    if (isWorkSession && hasAppsConfigured) {
      try {
        const result = await stopAppBlocking();
        shieldAttempts = result.shieldAttempts;
      } catch (e) {
        console.error('Failed to stop app blocking:', e);
      }
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    clearPersistence();

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
    let focusQuality: FocusQuality | undefined;
    if (isWorkSession && elapsedSeconds > 0) {
      focusQuality = shieldAttempts === 0 && hasAppsConfigured
        ? 'perfect'
        : shieldAttempts <= 2 && hasAppsConfigured
          ? 'good'
          : 'distracted';
    }

    if (elapsedSeconds > 10) {
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
    }

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
  }, [timerState, awardXP, clearPersistence, saveTimerState, selectedPreset.duration, selectedPreset.isCountup, recordSession, hasAppsConfigured, stopAppBlocking, intervalRef, setDisplayTime]);

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
