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
  VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { cn } from "@/lib/utils";

const STORAGE_KEY = 'petIsland_unifiedTimer';
const TIMER_PERSISTENCE_KEY = 'petIsland_timerPersistence';

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
  const { awardXP } = useBackendAppState();
  
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
      {/* Retro Sky Background */}
      <FocusBackground />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-20 pb-32">
        {/* Session Badge */}
        <div className="retro-stat-pill px-4 py-2 mb-6">
          <span className="text-sm font-semibold text-foreground">
            Session {timerState.completedSessions + 1}
          </span>
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

// Retro Background Component for Focus Page
const FocusBackground = memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky Gradient - Same as home but slightly softer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(200 65% 82%) 0%, hsl(200 45% 90%) 50%, hsl(40 50% 92%) 100%)'
        }}
      />

      {/* Subtle sun glow */}
      <div
        className="absolute top-[10%] right-[12%] w-28 h-28 rounded-full opacity-50"
        style={{
          background: 'radial-gradient(circle, hsl(45 100% 88%) 0%, transparent 70%)'
        }}
      />

      {/* Soft floating clouds */}
      <div className="absolute top-[15%] left-[8%] w-24 h-10 rounded-full bg-white/35 blur-sm" />
      <div className="absolute top-[10%] left-[30%] w-18 h-7 rounded-full bg-white/25 blur-sm" />
      <div className="absolute top-[20%] right-[15%] w-28 h-10 rounded-full bg-white/30 blur-sm" />
      <div className="absolute top-[12%] right-[35%] w-16 h-6 rounded-full bg-white/20 blur-sm" />

      {/* Very subtle distant hills - lower opacity for focus */}
      <div className="absolute bottom-0 w-full h-48">
        <svg
          viewBox="0 0 1200 200"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="focusHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(140 30% 70%)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(140 35% 60%)" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path
            d="M0,200 L0,120 Q150,80 300,100 Q450,120 600,90 Q750,60 900,80 Q1050,100 1200,70 L1200,200 Z"
            fill="url(#focusHillGradient)"
          />
        </svg>
      </div>
    </div>
  );
});

FocusBackground.displayName = 'FocusBackground';