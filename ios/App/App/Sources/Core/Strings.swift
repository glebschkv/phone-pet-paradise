import Foundation

/**
 * Strings
 *
 * Centralized, type-safe string constants for localization.
 * All user-facing strings should be defined here.
 *
 * Usage:
 *   label.text = Strings.Shield.title
 *   button.setTitle(Strings.Shield.returnButton, for: .normal)
 */
enum Strings {

    // MARK: - Shield Configuration

    enum Shield {
        static let title = String(localized: "shield.title", defaultValue: "Stay Focused!")
        static let returnButton = String(localized: "shield.return_button", defaultValue: "Return to NoMo")

        static func appBlocked(_ appName: String) -> String {
            String(localized: "shield.app_blocked \(appName)", defaultValue: "\(appName) is blocked")
        }

        static func categoryBlocked(_ categoryName: String) -> String {
            String(localized: "shield.category_blocked \(categoryName)", defaultValue: "\(categoryName) is blocked during your focus session")
        }

        static func domainBlocked(_ domain: String) -> String {
            String(localized: "shield.domain_blocked \(domain)", defaultValue: "\(domain) is blocked during your focus session")
        }

        static func webCategoryBlocked(_ categoryName: String) -> String {
            String(localized: "shield.web_category_blocked \(categoryName)", defaultValue: "Web browsing in \(categoryName) is blocked")
        }

        /// Motivational messages shown on shield screens
        static let motivationalMessages: [String] = [
            String(localized: "shield.motivation.1", defaultValue: "Your focus pet is counting on you!"),
            String(localized: "shield.motivation.2", defaultValue: "Stay strong - your future self will thank you!"),
            String(localized: "shield.motivation.3", defaultValue: "Every minute of focus earns you rewards!"),
            String(localized: "shield.motivation.4", defaultValue: "You're doing great! Keep focusing!"),
            String(localized: "shield.motivation.5", defaultValue: "Distractions can wait - your goals can't!"),
            String(localized: "shield.motivation.6", defaultValue: "Focus now, scroll later!"),
            String(localized: "shield.motivation.7", defaultValue: "Your streak depends on you!"),
            String(localized: "shield.motivation.8", defaultValue: "Almost there! Don't give up now!"),
            String(localized: "shield.motivation.9", defaultValue: "Focus = XP = Level Up!"),
            String(localized: "shield.motivation.10", defaultValue: "Your pet believes in you!")
        ]

        static var randomMotivation: String {
            motivationalMessages.randomElement() ?? motivationalMessages[0]
        }
    }

    // MARK: - Blocking

    enum Blocking {
        static let selectionSaved = String(localized: "blocking.selection_saved", defaultValue: "App selection saved")
        static let noAppsConfigured = String(localized: "blocking.no_apps", defaultValue: "No apps configured for blocking")
        static let sessionStarted = String(localized: "blocking.session_started", defaultValue: "Focus session started")
        static let sessionEnded = String(localized: "blocking.session_ended", defaultValue: "Focus session ended")
    }

    // MARK: - Permissions

    enum Permissions {
        static let granted = String(localized: "permissions.granted", defaultValue: "granted")
        static let denied = String(localized: "permissions.denied", defaultValue: "denied")
        static let familyControlsRequired = String(localized: "permissions.family_controls_required", defaultValue: "Family Controls permission is required")
    }

    // MARK: - Widgets

    enum Widget {
        static let timerTitle = String(localized: "widget.timer_title", defaultValue: "Focus Timer")
        static let streakTitle = String(localized: "widget.streak_title", defaultValue: "Current Streak")
        static let progressTitle = String(localized: "widget.progress_title", defaultValue: "Daily Progress")
        static let statsTitle = String(localized: "widget.stats_title", defaultValue: "Focus Stats")

        static let noSession = String(localized: "widget.no_session", defaultValue: "No active session")
        static let focusSession = String(localized: "widget.focus_session", defaultValue: "Focus Session")

        static func streakDays(_ count: Int) -> String {
            String(localized: "widget.streak_days \(count)", defaultValue: "\(count) days")
        }

        static func minutesRemaining(_ minutes: Int) -> String {
            String(localized: "widget.minutes_remaining \(minutes)", defaultValue: "\(minutes) min remaining")
        }

        static func percentComplete(_ percent: Int) -> String {
            String(localized: "widget.percent_complete \(percent)", defaultValue: "\(percent)% complete")
        }
    }

    // MARK: - StoreKit

    enum StoreKit {
        static let purchaseSuccess = String(localized: "storekit.purchase_success", defaultValue: "Purchase successful")
        static let purchaseCancelled = String(localized: "storekit.purchase_cancelled", defaultValue: "User cancelled the purchase")
        static let purchasePending = String(localized: "storekit.purchase_pending", defaultValue: "Purchase is pending approval")
        static let restoreSuccess = String(localized: "storekit.restore_success", defaultValue: "Purchases restored successfully")
    }

    // MARK: - General

    enum General {
        static let success = String(localized: "general.success", defaultValue: "Success")
        static let error = String(localized: "general.error", defaultValue: "Error")
        static let cancel = String(localized: "general.cancel", defaultValue: "Cancel")
        static let ok = String(localized: "general.ok", defaultValue: "OK")
    }
}
