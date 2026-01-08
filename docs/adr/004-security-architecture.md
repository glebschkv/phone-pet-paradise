# ADR-004: Security Architecture

## Status
Accepted

## Context

Phone Pet Paradise handles:
- User authentication
- In-app purchases
- Virtual currency (coins)
- Game progression (XP, achievements)

Security requirements:
1. **Prevent cheating** - Users shouldn't be able to manipulate coins/XP
2. **Protect user data** - Authentication must be secure
3. **Secure purchases** - IAP must be validated server-side
4. **Rate limiting** - Prevent brute force attacks

Constraints:
- Offline-first architecture means some data lives locally
- Mobile apps can be reverse-engineered
- Users may attempt to manipulate localStorage

## Decision

We implement a **defense-in-depth security architecture** with multiple layers:

### 1. Authentication Security

**Supabase JWT Authentication**
- JWT tokens with short expiration
- Session management via Supabase client
- Secure storage (sessionStorage on web, secure storage on mobile)

**Client-Side Rate Limiting**
```typescript
// src/lib/security.ts
const RATE_LIMIT_CONFIGS = {
  auth: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 30 * 60 * 1000, // 30 minute lockout
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};
```

### 2. Server-Side Validation

**Coin Transactions**
```
Client                    Edge Function              Database
  │                           │                         │
  │ earnCoins(100)            │                         │
  │──────────────────────────►│                         │
  │ (local optimistic)        │                         │
  │                           │ validate-coins          │
  │                           │────────────────────────►│
  │                           │◄────────────────────────│
  │◄──────────────────────────│                         │
  │ (reconcile if needed)     │                         │
```

**IAP Receipt Validation**
- All purchases validated via `validate-receipt` Edge Function
- Apple/Google receipt verification server-side
- Entitlements granted only after validation

### 3. Input Validation

**Client-Side (Zod)**
```typescript
// Storage validation schemas
const coinStateSchema = z.object({
  balance: z.number().min(0).max(MAX_COINS),
  totalEarned: z.number().min(0),
  // ...
});
```

**Server-Side**
- All Edge Functions validate inputs
- Type checking with TypeScript
- Range validation for game values

### 4. Cryptographic Security

**Secure Random Generation**
```typescript
// NEVER use Math.random() for security-sensitive operations
export function generateSecureId(length: number = 16): string {
  const array = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}
```

### 5. Cookie Security

```typescript
// Secure cookie flags
const secureCookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict; Secure`;
```

### 6. XSS Prevention

- React's built-in escaping for all rendered content
- No `dangerouslySetInnerHTML` usage
- Content Security Policy headers (planned)

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                      TRUST BOUNDARY                          │
├─────────────────────────────────────────────────────────────┤
│  UNTRUSTED (Client)        │  TRUSTED (Server)              │
│  ─────────────────────     │  ────────────────              │
│  • localStorage data       │  • Edge Functions              │
│  • Client-side state       │  • Database (Supabase)         │
│  • User input              │  • Receipt validation          │
│  • Device clock            │  • Coin validation             │
│                            │  • User authentication         │
├─────────────────────────────────────────────────────────────┤
│                      VALIDATION RULES                        │
│  ─────────────────────────────────────────────────────────  │
│  • Coins: Server validates all transactions                  │
│  • XP: Server validates level-ups                           │
│  • Purchases: Server validates all IAP receipts             │
│  • Auth: JWT with server-side session management            │
└─────────────────────────────────────────────────────────────┘
```

## Consequences

### Positive
- **Layered defense** - Multiple barriers against attacks
- **Audit trail** - Server validates and logs critical operations
- **Offline support** - Security doesn't break offline experience
- **Standard practices** - Uses well-known security patterns

### Negative
- **Latency** - Server validation adds round-trip time
- **Complexity** - Multiple validation layers to maintain
- **False positives** - Legitimate actions may be flagged

### Trade-offs
- We accept some UX latency for security-critical operations
- Client-side rate limiting is bypass-able but reduces casual abuse
- Offline earnings are eventually validated, allowing temporary discrepancies

## Implementation Checklist

- [x] Rate limiting on authentication
- [x] Secure cookie flags
- [x] Crypto-safe random generation
- [x] Server-side coin validation
- [x] IAP receipt validation
- [x] Input validation with Zod
- [x] Error message sanitization
- [ ] Content Security Policy headers
- [ ] Security audit logging
- [ ] IP-based rate limiting (server-side)

## Alternatives Considered

### Client-Only Validation
- **Pro**: Simpler, faster
- **Con**: Easily bypassed, no protection against cheating

### Blockchain-Based Currency
- **Pro**: Tamper-proof transaction history
- **Con**: Massive overkill, slow, expensive, bad UX

### Obfuscation
- **Pro**: Makes reverse engineering harder
- **Con**: Security through obscurity, always eventually defeated
