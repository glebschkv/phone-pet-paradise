import Foundation
import UIKit

/// Helper for the ShieldConfiguration extension.
/// Provides the retro neon-themed shield design with funny messages.
class ShieldConfigurationHelper {

    // MARK: - Properties

    private let userDefaults: UserDefaults

    // MARK: - Initialization

    init(userDefaults: UserDefaults? = nil) {
        self.userDefaults = userDefaults ?? SharedConstants.sharedUserDefaults ?? UserDefaults.standard
    }

    // MARK: - Shield Attempt Tracking

    func recordShieldAttempt() {
        let currentAttempts = userDefaults.integer(forKey: SharedConstants.StorageKeys.shieldAttempts)
        userDefaults.set(currentAttempts + 1, forKey: SharedConstants.StorageKeys.shieldAttempts)
        userDefaults.set(Date().timeIntervalSince1970, forKey: SharedConstants.StorageKeys.lastShieldAttempt)
    }

    var shieldAttempts: Int {
        userDefaults.integer(forKey: SharedConstants.StorageKeys.shieldAttempts)
    }

    var lastShieldAttemptTimestamp: TimeInterval {
        userDefaults.double(forKey: SharedConstants.StorageKeys.lastShieldAttempt)
    }

    func resetShieldAttempts() {
        userDefaults.set(0, forKey: SharedConstants.StorageKeys.shieldAttempts)
        userDefaults.set(0, forKey: SharedConstants.StorageKeys.lastShieldAttempt)
    }

    // MARK: - Funny Messages

    static let shieldMessages = [
        "You don't need this app. You need a nap.",
        "This app isn't going anywhere. Neither is your focus session.",
        "Somewhere, your pet just leveled up because you didn't open this.",
        "You opened this 3 minutes ago. And 6 minutes before that.",
        "Remember when you said 'just 5 minutes'? We remember.",
        "Your screen time report is already crying.",
        "This is a sign. Go do that thing you've been putting off.",
        "Every time you try to open this, a pixel pet gets stronger.",
        "You're not bored. You're just uncomfortable with your own thoughts.",
        "Congratulations, you played yourself.",
        "The urge will pass in about 9 seconds. We timed it.",
        "This app was talking behind your back anyway.",
        "Your attention span called. It wants custody.",
        "Be the main character. Main characters don't doomscroll.",
        "You will not remember this scroll. You will remember finishing your work.",
    ]

    func getMotivationalMessage() -> String {
        Self.shieldMessages.randomElement() ?? Self.shieldMessages[0]
    }

    func getAllMotivationalMessages() -> [String] {
        Self.shieldMessages
    }

    // MARK: - Title

    /// Returns one of several fun titles randomly
    func getTitle() -> String {
        let titles = [
            "NOMO ZONE",
            "NoMo Distractions",
            "App Blocked",
            "Nice Try",
            "Nope.",
        ]
        return titles.randomElement() ?? titles[0]
    }

    // MARK: - Neon Icon

    /// Creates a custom "NOMO" text icon with neon glow effect
    func createNoMoIcon() -> UIImage? {
        let size = CGSize(width: 80, height: 40)
        let renderer = UIGraphicsImageRenderer(size: size)

        return renderer.image { ctx in
            let text = "NOMO"
            let font = UIFont.systemFont(ofSize: 24, weight: .black)
            let attributes: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: ShieldUIConstants.neonCyan,
            ]

            let textSize = (text as NSString).size(withAttributes: attributes)
            let x = (size.width - textSize.width) / 2
            let y = (size.height - textSize.height) / 2

            // Draw glow layer (slightly larger, blurred)
            let glowAttrs: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: ShieldUIConstants.neonCyan.withAlphaComponent(0.4),
            ]
            (text as NSString).draw(at: CGPoint(x: x - 1, y: y - 1), withAttributes: glowAttrs)
            (text as NSString).draw(at: CGPoint(x: x + 1, y: y + 1), withAttributes: glowAttrs)

            // Draw main text
            (text as NSString).draw(at: CGPoint(x: x, y: y), withAttributes: attributes)
        }
    }

    // MARK: - Shield Colors

    static var shieldBackgroundColor: UIColor {
        ShieldUIConstants.backgroundColor
    }

    static var shieldSubtitleColor: UIColor {
        ShieldUIConstants.subtitleColor
    }

    static var shieldTitleColor: UIColor {
        ShieldUIConstants.titleColor
    }

    static var shieldButtonColor: UIColor {
        ShieldUIConstants.buttonColor
    }

    // MARK: - Accessibility

    static var shieldAccessibilityDescription: String {
        "This app is blocked to help you stay focused. Tap the button to return to NoMo."
    }

    static var returnButtonAccessibilityLabel: String {
        "Return to NoMo app"
    }

    static var returnButtonAccessibilityHint: String {
        "Double tap to close this blocked app and return to NoMo"
    }
}

// MARK: - Neon Shield UI Constants

/// Retro neon-themed color scheme for the shield
private enum ShieldUIConstants {
    /// Neon cyan for title text and icon - electric blue-green glow
    static let neonCyan = UIColor(red: 0.0, green: 1.0, blue: 0.95, alpha: 1.0) // #00FFF2

    /// Background - very dark with slight blue tint (like a dark arcade)
    static let backgroundColor = UIColor(red: 0.04, green: 0.02, blue: 0.12, alpha: 0.97) // #0A0520

    /// Title color - bright neon cyan
    static let titleColor = neonCyan

    /// Subtitle color - neon pink/magenta for contrast
    static let subtitleColor = UIColor(red: 1.0, green: 0.4, blue: 0.7, alpha: 1.0) // #FF66B3

    /// Button color - electric purple with high visibility
    static let buttonColor = UIColor(red: 0.55, green: 0.15, blue: 1.0, alpha: 1.0) // #8C26FF
}
