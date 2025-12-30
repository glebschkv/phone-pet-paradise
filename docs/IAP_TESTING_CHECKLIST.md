# In-App Purchase Testing Checklist

## Prerequisites

1. **App Store Connect Setup**
   - [ ] Create app in App Store Connect
   - [ ] Add all IAP products with correct product IDs
   - [ ] Set up subscription groups
   - [ ] Configure free trial periods (7 days) for auto-renewable subscriptions

2. **Sandbox Testing Account**
   - [ ] Create sandbox tester account in App Store Connect
   - [ ] Sign out of production App Store on test device
   - [ ] Sign in with sandbox account when prompted

3. **Build Configuration**
   - [ ] Build with distribution certificate or TestFlight
   - [ ] Ensure bundle ID matches App Store Connect

## Test Scenarios

### Subscription Purchases

| Test | Expected Result | Passed |
|------|-----------------|--------|
| Start free trial (Premium Monthly) | 7-day trial starts, features unlock | [ ] |
| Start free trial (Premium+ Monthly) | 7-day trial starts, features unlock | [ ] |
| Trial to paid conversion | After 7 days, subscription charges | [ ] |
| Cancel during trial | No charge, features disable after trial | [ ] |
| Purchase yearly Premium | Immediate access, 7-day trial | [ ] |
| Purchase yearly Premium+ | Immediate access, 7-day trial | [ ] |
| Upgrade from Premium to Premium+ | Prorated upgrade, immediate access | [ ] |
| Downgrade from Premium+ to Premium | Change at next renewal | [ ] |
| Purchase Lifetime | One-time purchase, permanent access | [ ] |

### Restore Purchases

| Test | Expected Result | Passed |
|------|-----------------|--------|
| Restore active subscription | Features unlock | [ ] |
| Restore expired subscription | Features remain locked | [ ] |
| Restore lifetime purchase | Features unlock permanently | [ ] |
| Restore on new device | All purchases restored | [ ] |

### Consumable Purchases (Coin Packs)

| Test | Expected Result | Passed |
|------|-----------------|--------|
| Purchase Starter Coins ($0.99) | 500 coins added | [ ] |
| Purchase Value Coins ($4.99) | 2500 coins added | [ ] |
| Purchase Premium Coins ($9.99) | 6000 coins added | [ ] |
| Purchase Mega Coins ($19.99) | 15000 + 2500 bonus coins | [ ] |

### Error Handling

| Test | Expected Result | Passed |
|------|-----------------|--------|
| Cancel purchase dialog | No charge, app returns to normal | [ ] |
| Network error during purchase | Graceful error message | [ ] |
| Ask to Buy (family sharing) | Pending state shown | [ ] |
| Server validation failure | Local validation fallback | [ ] |

### Edge Cases

| Test | Expected Result | Passed |
|------|-----------------|--------|
| Multiple rapid purchases | All processed correctly | [ ] |
| Background/foreground during purchase | Transaction completes | [ ] |
| App kill during purchase | Transaction recovers | [ ] |
| Expired credit card | User prompted to update | [ ] |

## Server Validation

The app uses Supabase Edge Functions for receipt validation:
- Endpoint: `validate-receipt`
- Validates JWS signed transactions
- Stores subscription state in database
- Falls back to local validation if server unavailable

### Test Server Validation

1. [ ] Make purchase on device
2. [ ] Check Supabase logs for validation call
3. [ ] Verify subscription record created in database
4. [ ] Confirm user's premium features activate

## StoreKit 2 Implementation

The app uses StoreKit 2 with the following features:
- `StoreKitPlugin.swift` handles all native interactions
- Transaction listener for real-time updates
- Subscription status monitoring
- Purchase history access

### Files to Review

- `/ios/App/App/Sources/StoreKitPlugin.swift` - Native StoreKit implementation
- `/src/hooks/useStoreKit.ts` - React hook for StoreKit
- `/src/hooks/usePremiumStatus.ts` - Subscription state management

## Product IDs

```
Subscriptions:
- co.nomoinc.nomo.premium.monthly
- co.nomoinc.nomo.premium.yearly
- co.nomoinc.nomo.premiumplus.monthly
- co.nomoinc.nomo.premiumplus.yearly
- co.nomoinc.nomo.lifetime

Consumables:
- co.nomoinc.nomo.coins.starter
- co.nomoinc.nomo.coins.value
- co.nomoinc.nomo.coins.premium
- co.nomoinc.nomo.coins.mega

Bundles:
- co.nomoinc.nomo.bundle.starter
- co.nomoinc.nomo.bundle.collector
```

## Notes

- Sandbox purchases renew every few minutes instead of monthly/yearly
- Free trials in sandbox are shortened (minutes instead of days)
- Always test on real device, not simulator
- Keep Xcode console open to monitor StoreKit logs
