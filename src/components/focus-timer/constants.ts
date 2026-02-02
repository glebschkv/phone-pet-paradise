import { Clock, Brain, Coffee, Sun, Sunset, Moon, TreePine, Snowflake, Timer, Building2, LucideIcon } from "lucide-react";
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
  { id: 'night', name: 'Night', icon: Moon, unlockLevel: 1 },
  { id: 'snow', name: 'Snow', icon: Snowflake, unlockLevel: 3 },
  { id: 'sky', name: 'Meadow', icon: Sun, unlockLevel: 5 },
  { id: 'sunset', name: 'Sunset', icon: Sunset, unlockLevel: 8 },
  { id: 'forest', name: 'Forest', icon: TreePine, unlockLevel: 12 },
  { id: 'city', name: 'City', icon: Building2, unlockLevel: 15 },
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
  // Countup timer mode (counts up instead of down, max 6 hours)
  isCountup?: boolean;
  elapsedTime?: number; // For countup mode: tracks elapsed seconds
}

// Maximum countup duration: 6 hours in seconds
export const MAX_COUNTUP_DURATION = 6 * 60 * 60; // 21600 seconds

export interface TimerPreset {
  id: string;
  name: string;
  duration: number;
  type: SessionType;
  icon: LucideIcon;
  color: string;
  description: string;
  isCountup?: boolean; // For countup mode preset
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
  {
    id: 'countup',
    name: 'Count Up',
    duration: 360, // Max 6 hours (display only, actual max enforced in code)
    type: 'countup',
    icon: Timer,
    color: 'text-info',
    description: 'Open-ended focus (max 6 hours)',
    isCountup: true
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
  isCountup: false,
  elapsedTime: 0,
};

// Re-export formatTime from shared utils for backwards compatibility
export { formatTime } from '@/lib/utils';
