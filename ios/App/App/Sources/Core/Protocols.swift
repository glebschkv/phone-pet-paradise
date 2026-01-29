import Foundation

/**
 * Protocols
 *
 * Protocol definitions for dependency injection and testability.
 * All managers conform to protocols to enable mocking in tests.
 */

// MARK: - Focus Session Protocol

/// Protocol for focus session state management
protocol FocusSessionProviding: AnyObject {
    var isFocusSessionActive: Bool { get }
    var shieldAttempts: Int { get }
    var lastShieldAttemptTimestamp: TimeInterval { get }

    func getFocusSessionActive() -> Bool
    func setFocusSessionActive(_ active: Bool)
    func getShieldAttempts() -> Int
    func recordShieldAttempt()
    func resetShieldAttempts()
    func startSession()
    @discardableResult func endSession() -> Int
}

// MARK: - Permissions Protocol

/// Protocol for permission management
protocol PermissionsManaging: AnyObject {
    var authorizationStatus: AuthorizationStatus { get }

    func requestAuthorization() async throws
    func checkAuthorization() -> AuthorizationStatus
}

/// Authorization status for Family Controls
enum AuthorizationStatus: String, Codable {
    case notDetermined = "notDetermined"
    case denied = "denied"
    case approved = "approved"

    var isGranted: Bool {
        self == .approved
    }
}

// MARK: - App Blocking Protocol

/// Protocol for app blocking operations
protocol AppBlockingManaging: AnyObject {
    var isBlocking: Bool { get }
    var hasAppsConfigured: Bool { get }

    func startBlocking() throws -> BlockingResult
    func stopBlocking() -> BlockingResult
    func getBlockingStatus() -> BlockingStatus

    func saveSelection(_ data: String) throws
    func loadSelection() -> String?
    func clearSelection()
}

/// Result of a blocking operation
struct BlockingResult {
    let success: Bool
    let appsBlocked: Int
    let categoriesBlocked: Int
    let domainsBlocked: Int
    let shieldAttempts: Int
    let note: String?

    var asDictionary: [String: Any] {
        var result: [String: Any] = [
            "success": success,
            "appsBlocked": appsBlocked,
            "categoriesBlocked": categoriesBlocked,
            "domainsBlocked": domainsBlocked
        ]
        if shieldAttempts > 0 {
            result["shieldAttempts"] = shieldAttempts
        }
        if let note = note {
            result["note"] = note
        }
        return result
    }
}

/// Status of app blocking
struct BlockingStatus {
    let isBlocking: Bool
    let focusSessionActive: Bool
    let shieldAttempts: Int
    let lastShieldAttemptTimestamp: TimeInterval
    let hasAppsConfigured: Bool

    var asDictionary: [String: Any] {
        [
            "isBlocking": isBlocking,
            "focusSessionActive": focusSessionActive,
            "shieldAttempts": shieldAttempts,
            "lastShieldAttemptTimestamp": lastShieldAttemptTimestamp,
            "hasAppsConfigured": hasAppsConfigured
        ]
    }
}

// MARK: - Activity Monitoring Protocol

/// Protocol for device activity monitoring
protocol ActivityMonitorManaging: AnyObject {
    var isMonitoring: Bool { get }
    var sessionStartTime: Date? { get }

    func startMonitoring() throws -> MonitoringResult
    func stopMonitoring() -> MonitoringResult
    func getUsageData() -> UsageData
    func recordActiveTime()
}

/// Result of a monitoring operation
struct MonitoringResult {
    let success: Bool
    let isMonitoring: Bool
    let startTime: TimeInterval?

    var asDictionary: [String: Any] {
        var result: [String: Any] = [
            "success": success,
            "monitoring": isMonitoring
        ]
        if let startTime = startTime {
            result["startTime"] = startTime
        }
        return result
    }
}

/// Usage data from monitoring
struct UsageData {
    let timeAwayMinutes: Double
    let isMonitoring: Bool
    let lastActiveTime: TimeInterval
    let currentTime: TimeInterval
    let shieldAttempts: Int

    var asDictionary: [String: Any] {
        [
            "timeAwayMinutes": timeAwayMinutes,
            "isMonitoring": isMonitoring,
            "lastActiveTime": lastActiveTime,
            "currentTime": currentTime,
            "shieldAttempts": shieldAttempts
        ]
    }
}

// MARK: - Background Task Protocol

/// Protocol for background task management
protocol BackgroundTaskManaging: AnyObject {
    func registerBackgroundTasks()
    func scheduleBackgroundRefresh()
}

// MARK: - Haptic Feedback Protocol

/// Protocol for haptic feedback
protocol HapticFeedbackProviding: AnyObject {
    func triggerFeedback(style: HapticStyle)
}

/// Haptic feedback styles
enum HapticStyle: String, CaseIterable {
    case light
    case medium
    case heavy
    case success
    case warning
    case error

    static var allStyleNames: [String] {
        allCases.map { $0.rawValue }
    }
}

// MARK: - Widget Data Protocol

/// Protocol for widget data management
protocol WidgetDataManaging: AnyObject {
    func saveData(_ data: [String: Any]) throws
    func loadData() throws -> [String: Any]?
    func updatePartialData(key: String, value: [String: Any]) throws
    func refreshWidgets()
}
