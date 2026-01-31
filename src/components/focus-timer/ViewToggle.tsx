import { Timer, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerView = 'timer' | 'stats';

interface ViewToggleProps {
  currentView: TimerView;
  onViewChange: (view: TimerView) => void;
}

export const ViewToggle = ({ currentView, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex gap-1 p-1 bg-black/20 backdrop-blur-sm rounded-xl">
      <button
        onClick={() => onViewChange('timer')}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
          currentView === 'timer'
            ? "bg-white text-gray-900 shadow-md"
            : "text-white/80 hover:text-white hover:bg-white/10"
        )}
      >
        <Timer className="w-4 h-4" />
        Timer
      </button>
      <button
        onClick={() => onViewChange('stats')}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
          currentView === 'stats'
            ? "bg-white text-gray-900 shadow-md"
            : "text-white/80 hover:text-white hover:bg-white/10"
        )}
      >
        <BarChart3 className="w-4 h-4" />
        Analytics
      </button>
    </div>
  );
};
