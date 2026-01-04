import { Clock, Brain, Coffee, Sun, Sunset, Moon, TreePine, Snowflake, LucideIcon } from "lucide-react";
import { FocusCategory, SessionType } from "@/types/analytics";

// Re-export SessionType for consumers that import from constants
export type { SessionType };

export const STORAGE_KEY = 'petIsland_unifiedTimer';
export const BACKGROUND_THEME_KEY = 'petIsland_focusBackground';

export interface BackgroundTheme {
  id: string;
  name: string;
  icon: LucideIcon;
  unlockLevel: number;
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: 'sky', name: 'Day', icon: Sun, unlockLevel: 1 },
  { id: 'sunset', name: 'Sunset', icon: Sunset, unlockLevel: 3 },
  { id: 'night', name: 'Night', icon: Moon, unlockLevel: 5 },
  { id: 'forest', name: 'Forest', icon: TreePine, unlockLevel: 8 },
  { id: 'snow', name: 'Snow', icon: Snowflake, unlockLevel: 12 },
];

export interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  sessionDuration: number;
  startTime: number | null;
  sessionType: SessionType;
  completedSessions: number;
  soundEnabled: boolean;
  // Task/intention tracking
  category?: FocusCategory;
  taskLabel?: string;
}

export interface TimerPreset {
  id: string;
  name: string;
  duration: number;
  type: SessionType;
  icon: LucideIcon;
  color: string;
  description: string;
}

export const TIMER_PRESETS: TimerPreset[] = [
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

export const DEFAULT_TIMER_STATE: TimerState = {
  timeLeft: 25 * 60,
  isRunning: false,
  sessionDuration: 25 * 60,
  startTime: null,
  sessionType: 'pomodoro',
  completedSessions: 0,
  soundEnabled: true,
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
