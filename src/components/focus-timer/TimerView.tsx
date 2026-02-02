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
 *
 * Layout optimized for mobile-first single-screen experience:
 * - Above fold: Presets + Timer + Controls + Background switcher
 * - Below fold: Secondary features in collapsible section
 *
 * Note: ViewToggle and AmbientSoundPicker are rendered by the parent
 * UnifiedFocusTimer to keep them in a fixed position across view switches.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { TimerPresetGrid } from "./TimerPresetGrid";
import { TimerStats } from "./TimerStats";
import { AppBlockingSection } from "./AppBlockingSection";
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
  currentLevel: number;
  onThemeChange: (themeId: string) => void;
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
  currentLevel,
  onThemeChange,
}: TimerViewProps) => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="relative z-10 flex flex-col items-center justify-start px-4 pb-32">
      {/* Preset grid ABOVE timer when not running — pick duration first */}
      {!timerState.isRunning && (
        <div className="mb-4 w-full flex justify-center">
          <TimerPresetGrid
            selectedPreset={selectedPreset}
            isRunning={timerState.isRunning}
            onSelectPreset={onSelectPreset}
          />
        </div>
      )}

      {/* Pet sprite + Timer display — the hero section */}
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

      {/* Background theme switcher — always visible */}
      <div className="mt-4 w-full flex justify-center">
        <BackgroundThemeSwitcher
          currentTheme={backgroundTheme}
          currentLevel={currentLevel}
          onThemeChange={onThemeChange}
        />
      </div>

      {/* App Blocking Section — always visible since it's a key feature */}
      <AppBlockingSection isTimerRunning={timerState.isRunning} />

      {/* Collapsible "More" section for secondary features */}
      <div className="w-full max-w-sm mt-5">
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white/60 active:text-white/80 transition-colors"
        >
          {showMore ? (
            <>
              Less options
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              More options
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        {showMore && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Show presets here when timer IS running (since they're hidden above) */}
            {timerState.isRunning && (
              <div className="flex justify-center">
                <TimerPresetGrid
                  selectedPreset={selectedPreset}
                  isRunning={timerState.isRunning}
                  onSelectPreset={onSelectPreset}
                />
              </div>
            )}

            <TimerStats />
          </div>
        )}
      </div>
    </div>
  );
};
