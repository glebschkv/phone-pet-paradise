import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FocusCategory, FOCUS_CATEGORIES } from "@/types/analytics";
import { TimerPreset } from "./constants";
import { Target, Sparkles } from "lucide-react";

interface TaskIntentionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (category: FocusCategory, taskLabel?: string) => void;
  selectedPreset: TimerPreset;
}

export const TaskIntentionModal = ({
  isOpen,
  onClose,
  onStart,
  selectedPreset,
}: TaskIntentionModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<FocusCategory>("work");
  const [taskLabel, setTaskLabel] = useState("");

  const handleStart = () => {
    onStart(selectedCategory, taskLabel.trim() || undefined);
    // Reset for next time
    setTaskLabel("");
  };

  const handleSkip = () => {
    // Start without category tracking
    onStart("other", undefined);
    setTaskLabel("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-slate-900 to-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="w-5 h-5 text-blue-400" />
            What are you focusing on?
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Setting an intention helps you stay accountable and track your progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {FOCUS_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                    selectedCategory === cat.id
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
                  )}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Task Label */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              What specifically? <span className="text-slate-500">(optional)</span>
            </label>
            <Input
              value={taskLabel}
              onChange={(e) => setTaskLabel(e.target.value)}
              placeholder="e.g., Finish report, Study chapter 5..."
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleStart();
                }
              }}
            />
          </div>

          {/* Session Info */}
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-700/30 rounded-lg">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-slate-300">
              {selectedPreset.name} · {selectedPreset.duration} minutes
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1 text-slate-400 hover:text-white hover:bg-slate-700"
          >
            Skip
          </Button>
          <Button
            onClick={handleStart}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white"
          >
            Start Focusing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
