import { useState } from 'react';
import { useDeviceActivity } from '@/hooks/useDeviceActivity';
import { Shield, ShieldCheck, ShieldOff, ChevronDown, ChevronUp, Lock, Sparkles, AlertTriangle, Smartphone, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';

interface AppBlockingSectionProps {
  isTimerRunning: boolean;
  onBlockingStatusChange?: (isBlocking: boolean, blockedCount: number) => void;
}

export const AppBlockingSection = ({
  isTimerRunning,
  onBlockingStatusChange
}: AppBlockingSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    isPermissionGranted,
    isBlocking,
    hasAppsConfigured,
    blockedAppsCount,
    selectedAppsCount,
    selectedCategoriesCount,
    shieldAttempts,
    isLoading,
    requestPermissions,
    openSettings,
    openAppPicker,
  } = useDeviceActivity();

  const [hasAttemptedPermission, setHasAttemptedPermission] = useState(false);

  const isNativePlatform = Capacitor.isNativePlatform();

  // Build a human-readable label for the blocked selection count
  const blockedLabel = (() => {
    if (selectedAppsCount > 0 && selectedCategoriesCount > 0) {
      return `${selectedAppsCount} app${selectedAppsCount !== 1 ? 's' : ''} & ${selectedCategoriesCount} group${selectedCategoriesCount !== 1 ? 's' : ''}`;
    }
    if (selectedCategoriesCount > 0) {
      return `${selectedCategoriesCount} app group${selectedCategoriesCount !== 1 ? 's' : ''}`;
    }
    return `${blockedAppsCount} app${blockedAppsCount !== 1 ? 's' : ''}`;
  })();

  // Handle permission request
  const handleRequestPermission = async () => {
    setHasAttemptedPermission(true);
    await requestPermissions();
  };

  // Handle open settings
  const handleOpenSettings = async () => {
    await openSettings();
  };

  // Handle opening native app picker (iOS only)
  const handleOpenAppPicker = async () => {
    await openAppPicker();
    onBlockingStatusChange?.(isBlocking, blockedAppsCount);
  };

  // Render permission request card
  if (!isPermissionGranted && isNativePlatform) {
    return (
      <div className="mt-4 w-full max-w-sm">
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-4 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Focus Shield</h3>
              <p className="text-xs text-purple-200/70">Block distracting apps</p>
            </div>
          </div>

          <p className="text-sm text-white/70 mb-4">
            {hasAttemptedPermission
              ? "Screen Time permission is needed. If you previously denied it, open Settings to enable it for this app."
              : "Enable Screen Time access to automatically block apps during focus sessions and earn bonus rewards!"
            }
          </p>

          <button
            onClick={handleRequestPermission}
            disabled={isLoading}
            className={cn(
              "w-full py-3 px-4 rounded-xl font-bold text-sm transition-all",
              "bg-gradient-to-r from-purple-500 to-purple-600",
              "hover:from-purple-400 hover:to-purple-500",
              "active:scale-[0.98] shadow-lg shadow-purple-500/30",
              "text-white flex items-center justify-center gap-2",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Lock className="w-4 h-4" />
            {isLoading ? 'Requesting...' : hasAttemptedPermission ? 'Try Again' : 'Enable Focus Shield'}
          </button>

          {hasAttemptedPermission && (
            <button
              onClick={handleOpenSettings}
              className={cn(
                "w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm transition-all",
                "bg-white/10 border border-white/20",
                "hover:bg-white/15",
                "active:scale-[0.98]",
                "text-white flex items-center justify-center gap-2"
              )}
            >
              <Settings className="w-4 h-4" />
              Open Settings
            </button>
          )}
        </div>
      </div>
    );
  }

  // Web preview when not on native platform
  if (!isNativePlatform) {
    return (
      <div className="mt-4 w-full max-w-sm">
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 p-4 rounded-2xl border border-gray-600/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-gray-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Focus Shield</h3>
              <p className="text-xs text-gray-400">iOS exclusive feature</p>
            </div>
          </div>

          <div className="bg-black/20 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-white/80 font-medium">App Blocking</span>
            </div>
            <p className="text-xs text-white/50">
              On iOS, you can select any apps to block during focus sessions. Stay focused and earn bonus XP!
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300">
              Perfect focus = +25% XP & +50 coins
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full max-w-sm">
      {/* Main Card */}
      <div className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-300 backdrop-blur-sm",
        isBlocking
          ? "bg-gradient-to-br from-green-900/40 to-emerald-800/20 border-green-500/40"
          : hasAppsConfigured
            ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30"
            : "bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-600/30"
      )}>
        {/* Header - Always visible */}
        <button
          onClick={() => !isTimerRunning && setIsExpanded(!isExpanded)}
          disabled={isTimerRunning && !isBlocking}
          className={cn(
            "w-full p-4 flex items-center justify-between",
            "transition-all duration-200",
            !isTimerRunning && "hover:bg-white/5 active:bg-white/10"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg",
              isBlocking
                ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30"
                : hasAppsConfigured
                  ? "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30"
                  : "bg-gradient-to-br from-gray-600 to-gray-700"
            )}>
              {isBlocking ? (
                <ShieldCheck className="w-6 h-6 text-white" />
              ) : hasAppsConfigured ? (
                <Shield className="w-6 h-6 text-white" />
              ) : (
                <ShieldOff className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div className="text-left">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Focus Shield
                {isBlocking && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-full animate-pulse">
                    ACTIVE
                  </span>
                )}
              </h3>
              <p className="text-sm text-white/60">
                {isBlocking
                  ? `${blockedLabel} blocked`
                  : hasAppsConfigured
                    ? `${blockedLabel} selected`
                    : 'Tap to select apps'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Shield attempts indicator during session */}
            {isBlocking && shieldAttempts > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/20 border border-orange-400/40">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold text-orange-300">{shieldAttempts}</span>
              </div>
            )}

            {!isTimerRunning && (
              isExpanded ? (
                <ChevronUp className="w-5 h-5 text-white/50" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/50" />
              )
            )}
          </div>
        </button>

        {/* Expanded Content - App Selection */}
        {isExpanded && !isTimerRunning && (
          <div className="px-4 pb-4 border-t border-white/10">
            {/* Native iOS picker button */}
            <button
              onClick={handleOpenAppPicker}
              className={cn(
                "w-full mt-4 py-4 px-4 rounded-xl font-bold text-base transition-all",
                "bg-gradient-to-r from-purple-500 to-purple-600",
                "hover:from-purple-400 hover:to-purple-500",
                "active:scale-[0.98] shadow-lg shadow-purple-500/30",
                "text-white flex items-center justify-center gap-3"
              )}
            >
              <Plus className="w-5 h-5" />
              Select Apps to Block
            </button>

            {/* Currently selected count */}
            {hasAppsConfigured && (
              <div className="mt-3 flex items-center justify-center gap-2 py-2 px-3 bg-purple-500/10 rounded-lg">
                <Lock className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-200">
                  {blockedLabel} will be blocked
                </span>
              </div>
            )}

            {/* Info about how it works */}
            <div className="mt-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-white/50">
                <span className="text-green-400">•</span>
                <span>Apps are blocked when you start a focus session</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-white/50">
                <span className="text-green-400">•</span>
                <span>Unblocked automatically when your session ends</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-white/50">
                <span className="text-purple-400">•</span>
                <span>Stay focused for bonus XP and coins!</span>
              </div>
            </div>
          </div>
        )}

        {/* Timer running indicator */}
        {isTimerRunning && isBlocking && (
          <div className="px-4 pb-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 py-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-green-300 font-medium">
                Focus mode active — apps are blocked
              </span>
            </div>

            {shieldAttempts > 0 && (
              <div className="mt-2 p-3 rounded-xl bg-orange-500/10 border border-orange-400/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-orange-200 font-medium">
                    {shieldAttempts === 1
                      ? "1 blocked app attempt"
                      : `${shieldAttempts} blocked app attempts`
                    }
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-orange-200/60">
                  {shieldAttempts === 0
                    ? "Perfect focus = +25% XP bonus!"
                    : shieldAttempts <= 2
                      ? "Keep going! You can still earn +10% bonus"
                      : "Stay focused for the rest of your session!"
                  }
                </p>
              </div>
            )}

            {shieldAttempts === 0 && (
              <div className="mt-2 p-3 rounded-xl bg-green-500/10 border border-green-400/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-200 font-medium">
                    Perfect focus so far!
                  </span>
                </div>
                <p className="mt-1 text-xs text-green-200/60">
                  Complete without distractions for +25% XP & +50 coins
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reward hint when apps configured but timer not running */}
      {hasAppsConfigured && !isTimerRunning && !isExpanded && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs text-white/50">
            Start a session for focus rewards!
          </span>
        </div>
      )}
    </div>
  );
};

export default AppBlockingSection;
