# Website Blocking (Focus Shield Domains) — Detailed Implementation Plan

## Overview

Surface the **already-working** native iOS `FamilyActivityPicker` web domain selection as a **premium-gated** feature integrated directly into the Focus Shield card. The native picker already shows domains, the Swift code already applies `webDomainTokens` shields via `store.shield.webDomains`, and `startAppBlocking()` already blocks them. We need to:

1. Pipe `selectedDomainsCount` from Swift → TypeScript through the full stack
2. Integrate website blocking into the Focus Shield UI as a premium section
3. Advertise "Website Blocking" as a feature in all subscription plans
4. Clean up the dead `useFocusMode` website code that never worked

---

## Step 1: Swift — Add `selectedDomainsCount` to `BlockingStatus`

### File: `ios/App/App/Sources/Core/Protocols.swift`

**Current `BlockingStatus` struct (lines 91-111):**
```swift
struct BlockingStatus {
    let isBlocking: Bool
    let focusSessionActive: Bool
    let shieldAttempts: Int
    let lastShieldAttemptTimestamp: TimeInterval
    let hasAppsConfigured: Bool
    let selectedAppsCount: Int
    let selectedCategoriesCount: Int
    // ❌ Missing: selectedDomainsCount
}
```

**Changes:**
1. Add `let selectedDomainsCount: Int` field after `selectedCategoriesCount` (line 98)
2. Add `"selectedDomainsCount": selectedDomainsCount` to `asDictionary` (line 108)
3. Update `hasAppsConfigured` check consideration — domains also count as "configured"

**New struct:**
```swift
struct BlockingStatus {
    let isBlocking: Bool
    let focusSessionActive: Bool
    let shieldAttempts: Int
    let lastShieldAttemptTimestamp: TimeInterval
    let hasAppsConfigured: Bool
    let selectedAppsCount: Int
    let selectedCategoriesCount: Int
    let selectedDomainsCount: Int  // NEW

    var asDictionary: [String: Any] {
        [
            "isBlocking": isBlocking,
            "focusSessionActive": focusSessionActive,
            "shieldAttempts": shieldAttempts,
            "lastShieldAttemptTimestamp": lastShieldAttemptTimestamp,
            "hasAppsConfigured": hasAppsConfigured,
            "selectedAppsCount": selectedAppsCount,
            "selectedCategoriesCount": selectedCategoriesCount,
            "selectedDomainsCount": selectedDomainsCount  // NEW
        ]
    }
}
```

### File: `ios/App/App/Sources/Managers/AppBlockingManager.swift`

**Current `getBlockingStatus()` (lines 163-174):**
```swift
func getBlockingStatus() -> BlockingStatus {
    let selection = loadActivitySelection()
    return BlockingStatus(
        ...
        selectedAppsCount: selection?.applicationTokens.count ?? 0,
        selectedCategoriesCount: selection?.categoryTokens.count ?? 0
        // ❌ Missing: selectedDomainsCount
    )
}
```

**Changes:**
1. Add `selectedDomainsCount: selection?.webDomainTokens.count ?? 0` to the `BlockingStatus` initializer (after line 172)
2. Update `hasAppsConfigured` to also consider domains: domains-only selections should also count as "configured"

**Updated code:**
```swift
func getBlockingStatus() -> BlockingStatus {
    let selection = loadActivitySelection()
    let appsCount = selection?.applicationTokens.count ?? 0
    let categoriesCount = selection?.categoryTokens.count ?? 0
    let domainsCount = selection?.webDomainTokens.count ?? 0

    return BlockingStatus(
        isBlocking: isBlocking,
        focusSessionActive: focusDataManager.isFocusSessionActive,
        shieldAttempts: focusDataManager.shieldAttempts,
        lastShieldAttemptTimestamp: focusDataManager.lastShieldAttemptTimestamp,
        hasAppsConfigured: hasAppsConfigured,
        selectedAppsCount: appsCount,
        selectedCategoriesCount: categoriesCount,
        selectedDomainsCount: domainsCount
    )
}
```

Also update `hasAppsConfigured` computed property (line 57-66) to include domains:
```swift
var hasAppsConfigured: Bool {
    if let store = store,
       let apps = store.shield.applications,
       !apps.isEmpty {
        return true
    }
    // Also check web domains on the store
    if let store = store,
       let domains = store.shield.webDomains,
       !domains.isEmpty {
        return true
    }
    return userDefaults?.data(forKey: AppConfig.StorageKeys.blockedAppsSelection) != nil
}
```

### File: `ios/App/AppTests/` — Update test mocks

Any test mocks for `BlockingStatus` will need the new `selectedDomainsCount` parameter.

---

## Step 2: TypeScript Plugin Definitions

### File: `src/plugins/device-activity/definitions.ts`

**Current `BlockingStatus` interface (lines 1-10):**
```typescript
export interface BlockingStatus {
  isBlocking: boolean;
  focusSessionActive: boolean;
  shieldAttempts: number;
  lastShieldAttemptTimestamp: number;
  hasAppsConfigured: boolean;
  selectedAppsCount: number;
  selectedCategoriesCount: number;
  // ❌ Missing: selectedDomainsCount
}
```

**Change:** Add `selectedDomainsCount: number` after `selectedCategoriesCount` (after line 9):
```typescript
export interface BlockingStatus {
  isBlocking: boolean;
  focusSessionActive: boolean;
  shieldAttempts: number;
  lastShieldAttemptTimestamp: number;
  hasAppsConfigured: boolean;
  selectedAppsCount: number;
  selectedCategoriesCount: number;
  selectedDomainsCount: number;  // NEW
}
```

---

## Step 3: `useDeviceActivity` Hook — Track domain counts

### File: `src/hooks/useDeviceActivity.ts`

This needs changes in **10 specific locations** (every place `selectedAppsCount`/`selectedCategoriesCount` is set):

### 3a. Interface (line 22-23)
Add field:
```typescript
interface DeviceActivityState {
  // ... existing fields ...
  selectedAppsCount: number;
  selectedCategoriesCount: number;
  selectedDomainsCount: number;  // NEW — after line 23
  // ...
}
```

### 3b. Default state (line 135-136)
Add initialization:
```typescript
selectedAppsCount: 0,
selectedCategoriesCount: 0,
selectedDomainsCount: 0,  // NEW — after line 136
```

### 3c. `_doNativeInit` fallback (lines 260-268)
Add to `getBlockingStatus` fallback object:
```typescript
{
  isBlocking: false,
  focusSessionActive: false,
  shieldAttempts: 0,
  lastShieldAttemptTimestamp: 0,
  hasAppsConfigured: false,
  selectedAppsCount: 0,
  selectedCategoriesCount: 0,
  selectedDomainsCount: 0,  // NEW
} as BlockingStatus,
```

### 3d. `_doNativeInit` setState (lines 272-283)
Add field:
```typescript
setState(prev => ({
  ...prev,
  // ... existing fields ...
  selectedAppsCount: blockingStatus.selectedAppsCount,
  selectedCategoriesCount: blockingStatus.selectedCategoriesCount,
  selectedDomainsCount: blockingStatus.selectedDomainsCount,  // NEW
  // ...
}));
```

### 3e. `requestPermissions` fallback (lines 413-421)
Add to `getBlockingStatus` fallback object:
```typescript
{
  // ... existing fields ...
  selectedAppsCount: 0,
  selectedCategoriesCount: 0,
  selectedDomainsCount: 0,  // NEW
} as BlockingStatus,
```

### 3f. `requestPermissions` permPatch (lines 425-434)
Add field:
```typescript
const permPatch = {
  // ... existing fields ...
  selectedAppsCount: blockingStatus.selectedAppsCount,
  selectedCategoriesCount: blockingStatus.selectedCategoriesCount,
  selectedDomainsCount: blockingStatus.selectedDomainsCount,  // NEW
};
```

### 3g. `getBlockingStatus` fallback (lines 575-583)
Add to fallback object:
```typescript
const fallbackStatus: BlockingStatus = {
  // ... existing fields ...
  selectedAppsCount: 0,
  selectedCategoriesCount: 0,
  selectedDomainsCount: 0,  // NEW
};
```

### 3h. `getBlockingStatus` setState (lines 599-607)
Add field:
```typescript
setState(prev => ({
  ...prev,
  // ... existing fields ...
  selectedAppsCount: status.selectedAppsCount,
  selectedCategoriesCount: status.selectedCategoriesCount,
  selectedDomainsCount: status.selectedDomainsCount,  // NEW
}));
```

### 3i. `openAppPicker` (lines 670-704)
Extract `domainsSelected` from picker result and add to `pickerPatch`:
```typescript
if (success && result?.success) {
  const appsSelected = result.appsSelected ?? 0;
  const categoriesSelected = result.categoriesSelected ?? 0;
  const domainsSelected = result.domainsSelected ?? 0;  // NEW
  deviceActivityLogger.info(
    `App picker done: ${appsSelected} apps, ${categoriesSelected} categories, ${domainsSelected} domains`
  );
  // Refresh blocking status after selection change
  const { result: status } = await safePluginCall(
    () => DeviceActivity.getBlockingStatus(),
    {
      // ... existing fields ...
      selectedAppsCount: appsSelected,
      selectedCategoriesCount: categoriesSelected,
      selectedDomainsCount: domainsSelected,  // NEW
    } as BlockingStatus,
    'getBlockingStatus-afterPicker'
  );
  const pickerPatch = {
    hasAppsConfigured: status.hasAppsConfigured || (result.hasSelection ?? false),
    selectedAppsCount: status.selectedAppsCount || appsSelected,
    selectedCategoriesCount: status.selectedCategoriesCount || categoriesSelected,
    selectedDomainsCount: status.selectedDomainsCount || domainsSelected,  // NEW
  };
  // ... rest stays the same
}
```

### 3j. `clearSelectedApps` (lines 753-759)
Add reset:
```typescript
setState(prev => ({
  ...prev,
  hasAppsConfigured: false,
  isBlocking: false,
  selectedAppsCount: 0,
  selectedCategoriesCount: 0,
  selectedDomainsCount: 0,  // NEW
}));
```

### 3k. `blockedAppsCount` computed value (line 880-882)
Keep as-is (apps + categories). But add a new computed for domains:
```typescript
const blockedAppsCount = isNative
  ? state.selectedAppsCount + state.selectedCategoriesCount
  : simulatedApps.filter(app => app.isBlocked).length;

const blockedDomainsCount = isNative    // NEW
  ? state.selectedDomainsCount
  : 0;
```

### 3l. Return value (line 884-913)
Add to return:
```typescript
return {
  ...state,
  isNative,
  simulatedApps,
  blockedAppsCount,
  blockedDomainsCount,  // NEW
  // ... rest stays the same
};
```

---

## Step 4: Premium Feature — Add to subscription plans

### File: `src/hooks/usePremiumStatus.ts`

### 4a. Add to `FeatureType` union (line 699-701)
```typescript
type FeatureType = 'ambient_sounds' | 'auto_breaks' | 'session_notes' | 'advanced_analytics' |
                   'sound_mixing' | 'focus_presets' | 'battle_pass' | 'founder_badge' | 'founder_pet' |
                   'all_timer_backgrounds' | 'website_blocking';  // NEW
```

No special logic needed — all premium tiers get it via the default `return true`.

### 4b. Add feature string to ALL subscription plan `features` arrays (lines 98-208)
Add `'Website blocking'` to every plan:

**Premium Monthly (line 107-116):**
```typescript
features: [
  '1.5x Coin & XP multiplier',
  '3 Lucky Wheel spins/day',
  '1.5x Daily login coins',
  'Full analytics dashboard',
  'All 13 ambient sounds',
  'Auto-break Pomodoro cycles',
  '2 Streak Freezes/month',
  'All timer backgrounds',
  'Website blocking',           // NEW
],
```

**Premium Yearly (line 128-137):** — same, add `'Website blocking'`

**Premium+ Monthly (line 151-159):**
```typescript
features: [
  '2x Coin & XP multiplier',
  '5 Lucky Wheel spins/day',
  '2x Daily login coins',
  'Everything in Premium',
  'Battle Pass Premium included',
  '5 Streak Freezes/month',
  'Sound mixing (3 layers)',
  'All timer backgrounds',
  'Website blocking',           // NEW
],
```

**Premium+ Yearly (line 172-180):** — same, add `'Website blocking'`

**Lifetime (line 193-201):**
```typescript
features: [
  '2.5x Coin & XP multiplier',
  '5 Lucky Wheel spins/day',
  '2x Daily login coins',
  'Everything in Premium+',
  'No recurring fees ever',
  'Exclusive Founder badge',
  'Founder-only legendary pet',
  '10 Focus presets',
  'Website blocking',           // NEW
],
```

### File: `src/components/PremiumSubscription.tsx`

### 4c. Add to `FEATURE_MAP` (after line 67)
Add the mapping so the feature renders with a Globe icon:
```typescript
'Website blocking': { icon: <Globe className="w-3.5 h-3.5" />, label: 'Block Websites' },
```

Also add `Globe` to the lucide-react import at the top of the file (line 2-21).

---

## Step 5: `SettingsFocusMode.tsx` — Integrate into Focus Shield card

### File: `src/components/settings/SettingsFocusMode.tsx`

**Design decision:** Instead of a separate card, integrate website blocking INTO the existing Focus Shield card as a premium sub-section. This makes it feel like one cohesive feature and avoids card bloat.

### 5a. Clean up dead code
- Remove `SUGGESTED_WEBSITES` from `useFocusMode` import (line 6)
- Remove `addBlockedWebsite`, `removeBlockedWebsite` from destructuring (line 17-18)
- Remove `newWebsite` state (line 21)
- Remove `handleAddWebsite` function (lines 48-53)
- Update import to just: `import { useFocusMode } from '@/hooks/useFocusMode';`

### 5b. Add new destructured values
From `useDeviceActivity()`, add `selectedDomainsCount`:
```typescript
const {
  // ... existing destructured values ...
  selectedDomainsCount: shieldSelectedDomains,  // NEW
} = useDeviceActivity();
```

### 5c. Update `shieldLabel` (lines 38-46)
Expand to include domains:
```typescript
const shieldLabel = (() => {
  const parts: string[] = [];

  // Apps part
  if (shieldSelectedApps > 0 && shieldSelectedCategories > 0) {
    parts.push(`${shieldSelectedApps} app${shieldSelectedApps !== 1 ? 's' : ''} & ${shieldSelectedCategories} group${shieldSelectedCategories !== 1 ? 's' : ''}`);
  } else if (shieldSelectedCategories > 0) {
    parts.push(`${shieldSelectedCategories} app group${shieldSelectedCategories !== 1 ? 's' : ''}`);
  } else if (shieldSelectedApps > 0) {
    parts.push(`${shieldSelectedApps} app${shieldSelectedApps !== 1 ? 's' : ''}`);
  }

  // Domains part (premium only)
  if (isPremium && shieldSelectedDomains > 0) {
    parts.push(`${shieldSelectedDomains} website${shieldSelectedDomains !== 1 ? 's' : ''}`);
  }

  return parts.join(' & ') || `${shieldBlockedCount} app${shieldBlockedCount !== 1 ? 's' : ''}`;
})();
```

### 5d. Add Website Blocking section INSIDE the Focus Shield card

After the existing "Select Apps to Block" button area (after line 217), when permission is granted, add a website blocking sub-section:

```
┌─────────────────────────────────────────────┐
│ 🛡️ Focus Shield                    Active ✅│
│ 3 apps & 2 websites will be blocked         │
│                                             │
│ [+ Change Blocked Apps]                     │
│                                             │
│ ── Website Blocking ── 👑 PREMIUM ────────  │
│                                             │
│ FOR FREE USERS:                             │
│ 🌐 Block distracting websites              │
│ Block websites like Instagram, TikTok       │
│ & more during focus sessions                │
│ [👑 Go Premium to Unlock]                   │
│                                             │
│ FOR PREMIUM USERS (domains configured):     │
│ 🌐 2 websites will be blocked              │
│ Websites are blocked via Screen Time        │
│ [Change Blocked Websites]                   │
│                                             │
│ FOR PREMIUM USERS (no domains yet):         │
│ 🌐 Block distracting websites              │
│ Select websites to block via Screen Time    │
│ [+ Select Websites to Block]                │
│                                             │
│ ℹ️ Perfect focus = +25% XP & +50 coins     │
└─────────────────────────────────────────────┘
```

**JSX structure for the website section:**

```tsx
{/* Website Blocking Section — inside Focus Shield card, after app picker button */}
<div className="border-t border-purple-600/30 mt-3 pt-3">
  <div className="flex items-center gap-2 mb-2">
    <Globe className="w-3.5 h-3.5 text-purple-400" />
    <span className="text-xs font-bold text-white">Website Blocking</span>
    {!isPremium && (
      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider"
        style={{
          background: 'linear-gradient(180deg, hsl(35 90% 55%), hsl(25 90% 50%))',
          border: '1px solid hsl(40 80% 65%)',
          color: 'white',
        }}>
        <Crown className="w-2.5 h-2.5 inline mr-0.5" />
        Premium
      </span>
    )}
    {isPremium && shieldSelectedDomains > 0 && (
      <span className="px-1.5 py-0.5 rounded-md bg-green-500/20 border border-green-500/30 text-[9px] font-bold text-green-400">
        {shieldSelectedDomains} selected
      </span>
    )}
  </div>

  {!isPremium ? (
    /* FREE USER — Premium upsell */
    <div className="rounded-lg p-3"
      style={{
        background: 'linear-gradient(135deg, hsl(35 80% 50% / 0.06) 0%, hsl(280 60% 50% / 0.04) 100%)',
        border: '1.5px dashed hsl(35 70% 50% / 0.25)',
      }}>
      <p className="text-[11px] text-purple-300/80 mb-2">
        Block distracting websites like Instagram, TikTok & more during focus sessions.
      </p>
      <button
        onClick={() => setShowPremiumModal(true)}
        className="w-full py-2 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
        style={{
          background: 'linear-gradient(180deg, hsl(35 90% 55%), hsl(25 90% 50%))',
          border: '2px solid hsl(40 80% 65%)',
          boxShadow: '0 3px 0 hsl(25 80% 30%), 0 0 10px hsl(35 100% 50% / 0.2)',
          color: 'white',
          textShadow: '0 1px 0 rgba(0,0,0,0.3)',
        }}>
        <Crown className="w-3 h-3" />
        Go Premium to Unlock
      </button>
    </div>
  ) : (
    /* PREMIUM USER */
    <div className="space-y-2">
      {shieldSelectedDomains > 0 ? (
        /* Has domains configured */
        <>
          <p className="text-[11px] text-purple-300/80">
            {shieldSelectedDomains} website{shieldSelectedDomains !== 1 ? 's' : ''} will be blocked via Screen Time during focus.
          </p>
          <button
            onClick={() => shieldOpenAppPicker()}
            className="w-full retro-arcade-btn retro-arcade-btn-purple py-2 px-4 text-xs"
          >
            <Globe className="w-3 h-3 inline mr-1" />
            Change Blocked Websites
          </button>
        </>
      ) : (
        /* No domains yet */
        <>
          <p className="text-[11px] text-purple-300/80">
            Select websites to block via Screen Time during focus sessions.
          </p>
          <button
            onClick={() => shieldOpenAppPicker()}
            className="w-full retro-arcade-btn retro-arcade-btn-purple py-2 px-4 text-xs"
          >
            <Plus className="w-3 h-3 inline mr-1" />
            Select Websites to Block
          </button>
        </>
      )}
    </div>
  )}
</div>
```

**Important notes:**
- The website section only shows when `shieldPermissionGranted` is true (inside the existing permission-granted branch)
- Both "Change Blocked Apps" and "Change Blocked Websites" buttons call the same `shieldOpenAppPicker()` — the native picker shows apps, categories AND domains all at once
- The separation is purely UI labeling to make the feature feel distinct and premium-worthy
- Globe icon used for website section to distinguish from Shield icon for apps

### 5e. Update the description text (lines 153-159)
When domains are also configured, update the subtitle:
```typescript
<p className="text-[11px] text-purple-300/80">
  {shieldPermissionGranted
    ? shieldAppsConfigured || (isPremium && shieldSelectedDomains > 0)
      ? `${shieldLabel} will be blocked during focus`
      : 'Tap to select apps to block'
    : 'Block distracting apps via Screen Time'
  }
</p>
```

---

## Step 6: `AppBlockingSection.tsx` — Show domains during active sessions

### File: `src/components/focus-timer/AppBlockingSection.tsx`

### 6a. Destructure new field (line 18-30)
Add `selectedDomainsCount` to the destructuring:
```typescript
const {
  // ... existing fields ...
  selectedDomainsCount,  // NEW
} = useDeviceActivity();
```

### 6b. Update `blockedLabel` (lines 37-45)
Build a richer label that includes domains:
```typescript
const blockedLabel = (() => {
  const parts: string[] = [];

  // Apps + categories
  if (selectedAppsCount > 0 && selectedCategoriesCount > 0) {
    parts.push(`${selectedAppsCount} app${selectedAppsCount !== 1 ? 's' : ''} & ${selectedCategoriesCount} group${selectedCategoriesCount !== 1 ? 's' : ''}`);
  } else if (selectedCategoriesCount > 0) {
    parts.push(`${selectedCategoriesCount} app group${selectedCategoriesCount !== 1 ? 's' : ''}`);
  } else if (selectedAppsCount > 0) {
    parts.push(`${selectedAppsCount} app${selectedAppsCount !== 1 ? 's' : ''}`);
  }

  // Domains
  if (selectedDomainsCount > 0) {
    parts.push(`${selectedDomainsCount} website${selectedDomainsCount !== 1 ? 's' : ''}`);
  }

  return parts.join(' & ') || `${blockedAppsCount} app${blockedAppsCount !== 1 ? 's' : ''}`;
})();
```

### 6c. Update active blocking status text (line 288)
```typescript
<span className="text-sm text-green-300 font-medium">
  Focus mode active — {selectedDomainsCount > 0 ? 'apps & websites' : 'apps'} are blocked
</span>
```

### 6d. Add website info bullet (lines 264-277)
Add a bullet about websites if domains are selected:
```typescript
{selectedDomainsCount > 0 && (
  <div className="flex items-start gap-2 text-xs text-white/50">
    <span className="text-cyan-400">•</span>
    <span>Selected websites are blocked in Safari</span>
  </div>
)}
```

### 6e. Update `hasAppsConfigured` usage
The `hasAppsConfigured` flag already covers domains too (from our Swift change), so the expand/collapse and status display logic works without changes.

---

## Step 7: Clean up dead website code in `useFocusMode.ts`

### File: `src/hooks/useFocusMode.ts`

### 7a. Remove `SUGGESTED_WEBSITES` export (lines 44-55)
Delete the entire array.

### 7b. Remove `blockedWebsites` from interface (line 22)
```diff
 export interface FocusModeSettings {
   enabled: boolean;
   strictMode: boolean;
   blockNotifications: boolean;
   blockedApps: BlockedApp[];
-  blockedWebsites: string[];
   allowEmergencyBypass: boolean;
   bypassCooldown: number;
 }
```

### 7c. Remove `blockedWebsites` from `defaultSettings` (line 62)
```diff
 const defaultSettings: FocusModeSettings = {
   enabled: true,
   strictMode: false,
   blockNotifications: true,
   blockedApps: SUGGESTED_APPS,
-  blockedWebsites: ['instagram.com', 'tiktok.com', 'twitter.com', 'x.com', 'facebook.com'],
   allowEmergencyBypass: true,
   bypassCooldown: 30,
 };
```

### 7d. Remove `addBlockedWebsite` function (lines 152-167)
Delete entirely.

### 7e. Remove `removeBlockedWebsite` function (lines 170-181)
Delete entirely.

### 7f. Remove from return value (lines 256-257)
```diff
 return {
   settings,
   isLoading,
   isFocusModeActive,
   isNativeBlocking,
   isNative,
   blockedAppsCount,
   updateSettings,
   toggleAppBlocking,
-  addBlockedWebsite,
-  removeBlockedWebsite,
   activateFocusMode,
   deactivateFocusMode,
   getBlockedApps,
   resetToDefaults,
 };
```

**Note:** Existing `localStorage` data with `blockedWebsites` is harmlessly ignored because `setSettings` spreads with `...defaultSettings` first, and removed fields just get dropped.

---

## Step 8: Native Picker Title Update

### File: `ios/App/App/Sources/DeviceActivityPlugin.swift`

The `AppPickerView` (line 516-541) currently shows `"Block Apps"` as the navigation title. Update to reflect that it also handles websites:

```swift
FamilyActivityPicker(selection: $selection)
    .navigationTitle("Block Apps & Websites")  // Updated from "Block Apps"
    .navigationBarTitleDisplayMode(.inline)
```

---

## File Change Summary

| # | File | Change Type | Description |
|---|------|-------------|-------------|
| 1 | `ios/.../Core/Protocols.swift` | Swift struct | Add `selectedDomainsCount` field + dict entry |
| 2 | `ios/.../Managers/AppBlockingManager.swift` | Swift logic | Read `webDomainTokens.count`, update `hasAppsConfigured` |
| 3 | `ios/.../Sources/DeviceActivityPlugin.swift` | Swift UI | Rename picker title to "Block Apps & Websites" |
| 4 | `src/plugins/device-activity/definitions.ts` | TS interface | Add `selectedDomainsCount` to `BlockingStatus` |
| 5 | `src/hooks/useDeviceActivity.ts` | TS hook | Track + expose domain counts (10 locations) |
| 6 | `src/hooks/usePremiumStatus.ts` | TS hook | Add feature type + feature to all plans |
| 7 | `src/hooks/useFocusMode.ts` | TS hook | Remove dead website code |
| 8 | `src/components/PremiumSubscription.tsx` | React UI | Add Globe icon + feature mapping |
| 9 | `src/components/settings/SettingsFocusMode.tsx` | React UI | Premium-gated website section in Focus Shield |
| 10 | `src/components/focus-timer/AppBlockingSection.tsx` | React UI | Show domain counts in session view |

---

## UI Flow Summary

### Free User Path
1. Sees Focus Shield card with app blocking
2. Inside the card, sees "Website Blocking" section with Crown/Premium badge
3. Dashed amber border + "Block distracting websites..." description
4. "Go Premium to Unlock" gold button → opens PremiumSubscription modal
5. In modal, sees "Block Websites" as a feature pill on every plan

### Premium User Path (first time)
1. Sees Focus Shield card
2. Inside, sees "Website Blocking" section (no lock)
3. "Select websites to block via Screen Time" + purple button
4. Taps button → opens native FamilyActivityPicker (shows apps, categories, AND domains)
5. Selects websites → Done → card updates to show "2 websites will be blocked"
6. Header label shows "3 apps & 2 websites will be blocked during focus"

### During Focus Session
1. Focus Shield header: "3 apps & 2 websites blocked" with ACTIVE badge
2. Status text: "Focus mode active — apps & websites are blocked"
3. Info bullets include "Selected websites are blocked in Safari"
4. Shield attempt tracking works for both apps and websites

---

## What We're NOT Doing

- No custom website input/list UI (native picker handles domain selection)
- No Safari Content Blocker extension (future work)
- No DNS filtering (future work)
- No new native plugin methods (`openAppPicker` already includes domains)
- No changes to timer/blocking logic (`startAppBlocking` already blocks domains)
- No separate "website picker" — the same picker handles everything
