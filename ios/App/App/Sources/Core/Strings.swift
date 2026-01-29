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

    enum StoreKitStrings {
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

    // MARK: - Accessibility

    /// Accessibility strings for VoiceOver and assistive technologies
    /// These provide comprehensive descriptions for all UI elements
    enum Accessibility {

        // MARK: - Icon Descriptions

        enum Icons {
            static var timer: String { localized("a11y.icon.timer") }
            static var moon: String { localized("a11y.icon.moon") }
            static var flameActive: String { localized("a11y.icon.flame_active") }
            static var flameInactive: String { localized("a11y.icon.flame_inactive") }
            static var star: String { localized("a11y.icon.star") }
            static var snowflake: String { localized("a11y.icon.snowflake") }
            static var checkmark: String { localized("a11y.icon.checkmark") }
            static var clock: String { localized("a11y.icon.clock") }
            static var level: String { localized("a11y.icon.level") }
        }

        // MARK: - Widget Labels

        enum Widgets {
            static var timer: String { localized("a11y.widget.timer") }
            static var streak: String { localized("a11y.widget.streak") }
            static var progress: String { localized("a11y.widget.progress") }
            static var stats: String { localized("a11y.widget.stats") }
        }

        // MARK: - Hints

        enum Hints {
            static var tapToOpen: String { localized("a11y.hint.tap_to_open") }
            static var tapToStart: String { localized("a11y.hint.tap_to_start") }
            static var liveProgress: String { localized("a11y.hint.live_progress") }
        }

        // MARK: - Time

        enum Time {
            static func remainingMinutesSeconds(_ minutes: Int, _ seconds: Int) -> String {
                localized("a11y.time.remaining_minutes_seconds", minutes, seconds)
            }
            static func remainingMinutes(_ minutes: Int) -> String {
                localized("a11y.time.remaining_minutes", minutes)
            }
            static func remainingSeconds(_ seconds: Int) -> String {
                localized("a11y.time.remaining_seconds", seconds)
            }
        }

        // MARK: - Progress

        enum Progress {
            static var complete: String { localized("a11y.progress.complete") }
            static func percent(_ percent: Int) -> String {
                localized("a11y.progress.percent", percent)
            }
            static var goalReached: String { localized("a11y.progress.goal_reached") }
            static func summary(percent: Int, focus: Int, goal: Int, sessions: Int) -> String {
                localized("a11y.progress.summary", percent, focus, goal, sessions)
            }
        }

        // MARK: - Streak

        enum Streak {
            static func record(_ days: Int) -> String {
                localized("a11y.streak.record", days)
            }
            static var none: String { localized("a11y.streak.none") }
            static var oneDay: String { localized("a11y.streak.one_day") }
            static func days(_ count: Int) -> String {
                localized("a11y.streak.days", count)
            }
            static func summary(_ days: Int) -> String {
                localized("a11y.streak.summary", days)
            }
            static func summaryRecord(_ days: Int) -> String {
                localized("a11y.streak.summary_record", days)
            }
        }

        // MARK: - Freeze

        enum Freeze {
            static var one: String { localized("a11y.freeze.one") }
            static func multiple(_ count: Int) -> String {
                localized("a11y.freeze.multiple", count)
            }
        }

        // MARK: - Focus

        enum Focus {
            static func timeProgress(_ current: Int, _ goal: Int) -> String {
                localized("a11y.focus.time_progress", current, goal)
            }
        }

        // MARK: - Sessions

        enum Sessions {
            static var one: String { localized("a11y.sessions.one") }
            static func multiple(_ count: Int) -> String {
                localized("a11y.sessions.multiple", count)
            }
        }

        // MARK: - Total Time

        enum TotalTime {
            static func hoursMinutes(_ hours: Int, _ minutes: Int) -> String {
                localized("a11y.total.hours_minutes", hours, minutes)
            }
            static func hours(_ hours: Int) -> String {
                localized("a11y.total.hours", hours)
            }
            static func minutes(_ minutes: Int) -> String {
                localized("a11y.total.minutes", minutes)
            }
        }

        // MARK: - Timer

        enum Timer {
            static func running(_ type: String, _ time: String) -> String {
                localized("a11y.timer.running", type, time)
            }
            static var idle: String { localized("a11y.timer.idle") }
            static func summaryActive(_ type: String, _ time: String, _ percent: Int) -> String {
                localized("a11y.timer.summary_active", type, time, percent)
            }
            static var summaryInactive: String { localized("a11y.timer.summary_inactive") }
        }

        // MARK: - Stats

        enum StatsA11y {
            static func xp(_ amount: Int) -> String {
                localized("a11y.stats.xp", amount)
            }
            static func level(_ level: Int) -> String {
                localized("a11y.stats.level", level)
            }
            static func summary(level: Int, xp: Int, focusTime: String, sessions: Int) -> String {
                localized("a11y.stats.summary", level, xp, focusTime, sessions)
            }
        }

        // MARK: - Shield

        enum Shield {
            static var title: String { localized("a11y.shield.title") }
            static var description: String { localized("a11y.shield.description") }
            static var returnButton: String { localized("a11y.shield.return_button") }
            static var returnHint: String { localized("a11y.shield.return_hint") }
        }
    }
}
