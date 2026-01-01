# Claude Prompts for iOS Quality Fixes

Copy-paste these prompts to Claude Code to fix each issue. Run them in order.

---

## Phase 1: Critical Fixes (P0 - Must Do First)

### Prompt 1.1: Fix StoreKit Test Compilation Error

```
Fix the StoreKitPluginTests.swift compilation error.

The test file references `StoreKitPluginError.networkError` but this case doesn't exist in the actual enum.

Tasks:
1. Read ios/App/AppTests/StoreKitPluginTests.swift to see what error cases the tests expect
2. Read ios/App/App/Sources/StoreKitPlugin.swift to see the current StoreKitPluginError enum
3. Add the missing `networkError` case to StoreKitPluginError with appropriate error description
4. Verify the enum now has: failedVerification, productNotFound, purchaseFailed, networkError
5. Run the iOS tests to verify they compile (if possible) or at least verify the Swift syntax is correct

Do not modify the test file - fix the source code to match what tests expect.
```

---

### Prompt 1.2: Fix iOS Minimum Deployment Target

```
Fix the iOS minimum deployment target mismatch.

The app uses APIs that require iOS 15+ but the Podfile sets minimum to iOS 14.0. This will crash on iOS 14 devices.

Tasks:
1. Update ios/App/Podfile to change `platform :ios, '14.0'` to `platform :ios, '15.0'`
2. Check ios/App/App.xcodeproj/project.pbxproj for any IPHONEOS_DEPLOYMENT_TARGET settings and update them to 15.0
3. Review StoreKitPlugin.swift and add proper @available checks for iOS 16+ APIs (like transaction.environment)
4. Review DeviceActivityPlugin.swift for any APIs that need @available guards
5. Add fallback behavior for iOS 15 users when iOS 16+ APIs aren't available

The key APIs to check:
- Transaction.environment (iOS 16+)
- Any DeviceActivity APIs should already work on iOS 15

Make sure the app gracefully degrades on iOS 15 while fully working on iOS 16+.
```

---

### Prompt 1.3: Fix Hardcoded App Group Identifiers in Extensions

```
Fix the hardcoded app group identifiers in iOS extensions.

The extensions hardcode "group.co.nomoinc.nomo" instead of sharing a constant. Since extensions can't import the main app target, we need a shared framework or file.

Current problematic files:
- ios/App/App/Extensions/DeviceActivityMonitor/DeviceActivityMonitorExtension.swift (line 13)
- ios/App/App/Extensions/ShieldConfiguration/ShieldConfigurationExtension.swift (line 12)

The main app defines it in:
- ios/App/App/Sources/AppConfig.swift

Tasks:
1. Create a new file: ios/App/App/Shared/SharedConstants.swift
2. Move the app group identifier and any other shared constants to this file
3. Make sure this file is included in ALL targets (main app + both extensions) in the Xcode project
4. Update DeviceActivityMonitorExtension.swift to use the shared constant
5. Update ShieldConfigurationExtension.swift to use the shared constant
6. Update AppConfig.swift to reference the shared constant (or keep it as a convenience re-export)
7. Also move storage keys that extensions use (focusSessionActive, shieldAttempts, etc.) to SharedConstants

The SharedConstants.swift should look something like:
```swift
import Foundation

enum SharedConstants {
    static let appGroupIdentifier = "group.co.nomoinc.nomo"

    enum StorageKeys {
        static let focusSessionActive = "focusSessionActive"
        static let shieldAttempts = "shieldAttempts"
        static let lastShieldAttempt = "lastShieldAttempt"
        static let activityLogs = "activityLogs"
    }
}
```

Make sure to update the project.pbxproj to include this file in all three targets.
```

---

## Phase 2: High Priority Fixes

### Prompt 2.1: Remove Deprecated synchronize() Calls

```
Remove all deprecated UserDefaults.synchronize() calls from the iOS codebase.

The synchronize() method has been deprecated since iOS 12 and does nothing useful. It's cargo cult code.

Tasks:
1. Search for all .synchronize() calls in the ios/ directory
2. Remove each synchronize() call - just delete the line entirely
3. The files that likely have this issue:
   - ios/App/App/Sources/DeviceActivityPlugin.swift
   - ios/App/App/Sources/WidgetDataPlugin.swift
   - ios/App/App/Extensions/DeviceActivityMonitor/DeviceActivityMonitorExtension.swift
   - ios/App/App/Extensions/ShieldConfiguration/ShieldConfigurationExtension.swift

Just remove the lines. UserDefaults automatically persists data without synchronize() on iOS 12+.
```

---

### Prompt 2.2: Standardize Swift Concurrency Patterns

```
Standardize the Swift concurrency patterns across all iOS plugins.

Currently the code mixes three different approaches:
1. Task { @MainActor in ... }
2. DispatchQueue.main.async { ... }
3. await MainActor.run { ... }

Standardize on async/await with MainActor for consistency.

Tasks:
1. Read through all Swift files in ios/App/App/Sources/
2. Replace DispatchQueue.main.async patterns with Task { @MainActor in } or await MainActor.run
3. Ensure all UI-related code (like haptic feedback, resolving Capacitor calls) runs on MainActor
4. Be careful not to create deadlocks - don't await MainActor from MainActor

Files to update:
- DeviceActivityPlugin.swift (has DispatchQueue.main.async in triggerHapticFeedback, openAppPicker)
- StoreKitPlugin.swift (already uses Task { @MainActor in } - good pattern to follow)
- WidgetDataPlugin.swift

The preferred pattern for Capacitor plugin methods should be:
```swift
@objc func someMethod(_ call: CAPPluginCall) {
    Task {
        do {
            // async work here
            let result = try await someAsyncOperation()

            await MainActor.run {
                call.resolve(["success": true, "data": result])
            }
        } catch {
            await MainActor.run {
                call.reject("Error: \(error.localizedDescription)")
            }
        }
    }
}
```
```

---

### Prompt 2.3: Fix Magic Strings in Extensions

```
Replace magic strings in iOS extensions with shared constants.

The extensions use hardcoded strings that should match constants defined elsewhere.

Tasks:
1. In DeviceActivityMonitorExtension.swift, replace:
   - "phoneUsageTracking" with SharedConstants.ActivityNames.phoneUsageTracking (or similar)
   - "focusSessionActive" with SharedConstants.StorageKeys.focusSessionActive
   - "activityLogs" with SharedConstants.StorageKeys.activityLogs
   - The number 100 (max logs) with a constant

2. In ShieldConfigurationExtension.swift, replace:
   - "shieldAttempts" with SharedConstants.StorageKeys.shieldAttempts
   - "lastShieldAttempt" with SharedConstants.StorageKeys.lastShieldAttempt

3. Update the SharedConstants.swift file (created in Prompt 1.3) to include:
```swift
enum ActivityNames {
    static let phoneUsageTracking = "phoneUsageTracking"
    static let focusSession = "focusSession"
}

enum Limits {
    static let maxActivityLogs = 100
}
```

4. Verify these match what's defined in AppConfig.swift in the main app
```

---

## Phase 3: Test Coverage Improvements

### Prompt 3.1: Add useStoreKit Hook Tests

```
Add comprehensive tests for the useStoreKit hook.

This hook handles all in-app purchases and has ZERO test coverage. This is a critical revenue path.

Tasks:
1. Read src/hooks/useStoreKit.ts to understand what it does
2. Read src/plugins/store-kit/web.ts to understand the web fallback implementation
3. Create a new test file: src/test/hooks/useStoreKit.test.ts
4. Write tests covering:
   - Initial state (products empty, not loading, no subscription)
   - getProducts() fetches and caches products
   - purchase() flow - success case
   - purchase() flow - user cancellation
   - purchase() flow - error handling
   - restorePurchases() flow
   - getSubscriptionStatus() returns correct status
   - Premium status detection (monthly, yearly, lifetime)
   - Error handling for network failures

5. Use the existing test patterns from src/test/hooks/ as reference
6. Mock the Capacitor plugin using the patterns in other test files
7. Aim for at least 80% coverage on this hook

Example test structure:
```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStoreKit } from '@/hooks/useStoreKit';

// Mock the StoreKit plugin
vi.mock('@/plugins/store-kit', () => ({
  StoreKit: {
    getProducts: vi.fn(),
    purchase: vi.fn(),
    restorePurchases: vi.fn(),
    getSubscriptionStatus: vi.fn(),
  }
}));

describe('useStoreKit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch and cache products', async () => {
      // ... test implementation
    });
  });

  // ... more tests
});
```
```

---

### Prompt 3.2: Add usePremiumStatus Hook Tests

```
Improve test coverage for usePremiumStatus hook from 40% to 80%+.

Tasks:
1. Read src/hooks/usePremiumStatus.ts to understand all code paths
2. Read existing tests in src/test/hooks/ for patterns
3. Create or update: src/test/hooks/usePremiumStatus.test.ts
4. Add tests for uncovered lines (currently 224-566 are untested):
   - Premium feature checks
   - Subscription expiry handling
   - Trial period detection
   - Lifetime purchase detection
   - Grace period handling
   - Premium status refresh logic
   - Error states

5. Mock Supabase and StoreKit as needed
6. Test edge cases:
   - User with expired subscription
   - User in grace period
   - User with lifetime purchase
   - Network errors during status check
   - Race conditions between local and server state
```

---

### Prompt 3.3: Add iOS Extension Unit Tests

```
Create unit tests for iOS extensions.

The DeviceActivityMonitor and ShieldConfiguration extensions have zero test coverage.

Tasks:
1. Create ios/App/AppTests/DeviceActivityMonitorExtensionTests.swift
2. Create ios/App/AppTests/ShieldConfigurationExtensionTests.swift

For DeviceActivityMonitorExtensionTests:
- Test intervalDidStart marks session active
- Test intervalDidEnd clears shields and marks session inactive
- Test logEvent appends to logs correctly
- Test log rotation (keeps only last 100)
- Test eventDidReachThreshold logging

For ShieldConfigurationExtensionTests:
- Test configuration returns correct ShieldConfiguration
- Test recordShieldAttempt increments counter
- Test getMotivationalMessage returns valid string
- Test icon creation doesn't return nil

Note: Extensions are tricky to test because they run in a separate process. You may need to:
1. Extract testable logic into separate helper classes
2. Test the helper classes directly
3. Use dependency injection for UserDefaults

Example structure:
```swift
import XCTest
@testable import DeviceActivityMonitorExtension

class DeviceActivityMonitorExtensionTests: XCTestCase {
    var mockUserDefaults: UserDefaults!

    override func setUp() {
        super.setUp()
        mockUserDefaults = UserDefaults(suiteName: "test-suite")
        mockUserDefaults.removePersistentDomain(forName: "test-suite")
    }

    func testLogEventAppendsToLogs() {
        // Test implementation
    }
}
```
```

---

## Phase 4: Bundle and Performance Optimization

### Prompt 4.1: Optimize Sentry Bundle Size

```
Reduce the Sentry bundle size from 81KB gzipped.

Currently vendor-monitoring chunk is 246KB (81KB gzip) which is too large for a mobile app.

Tasks:
1. Read the current Sentry setup in the codebase (search for @sentry imports)
2. Check if Sentry is being tree-shaken properly
3. Implement lazy loading for Sentry - only load it after app is interactive
4. Consider using @sentry/browser directly instead of @sentry/react if React integration isn't needed
5. Check if we're importing unnecessary Sentry features

Options to try:
1. Lazy load Sentry:
```typescript
// Instead of importing at top level
// import * as Sentry from '@sentry/react';

// Lazy load after app mounts
const loadSentry = async () => {
  if (import.meta.env.PROD) {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn: '...',
      // minimal config
    });
  }
};
```

2. Use lighter Sentry package
3. Only include in production builds
4. Check vite.config.ts for Sentry-specific optimizations

Target: Reduce to under 40KB gzipped.
```

---

### Prompt 4.2: Optimize Radix UI Imports

```
Reduce Radix UI bundle size from 43KB gzipped.

The vendor-radix chunk is large because we're likely importing entire packages instead of specific components.

Tasks:
1. Search for all @radix-ui imports in the codebase
2. Check if any imports are pulling in entire packages
3. Ensure we're using specific imports like:
   - GOOD: import { Dialog, DialogContent } from '@radix-ui/react-dialog'
   - BAD: import * as Dialog from '@radix-ui/react-dialog'

4. Check the shadcn/ui components in src/components/ui/ - they should already use specific imports but verify

5. Review vite.config.ts manual chunks configuration:
```typescript
manualChunks: {
  'vendor-radix': [
    // Only include packages we actually use
  ]
}
```

6. Consider if we can drop unused Radix packages from package.json:
   - Check which @radix-ui packages are actually imported
   - Remove unused ones from dependencies
   - These are likely unused: menubar, context-menu, aspect-ratio, avatar

7. Run the build and compare the new vendor-radix chunk size

Target: Reduce to under 30KB gzipped.
```

---

### Prompt 4.3: Fix ESLint Warnings

```
Fix all 13 ESLint react-refresh/only-export-components warnings.

These warnings indicate files that export both components and non-components, which breaks fast refresh.

Files with warnings:
1. src/components/ui/badge.tsx - exports badgeVariants
2. src/components/ui/button.tsx - exports buttonVariants
3. src/components/ui/form.tsx - exports useFormField
4. src/components/ui/navigation-menu.tsx - exports navigationMenuTriggerStyle
5. src/components/ui/sidebar.tsx - exports useSidebar
6. src/components/ui/sonner.tsx - exports Toaster with custom props
7. src/components/ui/toggle.tsx - exports toggleVariants
8. src/contexts/AppContext.tsx - exports 6 hooks

Tasks:
1. For UI components with variants (badge, button, toggle):
   - Move the variants to a separate file like src/components/ui/badge.variants.ts
   - Re-export from the component file for backwards compatibility

2. For form.tsx:
   - Move useFormField to a separate hooks file or keep it but add the eslint-disable comment

3. For sidebar.tsx:
   - Move useSidebar to a separate file

4. For AppContext.tsx:
   - This is a context file, the hooks belong here. Add eslint-disable comment:
   ```typescript
   // eslint-disable-next-line react-refresh/only-export-components
   export const useAppUser = () => { ... }
   ```

5. Run `npm run lint` to verify all warnings are fixed

Preferred approach: Move variants/hooks to separate files rather than adding disable comments.
```

---

## Phase 5: Architecture Improvements

### Prompt 5.1: Add Native Plugin Error Boundary

```
Add error handling for native plugin failures.

Currently if the Capacitor bridge fails to load, the app crashes. We need graceful degradation.

Tasks:
1. Create a new hook: src/hooks/useNativePluginStatus.ts
   - Check if Capacitor.isNativePlatform()
   - Verify each plugin is available
   - Track plugin health status
   - Provide fallback flags

2. Create a NativePluginProvider context that wraps the app:
```typescript
interface NativePluginStatus {
  isNative: boolean;
  plugins: {
    deviceActivity: 'available' | 'unavailable' | 'error';
    storeKit: 'available' | 'unavailable' | 'error';
    widgetData: 'available' | 'unavailable' | 'error';
  };
  errors: Error[];
}
```

3. Update useDeviceActivity, useStoreKit, useWidgetSync to:
   - Check plugin availability before calling
   - Return graceful fallbacks when unavailable
   - Log errors without crashing

4. Add a banner component that shows when critical plugins are unavailable:
   - "Some features are unavailable. Please restart the app."

5. Wrap plugin calls in try-catch with proper error logging

Example pattern:
```typescript
const safeCallPlugin = async <T>(
  pluginCall: () => Promise<T>,
  fallback: T,
  errorContext: string
): Promise<T> => {
  try {
    return await pluginCall();
  } catch (error) {
    console.error(`[${errorContext}] Plugin call failed:`, error);
    Sentry.captureException(error);
    return fallback;
  }
};
```
```

---

### Prompt 5.2: Create iOS Widget Extension

```
Create the actual iOS widget extension.

Widget data syncing code exists but there's no widget target in the Xcode project.

Tasks:
1. Read ios/App/App/Sources/WidgetDataPlugin.swift to understand the data format
2. Read the WidgetSharedData struct to understand what data is available

3. Create a new Widget Extension target in Xcode (or via project.pbxproj):
   - Name: NoMoWidget
   - Bundle ID: co.nomoinc.nomo.widget
   - Add to App Group: group.co.nomoinc.nomo

4. Create the widget files:
   - ios/App/NoMoWidget/NoMoWidget.swift (main widget)
   - ios/App/NoMoWidget/NoMoWidgetBundle.swift (widget bundle)
   - ios/App/NoMoWidget/Info.plist
   - ios/App/NoMoWidget/NoMoWidget.entitlements (with app group)

5. Widget should display:
   - Small widget: Current streak + daily progress ring
   - Medium widget: Timer status + streak + daily goal
   - Large widget: Full stats view

6. Use WidgetDataReader from the shared code to read data

7. Implement timeline provider that refreshes:
   - Every 15 minutes when no timer running
   - Every minute when timer is active

8. Add the widget target to the Podfile if needed

Example widget structure:
```swift
import WidgetKit
import SwiftUI

struct NoMoWidgetEntry: TimelineEntry {
    let date: Date
    let data: WidgetSharedData
}

struct NoMoWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> NoMoWidgetEntry {
        NoMoWidgetEntry(date: Date(), data: WidgetSharedData())
    }

    func getSnapshot(in context: Context, completion: @escaping (NoMoWidgetEntry) -> ()) {
        let data = WidgetDataReader.load()
        completion(NoMoWidgetEntry(date: Date(), data: data))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NoMoWidgetEntry>) -> ()) {
        let data = WidgetDataReader.load()
        let entry = NoMoWidgetEntry(date: Date(), data: data)
        let refreshDate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
        completion(timeline)
    }
}
```
```

---

## Quick Reference: Running Order

For maximum efficiency, run these prompts in this order:

**Day 1 (Critical - 2 hours)**
1. Prompt 1.1 - Fix StoreKit tests
2. Prompt 1.2 - Fix iOS deployment target
3. Prompt 1.3 - Fix hardcoded app groups

**Day 2 (High Priority - 4 hours)**
4. Prompt 2.1 - Remove synchronize()
5. Prompt 2.2 - Standardize concurrency
6. Prompt 2.3 - Fix magic strings

**Week 1 (Tests - 2 days)**
7. Prompt 3.1 - useStoreKit tests
8. Prompt 3.2 - usePremiumStatus tests
9. Prompt 3.3 - iOS extension tests

**Week 2 (Optimization - 1 day)**
10. Prompt 4.1 - Sentry bundle
11. Prompt 4.2 - Radix imports
12. Prompt 4.3 - ESLint warnings

**Week 3+ (Architecture)**
13. Prompt 5.1 - Plugin error boundary
14. Prompt 5.2 - Widget extension

---

## After Each Fix

After running each prompt, verify the fix:

```bash
# For Swift changes
# Open Xcode and build (Cmd+B)

# For TypeScript changes
npm run typecheck
npm run lint
npm run test:run

# For bundle changes
npm run build
# Check the output sizes
```
