import Foundation

/**
 * WidgetAccessibilityStrings
 *
 * Localized accessibility strings for VoiceOver and other assistive technologies.
 * These strings provide comprehensive descriptions for all widget UI elements.
 *
 * All strings follow Apple's accessibility best practices:
 * - Concise but descriptive labels
 * - Action-oriented hints
 * - Contextual value descriptions
 * - Proper pluralization
 */
enum WidgetAccessibilityStrings {

    // MARK: - Localization Helper

    private static func localized(_ key: String) -> String {
        NSLocalizedString(key, bundle: .main, comment: "")
    }

    private static func localized(_ key: String, _ args: CVarArg...) -> String {
        String(format: NSLocalizedString(key, bundle: .main, comment: ""), arguments: args)
    }

    // MARK: - Icon Descriptions

    static var iconTimer: String { localized("a11y.icon.timer") }
    static var iconMoon: String { localized("a11y.icon.moon") }
    static var iconFlameActive: String { localized("a11y.icon.flame_active") }
    static var iconFlameInactive: String { localized("a11y.icon.flame_inactive") }
    static var iconStar: String { localized("a11y.icon.star") }
    static var iconSnowflake: String { localized("a11y.icon.snowflake") }
    static var iconCheckmark: String { localized("a11y.icon.checkmark") }
    static var iconClock: String { localized("a11y.icon.clock") }
    static var iconLevel: String { localized("a11y.icon.level") }

    // MARK: - Widget Labels

    static var widgetTimer: String { localized("a11y.widget.timer") }
    static var widgetStreak: String { localized("a11y.widget.streak") }
    static var widgetProgress: String { localized("a11y.widget.progress") }
    static var widgetStats: String { localized("a11y.widget.stats") }

    // MARK: - Hints

    static var hintTapToOpen: String { localized("a11y.hint.tap_to_open") }
    static var hintTapToStart: String { localized("a11y.hint.tap_to_start") }
    static var hintLiveProgress: String { localized("a11y.hint.live_progress") }

    // MARK: - Time Formatting

    static func timeRemainingMinutesSeconds(_ minutes: Int, _ seconds: Int) -> String {
        localized("a11y.time.remaining_minutes_seconds", minutes, seconds)
    }
    static var timeRemainingMinutesSeconds: String { localized("a11y.time.remaining_minutes_seconds") }
    static var timeRemainingMinutes: String { localized("a11y.time.remaining_minutes") }
    static var timeRemainingSeconds: String { localized("a11y.time.remaining_seconds") }

    // MARK: - Progress

    static var progressComplete: String { localized("a11y.progress.complete") }
    static var progressPercent: String { localized("a11y.progress.percent") }

    // MARK: - Streak

    static var streakRecord: String { localized("a11y.streak.record") }
    static var streakNone: String { localized("a11y.streak.none") }
    static var streakOneDay: String { localized("a11y.streak.one_day") }
    static var streakDays: String { localized("a11y.streak.days") }
    static var freezeOne: String { localized("a11y.freeze.one") }
    static var freezeMultiple: String { localized("a11y.freeze.multiple") }

    // MARK: - Focus Time

    static var focusTimeProgress: String { localized("a11y.focus.time_progress") }
    static var sessionsOne: String { localized("a11y.sessions.one") }
    static var sessionsMultiple: String { localized("a11y.sessions.multiple") }

    // MARK: - Total Time

    static var totalTimeHoursMinutes: String { localized("a11y.total.hours_minutes") }
    static var totalTimeHours: String { localized("a11y.total.hours") }
    static var totalTimeMinutes: String { localized("a11y.total.minutes") }

    // MARK: - Stats

    static var xpAmount: String { localized("a11y.stats.xp") }
    static var levelNumber: String { localized("a11y.stats.level") }

    // MARK: - Timer State

    static var timerRunning: String { localized("a11y.timer.running") }
    static var timerIdle: String { localized("a11y.timer.idle") }
    static var sessionTypeFocus: String { localized("a11y.session.focus") }

    // MARK: - Timer Widget Summary

    static func timerSummaryActive(sessionType: String, timeRemaining: String, progress: Int) -> String {
        localized("a11y.timer.summary_active", sessionType, timeRemaining, progress)
    }
    static var timerSummaryActive: String { localized("a11y.timer.summary_active") }
    static var timerSummaryInactive: String { localized("a11y.timer.summary_inactive") }

    // MARK: - Streak Widget Summary

    static func streakSummary(days: Int, isRecord: Bool, freezes: Int) -> String {
        if isRecord && freezes > 0 {
            return localized("a11y.streak.summary_record_freezes", days, freezes)
        } else if isRecord {
            return localized("a11y.streak.summary_record", days)
        } else if freezes > 0 {
            return localized("a11y.streak.summary_freezes", days, freezes)
        }
        return localized("a11y.streak.summary", days)
    }
    static var streakSummary: String { localized("a11y.streak.summary") }
    static var streakSummaryRecord: String { localized("a11y.streak.summary_record") }
    static var streakSummaryFreezes: String { localized("a11y.streak.summary_freezes") }
    static var streakSummaryRecordFreezes: String { localized("a11y.streak.summary_record_freezes") }

    // MARK: - Progress Widget Summary

    static func progressSummary(percent: Int, focusMinutes: Int, goalMinutes: Int, sessions: Int) -> String {
        localized("a11y.progress.summary", percent, focusMinutes, goalMinutes, sessions)
    }
    static var progressSummary: String { localized("a11y.progress.summary") }
    static var progressGoalReached: String { localized("a11y.progress.goal_reached") }

    // MARK: - Stats Widget Summary

    static func statsSummary(level: Int, xp: Int, focusTime: String, sessions: Int) -> String {
        localized("a11y.stats.summary", level, xp, focusTime, sessions)
    }
    static var statsSummary: String { localized("a11y.stats.summary") }

    // MARK: - Shield

    static var shieldTitle: String { localized("a11y.shield.title") }
    static var shieldDescription: String { localized("a11y.shield.description") }
    static var shieldReturnButton: String { localized("a11y.shield.return_button") }
    static var shieldReturnHint: String { localized("a11y.shield.return_hint") }
}
