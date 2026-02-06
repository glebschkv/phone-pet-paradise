import Foundation
import UIKit

/// Helper for the ShieldConfiguration extension.
/// Pixel-art retro arcade themed shield with funny messages.
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

    // MARK: - Messages

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

    func getTitle() -> String {
        let titles = [
            "\u{25A0} NOMO \u{25A0}",
            "\u{25B6} BLOCKED",
            "\u{2588}\u{2588} NOPE",
            ">> NO ACCESS",
            "\u{2593} DENIED \u{2593}",
        ]
        return titles.randomElement() ?? titles[0]
    }

    // MARK: - Pixel Art Icon

    /// Creates a pixel art "X" icon by rendering an SF Symbol at tiny resolution
    /// then scaling up with nearest-neighbor interpolation for that retro look
    func createNoMoIcon() -> UIImage? {
        // Render SF Symbol at tiny resolution
        let config = UIImage.SymbolConfiguration(pointSize: 14, weight: .black)
        guard let symbol = UIImage(systemName: "xmark.octagon.fill", withConfiguration: config)?
            .withTintColor(ShieldColors.neonCyan, renderingMode: .alwaysOriginal) else { return nil }

        // Draw symbol into a tiny 16x16 bitmap
        let tinySize = CGSize(width: 16, height: 16)
        let tinyRenderer = UIGraphicsImageRenderer(size: tinySize)
        let tinyImage = tinyRenderer.image { _ in
            let drawRect = CGRect(
                x: (tinySize.width - symbol.size.width) / 2,
                y: (tinySize.height - symbol.size.height) / 2,
                width: symbol.size.width,
                height: symbol.size.height
            )
            symbol.draw(in: drawRect)
        }

        // Scale up with nearest-neighbor interpolation for pixel art effect
        let targetSize = CGSize(width: 80, height: 80)
        UIGraphicsBeginImageContextWithOptions(targetSize, false, 1.0)
        guard let ctx = UIGraphicsGetCurrentContext() else { return nil }
        ctx.interpolationQuality = .none
        tinyImage.draw(in: CGRect(origin: .zero, size: targetSize))
        let pixelImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()

        return pixelImage
    }

    // MARK: - Colors

    static var shieldBackgroundColor: UIColor { ShieldColors.background }
    static var shieldTitleColor: UIColor { ShieldColors.neonCyan }
    static var shieldSubtitleColor: UIColor { ShieldColors.neonPink }
    static var shieldButtonColor: UIColor { ShieldColors.electricPurple }

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

// MARK: - Retro Arcade Color Palette

private enum ShieldColors {
    /// Neon cyan - bright electric blue-green (#00FFE5)
    static let neonCyan = UIColor(red: 0.0, green: 1.0, blue: 0.9, alpha: 1.0)

    /// Neon pink/magenta for subtitles (#FF5CAD)
    static let neonPink = UIColor(red: 1.0, green: 0.36, blue: 0.68, alpha: 1.0)

    /// Electric purple for button (#7B2FFF)
    static let electricPurple = UIColor(red: 0.48, green: 0.18, blue: 1.0, alpha: 1.0)

    /// Near-black with deep blue undertone (#06010F)
    static let background = UIColor(red: 0.024, green: 0.004, blue: 0.06, alpha: 0.97)
}
