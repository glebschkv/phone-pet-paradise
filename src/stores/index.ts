// Central export for all stores

// Shop Store
export { useShopStore, useOwnedCharacters, useOwnedBackgrounds, useEquippedBackground } from './shopStore';
export type { ShopInventory } from './shopStore';

// Theme Store
export { useThemeStore, useHomeBackground } from './themeStore';

// Collection Store
export { useCollectionStore, useActiveHomePets, useFavorites } from './collectionStore';

// Navigation Store
export {
  useNavigationStore,
  useActiveTab,
  useActiveModal,
  useModalData,
  useCanGoBack,
  useNavigationActions,
  setupLegacyEventBridge,
  onTabChange,
  onModalChange,
} from './navigationStore';
export type { MainTab, ModalType } from './navigationStore';

// XP Store
export { useXPStore, useCurrentXP, useCurrentLevel, useUnlockedAnimals, useCurrentBiome, useAvailableBiomes, MAX_LEVEL, calculateLevelRequirement } from './xpStore';
export type { XPState } from './xpStore';

// Coin Store
export { useCoinStore, useCoinBalance, useTotalEarned, useTotalSpent } from './coinStore';
export type { CoinState } from './coinStore';

// Premium Store
export { usePremiumStore, useTier, useIsPremium, useIsPremiumPlus, useIsLifetime, TIER_BENEFITS } from './premiumStore';
export type { SubscriptionTier, PremiumState } from './premiumStore';

// Streak Store
export { useStreakStore, useCurrentStreak, useLongestStreak, useStreakFreezeCount, useTotalSessions, STREAK_REWARDS } from './streakStore';
export type { StreakState, StreakReward } from './streakStore';

// Auth Store
export { useAuthStore, useGuestId, useIsGuestMode, useHasChosenGuestMode } from './authStore';
export type { AuthState } from './authStore';

// Focus Store
export { useFocusStore, useIsFocusModeActive, useIsNativeBlocking, useFocusModeEnabled, useBlockedApps, useBlockedWebsites, SUGGESTED_APPS } from './focusStore';
export type { FocusModeSettings, FocusState, BlockedApp } from './focusStore';

// Sound Store
export { useSoundStore, useSoundLayers, useMasterVolume, useAmbientSound, useAmbientVolume, useIsSoundPlaying } from './soundStore';
export type { SoundLayer, SoundMixerState, AmbientSoundState } from './soundStore';

// Quest Store
export { useQuestStore, useQuests, useActiveQuests, useDailyQuests, useWeeklyQuests } from './questStore';
export type { Quest, QuestObjective, QuestReward } from './questStore';

// Onboarding Store
export { useOnboardingStore, useHasCompletedOnboarding, useOnboardingSteps, useCurrentStepIndex } from './onboardingStore';
export type { OnboardingStep } from './onboardingStore';
