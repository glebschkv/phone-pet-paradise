import { useState } from 'react';
import { Shield, Bell, BellOff, Lock, Unlock, Plus, X, Globe, Smartphone, Crown, AlertTriangle, ShieldCheck, ShieldOff, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFocusMode, SUGGESTED_WEBSITES } from '@/hooks/useFocusMode';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useDeviceActivity } from '@/hooks/useDeviceActivity';
import { Capacitor } from '@capacitor/core';

export const SettingsFocusMode = () => {
  const {
    settings,
    updateSettings,
    toggleAppBlocking,
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

  const blockedAppsCount = settings.blockedApps.filter(a => a.isBlocked).length;

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
              <p className="text-[10px] text-muted-foreground">Block distractions during focus</p>
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
                  <p className="text-[10px] text-muted-foreground">Enable Do Not Disturb</p>
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
                  <p className="text-[10px] text-muted-foreground">Can't quit until timer ends</p>
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
                  <p className="text-[10px] font-medium">
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
                  <p className="text-[10px] text-muted-foreground">
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
                    <span className="text-[10px] font-bold text-green-700 dark:text-green-400">Active</span>
                  </div>
                )}
              </div>

              {!shieldPermissionGranted ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {hasAttemptedShieldPermission
                      ? "Screen Time permission is needed. Open Settings to enable it."
                      : "Enable Screen Time access to block apps during focus sessions and earn bonus rewards!"
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
                    {shieldLoading ? 'Requesting...' : hasAttemptedShieldPermission ? 'Try Again' : 'Enable Focus Shield'}
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
                    <p className="text-[10px] text-purple-700 dark:text-purple-300">
                      Perfect focus = +25% XP & +50 coins bonus
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Blocked Apps */}
          <div className="retro-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                <Label className="text-sm font-bold">Blocked Apps</Label>
              </div>
              <span className="text-xs text-muted-foreground">
                {blockedAppsCount} selected
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {settings.blockedApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => toggleAppBlocking(app.id, !app.isBlocked)}
                  className={cn(
                    "p-2 rounded-xl flex flex-col items-center gap-1 transition-all",
                    app.isBlocked
                      ? "bg-red-100 dark:bg-red-900/30 ring-2 ring-red-400"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <span className="text-xl">{app.icon}</span>
                  <span className="text-[9px] font-semibold text-center line-clamp-1">
                    {app.name}
                  </span>
                  {app.isBlocked && (
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              Tap apps to toggle blocking during focus sessions
            </p>
          </div>

          {/* Blocked Websites */}
          <div className="retro-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <Label className="text-sm font-bold">Blocked Websites</Label>
              </div>
              {!isPremium && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Crown className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">Premium</span>
                </div>
              )}
            </div>

            {isPremium ? (
              <>
                {/* Add website input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWebsite()}
                    placeholder="Add website (e.g. reddit.com)"
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddWebsite}
                    className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Blocked websites list */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {settings.blockedWebsites.map((website) => (
                    <div
                      key={website}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <span className="text-sm">{website}</span>
                      <button
                        onClick={() => removeBlockedWebsite(website)}
                        className="w-6 h-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Suggested websites */}
                {settings.blockedWebsites.length < SUGGESTED_WEBSITES.length && (
                  <div className="mt-3">
                    <p className="text-[10px] text-muted-foreground mb-2">Suggested:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_WEBSITES.filter(w => !settings.blockedWebsites.includes(w)).slice(0, 5).map((website) => (
                        <button
                          key={website}
                          onClick={() => addBlockedWebsite(website)}
                          className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          + {website}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium mb-1">Website Blocking</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Block distracting websites during focus sessions
                </p>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-white text-sm font-bold">
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="retro-stat-pill p-3">
            <p className="text-[10px] text-muted-foreground text-center">
              Focus Mode activates when you start a focus timer and deactivates when the session ends.
              {!isPremium && " Upgrade to Premium to unlock website blocking."}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
