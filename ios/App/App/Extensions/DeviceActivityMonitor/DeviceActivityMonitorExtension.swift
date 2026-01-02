import DeviceActivity
import ManagedSettings
import FamilyControls
import Foundation

// MARK: - Device Activity Monitor Extension
// This extension monitors device activity and tracks when users interact with blocked apps

class DeviceActivityMonitorExtension: DeviceActivityMonitor {

    private let store = ManagedSettingsStore()
    private let helper = DeviceActivityMonitorHelper()

    // MARK: - Activity Started

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)

        // Log activity start
        helper.logEvent("Activity started: \(activity.rawValue)")

        // Check if this is our focus tracking activity
        if helper.isPhoneUsageTrackingActivity(activity.rawValue) {
            helper.markFocusSessionActive(true)
        }
    }

    // MARK: - Activity Ended

    override func intervalDidEnd(for activity: DeviceActivityName) {
        // Always try to clear shields when activity ends, even if other code fails
        defer {
            if helper.isPhoneUsageTrackingActivity(activity.rawValue) {
                clearShields()
            }
        }

        super.intervalDidEnd(for: activity)

        // Log activity end
        helper.logEvent("Activity ended: \(activity.rawValue)")

        // Check if this is our focus tracking activity
        if helper.isPhoneUsageTrackingActivity(activity.rawValue) {
            helper.markFocusSessionActive(false)
        }
    }

    // MARK: - Event Did Reach Threshold (for time-based triggers)

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)

        helper.logEvent("Event threshold reached: \(event.rawValue) for activity: \(activity.rawValue)")

        // This can be used to trigger actions when usage thresholds are met
        // For example, increasing shield strictness or sending notifications
    }

    // MARK: - Warning Threshold

    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
        helper.logEvent("Activity will start warning: \(activity.rawValue)")
    }

    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        helper.logEvent("Activity will end warning: \(activity.rawValue)")
    }

    // MARK: - Helpers

    private func clearShields() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
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
