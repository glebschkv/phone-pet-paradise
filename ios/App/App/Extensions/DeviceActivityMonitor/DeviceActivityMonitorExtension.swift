import DeviceActivity
import ManagedSettings
import FamilyControls
import Foundation

// MARK: - Device Activity Monitor Extension
// This extension monitors device activity and tracks when users interact with blocked apps

class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    private let store = ManagedSettingsStore()

    // MARK: - Activity Started

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)

        // Log activity start
        logEvent("Activity started: \(activity.rawValue)")

        // Check if this is our focus tracking activity
        if activity.rawValue == SharedConstants.ActivityNames.phoneUsageTracking {
            markFocusSessionActive(true)
        }
    }

    // MARK: - Activity Ended

    override func intervalDidEnd(for activity: DeviceActivityName) {
        // Always try to clear shields when activity ends, even if other code fails
        defer {
            if activity.rawValue == SharedConstants.ActivityNames.phoneUsageTracking {
                clearShields()
            }
        }

        super.intervalDidEnd(for: activity)

        // Log activity end
        logEvent("Activity ended: \(activity.rawValue)")

        // Check if this is our focus tracking activity
        if activity.rawValue == SharedConstants.ActivityNames.phoneUsageTracking {
            markFocusSessionActive(false)
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
        guard let userDefaults = SharedConstants.sharedUserDefaults else { return }
        userDefaults.set(active, forKey: SharedConstants.StorageKeys.focusSessionActive)
        userDefaults.synchronize()
    }

    private func clearShields() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
    }

    private func logEvent(_ message: String) {
        guard let userDefaults = SharedConstants.sharedUserDefaults else { return }

        // Append to activity log
        var logs = userDefaults.stringArray(forKey: SharedConstants.StorageKeys.activityLogs) ?? []
        let timestamp = ISO8601DateFormatter().string(from: Date())
        logs.append("[\(timestamp)] \(message)")

        // Keep only last N logs
        if logs.count > SharedConstants.maxStoredLogs {
            logs = Array(logs.suffix(SharedConstants.maxStoredLogs))
        }

        userDefaults.set(logs, forKey: SharedConstants.StorageKeys.activityLogs)
        userDefaults.synchronize()
    }
}

// MARK: - Custom Activity Names

extension DeviceActivityName {
    static let focusSession = Self(SharedConstants.ActivityNames.focusSession)
    static let phoneUsageTracking = Self(SharedConstants.ActivityNames.phoneUsageTracking)
}

// MARK: - Custom Event Names

extension DeviceActivityEvent.Name {
    static let focusSessionStarted = Self(SharedConstants.EventNames.focusSessionStarted)
    static let focusSessionEnded = Self(SharedConstants.EventNames.focusSessionEnded)
    static let blockedAppAttempt = Self(SharedConstants.EventNames.blockedAppAttempt)
}
