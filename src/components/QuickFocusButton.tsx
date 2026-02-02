/**
 * QuickFocusButton Component
 *
 * A floating action button on the home screen that lets users
 * jump directly to the focus timer with one tap.
 * Positioned above the tab bar for easy thumb reach on mobile.
 */

import { Timer } from "lucide-react";

interface QuickFocusButtonProps {
  onStartFocus: () => void;
}

export const QuickFocusButton = ({ onStartFocus }: QuickFocusButtonProps) => {
  return (
    <div className="absolute bottom-28 right-4 pointer-events-auto z-30">
      <button
        onClick={onStartFocus}
        aria-label="Start a focus session"
        className="quick-focus-fab"
      >
        <Timer className="w-5 h-5 text-white" strokeWidth={2.5} />
        <span className="text-xs font-bold text-white">Focus</span>
      </button>
    </div>
  );
};
