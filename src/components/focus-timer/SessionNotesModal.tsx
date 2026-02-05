import { useState } from 'react';
import { PenLine, Sparkles, X, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/PixelIcon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SessionNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string, rating: number) => void;
  sessionDuration: number;
  xpEarned: number;
  taskLabel?: string;
}

const MOOD_OPTIONS = [
  { value: 1, icon: 'mood-exhausted', label: 'Struggled' },
  { value: 2, icon: 'mood-neutral', label: 'Okay' },
  { value: 3, icon: 'mood-content', label: 'Good' },
  { value: 4, icon: 'mood-happy', label: 'Great' },
  { value: 5, icon: 'mood-fire', label: 'Crushing it!' },
];

const QUICK_NOTES = [
  'Stayed focused the whole time',
  'Got distracted a few times',
  'Made great progress',
  'Need to break this down more',
  'In the zone today!',
  'Feeling tired but pushed through',
];

export const SessionNotesModal = ({
  isOpen,
  onClose,
  onSave,
  sessionDuration,
  xpEarned,
  taskLabel,
}: SessionNotesModalProps) => {
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(3);

  const handleSave = () => {
    onSave(notes, rating);
    setNotes('');
    setRating(3);
    onClose();
  };

  const handleSkip = () => {
    onSave('', 0);
    setNotes('');
    setRating(3);
    onClose();
  };

  const addQuickNote = (note: string) => {
    setNotes(prev => prev ? `${prev}\n${note}` : note);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <Trophy className="w-6 h-6" />
                Session Complete!
              </DialogTitle>
            </DialogHeader>
            <button
              onClick={handleSkip}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold">{formatDuration(sessionDuration)}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">+{xpEarned} XP</span>
            </div>
          </div>

          {taskLabel && (
            <p className="mt-3 text-sm text-white/90">
              Task: <span className="font-semibold">{taskLabel}</span>
            </p>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* How did it go? */}
          <div>
            <label className="text-sm font-bold mb-2 block">How did it go?</label>
            <div className="flex gap-2 justify-between">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRating(option.value)}
                  className={cn(
                    "flex-1 py-2 rounded-xl flex flex-col items-center gap-1 transition-all",
                    rating === option.value
                      ? "bg-gradient-to-b from-amber-300 to-amber-400 ring-2 ring-amber-500"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <PixelIcon name={option.icon} size={28} />
                  <span className="text-[9px] font-semibold text-gray-600 dark:text-gray-300">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-bold mb-2 flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you accomplish? Any thoughts?"
              className="w-full h-20 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Quick notes */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Quick add:</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTES.map((note) => (
                <button
                  key={note}
                  onClick={() => addQuickNote(note)}
                  className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSkip}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-gradient-to-b from-green-400 to-green-500 text-white text-sm font-bold shadow-md hover:from-green-500 hover:to-green-600 transition-all"
            >
              Save Notes
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
