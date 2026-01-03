import Foundation

/**
 * Strings
 *
 * Centralized, type-safe string constants for localization.
 * All user-facing strings should be defined here.
 *
 * Uses NSLocalizedString for compatibility with iOS 14+.
 * Strings are defined in Localizable.strings files in en.lproj, es.lproj, etc.
 *
 * Usage:
 *   label.text = Strings.Shield.title
 *   button.setTitle(Strings.Shield.returnButton, for: .normal)
 *   let message = Strings.Widget.streakDays(7)
 */
enum Strings {

    // MARK: - Localization Helper

    private static func localized(_ key: String, comment: String = "") -> String {
        NSLocalizedString(key, comment: comment)
    }

    private static func localized(_ key: String, _ args: CVarArg..., comment: String = "") -> String {
        String(format: NSLocalizedString(key, comment: comment), arguments: args)
    }

    // MARK: - Shield Configuration

    enum Shield {
        static var title: String {
            localized("shield.title", comment: "Shield screen title")
        }

        static var returnButton: String {
            localized("shield.return_button", comment: "Return to app button")
        }

        static func appBlocked(_ appName: String) -> String {
            localized("shield.app_blocked", appName, comment: "App blocked message")
        }

        static func categoryBlocked(_ categoryName: String) -> String {
            localized("shield.category_blocked", categoryName, comment: "Category blocked message")
        }

        static func domainBlocked(_ domain: String) -> String {
            localized("shield.domain_blocked", domain, comment: "Domain blocked message")
        }

        static func webCategoryBlocked(_ categoryName: String) -> String {
            localized("shield.web_category_blocked", categoryName, comment: "Web category blocked message")
        }

        /// All motivational messages (loaded at access time for proper localization)
        static var motivationalMessages: [String] {
            [
                localized("shield.motivation.1"),
                localized("shield.motivation.2"),
                localized("shield.motivation.3"),
                localized("shield.motivation.4"),
                localized("shield.motivation.5"),
                localized("shield.motivation.6"),
                localized("shield.motivation.7"),
                localized("shield.motivation.8"),
                localized("shield.motivation.9"),
                localized("shield.motivation.10")
            ]
        }

        static var randomMotivation: String {
            motivationalMessages.randomElement() ?? motivationalMessages[0]
        }
    }

    // MARK: - Blocking

    enum Blocking {
        static var selectionSaved: String {
            localized("blocking.selection_saved", comment: "Selection saved confirmation")
        }

        static var noAppsConfigured: String {
            localized("blocking.no_apps", comment: "No apps configured message")
        }

        static var sessionStarted: String {
            localized("blocking.session_started", comment: "Session started notification")
        }

        static var sessionEnded: String {
            localized("blocking.session_ended", comment: "Session ended notification")
        }
    }

    // MARK: - Permissions

    enum Permissions {
        static var granted: String {
            localized("permissions.granted", comment: "Permission granted status")
        }

        static var denied: String {
            localized("permissions.denied", comment: "Permission denied status")
        }

        static var familyControlsRequired: String {
            localized("permissions.family_controls_required", comment: "Family Controls required message")
        }
    }

    // MARK: - Widgets

    enum Widget {
        static var timerTitle: String {
            localized("widget.timer_title", comment: "Timer widget title")
        }

        static var streakTitle: String {
            localized("widget.streak_title", comment: "Streak widget title")
        }

        static var progressTitle: String {
            localized("widget.progress_title", comment: "Progress widget title")
        }

        static var statsTitle: String {
            localized("widget.stats_title", comment: "Stats widget title")
        }

        static var noSession: String {
            localized("widget.no_session", comment: "No active session message")
        }

        static var focusSession: String {
            localized("widget.focus_session", comment: "Focus session label")
        }

        static var tapToStart: String {
            localized("widget.tap_to_start", comment: "Tap to start instruction")
        }

        static var sessions: String {
            localized("widget.sessions", comment: "Sessions label")
        }

        static var focused: String {
            localized("widget.focused", comment: "Focused label")
        }

        static var record: String {
            localized("widget.record", comment: "Record badge")
        }

        static func streakDays(_ count: Int) -> String {
            localized("widget.streak_days", count, comment: "Streak days count")
        }

        static func minutesRemaining(_ minutes: Int) -> String {
            localized("widget.minutes_remaining", minutes, comment: "Minutes remaining")
        }

        static func percentComplete(_ percent: Int) -> String {
            localized("widget.percent_complete", percent, comment: "Percent complete")
        }
    }

    // MARK: - StoreKit

    enum StoreKit {
        static var purchaseSuccess: String {
            localized("storekit.purchase_success", comment: "Purchase success message")
        }

        static var purchaseCancelled: String {
            localized("storekit.purchase_cancelled", comment: "Purchase cancelled message")
        }

        static var purchasePending: String {
            localized("storekit.purchase_pending", comment: "Purchase pending message")
        }

        static var restoreSuccess: String {
            localized("storekit.restore_success", comment: "Restore success message")
        }
    }

    // MARK: - General

    enum General {
        static var success: String {
            localized("general.success", comment: "Success")
        }

        static var error: String {
            localized("general.error", comment: "Error")
        }

        static var cancel: String {
            localized("general.cancel", comment: "Cancel button")
        }

        static var ok: String {
            localized("general.ok", comment: "OK button")
        }

        static var done: String {
            localized("general.done", comment: "Done button")
        }

        static var loading: String {
            localized("general.loading", comment: "Loading indicator")
        }

        static var retry: String {
            localized("general.retry", comment: "Retry button")
        }
    }

    // MARK: - Time Formatting

    enum Time {
        static func hours(_ count: Int) -> String {
            localized("time.hours", count, comment: "Hours count")
        }

        static func minutes(_ count: Int) -> String {
            localized("time.minutes", count, comment: "Minutes count")
        }

        static func seconds(_ count: Int) -> String {
            localized("time.seconds", count, comment: "Seconds count")
        }

        static func hoursShort(_ count: Int) -> String {
            localized("time.hours_short", count, comment: "Hours short format")
        }

        static func minutesShort(_ count: Int) -> String {
            localized("time.minutes_short", count, comment: "Minutes short format")
        }

        static func secondsShort(_ count: Int) -> String {
            localized("time.seconds_short", count, comment: "Seconds short format")
        }
    }

    // MARK: - Stats

    enum Stats {
        static func level(_ level: Int) -> String {
            localized("stats.level", level, comment: "Level display")
        }

        static func xp(_ amount: Int) -> String {
            localized("stats.xp", amount, comment: "XP display")
        }

        static var totalFocusTime: String {
            localized("stats.total_focus_time", comment: "Total focus time label")
        }

        static var totalSessions: String {
            localized("stats.total_sessions", comment: "Total sessions label")
        }

        static var currentStreak: String {
            localized("stats.current_streak", comment: "Current streak label")
        }

        static var longestStreak: String {
            localized("stats.longest_streak", comment: "Longest streak label")
        }
    }

    // MARK: - Session Types

    enum Session {
        static var focus: String {
            localized("session.focus", comment: "Focus session type")
        }

        static var shortBreak: String {
            localized("session.short_break", comment: "Short break session type")
        }

        static var longBreak: String {
            localized("session.long_break", comment: "Long break session type")
        }
    }
}
