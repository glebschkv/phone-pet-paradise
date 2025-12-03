# App Store Screenshot Guidelines

## Directory Structure

```
docs/screenshots/
├── iphone-6.9/          # iPhone 15 Pro Max, 16 Pro Max (1320x2868 or 1290x2796)
├── iphone-6.5/          # iPhone 11 Pro Max, XS Max (1284x2778 or 1242x2688)
├── ipad-12.9/           # iPad Pro 12.9" (2048x2732)
└── SCREENSHOT_GUIDELINES.md
```

## Required Dimensions

### iPhone 6.9" Display (Required)
- **Devices**: iPhone 15 Pro Max, iPhone 16 Pro Max
- **Resolution**: 1320 x 2868 pixels (preferred) or 1290 x 2796
- **Format**: PNG or JPEG
- **Count**: 2-10 screenshots

### iPhone 6.5" Display (Required)
- **Devices**: iPhone 11 Pro Max, iPhone XS Max
- **Resolution**: 1284 x 2778 pixels (preferred) or 1242 x 2688
- **Format**: PNG or JPEG
- **Count**: 2-10 screenshots

### iPad Pro 12.9" (Required if supporting iPad)
- **Devices**: iPad Pro 12.9"
- **Resolution**: 2048 x 2732 pixels
- **Format**: PNG or JPEG
- **Count**: 2-10 screenshots

---

## Screenshot Sequence (8 Recommended)

### 1. Hero Shot - `01_hero.png`
**Caption**: "Put down your phone, grow your world"
**Content**:
- Beautiful island background (Meadow or Sunset biome)
- Main pet visible and animated
- Focus timer widget visible
- Coin count displayed
- Clean, inviting first impression

### 2. Pet Collection - `02_pets.png`
**Caption**: "Collect 40+ adorable pixel pets"
**Content**:
- Pet collection grid view
- Show variety of pets (Common, Rare, Epic visible)
- Some locked pets to show progression
- Rarity badges visible

### 3. Focus Timer - `03_focus.png`
**Caption**: "Earn coins for every minute focused"
**Content**:
- Active focus session in progress
- Timer counting down (e.g., 23:45 remaining)
- Coin counter incrementing
- Streak indicator visible
- Clean, minimal distraction

### 4. World Exploration - `04_worlds.png`
**Caption**: "Explore 8 stunning biomes"
**Content**:
- World selection or biome showcase
- Show 3-4 different biomes
- Highlight variety (Snow, City, Ocean visible)
- Pets from different worlds

### 5. Focus Shield - `05_shield.png`
**Caption**: "Block distracting apps while you focus"
**Content**:
- Focus Shield configuration screen
- Show app blocking in action
- iOS-native picker visible
- Clear explanation of feature

### 6. Rewards & Progress - `06_rewards.png`
**Caption**: "Level up and unlock new rewards"
**Content**:
- Level up celebration or milestone
- XP bar filling
- New pet unlock animation
- Achievement badges

### 7. Premium Features - `07_premium.png`
**Caption**: "Go Premium for 2x-4x rewards"
**Content**:
- Subscription comparison or benefits
- Highlight multipliers
- Show exclusive pets/worlds
- Clear value proposition

### 8. Analytics Dashboard - `08_analytics.png`
**Caption**: "Track your focus journey"
**Content**:
- Focus statistics screen
- Charts showing progress
- Streak history
- Session summaries

---

## Design Guidelines

### Text Overlays (Optional but Recommended)
- **Font**: SF Pro Display (iOS system font) or similar clean sans-serif
- **Size**: Large enough to read on App Store thumbnails
- **Position**: Top or bottom of screenshot
- **Background**: Semi-transparent gradient for readability

### Color Scheme
- **Primary Blue**: #3b82c7
- **Background**: Match app's theme colors
- **Text**: White with shadow or dark with light background

### Best Practices
1. **Show real app UI** - Don't over-design, show authentic experience
2. **Highlight key features** - One clear message per screenshot
3. **Use device frames** (optional) - Can add polish but not required
4. **Maintain consistency** - Same style across all screenshots
5. **Capture at highest quality** - Use Xcode Simulator or device at native resolution

---

## How to Capture Screenshots

### Method 1: Xcode Simulator (Recommended for pixel-perfect)
```bash
# Run app in simulator
npx cap run ios

# In Simulator: File > Save Screen (Cmd + S)
# Or use: xcrun simctl io booted screenshot screenshot.png
```

### Method 2: Physical Device
1. Connect device to Mac
2. Open app to desired screen
3. Press Side Button + Volume Up
4. Transfer via AirDrop or Photos

### Method 3: Automated with fastlane (Advanced)
```ruby
# Fastfile
lane :screenshots do
  capture_screenshots(
    scheme: "App",
    devices: [
      "iPhone 15 Pro Max",
      "iPhone 11 Pro Max",
      "iPad Pro (12.9-inch)"
    ]
  )
end
```

---

## File Naming Convention

```
{order}_{screen_name}_{locale}.png

Examples:
01_hero_en-US.png
02_pets_en-US.png
03_focus_en-US.png
...
```

---

## Checklist Before Submission

- [ ] All screenshots are correct resolution
- [ ] No placeholder or debug content visible
- [ ] No personal information visible
- [ ] Status bar shows appropriate time (9:41 AM is Apple standard)
- [ ] Battery at 100% in status bar
- [ ] No low battery warnings
- [ ] WiFi and cellular indicators visible
- [ ] Text is readable at thumbnail size
- [ ] Screenshots tell a story in sequence
- [ ] iPad screenshots match phone screenshots (if applicable)

---

## App Preview Video (Optional)

### Specifications
- **Duration**: 15-30 seconds
- **Resolution**: Same as screenshot dimensions
- **Format**: H.264, .mov or .mp4
- **Audio**: Optional (device audio or music)

### Suggested Script
| Time | Scene | Audio |
|------|-------|-------|
| 0-3s | App icon, title | Upbeat music starts |
| 3-8s | Start focus timer | "Focus and earn rewards" |
| 8-13s | Coins accumulating | Sound effects |
| 13-18s | Pet collection | "Collect adorable pets" |
| 18-23s | World exploration | "Build your dream world" |
| 23-28s | Premium features | "Upgrade for more" |
| 28-30s | Logo + CTA | "Download now" |

---

## Resources

- [Apple Human Interface Guidelines - App Store Assets](https://developer.apple.com/design/human-interface-guidelines/app-store)
- [App Store Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)
- [App Preview Specifications](https://developer.apple.com/help/app-store-connect/reference/app-preview-specifications)
