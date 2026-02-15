# Settings Rebrand Plan — From "AI Web App" to Native Game Feel

## Problem

The Settings page uses generic shadcn/Radix UI components (`retro-card`, plain `Switch`, `Label`, `Slider`, `AlertDialog`) with minimal game theming. Compared to the Gamification Hub (which uses `retro-arcade-container`, `retro-game-card`, `retro-neon-text`, `retro-pixel-text`, `retro-arcade-btn`, neon glows, and scanline overlays), Settings looks like a different app entirely — a generic web admin panel rather than part of a retro pixel game.

## Design Principles

1. **Match the Arcade/Retro identity** — Use the same visual language as GamificationHub, Shop, and Collection
2. **Stay usable** — Settings still needs to be scannable, logical, and easy to tap. No sacrificing clarity for aesthetics
3. **Don't go overboard** — Settings is a utility page, not a game screen. Use the retro DNA subtly — themed header, card borders, button styles — without making it look like a game level
4. **No AI slop** — Avoid overly polished gradients, glass morphism, perfect shadows. Lean into the pixel/retro personality that makes the rest of the app distinctive

## Changes (by file)

---

### 1. `Settings.tsx` — Main Container & Tabs

**Header:**
- Replace `retro-card` wrapper with `retro-arcade-container` background on the whole page (adds CRT scanline effect, matching GamificationHub)
- Replace the plain header with the same pattern as GamificationHub: gradient bar with `border-b-4 border-purple-600/50`, purple/pink gradient background overlay, and `retro-icon-badge` for the settings icon
- Make "SETTINGS" title use `retro-pixel-text retro-neon-text` (uppercase pixel font with cyan glow, like "ARCADE" header)
- Subtitle stays muted purple (`text-purple-300/80`)

**Tab Navigation:**
- Replace inline `style={}` gradient tabs with `retro-arcade-btn` variants
- Active tab: `retro-arcade-btn retro-arcade-btn-yellow` (gold retro button, matching the game's active states)
- Inactive tab: `retro-game-card` background with muted text
- Keep horizontal scroll behavior, keep icons + labels
- Add `retro-pixel-text` to tab labels for consistency

**Content Area:**
- Keep `ScrollArea` with `flex-1 min-h-0`
- Change wrapper padding to match GamificationHub (`p-4 space-y-4 pb-6`)

---

### 2. `SettingsProfile.tsx` — Avatar & Display Name

**Card wrapper:**
- Replace `retro-card` with `retro-game-card`
- Section header: Replace plain `<Label>` with styled row using `retro-pixel-text` + colored icon (like how GamificationHub does "HOW TO PLAY")

**Avatar circle:**
- Replace `bg-gradient-to-b from-primary/20` with a more game-like border: `border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]` (neon glow like the GamificationHub icon badges)

**Avatar picker buttons:**
- Replace `bg-muted hover:bg-muted/80` with `retro-stat-pill` for unselected, `retro-level-badge` for selected (already used elsewhere in settings, just not here)

**Edit/Save buttons:**
- Replace shadcn `<Button>` with `retro-arcade-btn retro-arcade-btn-green` (Save) and `retro-arcade-btn` default (Cancel)

---

### 3. `SettingsAccount.tsx` — Subscription, Auth, Sign Out, Delete

**All cards:** `retro-card` → `retro-game-card`

**Section headers:**
- Replace `<Label className="text-sm font-bold">` with `retro-pixel-text` + neon-colored icon (e.g., Crown in `retro-neon-yellow`, UserCircle in `retro-neon-text`)

**Subscription status row:**
- Keep the icon-badge approach, but wrap the Crown icon in a proper `retro-icon-badge` container (the 14x14 bordered circle used in GamificationHub)
- "Active" badge: Replace `bg-amber-100 text-amber-700 rounded-full` with `retro-difficulty-badge retro-difficulty-legendary` (matches the game's rarity system)

**Manage Subscription button:**
- Replace inline gradient style with `retro-arcade-btn retro-arcade-btn-yellow`

**Restore Purchases button:**
- Keep `retro-stat-pill` (correct — secondary action)

**Sign Out button:**
- Keep `retro-stat-pill` (correct — it's not destructive, just an action)

**Delete Account button:**
- Replace `bg-destructive/10 text-destructive border border-destructive/30` with `retro-arcade-btn` styled with red: a custom destructive retro button matching the app's visual language

**AlertDialogs:**
- Replace `retro-card border-2` on dialog content with `retro-game-card` + darker overlay
- Style dialog buttons: Cancel → `retro-arcade-btn` default, destructive action → `retro-arcade-btn` with red styling

---

### 4. `SettingsAppearance.tsx` — Theme Selection

**Card:** `retro-card` → `retro-game-card`

**Theme option buttons:**
- Replace inline `style={}` with proper class-based approach:
  - Selected: `retro-game-card retro-active-challenge` (the glowing active card used in GamificationHub for active events)
  - Unselected: `retro-game-card` with muted state
- Selected check badge: Replace `bg-primary` circle with the small retro difficulty badge style

---

### 5. `SettingsSound.tsx` — Sound Effects & Volume

**Cards:** `retro-card` → `retro-game-card`

**Sound theme selector:**
- Replace inline `style={}` gradient buttons with class-based `retro-game-card` / `retro-active-challenge` approach (same as Appearance)

**Test sound button:**
- Replace `retro-stat-pill p-1.5` with small `retro-arcade-btn retro-arcade-btn-green` for better visual feedback

**Volume slider:**
- The slider itself stays functional (shadcn Slider is fine), but the display value could use `retro-pixel-text` for the percentage

---

### 6. `SettingsGame.tsx` — Gameplay Options

**Card:** `retro-card` → `retro-game-card`

**Section header:**
- Add `retro-pixel-text` to "Gameplay Options" and use Gamepad2 icon in `text-cyan-400` (matching GamificationHub "HOW TO PLAY")

**Dividers:**
- Replace `border-t border-border/30` with `border-t border-purple-600/30` (matches the arcade theme's purple borders)

---

### 7. `SettingsTimer.tsx` — Focus & Break Durations

**Card:** `retro-card` → `retro-game-card`

**Duration display values:**
- Wrap the `{settings.defaultFocusTime}m` values in `retro-pixel-text` styling for the game feel

**Notifications card:** `retro-card` → `retro-game-card`

---

### 8. `SettingsFocusMode.tsx` — Focus Mode & App Blocking

**Cards:** `retro-card` → `retro-game-card`

**Permission request button:**
- Already styled well with purple gradient + box-shadow. Keep as-is (it effectively matches `retro-arcade-btn`)

**Info pill:**
- Replace `retro-stat-pill p-3` info card with a styled hint box using the `retro-game-card` pattern + `text-purple-300/80` text (matching GamificationHub "HOW TO PLAY" section)

**Strict mode warning:**
- Replace `bg-red-50 dark:bg-red-900/20` with a more game-themed warning box (red neon border glow)

---

### 9. `SettingsData.tsx` — Privacy & Backup

**Cards:** `retro-card` → `retro-game-card`

**Privacy toggle rows:**
- Replace `bg-card/50 border border-border/50` with the game card's inner row style: subtle `bg-purple-900/20` with `border-purple-600/30`

**Export button:**
- Keep `retro-stat-pill` (secondary action)

**Import button (when file selected):**
- Replace inline gradient with `retro-arcade-btn retro-arcade-btn-yellow`

**File input:**
- Style to match the game theme (this is the most "web app" looking element in settings)

**Reset Settings button:**
- Same treatment as Delete Account — red-tinted retro arcade button

---

### 10. `SettingsAnalytics.tsx` — Goals & Tracking

**Cards:** `retro-card` → `retro-game-card`

**Goal value displays:**
- Use `retro-pixel-text` for the formatted duration values

**Reset Analytics button:**
- Replace shadcn `<Button variant="destructive">` with styled `retro-arcade-btn` in red

**Replace `confirm()` with AlertDialog** — using `confirm()` is a browser-native dialog that breaks the mobile experience and could cause App Store rejection. Replace with a proper `AlertDialog` matching other destructive confirmations in settings.

---

### 11. `SettingsAbout.tsx` — App Info & Legal

**Hero section:**
- Replace inline light-mode-only gradient (`hsl(260 50% 95%)` etc.) with the purple arcade gradient that works in both themes: `bg-gradient-to-r from-purple-900/50 via-transparent to-pink-900/50` (matching GamificationHub header)
- App icon box shadow: keep the existing retro 3D effect (it's already game-like)
- Version badge: Replace `bg-white/70` (light-mode only) with `retro-stat-pill` that works in both themes

**App name:**
- Use `retro-pixel-text` for "NoMo Phone"

**Tagline:**
- Remove emoji from `"🎮 Focus. Collect. Grow. 🌴"` — the rest of the app doesn't use emoji in UI text, they use PixelIcons. Replace with plain text styled with `text-purple-300/80`.

**Legal links card:**
- `retro-card` → `retro-game-card`

**Link rows:**
- Keep `retro-stat-pill` (it works well for list-style navigation items)

**Visit NoMo button:**
- Replace inline gradient with `retro-arcade-btn retro-arcade-btn-green`

**Footer:**
- Keep `retro-stat-pill` copyright footer

---

## Summary of Class Migrations

| Before | After | Where |
|--------|-------|-------|
| `retro-card` (all settings cards) | `retro-game-card` | Every sub-component |
| Settings page `<div className="h-full flex flex-col">` | `<div className="h-full flex flex-col retro-arcade-container">` | `Settings.tsx` |
| Plain text headers | `retro-pixel-text` + themed colors | All section headers |
| Inline `style={}` gradient buttons | `retro-arcade-btn` variants | Tab nav, action buttons |
| `bg-card/50 border border-border/50` inner rows | `bg-purple-900/20 border-purple-600/30` | Data privacy rows, account info rows |
| `bg-destructive/10` danger buttons | Red-themed `retro-arcade-btn` | Delete, Reset |
| `confirm()` native dialog | `AlertDialog` with retro styling | SettingsAnalytics reset |
| Light-mode-only gradients in About | Theme-agnostic arcade gradients | SettingsAbout hero |

## What Stays the Same

- All hooks, state management, and business logic — zero functional changes
- `Switch` component (small, doesn't need restyling — toggle state is clear)
- `Slider` component (functional, accessible, hard to improve without custom work)
- `ScrollArea` (works well as-is)
- Information architecture (5 tabs, same groupings)
- All modals and their content structure (just restyle wrappers)
- Profile editing flow
- File import/export flow

## Files Modified (11 files)

1. `src/components/Settings.tsx`
2. `src/components/settings/SettingsProfile.tsx`
3. `src/components/settings/SettingsAccount.tsx`
4. `src/components/settings/SettingsAppearance.tsx`
5. `src/components/settings/SettingsSound.tsx`
6. `src/components/settings/SettingsGame.tsx`
7. `src/components/settings/SettingsTimer.tsx`
8. `src/components/settings/SettingsFocusMode.tsx`
9. `src/components/settings/SettingsData.tsx`
10. `src/components/settings/SettingsAnalytics.tsx`
11. `src/components/settings/SettingsAbout.tsx`
