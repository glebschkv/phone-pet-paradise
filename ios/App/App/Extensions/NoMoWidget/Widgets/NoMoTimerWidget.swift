import SwiftUI
import WidgetKit

/**
 * NoMoTimerWidget - "Pet Buddy" Widget
 *
 * Shows your active pet alongside the focus timer.
 * Features rotating funny messages based on session state.
 * Screenshot-worthy design with retro pixel aesthetic.
 *
 * Accessibility Features:
 * - Full VoiceOver support
 * - Dynamic Type support
 * - High contrast support
 * - Reduced motion support
 */
struct NoMoTimerWidget: Widget {
    let kind = "NoMoTimerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TimerProvider()) { entry in
            TimerWidgetView(entry: entry)
        }
        .configurationDisplayName("Pet Buddy")
        .description("Your pet keeps you company during focus sessions")
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
        let pet = WidgetDataReader.petInfo
        return TimerEntry(
            date: Date(),
            isRunning: data.isRunning,
            timeRemaining: data.timeRemaining,
            sessionDuration: data.sessionDuration,
            sessionType: data.sessionType,
            taskLabel: data.taskLabel,
            petName: pet.activePetName,
            petEmoji: pet.activePetEmoji
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
    let petName: String?
    let petEmoji: String?

    static let placeholder = TimerEntry(
        date: Date(),
        isRunning: true,
        timeRemaining: 15 * 60,
        sessionDuration: 25 * 60,
        sessionType: "Focus",
        taskLabel: nil,
        petName: "Dewdrop Frog",
        petEmoji: "🐸"
    )

    var progress: Double {
        guard sessionDuration > 0 else { return 0 }
        return Double(sessionDuration - timeRemaining) / Double(sessionDuration)
    }

    var progressPercent: Int {
        Int(progress * 100)
    }

    var formattedTime: String {
        let minutes = timeRemaining / 60
        let seconds = timeRemaining % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    var minutes: Int { timeRemaining / 60 }
    var seconds: Int { timeRemaining % 60 }

    var isAlmostDone: Bool { isRunning && timeRemaining <= 300 }

    var funMessage: String {
        if isRunning {
            return isAlmostDone
                ? WidgetPetMessages.timerAlmostDone
                : WidgetPetMessages.timerRunning
        }
        return WidgetPetMessages.timerIdle
    }

    var displayEmoji: String {
        petEmoji ?? "🐾"
    }

    var displayName: String {
        WidgetPetMessages.petDisplayName(petName)
    }

    // MARK: - Accessibility

    var accessibilityLabel: String {
        if isRunning {
            let type = sessionType ?? "Focus"
            return "\(displayName) is helping you focus. \(type) session, \(minutes) minutes and \(seconds) seconds remaining, \(progressPercent) percent complete"
        }
        return "\(displayName) is waiting for you to start a focus session"
    }

    var accessibilityHint: String {
        isRunning ? "Shows live focus session progress" : "Tap to start a focus session"
    }
}

// MARK: - Widget View

struct TimerWidgetView: View {
    let entry: TimerEntry
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
            WidgetColors.background
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(entry.accessibilityLabel)
        .accessibilityHint(entry.accessibilityHint)
        .accessibilityAddTraits(entry.isRunning ? .updatesFrequently : [])
    }

    // MARK: - Small Layout

    private var smallLayout: some View {
        VStack(spacing: 4) {
            // Pet header
            HStack(spacing: 4) {
                Text(entry.displayEmoji)
                    .font(.system(size: 16))
                Text(entry.displayName)
                    .font(.system(.caption, design: .rounded).weight(.bold))
                    .foregroundColor(WidgetColors.secondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 2)

            if entry.isRunning {
                // Big timer display
                Text(entry.formattedTime)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)

                // Pixel-style progress bar
                PixelProgressBar(
                    progress: entry.progress,
                    fillColor: entry.isAlmostDone ? WidgetColors.warning : WidgetColors.accent,
                    height: 8
                )
                .padding(.horizontal, 4)
            } else {
                // Idle state with zzz
                Text("💤")
                    .font(.system(size: 28))

                Text("zzz...")
                    .font(.system(.title3, design: .rounded).weight(.medium))
                    .foregroundColor(WidgetColors.tertiary)
            }

            Spacer(minLength: 2)

            // Fun message
            Text(entry.funMessage)
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundColor(WidgetColors.messageText)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
        }
        .padding(12)
    }

    // MARK: - Medium Layout

    private var mediumLayout: some View {
        HStack(spacing: 12) {
            // Left: Pet + message
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text(entry.displayEmoji)
                        .font(.system(size: 24))
                    VStack(alignment: .leading, spacing: 1) {
                        Text(entry.displayName)
                            .font(.system(.subheadline, design: .rounded).weight(.bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        if let type = entry.sessionType, entry.isRunning {
                            Text(type)
                                .font(.system(.caption2, design: .rounded))
                                .foregroundColor(WidgetColors.accent)
                        }
                    }
                }

                Spacer(minLength: 4)

                Text(entry.funMessage)
                    .font(.system(.caption, design: .rounded).weight(.medium))
                    .foregroundColor(WidgetColors.messageText)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                if entry.isRunning {
                    PixelProgressBar(
                        progress: entry.progress,
                        fillColor: entry.isAlmostDone ? WidgetColors.warning : WidgetColors.accent,
                        height: 8
                    )
                }
            }

            Spacer(minLength: 0)

            // Right: Timer or idle
            VStack(spacing: 4) {
                if entry.isRunning {
                    Text(entry.formattedTime)
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .minimumScaleFactor(0.6)

                    Text("\(entry.progressPercent)%")
                        .font(.system(.caption, design: .rounded).weight(.semibold))
                        .foregroundColor(WidgetColors.accent)
                } else {
                    Text("💤")
                        .font(.system(size: 32))
                    Text("tap to start")
                        .font(.system(.caption2, design: .rounded))
                        .foregroundColor(WidgetColors.tertiary)
                }
            }
            .frame(minWidth: 90)
        }
        .padding(14)
    }
}

// MARK: - Pixel Progress Bar

struct PixelProgressBar: View {
    let progress: Double
    let fillColor: Color
    var height: CGFloat = 8

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background track
                RoundedRectangle(cornerRadius: 2)
                    .fill(WidgetColors.progressBackground)

                // Filled portion
                RoundedRectangle(cornerRadius: 2)
                    .fill(fillColor)
                    .frame(width: max(0, geometry.size.width * CGFloat(min(progress, 1.0))))

                // Top highlight for pixel emboss effect
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.white.opacity(0.15))
                    .frame(height: height / 3)
                    .frame(width: max(0, geometry.size.width * CGFloat(min(progress, 1.0))))
                    .offset(y: -height / 4)
            }
        }
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: 2))
    }
}

// MARK: - Preview

#if DEBUG
struct TimerWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            TimerWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Active - Small")

            TimerWidgetView(entry: TimerEntry(
                date: Date(), isRunning: false, timeRemaining: 0,
                sessionDuration: 0, sessionType: nil, taskLabel: nil,
                petName: "Shadow Cat", petEmoji: "🐱"
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Idle - Small")

            TimerWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Active - Medium")

            TimerWidgetView(entry: TimerEntry(
                date: Date(), isRunning: true, timeRemaining: 180,
                sessionDuration: 1500, sessionType: "Deep Work", taskLabel: nil,
                petName: "Star Wizard", petEmoji: "⭐"
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Almost Done")
        }
    }
}
#endif
