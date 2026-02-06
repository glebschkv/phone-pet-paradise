import SwiftUI
import WidgetKit

/**
 * NoMoStatsWidget
 *
 * Displays overall focus statistics.
 * Shows level, XP, total focus time, and sessions.
 *
 * Accessibility Features:
 * - Full VoiceOver support with comprehensive labels and hints
 * - Dynamic Type support for all text
 * - Semantic grouping of related statistics
 * - High contrast support
 * - Proper accessibility traits for statistics
 * - Localized number and time formatting
 */
struct NoMoStatsWidget: Widget {
    let kind = "NoMoStatsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StatsProvider()) { entry in
            StatsWidgetView(entry: entry)
        }
        .configurationDisplayName(WidgetStrings.statsTitle)
        .description(NSLocalizedString("widget.stats_description", value: "View your overall focus statistics", comment: ""))
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Timeline Provider

struct StatsProvider: TimelineProvider {
    func placeholder(in context: Context) -> StatsEntry {
        StatsEntry.placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (StatsEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StatsEntry>) -> Void) {
        let entry = loadEntry()
        let refreshDate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
        completion(timeline)
    }

    private func loadEntry() -> StatsEntry {
        let data = WidgetDataReader.stats
        return StatsEntry(
            date: Date(),
            level: data.level,
            totalXP: data.totalXP,
            totalFocusTime: data.totalFocusTime,
            totalSessions: data.totalSessions
        )
    }
}

// MARK: - Entry

struct StatsEntry: TimelineEntry {
    let date: Date
    let level: Int
    let totalXP: Int
    let totalFocusTime: Int
    let totalSessions: Int

    static let placeholder = StatsEntry(
        date: Date(),
        level: 12,
        totalXP: 2450,
        totalFocusTime: 3600,
        totalSessions: 48
    )

    var formattedFocusTime: String {
        let hours = totalFocusTime / 60
        let minutes = totalFocusTime % 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }

    var focusTimeHours: Int {
        totalFocusTime / 60
    }

    var focusTimeMinutes: Int {
        totalFocusTime % 60
    }

    // MARK: - Accessibility

    /// Full accessibility label for the widget
    var accessibilityLabel: String {
        let focusTimeDescription = AccessibilityFormatters.totalFocusTime(
            hours: focusTimeHours,
            minutes: focusTimeMinutes
        )
        return WidgetAccessibilityStrings.statsSummary(
            level: level,
            xp: totalXP,
            focusTime: focusTimeDescription,
            sessions: totalSessions
        )
    }

    /// Accessibility hint for the widget
    var accessibilityHint: String {
        WidgetAccessibilityStrings.hintTapToOpen
    }

    /// Accessibility value for XP
    var accessibilityValue: String {
        AccessibilityFormatters.xp(amount: totalXP)
    }
}

// MARK: - Widget View

struct StatsWidgetView: View {
    let entry: StatsEntry
    @Environment(\.colorSchemeContrast) var contrast

    var body: some View {
        VStack(spacing: 12) {
            // Level badge
            levelBadge

            // XP display
            xpDisplay

            // Stats grid
            statsGrid
        }
        .padding()
        .containerBackground(for: .widget) {
            WidgetColors.background
        }
        // Apply comprehensive accessibility to entire widget
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(entry.accessibilityLabel)
        .accessibilityHint(entry.accessibilityHint)
        .accessibilityValue(entry.accessibilityValue)
    }

    // MARK: - Subviews

    private var levelBadge: some View {
        HStack {
            Image(systemName: "star.circle.fill")
                .foregroundColor(levelColor)
                .accessibilityHidden(true)
            Text(WidgetStrings.level(entry.level))
                .font(AccessibleFonts.headline)
                .foregroundColor(primaryTextColor)
                .accessibilityHidden(true)
        }
    }

    private var xpDisplay: some View {
        HStack(spacing: 4) {
            Text(WidgetStrings.xp(entry.totalXP))
                .font(AccessibleFonts.title)
                .foregroundColor(accentColor)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
                .accessibilityHidden(true)
        }
    }

    private var statsGrid: some View {
        HStack(spacing: 16) {
            AccessibleStatItem(
                icon: "clock.fill",
                value: entry.formattedFocusTime,
                label: WidgetStrings.focused,
                iconColor: accentColor,
                valueColor: primaryTextColor,
                labelColor: tertiaryTextColor
            )

            AccessibleStatItem(
                icon: "checkmark.circle.fill",
                value: "\(entry.totalSessions)",
                label: WidgetStrings.sessions,
                iconColor: accentColor,
                valueColor: primaryTextColor,
                labelColor: tertiaryTextColor
            )
        }
    }

    // MARK: - Accessible Colors

    private var accentColor: Color {
        contrast == .increased ? WidgetColors.accentHighContrast : WidgetColors.accent
    }

    private var primaryTextColor: Color {
        .white
    }

    private var tertiaryTextColor: Color {
        contrast == .increased ? WidgetColors.tertiaryHighContrast : WidgetColors.tertiary
    }

    private var levelColor: Color {
        contrast == .increased ? WidgetColors.levelHighContrast : .yellow
    }
}

// MARK: - Accessible Stat Item

/// Accessible statistic item with proper VoiceOver support
struct AccessibleStatItem: View {
    let icon: String
    let value: String
    let label: String
    let iconColor: Color
    let valueColor: Color
    let labelColor: Color

    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(iconColor)
                .accessibilityHidden(true)

            Text(value)
                .font(AccessibleFonts.subheadline)
                .foregroundColor(valueColor)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
                .accessibilityHidden(true)

            Text(label)
                .font(AccessibleFonts.caption2)
                .foregroundColor(labelColor)
                .accessibilityHidden(true)
        }
        .accessibilityHidden(true)
    }
}

// MARK: - Preview

#if DEBUG
struct StatsWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Default stats
            StatsWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Default Stats")

            // High level
            StatsWidgetView(entry: StatsEntry(
                date: Date(),
                level: 50,
                totalXP: 125000,
                totalFocusTime: 12000,
                totalSessions: 500
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("High Level")

            // New user
            StatsWidgetView(entry: StatsEntry(
                date: Date(),
                level: 1,
                totalXP: 50,
                totalFocusTime: 25,
                totalSessions: 1
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("New User")

            // Medium size
            StatsWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium Widget")
        }
    }
}
#endif
