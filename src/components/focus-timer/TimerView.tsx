/**
 * TimerView Component
 *
 * Displays the main timer interface including:
 * - Timer display with countdown
 * - Timer controls (start/pause/stop)
 * - Preset grid for selecting session types
 * - App blocking section
 * - Timer stats
 * - Background theme switcher
 */

import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { TimerPresetGrid } from "./TimerPresetGrid";
import { TimerStats } from "./TimerStats";
import { AppBlockingSection } from "./AppBlockingSection";
import { BackgroundThemeSwitcher } from "./BackgroundThemeSwitcher";
import { ViewToggle } from "./ViewToggle";
import { AmbientSoundPicker } from "./AmbientSoundPicker";
import { TimerState, TimerPreset } from "./constants";

type TimerViewType = 'timer' | 'stats';

interface TimerViewProps {
  // View state
  currentView: TimerViewType;
  onViewChange: (view: TimerViewType) => void;

  // Timer state
  timerState: TimerState;
  displayTime: number;
  selectedPreset: TimerPreset;

  // Timer actions
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkip: () => void;
  onToggleSound: () => void;
  onSelectPreset: (preset: TimerPreset) => void;

  // Background theme
  backgroundTheme: string;
  currentLevel: number;
  onThemeChange: (themeId: string) => void;
}

export const TimerView = ({
  currentView,
  onViewChange,
  timerState,
  displayTime,
  selectedPreset,
  onStart,
  onPause,
  onStop,
  onSkip,
  onToggleSound,
  onSelectPreset,
  backgroundTheme,
  currentLevel,
  onThemeChange,
}: TimerViewProps) => {
  return (
    <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-4 pb-32">
      {/* View Toggle & Ambient Sound */}
      <div className="mb-4 flex items-center gap-3">
        <ViewToggle currentView={currentView} onViewChange={onViewChange} />
        <AmbientSoundPicker />
      </div>

      <TimerDisplay
        preset={selectedPreset}
        timeLeft={displayTime}
        sessionDuration={selectedPreset.duration * 60}
        isRunning={timerState.isRunning}
        soundEnabled={timerState.soundEnabled}
        onToggleSound={onToggleSound}
      />

      <TimerControls
        isRunning={timerState.isRunning}
        onStart={onStart}
        onPause={onPause}
        onStop={onStop}
        onSkip={onSkip}
      />

      {/* App Blocking Section */}
      <AppBlockingSection isTimerRunning={timerState.isRunning} />

      <div className="mt-6">
        <TimerPresetGrid
          selectedPreset={selectedPreset}
          isRunning={timerState.isRunning}
          onSelectPreset={onSelectPreset}
        />
      </div>

      <TimerStats />

      <BackgroundThemeSwitcher
        currentTheme={backgroundTheme}
        currentLevel={currentLevel}
        onThemeChange={onThemeChange}
      />
    </div>
  );
};
