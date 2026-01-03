import SwiftUI
import WidgetKit

/**
 * NoMoTimerWidget
 *
 * Displays the current focus timer status.
 * Shows remaining time and session type.
 */
struct NoMoTimerWidget: Widget {
    let kind = AppConfig.Widget.timerWidgetKind

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TimerProvider()) { entry in
            TimerWidgetView(entry: entry)
        }
        .configurationDisplayName(Strings.Widget.timerTitle)
        .description("Track your focus session progress")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Timeline Provider

struct TimerProvider: TimelineProvider {
    func placeholder(in context: Context) -> TimerEntry {
        TimerEntry.placeholder
    }

    func getSnapshot(in context: Context, completion: @escaping (TimerEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TimerEntry>) -> Void) {
        let entry = loadEntry()
        let refreshDate = Calendar.current.date(byAdding: .minute, value: 1, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
        completion(timeline)
    }

    private func loadEntry() -> TimerEntry {
        let data = WidgetDataReader.timerData
        return TimerEntry(
            date: Date(),
            isRunning: data.isRunning,
            timeRemaining: data.timeRemaining,
            sessionDuration: data.sessionDuration,
            sessionType: data.sessionType,
            taskLabel: data.taskLabel
        )
    }
}

// MARK: - Entry

struct TimerEntry: TimelineEntry {
    let date: Date
    let isRunning: Bool
    let timeRemaining: Int
    let sessionDuration: Int
    let sessionType: String?
    let taskLabel: String?

    static let placeholder = TimerEntry(
        date: Date(),
        isRunning: true,
        timeRemaining: 15 * 60,
        sessionDuration: 25 * 60,
        sessionType: "Focus",
        taskLabel: nil
    )

    var progress: Double {
        guard sessionDuration > 0 else { return 0 }
        return Double(sessionDuration - timeRemaining) / Double(sessionDuration)
    }

    var formattedTime: String {
        let minutes = timeRemaining / 60
        let seconds = timeRemaining % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

// MARK: - Widget View

struct TimerWidgetView: View {
    let entry: TimerEntry

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(WidgetColors.background)

            VStack(spacing: 8) {
                if entry.isRunning {
                    // Active session
                    Image(systemName: "timer")
                        .font(.title2)
                        .foregroundColor(WidgetColors.accent)

                    Text(entry.formattedTime)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    if let sessionType = entry.sessionType {
                        Text(sessionType)
                            .font(.caption)
                            .foregroundColor(WidgetColors.secondary)
                    }

                    // Progress bar
                    ProgressView(value: entry.progress)
                        .progressViewStyle(LinearProgressViewStyle(tint: WidgetColors.accent))
                        .padding(.horizontal)
                } else {
                    // No active session
                    Image(systemName: "moon.stars.fill")
                        .font(.largeTitle)
                        .foregroundColor(WidgetColors.accent)

                    Text(Strings.Widget.noSession)
                        .font(.subheadline)
                        .foregroundColor(WidgetColors.secondary)

                    Text("Tap to start")
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
struct TimerWidget_Previews: PreviewProvider {
    static var previews: some View {
        TimerWidgetView(entry: .placeholder)
            .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
#endif
