import { useState, useEffect, useCallback } from 'react';
import { DeviceActivity } from '@/plugins/device-activity';
import { Capacitor } from '@capacitor/core';
import { focusModeLogger } from '@/lib/logger';
import { handleError } from '@/lib/errorHandling';

const FOCUS_MODE_STORAGE_KEY = 'petIsland_focusMode';

export interface BlockedApp {
  id: string;
  name: string;
  icon: string;
  bundleId?: string; // For native app blocking
  isBlocked: boolean;
}

export interface FocusModeSettings {
  enabled: boolean;
  strictMode: boolean; // Can't exit focus mode until timer ends
  blockNotifications: boolean;
  blockedApps: BlockedApp[];
  blockedWebsites: string[];
  allowEmergencyBypass: boolean;
  bypassCooldown: number; // seconds before bypass is available
}

// Common distracting apps with iOS bundle IDs
export const SUGGESTED_APPS: BlockedApp[] = [
  { id: 'instagram', name: 'Instagram', icon: '📸', bundleId: 'com.burbn.instagram', isBlocked: true },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', bundleId: 'com.zhiliaoapp.musically', isBlocked: true },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', bundleId: 'com.atebits.Tweetie2', isBlocked: true },
  { id: 'facebook', name: 'Facebook', icon: '👥', bundleId: 'com.facebook.Facebook', isBlocked: true },
  { id: 'youtube', name: 'YouTube', icon: '▶️', bundleId: 'com.google.ios.youtube', isBlocked: false },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', bundleId: 'com.toyopagroup.picaboo', isBlocked: false },
  { id: 'reddit', name: 'Reddit', icon: '🤖', bundleId: 'com.reddit.Reddit', isBlocked: false },
  { id: 'discord', name: 'Discord', icon: '💬', bundleId: 'com.hammerandchisel.discord', isBlocked: false },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💚', bundleId: 'net.whatsapp.WhatsApp', isBlocked: false },
  { id: 'messenger', name: 'Messenger', icon: '💬', bundleId: 'com.facebook.Messenger', isBlocked: false },
  { id: 'games', name: 'Games', icon: '🎮', bundleId: 'games', isBlocked: false },
  { id: 'news', name: 'News Apps', icon: '📰', bundleId: 'news', isBlocked: false },
];

// Common distracting websites
export const SUGGESTED_WEBSITES: string[] = [
  'instagram.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'youtube.com',
  'reddit.com',
  'twitch.tv',
  'netflix.com',
  'hulu.com',
];

const defaultSettings: FocusModeSettings = {
  enabled: true,
  strictMode: false,
  blockNotifications: true,
  blockedApps: SUGGESTED_APPS,
  blockedWebsites: ['instagram.com', 'tiktok.com', 'twitter.com', 'x.com', 'facebook.com'],
  allowEmergencyBypass: true,
  bypassCooldown: 30,
};

export const useFocusMode = () => {
  const [settings, setSettings] = useState<FocusModeSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [isNativeBlocking, setIsNativeBlocking] = useState(false);

  // Check if we're on native platform
  const isNative = Capacitor.isNativePlatform();

  // Load settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FOCUS_MODE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      handleError(error, 'Failed to load focus mode settings', {
        loggerPrefix: 'FocusMode',
        severity: 'warn',
      });
    }
    setIsLoading(false);
  }, []);

  // Check native blocking status on mount
  useEffect(() => {
    const checkNativeStatus = async () => {
      if (isNative) {
        try {
          const status = await DeviceActivity.getBlockingStatus();
          setIsNativeBlocking(status.isBlocking);
          setIsFocusModeActive(status.focusSessionActive);
        } catch (error) {
          focusModeLogger.error('Failed to check native blocking status:', error);
        }
      }
    };

    checkNativeStatus();
  }, [isNative]);

  // Save settings
  const updateSettings = useCallback((updates: Partial<FocusModeSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      try {
        localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(newSettings));
      } catch { /* storage full — state still updated in-memory */ }

      // Sync with native plugin
      if (isNative) {
        DeviceActivity.setSelectedApps({
          selection: JSON.stringify(newSettings.blockedApps)
        }).catch(err => focusModeLogger.error('Failed to set selected apps:', err));
      }

      return newSettings;
    });
  }, [isNative]);

  // Toggle app blocking
  const toggleAppBlocking = useCallback((appId: string, blocked: boolean) => {
    setSettings(prev => {
      const newApps = prev.blockedApps.map(app =>
        app.id === appId ? { ...app, isBlocked: blocked } : app
      );
      const newSettings = { ...prev, blockedApps: newApps };
      try {
        localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(newSettings));
      } catch { /* storage full — state still updated in-memory */ }

      // Sync with native plugin
      if (isNative) {
        DeviceActivity.setSelectedApps({
          selection: JSON.stringify(newApps)
        }).catch(err => focusModeLogger.error('Failed to set selected apps:', err));
      }

      return newSettings;
    });
  }, [isNative]);

  // Add blocked website
  const addBlockedWebsite = useCallback((website: string) => {
    const normalized = website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
    if (!normalized) return;

    setSettings(prev => {
      if (prev.blockedWebsites.includes(normalized)) return prev;
      const newSettings = {
        ...prev,
        blockedWebsites: [...prev.blockedWebsites, normalized],
      };
      try {
        localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(newSettings));
      } catch { /* storage full */ }
      return newSettings;
    });
  }, []);

  // Remove blocked website
  const removeBlockedWebsite = useCallback((website: string) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        blockedWebsites: prev.blockedWebsites.filter(w => w !== website),
      };
      try {
        localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(newSettings));
      } catch { /* storage full */ }
      return newSettings;
    });
  }, []);

  // Activate focus mode (called when timer starts)
  const activateFocusMode = useCallback(async () => {
    if (!settings.enabled) return;
    setIsFocusModeActive(true);

    focusModeLogger.debug('Focus mode activating', {
      blockedApps: settings.blockedApps.filter(a => a.isBlocked).map(a => a.name),
      blockedWebsites: settings.blockedWebsites,
      blockNotifications: settings.blockNotifications,
    });

    // Start native app blocking if on iOS
    if (isNative) {
      try {
        const result = await DeviceActivity.startAppBlocking();
        setIsNativeBlocking(result.success);
        focusModeLogger.debug('Native app blocking started:', result);
      } catch (error) {
        focusModeLogger.error('Failed to start native app blocking:', error);
      }
    }
  }, [settings, isNative]);

  // Deactivate focus mode (called when timer ends/stops)
  const deactivateFocusMode = useCallback(async () => {
    setIsFocusModeActive(false);
    focusModeLogger.debug('Focus mode deactivating');

    // Stop native app blocking if on iOS
    if (isNative) {
      try {
        const result = await DeviceActivity.stopAppBlocking();
        setIsNativeBlocking(false);
        focusModeLogger.debug('Native app blocking stopped:', result);
        return result;
      } catch (error) {
        focusModeLogger.error('Failed to stop native app blocking:', error);
      }
    }

    return { success: true, shieldAttempts: 0 };
  }, [isNative]);

  // Get blocked apps list
  const getBlockedApps = useCallback(() => {
    return settings.blockedApps.filter(app => app.isBlocked);
  }, [settings.blockedApps]);

  // Get count of blocked apps
  const blockedAppsCount = settings.blockedApps.filter(app => app.isBlocked).length;

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings);
    try {
      localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(defaultSettings));
    } catch { /* storage full */ }

    // Clear native selection
    if (isNative) {
      DeviceActivity.clearSelectedApps().catch(err => focusModeLogger.error('Failed to clear selected apps:', err));
    }
  }, [isNative]);

  return {
    settings,
    isLoading,
    isFocusModeActive,
    isNativeBlocking,
    isNative,
    blockedAppsCount,
    updateSettings,
    toggleAppBlocking,
    addBlockedWebsite,
    removeBlockedWebsite,
    activateFocusMode,
    deactivateFocusMode,
    getBlockedApps,
    resetToDefaults,
  };
};
