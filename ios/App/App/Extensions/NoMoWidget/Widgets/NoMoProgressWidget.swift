import SwiftUI
import WidgetKit

/**
 * NoMoProgressWidget
 *
 * Displays daily focus progress towards goal.
 * Shows completed sessions and time focused.
 */
struct NoMoProgressWidget: Widget {
    let kind = "NoMoProgressWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ProgressProvider()) { entry in
            ProgressWidgetView(entry: entry)
        }
        .configurationDisplayName(WidgetStrings.progressTitle)
        .description(NSLocalizedString("widget.progress_description", value: "Track your daily focus progress", comment: ""))
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Timeline Provider

struct ProgressProvider: TimelineProvider {
    func placeholder(in context: Context) -> ProgressEntry {
        ProgressEntry.placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (ProgressEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ProgressEntry>) -> Void) {
        let entry = loadEntry()
        let refreshDate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
        completion(timeline)
    }

    private func loadEntry() -> ProgressEntry {
        let data = WidgetDataReader.dailyProgress
        return ProgressEntry(
            date: Date(),
            focusMinutes: data.focusMinutes,
            goalMinutes: data.goalMinutes,
            sessionsCompleted: data.sessionsCompleted
        )
    }
}

// MARK: - Entry

struct ProgressEntry: TimelineEntry {
    let date: Date
    let focusMinutes: Int
    let goalMinutes: Int
    let sessionsCompleted: Int

    static let placeholder = ProgressEntry(
        date: Date(),
        focusMinutes: 75,
        goalMinutes: 120,
        sessionsCompleted: 3
    )

    var progress: Double {
        guard goalMinutes > 0 else { return 0 }
        return min(Double(focusMinutes) / Double(goalMinutes), 1.0)
    }

    var percentComplete: Int {
        Int(progress * 100)
    }

    var isGoalReached: Bool {
        focusMinutes >= goalMinutes
    }
}

// MARK: - Widget View

struct ProgressWidgetView: View {
    let entry: ProgressEntry

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(WidgetColors.background)

            VStack(spacing: 10) {
                // Circular progress
                ZStack {
                    Circle()
                        .stroke(WidgetColors.progressBackground, lineWidth: 8)

                    Circle()
                        .trim(from: 0, to: entry.progress)
                        .stroke(
                            entry.isGoalReached ? Color.green : WidgetColors.accent,
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))

                    VStack(spacing: 2) {
                        Text(WidgetStrings.percentComplete(entry.percentComplete))
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundColor(.white)

                        if entry.isGoalReached {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                    }
                }
                .frame(width: 70, height: 70)

                // Focus time
                VStack(spacing: 2) {
                    Text("\(entry.focusMinutes) / \(entry.goalMinutes) min")
                        .font(.caption)
                        .foregroundColor(WidgetColors.secondary)

                    Text("\(entry.sessionsCompleted) \(WidgetStrings.sessions)")
                        .font(.caption2)
                        .foregroundColor(WidgetColors.tertiary)
                }
            }
            .padding()
        }
    }
}

// MARK: - Preview

#if DEBUG
struct ProgressWidget_Previews: PreviewProvider {
    static var previews: some View {
        ProgressWidgetView(entry: .placeholder)
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
#endif
