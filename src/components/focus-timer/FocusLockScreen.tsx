import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FOCUS_CATEGORIES, FocusCategory } from "@/types/analytics";

interface FocusLockScreenProps {
  isVisible: boolean;
  timeRemaining: number;
  category?: FocusCategory;
  taskLabel?: string;
  onReturnToApp: () => void;
  onAbandonSession: () => void;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const FocusLockScreen = ({
  isVisible,
  timeRemaining,
  category,
  taskLabel,
  onReturnToApp,
  onAbandonSession,
}: FocusLockScreenProps) => {
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  const categoryInfo = category
    ? FOCUS_CATEGORIES.find(c => c.id === category)
    : null;

  const handleAbandon = () => {
    setShowAbandonConfirm(false);
    onAbandonSession();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(255,255,255,0.03) 20px,
                rgba(255,255,255,0.03) 40px
              )`
            }} />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
            {/* Shield Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-blue-500/30 rounded-full" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white text-center mb-2"
            >
              Focus Mode Active
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 text-center mb-8 max-w-xs"
            >
              Stay focused! You're in a focus session.
            </motion.p>

            {/* Time Remaining */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 text-center"
            >
              <div className="text-5xl font-mono font-bold text-white mb-2">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-white/50 text-sm">remaining</div>
            </motion.div>

            {/* Current Task */}
            {(categoryInfo || taskLabel) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 rounded-xl px-4 py-3 mb-8 max-w-xs w-full"
              >
                <div className="flex items-center gap-2 justify-center">
                  {categoryInfo && (
                    <span className="text-xl">{categoryInfo.emoji}</span>
                  )}
                  <span className="text-white/80 text-sm">
                    {taskLabel || categoryInfo?.label || "Focusing"}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Return Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full max-w-xs space-y-3"
            >
              <Button
                onClick={onReturnToApp}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-6 text-lg font-semibold"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Return to Focus
              </Button>

              {!showAbandonConfirm ? (
                <button
                  onClick={() => setShowAbandonConfirm(true)}
                  className="w-full py-3 text-white/40 hover:text-white/60 text-sm transition-colors"
                >
                  I need to leave
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-red-400 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Abandon Session?</span>
                  </div>
                  <p className="text-white/50 text-xs mb-3">
                    Your progress won't count towards your goals.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAbandonConfirm(false)}
                      className="flex-1 text-white/60 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAbandon}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                      Abandon
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Motivational Quote */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-8 left-0 right-0 text-center text-white/30 text-xs px-8"
            >
              "The secret of getting ahead is getting started."
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
