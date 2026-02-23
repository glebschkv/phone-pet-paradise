import { useState } from 'react';
import { Shield, Bell, BellOff, Lock, Unlock, Plus, Globe, Crown, AlertTriangle, ShieldCheck, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFocusMode } from '@/hooks/useFocusMode';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useDeviceActivity } from '@/hooks/useDeviceActivity';
import { Capacitor } from '@capacitor/core';
import { PremiumSubscription } from '@/components/PremiumSubscription';
import { STORAGE_KEY as TIMER_STORAGE_KEY } from '@/components/focus-timer/constants';

/** Check if a focus timer is currently running (reads persisted state) */
function isTimerCurrentlyRunning(): boolean {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);
    return !!state.isRunning;
  } catch { return false; }
}

export const SettingsFocusMode = () => {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const {
    settings,
    updateSettings,
  } = useFocusMode();
  const { isPremium } = usePremiumStatus();

  // Native Focus Shield (app blocking via Screen Time)
  const {
    isPermissionGranted: shieldPermissionGranted,
    hasAppsConfigured: shieldAppsConfigured,
    blockedAppsCount: shieldBlockedCount,
    selectedAppsCount: shieldSelectedApps,
    selectedCategoriesCount: shieldSelectedCategories,
    selectedDomainsCount: shieldSelectedDomains,
    isLoading: shieldLoading,
    requestPermissions: shieldRequestPermissions,
    openSettings: shieldOpenSettings,
    openAppPicker: shieldOpenAppPicker,
  } = useDeviceActivity();
  const isNativePlatform = Capacitor.isNativePlatform();
  const [hasAttemptedShieldPermission, setHasAttemptedShieldPermission] = useState(false);
  const timerRunning = isTimerCurrentlyRunning();

  const shieldLabel = (() => {
    const parts: string[] = [];

    // Apps part
    if (shieldSelectedApps > 0 && shieldSelectedCategories > 0) {
      parts.push(`${shieldSelectedApps} app${shieldSelectedApps !== 1 ? 's' : ''} & ${shieldSelectedCategories} group${shieldSelectedCategories !== 1 ? 's' : ''}`);
    } else if (shieldSelectedCategories > 0) {
      parts.push(`${shieldSelectedCategories} app group${shieldSelectedCategories !== 1 ? 's' : ''}`);
    } else if (shieldSelectedApps > 0) {
      parts.push(`${shieldSelectedApps} app${shieldSelectedApps !== 1 ? 's' : ''}`);
    }

    // Domains part (premium only)
    if (isPremium && shieldSelectedDomains > 0) {
      parts.push(`${shieldSelectedDomains} website${shieldSelectedDomains !== 1 ? 's' : ''}`);
    }

    return parts.join(' & ') || `${shieldBlockedCount} app${shieldBlockedCount !== 1 ? 's' : ''}`;
  })();

  return (
    <div className="space-y-4">
      {/* Main Focus Mode Card */}
      <div className="retro-game-card p-4">
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
              <Label className="text-sm font-bold text-white">Focus Mode</Label>
              <p className="text-[11px] text-purple-300/80">Block distractions during focus</p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            <div className="border-t border-purple-600/30 my-4" />

            {/* Block Notifications */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                {settings.blockNotifications ? (
                  <BellOff className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Bell className="w-4 h-4 text-purple-300/60" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">Block Notifications</p>
                  <p className="text-[11px] text-purple-300/80">Enable Do Not Disturb</p>
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
                  <Lock className="w-4 h-4 text-red-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-purple-300/60" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">Strict Mode</p>
                  <p className="text-[11px] text-purple-300/80">Session locked until timer ends</p>
                </div>
              </div>
              <Switch
                checked={settings.strictMode}
                onCheckedChange={(strictMode) => updateSettings({ strictMode })}
              />
            </div>

            {settings.strictMode && (
              <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <p className="text-[11px] font-medium">
                    Focus mode stays active until the timer completes
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
            <div className="retro-game-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  shieldPermissionGranted && (shieldAppsConfigured || shieldSelectedDomains > 0) ? "retro-level-badge" : "retro-stat-pill"
                )}>
                  {shieldPermissionGranted && (shieldAppsConfigured || shieldSelectedDomains > 0) ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-bold text-white">Focus Shield</Label>
                  <p className="text-[11px] text-purple-300/80">
                    {shieldPermissionGranted
                      ? shieldAppsConfigured || shieldSelectedDomains > 0
                        ? `${shieldLabel} will be blocked during focus`
                        : 'Tap to select apps to block'
                      : 'Block distracting apps via Screen Time'
                    }
                  </p>
                </div>
                {shieldPermissionGranted && (shieldAppsConfigured || shieldSelectedDomains > 0) && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/20 border border-green-500/30">
                    <Sparkles className="w-3 h-3 text-green-400" />
                    <span className="text-[11px] font-bold text-green-400">Active</span>
                  </div>
                )}
              </div>

              {!shieldPermissionGranted ? (
                <div className="space-y-2">
                  <p className="text-xs text-purple-300/80">
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
                      "w-full retro-arcade-btn retro-arcade-btn-purple py-2.5 px-4 text-sm",
                      shieldLoading && "opacity-50"
                    )}
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
                    disabled={timerRunning}
                    className={cn(
                      "w-full retro-arcade-btn retro-arcade-btn-purple py-2.5 px-4 text-sm",
                      timerRunning && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1.5" />
                    {timerRunning ? 'Locked During Session' : (shieldAppsConfigured ? 'Change Blocked Apps' : 'Select Apps to Block')}
                  </button>

                  {/* Website Blocking Section */}
                  <div className="border-t border-purple-600/30 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs font-bold text-white">Website Blocking</span>
                      {!isPremium && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5"
                          style={{
                            background: 'linear-gradient(180deg, hsl(35 90% 55%), hsl(25 90% 50%))',
                            border: '1px solid hsl(40 80% 65%)',
                            color: 'white',
                          }}>
                          <Crown className="w-2.5 h-2.5" />
                          Premium
                        </span>
                      )}
                      {isPremium && shieldSelectedDomains > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-green-500/20 border border-green-500/30 text-[9px] font-bold text-green-400">
                          {shieldSelectedDomains} selected
                        </span>
                      )}
                    </div>

                    {!isPremium ? (
                      /* FREE USER — Premium upsell */
                      <div className="rounded-lg p-3"
                        style={{
                          background: 'linear-gradient(135deg, hsl(35 80% 50% / 0.06) 0%, hsl(280 60% 50% / 0.04) 100%)',
                          border: '1.5px dashed hsl(35 70% 50% / 0.25)',
                        }}>
                        <p className="text-[11px] text-purple-300/80 mb-2">
                          Block distracting websites like Instagram, TikTok & more during focus sessions.
                        </p>
                        <button
                          onClick={() => setShowPremiumModal(true)}
                          className="w-full py-2 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          style={{
                            background: 'linear-gradient(180deg, hsl(35 90% 55%), hsl(25 90% 50%))',
                            border: '2px solid hsl(40 80% 65%)',
                            boxShadow: '0 3px 0 hsl(25 80% 30%), 0 0 10px hsl(35 100% 50% / 0.2)',
                            color: 'white',
                            textShadow: '0 1px 0 rgba(0,0,0,0.3)',
                          }}>
                          <Crown className="w-3 h-3" />
                          Go Premium to Unlock
                        </button>
                      </div>
                    ) : (
                      /* PREMIUM USER */
                      <div className="space-y-2">
                        {shieldSelectedDomains > 0 ? (
                          /* Has domains configured */
                          <>
                            <p className="text-[11px] text-purple-300/80">
                              {shieldSelectedDomains} website{shieldSelectedDomains !== 1 ? 's' : ''} will be blocked via Screen Time during focus.
                            </p>
                            <button
                              onClick={() => shieldOpenAppPicker()}
                              disabled={timerRunning}
                              className={cn(
                                "w-full retro-arcade-btn retro-arcade-btn-purple py-2 px-4 text-xs",
                                timerRunning && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <Globe className="w-3 h-3 inline mr-1" />
                              {timerRunning ? 'Locked During Session' : 'Change Blocked Websites'}
                            </button>
                          </>
                        ) : (
                          /* No domains yet */
                          <>
                            <p className="text-[11px] text-purple-300/80">
                              Select websites to block via Screen Time during focus sessions.
                            </p>
                            <button
                              onClick={() => shieldOpenAppPicker()}
                              disabled={timerRunning}
                              className={cn(
                                "w-full retro-arcade-btn retro-arcade-btn-purple py-2 px-4 text-xs",
                                timerRunning && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              {timerRunning ? 'Locked During Session' : 'Select Websites to Block'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <p className="text-[11px] text-purple-300">
                      Perfect focus = +25% XP & +50 coins bonus
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Card */}
          <div className="retro-game-card p-3">
            <p className="text-[11px] text-purple-300/70 text-center">
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
