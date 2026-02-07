import Foundation

// MARK: - Widget Data Model (shared between App and Widget Extension)

struct WidgetSharedData: Codable {
    struct TimerData: Codable {
        var isRunning: Bool
        var timeRemaining: Int
        var sessionDuration: Int
        var sessionType: String?
        var category: String?
        var taskLabel: String?
        var startTime: Double?

        init() {
            isRunning = false
            timeRemaining = 25 * 60
            sessionDuration = 25 * 60
            sessionType = nil
            category = nil
            taskLabel = nil
            startTime = nil
        }
    }

    struct StreakData: Codable {
        var currentStreak: Int
        var longestStreak: Int
        var lastSessionDate: String?
        var streakFreezes: Int

        init() {
            currentStreak = 0
            longestStreak = 0
            lastSessionDate = nil
            streakFreezes = 0
        }
    }

    struct DailyProgress: Codable {
        var date: String
        var focusMinutes: Int
        var goalMinutes: Int
        var sessionsCompleted: Int
        var percentComplete: Int

        init() {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            date = formatter.string(from: Date())
            focusMinutes = 0
            goalMinutes = 120
            sessionsCompleted = 0
            percentComplete = 0
        }
    }

    struct Stats: Codable {
        var level: Int
        var totalXP: Int
        var totalFocusTime: Int
        var totalSessions: Int

        init() {
            level = 1
            totalXP = 0
            totalFocusTime = 0
            totalSessions = 0
        }
    }

    struct PetInfo: Codable {
        var activePetName: String?
        var activePetEmoji: String?
        var totalPetsCollected: Int
        var currentBiome: String?

        init() {
            activePetName = nil
            activePetEmoji = nil
            totalPetsCollected = 0
            currentBiome = nil
        }
    }

    var timer: TimerData
    var streak: StreakData
    var dailyProgress: DailyProgress
    var stats: Stats
    var petInfo: PetInfo
    var lastUpdated: Double

    init() {
        timer = TimerData()
        streak = StreakData()
        dailyProgress = DailyProgress()
        stats = Stats()
        petInfo = PetInfo()
        lastUpdated = Date().timeIntervalSince1970 * 1000
    }
}

// MARK: - Widget Data Reader

final class WidgetDataReader {
    static func load() -> WidgetSharedData {
        guard let sharedDefaults = UserDefaults(suiteName: SharedConstants.appGroupIdentifier),
              let jsonData = sharedDefaults.data(forKey: "widgetData") else {
            return WidgetSharedData()
        }

        do {
            return try JSONDecoder().decode(WidgetSharedData.self, from: jsonData)
        } catch {
            return WidgetSharedData()
        }
    }

    static var timerData: WidgetSharedData.TimerData {
        load().timer
    }

    static var streakData: WidgetSharedData.StreakData {
        load().streak
    }

    static var dailyProgress: WidgetSharedData.DailyProgress {
        load().dailyProgress
    }

    static var stats: WidgetSharedData.Stats {
        load().stats
    }

    static var petInfo: WidgetSharedData.PetInfo {
        load().petInfo
    }
}
