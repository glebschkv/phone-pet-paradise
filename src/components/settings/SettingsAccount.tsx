import { useState } from "react";
import { settingsLogger } from "@/lib/logger";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, LogOut, Trash2, Shield, UserCircle, Loader2, Crown, RefreshCw, ExternalLink } from "lucide-react";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useStoreKit } from "@/hooks/useStoreKit";
import { Capacitor } from "@capacitor/core";

/**
 * Simple inline confirmation dialog — no Radix, no portals, no overlay
 * elements.  Radix AlertDialog uses focus-trapping and CSS animation
 * lifecycles that break on iOS WebView / Capacitor (buttons become
 * unresponsive or the whole screen goes black).  This component renders
 * a plain fixed-position div controlled by React state.
 */
const ConfirmDialog = ({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmClassName,
  confirmStyle,
  isLoading,
  loadingLabel,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmClassName?: string;
  confirmStyle?: React.CSSProperties;
  isLoading?: boolean;
  loadingLabel?: string;
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ WebkitBackfaceVisibility: 'hidden' }}
    >
      {/* Scrim — tapping it cancels */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden
      />

      {/* Dialog card */}
      <div className="relative retro-game-card border-2 border-purple-600/50 max-w-xs w-full p-6 space-y-4">
        <div className="space-y-2 text-center">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <p className="text-xs text-purple-300/80">{description}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            className="retro-stat-pill px-3 py-2 text-xs font-semibold rounded-lg"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className={confirmClassName ?? "retro-arcade-btn retro-arcade-btn-purple px-3 py-2 text-xs"}
            style={confirmStyle}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                {loadingLabel ?? confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const SettingsAccount = () => {
  const { user, isGuestMode, isAnonymous, signOut, session } = useAuth();
  const navigate = useNavigate();
  const { isPremium, currentPlan, restorePurchases: restoreMock } = usePremiumStatus();
  const storeKit = useStoreKit();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Local-only guests have no Supabase session (e.g. offline fallback).
  // Anonymous Supabase users have a real session — their data IS server-synced.
  const isLocalOnlyGuest = isGuestMode && !session;
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/auth');
    } catch {
      // signOut() already shows a toast
    } finally {
      setIsSigningOut(false);
      setSignOutDialogOpen(false);
    }
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleManageSubscriptions = async () => {
    setIsManaging(true);
    try {
      if (isNative) {
        await storeKit.manageSubscriptions();
      } else {
        window.open('https://apps.apple.com/account/subscriptions', '_blank', 'noopener,noreferrer');
      }
    } catch (_error) {
      toast.error('Failed to open subscription management');
    } finally {
      setIsManaging(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      if (isNative) {
        await storeKit.restorePurchases();
      } else {
        const result = restoreMock();
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.info(result.message);
        }
      }
    } catch (_error) {
      toast.error('Failed to restore purchases');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.access_token) {
      toast.error('You must be signed in to delete your account');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete account');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to delete account');
      }

      toast.success('Account deleted successfully');
      setDeleteDialogOpen(false);

      localStorage.clear();
      window.location.replace('/auth');
    } catch (error: unknown) {
      settingsLogger.error('Error deleting account:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete account. Please try again.';
      toast.error(message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Subscription Management */}
      <div className="retro-game-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-4 h-4 retro-neon-yellow" />
          <span className="text-sm font-bold retro-pixel-text text-white">SUBSCRIPTION</span>
        </div>

        <div className="space-y-3">
          {/* Current Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-900/20 border border-purple-600/30">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPremium
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'retro-stat-pill'
            }`}>
              <Crown className={`w-5 h-5 ${isPremium ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                {isPremium ? currentPlan?.name || 'Premium' : 'Free Plan'}
              </p>
              <p className="text-[11px] text-purple-300/80">
                {isPremium
                  ? currentPlan?.period === 'lifetime'
                    ? 'Lifetime access'
                    : `${currentPlan?.period === 'yearly' ? 'Annual' : 'Monthly'} subscription`
                  : 'Limited features'}
              </p>
            </div>
            {isPremium && (
              <span className="retro-difficulty-badge retro-difficulty-legendary text-[11px]">
                Active
              </span>
            )}
          </div>

          {/* Manage Subscription Button */}
          {isPremium && (
            <button
              onClick={handleManageSubscriptions}
              disabled={isManaging}
              className="w-full retro-arcade-btn retro-arcade-btn-yellow px-3 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {isManaging ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              <span>{isManaging ? 'Opening...' : 'Manage Subscription'}</span>
            </button>
          )}

          {/* Restore Purchases Button */}
          <button
            onClick={handleRestorePurchases}
            disabled={isRestoring}
            className="w-full p-3 retro-stat-pill rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold">
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </span>
          </button>

          <p className="text-[11px] text-purple-300/60 text-center">
            Made a purchase on another device? Tap restore to recover it.
          </p>
        </div>
      </div>

      {/* Account Info */}
      <div className="retro-game-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold retro-pixel-text text-white">ACCOUNT</span>
        </div>

        <div className="space-y-3">
          {/* Account Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-900/20 border border-purple-600/30">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isGuestMode ? 'retro-stat-pill' : 'bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-300'
            }`}>
              {isGuestMode ? (
                <User className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Mail className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {isGuestMode ? 'Guest Account' : user?.email}
              </p>
              <p className="text-[11px] text-purple-300/80">
                {isGuestMode ? 'Not signed in — create an account to save your progress' : 'Synced to cloud'}
              </p>
            </div>
            {isGuestMode && (
              <span className="retro-difficulty-badge retro-difficulty-hard text-[11px]">
                Guest
              </span>
            )}
          </div>

          {/* Guest Mode Warning */}
          {isGuestMode && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-300">
                    {isLocalOnlyGuest
                      ? 'Your progress is only saved on this device'
                      : 'You\'re signed in as a guest'}
                  </p>
                  <p className="text-[11px] text-amber-400/70 mt-1">
                    {isLocalOnlyGuest
                      ? 'Sign in to sync your pets and progress across devices'
                      : 'Create an account to keep your progress and sync across devices'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sign In / Create Account Button (for guests) */}
          {isGuestMode && (
            <button
              onClick={handleSignIn}
              className="w-full retro-arcade-btn retro-arcade-btn-yellow px-3 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Sign In or Create Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Sign Out Section */}
      <div className="retro-game-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold retro-pixel-text text-white">SESSION</span>
        </div>

        <button
          className="w-full p-3 retro-stat-pill rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          disabled={isSigningOut}
          onClick={() => setSignOutDialogOpen(true)}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {isLocalOnlyGuest ? 'Exit Guest Mode' : 'Sign Out'}
          </span>
        </button>
      </div>

      {/* Sign Out Confirmation */}
      <ConfirmDialog
        open={signOutDialogOpen}
        onCancel={() => setSignOutDialogOpen(false)}
        onConfirm={handleSignOut}
        title={isLocalOnlyGuest ? 'Exit Guest Mode?' : 'Sign Out?'}
        description={
          isLocalOnlyGuest
            ? 'Your local progress will be cleared. You can sign in or start fresh as a new guest.'
            : 'You can sign back in anytime to access your synced progress.'
        }
        confirmLabel={isLocalOnlyGuest ? 'Exit' : 'Sign Out'}
        isLoading={isSigningOut}
      />

      {/* Danger Zone - Delete Account (for users with a server identity) */}
      {!!session && (
        <div className="retro-game-card p-4 border-red-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold retro-pixel-text text-red-400">DANGER ZONE</span>
          </div>

          <button
            className="w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 bg-red-500/10 text-red-400 border-2 border-red-500/30 font-semibold text-sm"
            style={{ boxShadow: '0 2px 0 rgba(239,68,68,0.2)' }}
            disabled={isDeleting}
            onClick={() => setDeleteDialogOpen(true)}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
          </button>

          <p className="text-[11px] text-purple-300/60 mt-2 text-center">
            This will permanently remove your account and all data
          </p>
        </div>
      )}

      {/* Delete Account Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        description="This will permanently delete your account and all your data including pets, progress, and achievements. This action cannot be undone."
        confirmLabel="Delete Forever"
        loadingLabel="Deleting..."
        confirmClassName="bg-red-500 text-white px-3 py-2 text-xs font-bold rounded-lg"
        confirmStyle={{ boxShadow: '0 2px 0 rgba(185,28,28,0.8)' }}
        isLoading={isDeleting}
      />
    </div>
  );
};
