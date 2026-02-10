import { Timer, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerView = 'timer' | 'stats';

interface ViewToggleProps {
  currentView: TimerView;
  onViewChange: (view: TimerView) => void;
}

export const ViewToggle = ({ currentView, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex gap-1.5 p-1.5 bg-black/25 backdrop-blur-md rounded-2xl border border-white/10">
      <button
        onClick={() => onViewChange('timer')}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold transition-all active:scale-95",
          currentView === 'timer'
            ? "bg-white text-gray-900 shadow-lg"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        <Timer className="w-4 h-4" />
        Timer
      </button>
      <button
        onClick={() => onViewChange('stats')}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold transition-all active:scale-95",
          currentView === 'stats'
            ? "bg-white text-gray-900 shadow-lg"
            : "text-white/70 hover:text-white hover:bg-white/10"
        )}
      >
        <BarChart3 className="w-4 h-4" />
        Analytics
      </button>
    </div>
  );
};
