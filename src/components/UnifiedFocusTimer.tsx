import { useState, useEffect, useCallback } from "react";
import { useBackendAppState } from "@/hooks/useBackendAppState";
import {
  BACKGROUND_THEME_KEY,
  BACKGROUND_THEMES,
} from "./focus-timer/constants";
import { useTimerLogic } from "./focus-timer/hooks/useTimerLogic";
import { FocusBackground } from "./focus-timer/backgrounds";
import { BackgroundThemeSwitcher } from "./focus-timer/BackgroundThemeSwitcher";
import { TimerDisplay } from "./focus-timer/TimerDisplay";
import { TimerControls } from "./focus-timer/TimerControls";
import { TimerPresetGrid } from "./focus-timer/TimerPresetGrid";
import { TimerStats } from "./focus-timer/TimerStats";
import { TaskIntentionModal } from "./focus-timer/TaskIntentionModal";
import { FocusLockScreen } from "./focus-timer/FocusLockScreen";
import { SessionNotesModal } from "./focus-timer/SessionNotesModal";
import { AmbientSoundPicker } from "./focus-timer/AmbientSoundPicker";
import { BreakTransitionModal } from "./focus-timer/BreakTransitionModal";
import { AppBlockingSection } from "./focus-timer/AppBlockingSection";
import { ViewToggle } from "./focus-timer/ViewToggle";
import { Analytics } from "./analytics";

type TimerView = 'timer' | 'stats';

export const UnifiedFocusTimer = () => {
  const { currentLevel } = useBackendAppState();
  const [backgroundTheme, setBackgroundTheme] = useState<string>('sky');
  const [currentView, setCurrentView] = useState<TimerView>('timer');

  // Use the custom timer logic hook
  const {
    timerState,
    displayTime,
    selectedPreset,
    showIntentionModal,
    showLockScreen,
    showSessionNotesModal,
    showBreakTransitionModal,
    lastSessionXP,
    autoBreakEnabled,
    setPreset,
    requestStartTimer,
    startTimerWithIntent,
    pauseTimer,
    stopTimer,
    skipTimer,
    toggleSound,
    handleSessionNotesSave,
    handleStartBreak,
    handleSkipBreak,
    toggleAutoBreak,
    setShowIntentionModal,
    setShowSessionNotesModal,
    setShowBreakTransitionModal,
    setShowLockScreen,
  } = useTimerLogic();

  // Load background theme from localStorage (validate against unlock level)
  useEffect(() => {
    const savedTheme = localStorage.getItem(BACKGROUND_THEME_KEY);
    const theme = BACKGROUND_THEMES.find(t => t.id === savedTheme);
    if (theme && theme.unlockLevel <= currentLevel) {
      setBackgroundTheme(savedTheme!);
    } else {
      // Fall back to highest unlocked theme
      const unlockedThemes = BACKGROUND_THEMES.filter(t => t.unlockLevel <= currentLevel);
      if (unlockedThemes.length > 0) {
        setBackgroundTheme(unlockedThemes[unlockedThemes.length - 1].id);
      }
    }
  }, [currentLevel]);

  // Save background theme to localStorage (only if unlocked)
  const changeBackgroundTheme = useCallback((themeId: string) => {
    const theme = BACKGROUND_THEMES.find(t => t.id === themeId);
    if (theme && theme.unlockLevel <= currentLevel) {
      setBackgroundTheme(themeId);
      localStorage.setItem(BACKGROUND_THEME_KEY, themeId);
    }
  }, [currentLevel]);

  // Render stats view
  if (currentView === 'stats') {
    return (
      <div className="min-h-screen w-full relative overflow-hidden">
        <FocusBackground theme={backgroundTheme} />
        <div className="relative z-10">
          {/* View Toggle - Fixed at top */}
          <div className="sticky top-0 z-20 flex justify-center pt-4 pb-2">
            <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
          </div>
          {/* Analytics Content */}
          <Analytics />
        </div>
      </div>
    );
  }

  // Render timer view
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <FocusBackground theme={backgroundTheme} />

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-4 pb-32">
        {/* View Toggle & Ambient Sound */}
        <div className="mb-4 flex items-center gap-3">
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
          <AmbientSoundPicker />
        </div>

        <TimerDisplay
          preset={selectedPreset}
          timeLeft={displayTime}
          sessionDuration={selectedPreset.duration * 60}
          isRunning={timerState.isRunning}
          soundEnabled={timerState.soundEnabled}
          onToggleSound={toggleSound}
        />

        <TimerControls
          isRunning={timerState.isRunning}
          onStart={requestStartTimer}
          onPause={pauseTimer}
          onStop={stopTimer}
          onSkip={skipTimer}
        />

        {/* App Blocking Section */}
        <AppBlockingSection
          isTimerRunning={timerState.isRunning}
        />

        {/* Task Intention Modal */}
        <TaskIntentionModal
          isOpen={showIntentionModal}
          onClose={() => setShowIntentionModal(false)}
          onStart={startTimerWithIntent}
          selectedPreset={selectedPreset}
        />

        {/* Session Notes Modal - shows after completing a work session */}
        <SessionNotesModal
          isOpen={showSessionNotesModal}
          onClose={() => {
            setShowSessionNotesModal(false);
            setShowBreakTransitionModal(true);
          }}
          onSave={handleSessionNotesSave}
          sessionDuration={timerState.sessionDuration}
          xpEarned={lastSessionXP}
          taskLabel={timerState.taskLabel}
        />

        {/* Break Transition Modal - shows after session notes */}
        <BreakTransitionModal
          isOpen={showBreakTransitionModal}
          onClose={handleSkipBreak}
          onStartBreak={handleStartBreak}
          onSkipBreak={handleSkipBreak}
          isLongBreak={timerState.completedSessions % 4 === 0}
          completedSessions={timerState.completedSessions}
          autoStartEnabled={autoBreakEnabled}
          onToggleAutoStart={toggleAutoBreak}
        />

        <div className="mt-6">
          <TimerPresetGrid
            selectedPreset={selectedPreset}
            isRunning={timerState.isRunning}
            onSelectPreset={setPreset}
          />
        </div>

        <TimerStats />

        <BackgroundThemeSwitcher
          currentTheme={backgroundTheme}
          currentLevel={currentLevel}
          onThemeChange={changeBackgroundTheme}
        />
      </div>

      {/* Focus Lock Screen - shows when app loses focus during work session */}
      <FocusLockScreen
        isVisible={showLockScreen}
        timeRemaining={displayTime}
        category={timerState.category}
        taskLabel={timerState.taskLabel}
        onReturnToApp={() => setShowLockScreen(false)}
        onAbandonSession={() => {
          setShowLockScreen(false);
          stopTimer();
        }}
      />
    </div>
  );
};
