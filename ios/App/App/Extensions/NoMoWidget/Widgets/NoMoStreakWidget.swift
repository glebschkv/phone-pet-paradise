import SwiftUI
import WidgetKit

/**
 * NoMoStreakWidget
 *
 * Displays the user's current focus streak.
 * Shows streak count and motivational progress.
 *
 * Accessibility Features:
 * - Full VoiceOver support with comprehensive labels and hints
 * - Dynamic Type support for all text
 * - Color-independent status indicators (not relying on color alone)
 * - High contrast support
 * - Semantic accessibility structure
 * - Localized accessibility descriptions
 */
struct NoMoStreakWidget: Widget {
    let kind = "NoMoStreakWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StreakProvider()) { entry in
            StreakWidgetView(entry: entry)
        }
        .configurationDisplayName(WidgetStrings.streakTitle)
        .description(NSLocalizedString("widget.streak_description", value: "Track your daily focus streak", comment: ""))
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - Timeline Provider

struct StreakProvider: TimelineProvider {
    func placeholder(in context: Context) -> StreakEntry {
        StreakEntry.placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (StreakEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StreakEntry>) -> Void) {
        let entry = loadEntry()
        let refreshDate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
        completion(timeline)
    }

    private func loadEntry() -> StreakEntry {
        let data = WidgetDataReader.streakData
        return StreakEntry(
            date: Date(),
            currentStreak: data.currentStreak,
            longestStreak: data.longestStreak,
            streakFreezes: data.streakFreezes
        )
    }
}

// MARK: - Entry

struct StreakEntry: TimelineEntry {
    let date: Date
    let currentStreak: Int
    let longestStreak: Int
    let streakFreezes: Int

    static let placeholder = StreakEntry(
        date: Date(),
        currentStreak: 7,
        longestStreak: 14,
        streakFreezes: 2
    )

    var isNewRecord: Bool {
        currentStreak >= longestStreak && currentStreak > 0
    }

    var hasActiveStreak: Bool {
        currentStreak > 0
    }

    // MARK: - Accessibility

    /// Full accessibility label for the widget
    var accessibilityLabel: String {
        WidgetAccessibilityStrings.streakSummary(
            days: currentStreak,
            isRecord: isNewRecord,
            freezes: streakFreezes
        )
    }

    /// Accessibility hint for the widget
    var accessibilityHint: String {
        WidgetAccessibilityStrings.hintTapToOpen
    }

    /// Accessibility value showing current streak
    var accessibilityValue: String {
        AccessibilityFormatters.streak(days: currentStreak, isRecord: isNewRecord)
    }
}

// MARK: - Widget View

struct StreakWidgetView: View {
    let entry: StreakEntry
    @Environment(\.colorSchemeContrast) var contrast

    var body: some View {
        VStack(spacing: 8) {
            // Flame icon with accessibility
            flameIcon

            // Streak count
            streakCountView

            // Days label
            daysLabel

            // Record badge (if applicable)
            if entry.isNewRecord {
                recordBadge
            }

            // Freezes indicator
            if entry.streakFreezes > 0 {
                freezesIndicator
            }
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

    private var flameIcon: some View {
        Image(systemName: entry.hasActiveStreak ? "flame.fill" : "flame")
            .font(.title)
            .foregroundColor(flameColor)
            .accessibilityHidden(true)
    }

    private var streakCountView: some View {
        Text("\(entry.currentStreak)")
            .font(AccessibleFonts.statsNumber)
            .foregroundColor(primaryTextColor)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
            .accessibilityHidden(true)
    }

    private var daysLabel: some View {
        Text(WidgetStrings.streakDays(entry.currentStreak))
            .font(AccessibleFonts.caption)
            .foregroundColor(secondaryTextColor)
            .accessibilityHidden(true)
    }

    private var recordBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "star.fill")
                .font(.caption2)
            Text(WidgetStrings.record)
                .font(AccessibleFonts.caption2)
        }
        .foregroundColor(recordColor)
        .accessibilityHidden(true)
    }

    private var freezesIndicator: some View {
        HStack(spacing: 2) {
            Image(systemName: "snowflake")
                .font(.caption2)
            Text("\(entry.streakFreezes)")
                .font(AccessibleFonts.caption2)
        }
        .foregroundColor(freezeColor)
        .accessibilityHidden(true)
    }

    // MARK: - Accessible Colors

    private var flameColor: Color {
        if entry.hasActiveStreak {
            return contrast == .increased ? WidgetColors.warningHighContrast : .orange
        }
        return contrast == .increased ? WidgetColors.secondaryHighContrast : WidgetColors.secondary
    }

    private var primaryTextColor: Color {
        .white
    }

    private var secondaryTextColor: Color {
        contrast == .increased ? WidgetColors.secondaryHighContrast : WidgetColors.secondary
    }

    private var recordColor: Color {
        contrast == .increased ? WidgetColors.recordHighContrast : .yellow
    }

    private var freezeColor: Color {
        contrast == .increased ? WidgetColors.freezeHighContrast : .cyan
    }
}

// MARK: - Preview

#if DEBUG
struct StreakWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Active streak
            StreakWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Active Streak")

            // Record streak
            StreakWidgetView(entry: StreakEntry(
                date: Date(),
                currentStreak: 14,
                longestStreak: 14,
                streakFreezes: 1
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Record Streak")

            // No streak
            StreakWidgetView(entry: StreakEntry(
                date: Date(),
                currentStreak: 0,
                longestStreak: 10,
                streakFreezes: 0
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("No Streak")
        }
    }
}
#endif
