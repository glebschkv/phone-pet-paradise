import SwiftUI
import WidgetKit

/**
 * NoMoProgressWidget
 *
 * Displays daily focus progress towards goal.
 * Shows completed sessions and time focused.
 *
 * Accessibility Features:
 * - Full VoiceOver support with comprehensive labels and hints
 * - Dynamic Type support for all text
 * - Circular progress indicator with accessible value description
 * - High contrast support
 * - Semantic accessibility structure
 * - Goal completion announcements
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

    // MARK: - Accessibility

    /// Full accessibility label for the widget
    var accessibilityLabel: String {
        if isGoalReached {
            return WidgetAccessibilityStrings.progressGoalReached
        }
        return WidgetAccessibilityStrings.progressSummary(
            percent: percentComplete,
            focusMinutes: focusMinutes,
            goalMinutes: goalMinutes,
            sessions: sessionsCompleted
        )
    }

    /// Accessibility hint for the widget
    var accessibilityHint: String {
        WidgetAccessibilityStrings.hintTapToOpen
    }

    /// Accessibility value for the progress
    var accessibilityValue: String {
        AccessibilityFormatters.progress(percent: percentComplete, isComplete: isGoalReached)
    }
}

// MARK: - Widget View

struct ProgressWidgetView: View {
    let entry: ProgressEntry
    @Environment(\.colorSchemeContrast) var contrast
    @Environment(\.accessibilityReduceMotion) var reduceMotion

    var body: some View {
        ZStack {
            ContainerRelativeShape()
                .fill(WidgetColors.background)

            VStack(spacing: 10) {
                // Circular progress indicator
                circularProgressView

                // Focus time and sessions info
                focusInfoView
            }
            .padding()
        }
        // Apply comprehensive accessibility to entire widget
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(entry.accessibilityLabel)
        .accessibilityHint(entry.accessibilityHint)
        .accessibilityValue(entry.accessibilityValue)
        .accessibilityAddTraits(entry.isGoalReached ? .startsMediaSession : [])
    }

    // MARK: - Circular Progress View

    private var circularProgressView: some View {
        ZStack {
            // Background circle
            Circle()
                .stroke(progressBackgroundColor, lineWidth: 8)
                .accessibilityHidden(true)

            // Progress circle
            Circle()
                .trim(from: 0, to: entry.progress)
                .stroke(
                    progressForegroundColor,
                    style: StrokeStyle(lineWidth: 8, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .accessibilityHidden(true)

            // Center content
            VStack(spacing: 2) {
                Text(WidgetStrings.percentComplete(entry.percentComplete))
                    .font(AccessibleFonts.headline)
                    .foregroundColor(primaryTextColor)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                    .accessibilityHidden(true)

                if entry.isGoalReached {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(successColor)
                        .accessibilityHidden(true)
                }
            }
        }
        .frame(width: 70, height: 70)
        .accessibilityHidden(true)
    }

    // MARK: - Focus Info View

    private var focusInfoView: some View {
        VStack(spacing: 2) {
            // Focus time
            Text("\(entry.focusMinutes) / \(entry.goalMinutes) min")
                .font(AccessibleFonts.caption)
                .foregroundColor(secondaryTextColor)
                .accessibilityHidden(true)

            // Sessions count
            Text("\(entry.sessionsCompleted) \(WidgetStrings.sessions)")
                .font(AccessibleFonts.caption2)
                .foregroundColor(tertiaryTextColor)
                .accessibilityHidden(true)
        }
    }

    // MARK: - Accessible Colors

    private var progressBackgroundColor: Color {
        contrast == .increased ? WidgetColors.progressBackgroundHighContrast : WidgetColors.progressBackground
    }

    private var progressForegroundColor: Color {
        if entry.isGoalReached {
            return contrast == .increased ? WidgetColors.successHighContrast : WidgetColors.success
        }
        return contrast == .increased ? WidgetColors.accentHighContrast : WidgetColors.accent
    }

    private var primaryTextColor: Color {
        .white
    }

    private var secondaryTextColor: Color {
        contrast == .increased ? WidgetColors.secondaryHighContrast : WidgetColors.secondary
    }

    private var tertiaryTextColor: Color {
        contrast == .increased ? WidgetColors.tertiaryHighContrast : WidgetColors.tertiary
    }

    private var successColor: Color {
        contrast == .increased ? WidgetColors.successHighContrast : WidgetColors.success
    }
}

// MARK: - Preview

#if DEBUG
struct ProgressWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // In progress
            ProgressWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("In Progress")

            // Goal reached
            ProgressWidgetView(entry: ProgressEntry(
                date: Date(),
                focusMinutes: 120,
                goalMinutes: 120,
                sessionsCompleted: 5
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Goal Reached")

            // Just started
            ProgressWidgetView(entry: ProgressEntry(
                date: Date(),
                focusMinutes: 10,
                goalMinutes: 120,
                sessionsCompleted: 1
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Just Started")

            // Medium size
            ProgressWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium Widget")
        }
    }
}
#endif
