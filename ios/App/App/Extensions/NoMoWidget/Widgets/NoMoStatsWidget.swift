import SwiftUI
import WidgetKit

/**
 * NoMoStatsWidget - "Pet Stats Card" Widget
 *
 * Trading card-style layout showing your level, XP, and
 * focus stats with your pet's emoji and funny rank titles.
 *
 * Accessibility Features:
 * - Full VoiceOver support
 * - Dynamic Type support
 * - High contrast support
 */
struct NoMoStatsWidget: Widget {
    let kind = "NoMoStatsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StatsProvider()) { entry in
            StatsWidgetView(entry: entry)
        }
        .configurationDisplayName("Pet Stats Card")
        .description("Your focus stats as an RPG character card")
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
        let pet = WidgetDataReader.petInfo
        return StatsEntry(
            date: Date(),
            level: data.level,
            totalXP: data.totalXP,
            totalFocusTime: data.totalFocusTime,
            totalSessions: data.totalSessions,
            petName: pet.activePetName,
            petEmoji: pet.activePetEmoji,
            totalPets: pet.totalPetsCollected
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
    let petName: String?
    let petEmoji: String?
    let totalPets: Int

    static let placeholder = StatsEntry(
        date: Date(),
        level: 12,
        totalXP: 2450,
        totalFocusTime: 3600,
        totalSessions: 48,
        petName: "Dewdrop Frog",
        petEmoji: "🐸",
        totalPets: 8
    )

    var formattedFocusTime: String {
        let hours = totalFocusTime / 60
        let minutes = totalFocusTime % 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        }
        return "\(minutes)m"
    }

    var formattedXP: String {
        if totalXP >= 1000 {
            let k = Double(totalXP) / 1000.0
            return String(format: "%.1fk", k)
        }
        return "\(totalXP)"
    }

    var displayEmoji: String {
        petEmoji ?? "🐾"
    }

    var displayName: String {
        WidgetPetMessages.petDisplayName(petName)
    }

    var funMessage: String {
        WidgetPetMessages.statsMessage(level: level)
    }

    /// RPG-style rank title based on level
    var rankTitle: String {
        switch level {
        case 1...3: return "Novice Tamer"
        case 4...7: return "Focus Apprentice"
        case 8...12: return "Pet Whisperer"
        case 13...18: return "Focus Knight"
        case 19...25: return "Zen Master"
        case 26...35: return "Focus Sage"
        case 36...45: return "Grand Tamer"
        default: return "Legendary Hero"
        }
    }

    // MARK: - Accessibility

    var accessibilityLabel: String {
        let focusHours = totalFocusTime / 60
        let focusMinutes = totalFocusTime % 60
        return "Level \(level) \(rankTitle). \(formattedXP) XP. \(focusHours) hours \(focusMinutes) minutes focused across \(totalSessions) sessions. \(totalPets) pets collected"
    }

    var accessibilityHint: String {
        "Tap to open the app"
    }
}

// MARK: - Widget View

struct StatsWidgetView: View {
    let entry: StatsEntry
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
            WidgetColors.statsBackground
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(entry.accessibilityLabel)
        .accessibilityHint(entry.accessibilityHint)
    }

    // MARK: - Small Layout

    private var smallLayout: some View {
        VStack(spacing: 4) {
            // Level badge
            HStack(spacing: 4) {
                Text("⭐")
                    .font(.system(size: 12))
                Text("LV.\(entry.level)")
                    .font(.system(.caption, design: .rounded).weight(.black))
                    .foregroundColor(WidgetColors.level)
            }

            // Pet emoji + name
            Text(entry.displayEmoji)
                .font(.system(size: 24))

            Text(entry.displayName)
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            // Rank title
            Text(entry.rankTitle)
                .font(.system(size: 9, weight: .semibold, design: .rounded))
                .foregroundColor(WidgetColors.accent)
                .textCase(.uppercase)

            Spacer(minLength: 2)

            // XP display
            Text("\(entry.formattedXP) XP")
                .font(.system(.subheadline, design: .rounded).weight(.bold))
                .foregroundColor(WidgetColors.xpGlow)

            // Stats row
            HStack(spacing: 8) {
                miniStat(icon: "🕐", value: entry.formattedFocusTime)
                miniStat(icon: "✅", value: "\(entry.totalSessions)")
            }

            // Fun message
            Text(entry.funMessage)
                .font(.system(size: 9, weight: .medium, design: .rounded))
                .foregroundColor(WidgetColors.messageText)
                .multilineTextAlignment(.center)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .padding(10)
    }

    // MARK: - Medium Layout (Trading Card)

    private var mediumLayout: some View {
        HStack(spacing: 12) {
            // Left: Character card
            VStack(spacing: 4) {
                // Pet avatar area
                VStack(spacing: 2) {
                    Text(entry.displayEmoji)
                        .font(.system(size: 36))

                    Text(entry.displayName)
                        .font(.system(.caption, design: .rounded).weight(.bold))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    Text(entry.rankTitle)
                        .font(.system(size: 9, weight: .semibold, design: .rounded))
                        .foregroundColor(WidgetColors.accent)
                        .textCase(.uppercase)
                }

                Spacer(minLength: 2)

                // Fun message
                Text(entry.funMessage)
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundColor(WidgetColors.messageText)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }

            // Divider line
            Rectangle()
                .fill(WidgetColors.pixelBorder)
                .frame(width: 1)
                .padding(.vertical, 4)

            // Right: Stats sheet
            VStack(alignment: .leading, spacing: 6) {
                // Level + XP header
                HStack {
                    HStack(spacing: 3) {
                        Text("⭐")
                            .font(.system(size: 12))
                        Text("LV.\(entry.level)")
                            .font(.system(.subheadline, design: .rounded).weight(.black))
                            .foregroundColor(WidgetColors.level)
                    }
                    Spacer()
                    Text("\(entry.formattedXP) XP")
                        .font(.system(.caption, design: .rounded).weight(.bold))
                        .foregroundColor(WidgetColors.xpGlow)
                }

                Spacer(minLength: 2)

                // Stats grid
                statRow(label: "Focus Time", value: entry.formattedFocusTime, icon: "🕐")
                statRow(label: "Sessions", value: "\(entry.totalSessions)", icon: "✅")
                statRow(label: "Pets", value: "\(entry.totalPets)/44", icon: "🐾")
            }
            .frame(maxWidth: .infinity)
        }
        .padding(14)
    }

    // MARK: - Helper Views

    private func miniStat(icon: String, value: String) -> some View {
        HStack(spacing: 2) {
            Text(icon)
                .font(.system(size: 9))
            Text(value)
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .foregroundColor(WidgetColors.secondary)
        }
    }

    private func statRow(label: String, value: String, icon: String) -> some View {
        HStack {
            HStack(spacing: 4) {
                Text(icon)
                    .font(.system(size: 11))
                Text(label)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundColor(WidgetColors.secondary)
            }
            Spacer()
            Text(value)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundColor(.white)
        }
    }
}

// MARK: - Preview

#if DEBUG
struct StatsWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            StatsWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Default - Small")

            StatsWidgetView(entry: StatsEntry(
                date: Date(), level: 50, totalXP: 125000,
                totalFocusTime: 12000, totalSessions: 500,
                petName: "Storm Spirit", petEmoji: "⚡", totalPets: 44
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Max Level")

            StatsWidgetView(entry: StatsEntry(
                date: Date(), level: 1, totalXP: 50,
                totalFocusTime: 25, totalSessions: 1,
                petName: "Mushroom Kid", petEmoji: "🍄", totalPets: 1
            ))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("New User")

            StatsWidgetView(entry: .placeholder)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Default - Medium")

            StatsWidgetView(entry: StatsEntry(
                date: Date(), level: 50, totalXP: 125000,
                totalFocusTime: 12000, totalSessions: 500,
                petName: "Storm Spirit", petEmoji: "⚡", totalPets: 44
            ))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Max Level - Medium")
        }
    }
}
#endif
