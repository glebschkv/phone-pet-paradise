import Foundation

/**
 * FocusDataManager
 *
 * Singleton manager for focus session state shared between main app and extensions.
 * Persists data to App Group UserDefaults for cross-process access.
 *
 * Thread Safety:
 * - All properties use UserDefaults which is thread-safe
 * - Compound operations (like recordShieldAttempt) should be called from main thread
 */
final class FocusDataManager {

    // MARK: - Singleton

    static let shared = FocusDataManager()

    // MARK: - Properties

    private let userDefaults: UserDefaults?
    private let notificationCenter: NotificationCenter

    // MARK: - Notifications

    static let focusSessionDidChangeNotification = Notification.Name("FocusDataManagerFocusSessionDidChange")
    static let shieldAttemptRecordedNotification = Notification.Name("FocusDataManagerShieldAttemptRecorded")

    // MARK: - Initialization

    init(userDefaults: UserDefaults? = nil, notificationCenter: NotificationCenter = .default) {
        self.userDefaults = userDefaults ?? AppConfig.sharedUserDefaults
        self.notificationCenter = notificationCenter
        Log.focus.debug("FocusDataManager initialized")
    }

    // MARK: - Focus Session State

    /// Whether a focus session is currently active
    var isFocusSessionActive: Bool {
        get {
            userDefaults?.bool(forKey: AppConfig.StorageKeys.focusSessionActive) ?? false
        }
        set {
            let oldValue = isFocusSessionActive
            userDefaults?.set(newValue, forKey: AppConfig.StorageKeys.focusSessionActive)

            if oldValue != newValue {
                Log.focus.info("Focus session state changed: \(newValue ? "active" : "inactive")")
                notificationCenter.post(
                    name: Self.focusSessionDidChangeNotification,
                    object: self,
                    userInfo: ["isActive": newValue]
                )
            }
        }
    }

    // MARK: - Shield Attempts

    /// Number of times user has attempted to open blocked apps
    var shieldAttempts: Int {
        get {
            userDefaults?.integer(forKey: AppConfig.StorageKeys.shieldAttempts) ?? 0
        }
        set {
            userDefaults?.set(newValue, forKey: AppConfig.StorageKeys.shieldAttempts)
        }
    }

    /// Timestamp of the last shield attempt
    var lastShieldAttemptTimestamp: TimeInterval {
        get {
            userDefaults?.double(forKey: AppConfig.StorageKeys.lastShieldAttempt) ?? 0
        }
        set {
            userDefaults?.set(newValue, forKey: AppConfig.StorageKeys.lastShieldAttempt)
        }
    }

    /// Records a shield attempt with current timestamp
    func recordShieldAttempt() {
        shieldAttempts += 1
        lastShieldAttemptTimestamp = Date().timeIntervalSince1970

        Log.focus.info("Shield attempt recorded: \(shieldAttempts) total")
        notificationCenter.post(
            name: Self.shieldAttemptRecordedNotification,
            object: self,
            userInfo: [
                "attempts": shieldAttempts,
                "timestamp": lastShieldAttemptTimestamp
            ]
        )
    }

    /// Resets shield attempts counter
    func resetShieldAttempts() {
        shieldAttempts = 0
        lastShieldAttemptTimestamp = 0
        Log.focus.info("Shield attempts reset")
    }

    // MARK: - Session Management

    /// Starts a new focus session
    func startSession() {
        isFocusSessionActive = true
        resetShieldAttempts()
        Log.focus.success("Focus session started")
    }

    /// Ends the current focus session
    /// - Returns: The number of shield attempts during the session
    @discardableResult
    func endSession() -> Int {
        let attempts = shieldAttempts
        isFocusSessionActive = false
        Log.focus.success("Focus session ended with \(attempts) shield attempts")
        return attempts
    }

    // MARK: - State Query

    /// Returns current focus state as a dictionary
    var currentState: [String: Any] {
        [
            "isActive": isFocusSessionActive,
            "shieldAttempts": shieldAttempts,
            "lastShieldAttemptTimestamp": lastShieldAttemptTimestamp
        ]
    }
}

// MARK: - Protocol Conformance

extension FocusDataManager: FocusSessionProviding {
    func getFocusSessionActive() -> Bool {
        isFocusSessionActive
    }

    func setFocusSessionActive(_ active: Bool) {
        isFocusSessionActive = active
    }

    func getShieldAttempts() -> Int {
        shieldAttempts
    }
}
