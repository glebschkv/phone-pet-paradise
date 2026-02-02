# Feature Audit & Fix Plan

> **Date:** 2026-02-02
> **Scope:** Full audit of claimed features vs actual implementation, market research, and prioritized fix plan.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Audit: What We Claim vs What We Have](#feature-audit)
3. [Critical Bugs Found During Audit](#critical-bugs)
4. [Market Research Summary](#market-research)
5. [Detailed Fix Plan](#detailed-fix-plan)

---

## Executive Summary

We audited all 61 feature claims from `APP_STORE_METADATA.md` against the actual codebase. Of those:

| Category | Count |
|----------|-------|
| Fully working as claimed | 28 |
| Built but disabled / dead code | 6 |
| Partially working (gaps) | 5 |
| Claimed but not implemented | 4 |
| Factual inconsistencies in copy | 2 |
| Critical bugs discovered | 2 |

**The most urgent issues:**
1. **Coin pack IAP charges users real money but never credits coins** (Critical revenue/trust bug)
2. **"Leaderboard"** is mentioned in promotional text but does not exist at all
3. **Battle Pass** is fully built but disabled — while being actively marketed
4. **All 14 premium backgrounds** are displayed with prices but cannot be purchased
5. **"Feed them, play with them"** is marketed but no UI exists for pet interactions
6. **Sound mixing** is a marketed Premium feature but the UI only supports single sounds

---

## Feature Audit

### CLAIMED & NOT IMPLEMENTED (False Marketing)

| # | Claim | Where Claimed | Reality | Severity |
|---|-------|---------------|---------|----------|
| 1 | **"Climb the leaderboard"** | Promotional text (APP_STORE_METADATA.md) | No leaderboard exists anywhere in the codebase. No ranking system, no backend endpoints, no UI. | **HIGH** — direct false advertising |
| 2 | **"Feed them, play with them, and watch them grow"** | App description | `useBondSystem.ts` has `feedPet()`, `playWithPet()`, `trainPet()`, `giftTreat()` functions but **zero UI components call them**. `PetDetailModal` only has Favorite and Show-on-Home toggles. No feed/play buttons exist. | **HIGH** — direct false advertising |
| 3 | **"Explore 8 beautiful worlds"** | What's New (v1.0) | Only 7 biomes exist (Meadow, Sunset, Night, Forest, Snow, City, Deep Ocean). The main description correctly says 7. | **MEDIUM** — copy inconsistency |
| 4 | **"Each pet has its own personality and animations"** | App description | Pets have idle/walk sprite animations (real), but "personality" is just a description string and abilities are decorative text. No behavioral variation. | **LOW** — subjective wording |

### BUILT BUT DISABLED / DEAD CODE

| # | Feature | Status | Location | Details |
|---|---------|--------|----------|---------|
| 1 | **Battle Pass** | Disabled via feature flag | `GamificationHub.tsx:38` — `BATTLE_PASS_COMING_SOON = true` | Fully built: 4 seasons, 30-tier progression, rewards, modal UI, hook logic. Card is visible but grayed out with "COMING SOON" overlay. **Actively marketed in promo text and What's New.** |
| 2 | **Sound mixing (multi-layer ambient)** | Hook built, no UI | `useSoundMixer.ts` (379 lines) | Complete Web Audio API mixer with layers, noise gen, binaural beats, per-layer volume. 50+ tests pass. But `AmbientSoundPicker` uses single-sound `useAmbientSound` hook instead. **Marketed as Premium feature.** |
| 3 | **Pet feed/play/train/treat** | Hook built, no UI | `useBondSystem.ts:172-197` | 4 interaction functions fully coded. No component calls them. Bond only advances via auto-interaction on focus session complete. |
| 4 | **Pet ability bonuses** | Calculated, never consumed | `useBondSystem.ts:200-206` | `getAbilityBonuses()` returns `focusBonus`, `experienceBonus`, `timeBonus` — but `useTimerRewards.ts` never calls it. Bonuses are dead math. |
| 5 | **Pet mood system** | Calculated, never displayed | `useBondSystem.ts:99-112` | `calculateMood()` determines happy/content/lonely/excited/sleepy. No component renders mood. No gameplay effect. |
| 6 | **Full data backup** | Hook built, no UI | `useDataBackup.ts` | Complete `createBackup()` / `restoreBackup()` with security validation. No component imports it. Settings export (separate system) works fine. |

### ALL 14 PREMIUM BACKGROUNDS — DISPLAYED BUT UNPURCHASABLE

Every background in `ShopData.ts` has `comingSoon: true`:

**Sky Bundle (5):** Sky Islands, Calm Seas, Twilight Clouds, Aurora Horizon, Sunset Clouds
**Standalone (9):** Sakura, Cyberpunk, Aurora, Crystal Cave, Volcano, Space, Underwater, Halloween, Winter Wonderland

- Shop shows them with prices and "Coming Soon" overlays
- The only workaround: buying the "Sky Realms Bundle" (2,000 coins) unlocks the 5 sky backgrounds
- The 9 standalone backgrounds have **no purchase path at all**
- `purchaseBackground()` in `useShop.ts` has **no server-side `comingSoon` guard** — only UI prevents purchase

### SPECIAL EVENTS — SYSTEM WORKS, ALL DATES EXPIRED

`GamificationData.ts` defines 4 events (Double XP Weekend, Coin Rush, Holiday Bonus, New Year 2025) — all with dates in Dec 2024 / Jan 2025. `getActiveEvents()` returns empty array. Event banners never show.

### BATTLE PASS SEASONS — ALL DATES EXPIRED

All 4 seasons end before Feb 2026. Fallback returns `winter-2024`. Even if the feature flag were removed, the season data is stale.

### PARTIALLY WORKING (Gaps)

| # | Feature | What Works | What Doesn't |
|---|---------|------------|--------------|
| 1 | **iOS Widgets** | Full TS service (`WidgetDataService`, 404 lines) + 4 native SwiftUI widgets built. | `widgetDataService` is not actively called from timer/session flows to push data updates. Data pipeline may have wiring gap. |
| 2 | **Data export** | Settings export/import works in Settings page. | Full data backup (`useDataBackup.ts`) has no UI. Users can't access it. |
| 3 | **Guild/Team system** | Types and sample data exist in `GamificationData.ts:470-529`. | No UI, no hook, no backend. Data-only stub. Not marketed (OK). |

### FULLY WORKING AS CLAIMED

These features are implemented, connected to UI, and working:

- Focus timer with presets (Pomodoro, Deep Work, Break, Countup)
- Coin earning per focus minute
- Pet collection with 40+ pets across 4 rarity tiers and 7 biomes
- 40+ levels of XP progression
- Daily quests and weekly challenges
- Streak system with freeze tokens
- Lucky Wheel (daily spins)
- Boss Challenges (4 difficulty tiers)
- Achievement system (40+ badges)
- Combo system (consecutive session multipliers)
- Milestone celebrations
- Focus Shield / app blocking (iOS, Premium)
- Ambient sounds (single sound — rain, forest, ocean, etc.)
- Session notes and reflections (post-session modal)
- Focus analytics dashboard with focus score
- Focus quality scoring (4-dimension composite)
- Daily login rewards (7-day cycle)
- Push + local notifications
- Customizable timer presets
- Premium subscriptions via StoreKit 2
- Offline-first architecture
- Onboarding flow with starter pet selection

---

## Critical Bugs Found During Audit

### BUG 1: Coin Pack IAP Charges Money But Never Credits Coins (CRITICAL)

**Location:** `src/components/shop/tabs/PowerUpsTab.tsx:52`

After successful StoreKit purchase of a coin pack:
- Apple charges the user's payment method
- `PowerUpsTab.tsx` shows a success toast
- **But no code grants the purchased coins to the user's balance**

Compare with starter bundles in `FeaturedTab.tsx` which call `purchaseStarterBundle()` to grant contents — coin packs have no equivalent `grantCoins()` call.

Additionally, the `validate-receipt` Supabase edge function only handles subscription product IDs in its `PRODUCT_TIERS` map — coin pack product IDs are not recognized.

**Impact:** Users pay real money ($0.99–$49.99) and receive nothing.

### BUG 2: Standalone Backgrounds Missing `comingSoon` UI Guard

**Location:** `src/components/shop/tabs/PetsTab.tsx:248-309`

The 9 standalone backgrounds (without `previewImage`) are rendered in a section that **does not check `comingSoon`**. They show prices and are clickable, opening the purchase confirmation dialog. Since `purchaseBackground()` also lacks a `comingSoon` check, a user could potentially purchase a `comingSoon` background via this unguarded path and lose coins on a non-functional item.

---

## Market Research Summary

### Competitive Landscape

| App | Model | Price | Rating | Key Differentiator |
|-----|-------|-------|--------|--------------------|
| **Forest** | One-time | $3.99 iOS | 4.8 (16k) | Real tree planting, social co-focus |
| **Flora** | Free (core) | Free / $1.99-9.99/yr trees | 4.8 | Free, multiplayer challenges, real trees |
| **Finch** | Freemium | $14.99/yr iOS | 4.95 (550k) | Emotional self-care, Apple Editors' Choice |
| **Plantie** | Free | Free | 5.0 | Simple, student-focused, Dynamic Island |
| **Focus Plant** | Freemium | $4.99/mo | 4.3 | HealthKit integration, world restoration |
| **Habitica** | Freemium | $4.99/mo | 4.0-4.7 | Deepest RPG, party system, web + mobile |
| **Be Focused** | One-time | $12.99 | 4.7 | Best pure Pomodoro, Apple ecosystem |
| **Opal** | Premium | $99.99/yr | 4.8 (60k) | Unbypassable Deep Focus, beautiful UX |
| **ScreenZen** | Free | Free (donations) | 4.8 (27k) | Friction-based, feature-specific blocking |

### NoMo's Pricing Position

NoMo at **$5.99/mo or $44.99/yr** is at the premium end:
- **15x more expensive** than Forest ($3.99 one-time) for "gamified focus timer"
- **3x more expensive** than Finch ($14.99/yr iOS) which has 550k reviews
- Comparable to Habitica ($4.99/mo) but Habitica has web + social + years of content
- Cheaper than Opal ($99.99/yr) but Opal has unbypassable blocking

With disabled features (Battle Pass, backgrounds, sound mixing), the premium price is hard to justify.

### Critical Market Gaps (What Competitors Have That We Don't)

| Gap | Who Has It | Impact |
|-----|-----------|--------|
| **Social/friend features** | Forest, Flora, Habitica, Opal, Finch | HIGH — table stakes for retention |
| **Real-world impact** (plant real trees) | Forest, Flora | HIGH — #1 word-of-mouth driver |
| **Android app** | All major competitors | HIGH — 50%+ of addressable market |
| **Apple Watch** | Be Focused, Opal | MEDIUM |
| **Dynamic Island / Live Activities** | Plantie | MEDIUM |
| **Web / Chrome extension** | Forest, Habitica | MEDIUM |
| **Cross-device sync** | Habitica, Forest | MEDIUM |
| **Mood tracking / journaling** | Finch | LOW |

### NoMo's Unique Strengths (What We Have That Competitors Don't)

- **Deepest pet collection** in the category (40+ vs Finch's 1 or Forest's trees)
- **Battle Pass** (if enabled) — unique to focus apps
- **Lucky Wheel + Boss Challenges + Combo System** — richest gamification stack
- **Multi-biome worlds** (7 vs Forest's single forest)
- **Focus quality scoring** with analytics

---

## Detailed Fix Plan

### TIER 1: URGENT FIXES (Ship within 1 week)

These are bugs or false claims that create legal/trust/revenue risk.

#### 1.1 Fix Coin Pack IAP Fulfillment (CRITICAL BUG)
**Files:** `src/components/shop/tabs/PowerUpsTab.tsx`, `supabase/functions/validate-receipt/index.ts`
**Work:**
- After successful `storeKit.purchaseProduct()` in `PowerUpsTab.tsx`, call `coinSystem.addCoins(pack.coins)` to credit the purchased amount
- Add coin pack product IDs to the `validate-receipt` edge function's product recognition
- Add server-side fulfillment logging to detect missed grants
- Add transaction deduplication to prevent double-crediting on retry
- **Test:** Purchase each coin pack tier and verify balance updates

#### 1.2 Fix Standalone Background Purchase Guard
**Files:** `src/components/shop/tabs/PetsTab.tsx`, `src/hooks/useShop.ts`
**Work:**
- Add `comingSoon` check in the standalone backgrounds rendering section of `PetsTab.tsx`
- Add `comingSoon` validation in `purchaseBackground()` in `useShop.ts` as a server-side guard
- **Test:** Verify no `comingSoon` background can be purchased via any code path

#### 1.3 Remove "Leaderboard" Claim from Promo Text
**Files:** `docs/APP_STORE_METADATA.md`, App Store Connect
**Work:**
- Remove "climb the leaderboard" from promotional text
- Update App Store Connect with corrected promo text
- **Alternative:** If leaderboards are planned soon, mark as "Coming Soon" in-app instead

#### 1.4 Fix "8 Worlds" → "7 Worlds" in What's New
**Files:** `docs/APP_STORE_METADATA.md`
**Work:**
- Change "Explore 8 beautiful worlds" to "Explore 7 stunning worlds" in What's New section
- Or add an 8th biome to match the claim

---

### TIER 2: ENABLE BUILT FEATURES (Ship within 2-4 weeks)

These are fully built features behind flags or missing UI wiring. Maximum value for minimum work.

#### 2.1 Enable Battle Pass
**Files:** `src/components/gamification/GamificationHub.tsx`, `src/data/GamificationData.ts`
**Work:**
- Set `BATTLE_PASS_COMING_SOON = false` in `GamificationHub.tsx:38`
- Update all 4 season dates to current/future dates (e.g., Winter 2026, Spring 2026, etc.)
- Add season date rotation logic so seasons auto-advance without code changes
- QA the full flow: tier progression, reward claiming, premium vs free rewards
- **Test:** Complete focus sessions, verify XP accumulates to battle pass tiers, claim rewards

#### 2.2 Wire Sound Mixer into UI
**Files:** `src/components/focus-timer/AmbientSoundPicker.tsx` (replace or extend)
**Work:**
- Replace `useAmbientSound` with `useSoundMixer` in the ambient sound picker
- Add UI for adding/removing sound layers (e.g., rain + forest + fire)
- Add per-layer volume sliders
- Gate multi-layer to Premium (single sound stays free) — hook already supports this
- **Test:** Play 2-3 sounds simultaneously, adjust volumes, verify cleanup on session end

#### 2.3 Add Pet Interaction UI
**Files:** `src/components/collection/PetDetailModal.tsx`
**Work:**
- Add Feed, Play, Train, Gift buttons to `PetDetailModal` for owned pets
- Import and call `feedPet()`, `playWithPet()`, `trainPet()`, `giftTreat()` from `useBondSystem`
- Display current bond level and progress bar
- Show pet mood with emoji/label
- Show unlocked abilities list
- Add cooldown indicators (interactions already have cooldowns in the hook)
- **Test:** Interact with pets, verify bond XP increments, level-ups trigger, mood updates display

#### 2.4 Wire Bond Bonuses into Reward System
**Files:** `src/components/focus-timer/hooks/useTimerRewards.ts`, `src/hooks/useBondSystem.ts`
**Work:**
- In `useTimerRewards.ts`, import `getAbilityBonuses()` from `useBondSystem`
- Apply `focusBonus` as percentage modifier to coin rewards
- Apply `experienceBonus` as percentage modifier to XP rewards
- Show bonus breakdown in session completion summary (e.g., "+12% from Pixel Frog bond")
- **Test:** Level up a pet's bond, complete sessions, verify bonus appears in rewards

#### 2.5 Enable Premium Backgrounds
**Files:** `src/data/ShopData.ts`
**Work:**
- Remove `comingSoon: true` from backgrounds that are ready to ship (at minimum, the 5 Sky Bundle ones since the bundle already exists)
- For backgrounds with actual image assets ready, set `comingSoon: false`
- For backgrounds without assets, keep `comingSoon: true` but remove them from the visible shop listing
- **Test:** Purchase a background with coins, verify it equips and displays on home island

#### 2.6 Update Special Event Dates
**Files:** `src/data/GamificationData.ts`
**Work:**
- Update all 4 event dates to upcoming dates
- Add recurring event schedule logic (e.g., Double XP every other weekend)
- Or implement a remote config system so events can be activated without app updates
- **Test:** Verify event banner appears during active event window, bonuses apply

#### 2.7 Wire Full Data Backup into Settings UI
**Files:** `src/components/Settings.tsx`, `src/hooks/useDataBackup.ts`
**Work:**
- Add "Backup Data" and "Restore Data" buttons in the Settings Data Management section
- Import `useDataBackup` hook
- Wire `createBackup()` to the backup button
- Wire `restoreBackup()` to the restore button with file picker
- **Test:** Create backup, clear data, restore backup, verify all state restored

#### 2.8 Verify Widget Data Pipeline
**Files:** `src/hooks/useAppStateTracking.ts` or `src/components/focus-timer/hooks/useTimerLogic.ts`
**Work:**
- Add `widgetDataService.updateTimer()` calls in timer start/pause/complete flows
- Add `widgetDataService.updateStreak()` calls when streaks change
- Add `widgetDataService.updateDailyProgress()` calls on session complete
- Add `widgetDataService.syncFromAppState()` call on app foreground
- **Test:** Start a focus session, verify widget updates on the home screen in real-time

---

### TIER 3: MARKETING COPY FIXES (Ship with next App Store update)

#### 3.1 Revise "Feed them, play with them" Language
**Option A (if Tier 2.3 ships first):** Keep the claim — it will be true.
**Option B (if Tier 2.3 is delayed):** Change to "Collect them, bond with them, and watch them grow as you level up together" — which accurately describes the auto-bonding on focus sessions.

#### 3.2 Soften Pet Ability Language
Currently abilities like "Fresh Start" and "Dewdrop Shield" imply gameplay effects. Options:
- **Option A:** Make abilities functional (Tier 2.4 partially does this via bond bonuses)
- **Option B:** Reframe as personality traits rather than abilities in UI copy

#### 3.3 Remove or Qualify "Leaderboard" and Social Claims
- Remove "climb the leaderboard" from all marketing
- Don't claim social features until they exist
- The "Social Butterfly" achievement should be hidden or recategorized

---

### TIER 4: STRATEGIC FEATURES (Roadmap — next 3-6 months)

Based on market research, these are the highest-impact features to close competitive gaps.

#### 4.1 Social Features (Friends + Co-Focus)
**Priority:** HIGH — every major competitor has social features.
**Scope:**
- Friend system (add by username/link)
- Co-focus sessions (start a timer together)
- Focus leaderboard (daily/weekly/all-time among friends)
- Achievement sharing with images (not just text)
**Justification:** Social accountability is proven to drive retention. Forest's co-planting and Habitica's party system are their strongest retention mechanics.

#### 4.2 Android App
**Priority:** HIGH — locks out 50%+ of addressable market.
**Scope:** Capacitor already supports Android. Main work is:
- Replace iOS-only Screen Time APIs with Android equivalent (UsageStatsManager or Digital Wellbeing)
- Replace StoreKit with Google Play Billing
- Replace iOS widgets with Android widgets (Glance API)
- Build and test
**Justification:** Forest, Finch, Habitica, ScreenZen, and Opal all have Android apps.

#### 4.3 Real-World Impact Tie-In
**Priority:** MEDIUM — Forest's #1 word-of-mouth driver.
**Scope:**
- Partner with a tree planting org (Trees for the Future, One Tree Planted)
- "Every 100 focus minutes plants a real tree" or similar
- Show impact counter (trees planted by community)
**Justification:** Forest has planted 200M+ real trees. It is their strongest marketing differentiator and the feature most cited in 5-star reviews.

#### 4.4 Apple Watch App
**Priority:** MEDIUM
**Scope:**
- Show current pet + streak on watch face
- Start/stop focus sessions from wrist
- Haptic notifications for session milestones
**Justification:** Be Focused and Opal support Apple Watch. "Glanceable" pet status is a natural fit.

#### 4.5 Dynamic Island / Live Activities
**Priority:** MEDIUM
**Scope:**
- Show timer countdown + pet in Dynamic Island during focus sessions
- Live Activity on lock screen with progress
**Justification:** Plantie already has this. Natural fit for focus timers.

#### 4.6 Pricing Restructure
**Priority:** MEDIUM
**Current:** $5.99/mo, $44.99/yr, $9.99/mo Plus, $79.99/yr Plus, $99.99 lifetime
**Recommendation:**
- Reduce Premium to **$3.99/mo or $29.99/yr** to compete with Forest ($3.99 one-time) and Finch ($14.99/yr)
- Keep Premium Plus at current pricing as the "whale" tier
- Consider a **$9.99 one-time "Lite" upgrade** (unlock backgrounds + 1 extra sound layer) for users who reject subscriptions
- Expand free tier slightly (2 sound layers free, more backgrounds) to improve ratings/reviews
**Justification:** Most direct competitors are free or one-time purchase. Our subscription without enabled features (Battle Pass, backgrounds, sound mixing) is hard to justify.

---

## Implementation Priority Matrix

```
                        HIGH IMPACT
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
    │  1.1 Coin Pack Bug    │  4.1 Social Features  │
    │  1.2 BG Guard Fix     │  4.2 Android App      │
    │  2.1 Battle Pass      │  4.3 Real-World Impact│
    │  2.2 Sound Mixer UI   │                       │
    │  2.5 Enable BGs       │                       │
LOW ├───────────────────────┼───────────────────────┤ HIGH
EFFORT│                     │                       │ EFFORT
    │  1.3 Remove Leaderboard│  4.4 Apple Watch     │
    │  1.4 Fix "8 Worlds"  │  4.5 Dynamic Island   │
    │  2.3 Pet Interaction  │  4.6 Pricing Change   │
    │  2.4 Bond Bonuses     │                       │
    │  2.6 Event Dates      │                       │
    │  2.7 Data Backup UI   │                       │
    │  2.8 Widget Pipeline  │                       │
    │  3.1-3.3 Copy Fixes   │                       │
    │                       │                       │
    └───────────────────────┼───────────────────────┘
                            │
                        LOW IMPACT
```

**Recommended execution order:**
1. **Week 1:** Tier 1 (urgent bug fixes + false claim removal)
2. **Weeks 2-4:** Tier 2 (enable built features — Battle Pass, Sound Mixer, Pet Interactions, Backgrounds)
3. **With next App Store update:** Tier 3 (marketing copy corrections)
4. **Months 2-6:** Tier 4 (strategic features — social, Android, real-world impact)
