import Foundation
import Capacitor
import WidgetKit

/**
 * WidgetDataPlugin
 *
 * This Capacitor plugin provides a bridge between the React app and iOS widgets.
 * It stores data in a shared App Group container that both the main app and
 * widgets can access.
 */
@objc(WidgetDataPlugin)
public class WidgetDataPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetDataPlugin"
    public let jsName = "WidgetData"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "refreshWidgets", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateTimer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateStreak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateDailyProgress", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateStats", returnType: CAPPluginReturnPromise)
    ]

    private let dataKey = AppConfig.StorageKeys.widgetData

    private var sharedDefaults: UserDefaults? {
        AppConfig.sharedUserDefaults
    }

    // MARK: - Save Data

    @objc func saveData(_ call: CAPPluginCall) {
        guard let data = call.getObject("data") else {
            call.reject("Missing data parameter")
            return
        }

        guard let sharedDefaults = sharedDefaults else {
            call.reject("Failed to access shared container")
            return
        }

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data, options: [])
            sharedDefaults.set(jsonData, forKey: dataKey)

            // Trigger widget refresh
            reloadWidgets()

            call.resolve(["success": true])
        } catch {
            call.reject("Failed to save data: \(error.localizedDescription)")
        }
    }

    // MARK: - Load Data

    @objc func loadData(_ call: CAPPluginCall) {
        guard let sharedDefaults = sharedDefaults else {
            call.reject("Failed to access shared container")
            return
        }

        guard let jsonData = sharedDefaults.data(forKey: dataKey) else {
            call.resolve(["data": NSNull()])
            return
        }

        do {
            if let data = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any] {
                call.resolve(["data": data])
            } else {
                call.resolve(["data": NSNull()])
            }
        } catch {
            call.reject("Failed to load data: \(error.localizedDescription)")
        }
    }

    // MARK: - Refresh Widgets

    @objc func refreshWidgets(_ call: CAPPluginCall) {
        reloadWidgets()
        call.resolve(["success": true])
    }

    // MARK: - Partial Updates

    @objc func updateTimer(_ call: CAPPluginCall) {
        guard let timerData = call.getObject("timer") else {
            call.reject("Missing timer data")
            return
        }

        updatePartialData(key: "timer", value: timerData) { success, error in
            if success {
                call.resolve(["success": true])
            } else {
                call.reject(error ?? "Failed to update timer")
            }
        }
    }

    @objc func updateStreak(_ call: CAPPluginCall) {
        guard let streakData = call.getObject("streak") else {
            call.reject("Missing streak data")
            return
        }

        updatePartialData(key: "streak", value: streakData) { success, error in
            if success {
                call.resolve(["success": true])
            } else {
                call.reject(error ?? "Failed to update streak")
            }
        }
    }

    @objc func updateDailyProgress(_ call: CAPPluginCall) {
        guard let progressData = call.getObject("dailyProgress") else {
            call.reject("Missing daily progress data")
            return
        }

        updatePartialData(key: "dailyProgress", value: progressData) { success, error in
            if success {
                call.resolve(["success": true])
            } else {
                call.reject(error ?? "Failed to update daily progress")
            }
        }
    }

    @objc func updateStats(_ call: CAPPluginCall) {
        guard let statsData = call.getObject("stats") else {
            call.reject("Missing stats data")
            return
        }

        updatePartialData(key: "stats", value: statsData) { success, error in
            if success {
                call.resolve(["success": true])
            } else {
                call.reject(error ?? "Failed to update stats")
            }
        }
    }

    // MARK: - Private Helpers

    private func updatePartialData(key: String, value: [String: Any], completion: @escaping (Bool, String?) -> Void) {
        guard let sharedDefaults = sharedDefaults else {
            completion(false, "Failed to access shared container")
            return
        }

        // Load existing data
        var existingData: [String: Any] = [:]
        if let jsonData = sharedDefaults.data(forKey: dataKey) {
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
            sharedDefaults.set(jsonData, forKey: dataKey)
            reloadWidgets()
            completion(true, nil)
        } catch {
            completion(false, error.localizedDescription)
        }
    }

    private func reloadWidgets() {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}

// MARK: - Widget Data Model (for Widget Extension)

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

    var timer: TimerData
    var streak: StreakData
    var dailyProgress: DailyProgress
    var stats: Stats
    var lastUpdated: Double

    init() {
        timer = TimerData()
        streak = StreakData()
        dailyProgress = DailyProgress()
        stats = Stats()
        lastUpdated = Date().timeIntervalSince1970 * 1000
    }
}

// MARK: - Widget Data Reader

class WidgetDataReader {
    static func load() -> WidgetSharedData {
        guard let sharedDefaults = AppConfig.sharedUserDefaults,
              let jsonData = sharedDefaults.data(forKey: AppConfig.StorageKeys.widgetData) else {
            return WidgetSharedData()
        }

        do {
            return try JSONDecoder().decode(WidgetSharedData.self, from: jsonData)
        } catch {
            print("[WidgetDataReader] Failed to decode widget data: \(error)")
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
}
