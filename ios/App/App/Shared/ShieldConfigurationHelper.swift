import Foundation
import UIKit

/// Helper for the ShieldConfiguration extension.
/// Neon-branded shield matching the app's splash screen aesthetic.
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
            "NOMO",
            "App Blocked",
            "Stay Focused",
            "Not Now",
            "Nope.",
        ]
        return titles.randomElement() ?? titles[0]
    }

    // MARK: - Neon NOMO Icon

    /// Creates a glowing "NOMO" text icon matching the app's splash screen neon aesthetic.
    /// Uses Core Graphics shadow passes to build up a realistic neon glow effect.
    func createNoMoIcon() -> UIImage? {
        let size = CGSize(width: 140, height: 70)
        let renderer = UIGraphicsImageRenderer(size: size, format: {
            let format = UIGraphicsImageRendererFormat()
            format.scale = 3.0
            return format
        }())

        return renderer.image { ctx in
            let context = ctx.cgContext

            // Text setup — match splash screen: SF Pro Rounded, Heavy
            let text = "NOMO"
            let fontSize: CGFloat = 32
            let font: UIFont
            if let desc = UIFont.systemFont(ofSize: fontSize, weight: .heavy)
                        .fontDescriptor.withDesign(.rounded) {
                font = UIFont(descriptor: desc, size: fontSize)
            } else {
                font = UIFont.systemFont(ofSize: fontSize, weight: .heavy)
            }

            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = .center

            let attributes: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: NeonColors.textColor,
                .kern: 8.0,
                .paragraphStyle: paragraphStyle,
            ]

            let attrString = NSAttributedString(string: text, attributes: attributes)
            let textSize = attrString.size()
            let textRect = CGRect(
                x: (size.width - textSize.width) / 2,
                y: (size.height - textSize.height) / 2,
                width: textSize.width,
                height: textSize.height
            )

            // Build neon glow with multiple shadow passes (outer → inner)
            // Pass 1: Wide outer glow
            context.saveGState()
            context.setShadow(offset: .zero, blur: 24, color: NeonColors.purple.withAlphaComponent(0.35).cgColor)
            attrString.draw(in: textRect)
            context.restoreGState()

            // Pass 2: Medium glow
            context.saveGState()
            context.setShadow(offset: .zero, blur: 14, color: NeonColors.purple.withAlphaComponent(0.55).cgColor)
            attrString.draw(in: textRect)
            context.restoreGState()

            // Pass 3: Tight inner glow
            context.saveGState()
            context.setShadow(offset: .zero, blur: 6, color: NeonColors.purpleLight.withAlphaComponent(0.7).cgColor)
            attrString.draw(in: textRect)
            context.restoreGState()

            // Final crisp text pass (no shadow)
            attrString.draw(in: textRect)
        }
    }

    // MARK: - Colors

    static var shieldBackgroundColor: UIColor { NeonColors.background }
    static var shieldTitleColor: UIColor { NeonColors.textColor }
    static var shieldSubtitleColor: UIColor { NeonColors.subtitleColor }
    static var shieldButtonColor: UIColor { NeonColors.purple }

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

// MARK: - Neon Color Palette (matches splash screen)

private enum NeonColors {
    /// Purple accent — matches splash #a855f7
    static let purple = UIColor(red: 168/255, green: 85/255, blue: 247/255, alpha: 1.0)

    /// Light purple — matches splash #c084fc
    static let purpleLight = UIColor(red: 192/255, green: 132/255, blue: 252/255, alpha: 1.0)

    /// Near-white text — matches splash #f0e6ff
    static let textColor = UIColor(red: 240/255, green: 230/255, blue: 255/255, alpha: 1.0)

    /// Soft purple subtitle — visible but not competing with title
    static let subtitleColor = UIColor(red: 180/255, green: 150/255, blue: 220/255, alpha: 1.0)

    /// Deep dark purple background — matches splash #080012
    static let background = UIColor(red: 8/255, green: 0, blue: 18/255, alpha: 0.97)
}
