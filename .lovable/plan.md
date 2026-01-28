
# Fix: App Crashing After Coin Sync Changes

## Problem

The app is crashing immediately on load with "Oops! Something went wrong" error. The error is:

```
Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.
```

## Root Cause

The recent changes to `useCoinSystem.ts` added two new `useEffect` hooks that call `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()` **without first checking if Supabase is configured**.

The Supabase client uses a Proxy that throws an error when accessed if the environment variables are not set. Other hooks in the codebase (like `useAuth.ts`, `usePremiumStatus.ts`) correctly check `isSupabaseConfigured` before accessing the client.

## Current Code (Broken)

```typescript
// Line 43 - Missing isSupabaseConfigured import
import { supabase } from '@/integrations/supabase/client';

// Lines 298-328 - No guard check before accessing supabase
useEffect(() => {
  const initSync = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession(); // THROWS ERROR
      // ...
    }
  };
  // ...
  const { data: { subscription } } = supabase.auth.onAuthStateChange(...); // THROWS ERROR
}, [syncFromServer]);
```

## Solution

Add `isSupabaseConfigured` guard checks to both effects, matching the pattern used in other hooks.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useCoinSystem.ts` | Add `isSupabaseConfigured` to import and guard both effects |

---

## Implementation Details

### 1. Update Import Statement

**Line 43:**
```typescript
// Before
import { supabase } from '@/integrations/supabase/client';

// After
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
```

### 2. Guard Initial Sync Effect

**Lines 298-328:**
```typescript
useEffect(() => {
  // Skip if Supabase is not configured (guest mode)
  if (!isSupabaseConfigured) {
    coinLogger.debug('Supabase not configured, skipping auth sync');
    return;
  }

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

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN' && session) {
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

### 3. Guard Periodic Sync Effect

**Lines 331-348:**
```typescript
useEffect(() => {
  // Skip if Supabase is not configured (guest mode)
  if (!isSupabaseConfigured) {
    return;
  }

  const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const interval = setInterval(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncFromServer();
        coinLogger.debug('Periodic coin sync completed');
      }
    } catch {
      coinLogger.debug('Periodic sync failed');
    }
  }, SYNC_INTERVAL);

  return () => clearInterval(interval);
}, [syncFromServer]);
```

---

## Why This Fixes the Issue

1. **Guard Check First**: Both effects now check `isSupabaseConfigured` before any Supabase calls
2. **Early Return**: If Supabase isn't configured, the effects return early without setting up subscriptions or intervals
3. **No Cleanup Needed**: If we return early, there's nothing to clean up (no subscription to unsubscribe, no interval to clear)
4. **Matches Existing Pattern**: This follows the same pattern used in `useAuth.ts`, `usePremiumStatus.ts`, and other hooks

---

## Verification Steps

After implementing this fix:
1. The app should load without crashing
2. Guest mode users should be able to use the app with local-only coins
3. Authenticated users will get coin sync when Supabase is properly configured
