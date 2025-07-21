import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Square, Clock, SkipForward } from 'lucide-react';
import { useAppStateTracking } from '@/hooks/useAppStateTracking';

export const FocusTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(25);
  const { awardXP } = useAppStateTracking();

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
    
    setIsRunning(false);
    setTimeLeft(sessionDuration * 60);
  }, [sessionDuration, awardXP]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
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
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setTimeLeft(sessionDuration * 60);
  };

  const skipTimer = () => {
    // Award XP for the full session duration as if completed
    const reward = awardXP(sessionDuration);
    console.log('Timer skipped - XP awarded:', { minutes: sessionDuration, reward });
    
    // Reset timer
    setIsRunning(false);
    setTimeLeft(sessionDuration * 60);
  };

  const setDuration = (minutes: number) => {
    if (!isRunning) {
      setSessionDuration(minutes);
      setTimeLeft(minutes * 60);
    }
  };

  const progress = ((sessionDuration * 60 - timeLeft) / (sessionDuration * 60)) * 100;

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="text-center space-y-2">
          <Clock className="w-8 h-8 mx-auto text-primary" />
          <h3 className="text-lg font-semibold">Focus Timer</h3>
        </div>

        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-primary">
            {formatTime(timeLeft)}
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-3">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <Button onClick={startTimer} size="sm">
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button onClick={pauseTimer} variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={stopTimer} variant="outline" size="sm">
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
          <Button onClick={skipTimer} variant="secondary" size="sm">
            <SkipForward className="w-4 h-4 mr-2" />
            Skip
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant={sessionDuration === 25 ? "default" : "outline"} 
            size="sm" 
            onClick={() => setDuration(25)}
            disabled={isRunning}
          >
            25m
          </Button>
          <Button 
            variant={sessionDuration === 45 ? "default" : "outline"} 
            size="sm" 
            onClick={() => setDuration(45)}
            disabled={isRunning}
          >
            45m
          </Button>
          <Button 
            variant={sessionDuration === 60 ? "default" : "outline"} 
            size="sm" 
            onClick={() => setDuration(60)}
            disabled={isRunning}
          >
            60m
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <div>Complete 30+ minute sessions to earn XP and unlock animals!</div>
          <div className="text-secondary font-medium">Use Skip button to test XP rewards</div>
        </div>
      </CardContent>
    </Card>
  );
};