import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Bug, Heart, ExternalLink } from 'lucide-react';

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
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="max-w-sm mx-auto retro-card border-2 border-border max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div
          className="p-6 pb-4 text-center"
          style={{
            background: 'linear-gradient(180deg, hsl(220 70% 50% / 0.2) 0%, transparent 100%)',
          }}
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-3">
            <Info className="w-7 h-7 text-blue-500" />
          </div>

          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Welcome to Version 1.0
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mt-1">
              Thanks for being an early user!
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 space-y-4">
          {/* Indie dev message */}
          <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
            <Heart className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              This app is built by a <span className="font-semibold text-foreground">solo indie developer</span>.
              We apologise if you run into any bugs or rough edges — your patience means the world!
            </p>
          </div>

          {/* Bug report section */}
          <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
            <Bug className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Found a bug?</p>
              <p>
                Please report any issues or feedback so we can make the app better for everyone.
              </p>
              <a
                href="mailto:support@phonepetparadise.com?subject=Bug%20Report%20-%20v1.0"
                className="inline-flex items-center gap-1.5 mt-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Send Bug Report
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <Button
            onClick={handleDismiss}
            className="w-full"
          >
            Got it, let's go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
