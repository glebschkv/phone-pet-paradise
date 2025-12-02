import DeviceActivity
import ManagedSettings
import FamilyControls
import Foundation

// MARK: - Device Activity Monitor Extension
// This extension monitors device activity and tracks when users interact with blocked apps

class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    // App Group for shared data
    private let appGroupIdentifier = "group.co.nomoinc.nomo"
    private let store = ManagedSettingsStore()

    // MARK: - Activity Started

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)

        // Log activity start
        logEvent("Activity started: \(activity.rawValue)")

        // Check if this is our focus tracking activity
        if activity.rawValue == "phoneUsageTracking" {
            markFocusSessionActive(true)
        }
    }

    // MARK: - Activity Ended

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        // Log activity end
        logEvent("Activity ended: \(activity.rawValue)")

        // Check if this is our focus tracking activity
        if activity.rawValue == "phoneUsageTracking" {
            markFocusSessionActive(false)
            clearShields()
        }
    }

    // MARK: - Event Did Reach Threshold (for time-based triggers)

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)

        logEvent("Event threshold reached: \(event.rawValue) for activity: \(activity.rawValue)")

        // This can be used to trigger actions when usage thresholds are met
        // For example, increasing shield strictness or sending notifications
    }

    // MARK: - Warning Threshold

    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
        logEvent("Activity will start warning: \(activity.rawValue)")
    }

    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        logEvent("Activity will end warning: \(activity.rawValue)")
    }

    // MARK: - Helpers

    private func markFocusSessionActive(_ active: Bool) {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else { return }
        userDefaults.set(active, forKey: "focusSessionActive")
        userDefaults.synchronize()
    }

    private func clearShields() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
    }

    private func logEvent(_ message: String) {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier) else { return }

        // Append to activity log
        var logs = userDefaults.stringArray(forKey: "activityLogs") ?? []
        let timestamp = ISO8601DateFormatter().string(from: Date())
        logs.append("[\(timestamp)] \(message)")

        // Keep only last 100 logs
        if logs.count > 100 {
            logs = Array(logs.suffix(100))
        }

        userDefaults.set(logs, forKey: "activityLogs")
        userDefaults.synchronize()
    }
}

// MARK: - Custom Activity Names

extension DeviceActivityName {
    static let focusSession = Self("focusSession")
    static let phoneUsageTracking = Self("phoneUsageTracking")
}

// MARK: - Custom Event Names

extension DeviceActivityEvent.Name {
    static let focusSessionStarted = Self("focusSessionStarted")
    static let focusSessionEnded = Self("focusSessionEnded")
    static let blockedAppAttempt = Self("blockedAppAttempt")
}
