# NoMo Phone - iOS Extensions Setup Guide

This guide explains how to set up the Family Controls extensions in Xcode for app blocking functionality.

## Overview

NoMo Phone uses Apple's Screen Time API (Family Controls) to block distracting apps during focus sessions. This requires two extensions:

1. **ShieldConfiguration Extension** - Provides custom UI when users try to open blocked apps
2. **DeviceActivityMonitor Extension** - Monitors device activity and tracks blocked app attempts

## Prerequisites

- Xcode 15.0 or later
- iOS 16.0+ deployment target (iOS 15 for basic functionality)
- Apple Developer Account with Family Controls capability enabled
- App Group configured: `group.co.nomoinc.nomo`

## Extension Setup Instructions

### 1. Create ShieldConfiguration Extension

1. In Xcode, select **File > New > Target**
2. Choose **Shield Configuration Extension** template
3. Name it: `NoMoShield`
4. Bundle Identifier: `co.nomoinc.nomo.shield`
5. Embed in Application: `App`

After creation:
- Delete the auto-generated Swift file
- Add `ShieldConfigurationExtension.swift` from this folder
- Add `Info.plist` and `ShieldConfiguration.entitlements` from this folder

### 2. Create DeviceActivityMonitor Extension

1. In Xcode, select **File > New > Target**
2. Choose **Device Activity Monitor Extension** template
3. Name it: `NoMoActivityMonitor`
4. Bundle Identifier: `co.nomoinc.nomo.activity-monitor`
5. Embed in Application: `App`

After creation:
- Delete the auto-generated Swift file
- Add `DeviceActivityMonitorExtension.swift` from this folder
- Add `Info.plist` and `DeviceActivityMonitor.entitlements` from this folder

### 3. Configure App Groups

For each target (App, ShieldConfiguration, DeviceActivityMonitor):

1. Select the target in Xcode
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Add **App Groups**
5. Add: `group.co.nomoinc.nomo`

### 4. Configure Family Controls Capability

For each target:

1. Go to **Signing & Capabilities**
2. Click **+ Capability**
3. Add **Family Controls**

### 5. Add Required Frameworks

For the main App target, ensure these frameworks are linked:
- `FamilyControls.framework`
- `ManagedSettings.framework`
- `DeviceActivity.framework`

For ShieldConfiguration extension:
- `ManagedSettings.framework`
- `ManagedSettingsUI.framework`

For DeviceActivityMonitor extension:
- `DeviceActivity.framework`
- `ManagedSettings.framework`
- `FamilyControls.framework`

## Entitlements Summary

### Main App (App.entitlements)
```xml
<key>com.apple.developer.family-controls</key>
<true/>
<key>com.apple.developer.device-activity</key>
<true/>
<key>com.apple.developer.managed-settings</key>
<true/>
<key>com.apple.security.application-groups</key>
<array>
    <string>group.co.nomoinc.nomo</string>
</array>
```

### ShieldConfiguration Extension
```xml
<key>com.apple.developer.family-controls</key>
<true/>
<key>com.apple.security.application-groups</key>
<array>
    <string>group.co.nomoinc.nomo</string>
</array>
```

### DeviceActivityMonitor Extension
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

## Testing

### Simulator Limitations
- Family Controls does **NOT** work in the iOS Simulator
- You must test on a physical device

### Testing on Device
1. Build and run on a physical iOS device
2. Grant Screen Time permissions when prompted
3. Select apps to block in the app
4. Start a focus session
5. Try to open a blocked app - you should see the custom shield screen

### Debug Tips
- Check Console.app for extension logs
- Verify App Group data is being shared correctly
- Ensure all entitlements are properly configured in Apple Developer Portal

## Troubleshooting

### "Family Controls not available"
- Ensure the device is not in a managed configuration
- Verify Screen Time is enabled in Settings
- Check that entitlements are properly configured

### Extension not loading
- Verify the extension is embedded in the main app
- Check that bundle identifiers match the expected pattern
- Ensure minimum deployment target is iOS 15+

### App Group data not shared
- Verify all targets use the same App Group identifier
- Check that App Groups capability is added to all targets
- Use `UserDefaults(suiteName:)` with the correct group ID

## File Structure

```
ios/App/App/Extensions/
├── EXTENSIONS_SETUP.md (this file)
├── ShieldConfiguration/
│   ├── ShieldConfigurationExtension.swift
│   ├── Info.plist
│   └── ShieldConfiguration.entitlements
└── DeviceActivityMonitor/
    ├── DeviceActivityMonitorExtension.swift
    ├── Info.plist
    └── DeviceActivityMonitor.entitlements
```

## Resources

- [Apple Family Controls Documentation](https://developer.apple.com/documentation/familycontrols)
- [Screen Time API WWDC Session](https://developer.apple.com/videos/play/wwdc2021/10123/)
- [ManagedSettings Documentation](https://developer.apple.com/documentation/managedsettings)
