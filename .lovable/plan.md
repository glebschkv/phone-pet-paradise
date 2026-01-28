
# Fix Coin Synchronization & Shop Payment Issues

## Problem Summary

The coin system is experiencing multiple issues:

1. **Balance Out of Sync** - Local Zustand store diverges from server (Supabase) state
2. **"Failed to process payment"** - Server rejects purchases because actual balance differs from displayed balance
3. **Rate Limiting Blocks Legitimate Rewards** - Server limits 5 earns/minute, which blocks burst rewards (daily login + achievements)
4. **No Initial Sync on Login** - When users authenticate, coins aren't fetched from server
5. **Poor Error Messaging** - Generic "Failed to process payment" doesn't explain the issue

---

## Root Cause Analysis

| Problem | Root Cause | Impact |
|---------|-----------|--------|
| Coins don't match | No sync when user logs in | User sees wrong balance |
| Purchase fails | Server balance < local display | User can't buy items they appear to afford |
| Daily reward blocked | Rate limit (5/min) too aggressive | Burst rewards get throttled |
| Confusing errors | Generic error messages | User doesn't understand what happened |

---

## Implementation Plan

### Phase 1: Add Initial Coin Sync on Authentication

**File: `src/hooks/useCoinSystem.ts`**

Add a new effect that syncs coins from server when the user authenticates:

```typescript
// Add auth state listener for initial sync
useEffect(() => {
  const initSync = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncFromServer();
        coinLogger.debug('Initial coin sync completed on mount');
      }
    } catch (err) {
      coinLogger.debug('Initial coin sync skipped:', err);
    }
  };
  
  initSync();
  
  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Use setTimeout to avoid deadlock
        setTimeout(() => {
          syncFromServer().catch((err) => {
            coinLogger.debug('Auth sync failed:', err);
          });
        }, 0);
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, [syncFromServer]);
```

---

### Phase 2: Increase Server Rate Limits for Reward Bursts

**File: `supabase/functions/validate-coins/index.ts`**

The current limit of 5 earns/minute is too restrictive for legitimate use cases like:
- Claiming daily reward (1 earn)
- Completing achievements (1-3 earns)
- Quest completions (1-2 earns)

Update rate limits:

```typescript
// Before
const RATE_LIMIT_MAX_EARN = 5;

// After - Allow burst of rewards
const RATE_LIMIT_MAX_EARN = 15; // Increased to handle reward bursts
```

Also add source-based exemptions for critical reward types:

```typescript
// Sources that bypass rate limiting (trusted game events)
const RATE_EXEMPT_SOURCES = ['daily_reward', 'achievement', 'quest_reward'];

// In the earn operation:
if (!RATE_EXEMPT_SOURCES.includes(body.source)) {
  const rateLimit = checkRateLimit(user.id, 'earn');
  if (!rateLimit.allowed) {
    // Return rate limit error
  }
}
```

---

### Phase 3: Improve Shop Purchase Error Handling

**File: `src/hooks/useShop.ts`**

Update the `genericPurchase` function to handle balance mismatches better:

```typescript
// SECURITY: Server-validated spending
const spendSuccess = await coinSystem.spendCoins(price, config.spendPurpose, itemId);
if (!spendSuccess) {
  // Trigger a balance refresh so UI updates
  try {
    await coinSystem.syncFromServer();
  } catch {
    // Silent fail
  }
  return { 
    success: false, 
    message: 'Your balance has been updated. Please try again.' 
  };
}
```

Apply the same pattern to:
- `purchaseBackgroundBundle`
- `purchasePetBundle`
- `purchaseBooster`
- `purchaseStreakFreeze`

---

### Phase 4: Add Periodic Background Sync

**File: `src/hooks/useCoinSystem.ts`**

Add a periodic sync to catch any drift (every 5 minutes when authenticated):

```typescript
// Periodic balance sync every 5 minutes
useEffect(() => {
  const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  const interval = setInterval(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncFromServer();
      }
    } catch {
      // Silent fail - just log
      coinLogger.debug('Periodic sync failed');
    }
  }, SYNC_INTERVAL);
  
  return () => clearInterval(interval);
}, [syncFromServer]);
```

---

### Phase 5: Add Server-Side Logging for Debugging

**File: `supabase/functions/validate-coins/index.ts`**

Add detailed logging to track rate limit hits and rejected operations:

```typescript
if (!rateLimit.allowed) {
  console.log(`[RATE_LIMIT] User ${user.id} exceeded ${body.operation} limit. Source: ${body.source}`);
  return new Response(JSON.stringify({
    success: false,
    error: 'Rate limit exceeded. Please try again later.',
  }), { status: 429, ... });
}

// Log successful operations for audit
console.log(`[COIN_${body.operation.toUpperCase()}] User: ${user.id}, Amount: ${amount}, Source/Purpose: ${body.source || body.purpose}, New Balance: ${newBalance}`);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCoinSystem.ts` | Add auth sync effect, periodic sync, improve imports |
| `src/hooks/useShop.ts` | Better error handling, trigger balance refresh on failures |
| `supabase/functions/validate-coins/index.ts` | Increase rate limits, add source exemptions, add logging |

---

## Technical Details

### Current Rate Limits (server)
- Earn: 5 operations per minute
- Spend: 20 operations per minute

### Proposed Rate Limits
- Earn: 15 operations per minute (or exempt trusted sources)
- Spend: 20 operations per minute (unchanged)

### Sync Strategy
1. **On Login**: Immediate sync from server
2. **On Auth Change**: Sync when user signs in
3. **Periodic**: Every 5 minutes while authenticated
4. **On Purchase Failure**: Sync to get correct balance
5. **After Server Operations**: Already syncing after earn/spend

---

## Verification Steps

After implementation:
1. Log in with a Supabase account - verify coins sync immediately
2. Claim daily reward - should work without rate limiting
3. Complete multiple achievements - should all process
4. Try purchasing an item - should work if balance is sufficient
5. Create a balance mismatch scenario - error should be clear and balance should refresh
6. Check edge function logs for debugging info
