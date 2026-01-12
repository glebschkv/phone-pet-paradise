/**
 * UnifiedFocusTimer Component
 *
 * Main timer component that orchestrates the focus timer experience.
 * Refactored to use smaller, focused components with single responsibilities:
 *
 * - useBackgroundTheme: Manages background theme state and persistence
 * - useTimerLogic: Manages all timer state and logic
 * - TimerView: Renders the main timer interface
 * - StatsView: Renders the analytics/stats view
 * - TimerModals: Orchestrates all timer-related modals
 */

import { useState } from "react";
import { useBackendAppState } from "@/hooks/useBackendAppState";
import { useTimerLogic } from "./focus-timer/hooks/useTimerLogic";
import { useBackgroundTheme } from "./focus-timer/hooks/useBackgroundTheme";
import { FocusBackground } from "./focus-timer/backgrounds";
import { TimerView } from "./focus-timer/TimerView";
import { StatsView } from "./focus-timer/StatsView";
import { TimerModals } from "./focus-timer/TimerModals";

type TimerViewType = 'timer' | 'stats';

export const UnifiedFocusTimer = () => {
  const { currentLevel } = useBackendAppState();
  const [currentView, setCurrentView] = useState<TimerViewType>('timer');

  // Background theme management
  const { backgroundTheme, changeBackgroundTheme } = useBackgroundTheme(currentLevel);

  // Timer logic (state, controls, countdown, rewards, etc.)
  const {
    timerState,
    displayTime,
    elapsedTime,
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

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <FocusBackground theme={backgroundTheme} />

      {currentView === 'stats' ? (
        <StatsView
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      ) : (
        <>
          <TimerView
            currentView={currentView}
            onViewChange={setCurrentView}
            timerState={timerState}
            displayTime={displayTime}
            elapsedTime={elapsedTime}
            selectedPreset={selectedPreset}
            onStart={requestStartTimer}
            onPause={pauseTimer}
            onStop={stopTimer}
            onSkip={skipTimer}
            onToggleSound={toggleSound}
            onSelectPreset={setPreset}
            backgroundTheme={backgroundTheme}
            currentLevel={currentLevel}
            onThemeChange={changeBackgroundTheme}
          />

          <TimerModals
            // Intention modal
            showIntentionModal={showIntentionModal}
            onCloseIntentionModal={() => setShowIntentionModal(false)}
            onStartWithIntent={startTimerWithIntent}
            selectedPreset={selectedPreset}
            // Session notes modal
            showSessionNotesModal={showSessionNotesModal}
            onCloseSessionNotes={() => {
              setShowSessionNotesModal(false);
              setShowBreakTransitionModal(true);
            }}
            onSaveSessionNotes={handleSessionNotesSave}
            sessionDuration={timerState.sessionDuration}
            lastSessionXP={lastSessionXP}
            taskLabel={timerState.taskLabel}
            // Break transition modal
            showBreakTransitionModal={showBreakTransitionModal}
            onCloseBreakModal={handleSkipBreak}
            onStartBreak={handleStartBreak}
            onSkipBreak={handleSkipBreak}
            completedSessions={timerState.completedSessions}
            autoBreakEnabled={autoBreakEnabled}
            onToggleAutoBreak={toggleAutoBreak}
            // Focus lock screen
            showLockScreen={showLockScreen}
            timeRemaining={displayTime}
            category={timerState.category}
            lockScreenTaskLabel={timerState.taskLabel}
            onReturnToApp={() => setShowLockScreen(false)}
            onAbandonSession={() => {
              setShowLockScreen(false);
              stopTimer();
            }}
          />
        </>
      )}
    </div>
  );
};
