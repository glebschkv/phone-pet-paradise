import XCTest
@testable import App

final class AppConfigTests: XCTestCase {

    // MARK: - App Group Tests

    func testAppGroupIdentifier() {
        XCTAssertFalse(AppConfig.appGroupIdentifier.isEmpty)
        XCTAssertTrue(AppConfig.appGroupIdentifier.hasPrefix("group."))
    }

    func testSharedUserDefaults() {
        // This may be nil in test environment without proper app group setup
        // but the accessor should not crash
        _ = AppConfig.sharedUserDefaults
    }

    // MARK: - Storage Keys Tests

    func testStorageKeysAreUnique() {
        let keys = [
            AppConfig.StorageKeys.widgetData,
            AppConfig.StorageKeys.blockedAppsSelection,
            AppConfig.StorageKeys.focusSessionActive,
            AppConfig.StorageKeys.shieldAttempts,
            AppConfig.StorageKeys.lastShieldAttempt
        ]

        let uniqueKeys = Set(keys)
        XCTAssertEqual(keys.count, uniqueKeys.count, "Storage keys should be unique")
    }

    func testStorageKeysNotEmpty() {
        XCTAssertFalse(AppConfig.StorageKeys.widgetData.isEmpty)
        XCTAssertFalse(AppConfig.StorageKeys.blockedAppsSelection.isEmpty)
        XCTAssertFalse(AppConfig.StorageKeys.focusSessionActive.isEmpty)
        XCTAssertFalse(AppConfig.StorageKeys.shieldAttempts.isEmpty)
        XCTAssertFalse(AppConfig.StorageKeys.lastShieldAttempt.isEmpty)
    }

    // MARK: - Activity Monitoring Tests

    func testActivityMonitoringConstants() {
        XCTAssertFalse(AppConfig.ActivityMonitoring.activityName.isEmpty)
        XCTAssertFalse(AppConfig.ActivityMonitoring.scheduleEventName.isEmpty)
    }

    // MARK: - Background Task Tests

    func testBackgroundTaskIdentifier() {
        XCTAssertFalse(AppConfig.backgroundTaskIdentifier.isEmpty)
        XCTAssertTrue(AppConfig.backgroundTaskIdentifier.contains("."))
    }

    func testBackgroundRefreshInterval() {
        XCTAssertGreaterThan(AppConfig.backgroundRefreshIntervalMinutes, 0)
        // Should be reasonable interval (e.g., between 1 minute and 1 hour)
        XCTAssertLessThanOrEqual(AppConfig.backgroundRefreshIntervalMinutes, 60)
    }
}
