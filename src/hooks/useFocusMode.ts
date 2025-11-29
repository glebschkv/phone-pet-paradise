import { useState, useEffect, useCallback } from 'react';

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

// Common distracting apps
export const SUGGESTED_APPS: BlockedApp[] = [
  { id: 'instagram', name: 'Instagram', icon: '📸', bundleId: 'com.instagram.android', isBlocked: true },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', bundleId: 'com.zhiliaoapp.musically', isBlocked: true },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', bundleId: 'com.twitter.android', isBlocked: true },
  { id: 'facebook', name: 'Facebook', icon: '👥', bundleId: 'com.facebook.katana', isBlocked: true },
  { id: 'youtube', name: 'YouTube', icon: '▶️', bundleId: 'com.google.android.youtube', isBlocked: false },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', bundleId: 'com.snapchat.android', isBlocked: false },
  { id: 'reddit', name: 'Reddit', icon: '🤖', bundleId: 'com.reddit.frontpage', isBlocked: false },
  { id: 'discord', name: 'Discord', icon: '💬', bundleId: 'com.discord', isBlocked: false },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💚', bundleId: 'com.whatsapp', isBlocked: false },
  { id: 'messenger', name: 'Messenger', icon: '💬', bundleId: 'com.facebook.orca', isBlocked: false },
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

  // Load settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FOCUS_MODE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {
      // Invalid data, use defaults
    }
    setIsLoading(false);
  }, []);

  // Save settings
  const updateSettings = useCallback((updates: Partial<FocusModeSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  // Toggle app blocking
  const toggleAppBlocking = useCallback((appId: string, blocked: boolean) => {
    setSettings(prev => {
      const newApps = prev.blockedApps.map(app =>
        app.id === appId ? { ...app, isBlocked: blocked } : app
      );
      const newSettings = { ...prev, blockedApps: newApps };
      localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

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
      localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(newSettings));
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
      localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  // Activate focus mode (called when timer starts)
  const activateFocusMode = useCallback(() => {
    if (!settings.enabled) return;
    setIsFocusModeActive(true);

    // In production, this would trigger native app blocking via Capacitor plugin
    // For now, we just track the state
    console.log('Focus mode activated', {
      blockedApps: settings.blockedApps.filter(a => a.isBlocked).map(a => a.name),
      blockedWebsites: settings.blockedWebsites,
      blockNotifications: settings.blockNotifications,
    });

    // Request notification permission if needed
    if (settings.blockNotifications && 'Notification' in window) {
      // In a real implementation, we'd use native APIs to enable DND mode
    }
  }, [settings]);

  // Deactivate focus mode (called when timer ends/stops)
  const deactivateFocusMode = useCallback(() => {
    setIsFocusModeActive(false);
    console.log('Focus mode deactivated');
  }, []);

  // Get blocked apps list
  const getBlockedApps = useCallback(() => {
    return settings.blockedApps.filter(app => app.isBlocked);
  }, [settings.blockedApps]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(defaultSettings));
  }, []);

  return {
    settings,
    isLoading,
    isFocusModeActive,
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
