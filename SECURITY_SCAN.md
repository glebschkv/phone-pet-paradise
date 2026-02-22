# Security Scan Report

**App:** NoMo Phone (phone-pet-paradise)
**Date:** 2026-02-21
**Stack:** React 18 + Vite + Supabase + Capacitor (iOS)
**Scan scope:** Full codebase — client source, Supabase migrations, CI config, dependencies

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 2     |
| Medium   | 4     |
| Low      | 4     |
| Info     | 3     |

Overall the app demonstrates strong security practices. No critical
vulnerabilities were found. The codebase includes a dedicated `src/lib/security.ts`
module, proper RLS policies, PKCE auth flow, and server-side coin validation.
The findings below are areas for improvement.

---

## HIGH Severity

### H1 — `handle_new_user()` SECURITY DEFINER without `search_path`

**File:** `supabase/migrations/20250817120529_c513ba67-390f-4a45-98cc-1ceaf64c2f8b.sql:158-169`
**Status:** Not yet fixed

The `handle_new_user()` trigger function runs as `SECURITY DEFINER` (superuser
context) but does not set `search_path = public`. This allows a potential
search-path hijacking attack where a malicious user with schema-create
privileges could shadow the `profiles` or `user_progress` tables.

Other SECURITY DEFINER functions were fixed in migrations `20260129205359` and
`20260221000000`, but `handle_new_user()` was missed.

```sql
-- Current (vulnerable)
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Should be
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Recommendation:** Create a new migration to recreate `handle_new_user()` with
`SET search_path = public`.

---

### H2 — 17 npm dependency vulnerabilities (1 moderate, 16 high)

**Source:** `npm audit`

| Package | Severity | Issue |
|---------|----------|-------|
| `@isaacs/brace-expansion` 5.0.0 | High | Uncontrolled Resource Consumption |
| `minimatch` <10.2.1 | High | ReDoS via repeated wildcards (affects eslint, typescript-eslint, vitest coverage) |
| `tar` <=7.5.7 | High | Arbitrary file overwrite, symlink poisoning, hardlink traversal (affects @capacitor/cli) |
| `ajv` <6.14.0 | Moderate | ReDoS with `$data` option |

The `minimatch` and `tar` vulnerabilities cascade through the devDependency
tree (eslint, @typescript-eslint, @capacitor/cli, @vitest/coverage-v8).

**Recommendation:**
- Run `npm audit fix` to resolve non-breaking updates
- Evaluate `npm audit fix --force` for breaking updates (eslint 10.x)
- Pin `tar` to >=7.5.8 or update `@capacitor/cli` when a patched version is released

---

## MEDIUM Severity

### M1 — No Content Security Policy (CSP)

**File:** `index.html`

The application has no Content Security Policy configured, either as a `<meta>`
tag or via server response headers. This leaves the app more vulnerable to XSS
attacks if a vector is ever introduced.

**Recommendation:** Add a CSP meta tag to `index.html`:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; img-src 'self' data: blob:;" />
```

---

### M2 — External font loaded without Subresource Integrity (SRI)

**File:** `index.html:24`

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
```

Google Fonts CSS is loaded from a third-party CDN without an `integrity` hash.
If the CDN is compromised, malicious CSS could be injected.

**Recommendation:** Self-host the Inter font or add SRI hashes. Note that
Google Fonts dynamically generates CSS, making SRI impractical — self-hosting
is the better approach.

---

### M3 — Client-side-only rate limiting

**File:** `src/lib/security.ts:93-205`

The rate limiter stores state in an in-memory `Map` on the client. This is
easily bypassed by refreshing the page or using DevTools. Auth rate limiting
should be enforced server-side (Supabase already provides some built-in auth
rate limiting, but custom RPC endpoints may not).

**Recommendation:** Ensure Supabase edge functions and auth endpoints have
server-side rate limiting. The client-side rate limiter is still useful for UX
but should not be relied on as a security control.

---

### M4 — CI workflow missing Codecov authentication token

**File:** `.github/workflows/ci.yml:50-53`

```yaml
- uses: codecov/codecov-action@v4
  with:
    file: ./coverage/coverage-final.json
    fail_ci_if_error: false
```

The Codecov action is used without a `token` parameter and `fail_ci_if_error`
is false. Since Codecov v4, a token is required for private repos. Without it,
coverage uploads silently fail.

**Recommendation:** Add a `CODECOV_TOKEN` repository secret and reference it in
the workflow.

---

## LOW Severity

### L1 — Dev server binds to all interfaces

**File:** `vite.config.ts:10-11`

```ts
server: {
  host: "::",
  port: 8080,
},
```

The dev server binds to `::` (all IPv4 and IPv6 interfaces), making it
accessible to other devices on the local network. This is only a concern during
development — production builds are static files served by Supabase/CDN.

**Recommendation:** Consider binding to `localhost` unless LAN access is
intentionally needed for mobile device testing.

---

### L2 — `_resetAuthForTesting()` exported from production code

**File:** `src/hooks/useAuth.ts:390-394`

```ts
export function _resetAuthForTesting(): void {
  _state = { user: null, session: null, isLoading: true, isGuestMode: false, passwordRecoveryPending: false };
  _initialized = false;
  _listeners.clear();
}
```

A function that resets all auth state is exported and accessible in production
builds. While the `_` prefix convention signals internal use, it could be
called from the browser console to force sign-out.

**Recommendation:** Gate behind `import.meta.env.DEV` or move to a test-only
module.

---

### L3 — Guest user object uses fake email

**File:** `src/hooks/useAuth.ts:167-174`

```ts
const guestUser = {
  id: guestId,
  email: 'guest@local',
  ...
} as User;
```

The guest user is cast `as User` with a fake email. While this doesn't cause a
direct vulnerability, any code path that reads `user.email` for guest users
will get `'guest@local'` which could end up in error reports, analytics, or
displayed to users unexpectedly.

**Recommendation:** Use `undefined` or `''` for guest email, and ensure all
code paths handle guest users explicitly.

---

### L4 — `sanitizeUrl()` hostname check is incomplete

**File:** `src/lib/security.ts:338-339`

```ts
if (parsed.hostname.includes('javascript') || parsed.hostname.includes('data')) {
  return null;
}
```

The hostname check for `'javascript'` and `'data'` is defensive but overly
broad (would block legitimate domains like `data-service.example.com`) while
also being incomplete (doesn't cover all attack vectors). The protocol check
on line 333 already blocks `javascript:` and `data:` protocols, making this
hostname check redundant and potentially confusing.

**Recommendation:** Remove the hostname check since the protocol whitelist
(`http:`, `https:` only) is already sufficient.

---

## INFO

### I1 — Source maps correctly disabled in production

**File:** `vite.config.ts:72`

```ts
sourcemap: mode !== 'production',
```

Source maps are disabled for production builds, which is correct.

---

### I2 — Supabase RLS is comprehensive

All tables (`profiles`, `pets`, `user_progress`, `focus_sessions`, `quests`,
`achievements`, `coin_transactions`, `user_purchases`, `user_subscriptions`,
`user_settings`) have RLS enabled with proper `auth.uid() = user_id` policies.

Overly permissive INSERT policies on `coin_transactions` and `user_purchases`
were already identified and fixed in migration `20260221000000`.

---

### I3 — Strong security utilities in place

The codebase includes well-implemented security utilities:
- **Cryptographic RNG:** `crypto.getRandomValues()` / `crypto.randomUUID()` (`src/lib/security.ts`)
- **Auth token storage:** `sessionStorage` on web, `localStorage` only on native (`src/integrations/supabase/client.ts`)
- **Error sanitization:** Bearer tokens and API keys redacted from error messages (`src/lib/apiUtils.ts:375-378`)
- **Window security:** `noopener,noreferrer` on external links (`src/lib/security.ts:308`)
- **Password validation:** Enforces uppercase, lowercase, digit, special char, min length, common password blocklist (`src/lib/apiUtils.ts:295-336`)
- **Zustand storage validation:** Zod schemas validate all persisted store data (`src/lib/validated-zustand-storage.ts`)
- **PKCE auth flow:** Code exchange for deep links (`src/hooks/useAuth.ts:291-301`)
- **User data isolation:** `clearUserData()` on sign-out prevents cross-account data leaks (`src/hooks/useAuth.ts:22-97`)
- **No XSS vectors:** Zero uses of `dangerouslySetInnerHTML`, `eval()`, or `new Function()`. One safe use of `.innerHTML` in the sanitization utility itself.

---

## Checklist of areas scanned

- [x] XSS (dangerouslySetInnerHTML, innerHTML, eval, DOM injection)
- [x] SQL injection (parameterized queries via Supabase client)
- [x] Authentication and session management
- [x] Authorization (RLS policies, route guards)
- [x] Sensitive data exposure (env vars, hardcoded secrets, console logging)
- [x] Dependency vulnerabilities (npm audit)
- [x] Content Security Policy
- [x] CSRF protections
- [x] Open redirects
- [x] Prototype pollution
- [x] ReDoS patterns
- [x] Supabase migration security (SECURITY DEFINER, search_path, RLS)
- [x] CI/CD pipeline security
- [x] Mobile/Capacitor configuration
- [x] Third-party resource integrity
