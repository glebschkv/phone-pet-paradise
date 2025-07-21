import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Play, Pause, Square, Zap } from "lucide-react";
import { useAppStateTracking } from "@/hooks/useAppStateTracking";

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_DURATIONS = [
  { label: "30 min", minutes: 30, xp: 10 },
  { label: "1 hour", minutes: 60, xp: 25 },
  { label: "2 hours", minutes: 120, xp: 60 },
  { label: "3 hours", minutes: 180, xp: 100 },
  { label: "4 hours", minutes: 240, xp: 150 },
  { label: "5 hours", minutes: 300, xp: 210 },
];

export const FocusTimer = ({ isOpen, onClose }: FocusTimerProps) => {
  const appStateTracking = useAppStateTracking();
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // in seconds
  const [isSimulating, setIsSimulating] = useState(false);

  // Handle session completion
  const handleSessionComplete = useCallback((minutes: number) => {
    try {
      // Get current state safely
      const currentStateStr = localStorage.getItem('petIsland_appState');
      const currentState = currentStateStr ? JSON.parse(currentStateStr) : {};
      const now = Date.now();
      const timeAway = minutes * 60 * 1000; // Convert to milliseconds
      
      // Update the last active time to simulate time away
      const updatedState = {
        ...currentState,
        lastActiveTime: now - timeAway,
      };
      
      localStorage.setItem('petIsland_appState', JSON.stringify(updatedState));
      
      // Use a more reliable way to trigger the app state update
      // Force a page visibility change simulation
      document.dispatchEvent(new Event('visibilitychange'));
      
      onClose();
    } catch (error) {
      console.error('Error completing session:', error);
      onClose();
    }
  }, [onClose]);

  // Reset timer when duration changes or dialog closes
  useEffect(() => {
    if (!isRunning || !isOpen) {
      setTimeLeft(selectedDuration * 60);
      setIsRunning(false);
    }
  }, [selectedDuration, isOpen]);

  // Timer countdown - fixed to prevent crashes
  useEffect(() => {
    if (!isRunning || timeLeft <= 0 || !isOpen) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timer completed - handle outside of state update
          setIsRunning(false);
          setTimeout(() => {
            handleSessionComplete(selectedDuration);
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning, isOpen, handleSessionComplete, selectedDuration]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
  };

  const simulateSession = useCallback((minutes: number) => {
    if (isSimulating) return; // Prevent double-clicks
    
    setIsSimulating(true);
    // Use shorter timeout and better error handling
    setTimeout(() => {
      try {
        handleSessionComplete(minutes);
      } catch (error) {
        console.error('Error in simulate session:', error);
      } finally {
        setIsSimulating(false);
      }
    }, 500);
  }, [handleSessionComplete, isSimulating]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Focus Timer
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Timer Display */}
          <div className="text-center space-y-4">
            <div className="text-4xl font-mono font-bold">
              {formatTime(timeLeft)}
            </div>
            
            {isRunning && (
              <Progress value={progress} className="h-2" />
            )}
            
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {appStateTracking.calculateXPFromDuration(selectedDuration)} XP when complete
              </span>
            </div>
          </div>

          {/* Duration Presets */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Quick Select</h4>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_DURATIONS.map((preset) => (
                <Button
                  key={preset.minutes}
                  variant={selectedDuration === preset.minutes ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (!isRunning) {
                      setSelectedDuration(preset.minutes);
                    }
                  }}
                  disabled={isRunning}
                  className="flex flex-col h-auto py-2"
                >
                  <span className="text-xs">{preset.label}</span>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {preset.xp} XP
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={startTimer} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Start Focus
              </Button>
            ) : (
              <>
                <Button onClick={pauseTimer} variant="outline" className="flex-1">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button onClick={stopTimer} variant="outline">
                  <Square className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Quick Test Buttons */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Quick Test (Instant)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_DURATIONS.slice(0, 3).map((preset) => (
                <Button
                  key={`test-${preset.minutes}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => simulateSession(preset.minutes)}
                  disabled={isSimulating}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_DURATIONS.slice(3).map((preset) => (
                <Button
                  key={`test-${preset.minutes}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => simulateSession(preset.minutes)}
                  disabled={isSimulating}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Instantly complete session for testing
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};