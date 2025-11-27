import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Mail, LogOut, Trash2, Shield, UserCircle } from "lucide-react";

export const SettingsAccount = () => {
  const { user, isGuestMode, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  return (
    <div className="space-y-3">
      {/* Account Info */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle className="w-4 h-4 text-primary" />
          <Label className="text-sm font-bold">Account</Label>
        </div>

        <div className="space-y-3">
          {/* Account Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isGuestMode ? 'bg-muted' : 'bg-primary/10'
            }`}>
              {isGuestMode ? (
                <User className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Mail className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {isGuestMode ? 'Guest Account' : user?.email}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isGuestMode ? 'Data saved locally only' : 'Synced to cloud'}
              </p>
            </div>
            {isGuestMode && (
              <span className="px-2 py-1 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                Guest
              </span>
            )}
          </div>

          {/* Guest Mode Warning */}
          {isGuestMode && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800">
                    Your progress is only saved on this device
                  </p>
                  <p className="text-[10px] text-amber-600 mt-1">
                    Sign in to sync your pets and progress across devices
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sign In Button (for guests) */}
          {isGuestMode && (
            <button
              onClick={handleSignIn}
              className="w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 bg-gradient-to-b from-amber-300 to-amber-400 text-amber-900 font-semibold"
              style={{ boxShadow: '0 2px 0 hsl(35 80% 35%)' }}
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">Sign In or Create Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Sign Out Section */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="w-4 h-4 text-primary" />
          <Label className="text-sm font-bold">Session</Label>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-full p-3 retro-stat-pill rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              disabled={isSigningOut}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {isGuestMode ? 'Exit Guest Mode' : 'Sign Out'}
              </span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="retro-card border-2 max-w-xs mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold">
                {isGuestMode ? 'Exit Guest Mode?' : 'Sign Out?'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                {isGuestMode
                  ? 'Your local progress will be cleared. You can sign in or start fresh as a new guest.'
                  : 'You can sign back in anytime to access your synced progress.'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="retro-stat-pill px-3 py-2 text-xs font-semibold">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSignOut}
                className="bg-primary text-primary-foreground px-3 py-2 text-xs font-bold rounded-lg"
              >
                {isGuestMode ? 'Exit' : 'Sign Out'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Danger Zone - Delete Account (only for logged in users) */}
      {!isGuestMode && (
        <div className="retro-card p-4" style={{ borderColor: 'hsl(var(--destructive) / 0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-4 h-4 text-destructive" />
            <Label className="text-sm font-bold text-destructive">Danger Zone</Label>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full p-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 bg-destructive/10 text-destructive border border-destructive/30">
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Delete Account</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="retro-card border-2 max-w-xs mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-bold text-destructive">
                  Delete Account?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  This will permanently delete your account and all your data including pets, progress, and achievements. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="retro-stat-pill px-3 py-2 text-xs font-semibold">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    // TODO: Implement account deletion
                    // This requires a Supabase Edge Function to delete user data
                    alert('Account deletion will be implemented with backend support');
                  }}
                  className="bg-destructive text-destructive-foreground px-3 py-2 text-xs font-bold rounded-lg"
                >
                  Delete Forever
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Required by Apple App Store guidelines
          </p>
        </div>
      )}
    </div>
  );
};
