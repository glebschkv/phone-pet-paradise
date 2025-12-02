import { useState } from 'react';
import { useDeviceActivity, type SimulatedBlockedApp } from '@/hooks/useDeviceActivity';
import { Shield, ShieldCheck, ShieldOff, ChevronDown, ChevronUp, Lock, Unlock, Sparkles, AlertTriangle } from 'lucide-react';
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
    shieldAttempts,
    simulatedApps,
    isLoading,
    isNative,
    requestPermissions,
    toggleAppBlocked,
    openAppPicker,
  } = useDeviceActivity();

  const isNativePlatform = Capacitor.isNativePlatform();

  // Handle permission request
  const handleRequestPermission = async () => {
    await requestPermissions();
  };

  // Handle app toggle
  const handleToggleApp = (appId: string, isBlocked: boolean) => {
    if (isTimerRunning) return; // Can't change during session
    toggleAppBlocked(appId, isBlocked);
    onBlockingStatusChange?.(isBlocking, blockedAppsCount + (isBlocked ? 1 : -1));
  };

  // Render permission request card
  if (!isPermissionGranted && isNativePlatform) {
    return (
      <div className="mt-4 w-full max-w-sm">
        <div className="retro-card bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-4 rounded-xl border-2 border-purple-400/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">App Blocking</h3>
              <p className="text-xs text-white/60">Block distracting apps during focus</p>
            </div>
          </div>

          <p className="text-xs text-white/70 mb-3">
            Enable Screen Time access to automatically block apps when you start a focus session.
          </p>

          <button
            onClick={handleRequestPermission}
            disabled={isLoading}
            className={cn(
              "w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all",
              "bg-gradient-to-r from-purple-500 to-purple-600",
              "hover:from-purple-400 hover:to-purple-500",
              "active:scale-[0.98] shadow-lg shadow-purple-500/25",
              "text-white flex items-center justify-center gap-2",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Lock className="w-4 h-4" />
            {isLoading ? 'Requesting...' : 'Enable App Blocking'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full max-w-sm">
      {/* Main Card */}
      <div className={cn(
        "retro-card rounded-xl border-2 overflow-hidden transition-all duration-300",
        isBlocking
          ? "bg-gradient-to-br from-green-500/20 to-emerald-600/10 border-green-400/40"
          : hasAppsConfigured
            ? "bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-400/30"
            : "bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-400/20"
      )}>
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isTimerRunning}
          className={cn(
            "w-full p-4 flex items-center justify-between",
            "transition-all duration-200",
            !isTimerRunning && "hover:bg-white/5 active:bg-white/10"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              isBlocking
                ? "bg-green-500/30"
                : hasAppsConfigured
                  ? "bg-purple-500/30"
                  : "bg-gray-500/20"
            )}>
              {isBlocking ? (
                <ShieldCheck className="w-5 h-5 text-green-300" />
              ) : hasAppsConfigured ? (
                <Shield className="w-5 h-5 text-purple-300" />
              ) : (
                <ShieldOff className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="text-left">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                App Blocking
                {isBlocking && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-green-500/30 text-green-300 rounded">
                    ACTIVE
                  </span>
                )}
              </h3>
              <p className="text-xs text-white/60">
                {isBlocking
                  ? `${blockedAppsCount} apps blocked`
                  : hasAppsConfigured
                    ? `${blockedAppsCount} apps selected`
                    : 'Select apps to block'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Shield attempts indicator during session */}
            {isBlocking && shieldAttempts > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/20 border border-orange-400/30">
                <AlertTriangle className="w-3 h-3 text-orange-300" />
                <span className="text-xs font-semibold text-orange-300">{shieldAttempts}</span>
              </div>
            )}

            {!isTimerRunning && (
              isExpanded ? (
                <ChevronUp className="w-5 h-5 text-white/40" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/40" />
              )
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && !isTimerRunning && (
          <div className="px-4 pb-4 border-t border-white/10">
            {/* Native iOS picker button */}
            {isNative && (
              <button
                onClick={openAppPicker}
                className={cn(
                  "w-full mt-3 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all",
                  "bg-gradient-to-r from-purple-500/80 to-purple-600/80",
                  "hover:from-purple-400/80 hover:to-purple-500/80",
                  "active:scale-[0.98]",
                  "text-white flex items-center justify-center gap-2"
                )}
              >
                <Sparkles className="w-4 h-4" />
                Choose Apps to Block
              </button>
            )}

            {/* App grid for selection */}
            <div className="mt-3 grid grid-cols-4 gap-2">
              {simulatedApps.map((app) => (
                <AppBlockButton
                  key={app.id}
                  app={app}
                  onToggle={(blocked) => handleToggleApp(app.id, blocked)}
                />
              ))}
            </div>

            {/* Info text */}
            <p className="mt-3 text-[10px] text-white/40 text-center">
              {isNativePlatform
                ? "Selected apps will be blocked when you start a focus session"
                : "App blocking preview - works on iOS devices"
              }
            </p>
          </div>
        )}

        {/* Timer running indicator */}
        {isTimerRunning && isBlocking && (
          <div className="px-4 pb-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-300 font-medium">
                Focus mode active - apps are blocked
              </span>
            </div>

            {shieldAttempts > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-orange-500/10 border border-orange-400/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-300" />
                  <span className="text-xs text-orange-200">
                    {shieldAttempts === 1
                      ? "You tried to open a blocked app once"
                      : `You tried to open blocked apps ${shieldAttempts} times`
                    }
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-orange-200/60">
                  Stay focused for bonus rewards!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reward hint */}
      {hasAppsConfigured && !isTimerRunning && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] text-white/50">
            Complete sessions without opening blocked apps for bonus XP!
          </span>
        </div>
      )}
    </div>
  );
};

// Individual app block button component
interface AppBlockButtonProps {
  app: SimulatedBlockedApp;
  onToggle: (blocked: boolean) => void;
}

const AppBlockButton = ({ app, onToggle }: AppBlockButtonProps) => {
  return (
    <button
      onClick={() => onToggle(!app.isBlocked)}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
        "active:scale-95",
        app.isBlocked
          ? "bg-purple-500/30 border border-purple-400/50"
          : "bg-white/5 border border-white/10 hover:bg-white/10"
      )}
    >
      <div className="relative">
        <span className="text-xl">{app.icon}</span>
        {app.isBlocked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <span className={cn(
        "text-[9px] font-medium truncate max-w-full",
        app.isBlocked ? "text-purple-200" : "text-white/60"
      )}>
        {app.name}
      </span>
    </button>
  );
};

export default AppBlockingSection;
