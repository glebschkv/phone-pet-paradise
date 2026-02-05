import Foundation
import UIKit

/**
 * Centralized App Configuration
 *
 * All app-wide constants and configuration values should be defined here
 * to maintain a single source of truth across the iOS codebase.
 *
 * Categories:
 * - App Identifiers: Bundle IDs, app names, versions
 * - Background Tasks: Task identifiers and intervals
 * - Storage Keys: UserDefaults keys for persistence
 * - StoreKit: Product IDs for in-app purchases
 * - Network: Retry logic and timeout configuration
 * - Activity Monitoring: DeviceActivity framework config
 * - Widget: Widget-specific constants
 * - UI: Colors, dimensions, and visual constants
 * - Timing: Timer and duration constants
 */
enum AppConfig {

    // MARK: - App Identifiers

    /// App Group identifier - references SharedConstants for consistency with extensions
    static let appGroupIdentifier = SharedConstants.appGroupIdentifier
    static let bundleIdentifier = "co.nomoinc.nomo"
    static let appName = "NoMo Phone"
    static let merchantIdentifier = "merchant.co.nomoinc.nomo"

    static var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }

    static var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }

    static var fullVersion: String {
        "\(appVersion) (\(buildNumber))"
    }

    // MARK: - Background Tasks

    enum BackgroundTask {
        static let identifier = "co.nomoinc.nomo.background-tracking"
        static let refreshIntervalMinutes: TimeInterval = 15
        static let refreshIntervalSeconds: TimeInterval = 15 * 60
    }

    /// Legacy accessors for backwards compatibility
    static let backgroundTaskIdentifier = BackgroundTask.identifier
    static let backgroundRefreshIntervalMinutes = BackgroundTask.refreshIntervalMinutes

    // MARK: - Storage Keys

    enum StorageKeys {
        // Shared keys (also used by extensions) - reference SharedConstants
        static let blockedAppsSelection = SharedConstants.StorageKeys.blockedAppsSelection
        static let focusSessionActive = SharedConstants.StorageKeys.focusSessionActive
        static let shieldAttempts = SharedConstants.StorageKeys.shieldAttempts
        static let lastShieldAttempt = SharedConstants.StorageKeys.lastShieldAttempt
        static let activityLogs = SharedConstants.StorageKeys.activityLogs

        // App-only keys (not used by extensions)
        static let widgetData = "widgetData"
        static let timerState = "timerState"
        static let streakData = "streakData"
        static let dailyProgress = "dailyProgress"
        static let userPreferences = "userPreferences"
        static let lastSyncTimestamp = "lastSyncTimestamp"
    }

    // MARK: - StoreKit Product IDs

    enum ProductIDs {
        // Subscriptions
        static let premiumMonthly = "co.nomoinc.nomo.premium.monthly"
        static let premiumYearly = "co.nomoinc.nomo.premium.yearly"
        static let premiumPlusMonthly = "co.nomoinc.nomo.premiumplus.monthly"
        static let premiumPlusYearly = "co.nomoinc.nomo.premiumplus.yearly"
        static let lifetime = "co.nomoinc.nomo.lifetime"

        // Coin Packs (Consumables)
        static let coinsValue = "co.nomoinc.nomo.coins.value"
        static let coinsPremium = "co.nomoinc.nomo.coins.premium"
        static let coinsMega = "co.nomoinc.nomo.coins.mega"
        static let coinsUltra = "co.nomoinc.nomo.coins.ultra"
        static let coinsLegendary = "co.nomoinc.nomo.coins.legendary"

        // Starter Bundles (Non-Consumables)
        static let bundleWelcome = "co.nomoinc.nomo.bundle.welcome"
        static let bundleStarter = "co.nomoinc.nomo.bundle.starter"
        static let bundleCollector = "co.nomoinc.nomo.bundle.collector"
        static let bundleUltimate = "co.nomoinc.nomo.bundle.ultimate"

        static let allProducts: [String] = [
            premiumMonthly,
            premiumYearly,
            premiumPlusMonthly,
            premiumPlusYearly,
            lifetime,
            coinsValue,
            coinsPremium,
            coinsMega,
            coinsUltra,
            coinsLegendary,
            bundleWelcome,
            bundleStarter,
            bundleCollector,
            bundleUltimate,
        ]

        static let subscriptionProducts: [String] = [
            premiumMonthly,
            premiumYearly,
            premiumPlusMonthly,
            premiumPlusYearly,
            lifetime,
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
        static let activityName = SharedConstants.ActivityNames.phoneUsageTracking
        static let focusSessionName = SharedConstants.ActivityNames.focusSession
        static let scheduleEventName = "focusScheduleEvent"
        static let maxStoredLogs = SharedConstants.maxStoredLogs

        /// Default monitoring schedule - all day
        static let scheduleStartHour = 0
        static let scheduleStartMinute = 0
        static let scheduleEndHour = 23
        static let scheduleEndMinute = 59
    }

    // MARK: - Widget Configuration

    enum Widget {
        /// Default session duration in seconds (25 minutes)
        static let defaultSessionDuration = 25 * 60

        /// Default daily goal in minutes (120 minutes = 2 hours)
        static let defaultGoalMinutes = 120

        /// Widget kinds for WidgetKit
        static let timerWidgetKind = "NoMoTimerWidget"
        static let streakWidgetKind = "NoMoStreakWidget"
        static let progressWidgetKind = "NoMoProgressWidget"
        static let statsWidgetKind = "NoMoStatsWidget"

        /// Widget display names
        static let timerDisplayName = "Focus Timer"
        static let streakDisplayName = "Streak"
        static let progressDisplayName = "Daily Progress"
        static let statsDisplayName = "Stats"

        /// Widget refresh intervals in minutes
        static let timerRefreshInterval: TimeInterval = 1
        static let defaultRefreshInterval: TimeInterval = 15
    }

    // MARK: - Timer Configuration

    enum Timer {
        /// Pomodoro session duration in seconds
        static let pomodoroSessionSeconds = 25 * 60

        /// Short break duration in seconds
        static let shortBreakSeconds = 5 * 60

        /// Long break duration in seconds
        static let longBreakSeconds = 15 * 60

        /// Sessions before long break
        static let sessionsBeforeLongBreak = 4
    }

    // MARK: - Shield UI Configuration

    enum ShieldUI {
        /// Icon size for shield configuration
        static let iconSize: CGFloat = 60

        /// Background color (dark purple)
        static let backgroundColor = UIColor(red: 0.1, green: 0.05, blue: 0.15, alpha: 0.95)

        /// Subtitle text color (light purple)
        static let subtitleColor = UIColor(red: 0.7, green: 0.6, blue: 0.9, alpha: 1.0)

        /// Primary button color (medium purple)
        static let buttonColor = UIColor(red: 0.5, green: 0.3, blue: 0.8, alpha: 1.0)

        /// Icon tint color (light purple)
        static let iconTintColor = UIColor(red: 0.8, green: 0.6, blue: 1.0, alpha: 1.0)

        /// System icon name for shield
        static let iconSystemName = "moon.stars.fill"
    }

    // MARK: - Animation

    enum Animation {
        /// Standard animation duration
        static let standardDuration: TimeInterval = 0.3

        /// Quick animation duration
        static let quickDuration: TimeInterval = 0.15

        /// Slow animation duration
        static let slowDuration: TimeInterval = 0.5
    }

    // MARK: - Limits

    enum Limits {
        /// Maximum number of blocked apps
        static let maxBlockedApps = 100

        /// Maximum session duration in seconds (4 hours)
        static let maxSessionDuration = 4 * 60 * 60

        /// Minimum session duration in seconds (1 minute)
        static let minSessionDuration = 60
    }

    // MARK: - Shared UserDefaults

    static var sharedUserDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupIdentifier)
    }
}

// MARK: - Retry Helper

/**
 * Executes an async operation with exponential backoff retry logic
 *
 * - Parameters:
 *   - maxRetries: Maximum number of retry attempts
 *   - initialDelay: Initial delay between retries
 *   - maxDelay: Maximum delay between retries
 *   - backoffMultiplier: Multiplier for exponential backoff
 *   - operation: The async operation to perform
 * - Returns: The result of the operation
 * - Throws: The last error if all retries fail
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
            Log.app.warning("Retry attempt \(attempt + 1)/\(maxRetries) failed: \(error.localizedDescription)")

            // Don't delay after the last attempt
            if attempt < maxRetries - 1 {
                try await Task.sleep(nanoseconds: UInt64(currentDelay * 1_000_000_000))
                currentDelay = min(currentDelay * backoffMultiplier, maxDelay)
            }
        }
    }

    Log.app.error("All \(maxRetries) retry attempts failed")
    throw lastError ?? PluginError.networkError(underlying: nil)
}
