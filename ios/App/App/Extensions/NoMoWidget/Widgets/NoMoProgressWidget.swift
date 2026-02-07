import SwiftUI
import WidgetKit

/**
 * NoMoProgressWidget - "Daily Quest" Widget
 *
 * RPG-styled daily progress tracker. Shows focus minutes
 * as a quest with a pixel-art progress bar and fun messages.
 *
 * Accessibility Features:
 * - Full VoiceOver support
 * - Dynamic Type support
 * - High contrast support
 */
struct NoMoProgressWidget: Widget {
    let kind = "NoMoProgressWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ProgressProvider()) { entry in
            ProgressWidgetView(entry: entry)
        }
        .configurationDisplayName("Daily Quest")
        .description("Track your daily focus quest like an RPG adventure")
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
        let pet = WidgetDataReader.petInfo
        return ProgressEntry(
            date: Date(),
            focusMinutes: data.focusMinutes,
            goalMinutes: data.goalMinutes,
            sessionsCompleted: data.sessionsCompleted,
            petEmoji: pet.activePetEmoji
        )
    }
}

// MARK: - Entry

struct ProgressEntry: TimelineEntry {
    let date: Date
    let focusMinutes: Int
    let goalMinutes: Int
    let sessionsCompleted: Int
    let petEmoji: String?

    static let placeholder = ProgressEntry(
        date: Date(),
        focusMinutes: 75,
        goalMinutes: 120,
        sessionsCompleted: 3,
        petEmoji: "🐸"
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

    var funMessage: String {
        WidgetPetMessages.progressMessage(percent: percentComplete)
    }

    var questStatusIcon: String {
        if isGoalReached { return "🏆" }
        if percentComplete >= 75 { return "⚔️" }
        if percentComplete >= 50 { return "🗡️" }
        if percentComplete >= 25 { return "🛡️" }
        return "📜"
    }

    var displayEmoji: String {
        petEmoji ?? "🐾"
    }

    // MARK: - Accessibility

    var accessibilityLabel: String {
        if isGoalReached {
            return "Daily quest complete! Focused \(focusMinutes) minutes across \(sessionsCompleted) sessions"
        }
        return "Daily quest: \(percentComplete) percent complete. \(focusMinutes) of \(goalMinutes) minutes focused. \(sessionsCompleted) sessions completed"
    }

    var accessibilityHint: String {
        "Tap to open the app"
    }
}

// MARK: - Widget View

struct ProgressWidgetView: View {
    let entry: ProgressEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorSchemeContrast) var contrast

    var body: some View {
        Group {
            switch family {
            case .systemMedium:
                mediumLayout
            default:
                smallLayout
            }
        }
        .containerBackground(for: .widget) {
            WidgetColors.questBackground
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(entry.accessibilityLabel)
        .accessibilityHint(entry.accessibilityHint)
    }

    // MARK: - Small Layout

    private var smallLayout: some View {
        VStack(spacing: 4) {
            // Quest header
            HStack(spacing: 4) {
                Text(entry.questStatusIcon)
                    .font(.system(size: 14))
                Text("Daily Quest")
                    .font(.system(.caption, design: .rounded).weight(.bold))
                    .foregroundColor(WidgetColors.pixelYellow)
                    .lineLimit(1)
            }

            Spacer(minLength: 2)

            // Minutes display
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text("\(entry.focusMinutes)")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                Text("/\(entry.goalMinutes)")
                    .font(.system(.caption, design: .rounded).weight(.semibold))
                    .foregroundColor(WidgetColors.tertiary)
            }
            .minimumScaleFactor(0.6)
            .lineLimit(1)

            Text("min")
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .foregroundColor(WidgetColors.secondary)
                .textCase(.uppercase)

            // Progress bar
            PixelProgressBar(
                progress: entry.progress,
                fillColor: entry.isGoalReached ? WidgetColors.success : WidgetColors.progressFill,
                height: 10
            )
            .padding(.horizontal, 4)

            // Sessions or completion message
            if entry.isGoalReached {
                Text("🎉 COMPLETE!")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundColor(WidgetColors.pixelYellow)
            } else {
                HStack(spacing: 4) {
                    Text("✓ \(entry.sessionsCompleted)")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundColor(WidgetColors.progressFill)
                    Text("sessions")
                        .font(.system(size: 10, design: .rounded))
                        .foregroundColor(WidgetColors.tertiary)
                }
            }

            Spacer(minLength: 1)

            // Fun message
            Text(entry.funMessage)
                .font(.system(size: 9, weight: .medium, design: .rounded))
                .foregroundColor(WidgetColors.messageText)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
        }
        .padding(12)
    }

    // MARK: - Medium Layout

    private var mediumLayout: some View {
        HStack(spacing: 14) {
            // Left: Quest info
            VStack(alignment: .leading, spacing: 6) {
                // Quest header
                HStack(spacing: 6) {
                    Text(entry.questStatusIcon)
                        .font(.system(size: 18))
                    Text("Daily Quest")
                        .font(.system(.subheadline, design: .rounded).weight(.bold))
                        .foregroundColor(WidgetColors.pixelYellow)
                }

                Spacer(minLength: 4)

                // Progress bar with label
                VStack(alignment: .leading, spacing: 4) {
                    PixelProgressBar(
                        progress: entry.progress,
                        fillColor: entry.isGoalReached ? WidgetColors.success : WidgetColors.progressFill,
                        height: 12
                    )

                    HStack {
                        Text("\(entry.focusMinutes)/\(entry.goalMinutes) min")
                            .font(.system(.caption2, design: .rounded).weight(.semibold))
                            .foregroundColor(WidgetColors.secondary)
                        Spacer()
                        Text("\(entry.percentComplete)%")
                            .font(.system(.caption2, design: .rounded).weight(.bold))
                            .foregroundColor(entry.isGoalReached ? WidgetColors.success : WidgetColors.progressFill)
                    }
                }

                // Fun message
                Text(entry.funMessage)
                    .font(.system(.caption, design: .rounded).weight(.medium))
                    .foregroundColor(WidgetColors.messageText)
                    .lineLimit(2)
            }

            // Right: Big stats
            VStack(spacing: 8) {
                if entry.isGoalReached {
                    Text("🏆")
                        .font(.system(size: 32))
                    Text("QUEST\nCLEARED!")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundColor(WidgetColors.pixelYellow)
                        .multilineTextAlignment(.center)
                } else {
                    VStack(spacing: 2) {
                        Text("\(entry.sessionsCompleted)")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                        Text("sessions")
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                            .foregroundColor(WidgetColors.tertiary)
                    }

                    Text(entry.displayEmoji)
                        .font(.system(size: 20))
                }
            }
            .frame(minWidth: 70)
        }
        .padding(14)
    }
}

// MARK: - Preview

#if DEBUG
struct ProgressWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            ProgressWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("In Progress - Small")

            ProgressWidgetView(entry: ProgressEntry(
                date: Date(), focusMinutes: 120, goalMinutes: 120,
                sessionsCompleted: 5, petEmoji: "🐝"
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Completed - Small")

            ProgressWidgetView(entry: ProgressEntry(
                date: Date(), focusMinutes: 10, goalMinutes: 120,
                sessionsCompleted: 1, petEmoji: "🐰"
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Just Started")

            ProgressWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("In Progress - Medium")

            ProgressWidgetView(entry: ProgressEntry(
                date: Date(), focusMinutes: 120, goalMinutes: 120,
                sessionsCompleted: 5, petEmoji: "🦊"
            ))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Completed - Medium")
        }
    }
}
#endif
