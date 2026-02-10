/**
 * FocusShieldNudge
 *
 * A one-time dismissible nudge on the timer page that encourages users to
 * set up Focus Shield (app blocking). Only renders on native when shield
 * hasn't been configured yet. Disappears permanently once dismissed or
 * once the user configures their blocked apps.
 *
 * Styled to match the timer page's frosted-glass design language.
 */

import { useState, useEffect } from 'react';
import { Shield, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useDeviceActivity } from '@/hooks/useDeviceActivity';

const DISMISSED_KEY = 'nomoPhone_shieldNudgeDismissed';

export const FocusShieldNudge = () => {
  const [visible, setVisible] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const {
    isPermissionGranted,
    hasAppsConfigured,
    requestPermissions,
    openAppPicker,
    isLoading,
  } = useDeviceActivity();

  // Check localStorage on mount — only show if native + not dismissed
  useEffect(() => {
    if (!isNative) return;
    const wasDismissed = localStorage.getItem(DISMISSED_KEY);
    if (!wasDismissed) setVisible(true);
  }, [isNative]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  const handleAction = async () => {
    if (!isPermissionGranted) {
      await requestPermissions();
    } else {
      await openAppPicker();
    }
  };

  // Auto-hide once configured
  useEffect(() => {
    if (hasAppsConfigured && visible) {
      setVisible(false);
      localStorage.setItem(DISMISSED_KEY, 'true');
    }
  }, [hasAppsConfigured, visible]);

  // Don't render: web, dismissed, or already set up
  if (!isNative || !visible || hasAppsConfigured) return null;

  const actionLabel = !isPermissionGranted ? 'Enable' : 'Set up';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-sm"
        >
          <div
            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl"
            style={{
              background: 'hsl(220 30% 20% / 0.35)',
              backdropFilter: 'blur(20px) saturate(150%)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              border: '1.5px solid hsl(0 0% 100% / 0.12)',
              boxShadow:
                '0 4px 16px hsl(0 0% 0% / 0.12), inset 0 1px 0 hsl(0 0% 100% / 0.06)',
            }}
          >
            {/* Shield icon */}
            <div
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(160,120,255,0.18)',
                border: '1px solid rgba(160,120,255,0.22)',
                boxShadow: '0 0 12px rgba(160,120,255,0.08)',
              }}
            >
              <Shield
                className="w-[18px] h-[18px]"
                style={{ color: 'rgba(200,180,255,0.85)' }}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[13px] font-semibold leading-tight"
                style={{ color: 'rgba(255,255,255,0.88)' }}
              >
                Focus Shield
              </p>
              <p
                className="text-[11px] leading-tight mt-0.5"
                style={{ color: 'rgba(200,210,240,0.45)' }}
              >
                Block distracting apps
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={handleAction}
              disabled={isLoading}
              className="flex-shrink-0 flex items-center gap-0.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95"
              style={{
                background:
                  'linear-gradient(180deg, hsl(260 55% 58%) 0%, hsl(265 50% 45%) 100%)',
                border: '1.5px solid rgba(255,255,255,0.12)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 6px rgba(120,60,220,0.2)',
                color: 'white',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {actionLabel}
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-all active:scale-90"
              style={{ color: 'rgba(255,255,255,0.25)' }}
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
