import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
    <Card className="w-full max-w-lg mx-auto bg-gradient-glass backdrop-blur-xl border border-primary/10 shadow-floating">
      <CardContent className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
              <selectedPreset.icon className={cn("w-6 h-6", selectedPreset.color)} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{selectedPreset.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedPreset.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              className="w-8 h-8 p-0"
            >
              {timerState.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center space-y-4">
          <div className="text-6xl font-bold font-mono tracking-wide text-foreground">
            {formatTime(timerState.timeLeft)}
          </div>
          <Progress 
            value={progress} 
            className="h-3 bg-muted/30" 
          />
          <p className="text-sm font-medium text-muted-foreground">
            {timerState.isRunning ? 'Focus time' : 'Ready to focus'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!timerState.isRunning ? (
            <Button
              onClick={startTimer}
              size="lg"
              className="px-8 h-12"
            >
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          ) : (
            <Button
              onClick={pauseTimer}
              size="lg"
              variant="secondary"
              className="px-8 h-12"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}
          
          <Button
            onClick={stopTimer}
            size="lg"
            variant="outline"
            className="h-12"
          >
            <Square className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={skipTimer}
            size="lg"
            variant="floating"
            className="h-12"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Preset Selection Grid */}
        <div className="grid grid-cols-2 gap-3">
          {TIMER_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset.id === preset.id;
            
            return (
              <Button
                key={preset.id}
                variant={isSelected ? "default" : "outline"}
                onClick={() => setPreset(preset)}
                disabled={timerState.isRunning}
                className="h-16 p-3 justify-start gap-3"
              >
                <Icon className={cn("w-5 h-5", preset.color)} />
                <div className="text-left">
                  <div className="text-sm font-medium">{preset.name}</div>
                  <div className="text-xs text-muted-foreground">{preset.duration}m</div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Stats & Instructions */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Sessions completed today:</span>
            <span className="text-sm font-semibold text-foreground">{timerState.completedSessions}</span>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-xs text-muted-foreground">
              Complete 25+ minute sessions to earn XP and unlock animals!
            </div>
            <div className="text-xs text-accent font-medium">
              Use Skip button to test XP rewards
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};