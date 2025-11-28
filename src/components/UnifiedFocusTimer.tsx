import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBackendAppState } from "@/hooks/useBackendAppState";
import {
  TimerPreset,
  TimerPersistence,
  TIMER_PRESETS,
  TIMER_PERSISTENCE_KEY,
  BACKGROUND_THEME_KEY,
  BACKGROUND_THEMES,
} from "./focus-timer/constants";
import { useTimerPersistence } from "./focus-timer/hooks/useTimerPersistence";
import { useTimerAudio } from "./focus-timer/hooks/useTimerAudio";
import { FocusBackground } from "./focus-timer/backgrounds";
import { BackgroundThemeSwitcher } from "./focus-timer/BackgroundThemeSwitcher";
import { TimerDisplay } from "./focus-timer/TimerDisplay";
import { TimerControls } from "./focus-timer/TimerControls";
import { TimerPresetGrid } from "./focus-timer/TimerPresetGrid";
import { TimerStats } from "./focus-timer/TimerStats";

export const UnifiedFocusTimer = () => {
  const { toast } = useToast();
  const { awardXP, currentLevel } = useBackendAppState();
  const { playCompletionSound } = useTimerAudio();

  const {
    timerState,
    selectedPreset,
    setSelectedPreset,
    saveTimerState,
    clearPersistence
  } = useTimerPersistence();

  const [backgroundTheme, setBackgroundTheme] = useState<string>('sky');

  // Load background theme from localStorage (validate against unlock level)
  useEffect(() => {
    const savedTheme = localStorage.getItem(BACKGROUND_THEME_KEY);
    const theme = BACKGROUND_THEMES.find(t => t.id === savedTheme);
    if (theme && theme.unlockLevel <= currentLevel) {
      setBackgroundTheme(savedTheme!);
    } else {
      // Fall back to highest unlocked theme
      const unlockedThemes = BACKGROUND_THEMES.filter(t => t.unlockLevel <= currentLevel);
      if (unlockedThemes.length > 0) {
        setBackgroundTheme(unlockedThemes[unlockedThemes.length - 1].id);
      }
    }
  }, [currentLevel]);

  // Save background theme to localStorage (only if unlocked)
  const changeBackgroundTheme = useCallback((themeId: string) => {
    const theme = BACKGROUND_THEMES.find(t => t.id === themeId);
    if (theme && theme.unlockLevel <= currentLevel) {
      setBackgroundTheme(themeId);
      localStorage.setItem(BACKGROUND_THEME_KEY, themeId);
    }
  }, [currentLevel]);

  const setPreset = useCallback((preset: TimerPreset) => {
    if (!timerState.isRunning) {
      setSelectedPreset(preset);
      saveTimerState({
        timeLeft: preset.duration * 60,
        sessionDuration: preset.duration * 60,
        sessionType: preset.type,
        isRunning: false,
        startTime: null,
      });
    }
  }, [timerState.isRunning, setSelectedPreset, saveTimerState]);

  const suggestBreak = useCallback(() => {
    const isLongBreakTime = timerState.completedSessions % 4 === 0;
    const breakType = isLongBreakTime ? 'long-break' : 'short-break';
    const breakPreset = TIMER_PRESETS.find(p => p.id === breakType);

    if (breakPreset) {
      toast({
        title: "Time for a break!",
        description: `Consider taking a ${breakPreset.name.toLowerCase()}.`,
        action: (
          <Button
            size="sm"
            onClick={() => setPreset(breakPreset)}
            className="ml-2"
          >
            Start Break
          </Button>
        ),
      });
    }
  }, [timerState.completedSessions, toast, setPreset]);

  const handleComplete = useCallback(async () => {
    const completedMinutes = timerState.sessionDuration / 60;

    clearPersistence();

    if (timerState.soundEnabled) {
      playCompletionSound();
    }

    // Award XP for work sessions (minimum 25 minutes)
    let reward = null;
    if (timerState.sessionType !== 'break' && completedMinutes >= 25) {
      try {
        reward = await awardXP(completedMinutes);
      } catch (error) {
        console.error('Failed to award XP:', error);
      }
    }

    toast({
      title: `${selectedPreset.name} Complete!`,
      description: reward
        ? `+${reward.xpGained} XP${reward.coinReward ? ` & +${reward.coinReward.coinsGained} coins` : ''}${reward.leveledUp ? ' - Level Up!' : ''}`
        : `${completedMinutes}-minute ${timerState.sessionType} session completed.`,
      duration: 4000,
    });

    saveTimerState({
      isRunning: false,
      timeLeft: timerState.sessionDuration,
      startTime: null,
      completedSessions: timerState.completedSessions + 1,
    });

    // Suggest break after work sessions
    if (timerState.sessionType !== 'break') {
      suggestBreak();
    }
  }, [timerState, selectedPreset, awardXP, toast, saveTimerState, clearPersistence, playCompletionSound, suggestBreak]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isRunning && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        saveTimerState({ timeLeft: timerState.timeLeft - 1 });
      }, 1000);
    } else if (timerState.timeLeft === 0 && timerState.isRunning) {
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.timeLeft, saveTimerState, handleComplete]);

  // Page visibility API to handle app focus/blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background - save current state
        if (timerState.isRunning) {
          const persistenceData: TimerPersistence = {
            wasRunning: true,
            pausedAt: null,
            originalStartTime: timerState.startTime,
            timeLeftWhenPaused: timerState.timeLeft,
            sessionDuration: timerState.sessionDuration,
            sessionType: timerState.sessionType
          };
          localStorage.setItem(TIMER_PERSISTENCE_KEY, JSON.stringify(persistenceData));
        }
      } else {
        // App coming to foreground - restore if needed
        const savedPersistence = localStorage.getItem(TIMER_PERSISTENCE_KEY);
        if (savedPersistence && timerState.isRunning && timerState.startTime) {
          try {
            const persistence: TimerPersistence = JSON.parse(savedPersistence);
            if (persistence.wasRunning && persistence.originalStartTime) {
              const totalElapsed = Date.now() - persistence.originalStartTime;
              const elapsedSeconds = Math.floor(totalElapsed / 1000);
              const newTimeLeft = Math.max(0, persistence.sessionDuration - elapsedSeconds);

              saveTimerState({
                timeLeft: newTimeLeft,
                isRunning: newTimeLeft > 0
              });

              if (newTimeLeft === 0) {
                setTimeout(handleComplete, 100);
              }
            }
          } catch (error) {
            console.error('Failed to restore timer on foreground:', error);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState, saveTimerState, handleComplete]);

  const startTimer = useCallback(() => {
    saveTimerState({
      isRunning: true,
      startTime: Date.now(),
    });
  }, [saveTimerState]);

  const pauseTimer = useCallback(() => {
    saveTimerState({
      isRunning: false,
      startTime: null,
    });
  }, [saveTimerState]);

  const stopTimer = useCallback(() => {
    clearPersistence();
    saveTimerState({
      isRunning: false,
      timeLeft: timerState.sessionDuration,
      startTime: null,
    });
  }, [clearPersistence, saveTimerState, timerState.sessionDuration]);

  const skipTimer = useCallback(async () => {
    const completedMinutes = Math.ceil((timerState.sessionDuration - timerState.timeLeft) / 60);

    clearPersistence();

    if (timerState.sessionType !== 'break' && completedMinutes >= 25) {
      try {
        const reward = await awardXP(completedMinutes);
        toast({
          title: "Session Skipped",
          description: `+${reward?.xpGained || 0} XP for ${completedMinutes} minutes of focus!`,
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

    stopTimer();
  }, [timerState, awardXP, toast, clearPersistence, stopTimer]);

  const toggleSound = useCallback(() => {
    saveTimerState({ soundEnabled: !timerState.soundEnabled });
  }, [saveTimerState, timerState.soundEnabled]);

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <FocusBackground theme={backgroundTheme} />

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-16 pb-32">
        <BackgroundThemeSwitcher
          currentTheme={backgroundTheme}
          currentLevel={currentLevel}
          onThemeChange={changeBackgroundTheme}
        />

        <TimerDisplay
          preset={selectedPreset}
          timeLeft={timerState.timeLeft}
          sessionDuration={timerState.sessionDuration}
          isRunning={timerState.isRunning}
          soundEnabled={timerState.soundEnabled}
          onToggleSound={toggleSound}
        />

        <TimerControls
          isRunning={timerState.isRunning}
          onStart={startTimer}
          onPause={pauseTimer}
          onStop={stopTimer}
          onSkip={skipTimer}
        />

        <div className="mt-6">
          <TimerPresetGrid
            selectedPreset={selectedPreset}
            isRunning={timerState.isRunning}
            onSelectPreset={setPreset}
          />
        </div>

        <TimerStats completedSessions={timerState.completedSessions} />
      </div>
    </div>
  );
};
