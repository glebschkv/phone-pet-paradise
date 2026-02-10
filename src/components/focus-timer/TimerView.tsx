/**
 * TimerView Component
 *
 * Displays the main timer interface including:
 * - Timer display with countdown (hero section, top)
 * - Timer controls (start/pause/stop)
 * - Preset grid for selecting session types (below timer)
 * - Background theme switcher
 *
 * Layout optimized for mobile-first single-screen experience:
 * - Timer circle + controls are always the hero, front and center
 * - Presets below for quick mode switching
 * - Background switcher at the bottom
 *
 * Focus Shield has been moved to Settings > Timer & Focus for cleaner UX.
 *
 * Note: ViewToggle and AmbientSoundPicker are rendered by the parent
 * UnifiedFocusTimer to keep them in a fixed position across view switches.
 */

import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { TimerPresetGrid } from "./TimerPresetGrid";
import { BackgroundThemeSwitcher } from "./BackgroundThemeSwitcher";
import { TimerPetSprite } from "./TimerPetSprite";
import { TimerState, TimerPreset } from "./constants";

interface TimerViewProps {
  // Timer state
  timerState: TimerState;
  displayTime: number;
  elapsedTime: number;
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
  isPremium: boolean;
  onThemeChange: (themeId: string) => void;
  onLockedBackgroundClick: () => void;
}

export const TimerView = ({
  timerState,
  displayTime,
  elapsedTime,
  selectedPreset,
  onStart,
  onPause,
  onStop,
  onSkip,
  onToggleSound,
  onSelectPreset,
  backgroundTheme,
  isPremium,
  onThemeChange,
  onLockedBackgroundClick,
}: TimerViewProps) => {
  return (
    <div className="relative z-10 flex flex-col items-center justify-start px-4 pb-32">
      {/* Pet sprite + Timer display — the hero section, always at top */}
      <TimerPetSprite isRunning={timerState.isRunning} />

      <TimerDisplay
        preset={selectedPreset}
        timeLeft={displayTime}
        sessionDuration={timerState.sessionDuration}
        isRunning={timerState.isRunning}
        soundEnabled={timerState.soundEnabled}
        onToggleSound={onToggleSound}
        isCountup={timerState.isCountup}
        elapsedTime={elapsedTime}
      />

      <TimerControls
        isRunning={timerState.isRunning}
        onStart={onStart}
        onPause={onPause}
        onStop={onStop}
        onSkip={onSkip}
      />

      {/* Preset grid BELOW timer — secondary selection */}
      <div className="mt-5 w-full flex justify-center">
        <TimerPresetGrid
          selectedPreset={selectedPreset}
          isRunning={timerState.isRunning}
          onSelectPreset={onSelectPreset}
        />
      </div>

      {/* Background theme switcher */}
      <div className="mt-4 w-full flex justify-center">
        <BackgroundThemeSwitcher
          currentTheme={backgroundTheme}
          isPremium={isPremium}
          onThemeChange={onThemeChange}
          onLockedClick={onLockedBackgroundClick}
        />
      </div>
    </div>
  );
};
