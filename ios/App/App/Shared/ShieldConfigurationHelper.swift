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
        "POV: you thought you were stronger than your screen time.",
        "Blocked. Ratio'd. Denied. Go outside.",
        "This app misses you. That's manipulative. Stay here.",
        "Plot twist: the app you actually need is already open.",
        "Your future self just mass-reported this attempt.",
        "Average 'just checking real quick' enjoyer.",
        "No thoughts, just blocked.",
        "You vs. your focus timer. Score: 0-1.",
        "siri, how do i stop being chronically online",
        "This is your villain origin story. Choose wisely.",
        "Your pet watched you tap that. It's disappointed.",
        "Caught in 4K. Go do something with your life.",
        "The group chat can wait. It's just someone typing '💀' anyway.",
        "Alexa, play 'Locked Out Of Heaven'.",
        "You've been gnomed. Go be productive.",
        "Touch grass. Digital grass doesn't count.",
        "This screen time intervention is brought to you by: your own decisions.",
        "You literally set this up yourself and you're still trying.",
        "Your phone needed a break from you anyway.",
        "Somewhere, a pixel pet believes in you more than you believe in yourself.",
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

    /// Creates a large glowing "NOMO" text icon matching the app's splash screen neon aesthetic.
    /// Uses Core Graphics shadow passes to build up a realistic neon glow effect.
    /// Rendered at 240x120pt @3x (720x360px) for maximum visual impact.
    func createNoMoIcon() -> UIImage? {
        let size = CGSize(width: 240, height: 120)
        let renderer = UIGraphicsImageRenderer(size: size, format: {
            let format = UIGraphicsImageRendererFormat()
            format.scale = 3.0
            return format
        }())

        return renderer.image { ctx in
            let context = ctx.cgContext

            // Text setup — match splash screen: SF Pro Rounded, Heavy, wide kerning
            let text = "NOMO"
            let fontSize: CGFloat = 52
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
                .kern: 14.0,
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

            // Build neon glow with 5 shadow passes for a rich, layered effect
            // Pass 1: Wide ambient glow
            context.saveGState()
            context.setShadow(offset: .zero, blur: 36, color: NeonColors.purple.withAlphaComponent(0.25).cgColor)
            attrString.draw(in: textRect)
            context.restoreGState()

            // Pass 2: Outer glow
            context.saveGState()
            context.setShadow(offset: .zero, blur: 22, color: NeonColors.purple.withAlphaComponent(0.4).cgColor)
            attrString.draw(in: textRect)
            context.restoreGState()

            // Pass 3: Mid glow
            context.saveGState()
            context.setShadow(offset: .zero, blur: 14, color: NeonColors.purple.withAlphaComponent(0.6).cgColor)
            attrString.draw(in: textRect)
            context.restoreGState()

            // Pass 4: Inner glow (lighter purple for hot center)
            context.saveGState()
            context.setShadow(offset: .zero, blur: 6, color: NeonColors.purpleLight.withAlphaComponent(0.8).cgColor)
            attrString.draw(in: textRect)
            context.restoreGState()

            // Pass 5: Bright core halo
            context.saveGState()
            context.setShadow(offset: .zero, blur: 2, color: UIColor.white.withAlphaComponent(0.3).cgColor)
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
