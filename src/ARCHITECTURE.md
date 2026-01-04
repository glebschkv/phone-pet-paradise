# State Architecture

This document describes the state management architecture after the refactoring.

## State Layers

### 1. Zustand Stores (Primary State)

These are the single sources of truth for their respective domains:

| Store | Responsibility |
|-------|---------------|
| `networkStore` | Network connectivity status (isOnline, wasOffline) |
| `offlineSyncStore` | Pending sync operations queue |
| `navigationStore` | Tab navigation and modal state |
| `xpStore` | XP and level progression |
| `coinStore` | Coin balance |
| `streakStore` | Daily streak tracking |
| `questStore` | Quest progress |
| `bondStore` | Pet bond levels |

### 2. React Contexts (Composition)

Contexts compose multiple stores and provide additional logic:

| Context | Purpose |
|---------|---------|
| `AppContext` | User profile, auth sync, settings |
| `OfflineContext` | Sync management, service worker integration |
| `NetworkProvider` | Initializes network listeners (must be at root) |

### 3. Composed Hooks

Domain-specific hooks that combine related functionality:

| Hook | Combines |
|------|----------|
| `useProgressState` | XP, levels, biomes |
| `useCurrencyState` | Coins, boosters |
| `useGamificationState` | Achievements, quests, streaks |
| `usePetState` | Pet bonds, interactions |

### 4. Orchestration Hooks

Higher-level hooks for cross-domain operations:

| Hook | Purpose |
|------|---------|
| `useBackendAppState` | Coordinates multiple systems (XP + coins + quests + pets) |
| `useOfflineSyncManager` | Manages sync operations with conflict resolution |

## Data Flow

```
Window Events (online/offline)
        ↓
    NetworkProvider
        ↓ (initializes)
    networkStore ← Single Source of Truth for network status
        ↓ (subscribes)
    ┌───────────────────────────────────────┐
    │                                       │
    ↓                                       ↓
OfflineContext                        useAppStatus
(shows toasts,                        (reads isOnline)
triggers sync)
    ↓
useOfflineSyncManager
(processes queue)
```

## Guidelines

### Reading Network Status

```typescript
// ✅ Correct: Use the store or hooks
import { useIsOnline } from '@/stores/networkStore';
const isOnline = useIsOnline();

// or
import { useAppStatus } from '@/contexts/AppContext';
const { isOnline } = useAppStatus();

// ❌ Wrong: Don't check navigator.onLine directly
if (navigator.onLine) { ... }
```

### Adding Sync Operations

```typescript
// ✅ Correct: Use the sync manager
import { useOffline } from '@/contexts/OfflineContext';
const { queueOperation } = useOffline();
queueOperation('xp_update', { totalXp: 100 });

// Operations are automatically synced when online
```

### Opening Modals (Type-Safe)

```typescript
// ✅ Correct: Use type-safe overloads
import { useNavigationStore } from '@/stores/navigationStore';
const { openModal } = useNavigationStore();

// Type-checked: petId is required
openModal('pet-detail', { petId: '123', petType: 'cat' });

// ✅ Getting modal data
import { useTypedModalData } from '@/stores/navigationStore';
const petData = useTypedModalData('pet-detail');
// petData is typed as PetDetailModalData | undefined
```

### Using Composed Hooks

```typescript
// ✅ When you only need specific functionality:
import { useProgressState } from '@/hooks/composed';
const { currentLevel, awardXP } = useProgressState();

// ✅ When you need cross-domain orchestration:
import { useBackendAppState } from '@/hooks/useBackendAppState';
const { awardXP } = useBackendAppState(); // Awards XP, coins, updates quests, pets
```

## Provider Order

The provider order in App.tsx is important:

```tsx
<NetworkProvider>      {/* Must be first - initializes network listeners */}
  <OfflineProvider>    {/* Uses networkStore */}
    <AppProvider>      {/* Uses networkStore for status */}
      {/* App content */}
    </AppProvider>
  </OfflineProvider>
</NetworkProvider>
```

## Conflict Resolution

Offline sync uses domain-specific conflict resolution:

| Operation Type | Strategy | Description |
|---------------|----------|-------------|
| `xp_update` | Additive | Takes MAX of client/server values |
| `coin_update` | Additive | Takes MAX of client/server values |
| `streak_update` | Client-wins | Streaks are time-sensitive |
| `achievement_unlock` | Additive | Can't un-unlock achievements |
| `progress_update` | Field-merge | Merges individual fields |
| `quest_update` | Additive | Takes MAX progress |
