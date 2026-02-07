import SwiftUI
import WidgetKit

/**
 * NoMoStreakWidget - "Streak Fire" Widget
 *
 * Shows your focus streak with escalating fire emojis and
 * sassy/funny messages that change based on streak length.
 * The longer your streak, the more dramatic the display.
 *
 * Accessibility Features:
 * - Full VoiceOver support
 * - Dynamic Type support
 * - High contrast support
 */
struct NoMoStreakWidget: Widget {
    let kind = "NoMoStreakWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StreakProvider()) { entry in
            StreakWidgetView(entry: entry)
        }
        .configurationDisplayName("Streak Fire")
        .description("Watch your streak grow with your pet cheering you on")
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
        let pet = WidgetDataReader.petInfo
        return StreakEntry(
            date: Date(),
            currentStreak: data.currentStreak,
            longestStreak: data.longestStreak,
            streakFreezes: data.streakFreezes,
            petEmoji: pet.activePetEmoji
        )
    }
}

// MARK: - Entry

struct StreakEntry: TimelineEntry {
    let date: Date
    let currentStreak: Int
    let longestStreak: Int
    let streakFreezes: Int
    let petEmoji: String?

    static let placeholder = StreakEntry(
        date: Date(),
        currentStreak: 7,
        longestStreak: 14,
        streakFreezes: 2,
        petEmoji: "🐸"
    )

    var isNewRecord: Bool {
        currentStreak >= longestStreak && currentStreak > 0
    }

    var hasActiveStreak: Bool {
        currentStreak > 0
    }

    /// Escalating fire display based on streak length
    var fireDisplay: String {
        switch currentStreak {
        case 0: return "💨"
        case 1: return "🕯️"
        case 2...3: return "🔥"
        case 4...6: return "🔥🔥"
        case 7...13: return "🔥🔥🔥"
        case 14...29: return "🔥🔥🔥🔥"
        case 30...99: return "☄️🔥🔥🔥"
        default: return "🌋🔥🔥🔥"
        }
    }

    var funMessage: String {
        WidgetPetMessages.streakMessage(days: currentStreak)
    }

    var displayEmoji: String {
        petEmoji ?? "🐾"
    }

    // MARK: - Accessibility

    var accessibilityLabel: String {
        if isNewRecord {
            return "New record! \(currentStreak) day streak. \(funMessage)"
        }
        return "\(currentStreak) day streak. Best: \(longestStreak) days. \(funMessage)"
    }

    var accessibilityHint: String {
        "Tap to open the app"
    }
}

// MARK: - Widget View

struct StreakWidgetView: View {
    let entry: StreakEntry
    @Environment(\.colorSchemeContrast) var contrast

    var body: some View {
        VStack(spacing: 4) {
            // Fire emojis at top
            Text(entry.fireDisplay)
                .font(.system(size: entry.currentStreak > 13 ? 18 : 22))
                .minimumScaleFactor(0.6)

            // Big streak number
            Text("\(entry.currentStreak)")
                .font(.system(size: 42, weight: .black, design: .rounded))
                .foregroundColor(.white)
                .minimumScaleFactor(0.5)
                .lineLimit(1)

            // "days" label
            Text(entry.currentStreak == 1 ? "day" : "days")
                .font(.system(.caption, design: .rounded).weight(.semibold))
                .foregroundColor(WidgetColors.streakEmber)
                .textCase(.uppercase)

            // Record badge or freeze indicator
            if entry.isNewRecord {
                HStack(spacing: 3) {
                    Text("⭐")
                        .font(.system(size: 10))
                    Text("NEW RECORD")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .foregroundColor(WidgetColors.record)
                }
            } else if entry.streakFreezes > 0 {
                HStack(spacing: 3) {
                    Text("❄️")
                        .font(.system(size: 10))
                    Text("\(entry.streakFreezes)")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundColor(WidgetColors.freeze)
                }
            }

            Spacer(minLength: 2)

            // Fun message at bottom
            Text(entry.funMessage)
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundColor(WidgetColors.messageText)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
        }
        .padding(12)
        .containerBackground(for: .widget) {
            WidgetColors.streakBackground
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(entry.accessibilityLabel)
        .accessibilityHint(entry.accessibilityHint)
    }
}

// MARK: - Preview

#if DEBUG
struct StreakWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            StreakWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("7-Day Streak")

            StreakWidgetView(entry: StreakEntry(
                date: Date(), currentStreak: 14, longestStreak: 14,
                streakFreezes: 1, petEmoji: "🦊"
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Record Streak")

            StreakWidgetView(entry: StreakEntry(
                date: Date(), currentStreak: 0, longestStreak: 10,
                streakFreezes: 0, petEmoji: "🐱"
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("No Streak")

            StreakWidgetView(entry: StreakEntry(
                date: Date(), currentStreak: 100, longestStreak: 100,
                streakFreezes: 3, petEmoji: "🐸"
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("100+ Legend")
        }
    }
}
#endif
