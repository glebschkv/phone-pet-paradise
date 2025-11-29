import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Star } from "lucide-react";

interface AppReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRate: () => void;
  onLater: () => void;
  onNever: () => void;
}

export const AppReviewDialog = ({
  open,
  onOpenChange,
  onRate,
  onLater,
  onNever,
}: AppReviewDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-6 h-6 text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            Enjoying NoMo Phone?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your feedback helps us improve! Would you mind taking a moment to
            rate us on the App Store?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            onClick={onRate}
            className="w-full bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            Rate NoMo Phone
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={onLater}
            className="w-full"
          >
            Maybe Later
          </AlertDialogCancel>
          <button
            onClick={onNever}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Don't ask again
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
