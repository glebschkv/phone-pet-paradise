import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Mail } from 'lucide-react';

const VERSION_NOTICE_KEY = 'version-notice-v1-dismissed';

export const VersionNotice = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(VERSION_NOTICE_KEY);
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(VERSION_NOTICE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="max-w-sm mx-auto retro-card border-2 border-border max-h-[90vh] overflow-y-auto p-0">
        <VisuallyHidden>
          <DialogTitle>Version 1.0</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div
          className="p-6 pb-4 text-center"
          style={{
            background: 'linear-gradient(180deg, hsl(280 70% 50% / 0.3) 0%, transparent 100%)',
          }}
        >
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-4xl">
            🐾
          </div>

          <h2 className="text-xl font-bold">
            Version 1.0
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Thanks for downloading!
          </p>
        </div>

        <div className="px-5 pb-5 space-y-3">
          {/* Indie dev message */}
          <div className="retro-stat-pill p-3">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">💜</span>
              <p className="text-sm text-muted-foreground">
                This app is built by a <span className="font-bold text-foreground">solo indie developer</span>.
                Sorry if you run into any bugs or rough edges — it's still early days and things are actively being improved.
              </p>
            </div>
          </div>

          {/* Bug report section */}
          <div className="retro-stat-pill p-3">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">🐛</span>
              <div className="text-sm text-muted-foreground">
                <p className="font-bold text-foreground mb-1">Report a bug</p>
                <p>
                  If something isn't working right, send us an email and we'll look into it.
                </p>
                <a
                  href="mailto:report@nomoinc.co?subject=Bug%20Report%20-%20v1.0"
                  className="inline-flex items-center gap-1.5 mt-2 font-bold text-primary hover:opacity-80 transition-opacity"
                >
                  <Mail className="w-3.5 h-3.5" />
                  report@nomoinc.co
                </a>
              </div>
            </div>
          </div>

          {/* Version badge */}
          <div className="flex justify-center">
            <div className="retro-level-badge px-3 py-1 text-xs rounded">
              v1.0
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="w-full py-3.5 rounded-lg font-bold text-sm retro-arcade-btn retro-arcade-btn-green transition-all active:scale-95 touch-manipulation"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
