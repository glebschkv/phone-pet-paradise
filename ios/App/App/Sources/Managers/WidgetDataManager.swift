import Foundation
import WidgetKit

/**
 * WidgetDataManager
 *
 * Manages widget data storage and synchronization.
 * Stores data in App Group for widget access.
 */
final class WidgetDataManager: WidgetDataManaging {

    // MARK: - Singleton

    static let shared = WidgetDataManager()

    // MARK: - Properties

    private let userDefaults: UserDefaults?
    private let dataKey: String

    // MARK: - Initialization

    init(userDefaults: UserDefaults? = nil, dataKey: String = AppConfig.StorageKeys.widgetData) {
        self.userDefaults = userDefaults ?? AppConfig.sharedUserDefaults
        self.dataKey = dataKey
        Log.widget.debug("WidgetDataManager initialized")
    }

    // MARK: - Save Data

    func saveData(_ data: [String: Any]) throws {
        guard let userDefaults = userDefaults else {
            throw PluginError.sharedContainerUnavailable
        }

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data, options: [])
            userDefaults.set(jsonData, forKey: dataKey)
            refreshWidgets()
            Log.widget.success("Widget data saved")
        } catch {
            Log.widget.failure("Failed to save widget data", error: error)
            throw PluginError.dataEncodingFailed
        }
    }

    // MARK: - Load Data

    func loadData() throws -> [String: Any]? {
        guard let userDefaults = userDefaults else {
            throw PluginError.sharedContainerUnavailable
        }

        guard let jsonData = userDefaults.data(forKey: dataKey) else {
            return nil
        }

        do {
            let data = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any]
            return data
        } catch {
            Log.widget.failure("Failed to load widget data", error: error)
            throw PluginError.dataDecodingFailed
        }
    }

    // MARK: - Partial Updates

    func updatePartialData(key: String, value: [String: Any]) throws {
        guard let userDefaults = userDefaults else {
            throw PluginError.sharedContainerUnavailable
        }

        // Load existing data
        var existingData: [String: Any] = [:]
        if let jsonData = userDefaults.data(forKey: dataKey) {
            existingData = (try? JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any]) ?? [:]
        }

        // Merge with existing section data
        var sectionData = existingData[key] as? [String: Any] ?? [:]
        for (k, v) in value {
            sectionData[k] = v
        }
        existingData[key] = sectionData
        existingData["lastUpdated"] = Date().timeIntervalSince1970 * 1000

        // Save back
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: existingData, options: [])
            userDefaults.set(jsonData, forKey: dataKey)
            refreshWidgets()
            Log.widget.info("Widget data updated: \(key)")
        } catch {
            Log.widget.failure("Failed to update widget data", error: error)
            throw PluginError.dataEncodingFailed
        }
    }

    // MARK: - Typed Updates

    func updateTimer(_ data: WidgetTimerData) throws {
        try updatePartialData(key: "timer", value: data.asDictionary)
    }

    func updateStreak(_ data: WidgetStreakData) throws {
        try updatePartialData(key: "streak", value: data.asDictionary)
    }

    func updateDailyProgress(_ data: WidgetDailyProgress) throws {
        try updatePartialData(key: "dailyProgress", value: data.asDictionary)
    }

    func updateStats(_ data: WidgetStats) throws {
        try updatePartialData(key: "stats", value: data.asDictionary)
    }

    // MARK: - Widget Refresh

    func refreshWidgets() {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            Log.widget.debug("Widget timelines reloaded")
        }
    }
}

// MARK: - Widget Data Types

struct WidgetTimerData: Codable {
    var isRunning: Bool = false
    var timeRemaining: Int = AppConfig.Widget.defaultSessionDuration
    var sessionDuration: Int = AppConfig.Widget.defaultSessionDuration
    var sessionType: String?
    var category: String?
    var taskLabel: String?
    var startTime: Double?

    var asDictionary: [String: Any] {
        var dict: [String: Any] = [
            "isRunning": isRunning,
            "timeRemaining": timeRemaining,
            "sessionDuration": sessionDuration
        ]
        if let sessionType = sessionType { dict["sessionType"] = sessionType }
        if let category = category { dict["category"] = category }
        if let taskLabel = taskLabel { dict["taskLabel"] = taskLabel }
        if let startTime = startTime { dict["startTime"] = startTime }
        return dict
    }
}

struct WidgetStreakData: Codable {
    var currentStreak: Int = 0
    var longestStreak: Int = 0
    var lastSessionDate: String?
    var streakFreezes: Int = 0

    var asDictionary: [String: Any] {
        var dict: [String: Any] = [
            "currentStreak": currentStreak,
            "longestStreak": longestStreak,
            "streakFreezes": streakFreezes
        ]
        if let lastSessionDate = lastSessionDate { dict["lastSessionDate"] = lastSessionDate }
        return dict
    }
}

struct WidgetDailyProgress: Codable {
    var date: String
    var focusMinutes: Int = 0
    var goalMinutes: Int = AppConfig.Widget.defaultGoalMinutes
    var sessionsCompleted: Int = 0
    var percentComplete: Int = 0

    init() {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        date = formatter.string(from: Date())
    }

    var asDictionary: [String: Any] {
        [
            "date": date,
            "focusMinutes": focusMinutes,
            "goalMinutes": goalMinutes,
            "sessionsCompleted": sessionsCompleted,
            "percentComplete": percentComplete
        ]
    }
}

struct WidgetStats: Codable {
    var level: Int = 1
    var totalXP: Int = 0
    var totalFocusTime: Int = 0
    var totalSessions: Int = 0

    var asDictionary: [String: Any] {
        [
            "level": level,
            "totalXP": totalXP,
            "totalFocusTime": totalFocusTime,
            "totalSessions": totalSessions
        ]
    }
}
