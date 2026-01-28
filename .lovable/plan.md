
# Fix: Auth Page Shows "Supabase is not configured" Error

## Problem Explained

When you click "Sign In" on the Auth page, you see this error:
```
Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.
```

**Why this happens:** The Auth page calls `supabase.auth.signInWithPassword()` directly without first checking if Supabase is configured. The Supabase client uses a special "Proxy" pattern that throws this error when you try to use it without configuration.

Even though your `.env` file has the credentials, the console log `[Auth] Supabase not configured, using guest mode` suggests the environment variables aren't being read properly at runtime.

---

## Root Cause

The Auth page imports `supabase` but **not** `isSupabaseConfigured`:

```typescript
// Line 3 - Missing isSupabaseConfigured check
import { supabase } from '@/integrations/supabase/client';
```

All the sign-in functions (`handleEmailSignIn`, `handleMagicLink`, `handleSignUp`, etc.) directly call `supabase.auth.*` methods without checking if Supabase is available first.

---

## Solution

Add proper guard checks to the Auth page:

1. Import `isSupabaseConfigured` from the Supabase client
2. Show a helpful message if Supabase isn't configured instead of allowing sign-in attempts
3. Add guard checks to each authentication function

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Add `isSupabaseConfigured` import and guard checks |

---

## Implementation Details

### 1. Update Import Statement

```typescript
// Before (Line 3)
import { supabase } from '@/integrations/supabase/client';

// After
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
```

### 2. Add Guard to Each Auth Function

For `handleEmailSignIn` (and similar for all auth functions):

```typescript
const handleEmailSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Guard check - show helpful message if Supabase not configured
  if (!isSupabaseConfigured) {
    toast.error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.');
    return;
  }
  
  // ... rest of the function
};
```

### 3. Functions That Need Guards

All 6 authentication functions:
- `handleMagicLink` (Line 55)
- `handleEmailSignIn` (Line 103)
- `handleSignUp` (Line 147)
- `handleForgotPassword` (Line 212)
- `handleResetPassword` (Line 257)
- `handleAppleSignIn` (Line 306)

---

## Why This Fixes the Issue

1. **Graceful Error Handling**: Instead of throwing an uncaught error from the Proxy, we show a toast message
2. **Clear Feedback**: The user sees a helpful message explaining what's wrong
3. **No Crash**: The app continues to work (guest mode still available)
4. **Consistent Pattern**: Matches how other hooks handle Supabase availability

---

## Technical Note

The underlying issue is that `import.meta.env.VITE_SUPABASE_URL` may not be loading correctly at runtime. This fix ensures the app handles that gracefully. If the credentials in `.env` should be working, you may also need to:
- Restart the development server
- Clear browser cache
- Check that the `.env` file is in the project root

---

## Verification Steps

After implementation:
1. Attempt sign-in - should show a toast error instead of crashing
2. Guest mode should still work normally
3. If Supabase IS configured properly, authentication should work
