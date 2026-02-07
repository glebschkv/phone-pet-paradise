import Foundation
import Capacitor
import WidgetKit

/**
 * WidgetDataPlugin
 *
 * Capacitor plugin providing a bridge between the app and iOS widgets.
 * Stores data in a shared App Group container accessible by widgets.
 *
 * Architecture:
 * - Delegates to WidgetDataManager for data operations
 * - Uses PluginValidation for input validation
 * - Uses PluginError for error handling
 */
@objc(WidgetDataPlugin)
public class WidgetDataPlugin: CAPPlugin, CAPBridgedPlugin {

    // MARK: - Plugin Configuration

    public let identifier = "WidgetDataPlugin"
    public let jsName = "WidgetData"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "refreshWidgets", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateTimer", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateStreak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateDailyProgress", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateStats", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updatePetInfo", returnType: CAPPluginReturnPromise)
    ]

    // MARK: - Dependencies

    private let widgetManager: WidgetDataManager

    // MARK: - Initialization

    public override init() {
        self.widgetManager = .shared
        super.init()
    }

    /// Designated initializer for testing
    init(widgetManager: WidgetDataManager) {
        self.widgetManager = widgetManager
        super.init()
    }

    public override func load() {
        Log.widget.info("WidgetDataPlugin loaded")
    }

    // MARK: - Save Data

    @objc func saveData(_ call: CAPPluginCall) {
        do {
            let data = try PluginValidation.requiredObject(call, key: "data")
            try widgetManager.saveData(data)
            call.resolveSuccess()
        } catch {
            call.reject(with: error as? PluginError ?? .dataEncodingFailed)
        }
    }

    // MARK: - Load Data

    @objc func loadData(_ call: CAPPluginCall) {
        do {
            if let data = try widgetManager.loadData() {
                call.resolve(["data": data])
            } else {
                call.resolve(["data": NSNull()])
            }
        } catch {
            call.reject(with: error as? PluginError ?? .dataDecodingFailed)
        }
    }

    // MARK: - Refresh Widgets

    @objc func refreshWidgets(_ call: CAPPluginCall) {
        widgetManager.refreshWidgets()
        call.resolveSuccess()
    }

    // MARK: - Partial Updates

    @objc func updateTimer(_ call: CAPPluginCall) {
        do {
            let timerData = try PluginValidation.requiredObject(call, key: "timer")
            try widgetManager.updatePartialData(key: "timer", value: timerData)
            call.resolveSuccess()
        } catch {
            call.reject(with: error as? PluginError ?? .dataEncodingFailed)
        }
    }

    @objc func updateStreak(_ call: CAPPluginCall) {
        do {
            let streakData = try PluginValidation.requiredObject(call, key: "streak")
            try widgetManager.updatePartialData(key: "streak", value: streakData)
            call.resolveSuccess()
        } catch {
            call.reject(with: error as? PluginError ?? .dataEncodingFailed)
        }
    }

    @objc func updateDailyProgress(_ call: CAPPluginCall) {
        do {
            let progressData = try PluginValidation.requiredObject(call, key: "dailyProgress")
            try widgetManager.updatePartialData(key: "dailyProgress", value: progressData)
            call.resolveSuccess()
        } catch {
            call.reject(with: error as? PluginError ?? .dataEncodingFailed)
        }
    }

    @objc func updateStats(_ call: CAPPluginCall) {
        do {
            let statsData = try PluginValidation.requiredObject(call, key: "stats")
            try widgetManager.updatePartialData(key: "stats", value: statsData)
            call.resolveSuccess()
        } catch {
            call.reject(with: error as? PluginError ?? .dataEncodingFailed)
        }
    }

    @objc func updatePetInfo(_ call: CAPPluginCall) {
        do {
            let petData = try PluginValidation.requiredObject(call, key: "petInfo")
            try widgetManager.updatePartialData(key: "petInfo", value: petData)
            call.resolveSuccess()
        } catch {
            call.reject(with: error as? PluginError ?? .dataEncodingFailed)
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
            timeRemaining = AppConfig.Widget.defaultSessionDuration
            sessionDuration = AppConfig.Widget.defaultSessionDuration
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
            goalMinutes = AppConfig.Widget.defaultGoalMinutes
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
        guard let sharedDefaults = AppConfig.sharedUserDefaults,
              let jsonData = sharedDefaults.data(forKey: AppConfig.StorageKeys.widgetData) else {
            return WidgetSharedData()
        }

        do {
            return try JSONDecoder().decode(WidgetSharedData.self, from: jsonData)
        } catch {
            Log.widget.failure("Failed to decode widget data", error: error)
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
