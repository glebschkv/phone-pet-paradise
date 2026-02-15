import { useState } from 'react';
import { Shield, Bell, BellOff, Lock, Unlock, Plus, X, Globe, Crown, AlertTriangle, ShieldCheck, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFocusMode, SUGGESTED_WEBSITES } from '@/hooks/useFocusMode';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useDeviceActivity } from '@/hooks/useDeviceActivity';
import { Capacitor } from '@capacitor/core';
import { PremiumSubscription } from '@/components/PremiumSubscription';

export const SettingsFocusMode = () => {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const {
    settings,
    updateSettings,
    addBlockedWebsite,
    removeBlockedWebsite,
  } = useFocusMode();
  const { isPremium } = usePremiumStatus();
  const [newWebsite, setNewWebsite] = useState('');

  // Native Focus Shield (app blocking via Screen Time)
  const {
    isPermissionGranted: shieldPermissionGranted,
    hasAppsConfigured: shieldAppsConfigured,
    blockedAppsCount: shieldBlockedCount,
    selectedAppsCount: shieldSelectedApps,
    selectedCategoriesCount: shieldSelectedCategories,
    isLoading: shieldLoading,
    requestPermissions: shieldRequestPermissions,
    openSettings: shieldOpenSettings,
    openAppPicker: shieldOpenAppPicker,
  } = useDeviceActivity();
  const isNativePlatform = Capacitor.isNativePlatform();
  const [hasAttemptedShieldPermission, setHasAttemptedShieldPermission] = useState(false);

  const shieldLabel = (() => {
    if (shieldSelectedApps > 0 && shieldSelectedCategories > 0) {
      return `${shieldSelectedApps} app${shieldSelectedApps !== 1 ? 's' : ''} & ${shieldSelectedCategories} group${shieldSelectedCategories !== 1 ? 's' : ''}`;
    }
    if (shieldSelectedCategories > 0) {
      return `${shieldSelectedCategories} app group${shieldSelectedCategories !== 1 ? 's' : ''}`;
    }
    return `${shieldBlockedCount} app${shieldBlockedCount !== 1 ? 's' : ''}`;
  })();

  const handleAddWebsite = () => {
    if (newWebsite.trim()) {
      addBlockedWebsite(newWebsite.trim());
      setNewWebsite('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Focus Mode Card */}
      <div className="retro-card p-4">
        {/* Enable Focus Mode */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              settings.enabled ? "retro-level-badge" : "retro-stat-pill"
            )}>
              <Shield className={cn("w-4 h-4", settings.enabled ? "" : "text-muted-foreground")} />
            </div>
            <div>
              <Label className="text-sm font-bold">Focus Mode</Label>
              <p className="text-[11px] text-muted-foreground">Block distractions during focus</p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            <div className="border-t border-border/30 my-4" />

            {/* Block Notifications */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {settings.blockNotifications ? (
                  <BellOff className="w-4 h-4 text-primary" />
                ) : (
                  <Bell className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-semibold">Block Notifications</p>
                  <p className="text-[11px] text-muted-foreground">Enable Do Not Disturb</p>
                </div>
              </div>
              <Switch
                checked={settings.blockNotifications}
                onCheckedChange={(blockNotifications) => updateSettings({ blockNotifications })}
              />
            </div>

            {/* Strict Mode */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {settings.strictMode ? (
                  <Lock className="w-4 h-4 text-red-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-semibold">Strict Mode</p>
                  <p className="text-[11px] text-muted-foreground">Can't quit until timer ends</p>
                </div>
              </div>
              <Switch
                checked={settings.strictMode}
                onCheckedChange={(strictMode) => updateSettings({ strictMode })}
              />
            </div>

            {settings.strictMode && (
              <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <p className="text-[11px] font-medium">
                    You won't be able to exit focus mode until the timer completes
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {settings.enabled && (
        <>
          {/* Focus Shield — Native App Blocking (iOS) */}
          {isNativePlatform && (
            <div className="retro-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  shieldPermissionGranted && shieldAppsConfigured ? "retro-level-badge" : "retro-stat-pill"
                )}>
                  {shieldPermissionGranted && shieldAppsConfigured ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-bold">Focus Shield</Label>
                  <p className="text-[11px] text-muted-foreground">
                    {shieldPermissionGranted
                      ? shieldAppsConfigured
                        ? `${shieldLabel} will be blocked during focus`
                        : 'Tap to select apps to block'
                      : 'Block distracting apps via Screen Time'
                    }
                  </p>
                </div>
                {shieldPermissionGranted && shieldAppsConfigured && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Sparkles className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <span className="text-[11px] font-bold text-green-700 dark:text-green-400">Active</span>
                  </div>
                )}
              </div>

              {!shieldPermissionGranted ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {hasAttemptedShieldPermission
                      ? "Screen Time permission is needed. You can update this in Settings."
                      : "Screen Time access lets the app block distracting apps during focus sessions and earn bonus rewards."
                    }
                  </p>
                  <button
                    onClick={async () => {
                      setHasAttemptedShieldPermission(true);
                      await shieldRequestPermissions();
                    }}
                    disabled={shieldLoading}
                    className={cn(
                      "w-full py-2.5 px-4 rounded-lg font-bold text-sm transition-all active:scale-95",
                      "bg-gradient-to-b from-purple-500 to-purple-600 text-white",
                      shieldLoading && "opacity-50"
                    )}
                    style={{ boxShadow: '0 2px 0 hsl(260 50% 35%)' }}
                  >
                    <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                    {shieldLoading ? 'Requesting...' : hasAttemptedShieldPermission ? 'Try Again' : 'Continue'}
                  </button>
                  {hasAttemptedShieldPermission && (
                    <button
                      onClick={() => shieldOpenSettings()}
                      className="w-full py-2.5 px-4 rounded-lg font-bold text-sm transition-all active:scale-95 retro-stat-pill"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 inline mr-1.5" />
                      Open Settings
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => shieldOpenAppPicker()}
                    className={cn(
                      "w-full py-2.5 px-4 rounded-lg font-bold text-sm transition-all active:scale-95",
                      "bg-gradient-to-b from-purple-500 to-purple-600 text-white"
                    )}
                    style={{ boxShadow: '0 2px 0 hsl(260 50% 35%)' }}
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1.5" />
                    {shieldAppsConfigured ? 'Change Blocked Apps' : 'Select Apps to Block'}
                  </button>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <p className="text-[11px] text-purple-700 dark:text-purple-300">
                      Perfect focus = +25% XP & +50 coins bonus
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Card */}
          <div className="retro-stat-pill p-3">
            <p className="text-[11px] text-muted-foreground text-center">
              Focus Mode activates when you start a focus timer and deactivates when the session ends.
            </p>
          </div>
        </>
      )}
      <PremiumSubscription
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};
