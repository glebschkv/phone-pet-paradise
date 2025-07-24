import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
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
  Settings as SettingsIcon,
  Volume2,
  VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  sessionDuration: number;
  startTime: number | null;
  sessionType: 'pomodoro' | 'deep-work' | 'break';
  completedSessions: number;
  soundEnabled: boolean;
}

interface TimerPreset {
  id: string;
  name: string;
  duration: number;
  type: 'pomodoro' | 'deep-work' | 'break';
  icon: any;
  color: string;
}

const TIMER_PRESETS: TimerPreset[] = [
  { id: 'pomodoro', name: 'Pomodoro', duration: 25, type: 'pomodoro', icon: Clock, color: 'text-primary' },
  { id: 'deep-work', name: 'Deep Work', duration: 90, type: 'deep-work', icon: Brain, color: 'text-success' },
  { id: 'short-break', name: 'Short Break', duration: 5, type: 'break', icon: Coffee, color: 'text-accent' },
  { id: 'long-break', name: 'Long Break', duration: 15, type: 'break', icon: Coffee, color: 'text-accent' },
];

export const EnhancedFocusTimer = ({ onComplete }: { onComplete?: (minutes: number) => void }) => {
  const { toast } = useToast();
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

  // Save timer state to localStorage
  const saveTimerState = useCallback((state: TimerState) => {
    localStorage.setItem('focusTimerState', JSON.stringify({
      ...state,
      isRunning: false, // Don't persist running state
    }));
  }, []);

  // Load timer state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('focusTimerState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setTimerState(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load timer state:', error);
      }
    }
  }, []);

  // Save state when it changes
  useEffect(() => {
    saveTimerState(timerState);
  }, [timerState, saveTimerState]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isRunning && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1,
        }));
      }, 1000);
    } else if (timerState.timeLeft === 0 && timerState.isRunning) {
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.timeLeft]);

  const handleComplete = useCallback(() => {
    const completedMinutes = timerState.sessionDuration / 60;
    
    // Play completion sound
    if (timerState.soundEnabled) {
      playCompletionSound();
    }

    // Show completion notification
    toast({
      title: `${selectedPreset.name} Complete!`,
      description: `You completed a ${completedMinutes}-minute ${timerState.sessionType} session.`,
    });

    // Update completed sessions
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      completedSessions: prev.completedSessions + 1,
    }));

    // Trigger XP reward
    onComplete?.(completedMinutes);

    // Suggest break after work sessions
    if (timerState.sessionType !== 'break') {
      suggestBreak();
    }
  }, [timerState, selectedPreset, toast, onComplete]);

  const playCompletionSound = () => {
    // Create a simple beep sound using Web Audio API
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
    setSelectedPreset(preset);
    setTimerState(prev => ({
      ...prev,
      timeLeft: preset.duration * 60,
      sessionDuration: preset.duration * 60,
      sessionType: preset.type,
      isRunning: false,
      startTime: null,
    }));
  };

  const startTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now(),
    }));
  };

  const pauseTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
    }));
  };

  const stopTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      timeLeft: prev.sessionDuration,
      startTime: null,
    }));
  };

  const skipTimer = () => {
    const completedMinutes = Math.ceil((timerState.sessionDuration - timerState.timeLeft) / 60);
    if (completedMinutes >= 1) {
      onComplete?.(completedMinutes);
    }
    stopTimer();
  };

  const toggleSound = () => {
    setTimerState(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = ((timerState.sessionDuration - timerState.timeLeft) / timerState.sessionDuration) * 100;

  return (
    <Card className="p-6 bg-card/95 backdrop-blur-sm border-border/50 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <selectedPreset.icon className={cn("w-5 h-5", selectedPreset.color)} />
          <h2 className="text-lg font-semibold">{selectedPreset.name}</h2>
          <Badge variant="secondary" className="text-xs">
            Session {timerState.completedSessions + 1}
          </Badge>
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
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-6xl font-bold font-sf-pro mb-2 text-foreground">
          {formatTime(timerState.timeLeft)}
        </div>
        <Progress 
          value={progress} 
          className="h-2 mb-4" 
        />
        <p className="text-sm text-muted-foreground">
          {timerState.isRunning ? 'Focus time' : 'Ready to focus'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mb-6">
        {!timerState.isRunning ? (
          <Button
            onClick={startTimer}
            size="lg"
            className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Play className="w-6 h-6" />
          </Button>
        ) : (
          <Button
            onClick={pauseTimer}
            size="lg"
            variant="secondary"
            className="w-16 h-16 rounded-full"
          >
            <Pause className="w-6 h-6" />
          </Button>
        )}
        
        <Button
          onClick={stopTimer}
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full"
        >
          <Square className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={skipTimer}
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full"
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>

      {/* Preset Selection */}
      <div className="grid grid-cols-2 gap-2">
        {TIMER_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPreset.id === preset.id;
          
          return (
            <Button
              key={preset.id}
              variant={isSelected ? "default" : "outline"}
              onClick={() => setPreset(preset)}
              className="h-12 justify-start gap-2"
            >
              <Icon className={cn("w-4 h-4", preset.color)} />
              <div className="text-left">
                <div className="text-sm font-medium">{preset.name}</div>
                <div className="text-xs opacity-70">{preset.duration}m</div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sessions completed today:</span>
          <span className="font-medium">{timerState.completedSessions}</span>
        </div>
      </div>
    </Card>
  );
};