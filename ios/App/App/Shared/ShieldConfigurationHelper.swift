import Foundation
import UIKit

/**
 * ShieldConfigurationHelper
 *
 * A testable helper class that encapsulates the logic used by ShieldConfigurationExtension.
 * This allows unit testing of the extension's business logic without needing to run
 * the extension in a separate process.
 *
 * Usage:
 * - The ShieldConfigurationExtension should use this helper for its operations
 * - Tests can inject a mock UserDefaults to verify behavior
 *
 * Note: This class uses SharedConstants instead of AppConfig because it must work
 * in the extension context where AppConfig may not be available.
 */
class ShieldConfigurationHelper {

    // MARK: - Properties

    private let userDefaults: UserDefaults

    // MARK: - Initialization

    /// Initialize with custom UserDefaults (for testing) or use shared defaults
    init(userDefaults: UserDefaults? = nil) {
        self.userDefaults = userDefaults ?? SharedConstants.sharedUserDefaults ?? UserDefaults.standard
    }

    // MARK: - Shield Attempt Tracking

    /// Records a shield attempt (when user tries to open a blocked app)
    func recordShieldAttempt() {
        let currentAttempts = userDefaults.integer(forKey: SharedConstants.StorageKeys.shieldAttempts)
        userDefaults.set(currentAttempts + 1, forKey: SharedConstants.StorageKeys.shieldAttempts)
        userDefaults.set(Date().timeIntervalSince1970, forKey: SharedConstants.StorageKeys.lastShieldAttempt)
    }

    /// Returns the current shield attempt count
    var shieldAttempts: Int {
        userDefaults.integer(forKey: SharedConstants.StorageKeys.shieldAttempts)
    }

    /// Returns the timestamp of the last shield attempt
    var lastShieldAttemptTimestamp: TimeInterval {
        userDefaults.double(forKey: SharedConstants.StorageKeys.lastShieldAttempt)
    }

    /// Resets the shield attempt counter
    func resetShieldAttempts() {
        userDefaults.set(0, forKey: SharedConstants.StorageKeys.shieldAttempts)
        userDefaults.set(0, forKey: SharedConstants.StorageKeys.lastShieldAttempt)
    }

    // MARK: - Motivational Messages

    /// The list of motivational messages shown on shield screens
    /// Note: Uses static strings here since extensions may not have access to Strings.swift
    static let motivationalMessages = [
        "Your focus pet is counting on you!",
        "Stay strong - your future self will thank you!",
        "Every minute of focus earns you rewards!",
        "You're doing great! Keep focusing!",
        "Distractions can wait - your goals can't!",
        "Focus now, scroll later!",
        "Your streak depends on you!",
        "Almost there! Don't give up now!",
        "Focus = XP = Level Up!",
        "Your pet believes in you!"
    ]

    /// Returns a random motivational message
    func getMotivationalMessage() -> String {
        return Self.motivationalMessages.randomElement() ?? Self.motivationalMessages[0]
    }

    /// Returns all available motivational messages (for testing)
    func getAllMotivationalMessages() -> [String] {
        return Self.motivationalMessages
    }

    // MARK: - Icon Creation

    /// Creates the NoMo icon using SF Symbols
    func createNoMoIcon() -> UIImage? {
        let config = UIImage.SymbolConfiguration(
            pointSize: ShieldUIConstants.iconSize,
            weight: .bold
        )
        return UIImage(systemName: ShieldUIConstants.iconSystemName, withConfiguration: config)?
            .withTintColor(ShieldUIConstants.iconTintColor, renderingMode: .alwaysOriginal)
    }

    // MARK: - Shield Configuration Colors

    /// Returns the background color used for shield configuration
    static var shieldBackgroundColor: UIColor {
        ShieldUIConstants.backgroundColor
    }

    /// Returns the subtitle color used for shield configuration
    static var shieldSubtitleColor: UIColor {
        ShieldUIConstants.subtitleColor
    }

    /// Returns the primary button background color used for shield configuration
    static var shieldButtonColor: UIColor {
        ShieldUIConstants.buttonColor
    }
}

// MARK: - Shield UI Constants

/// Constants for shield UI configuration
/// Duplicated from AppConfig for extension access (extensions can't access AppConfig)
private enum ShieldUIConstants {
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
