import XCTest
@testable import App

final class WidgetDataPluginTests: XCTestCase {

    // MARK: - Plugin Initialization

    func testPluginIdentifier() {
        let plugin = WidgetDataPlugin()
        XCTAssertEqual(plugin.identifier, "WidgetDataPlugin")
        XCTAssertEqual(plugin.jsName, "WidgetData")
    }

    func testPluginMethods() {
        let plugin = WidgetDataPlugin()
        let methodNames = plugin.pluginMethods.map { $0.name }

        XCTAssertTrue(methodNames.contains("saveData"))
        XCTAssertTrue(methodNames.contains("loadData"))
        XCTAssertTrue(methodNames.contains("refreshWidgets"))
        XCTAssertTrue(methodNames.contains("updateTimer"))
        XCTAssertTrue(methodNames.contains("updateStreak"))
        XCTAssertTrue(methodNames.contains("updateDailyProgress"))
        XCTAssertTrue(methodNames.contains("updateStats"))

        XCTAssertEqual(plugin.pluginMethods.count, 7)
    }

    // MARK: - WidgetSharedData Tests

    func testWidgetSharedDataDefaultValues() {
        let data = WidgetSharedData()

        // Timer defaults
        XCTAssertFalse(data.timer.isRunning)
        XCTAssertEqual(data.timer.timeRemaining, 25 * 60)
        XCTAssertEqual(data.timer.sessionDuration, 25 * 60)
        XCTAssertNil(data.timer.sessionType)
        XCTAssertNil(data.timer.category)
        XCTAssertNil(data.timer.taskLabel)
        XCTAssertNil(data.timer.startTime)

        // Streak defaults
        XCTAssertEqual(data.streak.currentStreak, 0)
        XCTAssertEqual(data.streak.longestStreak, 0)
        XCTAssertNil(data.streak.lastSessionDate)
        XCTAssertEqual(data.streak.streakFreezes, 0)

        // Daily progress defaults
        XCTAssertEqual(data.dailyProgress.focusMinutes, 0)
        XCTAssertEqual(data.dailyProgress.goalMinutes, 120)
        XCTAssertEqual(data.dailyProgress.sessionsCompleted, 0)
        XCTAssertEqual(data.dailyProgress.percentComplete, 0)

        // Stats defaults
        XCTAssertEqual(data.stats.level, 1)
        XCTAssertEqual(data.stats.totalXP, 0)
        XCTAssertEqual(data.stats.totalFocusTime, 0)
        XCTAssertEqual(data.stats.totalSessions, 0)

        // Last updated should be set
        XCTAssertGreaterThan(data.lastUpdated, 0)
    }

    func testTimerDataDefaults() {
        let timer = WidgetSharedData.TimerData()

        XCTAssertFalse(timer.isRunning)
        XCTAssertEqual(timer.timeRemaining, 1500) // 25 minutes
        XCTAssertEqual(timer.sessionDuration, 1500)
    }

    func testStreakDataDefaults() {
        let streak = WidgetSharedData.StreakData()

        XCTAssertEqual(streak.currentStreak, 0)
        XCTAssertEqual(streak.longestStreak, 0)
        XCTAssertNil(streak.lastSessionDate)
        XCTAssertEqual(streak.streakFreezes, 0)
    }

    func testDailyProgressDefaults() {
        let progress = WidgetSharedData.DailyProgress()

        XCTAssertEqual(progress.focusMinutes, 0)
        XCTAssertEqual(progress.goalMinutes, 120)
        XCTAssertEqual(progress.sessionsCompleted, 0)
        XCTAssertEqual(progress.percentComplete, 0)

        // Date should be today
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())
        XCTAssertEqual(progress.date, today)
    }

    func testStatsDefaults() {
        let stats = WidgetSharedData.Stats()

        XCTAssertEqual(stats.level, 1)
        XCTAssertEqual(stats.totalXP, 0)
        XCTAssertEqual(stats.totalFocusTime, 0)
        XCTAssertEqual(stats.totalSessions, 0)
    }

    // MARK: - Encoding/Decoding Tests

    func testWidgetSharedDataEncodingDecoding() throws {
        let original = WidgetSharedData()

        let encoder = JSONEncoder()
        let data = try encoder.encode(original)

        let decoder = JSONDecoder()
        let decoded = try decoder.decode(WidgetSharedData.self, from: data)

        XCTAssertEqual(decoded.timer.isRunning, original.timer.isRunning)
        XCTAssertEqual(decoded.timer.timeRemaining, original.timer.timeRemaining)
        XCTAssertEqual(decoded.streak.currentStreak, original.streak.currentStreak)
        XCTAssertEqual(decoded.dailyProgress.goalMinutes, original.dailyProgress.goalMinutes)
        XCTAssertEqual(decoded.stats.level, original.stats.level)
    }

    func testTimerDataEncodingDecoding() throws {
        var original = WidgetSharedData.TimerData()
        original.isRunning = true
        original.timeRemaining = 900
        original.sessionType = "pomodoro"
        original.category = "work"
        original.taskLabel = "Test Task"
        original.startTime = Date().timeIntervalSince1970

        let encoder = JSONEncoder()
        let data = try encoder.encode(original)

        let decoder = JSONDecoder()
        let decoded = try decoder.decode(WidgetSharedData.TimerData.self, from: data)

        XCTAssertTrue(decoded.isRunning)
        XCTAssertEqual(decoded.timeRemaining, 900)
        XCTAssertEqual(decoded.sessionType, "pomodoro")
        XCTAssertEqual(decoded.category, "work")
        XCTAssertEqual(decoded.taskLabel, "Test Task")
        XCTAssertNotNil(decoded.startTime)
    }
}
