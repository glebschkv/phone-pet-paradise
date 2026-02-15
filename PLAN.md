# App Store Review Rejection Fix Plan

> **Submission ID:** 16f77c25-7992-4867-b251-4a99292d192d
> **Review Date:** February 15, 2026
> **App:** NoMo Phone v1.0

Apple rejected the app for 4 guidelines. This plan addresses each one with root-cause analysis, exact file locations, and specific code changes.

---

## Issue 1: Guideline 2.2 — Beta Testing (App appears to be pre-release)

### Root Cause

Apple's reviewer saw multiple signals that the app is incomplete/beta:

**Signal A — VersionNotice.tsx modal on first launch**
- File: `src/components/VersionNotice.tsx`
- Lines 54-57 display: *"This app is built by a solo indie developer. Sorry if you run into any bugs or rough edges — it's still early days and things are actively being improved."*
- The phrase "still early days" and "bugs or rough edges" directly tells Apple this is a beta.

**Signal B — Battle Pass is visible but greyed out with "COMING SOON"**
- File: `src/components/gamification/GamificationHub.tsx:41`
- `BATTLE_PASS_COMING_SOON = true` — the feature is fully built (4 seasons, 50-tier progression, reward claiming, modal UI, hooks) but disabled behind a feature flag.
- The Battle Pass card is visible in the Gamification Hub but greyed out with a "COMING SOON" overlay.

**Signal C — 14 premium backgrounds displayed with "Coming Soon" overlays**
- File: `src/data/ShopData.ts` (lines 101-193)
- All 14 premium backgrounds have `comingSoon: true` — they show in the shop with prices but cannot be purchased.
- Backgrounds: Sakura, Cyberpunk, Aurora, Crystal Cave, Volcano, Space, Underwater, Halloween, Winter Wonderland + 5 Sky Bundle items.

**Signal D — All special events and battle pass seasons have expired dates**
- File: `src/data/GamificationData.ts`
- All 4 special events have dates in Dec 2024 / Jan 2025 (over a year ago).
- All 4 battle pass seasons ended before Feb 2026.
- `getActiveEvents()` returns an empty array — event banners never show.

### Fix Plan

| # | Change | File(s) | Details |
|---|--------|---------|---------|
| 1A | **Rewrite VersionNotice copy** | `src/components/VersionNotice.tsx:54-57` | Remove "bugs or rough edges" and "still early days". Replace with confident, neutral language like: *"This app is built by a solo indie developer. Your feedback helps make it better — reach out anytime."* Keep the bug report email but frame it as feedback, not an expectation of bugs. |
| 1B | **Enable Battle Pass** | `src/components/gamification/GamificationHub.tsx:41` | Set `BATTLE_PASS_COMING_SOON = false`. |
| 1C | **Update Battle Pass season dates** | `src/data/GamificationData.ts` | Update all 4 season start/end dates to current/future dates (e.g., Winter 2026: Feb-Apr, Spring 2026: Apr-Jun, Summer 2026: Jun-Aug, Fall 2026: Aug-Oct). |
| 1D | **Enable premium backgrounds OR hide them** | `src/data/ShopData.ts` | **Option A (recommended):** Remove `comingSoon: true` from all backgrounds that have working theme assets. **Option B:** Remove `comingSoon` backgrounds from the shop listing entirely so they don't appear as unfinished features. |
| 1E | **Update special event dates** | `src/data/GamificationData.ts` | Update the 4 event dates to upcoming dates in 2026, or remove them if not ready. |

---

## Issue 2: Guideline 4.0 — Sign in with Apple Button Design

### Root Cause

The Sign in with Apple button is a fully custom-styled `<button>` element that doesn't follow Apple's Human Interface Guidelines. The issue is specifically about the button not looking clearly like a button — lacking sufficient border contrast or background.

- File: `src/pages/Auth.tsx:469-493`
- Current styling: Dark gradient background (`hsl(0 0% 12%)` to `hsl(0 0% 5%)`) with a `2px solid hsl(0 0% 22%)` border.
- On a dark-themed app, this creates very low contrast between the button and the surrounding background, making it hard to tell what is and isn't a button.
- Apple's HIG requires Sign in with Apple buttons to be clearly recognizable and use one of the standard Apple button styles (black, white, or outlined).

### Fix Plan

| # | Change | File(s) | Details |
|---|--------|---------|---------|
| 2A | **Replace custom button with Apple's standard ASAuthorizationAppleIDButton** | `src/pages/Auth.tsx:469-493` | The safest approach is to use Apple's official `ASAuthorizationAppleIDButton` component rendered natively, or closely replicate Apple's standard button style. Two options: |
| | **Option A (recommended): Use Apple's official button style** | `src/pages/Auth.tsx` | Style the button to exactly match Apple's Sign in with Apple button specification: solid black or white background, full-width, minimum 44pt height, Apple logo + "Sign in with Apple" text using SF Pro or system font, and rounded corners per HIG spec. Apple provides exact CSS/design specs. The button should have a clearly visible, opaque background (solid black `#000000` with white text and Apple logo, or solid white `#FFFFFF` with black text). |
| | **Option B: Native ASAuthorizationAppleIDButton** | `ios/App/App/Sources/` + `src/pages/Auth.tsx` | Create a native Capacitor plugin that renders the real `ASAuthorizationAppleIDButton` from AuthenticationServices framework. This guarantees compliance but requires more work. |

**Key requirements from Apple HIG:**
- Button must have a solid, opaque background (black, white, or outlined)
- Must use Apple's SF Symbol for the Apple logo or the official Apple logo asset
- Text must be "Sign in with Apple" or "Continue with Apple"
- Minimum height of 44pt
- Border radius should match Apple's specs
- No additional decorative elements inside the button that obscure its identity as a button

---

## Issue 3: Guideline 5.1.1 — Screen Time Permission Request

### Root Cause

Apple's objection is about the custom button text **"Enable Focus Shield"** that appears before the system permission dialog. Apple considers this to be an inappropriate word on a button preceding a permission request — the button should use neutral words like "Continue" or "Next" rather than directive/persuasive language like "Enable".

Three locations in the codebase use "Enable Focus Shield":

1. **`src/components/focus-timer/AppBlockingSection.tsx:99`** — Main focus timer page
2. **`src/components/settings/SettingsFocusMode.tsx:190`** — Settings page
3. **`src/components/onboarding/OnboardingFlow.tsx:1038`** — Onboarding flow

Additionally, `src/components/focus-timer/FocusShieldNudge.tsx:64` uses "Enable" as the button label (shorter form of the same issue).

### Fix Plan

| # | Change | File(s) | Details |
|---|--------|---------|---------|
| 3A | **Change button text in AppBlockingSection** | `src/components/focus-timer/AppBlockingSection.tsx:99` | Change `'Enable Focus Shield'` to `'Continue'`. Keep `'Requesting...'` and `'Try Again'` as-is (those are fine). |
| 3B | **Change button text in Settings** | `src/components/settings/SettingsFocusMode.tsx:190` | Change `'Enable Focus Shield'` to `'Continue'`. |
| 3C | **Change button text in Onboarding** | `src/components/onboarding/OnboardingFlow.tsx:1038` | Change `'Enable Focus Shield'` to `'Continue'`. |
| 3D | **Change button text in FocusShieldNudge** | `src/components/focus-timer/FocusShieldNudge.tsx:64` | Change `'Enable'` to `'Set Up'` or `'Continue'` — Apple's objection is about the word "Enable" specifically before a permission request. Since the nudge also has a "Set up" path (when permission is already granted), consider using `'Continue'` for both states. |

**Note:** The informational text *before* the button (e.g., "Enable Screen Time access to automatically block apps...") is acceptable — Apple only objects to the button label itself. However, it may be prudent to soften this text slightly too, e.g., "Screen Time access allows the app to block distracting apps during focus sessions."

---

## Issue 4: Guideline 2.1 — "Upgrade to Premium" Button Bug

### Root Cause

There is a **dead button** in the Settings > Focus Mode page. When a non-premium user views the Website Blocking section, they see an "Upgrade to Premium" button that has **no `onClick` handler** — tapping it does nothing.

- File: `src/components/settings/SettingsFocusMode.tsx:304-306`
- The button is a plain `<button>` with no click handler, no event binding:
  ```tsx
  <button className="px-4 py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-white text-sm font-bold">
    Upgrade to Premium
  </button>
  ```
- This is the exact button Apple's reviewer tapped and reported as "no action occurs."

**Additional context:** The main "Go Premium" button in the Shop (`src/components/shop/tabs/FeaturedTab.tsx:119-156`) works correctly — it calls `setShowPremiumModal(true)`. The Settings button is simply missing this handler.

### Fix Plan

| # | Change | File(s) | Details |
|---|--------|---------|---------|
| 4A | **Wire "Upgrade to Premium" button to open the Premium modal** | `src/components/settings/SettingsFocusMode.tsx:304` | Add an `onClick` handler that opens the Premium subscription modal. The component needs to: (1) import or receive the `setShowPremiumModal` callback, and (2) add `onClick={() => setShowPremiumModal(true)}` to the button. If the Premium modal isn't available in this component's scope, pass it down as a prop or use a global state/event to trigger it. |

---

## Summary of All Changes

| Priority | Guideline | Fix | Risk if not fixed |
|----------|-----------|-----|-------------------|
| **P0** | 2.1 (Bug) | Wire the "Upgrade to Premium" button onClick handler | Automatic rejection — broken functionality |
| **P0** | 5.1.1 (Privacy) | Change "Enable Focus Shield" → "Continue" on 4 buttons | Automatic rejection — privacy guideline violation |
| **P0** | 4.0 (Design) | Restyle Sign in with Apple button to match Apple's HIG specs | Automatic rejection — SIWA design requirement |
| **P0** | 2.2 (Beta) | Rewrite VersionNotice copy, enable Battle Pass, fix Coming Soon items, update expired dates | Automatic rejection — app appears incomplete |

### Files to modify (complete list):

1. `src/components/settings/SettingsFocusMode.tsx` — Wire premium button + fix "Enable Focus Shield" text
2. `src/components/focus-timer/AppBlockingSection.tsx` — Fix "Enable Focus Shield" text
3. `src/components/onboarding/OnboardingFlow.tsx` — Fix "Enable Focus Shield" text
4. `src/components/focus-timer/FocusShieldNudge.tsx` — Fix "Enable" button text
5. `src/pages/Auth.tsx` — Restyle Sign in with Apple button
6. `src/components/VersionNotice.tsx` — Rewrite "early days" copy
7. `src/components/gamification/GamificationHub.tsx` — Enable Battle Pass (`BATTLE_PASS_COMING_SOON = false`)
8. `src/data/GamificationData.ts` — Update season + event dates
9. `src/data/ShopData.ts` — Enable or hide Coming Soon backgrounds
