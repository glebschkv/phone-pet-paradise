import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Coffee,
  Brain,
  Clock,
  Volume2,
  VolumeX,
  Sun,
  Sunset,
  Moon,
  Waves,
  TreePine,
  Snowflake,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { cn } from "@/lib/utils";

const STORAGE_KEY = 'petIsland_unifiedTimer';
const TIMER_PERSISTENCE_KEY = 'petIsland_timerPersistence';
const BACKGROUND_THEME_KEY = 'petIsland_focusBackground';

// Background theme definitions
interface BackgroundTheme {
  id: string;
  name: string;
  icon: any;
  unlockLevel: number;
}

const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: 'sky', name: 'Day', icon: Sun, unlockLevel: 1 },
  { id: 'sunset', name: 'Sunset', icon: Sunset, unlockLevel: 3 },
  { id: 'night', name: 'Night', icon: Moon, unlockLevel: 5 },
  { id: 'ocean', name: 'Ocean', icon: Waves, unlockLevel: 8 },
  { id: 'forest', name: 'Forest', icon: TreePine, unlockLevel: 12 },
  { id: 'snow', name: 'Snow', icon: Snowflake, unlockLevel: 15 },
];

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  sessionDuration: number;
  startTime: number | null;
  sessionType: 'pomodoro' | 'deep-work' | 'break';
  completedSessions: number;
  soundEnabled: boolean;
}

interface TimerPersistence {
  wasRunning: boolean;
  pausedAt: number | null;
  originalStartTime: number | null;
  timeLeftWhenPaused: number;
  sessionDuration: number;
  sessionType: 'pomodoro' | 'deep-work' | 'break';
}

interface TimerPreset {
  id: string;
  name: string;
  duration: number;
  type: 'pomodoro' | 'deep-work' | 'break';
  icon: any;
  color: string;
  description: string;
}

const TIMER_PRESETS: TimerPreset[] = [
  { 
    id: 'pomodoro', 
    name: 'Pomodoro', 
    duration: 25, 
    type: 'pomodoro', 
    icon: Clock, 
    color: 'text-primary',
    description: 'Classic 25-minute focus session'
  },
  { 
    id: 'deep-work', 
    name: 'Deep Work', 
    duration: 90, 
    type: 'deep-work', 
    icon: Brain, 
    color: 'text-success',
    description: 'Extended 90-minute deep focus'
  },
  { 
    id: 'focus-45', 
    name: 'Focus 45', 
    duration: 45, 
    type: 'pomodoro', 
    icon: Clock, 
    color: 'text-accent',
    description: 'Medium 45-minute session'
  },
  { 
    id: 'focus-60', 
    name: 'Focus 60', 
    duration: 60, 
    type: 'pomodoro', 
    icon: Clock, 
    color: 'text-primary',
    description: 'Extended 60-minute session'
  },
  { 
    id: 'short-break', 
    name: 'Short Break', 
    duration: 5, 
    type: 'break', 
    icon: Coffee, 
    color: 'text-warning',
    description: '5-minute refresh break'
  },
  { 
    id: 'long-break', 
    name: 'Long Break', 
    duration: 15, 
    type: 'break', 
    icon: Coffee, 
    color: 'text-warning',
    description: '15-minute extended break'
  },
];

export const UnifiedFocusTimer = () => {
  const { toast } = useToast();
  const { awardXP, currentLevel } = useBackendAppState();
  
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: 25 * 60,
    isRunning: false,
    sessionDuration: 25 * 60,
    startTime: null,
    sessionType: 'pomodoro',
    completedSessions: 0,
    soundEnabled: true,
  });

  const [selectedPreset, setSelectedPreset] = useState<TimerPreset>(TIMER_PRESETS[0]);
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
  const changeBackgroundTheme = (themeId: string) => {
    const theme = BACKGROUND_THEMES.find(t => t.id === themeId);
    if (theme && theme.unlockLevel <= currentLevel) {
      setBackgroundTheme(themeId);
      localStorage.setItem(BACKGROUND_THEME_KEY, themeId);
    }
  };

  // Save timer state to localStorage with persistence
  const saveTimerState = useCallback((state: Partial<TimerState>) => {
    const newState = { ...timerState, ...state };
    
    // Save basic timer state
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...newState,
      isRunning: false, // Don't persist running state in main storage
      startTime: null
    }));
    
    // Save persistence data separately for running timers
    const persistenceData: TimerPersistence = {
      wasRunning: newState.isRunning,
      pausedAt: newState.isRunning ? null : Date.now(),
      originalStartTime: newState.startTime,
      timeLeftWhenPaused: newState.timeLeft,
      sessionDuration: newState.sessionDuration,
      sessionType: newState.sessionType
    };
    
    localStorage.setItem(TIMER_PERSISTENCE_KEY, JSON.stringify(persistenceData));
    setTimerState(newState);
  }, [timerState]);

  // Load timer state from localStorage with persistence restoration
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    const savedPersistence = localStorage.getItem(TIMER_PERSISTENCE_KEY);
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        let finalState = { 
          ...parsed, 
          isRunning: false,
          startTime: null 
        };

        // Check if we need to restore a running timer
        if (savedPersistence) {
          const persistence: TimerPersistence = JSON.parse(savedPersistence);
          
          if (persistence.wasRunning && persistence.originalStartTime) {
            // Calculate how much time has actually elapsed
            const totalElapsed = Date.now() - persistence.originalStartTime;
            const elapsedSeconds = Math.floor(totalElapsed / 1000);
            const newTimeLeft = Math.max(0, persistence.sessionDuration - elapsedSeconds);
            
            finalState = {
              ...finalState,
              timeLeft: newTimeLeft,
              sessionDuration: persistence.sessionDuration,
              sessionType: persistence.sessionType,
              isRunning: newTimeLeft > 0, // Resume if time remaining
              startTime: persistence.originalStartTime
            };
            
            console.log(`🔄 Timer restored: ${elapsedSeconds}s elapsed, ${newTimeLeft}s remaining`);
          } else if (persistence.pausedAt) {
            // Timer was paused, restore paused state
            finalState = {
              ...finalState,
              timeLeft: persistence.timeLeftWhenPaused,
              sessionDuration: persistence.sessionDuration,
              sessionType: persistence.sessionType
            };
            
            console.log(`⏸️ Timer restored from pause: ${persistence.timeLeftWhenPaused}s remaining`);
          }
        }
        
        setTimerState(finalState);
        
        // Set the corresponding preset
        const preset = TIMER_PRESETS.find(p => p.duration === finalState.sessionDuration / 60);
        if (preset) {
          setSelectedPreset(preset);
        }
      } catch (error) {
        console.error('Failed to load timer state:', error);
      }
    }
  }, []);

  // Timer countdown effect with proper persistence
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isRunning && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          // Auto-save persistence data every 5 seconds while running
          if (newTimeLeft % 5 === 0) {
            const persistenceData: TimerPersistence = {
              wasRunning: true,
              pausedAt: null,
              originalStartTime: prev.startTime,
              timeLeftWhenPaused: newTimeLeft,
              sessionDuration: prev.sessionDuration,
              sessionType: prev.sessionType
            };
            localStorage.setItem(TIMER_PERSISTENCE_KEY, JSON.stringify(persistenceData));
            console.log(`💾 Timer auto-saved: ${newTimeLeft}s remaining`);
          }
          
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    } else if (timerState.timeLeft === 0 && timerState.isRunning) {
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.timeLeft]);

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
          console.log(`🌙 App backgrounded with ${timerState.timeLeft}s remaining`);
        }
      } else {
        // App coming to foreground - restore if needed
        const savedPersistence = localStorage.getItem(TIMER_PERSISTENCE_KEY);
        if (savedPersistence && timerState.isRunning && timerState.startTime) {
          try {
            const persistence: TimerPersistence = JSON.parse(savedPersistence);
            if (persistence.wasRunning && persistence.originalStartTime) {
              // Calculate actual elapsed time
              const totalElapsed = Date.now() - persistence.originalStartTime;
              const elapsedSeconds = Math.floor(totalElapsed / 1000);
              const newTimeLeft = Math.max(0, persistence.sessionDuration - elapsedSeconds);
              
              setTimerState(prev => ({
                ...prev,
                timeLeft: newTimeLeft,
                isRunning: newTimeLeft > 0
              }));
              
              console.log(`☀️ App foregrounded: ${elapsedSeconds}s elapsed, ${newTimeLeft}s remaining`);
              
              // Auto-complete if time is up
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
  }, [timerState.isRunning, timerState.startTime, timerState.timeLeft, timerState.sessionDuration, timerState.sessionType]);

  const handleComplete = useCallback(async () => {
    const completedMinutes = timerState.sessionDuration / 60;
    
    // Clear persistence data when session completes
    localStorage.removeItem(TIMER_PERSISTENCE_KEY);
    
    // Play completion sound
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

    // Show completion notification
    toast({
      title: `${selectedPreset.name} Complete!`,
      description: reward 
        ? `Session complete! +${reward.xpGained} XP earned ${reward.leveledUp ? '🎉' : ''}` 
        : `${completedMinutes}-minute ${timerState.sessionType} session completed.`,
      duration: 4000,
    });

    // Update state
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
  }, [timerState, selectedPreset, awardXP, toast, saveTimerState]);

  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const suggestBreak = () => {
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
  };

  const setPreset = (preset: TimerPreset) => {
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
  };

  const startTimer = () => {
    const startTime = Date.now();
    saveTimerState({
      isRunning: true,
      startTime: startTime,
    });
    console.log(`▶️ Timer started with ${timerState.timeLeft}s remaining`);
  };

  const pauseTimer = () => {
    saveTimerState({
      isRunning: false,
      startTime: null,
    });
    console.log(`⏸️ Timer paused with ${timerState.timeLeft}s remaining`);
  };

  const stopTimer = () => {
    // Clear persistence data when manually stopping
    localStorage.removeItem(TIMER_PERSISTENCE_KEY);
    saveTimerState({
      isRunning: false,
      timeLeft: timerState.sessionDuration,
      startTime: null,
    });
    console.log(`⏹️ Timer stopped and reset`);
  };

  const skipTimer = async () => {
    const completedMinutes = Math.ceil((timerState.sessionDuration - timerState.timeLeft) / 60);
    
    // Clear persistence data when skipping
    localStorage.removeItem(TIMER_PERSISTENCE_KEY);
    
    // Award XP if it was a meaningful session (>= 25 minutes) and not a break
    if (timerState.sessionType !== 'break' && completedMinutes >= 25) {
      try {
        const reward = await awardXP(completedMinutes);
        toast({
          title: "🎯 Session Skipped",
          description: `+${reward?.xpGained || 0} XP for ${completedMinutes} minutes of focus!`,
          duration: 3000,
        });
      } catch (error) {
        toast({
          title: "⚡ Timer Skipped",
          description: "Session saved locally, will sync when online",
          duration: 2000,
        });
      }
    } else {
      toast({
        title: "⚡ Timer Skipped",
        description: completedMinutes < 25 ? "Need 25+ minutes for XP rewards" : "Break completed",
        duration: 2000,
      });
    }
    
    stopTimer();
    console.log(`⏭️ Timer skipped after ${completedMinutes} minutes`);
  };

  const toggleSound = () => {
    saveTimerState({
      soundEnabled: !timerState.soundEnabled,
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = ((timerState.sessionDuration - timerState.timeLeft) / timerState.sessionDuration) * 100;

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Dynamic Background */}
      <FocusBackground theme={backgroundTheme} />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-16 pb-32">
        {/* Background Theme Switcher */}
        <div className="w-full max-w-sm mb-4">
          <div className="flex justify-center gap-2">
            {BACKGROUND_THEMES.map((theme) => {
              const Icon = theme.icon;
              const isSelected = backgroundTheme === theme.id;
              const isLocked = theme.unlockLevel > currentLevel;
              return (
                <button
                  key={theme.id}
                  onClick={() => !isLocked && changeBackgroundTheme(theme.id)}
                  disabled={isLocked}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isLocked
                      ? "opacity-40 cursor-not-allowed"
                      : "active:scale-95",
                    isSelected && !isLocked
                      ? "ring-2 ring-white ring-offset-2 ring-offset-transparent"
                      : !isLocked && "opacity-60 hover:opacity-100"
                  )}
                  style={{
                    background: isLocked
                      ? 'hsl(var(--muted) / 0.5)'
                      : isSelected
                        ? 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.9) 100%)'
                        : 'hsl(var(--card) / 0.6)',
                    border: '2px solid hsl(var(--border))',
                    boxShadow: isSelected && !isLocked
                      ? '0 2px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
                      : 'none'
                  }}
                  title={isLocked ? `Unlock at Lv.${theme.unlockLevel}` : theme.name}
                >
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Icon className={cn(
                      "w-4 h-4",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timer Card - Central Focus */}
        <div className="retro-card p-6 w-full max-w-sm mb-6">
          {/* Current Mode Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, hsl(260 60% 70%) 0%, hsl(260 60% 55%) 100%)',
                  boxShadow: '0 2px 0 hsl(260 60% 40%), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
                }}
              >
                <selectedPreset.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">{selectedPreset.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedPreset.duration} minutes</p>
              </div>
            </div>
            <button
              onClick={toggleSound}
              className="w-9 h-9 rounded-lg flex items-center justify-center active-scale retro-stat-pill"
            >
              {timerState.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-foreground" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Large Timer Display */}
          <div className="text-center mb-6">
            <div
              className="text-6xl font-bold font-mono tracking-wider mb-4"
              style={{
                color: 'hsl(220 25% 15%)',
                textShadow: '0 2px 0 hsl(0 0% 100% / 0.5), 0 -1px 0 hsl(0 0% 0% / 0.1)'
              }}
            >
              {formatTime(timerState.timeLeft)}
            </div>

            {/* Progress Bar */}
            <div className="retro-xp-bar w-full">
              <div
                className="retro-xp-fill"
                style={{ width: `${progress}%` }}
              >
                <div className="shine" />
              </div>
            </div>

            <p className="text-sm font-medium text-muted-foreground mt-3">
              {timerState.isRunning ? '🎯 Focus time...' : '✨ Ready to focus'}
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-3">
            {!timerState.isRunning ? (
              <button
                onClick={startTimer}
                className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white active-scale"
                style={{
                  background: 'linear-gradient(180deg, hsl(140 50% 55%) 0%, hsl(140 50% 45%) 100%)',
                  border: '2px solid hsl(140 50% 35%)',
                  boxShadow: '0 3px 0 hsl(140 50% 30%), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
                }}
              >
                <Play className="w-5 h-5" />
                Start
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white active-scale"
                style={{
                  background: 'linear-gradient(180deg, hsl(40 80% 55%) 0%, hsl(35 80% 45%) 100%)',
                  border: '2px solid hsl(35 70% 35%)',
                  boxShadow: '0 3px 0 hsl(35 70% 30%), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
                }}
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}

            <button
              onClick={stopTimer}
              className="w-12 h-12 rounded-lg flex items-center justify-center active-scale"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.5) 100%)',
                border: '2px solid hsl(var(--border))',
                boxShadow: '0 2px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
              }}
            >
              <Square className="w-5 h-5 text-foreground" />
            </button>

            <button
              onClick={skipTimer}
              className="w-12 h-12 rounded-lg flex items-center justify-center active-scale"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.5) 100%)',
                border: '2px solid hsl(var(--border))',
                boxShadow: '0 2px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
              }}
            >
              <SkipForward className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Preset Selection */}
        <div className="w-full max-w-sm">
          <p className="text-xs text-center text-muted-foreground mb-3 font-medium">Choose Focus Mode</p>
          <div className="grid grid-cols-3 gap-2">
            {TIMER_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset.id === preset.id;
              const isBreak = preset.type === 'break';

              return (
                <button
                  key={preset.id}
                  onClick={() => setPreset(preset)}
                  disabled={timerState.isRunning}
                  className={cn(
                    "p-3 rounded-lg text-center active-scale transition-all",
                    timerState.isRunning && "opacity-50 cursor-not-allowed"
                  )}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(180deg, hsl(260 60% 70%) 0%, hsl(260 60% 55%) 100%)'
                      : 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.9) 100%)',
                    border: isSelected
                      ? '2px solid hsl(260 60% 45%)'
                      : '2px solid hsl(var(--border))',
                    boxShadow: isSelected
                      ? '0 3px 0 hsl(260 60% 40%), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
                      : '0 2px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.15)'
                  }}
                >
                  <Icon className={cn(
                    "w-5 h-5 mx-auto mb-1",
                    isSelected ? "text-white" : isBreak ? "text-warning" : "text-primary"
                  )} />
                  <div className={cn(
                    "text-xs font-semibold",
                    isSelected ? "text-white" : "text-foreground"
                  )}>
                    {preset.duration}m
                  </div>
                  <div className={cn(
                    "text-[10px]",
                    isSelected ? "text-white/80" : "text-muted-foreground"
                  )}>
                    {preset.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="w-full max-w-sm mt-6">
          <div className="retro-card p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sessions today</span>
              <span className="retro-level-badge px-3 py-1 text-sm">
                {timerState.completedSessions}
              </span>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Complete 25+ min sessions to earn XP! 🌟
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dynamic Background Component for Focus Page
const FocusBackground = ({ theme }: { theme: string }) => {
  // Use key to force React to properly unmount/remount when switching
  switch (theme) {
    case 'sunset':
      return <SunsetBackground key="sunset" />;
    case 'night':
      return <NightBackground key="night" />;
    case 'ocean':
      return <OceanBackground key="ocean" />;
    case 'forest':
      return <ForestBackground key="forest" />;
    case 'snow':
      return <SnowBackground key="snow" />;
    default:
      return <SkyBackground key="sky" />;
  }
};

// Sky Background (Default - Day)
const SkyBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(200 65% 82%) 0%, hsl(200 45% 90%) 50%, hsl(40 50% 92%) 100%)'
      }}
    />
    <div
      className="absolute top-[10%] right-[12%] w-28 h-28 rounded-full opacity-50"
      style={{
        background: 'radial-gradient(circle, hsl(45 100% 88%) 0%, transparent 70%)'
      }}
    />
    <div className="absolute top-[15%] left-[8%] w-24 h-10 rounded-full bg-white/35 blur-sm" />
    <div className="absolute top-[10%] left-[30%] w-18 h-7 rounded-full bg-white/25 blur-sm" />
    <div className="absolute top-[20%] right-[15%] w-28 h-10 rounded-full bg-white/30 blur-sm" />
    <div className="absolute top-[12%] right-[35%] w-16 h-6 rounded-full bg-white/20 blur-sm" />
    <div className="absolute bottom-0 w-full h-48">
      <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="skyHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(140 30% 70%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(140 35% 60%)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d="M0,200 L0,120 Q150,80 300,100 Q450,120 600,90 Q750,60 900,80 Q1050,100 1200,70 L1200,200 Z" fill="url(#skyHillGradient)" />
      </svg>
    </div>
  </div>
));
SkyBackground.displayName = 'SkyBackground';

// Sunset Background
const SunsetBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(280 40% 45%) 0%, hsl(350 60% 55%) 30%, hsl(30 80% 65%) 60%, hsl(45 90% 75%) 100%)'
      }}
    />
    {/* Setting sun */}
    <div
      className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-32 h-32 rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(40 100% 70%) 0%, hsl(30 90% 60%) 40%, transparent 70%)'
      }}
    />
    {/* Sun reflection glow */}
    <div
      className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-48 h-24 rounded-full opacity-40"
      style={{
        background: 'radial-gradient(ellipse, hsl(35 100% 75%) 0%, transparent 70%)'
      }}
    />
    {/* Wispy clouds with sunset colors */}
    <div className="absolute top-[12%] left-[5%] w-28 h-8 rounded-full bg-orange-200/40 blur-sm" />
    <div className="absolute top-[8%] left-[25%] w-20 h-6 rounded-full bg-pink-200/30 blur-sm" />
    <div className="absolute top-[15%] right-[10%] w-32 h-10 rounded-full bg-purple-200/35 blur-sm" />
    <div className="absolute top-[10%] right-[30%] w-18 h-5 rounded-full bg-orange-100/25 blur-sm" />
    {/* Dark silhouette hills */}
    <div className="absolute bottom-0 w-full h-48">
      <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sunsetHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(280 30% 25%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(280 35% 15%)" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M0,200 L0,100 Q100,60 200,90 Q350,130 500,80 Q650,30 800,70 Q950,110 1100,60 L1200,80 L1200,200 Z" fill="url(#sunsetHillGradient)" />
      </svg>
    </div>
  </div>
));
SunsetBackground.displayName = 'SunsetBackground';

// Night Background
const NightBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(230 50% 12%) 0%, hsl(240 45% 18%) 40%, hsl(250 35% 25%) 100%)'
      }}
    />
    {/* Moon */}
    <div
      className="absolute top-[8%] right-[15%] w-16 h-16 rounded-full"
      style={{
        background: 'radial-gradient(circle at 30% 30%, hsl(45 20% 95%) 0%, hsl(45 15% 85%) 50%, hsl(45 10% 75%) 100%)',
        boxShadow: '0 0 40px hsl(45 30% 80% / 0.4), 0 0 80px hsl(45 30% 80% / 0.2)'
      }}
    />
    {/* Stars */}
    {[
      { top: '5%', left: '10%', size: 2 },
      { top: '12%', left: '25%', size: 1.5 },
      { top: '8%', left: '40%', size: 2.5 },
      { top: '15%', left: '55%', size: 1 },
      { top: '6%', left: '70%', size: 2 },
      { top: '18%', left: '85%', size: 1.5 },
      { top: '22%', left: '15%', size: 1 },
      { top: '25%', left: '35%', size: 2 },
      { top: '20%', left: '60%', size: 1.5 },
      { top: '28%', left: '75%', size: 1 },
      { top: '10%', left: '5%', size: 1 },
      { top: '30%', left: '90%', size: 2 },
    ].map((star, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          top: star.top,
          left: star.left,
          width: `${star.size}px`,
          height: `${star.size}px`,
          boxShadow: `0 0 ${star.size * 2}px hsl(0 0% 100% / 0.8)`,
          animation: `twinkle ${2 + i * 0.3}s ease-in-out infinite`
        }}
      />
    ))}
    {/* Dark hills with subtle glow */}
    <div className="absolute bottom-0 w-full h-48">
      <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="nightHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(240 30% 18%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(240 35% 10%)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M0,200 L0,130 Q150,90 300,110 Q450,130 600,100 Q750,70 900,90 Q1050,110 1200,80 L1200,200 Z" fill="url(#nightHillGradient)" />
      </svg>
    </div>
  </div>
));
NightBackground.displayName = 'NightBackground';

// Ocean Background
const OceanBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(195 70% 75%) 0%, hsl(200 60% 65%) 30%, hsl(205 55% 50%) 60%, hsl(210 50% 40%) 100%)'
      }}
    />
    {/* Sun reflection on water */}
    <div
      className="absolute top-[8%] right-[20%] w-24 h-24 rounded-full opacity-60"
      style={{
        background: 'radial-gradient(circle, hsl(45 100% 90%) 0%, transparent 70%)'
      }}
    />
    {/* Soft clouds */}
    <div className="absolute top-[10%] left-[5%] w-28 h-10 rounded-full bg-white/40 blur-sm" />
    <div className="absolute top-[5%] left-[30%] w-20 h-7 rounded-full bg-white/30 blur-sm" />
    <div className="absolute top-[12%] right-[25%] w-24 h-8 rounded-full bg-white/35 blur-sm" />
    {/* Ocean waves */}
    <div className="absolute bottom-0 w-full h-56">
      <svg viewBox="0 0 1200 250" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="oceanGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(200 65% 55%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(205 60% 45%)" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="oceanGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(205 55% 45%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(210 50% 35%)" stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Back wave */}
        <path d="M0,250 L0,80 Q100,60 200,80 Q300,100 400,70 Q500,40 600,70 Q700,100 800,60 Q900,20 1000,50 Q1100,80 1200,40 L1200,250 Z" fill="url(#oceanGradient1)" />
        {/* Front wave */}
        <path d="M0,250 L0,120 Q150,100 300,130 Q450,160 600,120 Q750,80 900,120 Q1050,160 1200,100 L1200,250 Z" fill="url(#oceanGradient2)" />
        {/* Wave foam highlights */}
        <path d="M0,125 Q150,105 300,135 Q450,165 600,125 Q750,85 900,125 Q1050,165 1200,105" fill="none" stroke="hsl(0 0% 100% / 0.3)" strokeWidth="3" />
      </svg>
    </div>
  </div>
));
OceanBackground.displayName = 'OceanBackground';

// Forest Background
const ForestBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(180 40% 75%) 0%, hsl(160 45% 70%) 40%, hsl(140 40% 60%) 100%)'
      }}
    />
    {/* Soft light rays */}
    <div
      className="absolute top-0 left-[30%] w-32 h-[60%] opacity-20"
      style={{
        background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, transparent 100%)',
        clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)'
      }}
    />
    <div
      className="absolute top-0 right-[25%] w-24 h-[50%] opacity-15"
      style={{
        background: 'linear-gradient(180deg, hsl(45 80% 90%) 0%, transparent 100%)',
        clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)'
      }}
    />
    {/* Misty layer */}
    <div className="absolute top-[40%] left-0 right-0 h-24 bg-white/10 blur-xl" />
    {/* Layered forest trees */}
    <div className="absolute bottom-0 w-full h-64">
      <svg viewBox="0 0 1200 280" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="forestBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(150 35% 45%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(150 40% 35%)" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="forestMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(145 40% 38%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(145 45% 28%)" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="forestFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(140 45% 30%)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="hsl(140 50% 20%)" stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Back trees */}
        <path d="M0,280 L0,140 L50,100 L100,140 L120,90 L180,140 L200,110 L260,150 L280,100 L340,150 L380,80 L440,140 L480,100 L540,150 L580,90 L640,140 L700,70 L760,130 L800,100 L860,150 L920,80 L980,140 L1020,100 L1080,150 L1140,90 L1200,140 L1200,280 Z" fill="url(#forestBack)" />
        {/* Mid trees */}
        <path d="M0,280 L0,160 L40,120 L80,160 L110,100 L160,160 L190,130 L240,170 L280,110 L340,170 L400,90 L460,160 L520,120 L580,170 L640,100 L700,160 L760,130 L820,180 L880,110 L940,170 L1000,120 L1060,180 L1120,100 L1200,160 L1200,280 Z" fill="url(#forestMid)" />
        {/* Front trees */}
        <path d="M0,280 L0,180 L30,140 L70,180 L100,120 L150,180 L180,150 L230,190 L270,130 L330,190 L390,110 L450,180 L510,140 L570,200 L630,120 L690,180 L750,150 L810,200 L870,130 L930,190 L990,140 L1050,200 L1110,120 L1170,180 L1200,160 L1200,280 Z" fill="url(#forestFront)" />
      </svg>
    </div>
  </div>
));
ForestBackground.displayName = 'ForestBackground';

// Snow Background
const SnowBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Sky Gradient - Winter sky */}
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(180deg, hsl(210 40% 75%) 0%, hsl(210 35% 85%) 40%, hsl(210 30% 92%) 100%)'
      }}
    />

    {/* Pale winter sun */}
    <div
      className="absolute top-[10%] right-[15%] w-24 h-24 rounded-full opacity-50"
      style={{
        background: 'radial-gradient(circle, hsl(45 30% 95%) 0%, hsl(45 20% 90%) 40%, transparent 70%)'
      }}
    />

    {/* Soft winter clouds */}
    <div className="absolute top-[8%] left-[5%] w-28 h-10 rounded-full bg-white/50 blur-sm" />
    <div className="absolute top-[12%] left-[30%] w-22 h-7 rounded-full bg-white/40 blur-sm" />
    <div className="absolute top-[6%] right-[20%] w-32 h-10 rounded-full bg-white/45 blur-sm" />
    <div className="absolute top-[15%] right-[8%] w-18 h-6 rounded-full bg-white/35 blur-sm" />

    {/* Animated snowflakes */}
    {[
      { top: '3%', left: '5%', size: 3, delay: 0 },
      { top: '8%', left: '18%', size: 2.5, delay: 1.2 },
      { top: '2%', left: '32%', size: 4, delay: 0.6 },
      { top: '6%', left: '48%', size: 2, delay: 2.0 },
      { top: '10%', left: '62%', size: 3.5, delay: 0.3 },
      { top: '4%', left: '78%', size: 2.5, delay: 1.5 },
      { top: '12%', left: '10%', size: 3, delay: 2.3 },
      { top: '15%', left: '40%', size: 2, delay: 0.9 },
      { top: '18%', left: '70%', size: 3, delay: 1.8 },
      { top: '20%', left: '88%', size: 2.5, delay: 2.6 },
      { top: '22%', left: '3%', size: 2, delay: 0.4 },
      { top: '25%', left: '25%', size: 3.5, delay: 1.7 },
      { top: '28%', left: '55%', size: 2.5, delay: 2.1 },
      { top: '30%', left: '82%', size: 3, delay: 0.8 },
    ].map((flake, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          top: flake.top,
          left: flake.left,
          width: `${flake.size}px`,
          height: `${flake.size}px`,
          boxShadow: `0 0 ${flake.size * 2}px hsl(0 0% 100% / 0.8)`,
          animation: `snowfall ${4 + i * 0.3}s linear infinite`,
          animationDelay: `${flake.delay}s`
        }}
      />
    ))}

    {/* Snowy mountains */}
    <div className="absolute bottom-0 w-full h-56">
      <svg viewBox="0 0 1200 240" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="focusSnowMountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(210 20% 95%)" />
            <stop offset="40%" stopColor="hsl(210 25% 85%)" />
            <stop offset="100%" stopColor="hsl(210 30% 75%)" />
          </linearGradient>
          <linearGradient id="focusSnowCapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(0 0% 100%)" />
            <stop offset="100%" stopColor="hsl(210 15% 95%)" />
          </linearGradient>
          <linearGradient id="focusSnowHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(210 20% 98%)" />
            <stop offset="100%" stopColor="hsl(210 25% 90%)" />
          </linearGradient>
          <linearGradient id="focusSnowTreeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(150 30% 35%)" />
            <stop offset="100%" stopColor="hsl(150 35% 25%)" />
          </linearGradient>
        </defs>

        {/* Mountain base */}
        <path d="M0,240 L0,160 L100,100 L200,140 L350,60 L500,110 L650,40 L800,90 L950,70 L1100,115 L1200,80 L1200,240 Z" fill="url(#focusSnowMountainGradient)" />
        {/* Snow caps */}
        <path d="M100,100 L75,120 L125,120 Z" fill="url(#focusSnowCapGradient)" />
        <path d="M350,60 L315,85 L385,85 Z" fill="url(#focusSnowCapGradient)" />
        <path d="M650,40 L605,70 L695,70 Z" fill="url(#focusSnowCapGradient)" />
        <path d="M950,70 L915,95 L985,95 Z" fill="url(#focusSnowCapGradient)" />

        {/* Snowy hills foreground */}
        <path d="M0,240 L0,180 Q150,150 300,170 Q450,190 600,160 Q750,130 900,155 Q1050,180 1200,150 L1200,240 Z" fill="url(#focusSnowHillGradient)" />

        {/* Snow-covered pine trees */}
        <path d="M80,240 L80,210 L60,210 L90,170 L70,170 L90,140 L110,170 L90,170 L120,210 L100,210 L100,240 Z" fill="url(#focusSnowTreeGradient)" />
        <path d="M90,140 L85,148 L95,148 Z" fill="white" />

        <path d="M280,240 L280,215 L265,215 L290,180 L275,180 L290,155 L305,180 L290,180 L315,215 L300,215 L300,240 Z" fill="url(#focusSnowTreeGradient)" />
        <path d="M290,155 L285,163 L295,163 Z" fill="white" />

        <path d="M520,240 L520,205 L500,205 L530,160 L510,160 L530,125 L550,160 L530,160 L560,205 L540,205 L540,240 Z" fill="url(#focusSnowTreeGradient)" />
        <path d="M530,125 L524,135 L536,135 Z" fill="white" />
        <path d="M510,160 L520,168 L530,160 L540,168 L550,160 L530,160 Z" fill="hsl(210 20% 95%)" />

        <path d="M780,240 L780,218 L768,218 L790,185 L778,185 L790,162 L802,185 L790,185 L812,218 L800,218 L800,240 Z" fill="url(#focusSnowTreeGradient)" />
        <path d="M790,162 L785,170 L795,170 Z" fill="white" />

        <path d="M1050,240 L1050,208 L1032,208 L1060,165 L1042,165 L1060,130 L1078,165 L1060,165 L1088,208 L1070,208 L1070,240 Z" fill="url(#focusSnowTreeGradient)" />
        <path d="M1060,130 L1054,140 L1066,140 Z" fill="white" />
        <path d="M1042,165 L1052,174 L1060,165 L1068,174 L1078,165 L1060,165 Z" fill="hsl(210 20% 95%)" />
      </svg>
    </div>
  </div>
));
SnowBackground.displayName = 'SnowBackground';