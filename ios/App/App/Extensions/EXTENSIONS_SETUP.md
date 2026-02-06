# NoMo Phone - iOS Extensions Setup Guide

## Overview

NoMo Phone uses three iOS app extensions:

1. **ShieldConfiguration** — Custom UI when users try to open blocked apps
2. **DeviceActivityMonitor** — Monitors device activity lifecycle (session start/end)
3. **NoMoWidget** — Home screen widgets (timer, streak, progress, stats)

## Why Extensions Must Be Added Manually

Capacitor manages `project.pbxproj` for the main `App` target only. Extension targets
cannot be added programmatically — you must create them in Xcode. They persist across
`npx cap copy ios` / `npx cap sync ios` because Capacitor only updates the main target.

## Prerequisites

- Xcode 16.0+ (for iOS 18 SDK; iOS 26 runtime requires Xcode 18 beta)
- Physical iOS device (Family Controls does NOT work in Simulator)
- Apple Developer account with **Family Controls** capability enabled for:
  - `co.nomoinc.nomo` (main app)
  - `co.nomoinc.nomo.ShieldConfiguration`
  - `co.nomoinc.nomo.DeviceActivityMonitor`
- App Group `group.co.nomoinc.nomo` registered for all bundle IDs above + widget

## Extension Setup

### 1. ShieldConfiguration Extension

**Create the target:**
1. In Xcode: **File → New → Target**
2. Search for and select **Shield Configuration Extension**
3. Product Name: `ShieldConfiguration` (MUST match exactly — the Info.plist uses `$(PRODUCT_MODULE_NAME).ShieldConfigurationExtension` to find the class)
4. Bundle Identifier: `co.nomoinc.nomo.ShieldConfiguration`
5. Embed in Application: **App**
6. Language: Swift
7. Click **Finish**

**Replace auto-generated files:**
1. Delete the auto-generated `.swift` file Xcode created in the new target's folder
2. In the ShieldConfiguration target's **Build Settings**:
   - Set **Info.plist File** to: `App/Extensions/ShieldConfiguration/Info.plist`
   - Set **Code Sign Entitlements** to: `App/Extensions/ShieldConfiguration/ShieldConfiguration.entitlements`
3. Delete any auto-generated `Info.plist` from the target folder (we use the one in `Extensions/`)

**Add source files to the target (CRITICAL):**
In Xcode's Project Navigator, for EACH of these files, select the file → open File Inspector
(right panel) → under **Target Membership**, check the `ShieldConfiguration` box:

- `App/Extensions/ShieldConfiguration/ShieldConfigurationExtension.swift`
- `App/Shared/ShieldConfigurationHelper.swift`
- `App/Shared/SharedConstants.swift`

All three files MUST be compiled by the ShieldConfiguration target. If the helpers are
missing, the extension will fail to compile with "undeclared identifier" errors.

**Link frameworks** (Build Phases → Link Binary With Libraries):
- `ManagedSettings.framework`
- `ManagedSettingsUI.framework`
- `FamilyControls.framework`

**Add capabilities** (Signing & Capabilities):
- **Family Controls**
- **App Groups** → add `group.co.nomoinc.nomo`

**Set deployment target:**
- Minimum Deployments: iOS 16.0

---

### 2. DeviceActivityMonitor Extension

**Create the target:**
1. **File → New → Target**
2. Search for and select **Device Activity Monitor Extension**
3. Product Name: `DeviceActivityMonitor` (MUST match exactly)
4. Bundle Identifier: `co.nomoinc.nomo.DeviceActivityMonitor`
5. Embed in Application: **App**
6. Click **Finish**

**Replace auto-generated files:**
1. Delete the auto-generated `.swift` file
2. In Build Settings:
   - **Info.plist File**: `App/Extensions/DeviceActivityMonitor/Info.plist`
   - **Code Sign Entitlements**: `App/Extensions/DeviceActivityMonitor/DeviceActivityMonitor.entitlements`

**Add source files to target (Target Membership):**
- `App/Extensions/DeviceActivityMonitor/DeviceActivityMonitorExtension.swift`
- `App/Shared/DeviceActivityMonitorHelper.swift`
- `App/Shared/SharedConstants.swift`

**Link frameworks:**
- `DeviceActivity.framework`
- `ManagedSettings.framework`
- `FamilyControls.framework`

**Add capabilities:**
- **Family Controls**
- **App Groups** → add `group.co.nomoinc.nomo`

**Set deployment target:**
- Minimum Deployments: iOS 15.0

---

### 3. NoMoWidget Extension

**Create the target:**
1. **File → New → Target**
2. Search for and select **Widget Extension**
3. Product Name: `NoMoWidget`
4. Bundle Identifier: `co.nomoinc.nomo.NoMoWidget`
5. Embed in Application: **App**
6. Uncheck "Include Live Activity" and "Include Configuration App Intent"
7. Click **Finish**

**Replace auto-generated files:**
1. Delete ALL auto-generated files in the new target folder
2. In Build Settings:
   - **Info.plist File**: `App/Extensions/NoMoWidget/Info.plist`
   - **Code Sign Entitlements**: `App/Extensions/NoMoWidget/NoMoWidget.entitlements`

**Add source files to target:**
- All `.swift` files in `App/Extensions/NoMoWidget/` and `App/Extensions/NoMoWidget/Widgets/`
- `App/Shared/SharedConstants.swift`

**Add capabilities:**
- **App Groups** → add `group.co.nomoinc.nomo`

**Set deployment target:**
- Minimum Deployments: iOS 16.0

---

## Verify the Build

After adding all three targets:

1. In `project.pbxproj`, the `targets` array should list 4 targets (App + 3 extensions)
2. The main App target should have an **Embed App Extensions** build phase containing all 3 `.appex` products
3. Build the project (Cmd+B) — all 4 targets should compile successfully
4. Check the built `.app` bundle contains `PlugIns/ShieldConfiguration.appex`, `PlugIns/DeviceActivityMonitor.appex`, and `PlugIns/NoMoWidget.appex`

## Common Issues

### "Extension not loading" / Shield shows generic UI instead of custom
- Verify the extension `.appex` is in the app's `PlugIns/` folder (check Embed App Extensions build phase)
- Verify `NSExtensionPrincipalClass` in Info.plist resolves correctly:
  - For ShieldConfiguration target named `ShieldConfiguration`: resolves to `ShieldConfiguration.ShieldConfigurationExtension`
  - If you named the target differently, `$(PRODUCT_MODULE_NAME)` will resolve to YOUR target name
- Verify all three source files are in the target's Compile Sources

### "Undeclared identifier" build errors in extension
- `SharedConstants` not found → add `SharedConstants.swift` to the extension target
- `ShieldConfigurationHelper` not found → add `ShieldConfigurationHelper.swift` to the extension target
- `DeviceActivityMonitorHelper` not found → add `DeviceActivityMonitorHelper.swift` to the extension target

### Family Controls not working at all
- Family Controls does NOT work in the iOS Simulator — use a physical device
- The main app's provisioning profile must include the `com.apple.developer.family-controls` entitlement
- Go to Apple Developer Portal → Certificates, Identifiers & Profiles → check that Family Controls is enabled for all bundle IDs
- In Xcode: toggle "Automatically manage signing" off and on to regenerate profiles

### Shield appears but with default/generic UI
- This means app blocking works but the ShieldConfiguration extension isn't loading
- Check Console.app for extension crash logs
- Verify the extension target name matches `$(PRODUCT_MODULE_NAME)` in the Info.plist
- Verify all frameworks are linked

## Entitlements Reference

### Main App (`App.entitlements`)
```xml
<key>com.apple.developer.family-controls</key>
<true/>
<key>com.apple.developer.device-activity</key>
<true/>
<key>com.apple.security.application-groups</key>
<array>
    <string>group.co.nomoinc.nomo</string>
</array>
```

### ShieldConfiguration (`ShieldConfiguration.entitlements`)
```xml
<key>com.apple.developer.family-controls</key>
<true/>
<key>com.apple.security.application-groups</key>
<array>
    <string>group.co.nomoinc.nomo</string>
</array>
```

### DeviceActivityMonitor (`DeviceActivityMonitor.entitlements`)
```xml
<key>com.apple.developer.family-controls</key>
<true/>
<key>com.apple.developer.device-activity</key>
<true/>
<key>com.apple.security.application-groups</key>
<array>
    <string>group.co.nomoinc.nomo</string>
</array>
```

## File Structure

```
ios/App/App/
├── App.entitlements
├── Shared/
│   ├── SharedConstants.swift          ← Add to ALL extension targets
│   ├── ShieldConfigurationHelper.swift ← Add to ShieldConfiguration target
│   └── DeviceActivityMonitorHelper.swift ← Add to DeviceActivityMonitor target
└── Extensions/
    ├── ShieldConfiguration/
    │   ├── ShieldConfigurationExtension.swift
    │   ├── Info.plist
    │   └── ShieldConfiguration.entitlements
    ├── DeviceActivityMonitor/
    │   ├── DeviceActivityMonitorExtension.swift
    │   ├── Info.plist
    │   └── DeviceActivityMonitor.entitlements
    └── NoMoWidget/
        ├── NoMoWidgetBundle.swift
        ├── Info.plist
        ├── NoMoWidget.entitlements
        ├── WidgetColors.swift
        ├── WidgetStrings.swift
        ├── AccessibilityUtilities.swift
        ├── WidgetAccessibilityStrings.swift
        └── Widgets/
            ├── NoMoTimerWidget.swift
            ├── NoMoStreakWidget.swift
            ├── NoMoProgressWidget.swift
            └── NoMoStatsWidget.swift
```
