# API & Data Layer Documentation

This document describes the data layer architecture, database schema, and key data hooks in Phone Pet Paradise.

## Overview

The application uses a hybrid data architecture:

| Mode | Storage | Sync |
|------|---------|------|
| **Guest Mode** | localStorage | No cloud sync |
| **Authenticated** | Supabase (PostgreSQL) | Real-time sync |
| **Offline** | localStorage queue | Syncs when online |

## Supabase Configuration

### Setup

Environment variables required:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

### Client Setup

The Supabase client is configured in `src/integrations/supabase/client.ts`:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Check if Supabase is configured
import { isSupabaseConfigured } from '@/integrations/supabase/client';
```

Security features:
- Uses `sessionStorage` on web (cleared on tab close)
- Uses `localStorage` on mobile (Capacitor) for persistence
- Auto-refresh tokens enabled

## Database Schema

### Tables

#### `profiles`

User profile information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Auth user ID |
| `display_name` | text | Display name |
| `avatar_url` | text | Avatar URL |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update |

#### `user_progress`

User progression data (XP, levels, streaks).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Auth user ID |
| `total_xp` | integer | Total XP earned |
| `current_level` | integer | Current level |
| `current_streak` | integer | Current streak days |
| `longest_streak` | integer | Best streak achieved |
| `streak_freeze_count` | integer | Streak freezes owned |
| `total_sessions` | integer | Total focus sessions |
| `last_session_date` | date | Last activity date |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update |

#### `pets`

User's pet collection.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Auth user ID |
| `pet_type` | text | Pet type identifier |
| `name` | text | Pet name |
| `bond_level` | integer | Bond level (0-100) |
| `mood` | integer | Current mood (0-100) |
| `experience` | integer | Pet XP |
| `is_favorite` | boolean | Favorite flag |
| `unlocked_at` | timestamp | Unlock time |
| `created_at` | timestamp | Creation time |

#### `focus_sessions`

Completed focus sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Auth user ID |
| `duration_minutes` | integer | Session length |
| `session_type` | text | Session type |
| `xp_earned` | integer | XP from session |
| `completed_at` | timestamp | Completion time |

#### `achievements`

Unlocked achievements.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Auth user ID |
| `achievement_type` | text | Achievement ID |
| `title` | text | Achievement title |
| `description` | text | Description |
| `reward_xp` | integer | XP reward |
| `unlocked_at` | timestamp | Unlock time |

#### `quests`

Active and completed quests.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Auth user ID |
| `quest_type` | text | Quest type |
| `title` | text | Quest title |
| `description` | text | Description |
| `target_value` | integer | Target to complete |
| `current_progress` | integer | Current progress |
| `reward_xp` | integer | XP reward |
| `completed_at` | timestamp | Completion time |
| `created_at` | timestamp | Creation time |

## Local Storage

### Storage Keys

All storage keys are centralized in `src/lib/storage-keys.ts`:

```typescript
import { STORAGE_KEYS, storage } from '@/lib/storage-keys';

// Type-safe storage access
const xpData = storage.get<XPState>(STORAGE_KEYS.XP_SYSTEM);
storage.set(STORAGE_KEYS.COIN_SYSTEM, coinData);
```

### Key Categories

| Category | Keys |
|----------|------|
| **Auth** | `GUEST_ID`, `GUEST_CHOSEN` |
| **Progress** | `XP_SYSTEM`, `STREAK_DATA`, `ACHIEVEMENTS`, `QUESTS` |
| **Collection** | `COLLECTION`, `FAVORITES`, `BOND_DATA` |
| **Shop** | `SHOP_INVENTORY`, `COIN_SYSTEM`, `COIN_BOOSTER` |
| **Focus** | `FOCUS_MODE`, `FOCUS_PRESETS`, `TIMER_STATE` |
| **Settings** | `APP_SETTINGS`, `THEME`, `SOUND_SETTINGS` |
| **Gamification** | `BATTLE_PASS`, `COMBO_SYSTEM`, `LUCKY_WHEEL` |

### Storage Utility

```typescript
import { storage, STORAGE_KEYS } from '@/lib/storage-keys';

// Get value with type safety
const coins = storage.get<number>(STORAGE_KEYS.COIN_SYSTEM);

// Get with default value
const settings = storage.getWithDefault(STORAGE_KEYS.APP_SETTINGS, defaultSettings);

// Update partial object
storage.update(STORAGE_KEYS.APP_SETTINGS, { soundEnabled: false });

// Check existence
if (storage.has(STORAGE_KEYS.ONBOARDING_COMPLETED)) { ... }

// Clear all app data
storage.clearAll();
```

## Data Hooks

### Core Data Hook

#### `useSupabaseData`

Central hook for user data management. Handles both guest mode (localStorage) and authenticated mode (Supabase).

```typescript
import { useSupabaseData } from '@/hooks/useSupabaseData';

const {
  profile,      // User profile
  progress,     // XP, levels, streaks
  pets,         // Pet collection
  isLoading,    // Loading state
  updateProfile,
  updateProgress,
  addPet,
  updatePet,
} = useSupabaseData();
```

### Authentication

#### `useAuth`

Authentication state and actions.

```typescript
import { useAuth } from '@/hooks/useAuth';

const {
  user,           // Current user object
  isAuthenticated,// Is logged in
  isGuestMode,    // Is guest user
  signIn,         // Sign in with email
  signUp,         // Create account
  signOut,        // Sign out
  continueAsGuest,// Start guest mode
} = useAuth();
```

### Progression Systems

#### `useXPSystem`

XP and level management.

```typescript
import { useXPSystem } from '@/hooks/useXPSystem';

const {
  currentXP,
  currentLevel,
  xpToNextLevel,
  addXP,
  getXPProgress,
} = useXPSystem();
```

#### `useCoinSystem`

In-game currency.

```typescript
import { useCoinSystem } from '@/hooks/useCoinSystem';

const {
  coins,
  addCoins,
  spendCoins,
  hasEnoughCoins,
} = useCoinSystem();
```

#### `useStreakSystem`

Streak tracking.

```typescript
import { useStreakSystem } from '@/hooks/useStreakSystem';

const {
  currentStreak,
  longestStreak,
  lastCheckIn,
  streakFreezes,
  checkIn,
  useStreakFreeze,
} = useStreakSystem();
```

### Gamification

#### `useAchievementSystem`

Achievement unlocking and tracking.

```typescript
import { useAchievementSystem } from '@/hooks/useAchievementSystem';

const {
  achievements,
  unlockedAchievements,
  checkAchievement,
  unlockAchievement,
  getProgress,
} = useAchievementSystem();
```

#### `useQuestSystem`

Daily quests.

```typescript
import { useQuestSystem } from '@/hooks/useQuestSystem';

const {
  activeQuests,
  completedQuests,
  updateQuestProgress,
  completeQuest,
  refreshDailyQuests,
} = useQuestSystem();
```

### Shop & Inventory

#### `useShop`

Shop purchases and inventory.

```typescript
import { useShop } from '@/hooks/useShop';

const {
  inventory,
  purchaseItem,
  equipItem,
  isItemOwned,
} = useShop();
```

### Focus Mode

#### `useFocusMode`

Focus session management.

```typescript
import { useFocusMode } from '@/hooks/useFocusMode';

const {
  isActive,
  duration,
  remaining,
  startSession,
  endSession,
  pauseSession,
} = useFocusMode();
```

## Zustand Stores

Global state is managed with Zustand stores in `src/stores/`:

| Store | Purpose |
|-------|---------|
| `authStore` | Authentication state |
| `xpStore` | XP and level state |
| `coinStore` | Currency balance |
| `shopStore` | Inventory and equipped items |
| `streakStore` | Streak data |
| `questStore` | Active quests |
| `focusStore` | Focus mode state |
| `premiumStore` | Premium subscription |
| `themeStore` | Theme settings |
| `collectionStore` | Pet collection |
| `offlineSyncStore` | Offline action queue |

### Store Pattern

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CoinState {
  coins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
}

export const useCoinStore = create<CoinState>()(
  persist(
    (set, get) => ({
      coins: 0,
      addCoins: (amount) => set((state) => ({
        coins: state.coins + amount
      })),
      spendCoins: (amount) => {
        if (get().coins >= amount) {
          set((state) => ({ coins: state.coins - amount }));
          return true;
        }
        return false;
      },
    }),
    { name: 'nomo_coin_system' }
  )
);
```

## Offline Support

### Offline Sync Manager

The app queues actions when offline and syncs when connectivity returns.

```typescript
import { useOfflineSyncManager } from '@/hooks/useOfflineSyncManager';

const {
  isOnline,
  pendingActions,
  queueAction,
  syncPendingActions,
} = useOfflineSyncManager();
```

### Offline Store

```typescript
import { useOfflineSyncStore } from '@/stores/offlineSyncStore';

const {
  queue,           // Pending actions
  addToQueue,      // Queue an action
  processQueue,    // Process all pending
  clearQueue,      // Clear queue
} = useOfflineSyncStore();
```

### Queued Action Format

```typescript
interface OfflineAction {
  id: string;
  type: 'UPDATE_PROGRESS' | 'ADD_ACHIEVEMENT' | 'COMPLETE_QUEST' | ...;
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}
```

## Data Flow

### Guest Mode

```
User Action → Hook → Zustand Store → localStorage
                              ↓
                        Component Re-render
```

### Authenticated Mode

```
User Action → Hook → Zustand Store → Supabase
                              ↓            ↓
                        Component    Real-time Sync
                        Re-render
```

### Offline Mode

```
User Action → Hook → Offline Queue → localStorage
                                          ↓
                    [When Online] → Supabase Sync
```

## Type Definitions

Types are defined in `src/types/`:

| File | Contents |
|------|----------|
| `app.ts` | Core app types |
| `achievements.ts` | Achievement definitions |
| `gamification.ts` | Gamification types |
| `rewards.ts` | Reward system types |
| `shop.ts` | Shop/inventory types |
| `xp-system.ts` | XP system types |
| `quest-system.ts` | Quest types |
| `supabase-models.ts` | Database model types |

### Using Types

```typescript
import type { Achievement, AchievementProgress } from '@/types/achievements';
import type { ShopItem, Inventory } from '@/types/shop';
import type { Tables } from '@/integrations/supabase/types';

// Database row type
type Pet = Tables<'pets'>;
```

## Error Handling

### API Utilities

```typescript
import { fetchWithRetry, handleApiError } from '@/lib/apiUtils';

try {
  const data = await fetchWithRetry('/api/endpoint', {
    retries: 3,
    backoff: 'exponential',
  });
} catch (error) {
  handleApiError(error, 'Failed to fetch data');
}
```

### Error Reporting

```typescript
import { reportError } from '@/lib/errorReporting';

try {
  // risky operation
} catch (error) {
  reportError(error, { context: 'ShopPurchase', userId });
}
```

## Best Practices

1. **Use hooks for data access** - Don't access stores directly in components
2. **Type your data** - Use TypeScript types from `src/types/`
3. **Handle loading states** - Show skeletons while data loads
4. **Handle errors gracefully** - Use error boundaries and fallbacks
5. **Queue offline actions** - Use the offline sync manager for mutations
6. **Use storage keys** - Never hardcode localStorage keys
