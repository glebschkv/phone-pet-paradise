import Foundation
import Capacitor

/**
 * WidgetDataPlugin
 *
 * This Capacitor plugin provides a bridge between the React app and iOS widgets.
 * It stores data in a shared App Group container that both the main app and
 * widgets can access.
 *
 * SETUP INSTRUCTIONS:
 * 1. Enable App Groups capability in Xcode for both main app and widget extension
 * 2. Use the same App Group identifier: "group.com.phonepetparadise.app"
 * 3. Create a Widget Extension target in Xcode
 * 4. Use the WidgetData struct in the widget to read shared data
 */

@objc(WidgetDataPlugin)
public class WidgetDataPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetDataPlugin"
    public let jsName = "WidgetData"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "refreshWidgets", returnType: CAPPluginReturnPromise)
    ]

    private let appGroupId = "group.com.phonepetparadise.app"
    private let dataKey = "widget_data"

    /**
     * Save widget data to shared container
     */
    @objc func saveData(_ call: CAPPluginCall) {
        guard let data = call.getObject("data") else {
            call.reject("Missing data parameter")
            return
        }

        guard let sharedDefaults = UserDefaults(suiteName: appGroupId) else {
            call.reject("Failed to access shared container")
            return
        }

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: data, options: [])
            sharedDefaults.set(jsonData, forKey: dataKey)
            sharedDefaults.synchronize()

            // Trigger widget refresh
            if #available(iOS 14.0, *) {
                // WidgetCenter.shared.reloadAllTimelines()
                // Note: Requires WidgetKit import and widget extension to be created
            }

            call.resolve(["success": true])
        } catch {
            call.reject("Failed to save data: \(error.localizedDescription)")
        }
    }

    /**
     * Load widget data from shared container
     */
    @objc func loadData(_ call: CAPPluginCall) {
        guard let sharedDefaults = UserDefaults(suiteName: appGroupId) else {
            call.reject("Failed to access shared container")
            return
        }

        guard let jsonData = sharedDefaults.data(forKey: dataKey) else {
            call.resolve(["data": nil])
            return
        }

        do {
            if let data = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any] {
                call.resolve(["data": data])
            } else {
                call.resolve(["data": nil])
            }
        } catch {
            call.reject("Failed to load data: \(error.localizedDescription)")
        }
    }

    /**
     * Force refresh all widgets
     */
    @objc func refreshWidgets(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            // WidgetCenter.shared.reloadAllTimelines()
            // Note: Requires WidgetKit import and widget extension to be created
        }
        call.resolve(["success": true])
    }
}

// MARK: - Widget Data Model (to be used in Widget Extension)

/**
 * Shared data model for widgets
 *
 * Copy this struct to your Widget Extension target and use it to read
 * data from the shared container.
 *
 * Example usage in Widget:
 * ```swift
 * let data = WidgetDataReader.load()
 * Text("\(data.streak.currentStreak) day streak")
 * ```
 */
struct WidgetSharedData: Codable {
    struct TimerData: Codable {
        var isRunning: Bool
        var timeRemaining: Int
        var sessionDuration: Int
        var sessionType: String?
        var category: String?
        var taskLabel: String?
        var startTime: Double?
    }

    struct StreakData: Codable {
        var currentStreak: Int
        var longestStreak: Int
        var lastSessionDate: String?
        var streakFreezes: Int
    }

    struct DailyProgress: Codable {
        var date: String
        var focusMinutes: Int
        var goalMinutes: Int
        var sessionsCompleted: Int
        var percentComplete: Int
    }

    struct Stats: Codable {
        var level: Int
        var totalXP: Int
        var totalFocusTime: Int
        var totalSessions: Int
    }

    var timer: TimerData
    var streak: StreakData
    var dailyProgress: DailyProgress
    var stats: Stats
    var lastUpdated: Double
}

/**
 * Helper class to read widget data in Widget Extension
 */
class WidgetDataReader {
    private static let appGroupId = "group.com.phonepetparadise.app"
    private static let dataKey = "widget_data"

    static func load() -> WidgetSharedData? {
        guard let sharedDefaults = UserDefaults(suiteName: appGroupId),
              let jsonData = sharedDefaults.data(forKey: dataKey) else {
            return nil
        }

        do {
            return try JSONDecoder().decode(WidgetSharedData.self, from: jsonData)
        } catch {
            print("Failed to decode widget data: \(error)")
            return nil
        }
    }
}
