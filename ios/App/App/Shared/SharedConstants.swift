import Foundation

/**
 * SharedConstants
 *
 * Constants shared between the main app and extensions.
 * This file must be included in ALL targets:
 * - App (main target)
 * - DeviceActivityMonitor extension
 * - ShieldConfiguration extension
 */
enum SharedConstants {
    // MARK: - App Group
    static let appGroupIdentifier = "group.co.nomoinc.nomo"

    // MARK: - Shared UserDefaults
    static var sharedUserDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupIdentifier)
    }

    // MARK: - Storage Keys (used by extensions)
    enum StorageKeys {
        static let focusSessionActive = "focusSessionActive"
        static let shieldAttempts = "shieldAttempts"
        static let lastShieldAttempt = "lastShieldAttempt"
        static let activityLogs = "activityLogs"
        static let blockedAppsSelection = "blockedAppSelection"
    }

    // MARK: - Activity Names
    enum ActivityNames {
        static let phoneUsageTracking = "phoneUsageTracking"
        static let focusSession = "focusSession"
    }

    // MARK: - Event Names
    enum EventNames {
        static let focusSessionStarted = "focusSessionStarted"
        static let focusSessionEnded = "focusSessionEnded"
        static let blockedAppAttempt = "blockedAppAttempt"
    }

    // MARK: - Limits
    static let maxStoredLogs = 100
}
