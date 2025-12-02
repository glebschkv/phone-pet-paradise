import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useBossChallenges } from "@/hooks/useBossChallenges";
import { useDeviceActivity } from "@/hooks/useDeviceActivity";
import { FocusCategory } from "@/types/analytics";
import { dispatchAchievementEvent, ACHIEVEMENT_EVENTS } from "@/hooks/useAchievementTracking";
import {
  TimerPreset,
  TIMER_PRESETS,
  BACKGROUND_THEME_KEY,
  BACKGROUND_THEMES,
} from "./focus-timer/constants";
import { useTimerPersistence } from "./focus-timer/hooks/useTimerPersistence";
import { useTimerAudio } from "./focus-timer/hooks/useTimerAudio";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { FocusBackground } from "./focus-timer/backgrounds";
import { BackgroundThemeSwitcher } from "./focus-timer/BackgroundThemeSwitcher";
import { TimerDisplay } from "./focus-timer/TimerDisplay";
import { TimerControls } from "./focus-timer/TimerControls";
import { TimerPresetGrid } from "./focus-timer/TimerPresetGrid";
import { TimerStats } from "./focus-timer/TimerStats";
import { TaskIntentionModal } from "./focus-timer/TaskIntentionModal";
import { FocusLockScreen } from "./focus-timer/FocusLockScreen";
import { SessionNotesModal } from "./focus-timer/SessionNotesModal";
import { AmbientSoundPicker } from "./focus-timer/AmbientSoundPicker";
import { BreakTransitionModal } from "./focus-timer/BreakTransitionModal";
import { AppBlockingSection } from "./focus-timer/AppBlockingSection";
import { Analytics } from "./analytics";
import { Timer, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

// Focus bonus multipliers for completing sessions without blocked app attempts
const FOCUS_BONUS = {
  PERFECT_FOCUS: 1.25,     // 25% bonus for 0 blocked app attempts
  GOOD_FOCUS: 1.10,        // 10% bonus for 1-2 attempts
  DISTRACTED: 1.0,         // No bonus for 3+ attempts
};

type TimerView = 'timer' | 'stats';

const AUTO_BREAK_STORAGE_KEY = 'petIsland_autoBreak';

export const UnifiedFocusTimer = () => {
  const { toast } = useToast();
  const { awardXP, currentLevel, coinSystem, xpSystem } = useBackendAppState();
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
    getShieldAttempts,
    triggerHaptic,
  } = useDeviceActivity();

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
      console.error('Failed to load auto-break setting:', error);
      return false;
    }
  });

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
        console.error('Failed to award XP:', error);
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
      const wasJackpot = reward?.bonusType === 'jackpot';
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
            console.error('Failed to award boss XP:', error);
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
    // TODO: Save notes to analytics/backend
    console.log('Session notes:', { notes, rating });
    setShowSessionNotesModal(false);
    // Show break transition modal after notes
    setShowBreakTransitionModal(true);
  }, []);

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
            console.error('Failed to award boss XP:', error);
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
        {/* View Toggle & Ambient Sound */}
        <div className="mb-4 flex items-center gap-3">
          <ViewToggle />
          <AmbientSoundPicker />
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
          onStart={requestStartTimer}
          onPause={pauseTimer}
          onStop={stopTimer}
          onSkip={skipTimer}
        />

        {/* App Blocking Section */}
        <AppBlockingSection
          isTimerRunning={timerState.isRunning}
        />

        {/* Task Intention Modal */}
        <TaskIntentionModal
          isOpen={showIntentionModal}
          onClose={() => setShowIntentionModal(false)}
          onStart={startTimerWithIntent}
          selectedPreset={selectedPreset}
        />

        {/* Session Notes Modal - shows after completing a work session */}
        <SessionNotesModal
          isOpen={showSessionNotesModal}
          onClose={() => {
            setShowSessionNotesModal(false);
            setShowBreakTransitionModal(true);
          }}
          onSave={handleSessionNotesSave}
          sessionDuration={timerState.sessionDuration}
          xpEarned={lastSessionXP}
          taskLabel={timerState.taskLabel}
        />

        {/* Break Transition Modal - shows after session notes */}
        <BreakTransitionModal
          isOpen={showBreakTransitionModal}
          onClose={handleSkipBreak}
          onStartBreak={handleStartBreak}
          onSkipBreak={handleSkipBreak}
          isLongBreak={timerState.completedSessions % 4 === 0}
          completedSessions={timerState.completedSessions}
          autoStartEnabled={autoBreakEnabled}
          onToggleAutoStart={toggleAutoBreak}
        />

        <div className="mt-6">
          <TimerPresetGrid
            selectedPreset={selectedPreset}
            isRunning={timerState.isRunning}
            onSelectPreset={setPreset}
          />
        </div>

        <TimerStats />

        <BackgroundThemeSwitcher
          currentTheme={backgroundTheme}
          currentLevel={currentLevel}
          onThemeChange={changeBackgroundTheme}
        />
      </div>

      {/* Focus Lock Screen - shows when app loses focus during work session */}
      <FocusLockScreen
        isVisible={showLockScreen}
        timeRemaining={displayTime}
        category={timerState.category}
        taskLabel={timerState.taskLabel}
        onReturnToApp={() => setShowLockScreen(false)}
        onAbandonSession={() => {
          setShowLockScreen(false);
          stopTimer();
        }}
      />
    </div>
  );
};
