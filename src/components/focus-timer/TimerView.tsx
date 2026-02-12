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

import { Settings } from "lucide-react";
import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { TimerPresetGrid } from "./TimerPresetGrid";
import { BackgroundThemeSwitcher } from "./BackgroundThemeSwitcher";
import { TimerPetSprite } from "./TimerPetSprite";
import { FocusShieldNudge } from "./FocusShieldNudge";
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

      {/* Focus Shield setup nudge — one-time, hidden while running */}
      {!timerState.isRunning && (
        <div className="mt-4 w-full flex flex-col items-center gap-2">
          <FocusShieldNudge />
          <p
            className="flex items-center gap-1.5 text-[11px] font-medium"
            style={{ color: 'rgba(200,210,240,0.4)' }}
          >
            <Settings className="w-3 h-3" />
            Select blocked apps in Settings
          </p>
        </div>
      )}

      {/* Preset grid BELOW timer — secondary selection */}
      <div className="mt-4 w-full flex justify-center">
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
