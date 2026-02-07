import { useState, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { FocusCategory, FOCUS_CATEGORIES } from "@/types/analytics";
import { TimerPreset } from "./constants";
import { PixelIcon } from "@/components/ui/PixelIcon";

interface TaskIntentionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (category: FocusCategory, taskLabel?: string) => void;
  selectedPreset: TimerPreset;
}

const CATEGORY_GLOW: Record<FocusCategory, { border: string; shadow: string; bg: string }> = {
  work: {
    border: "border-blue-400",
    shadow: "shadow-[0_0_14px_rgba(96,165,250,0.5)]",
    bg: "bg-blue-500/20",
  },
  study: {
    border: "border-purple-400",
    shadow: "shadow-[0_0_14px_rgba(192,132,252,0.5)]",
    bg: "bg-purple-500/20",
  },
  creative: {
    border: "border-pink-400",
    shadow: "shadow-[0_0_14px_rgba(244,114,182,0.5)]",
    bg: "bg-pink-500/20",
  },
  personal: {
    border: "border-green-400",
    shadow: "shadow-[0_0_14px_rgba(74,222,128,0.5)]",
    bg: "bg-green-500/20",
  },
  health: {
    border: "border-orange-400",
    shadow: "shadow-[0_0_14px_rgba(251,146,60,0.5)]",
    bg: "bg-orange-500/20",
  },
  other: {
    border: "border-cyan-400",
    shadow: "shadow-[0_0_14px_rgba(34,211,238,0.5)]",
    bg: "bg-cyan-500/20",
  },
};

export const TaskIntentionModal = memo(({
  isOpen,
  onClose,
  onStart,
  selectedPreset,
}: TaskIntentionModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<FocusCategory>("work");
  const [taskLabel, setTaskLabel] = useState("");

  const handleStart = () => {
    onStart(selectedCategory, taskLabel.trim() || undefined);
    setTaskLabel("");
  };

  const handleCancel = () => {
    setTaskLabel("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="retro-modal max-w-[340px] p-0 overflow-hidden border-0 [&>button:last-child]:hidden">
        <VisuallyHidden>
          <DialogTitle>What are you focusing on?</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="retro-modal-header p-4 pb-3 text-center relative">
          <div className="retro-scanlines opacity-20" />
          <div className="relative z-10 flex items-center justify-center gap-2.5">
            <PixelIcon name="target" size={22} />
            <h2 className="text-base font-bold tracking-wide uppercase text-white">
              What are you focusing on?
            </h2>
          </div>
          <p className="relative z-10 text-[11px] text-purple-300/70 mt-1.5">
            Set an intention to stay accountable
          </p>
        </div>

        <div className="p-4 pt-3 space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FOCUS_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const glow = CATEGORY_GLOW[cat.id];
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border-2 transition-all duration-150",
                      "active:translate-y-[2px] active:shadow-none touch-manipulation",
                      isSelected
                        ? cn(
                            glow.border,
                            glow.shadow,
                            glow.bg,
                            "shadow-[0_4px_0_hsl(260_30%_12%)]"
                          )
                        : cn(
                            "border-slate-600/60 bg-slate-800/60",
                            "shadow-[0_3px_0_hsl(260_20%_10%)]",
                            "hover:border-slate-500"
                          )
                    )}
                  >
                    <PixelIcon name={cat.icon} size={28} />
                    <span className={cn(
                      "text-[11px] font-bold tracking-wide",
                      isSelected ? "text-white" : "text-slate-400"
                    )}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Task Label */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
              Task <span className="text-slate-600 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              value={taskLabel}
              onChange={(e) => setTaskLabel(e.target.value)}
              placeholder="e.g., Finish report, Chapter 5..."
              className={cn(
                "w-full px-3 py-2.5 rounded-lg text-sm text-white",
                "bg-slate-800/80 border-2 border-slate-600/60",
                "placeholder:text-slate-600",
                "focus:outline-none focus:border-purple-500/60 focus:shadow-[0_0_10px_rgba(168,85,247,0.2)]",
                "transition-all duration-150"
              )}
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleStart();
                }
              }}
            />
          </div>

          {/* Session Info Pill */}
          <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-700/80 bg-slate-800/40">
            <PixelIcon name="sparkles" size={16} />
            <span className="text-xs font-semibold text-slate-400 tracking-wide">
              {selectedPreset.name} &middot; {selectedPreset.duration} min
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1 pb-1">
            <button
              onClick={handleCancel}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-bold text-sm tracking-wide",
                "border-2 border-slate-600/50 text-slate-500",
                "hover:border-slate-500 hover:text-slate-300",
                "active:translate-y-[1px]",
                "transition-all duration-150 touch-manipulation"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-bold text-sm tracking-wider uppercase",
                "retro-arcade-btn retro-arcade-btn-green",
                "select-none"
              )}
            >
              Start Focus
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}, (prev, next) =>
  prev.isOpen === next.isOpen && prev.selectedPreset === next.selectedPreset
);
