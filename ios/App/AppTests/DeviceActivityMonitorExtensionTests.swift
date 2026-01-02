import XCTest
@testable import App

/**
 * DeviceActivityMonitorExtensionTests
 *
 * Unit tests for DeviceActivityMonitor extension logic.
 * Since extensions run in separate processes, we test the helper class
 * that encapsulates the extension's testable logic.
 */
final class DeviceActivityMonitorExtensionTests: XCTestCase {

    // MARK: - Properties

    var sut: DeviceActivityMonitorHelper!
    var mockUserDefaults: UserDefaults!

    // MARK: - Setup & Teardown

    override func setUp() {
        super.setUp()
        // Create isolated UserDefaults for testing
        mockUserDefaults = UserDefaults(suiteName: "DeviceActivityMonitorTests")
        mockUserDefaults?.removePersistentDomain(forName: "DeviceActivityMonitorTests")
        sut = DeviceActivityMonitorHelper(userDefaults: mockUserDefaults)
    }

    override func tearDown() {
        // Clean up test data
        mockUserDefaults?.removePersistentDomain(forName: "DeviceActivityMonitorTests")
        mockUserDefaults = nil
        sut = nil
        super.tearDown()
    }

    // MARK: - Focus Session State Tests

    func testMarkFocusSessionActiveTrue() {
        // When
        sut.markFocusSessionActive(true)

        // Then
        XCTAssertTrue(sut.isFocusSessionActive)
    }

    func testMarkFocusSessionActiveFalse() {
        // Given
        sut.markFocusSessionActive(true)
        XCTAssertTrue(sut.isFocusSessionActive)

        // When
        sut.markFocusSessionActive(false)

        // Then
        XCTAssertFalse(sut.isFocusSessionActive)
    }

    func testIntervalDidStartMarksFocusSessionActive() {
        // Given - session is inactive
        sut.markFocusSessionActive(false)
        XCTAssertFalse(sut.isFocusSessionActive)

        // When - simulating intervalDidStart for phone usage tracking
        if sut.isPhoneUsageTrackingActivity(SharedConstants.ActivityNames.phoneUsageTracking) {
            sut.markFocusSessionActive(true)
        }

        // Then
        XCTAssertTrue(sut.isFocusSessionActive)
    }

    func testIntervalDidEndClearsSessionState() {
        // Given - session is active
        sut.markFocusSessionActive(true)
        XCTAssertTrue(sut.isFocusSessionActive)

        // When - simulating intervalDidEnd for phone usage tracking
        if sut.isPhoneUsageTrackingActivity(SharedConstants.ActivityNames.phoneUsageTracking) {
            sut.markFocusSessionActive(false)
        }

        // Then
        XCTAssertFalse(sut.isFocusSessionActive)
    }

    // MARK: - Activity Detection Tests

    func testIsPhoneUsageTrackingActivity() {
        XCTAssertTrue(sut.isPhoneUsageTrackingActivity("phoneUsageTracking"))
        XCTAssertFalse(sut.isPhoneUsageTrackingActivity("focusSession"))
        XCTAssertFalse(sut.isPhoneUsageTrackingActivity("someOtherActivity"))
    }

    func testIsFocusSessionActivity() {
        XCTAssertTrue(sut.isFocusSessionActivity("focusSession"))
        XCTAssertFalse(sut.isFocusSessionActivity("phoneUsageTracking"))
        XCTAssertFalse(sut.isFocusSessionActivity("someOtherActivity"))
    }

    // MARK: - Log Event Tests

    func testLogEventAppendsToLogs() {
        // Given
        sut.clearActivityLogs()
        XCTAssertEqual(sut.activityLogs.count, 0)

        // When
        sut.logEvent("Test event 1")
        sut.logEvent("Test event 2")
        sut.logEvent("Test event 3")

        // Then
        XCTAssertEqual(sut.activityLogs.count, 3)
        XCTAssertTrue(sut.activityLogs[0].contains("Test event 1"))
        XCTAssertTrue(sut.activityLogs[1].contains("Test event 2"))
        XCTAssertTrue(sut.activityLogs[2].contains("Test event 3"))
    }

    func testLogEventIncludesTimestamp() {
        // Given
        sut.clearActivityLogs()

        // When
        sut.logEvent("Test event")

        // Then
        let log = sut.activityLogs.first
        XCTAssertNotNil(log)
        // ISO8601 timestamp format: [2024-01-01T12:00:00Z]
        XCTAssertTrue(log!.hasPrefix("["))
        XCTAssertTrue(log!.contains("]"))
        XCTAssertTrue(log!.contains("Test event"))
    }

    func testLogEventPreservesOrder() {
        // Given
        sut.clearActivityLogs()

        // When
        for i in 1...10 {
            sut.logEvent("Event \(i)")
        }

        // Then
        let logs = sut.activityLogs
        XCTAssertEqual(logs.count, 10)
        for i in 1...10 {
            XCTAssertTrue(logs[i - 1].contains("Event \(i)"))
        }
    }

    // MARK: - Log Rotation Tests

    func testLogRotationKeepsOnlyLast100() {
        // Given
        sut.clearActivityLogs()
        let maxLogs = SharedConstants.maxStoredLogs

        // When - add more than max logs
        for i in 1...150 {
            sut.logEvent("Event \(i)")
        }

        // Then
        let logs = sut.activityLogs
        XCTAssertEqual(logs.count, maxLogs)

        // First log should be Event 51 (since we added 150 and kept last 100)
        XCTAssertTrue(logs.first!.contains("Event 51"))
        // Last log should be Event 150
        XCTAssertTrue(logs.last!.contains("Event 150"))
    }

    func testLogRotationAtExactLimit() {
        // Given
        sut.clearActivityLogs()
        let maxLogs = SharedConstants.maxStoredLogs

        // When - add exactly max logs
        for i in 1...maxLogs {
            sut.logEvent("Event \(i)")
        }

        // Then
        let logs = sut.activityLogs
        XCTAssertEqual(logs.count, maxLogs)
        XCTAssertTrue(logs.first!.contains("Event 1"))
        XCTAssertTrue(logs.last!.contains("Event \(maxLogs)"))
    }

    func testLogRotationAtOneOverLimit() {
        // Given
        sut.clearActivityLogs()
        let maxLogs = SharedConstants.maxStoredLogs

        // When - add one more than max logs
        for i in 1...(maxLogs + 1) {
            sut.logEvent("Event \(i)")
        }

        // Then
        let logs = sut.activityLogs
        XCTAssertEqual(logs.count, maxLogs)
        // First event should be removed
        XCTAssertTrue(logs.first!.contains("Event 2"))
        XCTAssertTrue(logs.last!.contains("Event \(maxLogs + 1)"))
    }

    // MARK: - Event Threshold Logging Tests

    func testEventDidReachThresholdLogging() {
        // Given
        sut.clearActivityLogs()

        // When - simulating eventDidReachThreshold logging
        let eventName = "focusSessionStarted"
        let activityName = "phoneUsageTracking"
        sut.logEvent("Event threshold reached: \(eventName) for activity: \(activityName)")

        // Then
        let logs = sut.activityLogs
        XCTAssertEqual(logs.count, 1)
        XCTAssertTrue(logs.first!.contains("Event threshold reached"))
        XCTAssertTrue(logs.first!.contains(eventName))
        XCTAssertTrue(logs.first!.contains(activityName))
    }

    // MARK: - Clear Activity Logs Tests

    func testClearActivityLogs() {
        // Given
        sut.logEvent("Event 1")
        sut.logEvent("Event 2")
        XCTAssertEqual(sut.activityLogs.count, 2)

        // When
        sut.clearActivityLogs()

        // Then
        XCTAssertEqual(sut.activityLogs.count, 0)
    }

    // MARK: - Integration Tests

    func testCompleteActivityLifecycle() {
        // Given - clean state
        sut.clearActivityLogs()
        sut.markFocusSessionActive(false)

        // When - activity starts
        sut.logEvent("Activity started: phoneUsageTracking")
        sut.markFocusSessionActive(true)

        // Then - session is active
        XCTAssertTrue(sut.isFocusSessionActive)
        XCTAssertEqual(sut.activityLogs.count, 1)

        // When - activity ends
        sut.logEvent("Activity ended: phoneUsageTracking")
        sut.markFocusSessionActive(false)

        // Then - session is inactive
        XCTAssertFalse(sut.isFocusSessionActive)
        XCTAssertEqual(sut.activityLogs.count, 2)
        XCTAssertTrue(sut.activityLogs.last!.contains("Activity ended"))
    }

    func testWarningThresholdLogging() {
        // Given
        sut.clearActivityLogs()

        // When - simulating warning events
        sut.logEvent("Activity will start warning: phoneUsageTracking")
        sut.logEvent("Activity will end warning: phoneUsageTracking")

        // Then
        let logs = sut.activityLogs
        XCTAssertEqual(logs.count, 2)
        XCTAssertTrue(logs[0].contains("will start warning"))
        XCTAssertTrue(logs[1].contains("will end warning"))
    }

    // MARK: - Default State Tests

    func testDefaultFocusSessionStateIsFalse() {
        // Given - fresh UserDefaults
        let freshDefaults = UserDefaults(suiteName: "FreshDefaultsTest")
        freshDefaults?.removePersistentDomain(forName: "FreshDefaultsTest")
        let freshHelper = DeviceActivityMonitorHelper(userDefaults: freshDefaults)

        // Then
        XCTAssertFalse(freshHelper.isFocusSessionActive)

        // Cleanup
        freshDefaults?.removePersistentDomain(forName: "FreshDefaultsTest")
    }

    func testDefaultActivityLogsIsEmpty() {
        // Given - fresh UserDefaults
        let freshDefaults = UserDefaults(suiteName: "FreshDefaultsTest2")
        freshDefaults?.removePersistentDomain(forName: "FreshDefaultsTest2")
        let freshHelper = DeviceActivityMonitorHelper(userDefaults: freshDefaults)

        // Then
        XCTAssertEqual(freshHelper.activityLogs.count, 0)

        // Cleanup
        freshDefaults?.removePersistentDomain(forName: "FreshDefaultsTest2")
    }
}
