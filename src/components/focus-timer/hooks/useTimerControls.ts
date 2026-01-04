/**
 * useTimerControls Hook
 *
 * Handles timer control actions: start, pause, stop, skip.
 * Extracted from useTimerLogic for better separation of concerns.
 */

import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { FocusCategory } from "@/types/analytics";
import { TimerPreset } from "../constants";
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
  triggerHaptic: (type: string) => void;
  awardXP: (minutes: number) => Promise<{ xpGained?: number } | undefined>;
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
  const { toast } = useToast();
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
    } else {
      setShowIntentionModal(true);
    }
  }, [saveTimerState, timerState.timeLeft, selectedPreset.type, setDisplayTime, setShowIntentionModal]);

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
  }, [saveTimerState, timerState.timeLeft, appBlockingEnabled, hasAppsConfigured, blockedAppsCount, startAppBlocking, triggerHaptic, setDisplayTime, setShowIntentionModal]);

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
  }, [saveTimerState, timerState.startTime, timerState.sessionDuration, timerState.timeLeft, selectedPreset.duration, setDisplayTime]);

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
  }, [clearPersistence, saveTimerState, selectedPreset.duration, timerState, recordSession, hasAppsConfigured, stopAppBlocking, intervalRef, setDisplayTime]);

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
  }, [timerState, awardXP, toast, clearPersistence, saveTimerState, selectedPreset.duration, recordSession, hasAppsConfigured, stopAppBlocking, intervalRef, setDisplayTime]);

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
