import SwiftUI
import WidgetKit

/**
 * NoMoTimerWidget
 *
 * Displays the current focus timer status.
 * Shows remaining time and session type.
 *
 * Accessibility Features:
 * - Full VoiceOver support with comprehensive labels and hints
 * - Dynamic Type support for all text
 * - Reduced motion support
 * - High contrast support
 * - Semantic accessibility structure
 * - Updates frequently trait for live timer
 */
struct NoMoTimerWidget: Widget {
    let kind = "NoMoTimerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TimerProvider()) { entry in
            TimerWidgetView(entry: entry)
        }
        .configurationDisplayName(WidgetStrings.timerTitle)
        .description(NSLocalizedString("widget.timer_description", value: "Track your focus session progress", comment: ""))
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

    var progressPercent: Int {
        Int(progress * 100)
    }

    var formattedTime: String {
        let minutes = timeRemaining / 60
        let seconds = timeRemaining % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    var minutes: Int {
        timeRemaining / 60
    }

    var seconds: Int {
        timeRemaining % 60
    }

    // MARK: - Accessibility

    /// Full accessibility label for the widget
    var accessibilityLabel: String {
        if isRunning {
            let type = sessionType ?? WidgetAccessibilityStrings.sessionTypeFocus
            let timeDescription = AccessibilityFormatters.timeRemaining(minutes: minutes, seconds: seconds)
            return String(
                format: WidgetAccessibilityStrings.timerSummaryActive,
                type,
                timeDescription,
                progressPercent
            )
        }
        return WidgetAccessibilityStrings.timerSummaryInactive
    }

    /// Accessibility hint for the widget
    var accessibilityHint: String {
        if isRunning {
            return WidgetAccessibilityStrings.hintLiveProgress
        }
        return WidgetAccessibilityStrings.hintTapToStart
    }

    /// Accessibility value for the timer
    var accessibilityValue: String {
        if isRunning {
            return AccessibilityFormatters.timeRemaining(minutes: minutes, seconds: seconds)
        }
        return ""
    }
}

// MARK: - Widget View

struct TimerWidgetView: View {
    let entry: TimerEntry
    @Environment(\.colorSchemeContrast) var contrast
    @Environment(\.accessibilityReduceMotion) var reduceMotion

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(WidgetColors.background)

            VStack(spacing: 8) {
                if entry.isRunning {
                    activeSessionView
                } else {
                    inactiveSessionView
                }
            }
            .padding()
        }
        // Apply comprehensive accessibility to entire widget
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(entry.accessibilityLabel)
        .accessibilityHint(entry.accessibilityHint)
        .accessibilityValue(entry.accessibilityValue)
        .accessibilityAddTraits(entry.isRunning ? .updatesFrequently : [])
    }

    // MARK: - Active Session View

    private var activeSessionView: some View {
        VStack(spacing: 8) {
            // Timer icon
            Image(systemName: "timer")
                .font(.title2)
                .foregroundColor(accessibleAccentColor)
                .accessibilityHidden(true)

            // Time display
            Text(entry.formattedTime)
                .font(AccessibleFonts.timerDisplay)
                .foregroundColor(accessiblePrimaryTextColor)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
                .accessibilityHidden(true)

            // Session type
            if let sessionType = entry.sessionType {
                Text(sessionType)
                    .font(AccessibleFonts.caption)
                    .foregroundColor(accessibleSecondaryTextColor)
                    .accessibilityHidden(true)
            }

            // Progress bar
            ProgressView(value: entry.progress)
                .progressViewStyle(LinearProgressViewStyle(tint: accessibleAccentColor))
                .padding(.horizontal)
                .accessibilityHidden(true)
        }
    }

    // MARK: - Inactive Session View

    private var inactiveSessionView: some View {
        VStack(spacing: 8) {
            // Moon icon
            Image(systemName: "moon.stars.fill")
                .font(.largeTitle)
                .foregroundColor(accessibleAccentColor)
                .accessibilityHidden(true)

            // No session message
            Text(WidgetStrings.noSession)
                .font(AccessibleFonts.subheadline)
                .foregroundColor(accessibleSecondaryTextColor)
                .accessibilityHidden(true)

            // Tap to start instruction
            Text(WidgetStrings.tapToStart)
                .font(AccessibleFonts.caption2)
                .foregroundColor(accessibleTertiaryTextColor)
                .accessibilityHidden(true)
        }
    }

    // MARK: - Accessible Colors

    private var accessibleAccentColor: Color {
        contrast == .increased ? WidgetColors.accentHighContrast : WidgetColors.accent
    }

    private var accessiblePrimaryTextColor: Color {
        contrast == .increased ? .white : .white
    }

    private var accessibleSecondaryTextColor: Color {
        contrast == .increased ? WidgetColors.secondaryHighContrast : WidgetColors.secondary
    }

    private var accessibleTertiaryTextColor: Color {
        contrast == .increased ? WidgetColors.tertiaryHighContrast : WidgetColors.tertiary
    }
}

// MARK: - Preview

#if DEBUG
struct TimerWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Active session
            TimerWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Active Session")

            // Inactive session
            TimerWidgetView(entry: TimerEntry(
                date: Date(),
                isRunning: false,
                timeRemaining: 0,
                sessionDuration: 0,
                sessionType: nil,
                taskLabel: nil
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("No Session")

            // Medium size
            TimerWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium Widget")
        }
    }
}
#endif
