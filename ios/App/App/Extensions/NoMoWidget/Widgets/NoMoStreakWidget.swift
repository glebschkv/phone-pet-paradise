import SwiftUI
import WidgetKit

/**
 * NoMoStreakWidget
 *
 * Displays the user's current focus streak.
 * Shows streak count and motivational progress.
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
}

// MARK: - Widget View

struct StreakWidgetView: View {
    let entry: StreakEntry

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(WidgetColors.background)

            VStack(spacing: 8) {
                // Flame icon
                Image(systemName: entry.currentStreak > 0 ? "flame.fill" : "flame")
                    .font(.title)
                    .foregroundColor(entry.currentStreak > 0 ? .orange : WidgetColors.secondary)

                // Streak count
                Text("\(entry.currentStreak)")
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                Text(WidgetStrings.streakDays(entry.currentStreak))
                    .font(.caption)
                    .foregroundColor(WidgetColors.secondary)

                // Record badge
                if entry.isNewRecord {
                    HStack(spacing: 4) {
                        Image(systemName: "star.fill")
                            .font(.caption2)
                        Text(WidgetStrings.record)
                            .font(.caption2)
                    }
                    .foregroundColor(.yellow)
                }

                // Freezes
                if entry.streakFreezes > 0 {
                    HStack(spacing: 2) {
                        Image(systemName: "snowflake")
                            .font(.caption2)
                        Text("\(entry.streakFreezes)")
                            .font(.caption2)
                    }
                    .foregroundColor(.cyan)
                }
            }
            .padding()
        }
    }
}

// MARK: - Preview

#if DEBUG
struct StreakWidget_Previews: PreviewProvider {
    static var previews: some View {
        StreakWidgetView(entry: .placeholder)
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
#endif
