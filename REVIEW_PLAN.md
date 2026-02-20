# Comprehensive App & Backend Review — Fix Plan

## CRITICAL Issues (Payment-Breaking / Security Vulnerabilities)

### 1. `user_subscriptions.tier` CHECK constraint missing 'lifetime' — PAYMENT BREAKING
**File:** `supabase/migrations/20251201000000_add_user_subscriptions.sql:8`
**Problem:** The `tier` column has `CHECK (tier IN ('premium', 'premium_plus'))` but the `validate-receipt` edge function inserts `tier: 'lifetime'` for lifetime purchases ($179.99). This causes a PostgreSQL constraint violation, meaning **lifetime purchases silently fail** — the user pays but gets no subscription recorded.
**Fix:** New migration to `ALTER TABLE user_subscriptions DROP CONSTRAINT ... ADD CONSTRAINT ... CHECK (tier IN ('premium', 'premium_plus', 'lifetime'))`.

### 2. `coin_transactions` INSERT policy too permissive — SECURITY
**File:** `supabase/migrations/20260104000000_add_coin_validation.sql:40-41`
**Problem:** The INSERT policy is `WITH CHECK (TRUE)`, meaning any authenticated user can insert arbitrary coin transaction records directly via the Supabase anon key. They could create fake "earn" records to inflate their balance without going through the `validate-coins` edge function.
**Fix:** Change to `WITH CHECK (auth.uid() = user_id AND FALSE)` or better, remove the INSERT policy entirely (only service role should insert, and it bypasses RLS).

### 3. `user_purchases` INSERT policy too permissive — SECURITY
**File:** `supabase/migrations/20260205000000_add_iap_purchases.sql:39-40`
**Problem:** Same as above — `WITH CHECK (TRUE)` allows any authenticated user to insert fake purchase records directly, potentially claiming bundles they never paid for.
**Fix:** Remove the INSERT policy (only service role should insert via edge functions).

### 4. Offline sync `coin_update` bypasses server validation — SECURITY
**File:** `src/hooks/useOfflineSyncManager.ts:116-125`
**Problem:** The `coin_update` sync operation directly updates `user_progress.coins` via the user's RLS-allowed auth context, completely bypassing the `validate-coins` edge function. A user could queue a `coin_update` with `coins: 999999` and it would sync directly to the database.
**Fix:** Remove `coin_update` as a sync operation type, or route it through the `validate-coins` edge function during sync.

### 5. Offline sync `progress_update` allows arbitrary field overwrites — SECURITY
**File:** `src/hooks/useOfflineSyncManager.ts:85-99`
**Problem:** The `progress_update` operation does an upsert on `user_progress` with the raw payload (filtered only to primitives). This allows overwriting `total_xp`, `current_level`, `coins`, `total_coins_earned` etc. A user could set their level to 50 and coins to any value.
**Fix:** Whitelist specific allowed fields (e.g., only `current_streak`, `longest_streak`, `last_session_date`), or route through edge functions.

---

## HIGH Issues (Data Integrity / Correctness)

### 6. Generated types.ts is stale — multiple tables/functions missing or wrong
**File:** `src/integrations/supabase/types.ts`
**Problems:**
- `user_purchases` table is entirely missing
- `add_user_coins`, `check_bundle_ownership`, `get_owned_bundles` RPC functions are missing
- `user_subscriptions.user_id` typed as `string | null` but is `NOT NULL` in DB
- `user_settings` columns typed as nullable (`boolean | null`, `string | null`) but are `NOT NULL DEFAULT` in DB
**Fix:** Regenerate types from the live database using `supabase gen types typescript`.

### 7. CORS inconsistency across edge functions
**Files:** All 5 edge functions in `supabase/functions/`
**Problem:** `validate-coins` allows Lovable domains (`*.lovableproject.com`, `*.lovable.app`) plus `localhost:3000`, but the other 4 edge functions (calculate-xp, process-achievements, delete-account, validate-receipt) use a different, stricter CORS pattern that excludes these domains. Calls from Lovable preview deployments to calculate-xp, process-achievements, etc. will fail with CORS errors.
**Fix:** Unify CORS configuration across all edge functions. Extract into a shared utility or ensure all functions allow the same origins.

### 8. `delete-account` doesn't delete `user_purchases`
**File:** `supabase/functions/delete-account/index.ts`
**Problem:** The explicit cascade delete sequence is missing the `user_purchases` table. While `ON DELETE CASCADE` on the FK handles it at DB level, the explicit delete list should be complete for clarity and safety.
**Fix:** Add `user_purchases` deletion before the `user_progress` deletion step.

---

## MEDIUM Issues (Robustness / Code Quality)

### 9. `add_user_coins`, `check_bundle_ownership`, `get_owned_bundles` missing `search_path`
**File:** `supabase/migrations/20260205000000_add_iap_purchases.sql`
**Problem:** The `20260129205359` migration properly added `SET search_path = public` to existing functions, but the newer `20260205000000` migration didn't set `search_path` on its 3 new functions. This is a PostgreSQL security concern (search_path hijacking).
**Fix:** New migration to recreate these functions with `SET search_path = public`.

### 10. `calculate-xp` edge function lacks optimistic locking
**File:** `supabase/functions/calculate-xp/index.ts:224-234`
**Problem:** Unlike `validate-coins` which uses `.eq('coins', balanceBefore)` for optimistic locking, `calculate-xp` reads `total_xp` then updates it without a version check. Two concurrent requests could read the same `total_xp` and both add their XP, resulting in a lost update.
**Fix:** Add `.eq('total_xp', currentProgress.total_xp)` to the update query, with retry logic on failure.

### 11. `calculate-xp` uses anon key — should use service role for writes
**File:** `supabase/functions/calculate-xp/index.ts:146-149`
**Problem:** The function creates a client with anon key + user auth, meaning all DB writes go through RLS. While this works, it means the user could potentially bypass the edge function and directly update their own `user_progress.total_xp` via the client. For consistency with `validate-coins` and `validate-receipt`, XP updates should use service role.
**Fix:** Use service role client for the update and insert operations (like validate-coins does).

### 12. `process-achievements` uses anon key — same as above
**File:** `supabase/functions/process-achievements/index.ts:157-161`
**Problem:** Achievement inserts go through user RLS context instead of service role. While functional, it's inconsistent with the security model.
**Fix:** Use service role client for achievement inserts.

### 13. Duplicate `onAuthStateChange` listener in `useCoinSystem`
**File:** `src/hooks/useCoinSystem.ts:344-355`
**Problem:** The hook registers its own `supabase.auth.onAuthStateChange` listener for coin sync, in addition to the singleton one in `useAuth.ts`. While not a bug (Supabase supports multiple listeners), it adds unnecessary overhead and another auth check on startup.
**Fix:** Use a custom event dispatched from `useAuth`'s auth state change handler instead.

---

## Summary of Changes Needed

| Priority | Issue | Type | Files Affected |
|----------|-------|------|----------------|
| CRITICAL | Lifetime tier CHECK constraint | DB Migration | New migration |
| CRITICAL | coin_transactions INSERT policy | DB Migration | New migration |
| CRITICAL | user_purchases INSERT policy | DB Migration | New migration |
| CRITICAL | Offline sync coin_update bypass | Code fix | useOfflineSyncManager.ts |
| CRITICAL | Offline sync progress_update bypass | Code fix | useOfflineSyncManager.ts |
| HIGH | Stale types.ts | Regenerate | types.ts |
| HIGH | CORS inconsistency | Code fix | All 5 edge functions |
| HIGH | delete-account missing user_purchases | Code fix | delete-account/index.ts |
| MEDIUM | Missing search_path on RPC functions | DB Migration | New migration |
| MEDIUM | calculate-xp no optimistic locking | Code fix | calculate-xp/index.ts |
| MEDIUM | calculate-xp uses anon key | Code fix | calculate-xp/index.ts |
| MEDIUM | process-achievements uses anon key | Code fix | process-achievements/index.ts |
| MEDIUM | Duplicate onAuthStateChange listener | Code fix | useCoinSystem.ts |
