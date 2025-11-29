import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  TimerPreset,
  TIMER_PRESETS,
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
import { Analytics } from "./analytics";
import { Timer, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerView = 'timer' | 'stats';

export const UnifiedFocusTimer = () => {
  const { toast } = useToast();
  const { awardXP, currentLevel } = useBackendAppState();
  const { playCompletionSound } = useTimerAudio();
  const { recordSession } = useAnalytics();

  const {
    timerState,
    selectedPreset,
    setSelectedPreset,
    saveTimerState,
    clearPersistence
  } = useTimerPersistence();

  const [backgroundTheme, setBackgroundTheme] = useState<string>('sky');
  const [displayTime, setDisplayTime] = useState<number>(timerState.timeLeft);
  const [currentView, setCurrentView] = useState<TimerView>('timer');

  // Refs for stable timer management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCompletingRef = useRef(false);

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
      } catch (error) {
        console.error('Failed to award XP:', error);
      }
    }

    // Record session to analytics
    recordSession(
      timerState.sessionType,
      timerState.sessionDuration,
      timerState.sessionDuration, // Full duration completed
      'completed',
      xpEarned
    );

    toast({
      title: `${selectedPreset.name} Complete!`,
      description: reward
        ? `+${reward.xpGained} XP${reward.coinReward ? ` & +${reward.coinReward.coinsGained} coins` : ''}${reward.leveledUp ? ' - Level Up!' : ''}`
        : `${completedMinutes}-minute ${timerState.sessionType} session completed.`,
      duration: 4000,
    });

    // Reset display time and timer state
    setDisplayTime(timerState.sessionDuration);
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

    isCompletingRef.current = false;
  }, [timerState, selectedPreset, awardXP, toast, saveTimerState, clearPersistence, playCompletionSound, suggestBreak, recordSession]);

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
      if (!document.hidden && timerState.isRunning && timerState.startTime) {
        // App coming to foreground - recalculate time
        const now = Date.now();
        const elapsedMs = now - timerState.startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const newTimeLeft = Math.max(0, timerState.sessionDuration - elapsedSeconds);

        setDisplayTime(newTimeLeft);
        saveTimerState({ timeLeft: newTimeLeft });

        if (newTimeLeft === 0) {
          handleComplete();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState.isRunning, timerState.startTime, timerState.sessionDuration, saveTimerState, handleComplete]);

  const startTimer = useCallback(() => {
    const now = Date.now();
    setDisplayTime(timerState.timeLeft);
    saveTimerState({
      isRunning: true,
      startTime: now,
      // Calculate sessionDuration based on current timeLeft for resumed timers
      sessionDuration: timerState.timeLeft,
    });
  }, [saveTimerState, timerState.timeLeft]);

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

  const stopTimer = useCallback(() => {
    // Calculate actual time worked before stopping
    let elapsedSeconds = 0;
    if (timerState.startTime) {
      const now = Date.now();
      const elapsedMs = now - timerState.startTime;
      elapsedSeconds = Math.floor(elapsedMs / 1000);
    } else {
      elapsedSeconds = timerState.sessionDuration - timerState.timeLeft;
    }

    // Record as abandoned if timer was running and some time elapsed
    if (timerState.isRunning && elapsedSeconds > 60) {
      recordSession(
        timerState.sessionType,
        timerState.sessionDuration,
        elapsedSeconds,
        'abandoned',
        0
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
    });
  }, [clearPersistence, saveTimerState, selectedPreset.duration, timerState, recordSession]);

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
        xpEarned
      );
    }

    const fullDuration = selectedPreset.duration * 60;
    setDisplayTime(fullDuration);
    saveTimerState({
      isRunning: false,
      timeLeft: fullDuration,
      sessionDuration: fullDuration,
      startTime: null,
    });
  }, [timerState, awardXP, toast, clearPersistence, saveTimerState, selectedPreset.duration, recordSession]);

  const toggleSound = useCallback(() => {
    saveTimerState({ soundEnabled: !timerState.soundEnabled });
  }, [saveTimerState, timerState.soundEnabled]);

  // View toggle component
  const ViewToggle = () => (
    <div className="flex gap-1 p-1 bg-black/20 backdrop-blur-sm rounded-xl">
      <button
        onClick={() => setCurrentView('timer')}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
          currentView === 'timer'
            ? "bg-white text-gray-900 shadow-md"
            : "text-white/80 hover:text-white hover:bg-white/10"
        )}
      >
        <Timer className="w-4 h-4" />
        Timer
      </button>
      <button
        onClick={() => setCurrentView('stats')}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
          currentView === 'stats'
            ? "bg-white text-gray-900 shadow-md"
            : "text-white/80 hover:text-white hover:bg-white/10"
        )}
      >
        <BarChart3 className="w-4 h-4" />
        Stats
      </button>
    </div>
  );

  // Render stats view
  if (currentView === 'stats') {
    return (
      <div className="min-h-screen w-full relative overflow-hidden">
        <FocusBackground theme={backgroundTheme} />
        <div className="relative z-10">
          {/* View Toggle - Fixed at top */}
          <div className="sticky top-0 z-20 flex justify-center pt-4 pb-2">
            <ViewToggle />
          </div>
          {/* Analytics Content */}
          <Analytics />
        </div>
      </div>
    );
  }

  // Render timer view
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <FocusBackground theme={backgroundTheme} />

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-4 pb-32">
        {/* View Toggle */}
        <div className="mb-4">
          <ViewToggle />
        </div>

        <TimerDisplay
          preset={selectedPreset}
          timeLeft={displayTime}
          sessionDuration={selectedPreset.duration * 60}
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

        <BackgroundThemeSwitcher
          currentTheme={backgroundTheme}
          currentLevel={currentLevel}
          onThemeChange={changeBackgroundTheme}
        />
      </div>
    </div>
  );
};
