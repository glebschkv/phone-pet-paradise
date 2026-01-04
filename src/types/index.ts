/**
 * Type Definitions Index
 *
 * Central barrel export for all type definitions.
 * Import types from '@/types' for consistent type usage.
 *
 * Example:
 *   import type { Achievement, XPReward, ShopItem } from '@/types';
 */

// ============================================================================
// Reward Types
// ============================================================================

export type {
  // Base types
  RewardType,
  Rarity,
  BaseReward,
  // XP types
  XPBonusSource,
  XPReward,
  UnlockedReward,
  XPCalculationResult,
  // Coin types
  CoinRewardInfo,
  CoinReward,
  // Quest/Daily types
  QuestReward,
  StreakReward,
  DailyReward,
  // Level up types
  LevelUpResult,
  LevelReward,
  // Battle pass types
  BattlePassReward,
  // Milestone types
  MilestoneReward,
  // Boss types
  BossChallengeReward,
  BossProgressInfo,
} from './rewards';

// ============================================================================
// Achievement Types
// ============================================================================

export type {
  AchievementCategory,
  AchievementTier,
  AchievementReward,
  Achievement,
  AchievementDefinition,
  AchievementUnlockEvent,
  AchievementSystemReturn,
  AchievementTrackingHook,
} from './achievements';

export { TIER_POINTS } from './achievements';

// ============================================================================
// Plugin Types
// ============================================================================

export type {
  PluginStatus,
  PluginHealthStatus,
  PluginName,
  NativePluginStatusState,
  NativePluginContextValue,
  NativePluginProviderProps,
  BlockingStatus,
  ShieldAttempts,
  AppSelection,
  StartBlockingResult,
  StopBlockingResult,
  DeviceActivityPluginInterface,
  SubscriptionStatus,
  ProductInfo,
  PurchaseResult as PluginPurchaseResult,
  WidgetData,
} from './plugins';

// ============================================================================
// Theme Types
// ============================================================================

export type {
  ThemeMode,
  AppTheme,
  ThemeState,
  BackgroundTheme,
  BackgroundConfig,
  SeasonTheme,
  SeasonThemeConfig,
  BiomeTheme,
  BiomeConfig,
  CelebrationType,
  CelebrationConfig,
} from './theme';

// ============================================================================
// Gamification Types
// ============================================================================

export type {
  // Battle Pass
  BattlePassTier,
  Season,
  // Boss
  BossDifficulty,
  BossRequirementType,
  BossRequirement,
  BossChallenge,
  // Events
  SpecialEventType,
  SpecialEvent,
  ActiveEventInfo,
  SpecialEventsState,
  // Lucky Wheel
  LuckyWheelPrizeType,
  LuckyWheelPrize,
  // Combo
  ComboTier,
  // Milestones
  MilestoneType,
  Milestone,
  // Guild
  GuildRole,
  Guild,
  GuildMember,
  GuildChallenge,
  // Quest
  QuestStatus,
  QuestType,
  Quest,
  // Focus
  FocusPreset,
} from './gamification';

// ============================================================================
// App Types
// ============================================================================

export type {
  UserProfile,
  AppSettings,
  SubscriptionTier,
  SubscriptionPlan,
  PremiumStatus,
  AppState,
  AppAction,
  AppContextValue,
  MainTab,
  ModalType,
  NavigationState,
  CollectionState,
} from './app';

export { DEFAULT_APP_SETTINGS } from './app';

// ============================================================================
// Shop Types
// ============================================================================

export type {
  ShopCategory,
  ShopItem,
  PremiumBackground,
  ProfileBadge,
  UtilityItem,
  CoinPack,
  StarterBundle,
  BackgroundBundle,
  PetBundle,
  BoosterType,
  Booster,
  ActiveBooster,
  PurchaseResult,
  PurchaseHistoryEntry,
  ShopCategoryDef,
  OwnedItems,
} from './shop';

// ============================================================================
// Analytics Types (re-export from analytics.ts)
// ============================================================================

export type {
  SessionType,
  SessionStatus,
  FocusCategory,
  FocusSession,
  DailyStats,
  AnalyticsSettings,
  PersonalRecords,
  WeeklyStats,
  AnalyticsState,
} from './analytics';

export {
  FOCUS_CATEGORIES,
  DEFAULT_ANALYTICS_SETTINGS,
  DEFAULT_PERSONAL_RECORDS,
  createEmptyDailyStats,
} from './analytics';

// ============================================================================
// XP System Types (re-export from xp-system.ts)
// ============================================================================

export type {
  XPState,
  XPProgress,
  SessionXPResult,
  FocusBonusInfo,
  StreakBonusInfo,
  EventBonusInfo,
  XPMultiplierType,
  FocusBonusType,
  XPCalculationInput,
  LevelThreshold,
  IXPSystem,
  IBackendXPSystem,
} from './xp-system';

export { getLevelThresholds, calculateSessionXP } from './xp-system';
