# ADR-002: Offline-First Architecture

## Status
Accepted

## Context

Phone Pet Paradise is a mobile-first app that needs to work reliably regardless of network conditions. Users should be able to:
- Start focus sessions without internet
- Earn rewards and progress offline
- Have data sync seamlessly when online

Key constraints:
- iOS/Android deployment via Capacitor
- Supabase backend for cloud sync
- Game integrity (prevent coin/XP manipulation)

## Decision

We implement an **offline-first architecture** with:

1. **Local-first data storage** - All game state stored in localStorage via Zustand
2. **Optimistic updates** - UI updates immediately, syncs in background
3. **Action queue** - Offline actions queued for later sync
4. **Server validation** - Security-critical operations validated server-side

### Data Flow

```
User Action
    │
    ▼
┌─────────────────┐
│  Local Update   │ ◀── Immediate (optimistic)
│  (Zustand)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sync Queue     │ ◀── If offline, queue action
│  (offlineStore) │
└────────┬────────┘
         │
         ▼ (when online)
┌─────────────────┐
│  Server Sync    │ ◀── Validate & persist
│  (Supabase)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Reconciliation │ ◀── Handle conflicts
└─────────────────┘
```

### Security Model

For security-critical operations (coins, purchases), we use **server-side validation**:

```typescript
// Client awards coins locally first
localStore.addCoins(amount);
localStore.setPendingValidation(true);

// Server validates asynchronously
const result = await supabase.functions.invoke('validate-coins', {
  body: { amount, source, timestamp }
});

// Reconcile if server rejects
if (!result.success) {
  localStore.rollback();
}
```

## Implementation

### Stores with Persistence

Each Zustand store uses validated persistence:

```typescript
export const useCoinStore = create<CoinState>()(
  persist(
    subscribeWithSelector((set) => ({
      balance: 0,
      // ...actions
    })),
    {
      name: 'nomo_coin_state',
      storage: createValidatedStorage(coinStateSchema),
    }
  )
);
```

### Offline Sync Manager

The `useOfflineSyncManager` hook manages the queue:

```typescript
// Queue action when offline
if (!isOnline) {
  offlineSyncStore.addAction({
    type: 'EARN_COINS',
    payload: { amount, source },
    timestamp: Date.now(),
  });
  return;
}

// Process queue when online
useEffect(() => {
  if (isOnline && hasPendingActions) {
    processQueue();
  }
}, [isOnline]);
```

## Consequences

### Positive
- **Excellent UX** - App feels responsive even offline
- **Reliable** - No lost progress due to network issues
- **Battery efficient** - Batch syncs reduce network calls
- **User trust** - Users see their progress immediately

### Negative
- **Complexity** - Conflict resolution can be tricky
- **Storage limits** - localStorage has ~5-10MB limit
- **Stale data risk** - Need careful cache invalidation

### Trade-offs
- Optimistic updates can show incorrect state briefly
- Server validation adds latency for security-critical operations
- Need to handle edge cases (device clock manipulation, etc.)

## Alternatives Considered

### Server-First (Traditional)
- **Pro**: Simpler mental model, always consistent
- **Con**: Poor offline experience, blocks on network

### CRDT-Based Sync
- **Pro**: Automatic conflict resolution
- **Con**: Complex implementation, overkill for our use case

### Service Worker Caching Only
- **Pro**: Simple, leverages web platform
- **Con**: Doesn't handle complex state, limited control
