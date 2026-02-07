/**
 * TimerModals Component
 *
 * Groups all timer-related modals in one place:
 * - TaskIntentionModal: Shown before starting a session
 * - SessionNotesModal: Shown after completing a work session
 * - BreakTransitionModal: Shown after session notes
 * - FocusLockScreen: Shown when app loses focus during work
 */

import { memo } from "react";
import { TaskIntentionModal } from "./TaskIntentionModal";
import { SessionNotesModal } from "./SessionNotesModal";
import { BreakTransitionModal } from "./BreakTransitionModal";
import { FocusLockScreen } from "./FocusLockScreen";
import type { TimerPreset } from "./constants";
import type { FocusCategory } from "@/types/analytics";

interface TimerModalsProps {
  // Intention modal
  showIntentionModal: boolean;
  onCloseIntentionModal: () => void;
  onStartWithIntent: (category: FocusCategory, taskLabel?: string) => void;
  selectedPreset: TimerPreset;

  // Session notes modal
  showSessionNotesModal: boolean;
  onCloseSessionNotes: () => void;
  onSaveSessionNotes: (notes: string, rating: number) => void;
  sessionDuration: number;
  lastSessionXP: number;
  taskLabel?: string;

  // Break transition modal
  showBreakTransitionModal: boolean;
  onCloseBreakModal: () => void; // kept for API compatibility
  onStartBreak: (duration: number) => void;
  onSkipBreak: () => void;
  completedSessions: number;
  autoBreakEnabled: boolean;
  onToggleAutoBreak: (enabled: boolean) => void;

  // Focus lock screen
  showLockScreen: boolean;
  timeRemaining: number;
  category?: FocusCategory;
  lockScreenTaskLabel?: string;
  onReturnToApp: () => void;
  onAbandonSession: () => void;
}

export const TimerModals = memo(({
  // Intention modal
  showIntentionModal,
  onCloseIntentionModal,
  onStartWithIntent,
  selectedPreset,

  // Session notes modal
  showSessionNotesModal,
  onCloseSessionNotes,
  onSaveSessionNotes,
  sessionDuration,
  lastSessionXP,
  taskLabel,

  // Break transition modal
  showBreakTransitionModal,
  onCloseBreakModal: _onCloseBreakModal, // unused but kept for API
  onStartBreak,
  onSkipBreak,
  completedSessions,
  autoBreakEnabled,
  onToggleAutoBreak,

  // Focus lock screen
  showLockScreen,
  timeRemaining,
  category,
  lockScreenTaskLabel,
  onReturnToApp,
  onAbandonSession,
}: TimerModalsProps) => {
  return (
    <>
      {/* Task Intention Modal */}
      <TaskIntentionModal
        isOpen={showIntentionModal}
        onClose={onCloseIntentionModal}
        onStart={onStartWithIntent}
        selectedPreset={selectedPreset}
      />

      {/* Session Notes Modal - shows after completing a work session */}
      <SessionNotesModal
        isOpen={showSessionNotesModal}
        onClose={onCloseSessionNotes}
        onSave={onSaveSessionNotes}
        sessionDuration={sessionDuration}
        xpEarned={lastSessionXP}
        taskLabel={taskLabel}
      />

      {/* Break Transition Modal - shows after session notes */}
      <BreakTransitionModal
        isOpen={showBreakTransitionModal}
        onClose={onSkipBreak}
        onStartBreak={onStartBreak}
        onSkipBreak={onSkipBreak}
        isLongBreak={completedSessions % 4 === 0}
        completedSessions={completedSessions}
        autoStartEnabled={autoBreakEnabled}
        onToggleAutoStart={onToggleAutoBreak}
      />

      {/* Focus Lock Screen - shows when app loses focus during work session */}
      <FocusLockScreen
        isVisible={showLockScreen}
        timeRemaining={timeRemaining}
        category={category}
        taskLabel={lockScreenTaskLabel}
        onReturnToApp={onReturnToApp}
        onAbandonSession={onAbandonSession}
      />
    </>
  );
});
