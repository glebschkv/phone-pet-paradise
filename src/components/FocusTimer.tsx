import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Square, Clock, SkipForward } from 'lucide-react';
import { useAppStateTracking } from '@/hooks/useAppStateTracking';

const TIMER_STORAGE_KEY = 'petIsland_focusTimer';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  sessionDuration: number;
  startTime?: number;
}

export const FocusTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(25);
  const [startTime, setStartTime] = useState<number | null>(null);
  const { awardXP } = useAppStateTracking();

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(TIMER_STORAGE_KEY);
    if (savedState) {
      try {
        const parsed: TimerState = JSON.parse(savedState);
        
        // If timer was running, calculate elapsed time
        if (parsed.isRunning && parsed.startTime) {
          const now = Date.now();
          const elapsed = Math.floor((now - parsed.startTime) / 1000);
          const newTimeLeft = Math.max(0, parsed.timeLeft - elapsed);
          
          setTimeLeft(newTimeLeft);
          setIsRunning(newTimeLeft > 0);
          setStartTime(newTimeLeft > 0 ? now - elapsed * 1000 : null);
        } else {
          setTimeLeft(parsed.timeLeft);
          setIsRunning(false);
          setStartTime(null);
        }
        
        setSessionDuration(parsed.sessionDuration);
      } catch (error) {
        console.error('Failed to parse saved timer state:', error);
      }
    }
  }, []);

  // Save timer state to localStorage
  const saveTimerState = useCallback((state: Partial<TimerState>) => {
    const currentState: TimerState = {
      timeLeft,
      isRunning,
      sessionDuration,
      startTime: startTime || undefined,
      ...state
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(currentState));
  }, [timeLeft, isRunning, sessionDuration, startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = useCallback(() => {
    const completedMinutes = sessionDuration;
    // Manually award XP for completed session
    if (completedMinutes >= 30) {
      // Calculate XP based on duration and show reward
      const sessionMinutes = completedMinutes;
      const reward = awardXP(sessionMinutes);
      console.log('Session completed:', { minutes: sessionMinutes, reward });
    }
    
    const newState = {
      isRunning: false,
      timeLeft: sessionDuration * 60,
      startTime: undefined
    };
    
    setIsRunning(false);
    setTimeLeft(sessionDuration * 60);
    setStartTime(null);
    saveTimerState(newState);
  }, [sessionDuration, awardXP, saveTimerState]);

  // Auto-save timer state when it changes
  useEffect(() => {
    if (isRunning) {
      const currentState = {
        timeLeft,
        isRunning,
        sessionDuration,
        startTime: startTime || Date.now()
      };
      saveTimerState(currentState);
    }
  }, [timeLeft, isRunning, sessionDuration, startTime, saveTimerState]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTimeLeft = prev - 1;
          if (newTimeLeft <= 0) {
            handleComplete();
            return 0;
          }
          return newTimeLeft;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, handleComplete]);

  const startTimer = () => {
    const now = Date.now();
    setIsRunning(true);
    setStartTime(now);
    saveTimerState({
      isRunning: true,
      startTime: now,
      timeLeft,
      sessionDuration
    });
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setStartTime(null);
    saveTimerState({
      isRunning: false,
      startTime: undefined,
      timeLeft,
      sessionDuration
    });
  };

  const stopTimer = () => {
    const newState = {
      isRunning: false,
      timeLeft: sessionDuration * 60,
      startTime: undefined
    };
    
    setIsRunning(false);
    setTimeLeft(sessionDuration * 60);
    setStartTime(null);
    saveTimerState(newState);
  };

  const skipTimer = () => {
    // Award XP for the full session duration as if completed
    const reward = awardXP(sessionDuration);
    console.log('Timer skipped - XP awarded:', { 
      minutes: sessionDuration, 
      reward,
      modalShouldShow: !!reward
    });
    
    // Reset timer
    const newState = {
      isRunning: false,
      timeLeft: sessionDuration * 60,
      startTime: undefined
    };
    
    setIsRunning(false);
    setTimeLeft(sessionDuration * 60);
    setStartTime(null);
    saveTimerState(newState);
  };

  const setDuration = (minutes: number) => {
    if (!isRunning) {
      setSessionDuration(minutes);
      setTimeLeft(minutes * 60);
      saveTimerState({
        sessionDuration: minutes,
        timeLeft: minutes * 60,
        isRunning: false,
        startTime: undefined
      });
    }
  };

  const progress = ((sessionDuration * 60 - timeLeft) / (sessionDuration * 60)) * 100;

  return (
    <Card className="w-full max-w-sm mx-auto bg-gradient-glass backdrop-blur-xl border border-primary/10 shadow-floating">
      <CardContent className="p-8 space-y-8">
        {/* Elegant Timer Display */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-accent/20 flex items-center justify-center mb-4">
            <Clock className="w-10 h-10 text-accent" />
          </div>
          <div className="text-5xl font-bold font-mono tracking-wide text-foreground">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {sessionDuration} minute focus session
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted/30 rounded-full h-1.5 mt-4">
            <div 
              className="bg-accent h-1.5 rounded-full transition-all duration-1000 shadow-glow"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Refined Timer Controls */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={isRunning ? pauseTimer : startTimer}
            variant="default"
            size="lg"
            className="px-8"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>
          
          <Button onClick={stopTimer} variant="outline" size="lg">
            <Square className="w-5 h-5" />
          </Button>
          
          <Button onClick={skipTimer} variant="floating" size="lg">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Duration Selection Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[25, 45, 60].map((minutes) => (
            <Button
              key={minutes}
              onClick={() => setDuration(minutes)}
              variant={sessionDuration === minutes ? "default" : "floating"}
              size="sm"
              disabled={isRunning}
              className="h-12 text-sm font-semibold"
            >
              {minutes}m
            </Button>
          ))}
        </div>

        {/* Helpful Instructions */}
        <div className="text-center space-y-2 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Complete 30+ minute sessions to earn XP and unlock animals!
          </div>
          <div className="text-xs text-accent font-medium">
            Use Skip button to test XP rewards
          </div>
        </div>
      </CardContent>
    </Card>
  );
};