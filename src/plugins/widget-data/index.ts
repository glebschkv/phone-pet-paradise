/**
 * Widget Data Service
 *
 * This service manages shared data between the React app and native widgets.
 * It stores data in a shared container (App Group on iOS) that both
 * the main app and widgets can access.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';
import { debounce } from '@/lib/debounce';
import { NETWORK_CONFIG } from '@/lib/constants';
import { widgetLogger } from '@/lib/logger';

// Widget data structure that will be shared with native widgets
export interface WidgetData {
  // Timer data
  timer: {
    isRunning: boolean;
    timeRemaining: number; // seconds
    sessionDuration: number; // seconds
    sessionType: 'pomodoro' | 'deep-work' | 'break' | null;
    category?: string;
    taskLabel?: string;
    startTime: number | null; // timestamp
  };

  // Streak data
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastSessionDate: string | null; // YYYY-MM-DD
    streakFreezes: number;
  };

  // Daily progress
  dailyProgress: {
    date: string; // YYYY-MM-DD
    focusMinutes: number;
    goalMinutes: number;
    sessionsCompleted: number;
    percentComplete: number;
  };

  // Quick stats
  stats: {
    level: number;
    totalXP: number;
    totalFocusTime: number; // all-time seconds
    totalSessions: number;
  };

  // Pet info for widget display
  petInfo: {
    activePetName: string | null;
    activePetEmoji: string | null;
    totalPetsCollected: number;
    currentBiome: string | null;
  };

  // Last updated timestamp
  lastUpdated: number;
}

// Native plugin interface
interface WidgetDataPluginInterface {
  saveData(options: { data: WidgetData }): Promise<{ success: boolean }>;
  loadData(): Promise<{ data: WidgetData | null }>;
  refreshWidgets(): Promise<{ success: boolean }>;
  updateTimer(options: { timer: Partial<WidgetData['timer']> }): Promise<{ success: boolean }>;
  updateStreak(options: { streak: Partial<WidgetData['streak']> }): Promise<{ success: boolean }>;
  updateDailyProgress(options: { dailyProgress: Partial<WidgetData['dailyProgress']> }): Promise<{ success: boolean }>;
  updateStats(options: { stats: Partial<WidgetData['stats']> }): Promise<{ success: boolean }>;
  updatePetInfo(options: { petInfo: Partial<WidgetData['petInfo']> }): Promise<{ success: boolean }>;
}

// Register native plugin
const WidgetDataPlugin = registerPlugin<WidgetDataPluginInterface>('WidgetData');

// Local storage key
const WIDGET_DATA_KEY = 'widget_data';

// Pet ID to emoji mapping for widget display
const PET_EMOJI_MAP: Record<string, { name: string; emoji: string }> = {
  'dewdrop-frog': { name: 'Dewdrop Frog', emoji: '🐸' },
  'sprout-bunny': { name: 'Sprout Bunny', emoji: '🐰' },
  'petal-puff': { name: 'Petal Puff', emoji: '🌸' },
  'honey-bee': { name: 'Honey Bee', emoji: '🐝' },
  'acorn-squirrel': { name: 'Acorn Squirrel', emoji: '🐿️' },
  'bamboo-panda': { name: 'Bamboo Panda', emoji: '🐼' },
  'honey-bear': { name: 'Honey Bear', emoji: '🐻' },
  'clover-cat': { name: 'Clover Cat', emoji: '🍀' },
  'slime-king': { name: 'Slime King', emoji: '👑' },
  'playful-cat': { name: 'Playful Cat', emoji: '🐱' },
  'happy-doggo': { name: 'Happy Doggo', emoji: '🐶' },
  'spotted-doggo': { name: 'Spotted Doggo', emoji: '🐕' },
  'mushroom-kid': { name: 'Mushroom Kid', emoji: '🍄' },
  'bunny-hood': { name: 'Bunny Hood', emoji: '🐰' },
  'star-wizard': { name: 'Star Wizard', emoji: '⭐' },
  'cat-hood': { name: 'Cat Hood', emoji: '🐱' },
  'ember-fox': { name: 'Ember Fox', emoji: '🦊' },
  'dusk-owl': { name: 'Dusk Owl', emoji: '🦉' },
  'golden-moth': { name: 'Golden Moth', emoji: '🦋' },
  'shark-hood': { name: 'Shark Hood', emoji: '🦈' },
  'wild-horse': { name: 'Wild Horse', emoji: '🐴' },
  'sea-turtle': { name: 'Sea Turtle', emoji: '🐢' },
  'golden-fox': { name: 'Golden Fox', emoji: '🦊' },
  'luna-moth': { name: 'Luna Moth', emoji: '🦋' },
  'star-jelly': { name: 'Star Jelly', emoji: '🪼' },
  'shadow-cat': { name: 'Shadow Cat', emoji: '🐈‍⬛' },
  'cute-ghost': { name: 'Cute Ghost', emoji: '👻' },
  'kitsune-spirit': { name: 'Kitsune Spirit', emoji: '🦊' },
  'mystic-kitsune': { name: 'Mystic Kitsune', emoji: '✨' },
  'vampire-bat': { name: 'Vampire Bat', emoji: '🦇' },
  'flame-spirit': { name: 'Flame Spirit', emoji: '🔥' },
  'aqua-spirit': { name: 'Aqua Spirit', emoji: '💧' },
  'storm-spirit': { name: 'Storm Spirit', emoji: '⚡' },
  'dino-kid': { name: 'Dino Kid', emoji: '🦕' },
  'dude-monster': { name: 'Dude Monster', emoji: '👾' },
  'flower-fairy': { name: 'Flower Fairy', emoji: '🧚' },
  'penguin-kid': { name: 'Penguin Kid', emoji: '🐧' },
  'pirate-kid': { name: 'Pirate Kid', emoji: '🏴‍☠️' },
  'robot-buddy': { name: 'Robot Buddy', emoji: '🤖' },
  'dragon-knight': { name: 'Dragon Knight', emoji: '🐉' },
  'goblin-king': { name: 'Goblin King', emoji: '👺' },
  'baby-dragon': { name: 'Baby Dragon', emoji: '🐲' },
  'frog-hood': { name: 'Frog Hood', emoji: '🐸' },
  'bear-hood': { name: 'Bear Hood', emoji: '🐻' },
};

class WidgetDataService {
  private data: WidgetData;
  private isNative: boolean;
  private saveToNativeDebounced: ReturnType<typeof debounce>;

  constructor() {
    this.data = this.getDefaultData();
    this.isNative = Capacitor.isNativePlatform();
    this.saveToNativeDebounced = debounce(
      ((...args: unknown[]) => this._saveToNative(args[0] as WidgetData)) as (...args: unknown[]) => void,
      NETWORK_CONFIG.DEBOUNCE.SAVE
    );
  }

  private getDefaultData(): WidgetData {
    const today = new Date().toISOString().split('T')[0];
    return {
      timer: {
        isRunning: false,
        timeRemaining: 25 * 60,
        sessionDuration: 25 * 60,
        sessionType: null,
        startTime: null,
      },
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: null,
        streakFreezes: 0,
      },
      dailyProgress: {
        date: today,
        focusMinutes: 0,
        goalMinutes: 120,
        sessionsCompleted: 0,
        percentComplete: 0,
      },
      stats: {
        level: 1,
        totalXP: 0,
        totalFocusTime: 0,
        totalSessions: 0,
      },
      petInfo: {
        activePetName: null,
        activePetEmoji: null,
        totalPetsCollected: 0,
        currentBiome: null,
      },
      lastUpdated: Date.now(),
    };
  }

  /**
   * Load widget data from storage
   */
  async load(): Promise<WidgetData> {
    try {
      // Try to load from native shared storage first (for widgets)
      if (this.isNative) {
        const nativeData = await this.loadFromNative();
        if (nativeData) {
          this.data = nativeData;
          return this.data;
        }
      }

      // Fall back to localStorage
      const stored = localStorage.getItem(WIDGET_DATA_KEY);
      if (stored) {
        this.data = { ...this.getDefaultData(), ...JSON.parse(stored) };
      }
    } catch (error) {
      widgetLogger.error('Failed to load:', error);
    }
    return this.data;
  }

  /**
   * Save widget data to storage (both localStorage and native shared storage)
   */
  async save(updates: Partial<WidgetData>): Promise<void> {
    try {
      this.data = {
        ...this.data,
        ...updates,
        lastUpdated: Date.now(),
      };

      // Save to localStorage
      localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(this.data));

      // Save to native shared storage for widgets (debounced)
      if (this.isNative) {
        this.saveToNativeDebounced(this.data);
      }
    } catch (error) {
      widgetLogger.error('Failed to save:', error);
    }
  }

  /**
   * Update timer data
   */
  async updateTimer(timerData: Partial<WidgetData['timer']>): Promise<void> {
    this.data.timer = { ...this.data.timer, ...timerData };
    this.data.lastUpdated = Date.now();

    localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(this.data));

    if (this.isNative) {
      try {
        await WidgetDataPlugin.updateTimer({ timer: timerData });
      } catch (error) {
        widgetLogger.error('Failed to update timer:', error);
      }
    }
  }

  /**
   * Update streak data
   */
  async updateStreak(streakData: Partial<WidgetData['streak']>): Promise<void> {
    this.data.streak = { ...this.data.streak, ...streakData };
    this.data.lastUpdated = Date.now();

    localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(this.data));

    if (this.isNative) {
      try {
        await WidgetDataPlugin.updateStreak({ streak: streakData });
      } catch (error) {
        widgetLogger.error('Failed to update streak:', error);
      }
    }
  }

  /**
   * Update daily progress
   */
  async updateDailyProgress(progressData: Partial<WidgetData['dailyProgress']>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Reset if it's a new day
    if (this.data.dailyProgress.date !== today) {
      this.data.dailyProgress = {
        date: today,
        focusMinutes: 0,
        goalMinutes: this.data.dailyProgress.goalMinutes,
        sessionsCompleted: 0,
        percentComplete: 0,
      };
    }

    const newProgress = { ...this.data.dailyProgress, ...progressData };
    newProgress.percentComplete = Math.min(
      100,
      Math.round((newProgress.focusMinutes / newProgress.goalMinutes) * 100)
    );

    this.data.dailyProgress = newProgress;
    this.data.lastUpdated = Date.now();

    localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(this.data));

    if (this.isNative) {
      try {
        await WidgetDataPlugin.updateDailyProgress({ dailyProgress: newProgress });
      } catch (error) {
        widgetLogger.error('Failed to update daily progress:', error);
      }
    }
  }

  /**
   * Update stats
   */
  async updateStats(statsData: Partial<WidgetData['stats']>): Promise<void> {
    this.data.stats = { ...this.data.stats, ...statsData };
    this.data.lastUpdated = Date.now();

    localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(this.data));

    if (this.isNative) {
      try {
        await WidgetDataPlugin.updateStats({ stats: statsData });
      } catch (error) {
        widgetLogger.error('Failed to update stats:', error);
      }
    }
  }

  /**
   * Update pet info
   */
  async updatePetInfo(petData: Partial<WidgetData['petInfo']>): Promise<void> {
    this.data.petInfo = { ...this.data.petInfo, ...petData };
    this.data.lastUpdated = Date.now();

    localStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(this.data));

    if (this.isNative) {
      try {
        await WidgetDataPlugin.updatePetInfo({ petInfo: petData });
      } catch (error) {
        widgetLogger.error('Failed to update pet info:', error);
      }
    }
  }

  /**
   * Get current widget data
   */
  getData(): WidgetData {
    return this.data;
  }

  /**
   * Force refresh all widgets
   */
  async refreshWidgets(): Promise<void> {
    if (this.isNative) {
      try {
        await WidgetDataPlugin.refreshWidgets();
      } catch (error) {
        widgetLogger.error('Failed to refresh widgets:', error);
      }
    }
  }

  /**
   * Sync all data from app state
   * Call this when the app starts or when significant changes occur
   */
  async syncFromAppState(): Promise<void> {
    try {
      // Load timer state
      const timerState = storage.get<{
        isRunning?: boolean;
        timeLeft?: number;
        sessionDuration?: number;
        sessionType?: string;
        category?: string;
        taskLabel?: string;
        startTime?: number;
      }>(STORAGE_KEYS.TIMER_STATE);

      if (timerState) {
        await this.updateTimer({
          isRunning: timerState.isRunning ?? false,
          timeRemaining: timerState.timeLeft ?? 25 * 60,
          sessionDuration: timerState.sessionDuration ?? 25 * 60,
          sessionType: (timerState.sessionType as WidgetData['timer']['sessionType']) ?? null,
          category: timerState.category,
          taskLabel: timerState.taskLabel,
          startTime: timerState.startTime ?? null,
        });
      }

      // Load streak data
      const streakData = storage.get<{
        currentStreak?: number;
        longestStreak?: number;
        lastSessionDate?: string;
        streakFreezes?: number;
      }>(STORAGE_KEYS.STREAK_DATA);

      if (streakData) {
        await this.updateStreak({
          currentStreak: streakData.currentStreak ?? 0,
          longestStreak: streakData.longestStreak ?? 0,
          lastSessionDate: streakData.lastSessionDate ?? null,
          streakFreezes: streakData.streakFreezes ?? 0,
        });
      }

      // Load XP/level data
      const xpData = storage.get<{
        level?: number;
        totalXP?: number;
      }>(STORAGE_KEYS.XP_SYSTEM);

      if (xpData) {
        await this.updateStats({
          level: xpData.level ?? 1,
          totalXP: xpData.totalXP ?? 0,
        });
      }

      // Load analytics data
      const analyticsRecords = storage.get<{
        totalFocusTime?: number;
        totalSessions?: number;
      }>(STORAGE_KEYS.ANALYTICS_RECORDS);

      if (analyticsRecords) {
        await this.updateStats({
          totalFocusTime: analyticsRecords.totalFocusTime ?? 0,
          totalSessions: analyticsRecords.totalSessions ?? 0,
        });
      }

      // Load today's stats
      const dailyStats = storage.get<Record<string, {
        totalFocusTime?: number;
        sessionsCompleted?: number;
      }>>(STORAGE_KEYS.ANALYTICS_DAILY_STATS);

      const today = new Date().toISOString().split('T')[0];
      const todayStats = dailyStats?.[today];

      if (todayStats) {
        await this.updateDailyProgress({
          focusMinutes: Math.floor((todayStats.totalFocusTime ?? 0) / 60),
          sessionsCompleted: todayStats.sessionsCompleted ?? 0,
        });
      }

      // Load goal settings
      const analyticsSettings = storage.get<{
        dailyGoalMinutes?: number;
      }>(STORAGE_KEYS.ANALYTICS_SETTINGS);

      if (analyticsSettings?.dailyGoalMinutes) {
        await this.updateDailyProgress({
          goalMinutes: analyticsSettings.dailyGoalMinutes,
        });
      }

      // Load pet info from collection and XP stores
      const collectionData = localStorage.getItem('petparadise-collection');
      const xpSystemData = storage.get<{
        currentBiome?: string;
        unlockedAnimals?: string[];
      }>(STORAGE_KEYS.XP_SYSTEM);

      let activePetName: string | null = null;
      let activePetEmoji: string | null = null;
      let totalPetsCollected = 0;

      if (collectionData) {
        try {
          const parsed = JSON.parse(collectionData);
          const state = parsed?.state;
          const activeHomePets: string[] = state?.activeHomePets ?? [];
          if (activeHomePets.length > 0) {
            const petId = activeHomePets[0];
            const petInfo = PET_EMOJI_MAP[petId];
            if (petInfo) {
              activePetName = petInfo.name;
              activePetEmoji = petInfo.emoji;
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      if (xpSystemData?.unlockedAnimals) {
        totalPetsCollected = xpSystemData.unlockedAnimals.length;
      }

      // Also count shop-bought pets
      const shopData = localStorage.getItem('petIsland_shopInventory');
      if (shopData) {
        try {
          const parsed = JSON.parse(shopData);
          const state = parsed?.state;
          const ownedCharacters: string[] = state?.ownedCharacters ?? [];
          // Add unique shop pets not already counted
          const unlocked = new Set(xpSystemData?.unlockedAnimals ?? []);
          for (const id of ownedCharacters) {
            if (!unlocked.has(id)) {
              totalPetsCollected++;
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      await this.updatePetInfo({
        activePetName,
        activePetEmoji,
        totalPetsCollected,
        currentBiome: xpSystemData?.currentBiome ?? null,
      });
    } catch (error) {
      widgetLogger.error('Failed to sync from app state:', error);
    }
  }

  // Private methods
  private async loadFromNative(): Promise<WidgetData | null> {
    try {
      const result = await WidgetDataPlugin.loadData();
      return result.data;
    } catch (error) {
      widgetLogger.error('Failed to load from native:', error);
      return null;
    }
  }

  private async _saveToNative(data: WidgetData): Promise<void> {
    try {
      await WidgetDataPlugin.saveData({ data });
    } catch (error) {
      widgetLogger.error('Failed to save to native:', error);
    }
  }
}

// Export singleton instance
export const widgetDataService = new WidgetDataService();

// Export the plugin for direct access if needed
export { WidgetDataPlugin };
