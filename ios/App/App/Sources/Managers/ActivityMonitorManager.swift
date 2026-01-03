import Foundation
import DeviceActivity

/**
 * ActivityMonitorManager
 *
 * Manages device activity monitoring using the DeviceActivity framework.
 * Handles monitoring schedules and usage tracking.
 */
final class ActivityMonitorManager: ActivityMonitorManaging {

    // MARK: - Singleton

    static let shared = ActivityMonitorManager()

    // MARK: - Properties

    private let deviceActivityCenter: DeviceActivityCenter
    private let focusDataManager: FocusDataManager

    private(set) var isMonitoring: Bool = false
    private(set) var sessionStartTime: Date?
    private var lastActiveTime: Date?

    // MARK: - Initialization

    init(
        deviceActivityCenter: DeviceActivityCenter = DeviceActivityCenter(),
        focusDataManager: FocusDataManager = .shared
    ) {
        self.deviceActivityCenter = deviceActivityCenter
        self.focusDataManager = focusDataManager
        Log.deviceActivity.debug("ActivityMonitorManager initialized")
    }

    // MARK: - Start Monitoring

    func startMonitoring() throws -> MonitoringResult {
        Log.deviceActivity.operationStart("startMonitoring")

        let activityName = DeviceActivityName(AppConfig.ActivityMonitoring.activityName)
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59),
            repeats: true
        )

        do {
            try deviceActivityCenter.startMonitoring(activityName, during: schedule)
            isMonitoring = true
            sessionStartTime = Date()

            Log.deviceActivity.success("Monitoring started")
            return MonitoringResult(
                success: true,
                isMonitoring: true,
                startTime: sessionStartTime?.timeIntervalSince1970
            )
        } catch {
            Log.deviceActivity.failure("Failed to start monitoring", error: error)
            throw PluginError.monitoringFailed(reason: error.localizedDescription)
        }
    }

    // MARK: - Stop Monitoring

    func stopMonitoring() -> MonitoringResult {
        Log.deviceActivity.operationStart("stopMonitoring")

        let activityName = DeviceActivityName(AppConfig.ActivityMonitoring.activityName)
        deviceActivityCenter.stopMonitoring([activityName])
        isMonitoring = false
        sessionStartTime = nil

        Log.deviceActivity.success("Monitoring stopped")
        return MonitoringResult(
            success: true,
            isMonitoring: false,
            startTime: nil
        )
    }

    // MARK: - Usage Data

    func getUsageData() -> UsageData {
        let now = Date()
        var timeAwayMinutes = 0.0

        if let lastActive = lastActiveTime {
            timeAwayMinutes = now.timeIntervalSince(lastActive) / 60.0
        }

        return UsageData(
            timeAwayMinutes: timeAwayMinutes,
            isMonitoring: isMonitoring,
            lastActiveTime: lastActiveTime?.timeIntervalSince1970 ?? 0,
            currentTime: now.timeIntervalSince1970,
            shieldAttempts: focusDataManager.shieldAttempts
        )
    }

    // MARK: - Active Time

    func recordActiveTime() {
        lastActiveTime = Date()
        Log.deviceActivity.debug("Active time recorded")
    }

    /// Updates last active time and returns time away
    func updateActiveTime() -> TimeInterval {
        let now = Date()
        let timeAway = lastActiveTime.map { now.timeIntervalSince($0) } ?? 0
        lastActiveTime = now
        return timeAway
    }
}
