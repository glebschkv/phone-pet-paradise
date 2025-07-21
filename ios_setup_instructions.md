# iOS Device Activity Tracking Setup

## Required Configuration for Real iOS Tracking

To make the DeviceActivity tracking work on actual iOS devices, you need to complete these setup steps:

### 1. Apple Developer Account Requirements
- **Paid Apple Developer Account**: Screen Time API requires a paid developer account ($99/year)
- **App Store Connect**: Your app needs to be registered in App Store Connect
- **Capabilities**: Enable "Family Controls" capability in your app identifier

### 2. Xcode Project Configuration

After running `npx cap sync`, open the iOS project in Xcode and:

1. **Add Capabilities:**
   - Open your app target
   - Go to "Signing & Capabilities" 
   - Add "Family Controls" capability
   - Add "App Groups" capability (create group: `group.app.lovable.354c50c576064f429b59577c9adb3ef7`)

2. **Verify Entitlements:**
   The `App.entitlements` file should contain:
   ```xml
   <key>com.apple.developer.family-controls</key>
   <true/>
   <key>com.apple.developer.device-activity</key>
   <true/>
   ```

### 3. Testing the Implementation

**Current Status:**
- ✅ iOS Swift code is properly implemented
- ✅ Capacitor plugin bridge is configured
- ✅ React components can communicate with iOS
- ✅ Web fallback works for development
- ⚠️  Requires iOS device with iOS 15+ for full functionality

**What Works Now:**
- Web development environment (uses localStorage simulation)
- Basic app lifecycle tracking (when app goes to background)
- Plugin communication between React and iOS

**What Requires Real iOS Device:**
- DeviceActivity API access
- Screen Time permission prompts
- Actual device usage monitoring
- Cross-app activity tracking

### 4. Testing on Physical Device

1. **Export to GitHub** and clone locally
2. **Install dependencies**: `npm install`
3. **Add iOS platform**: `npx cap add ios`
4. **Open in Xcode**: `npx cap open ios`
5. **Configure signing** with your Apple Developer account
6. **Add capabilities** as described above
7. **Build and run** on physical iOS device (iOS 15+)

### 5. Expected Behavior on Real Device

When properly configured on a real iOS device:

- App will request Screen Time permissions on first launch
- DeviceActivity monitoring will track actual phone usage
- Points and pets will be earned based on real time away from phone
- Streak tracking will work across app launches
- Push notifications will remind users during away sessions

### 6. Development vs Production

**Development (Current):**
- Uses web fallback for stats
- Simulates tracking data
- No real device monitoring

**Production (Real iOS Device):**
- Uses actual DeviceActivity API
- Tracks real phone usage patterns
- Requires user permission for Screen Time access
- Works across all apps on device

The simulation buttons in the test component show how the reward system will work, but real tracking requires deployment to an iOS device with proper Apple Developer setup.