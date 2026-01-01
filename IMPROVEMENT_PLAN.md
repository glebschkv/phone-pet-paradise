# iOS App Quality Improvement Plan

## Overview

This document outlines the detailed implementation plan to fix all 20 identified quality issues in the NoMo Phone iOS app. Issues are organized into 4 priority tiers with specific implementation steps.

---

## Priority 1: Critical Fixes (3 Issues)

### Issue #1: Missing `scheduleEventName` Constant

**Problem:** `AppConfigTests.swift:46` references `AppConfig.ActivityMonitoring.scheduleEventName` which doesn't exist.

**File to modify:** `ios/App/App/Sources/AppConfig.swift`

**Implementation:**
```swift
// Add to ActivityMonitoring enum (around line 56-59)
enum ActivityMonitoring {
    static let activityName = "phoneUsageTracking"
    static let scheduleEventName = "focusScheduleEvent"  // ADD THIS
    static let maxStoredLogs = 100
}
```

**Verification:** Run iOS tests - they should now compile and pass.

---

### Issue #2: Duplicate `withRetry` Function

**Problem:** `withRetry` is defined in both `AppConfig.swift` (lines 72-101) and `StoreKitPlugin.swift` (lines 382-407).

**Files to modify:** `ios/App/App/Sources/StoreKitPlugin.swift`

**Implementation:**
1. Delete the duplicate `withRetry` function from `StoreKitPlugin.swift` (lines 377-407)
2. Delete the `StoreKitPluginError.networkError` case if it's only used by the local retry
3. Update any calls in `StoreKitPlugin.swift` to use the function from `AppConfig.swift`

**Before (StoreKitPlugin.swift lines 70-72):**
```swift
let storeProducts = try await withRetry {
    try await Product.products(for: Set(productIds))
}
```

**After (no change needed - function signature is compatible):**
The existing calls will automatically use `AppConfig.withRetry` after removing the local definition.

---

### Issue #3: ESLint `any` Type Errors (12 errors)

**Problem:** `src/test/hooks/useSupabaseData.test.ts` uses `any` types in 12 places.

**File to modify:** `src/test/hooks/useSupabaseData.test.ts`

**Implementation:** Replace each `any` with proper types:

```typescript
// Line 121, 136, 150, etc. - Pattern:
// Before:
const mockError = { message: 'Test error' } as any;

// After:
const mockError = { message: 'Test error' } as Error;

// For Supabase client mocks:
// Before:
const mockSupabase = { from: vi.fn() } as any;

// After:
import type { SupabaseClient } from '@supabase/supabase-js';
const mockSupabase = { from: vi.fn() } as unknown as SupabaseClient;
```

**Specific fixes needed at lines:**
- 121, 136, 150, 198, 232, 265, 317, 375, 424, 441, 461, 495

---

## Priority 2: High Priority (6 Issues)

### Issue #4: React act() Warnings

**Problem:** State updates in `useAuth.test.ts` not wrapped in act().

**File to modify:** `src/test/hooks/useAuth.test.ts`

**Implementation:**
```typescript
import { act, renderHook, waitFor } from '@testing-library/react';

// Wrap async state updates:
await act(async () => {
  result.current.someAsyncFunction();
});

// Use waitFor for assertions after state changes:
await waitFor(() => {
  expect(result.current.isLoading).toBe(false);
});
```

---

### Issue #5: Massive Bundle Sizes

**Problem:** Vendor bundles exceed 300KB gzipped.

**Files to modify:**
- `vite.config.ts`
- `src/main.tsx` (lazy loading)

**Implementation:**

**Step 1: Configure Sentry for tree-shaking (vite.config.ts):**
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'vendor-motion': ['framer-motion'],
          'vendor-sentry': ['@sentry/react', '@sentry/capacitor'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
        }
      }
    }
  }
});
```

**Step 2: Lazy load Sentry (src/main.tsx or App.tsx):**
```typescript
// Lazy initialize Sentry only in production
if (import.meta.env.PROD) {
  import('@sentry/react').then(Sentry => {
    Sentry.init({ dsn: '...' });
  });
}
```

**Step 3: Lazy load Three.js components:**
```typescript
const RetroPixelPlatform = lazy(() => import('./components/RetroPixelPlatform'));
```

---

### Issue #6: Missing typecheck Script

**Problem:** No TypeScript checking in CI/CD.

**File to modify:** `package.json`

**Implementation:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint . && npm run typecheck"
  }
}
```

---

### Issue #7: ESLint Warnings (18 warnings)

**Problem:** Unused eslint-disable directives and fast-refresh warnings.

**Files to modify:**
- `src/components/waypoints/WaypointGenerator.ts:215`
- `src/hooks/useBackendStreaks.ts:58`
- `src/lib/debounce.ts:50, 101, 216`

**Implementation:**
Remove the unused eslint-disable comments from these files.

For fast-refresh warnings - these are acceptable in UI component libraries (shadcn/ui pattern).

---

### Issue #8: Missing iOS Extension Tests

**Problem:** Zero test coverage for DeviceActivityMonitor and ShieldConfiguration extensions.

**Files to create:**
- `ios/App/AppTests/DeviceActivityMonitorExtensionTests.swift`
- `ios/App/AppTests/ShieldConfigurationExtensionTests.swift`

**Implementation for DeviceActivityMonitorExtensionTests.swift:**
```swift
import XCTest
@testable import DeviceActivityMonitor

final class DeviceActivityMonitorExtensionTests: XCTestCase {

    func testActivityNameConstants() {
        XCTAssertEqual(DeviceActivityName.focusSession.rawValue, "focusSession")
        XCTAssertEqual(DeviceActivityName.phoneUsageTracking.rawValue, "phoneUsageTracking")
    }

    func testEventNameConstants() {
        XCTAssertEqual(DeviceActivityEvent.Name.focusSessionStarted.rawValue, "focusSessionStarted")
        XCTAssertEqual(DeviceActivityEvent.Name.blockedAppAttempt.rawValue, "blockedAppAttempt")
    }
}
```

**Implementation for ShieldConfigurationExtensionTests.swift:**
```swift
import XCTest
@testable import ShieldConfiguration

final class ShieldConfigurationExtensionTests: XCTestCase {

    var sut: ShieldConfigurationExtension!

    override func setUp() {
        super.setUp()
        sut = ShieldConfigurationExtension()
    }

    func testMotivationalMessagesNotEmpty() {
        // Test that we have motivational messages configured
        // This requires exposing the messages array or testing via configuration output
    }
}
```

---

### Issue #9: DeviceActivityPlugin Missing CAPBridgedPlugin

**Problem:** Inconsistent with other plugins that implement `CAPBridgedPlugin`.

**File to modify:** `ios/App/App/Sources/DeviceActivityPlugin.swift`

**Implementation:**
```swift
// Change line 45-46 from:
@objc(DeviceActivityPlugin)
public class DeviceActivityPlugin: CAPPlugin {

// To:
@objc(DeviceActivityPlugin)
public class DeviceActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeviceActivityPlugin"
    public let jsName = "DeviceActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAppPicker", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSelectedApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSelectedApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearSelectedApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startAppBlocking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopAppBlocking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getBlockingStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getShieldAttempts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resetShieldAttempts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startMonitoring", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopMonitoring", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getUsageData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "recordActiveTime", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "triggerHapticFeedback", returnType: CAPPluginReturnPromise)
    ]
```

---

## Priority 3: Medium Priority (6 Issues)

### Issue #10: Hardcoded App Group in Extensions

**Problem:** Extensions duplicate the app group identifier.

**Files to modify:**
- `ios/App/App/Extensions/DeviceActivityMonitor/DeviceActivityMonitorExtension.swift`
- `ios/App/App/Extensions/ShieldConfiguration/ShieldConfigurationExtension.swift`

**Challenge:** Extensions can't directly import from main app target.

**Solution:** Create a shared Swift package or use build settings.

**Implementation (Build Settings approach):**

1. Add to Xcode project Build Settings for all targets:
   - `APP_GROUP_IDENTIFIER = group.co.nomoinc.nomo`

2. Create `ios/App/App/Extensions/Shared/Constants.swift`:
```swift
import Foundation

enum SharedConstants {
    static let appGroupIdentifier: String = {
        Bundle.main.object(forInfoDictionaryKey: "APP_GROUP_IDENTIFIER") as? String
            ?? "group.co.nomoinc.nomo"
    }()
}
```

3. Add to each extension's Info.plist:
```xml
<key>APP_GROUP_IDENTIFIER</key>
<string>$(APP_GROUP_IDENTIFIER)</string>
```

---

### Issue #11: Deprecated three-mesh-bvh

**File to modify:** `package.json`

**Implementation:**
```bash
npm update three-mesh-bvh
```

Or add explicit override:
```json
{
  "overrides": {
    "three-mesh-bvh": "^0.8.0"
  }
}
```

---

### Issue #12: Extension Error Handling

**Problem:** Crashes could leave shields stuck.

**Files to modify:**
- `ios/App/App/Extensions/DeviceActivityMonitor/DeviceActivityMonitorExtension.swift`
- `ios/App/App/Extensions/ShieldConfiguration/ShieldConfigurationExtension.swift`

**Implementation:**
```swift
// Add to DeviceActivityMonitorExtension
override func intervalDidEnd(for activity: DeviceActivityName) {
    defer {
        // Always try to clear shields on interval end, even if other code fails
        clearShields()
    }

    super.intervalDidEnd(for: activity)

    do {
        logEvent("Activity ended: \(activity.rawValue)")
        if activity.rawValue == "phoneUsageTracking" {
            markFocusSessionActive(false)
        }
    } catch {
        logEvent("Error in intervalDidEnd: \(error.localizedDescription)")
    }
}
```

---

### Issue #13: Skipped Test

**File to examine:** `src/test/hooks/useSettings.test.ts`

**Implementation:**
1. Find the skipped test (search for `it.skip` or `test.skip`)
2. Either fix the underlying issue or remove the test if obsolete
3. Ensure no `skip` remains in test files

---

### Issue #14: Accessibility Testing

**Files to create:**
- `src/test/accessibility/a11y.test.tsx`

**Implementation:**
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('FocusTimer has no a11y violations', async () => {
    const { container } = render(<FocusTimer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Add to package.json:**
```json
{
  "devDependencies": {
    "jest-axe": "^8.0.0",
    "@axe-core/react": "^4.8.0"
  }
}
```

---

### Issue #15: API Documentation

**Files to modify:**
- `src/plugins/device-activity/definitions.ts`
- `src/plugins/store-kit/index.ts`
- `src/plugins/widget-data/index.ts`
- `src/plugins/app-review/index.ts`

**Implementation:** Add JSDoc comments:
```typescript
/**
 * DeviceActivity Plugin
 *
 * Provides native iOS Screen Time API integration for app blocking
 * and focus session management.
 *
 * @example
 * ```typescript
 * import { DeviceActivity } from '@/plugins/device-activity';
 *
 * // Request permissions
 * const { status } = await DeviceActivity.requestPermissions();
 *
 * // Start blocking
 * await DeviceActivity.startAppBlocking();
 * ```
 */
export interface DeviceActivityPlugin {
  /**
   * Request Screen Time permissions from the user.
   * @returns Promise with permission status
   */
  requestPermissions(): Promise<{ status: string; familyControlsEnabled: boolean }>;

  // ... more JSDoc for each method
}
```

---

## Priority 4: Nice to Have (5 Issues)

### Issue #16: Performance Monitoring

**Files to create:**
- `src/lib/performance.ts`

**Implementation:**
```typescript
export const trackAppLaunch = () => {
  const startTime = performance.now();

  window.addEventListener('load', () => {
    const loadTime = performance.now() - startTime;
    console.log(`[Performance] App loaded in ${loadTime.toFixed(2)}ms`);

    // Report to analytics
    if (import.meta.env.PROD) {
      // Send to Sentry or custom analytics
    }
  });
};
```

---

### Issue #17: Widget Extension Tests

**File to create:** `ios/App/AppTests/WidgetDataReaderTests.swift`

**Implementation:**
```swift
import XCTest
@testable import App

final class WidgetDataReaderTests: XCTestCase {

    func testDefaultTimerData() {
        let timer = WidgetSharedData.TimerData()
        XCTAssertFalse(timer.isRunning)
        XCTAssertEqual(timer.timeRemaining, 25 * 60)
        XCTAssertEqual(timer.sessionDuration, 25 * 60)
    }

    func testDefaultStreakData() {
        let streak = WidgetSharedData.StreakData()
        XCTAssertEqual(streak.currentStreak, 0)
        XCTAssertEqual(streak.longestStreak, 0)
    }
}
```

---

### Issue #18: CI/CD Pipeline

**File to create:** `.github/workflows/ios-build.yml`

**Implementation:**
```yaml
name: iOS Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run web tests
        run: npm run test:run

      - name: Run ESLint
        run: npm run lint

      - name: Build web assets
        run: npm run build

      - name: Setup Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: latest-stable

      - name: Install CocoaPods
        run: |
          cd ios/App
          pod install

      - name: Build iOS
        run: |
          cd ios/App
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -destination 'platform=iOS Simulator,name=iPhone 15' \
            -configuration Debug \
            build

      - name: Run iOS tests
        run: |
          cd ios/App
          xcodebuild test \
            -workspace App.xcworkspace \
            -scheme App \
            -destination 'platform=iOS Simulator,name=iPhone 15'
```

---

### Issue #19: Code Coverage Reporting

**File to modify:** `package.json`

**Implementation:**
```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:coverage:report": "vitest run --coverage --reporter=json --outputFile=coverage/coverage.json"
  }
}
```

**Add to CI workflow:**
```yaml
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage.json
```

---

### Issue #20: Memory Profiling

**Files to create:**
- `src/lib/memoryProfiler.ts`

**Implementation:**
```typescript
export const logMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`[Memory] Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB`);
    console.log(`[Memory] Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB`);
  }
};

// Call periodically in development
if (import.meta.env.DEV) {
  setInterval(logMemoryUsage, 30000);
}
```

---

## Implementation Timeline

### Phase 1: Critical Fixes (Day 1)
- [ ] Issue #1: Add scheduleEventName constant
- [ ] Issue #2: Remove duplicate withRetry
- [ ] Issue #3: Fix ESLint any types

### Phase 2: High Priority (Days 2-3)
- [ ] Issue #4: Fix React act() warnings
- [ ] Issue #5: Optimize bundle sizes
- [ ] Issue #6: Add typecheck script
- [ ] Issue #7: Clean up ESLint warnings
- [ ] Issue #8: Add extension tests
- [ ] Issue #9: Add CAPBridgedPlugin conformance

### Phase 3: Medium Priority (Days 4-5)
- [ ] Issue #10: Centralize app group identifier
- [ ] Issue #11: Update deprecated package
- [ ] Issue #12: Add extension error handling
- [ ] Issue #13: Fix skipped test
- [ ] Issue #14: Add accessibility tests
- [ ] Issue #15: Add API documentation

### Phase 4: Nice to Have (Week 2)
- [ ] Issue #16: Add performance monitoring
- [ ] Issue #17: Add widget tests
- [ ] Issue #18: Set up CI/CD pipeline
- [ ] Issue #19: Add coverage reporting
- [ ] Issue #20: Add memory profiling

---

## Verification Checklist

After completing all fixes:

- [ ] `npm run lint` passes with 0 errors and 0 warnings
- [ ] `npm run typecheck` passes
- [ ] `npm run test:run` passes all tests (no skipped)
- [ ] `npm run build` produces smaller bundles
- [ ] iOS tests compile and pass in Xcode
- [ ] No duplicate code in Swift files
- [ ] All extensions have test coverage
- [ ] CI/CD pipeline runs successfully

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| ESLint Errors | 12 | 0 |
| ESLint Warnings | 18 | 0 |
| iOS Tests | Won't compile | All pass |
| Bundle Size (gzip) | ~300KB | ~200KB |
| Code Duplication | 2 withRetry functions | 1 |
| Test Coverage | 437 tests | 450+ tests |
| Quality Score | 6.5/10 | 8+/10 |
