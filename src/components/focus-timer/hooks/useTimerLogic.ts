import { useState, useEffect, useCallback, useRef } from "react";
import { timerLogger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useBossChallenges } from "@/hooks/useBossChallenges";
import { useDeviceActivity } from "@/hooks/useDeviceActivity";
import { FocusCategory } from "@/types/analytics";
import { dispatchAchievementEvent, ACHIEVEMENT_EVENTS } from "@/hooks/useAchievementTracking";
import { TimerPreset, TIMER_PRESETS } from "../constants";
import { useTimerPersistence } from "./useTimerPersistence";
import { useTimerAudio } from "./useTimerAudio";
import { useAmbientSound } from "@/hooks/useAmbientSound";

// Focus bonus multipliers for completing sessions without blocked app attempts
const FOCUS_BONUS = {
  PERFECT_FOCUS: 1.25,     // 25% bonus for 0 blocked app attempts
  GOOD_FOCUS: 1.10,        // 10% bonus for 1-2 attempts
  DISTRACTED: 1.0,         // No bonus for 3+ attempts
};

const AUTO_BREAK_STORAGE_KEY = 'petIsland_autoBreak';

export const useTimerLogic = () => {
  const { toast } = useToast();
  const { awardXP, coinSystem, xpSystem } = useBackendAppState();
  const { playCompletionSound } = useTimerAudio();
  const { recordSession } = useAnalytics();
  const { stop: stopAmbientSound, isPlaying: isAmbientPlaying } = useAmbientSound();
  const { recordFocusSession } = useBossChallenges();

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

  const [displayTime, setDisplayTime] = useState<number>(timerState.timeLeft);
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState(false);

  // New state for enhanced features
  const [showSessionNotesModal, setShowSessionNotesModal] = useState(false);
  const [showBreakTransitionModal, setShowBreakTransitionModal] = useState(false);
  const [lastSessionXP, setLastSessionXP] = useState(0);
  const [autoBreakEnabled, setAutoBreakEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTO_BREAK_STORAGE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      timerLogger.error('Failed to load auto-break setting:', error);
      return false;
    }
  });

  // Refs for stable timer management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletingRef = useRef(false);

  const setPreset = useCallback((preset: TimerPreset) => {
    if (!timerState.isRunning) {
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
  }, [timerState.isRunning, setSelectedPreset, saveTimerState]);

  const handleComplete = useCallback(async () => {
    // Prevent double completion
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    const completedMinutes = timerState.sessionDuration / 60;

    // Clear interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    clearPersistence();

    // Stop app blocking and get shield attempts
    let shieldAttempts = 0;
    if (timerState.sessionType !== 'break' && hasAppsConfigured) {
      const blockingResult = await stopAppBlocking();
      shieldAttempts = blockingResult.shieldAttempts;
    }

    // Calculate focus bonus based on shield attempts
    let focusMultiplier = FOCUS_BONUS.DISTRACTED;
    let focusBonusType = '';
    if (hasAppsConfigured && blockedAppsCount > 0) {
      if (shieldAttempts === 0) {
        focusMultiplier = FOCUS_BONUS.PERFECT_FOCUS;
        focusBonusType = 'PERFECT FOCUS';
      } else if (shieldAttempts <= 2) {
        focusMultiplier = FOCUS_BONUS.GOOD_FOCUS;
        focusBonusType = 'GOOD FOCUS';
      }
    }

    // Stop ambient sound when session ends
    if (isAmbientPlaying) {
      stopAmbientSound();
    }

    if (timerState.soundEnabled) {
      playCompletionSound();
    }

    // Award XP for work sessions (minimum 25 minutes)
    let reward = null;
    let xpEarned = 0;
    if (timerState.sessionType !== 'break' && completedMinutes >= 25) {
      try {
        reward = await awardXP(completedMinutes);
        xpEarned = reward?.xpGained || 0;

        // Apply focus bonus to XP
        if (focusMultiplier > 1.0 && xpEarned > 0) {
          const bonusXP = Math.floor(xpEarned * (focusMultiplier - 1));
          if (bonusXP > 0 && xpSystem && 'addDirectXP' in xpSystem) {
            (xpSystem as { addDirectXP: (xp: number) => void }).addDirectXP(bonusXP);
            xpEarned += bonusXP;
          }
        }
      } catch (error) {
        timerLogger.error('Failed to award XP:', error);
      }
    }

    // Award focus bonus coins
    if (focusMultiplier > 1.0 && timerState.sessionType !== 'break' && coinSystem) {
      const bonusCoins = focusMultiplier === FOCUS_BONUS.PERFECT_FOCUS ? 50 : 25;
      coinSystem.addCoins(bonusCoins);

      // Trigger success haptic for perfect focus
      if (focusMultiplier === FOCUS_BONUS.PERFECT_FOCUS) {
        triggerHaptic('success');
      }
    }

    // Record session to analytics with category info
    recordSession(
      timerState.sessionType,
      timerState.sessionDuration,
      timerState.sessionDuration, // Full duration completed
      'completed',
      xpEarned,
      timerState.category,
      timerState.taskLabel
    );

    // Dispatch achievement tracking event for focus sessions (non-break only)
    if (timerState.sessionType !== 'break' && completedMinutes >= 1) {
      const wasJackpot = reward && 'bonusType' in reward && reward.bonusType === 'jackpot';
      dispatchAchievementEvent(ACHIEVEMENT_EVENTS.FOCUS_SESSION_COMPLETE, {
        minutes: completedMinutes,
        wasJackpot,
      });
    }

    // Record focus session for boss challenge progress (only for work sessions)
    if (timerState.sessionType !== 'break' && completedMinutes >= 1) {
      const bossResult = recordFocusSession(completedMinutes);

      // If a boss challenge was completed, award the rewards
      if (bossResult.challengeCompleted && bossResult.completedChallenge) {
        const challenge = bossResult.completedChallenge;

        // Award bonus XP from boss challenge (on top of session XP)
        if (challenge.rewards.xp > 0 && xpSystem && 'addDirectXP' in xpSystem) {
          try {
            (xpSystem as { addDirectXP: (xp: number) => void }).addDirectXP(challenge.rewards.xp);
          } catch (error) {
            timerLogger.error('Failed to award boss XP:', error);
          }
        }

        // Award bonus coins from boss challenge
        if (challenge.rewards.coins > 0 && coinSystem) {
          coinSystem.addCoins(challenge.rewards.coins);
        }

        // Show boss defeat celebration toast
        toast({
          title: `🏆 BOSS DEFEATED: ${challenge.name}!`,
          description: `+${challenge.rewards.xp} XP, +${challenge.rewards.coins} Coins${challenge.rewards.badge ? ', +Badge!' : ''}`,
          duration: 5000,
        });
      }
    }

    // Reset display time and timer state
    setDisplayTime(timerState.sessionDuration);
    saveTimerState({
      isRunning: false,
      timeLeft: timerState.sessionDuration,
      startTime: null,
      completedSessions: timerState.completedSessions + 1,
      category: undefined,
      taskLabel: undefined,
    });

    // For work sessions, show session notes modal then break transition
    if (timerState.sessionType !== 'break') {
      setLastSessionXP(xpEarned);

      // Show focus bonus toast if earned
      if (focusBonusType) {
        toast({
          title: `${focusBonusType}!`,
          description: focusMultiplier === FOCUS_BONUS.PERFECT_FOCUS
            ? "You stayed fully focused! +25% XP bonus & +50 coins!"
            : "Good focus! +10% XP bonus & +25 coins!",
          duration: 4000,
        });
      }

      setShowSessionNotesModal(true);
    } else {
      // For break sessions, just show completion toast
      toast({
        title: 'Break Complete!',
        description: 'Time to get back to work!',
        duration: 3000,
      });
    }

    isCompletingRef.current = false;
  }, [timerState, awardXP, saveTimerState, clearPersistence, playCompletionSound, recordSession, isAmbientPlaying, stopAmbientSound, toast, recordFocusSession, coinSystem, xpSystem, hasAppsConfigured, blockedAppsCount, stopAppBlocking, triggerHaptic]);

  // Handle session notes save
  const handleSessionNotesSave = useCallback((notes: string, rating: number) => {
    // Save session notes to localStorage for persistence
    try {
      const sessionNotesKey = 'petIsland_sessionNotes';
      const existingNotes = localStorage.getItem(sessionNotesKey);
      const notesArray = existingNotes ? JSON.parse(existingNotes) : [];

      // Add the new note with metadata
      notesArray.push({
        id: Date.now(),
        notes,
        rating,
        sessionDuration: timerState.sessionDuration,
        category: timerState.category,
        taskLabel: timerState.taskLabel,
        xpEarned: lastSessionXP,
        timestamp: new Date().toISOString(),
      });

      // Keep only the last 100 notes to prevent storage bloat
      const trimmedNotes = notesArray.slice(-100);
      localStorage.setItem(sessionNotesKey, JSON.stringify(trimmedNotes));

      // Dispatch event for analytics tracking
      dispatchAchievementEvent(ACHIEVEMENT_EVENTS.FOCUS_SESSION_COMPLETE, {
        minutes: timerState.sessionDuration / 60,
        hasNotes: notes.length > 0,
        rating,
      });
    } catch (error) {
      timerLogger.error('Failed to save session notes:', error);
    }

    setShowSessionNotesModal(false);
    // Show break transition modal after notes
    setShowBreakTransitionModal(true);
  }, [timerState.sessionDuration, timerState.category, timerState.taskLabel, lastSessionXP]);

  // Handle starting a break
  const handleStartBreak = useCallback((duration: number) => {
    setShowBreakTransitionModal(false);

    // Find or create the break preset
    const breakPreset = TIMER_PRESETS.find(p => p.type === 'break' && p.duration === duration)
      || TIMER_PRESETS.find(p => p.id === 'short-break');

    if (breakPreset) {
      setSelectedPreset(breakPreset);
      const newTimeLeft = duration * 60;
      setDisplayTime(newTimeLeft);

      // Auto-start the break timer
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
    }
  }, [setSelectedPreset, saveTimerState]);

  // Handle skipping break
  const handleSkipBreak = useCallback(() => {
    setShowBreakTransitionModal(false);
    toast({
      title: 'Break skipped',
      description: "Remember to take breaks regularly!",
      duration: 2000,
    });
  }, [toast]);

  // Toggle auto-break setting
  const toggleAutoBreak = useCallback((enabled: boolean) => {
    setAutoBreakEnabled(enabled);
    localStorage.setItem(AUTO_BREAK_STORAGE_KEY, JSON.stringify(enabled));
  }, []);

  // Sync displayTime with timerState when not running
  useEffect(() => {
    if (!timerState.isRunning) {
      setDisplayTime(timerState.timeLeft);
    }
  }, [timerState.timeLeft, timerState.isRunning]);

  // Timer countdown effect using refs for stable interval
  useEffect(() => {
    // Clear any existing interval
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

        // Update storage periodically (every 5 seconds) for persistence
        if (elapsedSeconds % 5 === 0) {
          saveTimerState({ timeLeft: newTimeLeft });
        }

        // Timer completed
        if (newTimeLeft === 0) {
          handleComplete();
        }
      };

      // Run immediately
      tick();

      // Set up interval
      intervalRef.current = setInterval(tick, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.startTime, timerState.sessionDuration, saveTimerState, handleComplete]);

  // Page visibility API to handle app focus/blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && timerState.isRunning && timerState.sessionType !== 'break') {
        // App going to background during work session - show lock screen
        setShowLockScreen(true);
      } else if (!document.hidden && timerState.isRunning && timerState.startTime) {
        // App coming to foreground - recalculate time
        const now = Date.now();
        const elapsedMs = now - timerState.startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const newTimeLeft = Math.max(0, timerState.sessionDuration - elapsedSeconds);

        setDisplayTime(newTimeLeft);
        saveTimerState({ timeLeft: newTimeLeft });

        // Hide lock screen
        setShowLockScreen(false);

        if (newTimeLeft === 0) {
          handleComplete();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState.isRunning, timerState.startTime, timerState.sessionDuration, timerState.sessionType, saveTimerState, handleComplete]);

  // Request to start timer - shows intention modal for work sessions
  const requestStartTimer = useCallback(() => {
    // For break sessions, start immediately without modal
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
      // Show intention modal for work sessions
      setShowIntentionModal(true);
    }
  }, [saveTimerState, timerState.timeLeft, selectedPreset.type]);

  // Actually start timer with category info
  const startTimerWithIntent = useCallback(async (category: FocusCategory, taskLabel?: string) => {
    setShowIntentionModal(false);

    // Start app blocking if enabled and apps are configured
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
    // Calculate current time left
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
      // Keep the original session duration for the progress bar
      sessionDuration: selectedPreset.duration * 60,
    });
  }, [saveTimerState, timerState.startTime, timerState.sessionDuration, timerState.timeLeft, selectedPreset.duration]);

  const stopTimer = useCallback(async () => {
    // Calculate actual time worked before stopping
    let elapsedSeconds = 0;
    if (timerState.startTime) {
      const now = Date.now();
      const elapsedMs = now - timerState.startTime;
      elapsedSeconds = Math.floor(elapsedMs / 1000);
    } else {
      elapsedSeconds = timerState.sessionDuration - timerState.timeLeft;
    }

    // Stop app blocking
    if (timerState.sessionType !== 'break' && hasAppsConfigured) {
      await stopAppBlocking();
    }

    // Record as abandoned if timer was running and some time elapsed
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
    // Calculate actual time worked
    let elapsedSeconds = 0;
    if (timerState.startTime) {
      const now = Date.now();
      const elapsedMs = now - timerState.startTime;
      elapsedSeconds = Math.floor(elapsedMs / 1000);
    } else {
      elapsedSeconds = timerState.sessionDuration - timerState.timeLeft;
    }

    const completedMinutes = Math.ceil(elapsedSeconds / 60);

    // Stop app blocking
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

    // Record skipped session to analytics
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

    // Record focus session for boss challenge progress (only for work sessions with at least 1 minute)
    if (timerState.sessionType !== 'break' && completedMinutes >= 1) {
      const bossResult = recordFocusSession(completedMinutes);

      // If a boss challenge was completed, award the rewards
      if (bossResult.challengeCompleted && bossResult.completedChallenge) {
        const challenge = bossResult.completedChallenge;

        // Award bonus XP from boss challenge
        if (challenge.rewards.xp > 0 && xpSystem && 'addDirectXP' in xpSystem) {
          try {
            (xpSystem as { addDirectXP: (xp: number) => void }).addDirectXP(challenge.rewards.xp);
          } catch (error) {
            timerLogger.error('Failed to award boss XP:', error);
          }
        }

        // Award bonus coins from boss challenge
        if (challenge.rewards.coins > 0 && coinSystem) {
          coinSystem.addCoins(challenge.rewards.coins);
        }

        // Show boss defeat celebration toast
        toast({
          title: `🏆 BOSS DEFEATED: ${challenge.name}!`,
          description: `+${challenge.rewards.xp} XP, +${challenge.rewards.coins} Coins${challenge.rewards.badge ? ', +Badge!' : ''}`,
          duration: 5000,
        });
      }
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
  }, [timerState, awardXP, toast, clearPersistence, saveTimerState, selectedPreset.duration, recordSession, recordFocusSession, coinSystem, xpSystem, hasAppsConfigured, stopAppBlocking]);

  const toggleSound = useCallback(() => {
    saveTimerState({ soundEnabled: !timerState.soundEnabled });
  }, [saveTimerState, timerState.soundEnabled]);

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
    setShowBreakTransitionModal,
    setShowLockScreen,
  };
};
