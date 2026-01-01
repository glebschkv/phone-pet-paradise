import Foundation

/**
 * Centralized App Configuration
 *
 * All app-wide constants and configuration values should be defined here
 * to maintain a single source of truth across the iOS codebase.
 */
enum AppConfig {
    // MARK: - App Identifiers
    static let appGroupIdentifier = "group.co.nomoinc.nomo"
    static let bundleIdentifier = "co.nomoinc.nomo"
    static let appName = "NoMo Phone"
    static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    static let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"

    // MARK: - Background Tasks
    static let backgroundTaskIdentifier = "app.lovable.354c50c576064f429b59577c9adb3ef7.background-tracking"
    static let backgroundRefreshIntervalMinutes: TimeInterval = 15

    // MARK: - Storage Keys
    enum StorageKeys {
        static let blockedAppsSelection = "blockedAppSelection"
        static let focusSessionActive = "focusSessionActive"
        static let shieldAttempts = "shieldAttempts"
        static let lastShieldAttempt = "lastShieldAttempt"
        static let widgetData = "widgetData"
        static let timerState = "timerState"
        static let streakData = "streakData"
        static let dailyProgress = "dailyProgress"
    }

    // MARK: - StoreKit Product IDs
    enum ProductIDs {
        static let premiumMonthly = "nomo_premium_monthly"
        static let premiumYearly = "nomo_premium_yearly"
        static let premiumLifetime = "nomo_premium_lifetime"

        static let allProducts: [String] = [
            premiumMonthly,
            premiumYearly,
            premiumLifetime
        ]
    }

    // MARK: - Network Configuration
    enum Network {
        static let maxRetries = 3
        static let initialRetryDelay: TimeInterval = 1.0
        static let maxRetryDelay: TimeInterval = 10.0
        static let backoffMultiplier: Double = 2.0
        static let requestTimeout: TimeInterval = 30.0
    }

    // MARK: - Activity Monitoring
    enum ActivityMonitoring {
        static let activityName = "phoneUsageTracking"
        static let scheduleEventName = "focusScheduleEvent"
        static let maxStoredLogs = 100
    }

    // MARK: - Shared UserDefaults
    static var sharedUserDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupIdentifier)
    }
}

// MARK: - Retry Helper

/**
 * Executes an async operation with exponential backoff retry logic
 */
func withRetry<T>(
    maxRetries: Int = AppConfig.Network.maxRetries,
    initialDelay: TimeInterval = AppConfig.Network.initialRetryDelay,
    maxDelay: TimeInterval = AppConfig.Network.maxRetryDelay,
    backoffMultiplier: Double = AppConfig.Network.backoffMultiplier,
    operation: @escaping () async throws -> T
) async throws -> T {
    var lastError: Error?
    var currentDelay = initialDelay

    for attempt in 0..<maxRetries {
        do {
            return try await operation()
        } catch {
            lastError = error

            // Don't delay after the last attempt
            if attempt < maxRetries - 1 {
                try await Task.sleep(nanoseconds: UInt64(currentDelay * 1_000_000_000))
                currentDelay = min(currentDelay * backoffMultiplier, maxDelay)
            }
        }
    }

    throw lastError ?? NSError(
        domain: "RetryError",
        code: -1,
        userInfo: [NSLocalizedDescriptionKey: "Operation failed after \(maxRetries) retries"]
    )
}
