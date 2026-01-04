import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { focusModeLogger } from '@/lib/logger';

export interface BlockedApp {
  id: string;
  name: string;
  icon: string;
  bundleId?: string;
  isBlocked: boolean;
}

export const SUGGESTED_APPS: BlockedApp[] = [
  { id: 'instagram', name: 'Instagram', icon: '📸', bundleId: 'com.burbn.instagram', isBlocked: true },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', bundleId: 'com.zhiliaoapp.musically', isBlocked: true },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', bundleId: 'com.atebits.Tweetie2', isBlocked: true },
  { id: 'facebook', name: 'Facebook', icon: '👥', bundleId: 'com.facebook.Facebook', isBlocked: true },
  { id: 'youtube', name: 'YouTube', icon: '▶️', bundleId: 'com.google.ios.youtube', isBlocked: false },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', bundleId: 'com.toyopagroup.picaboo', isBlocked: false },
  { id: 'reddit', name: 'Reddit', icon: '🤖', bundleId: 'com.reddit.Reddit', isBlocked: false },
  { id: 'discord', name: 'Discord', icon: '💬', bundleId: 'com.hammerandchisel.discord', isBlocked: false },
];

export interface FocusModeSettings {
  enabled: boolean;
  strictMode: boolean;
  blockNotifications: boolean;
  blockedApps: BlockedApp[];
  blockedWebsites: string[];
  allowEmergencyBypass: boolean;
  bypassCooldown: number;
}

export interface FocusState extends FocusModeSettings {
  isFocusModeActive: boolean;
  isNativeBlocking: boolean;
}

interface FocusStore extends FocusState {
  setEnabled: (enabled: boolean) => void;
  setStrictMode: (strict: boolean) => void;
  toggleAppBlocking: (appId: string, blocked: boolean) => void;
  addBlockedWebsite: (website: string) => void;
  removeBlockedWebsite: (website: string) => void;
  activateFocusMode: () => void;
  deactivateFocusMode: () => void;
  updateSettings: (settings: Partial<FocusModeSettings>) => void;
  getBlockedApps: () => BlockedApp[];
  resetToDefaults: () => void;
}

const defaultSettings: FocusModeSettings = {
  enabled: true, strictMode: false, blockNotifications: true, blockedApps: SUGGESTED_APPS,
  blockedWebsites: ['instagram.com', 'tiktok.com', 'twitter.com', 'x.com', 'facebook.com'],
  allowEmergencyBypass: true, bypassCooldown: 30,
};

const initialState: FocusState = { ...defaultSettings, isFocusModeActive: false, isNativeBlocking: false };

export const useFocusStore = create<FocusStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setEnabled: (enabled) => set({ enabled }),
      setStrictMode: (strict) => set({ strictMode: strict }),
      toggleAppBlocking: (appId, blocked) => set((s) => ({
        blockedApps: s.blockedApps.map(app => app.id === appId ? { ...app, isBlocked: blocked } : app)
      })),
      addBlockedWebsite: (website) => {
        const normalized = website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
        if (!normalized) return;
        const { blockedWebsites } = get();
        if (!blockedWebsites.includes(normalized)) set({ blockedWebsites: [...blockedWebsites, normalized] });
      },
      removeBlockedWebsite: (website) => set((s) => ({ blockedWebsites: s.blockedWebsites.filter(w => w !== website) })),
      activateFocusMode: () => set({ isFocusModeActive: true }),
      deactivateFocusMode: () => set({ isFocusModeActive: false }),
      updateSettings: (settings) => set((s) => ({ ...s, ...settings })),
      getBlockedApps: () => get().blockedApps.filter(app => app.isBlocked),
      resetToDefaults: () => set(initialState),
    }),
    {
      name: 'nomo_focus_mode',
      partialize: (state) => ({
        enabled: state.enabled, strictMode: state.strictMode, blockNotifications: state.blockNotifications,
        blockedApps: state.blockedApps, blockedWebsites: state.blockedWebsites,
        allowEmergencyBypass: state.allowEmergencyBypass, bypassCooldown: state.bypassCooldown,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          try {
            const legacy = localStorage.getItem('petIsland_focusMode');
            if (legacy) return { ...initialState, ...JSON.parse(legacy) };
          } catch { /* ignore */ }
        }
        if (state) focusModeLogger.debug('Focus store rehydrated');
      },
    }
  )
);

export const useIsFocusModeActive = () => useFocusStore((s) => s.isFocusModeActive);
export const useIsNativeBlocking = () => useFocusStore((s) => s.isNativeBlocking);
export const useFocusModeEnabled = () => useFocusStore((s) => s.enabled);
export const useBlockedApps = () => useFocusStore((s) => s.blockedApps);
export const useBlockedWebsites = () => useFocusStore((s) => s.blockedWebsites);
