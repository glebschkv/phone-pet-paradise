import Foundation

/**
 * WidgetStrings
 *
 * Localized strings for the widget extension.
 * Extensions run in separate processes and need their own localization.
 */
enum WidgetStrings {

    // MARK: - Localization Helper

    private static func localized(_ key: String) -> String {
        NSLocalizedString(key, bundle: .main, comment: "")
    }

    private static func localized(_ key: String, _ args: CVarArg...) -> String {
        String(format: NSLocalizedString(key, bundle: .main, comment: ""), arguments: args)
    }

    // MARK: - Widget Titles

    static var timerTitle: String { localized("widget.timer_title") }
    static var streakTitle: String { localized("widget.streak_title") }
    static var progressTitle: String { localized("widget.progress_title") }
    static var statsTitle: String { localized("widget.stats_title") }

    // MARK: - Widget Content

    static var noSession: String { localized("widget.no_session") }
    static var tapToStart: String { localized("widget.tap_to_start") }
    static var sessions: String { localized("widget.sessions") }
    static var focused: String { localized("widget.focused") }
    static var record: String { localized("widget.record") }

    static func streakDays(_ count: Int) -> String {
        localized("widget.streak_days", count)
    }

    static func minutesRemaining(_ minutes: Int) -> String {
        localized("widget.minutes_remaining", minutes)
    }

    static func percentComplete(_ percent: Int) -> String {
        localized("widget.percent_complete", percent)
    }

    // MARK: - Stats

    static func level(_ level: Int) -> String {
        localized("stats.level", level)
    }

    static func xp(_ amount: Int) -> String {
        localized("stats.xp", amount)
    }
}
