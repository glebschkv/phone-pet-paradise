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

import { useState, useCallback } from "react";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useTimerLogic } from "./focus-timer/hooks/useTimerLogic";
import { useBackgroundTheme } from "./focus-timer/hooks/useBackgroundTheme";
import { FocusBackground } from "./focus-timer/backgrounds";
import { FocusThemeProvider } from "./focus-timer/backgrounds/ThemeContext";
import { ViewToggle } from "./focus-timer/ViewToggle";
import { AmbientSoundPicker } from "./focus-timer/AmbientSoundPicker";
import { TimerView } from "./focus-timer/TimerView";
import { StatsView } from "./focus-timer/StatsView";
import { TimerModals } from "./focus-timer/TimerModals";
import { PremiumSubscription } from "./PremiumSubscription";

type TimerViewType = 'timer' | 'stats';

export const UnifiedFocusTimer = () => {
  const { isPremium } = usePremiumStatus();
  const [currentView, setCurrentView] = useState<TimerViewType>('timer');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Background theme management
  const { backgroundTheme, changeBackgroundTheme } = useBackgroundTheme(isPremium);

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

  // Stable callbacks for memoized TimerModals
  const handleCloseIntentionModal = useCallback(() => setShowIntentionModal(false), [setShowIntentionModal]);
  const handleCloseSessionNotes = useCallback(() => {
    setShowSessionNotesModal(false);
    // Delay break modal to prevent Radix Dialog portal collision
    setTimeout(() => setShowBreakTransitionModal(true), 350);
  }, [setShowSessionNotesModal, setShowBreakTransitionModal]);
  const handleReturnToApp = useCallback(() => setShowLockScreen(false), [setShowLockScreen]);
  const handleAbandonSession = useCallback(() => {
    setShowLockScreen(false);
    stopTimer();
  }, [setShowLockScreen, stopTimer]);

  return (
    <FocusThemeProvider theme={backgroundTheme}>
      <div className="min-h-screen w-full relative overflow-hidden">
        <FocusBackground theme={backgroundTheme} />

        {/* Fixed top bar: ViewToggle + Ambient Sound — shared across views.
            AmbientSoundPicker uses invisible (not unmounted) on stats view
            so it still occupies space and the toggle doesn't shift horizontally. */}
        <div className="relative z-10 flex items-center justify-center w-full gap-2 px-4 pt-safe pb-2">
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
          <div className={currentView === 'stats' ? 'invisible' : ''}>
            <AmbientSoundPicker />
          </div>
        </div>

        {currentView === 'stats' ? (
          <StatsView />
        ) : (
          <>
            <TimerView
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
              isPremium={isPremium}
              onThemeChange={changeBackgroundTheme}
              onLockedBackgroundClick={() => setShowPremiumModal(true)}
            />

            <TimerModals
              // Intention modal
              showIntentionModal={showIntentionModal}
              onCloseIntentionModal={handleCloseIntentionModal}
              onStartWithIntent={startTimerWithIntent}
              selectedPreset={selectedPreset}
              // Session notes modal
              showSessionNotesModal={showSessionNotesModal}
              onCloseSessionNotes={handleCloseSessionNotes}
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
              onReturnToApp={handleReturnToApp}
              onAbandonSession={handleAbandonSession}
            />
          </>
        )}
        <PremiumSubscription
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />
      </div>
    </FocusThemeProvider>
  );
};
