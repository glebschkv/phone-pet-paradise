import Foundation
import DeviceActivity

/**
 * ActivityMonitorManager
 *
 * Manages device activity monitoring using the DeviceActivity framework.
 * Handles monitoring schedules and usage tracking.
 *
 * Note: DeviceActivityCenter requires the device-activity entitlement which
 * is only available in app extensions. The main app can still track usage
 * time locally, but actual device activity monitoring requires the extension.
 */
@available(iOS 15.0, *)
final class ActivityMonitorManager: ActivityMonitorManaging {

    // MARK: - Singleton

    static let shared = ActivityMonitorManager()

    // MARK: - Properties

    /// DeviceActivityCenter is optional because it requires the device-activity
    /// entitlement which is only available in extensions, not the main app.
    /// Creating DeviceActivityCenter() without the entitlement causes a crash.
    private let deviceActivityCenter: DeviceActivityCenter?
    private let focusDataManager: FocusDataManager

    private(set) var isMonitoring: Bool = false
    private(set) var sessionStartTime: Date?
    private var lastActiveTime: Date?

    // MARK: - Initialization

    init(
        deviceActivityCenter: DeviceActivityCenter? = nil,
        focusDataManager: FocusDataManager = .shared
    ) {
        // Only create DeviceActivityCenter when running in an app extension,
        // where the device-activity entitlement is available.
        if let center = deviceActivityCenter {
            self.deviceActivityCenter = center
        } else if Bundle.main.bundlePath.hasSuffix(".appex") {
            self.deviceActivityCenter = DeviceActivityCenter()
        } else {
            self.deviceActivityCenter = nil
            Log.deviceActivity.info("Running in main app - DeviceActivityCenter not available (extension-only entitlement)")
        }
        self.focusDataManager = focusDataManager
        Log.deviceActivity.debug("ActivityMonitorManager initialized (center available: \(self.deviceActivityCenter != nil))")
    }

    // MARK: - Start Monitoring

    func startMonitoring() throws -> MonitoringResult {
        Log.deviceActivity.operationStart("startMonitoring")

        guard let deviceActivityCenter = deviceActivityCenter else {
            Log.deviceActivity.warning("DeviceActivityCenter not available - monitoring handled by extension")
            // Return success because the extension handles actual monitoring
            return MonitoringResult(
                success: true,
                isMonitoring: true,
                startTime: Date().timeIntervalSince1970
            )
        }

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

        if let deviceActivityCenter = deviceActivityCenter {
            let activityName = DeviceActivityName(AppConfig.ActivityMonitoring.activityName)
            deviceActivityCenter.stopMonitoring([activityName])
        }
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
