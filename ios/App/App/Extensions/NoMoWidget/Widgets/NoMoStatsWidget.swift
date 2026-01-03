import SwiftUI
import WidgetKit

/**
 * NoMoStatsWidget
 *
 * Displays overall focus statistics.
 * Shows level, XP, total focus time, and sessions.
 */
struct NoMoStatsWidget: Widget {
    let kind = AppConfig.Widget.statsWidgetKind

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StatsProvider()) { entry in
            StatsWidgetView(entry: entry)
        }
        .configurationDisplayName(Strings.Widget.statsTitle)
        .description("View your overall focus statistics")
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
}

// MARK: - Widget View

struct StatsWidgetView: View {
    let entry: StatsEntry

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(WidgetColors.background)

            VStack(spacing: 12) {
                // Level badge
                HStack {
                    Image(systemName: "star.circle.fill")
                        .foregroundColor(.yellow)
                    Text("Level \(entry.level)")
                        .font(.headline)
                        .foregroundColor(.white)
                }

                // XP
                HStack(spacing: 4) {
                    Text("\(entry.totalXP)")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(WidgetColors.accent)
                    Text("XP")
                        .font(.caption)
                        .foregroundColor(WidgetColors.secondary)
                }

                // Stats grid
                HStack(spacing: 16) {
                    StatItem(
                        icon: "clock.fill",
                        value: entry.formattedFocusTime,
                        label: "focused"
                    )

                    StatItem(
                        icon: "checkmark.circle.fill",
                        value: "\(entry.totalSessions)",
                        label: "sessions"
                    )
                }
            }
            .padding()
        }
    }
}

struct StatItem: View {
    let icon: String
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(WidgetColors.accent)

            Text(value)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundColor(.white)

            Text(label)
                .font(.caption2)
                .foregroundColor(WidgetColors.tertiary)
        }
    }
}

// MARK: - Preview

#if DEBUG
struct StatsWidget_Previews: PreviewProvider {
    static var previews: some View {
        StatsWidgetView(entry: .placeholder)
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
#endif
