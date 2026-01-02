import Foundation

/**
 * DeviceActivityMonitorHelper
 *
 * A testable helper class that encapsulates the logic used by DeviceActivityMonitorExtension.
 * This allows unit testing of the extension's business logic without needing to run
 * the extension in a separate process.
 *
 * Usage:
 * - The DeviceActivityMonitorExtension should use this helper for its operations
 * - Tests can inject a mock UserDefaults to verify behavior
 */
class DeviceActivityMonitorHelper {

    // MARK: - Properties

    private let userDefaults: UserDefaults

    // MARK: - Initialization

    /// Initialize with custom UserDefaults (for testing) or use shared defaults
    init(userDefaults: UserDefaults? = nil) {
        self.userDefaults = userDefaults ?? SharedConstants.sharedUserDefaults ?? UserDefaults.standard
    }

    // MARK: - Focus Session Management

    /// Marks the focus session as active or inactive
    func markFocusSessionActive(_ active: Bool) {
        userDefaults.set(active, forKey: SharedConstants.StorageKeys.focusSessionActive)
    }

    /// Returns whether a focus session is currently active
    var isFocusSessionActive: Bool {
        userDefaults.bool(forKey: SharedConstants.StorageKeys.focusSessionActive)
    }

    // MARK: - Event Logging

    /// Logs an event with a timestamp to the activity logs
    func logEvent(_ message: String) {
        var logs = userDefaults.stringArray(forKey: SharedConstants.StorageKeys.activityLogs) ?? []
        let timestamp = ISO8601DateFormatter().string(from: Date())
        logs.append("[\(timestamp)] \(message)")

        // Keep only last N logs (log rotation)
        if logs.count > SharedConstants.maxStoredLogs {
            logs = Array(logs.suffix(SharedConstants.maxStoredLogs))
        }

        userDefaults.set(logs, forKey: SharedConstants.StorageKeys.activityLogs)
    }

    /// Returns all stored activity logs
    var activityLogs: [String] {
        userDefaults.stringArray(forKey: SharedConstants.StorageKeys.activityLogs) ?? []
    }

    /// Clears all activity logs
    func clearActivityLogs() {
        userDefaults.removeObject(forKey: SharedConstants.StorageKeys.activityLogs)
    }

    // MARK: - Activity Detection

    /// Checks if the given activity name is the phone usage tracking activity
    func isPhoneUsageTrackingActivity(_ activityRawValue: String) -> Bool {
        return activityRawValue == SharedConstants.ActivityNames.phoneUsageTracking
    }

    /// Checks if the given activity name is a focus session activity
    func isFocusSessionActivity(_ activityRawValue: String) -> Bool {
        return activityRawValue == SharedConstants.ActivityNames.focusSession
    }
}
