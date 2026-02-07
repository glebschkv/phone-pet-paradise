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
        "You set this up yourself. Think about that.",
        "This app will still be here later. So will your regret.",
        "Nothing on this app is more important than what you're supposed to be doing.",
        "The people who built this app want you to open it. We don't.",
        "Your pet is growing while you're not looking. Don't ruin that.",
        "You were doing so well. Keep going.",
        "Three minutes from now you won't even remember why you wanted this.",
        "This is the part where the main character puts the phone down.",
        "Your focus session called. It misses you.",
        "Somewhere in a parallel universe, you didn't tap this. Be that person.",
        "The notification can wait. It's never as urgent as it feels.",
        "Plot twist: the app you actually need is already open.",
        "You're not bored. You're avoiding something. Go do that thing instead.",
        "Every second you spend here is a second your pet doesn't get.",
        "This is a sign. Not a metaphorical one. A literal one. Go back.",
        "Fun fact: the average person checks their phone 96 times a day. Be below average.",
        "Whatever you were about to scroll through, it wasn't worth it.",
        "Your screen time report will remember this. Even if you won't.",
        "Close your eyes. Take a breath. Now go do literally anything else.",
        "The best version of you doesn't need to open this right now.",
    ]

    func getMotivationalMessage() -> String {
        Self.shieldMessages.randomElement() ?? Self.shieldMessages[0]
    }

    func getAllMotivationalMessages() -> [String] {
        Self.shieldMessages
    }

    // MARK: - Title

    func getTitle() -> String {
        return "NOMO"
    }

    // MARK: - Neon NOMO Icon

    /// Creates a large glowing "NOMO" neon sign icon with radial glow backdrop.
    /// Matches the app's splash screen aesthetic with layered Core Graphics glow.
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

            // Radial glow backdrop — soft purple light cone behind the text
            let center = CGPoint(x: size.width / 2, y: size.height / 2)
            let radius = size.width * 0.45
            let colorSpace = CGColorSpaceCreateDeviceRGB()
            let glowColors = [
                NeonColors.purple.withAlphaComponent(0.18).cgColor,
                NeonColors.purple.withAlphaComponent(0.06).cgColor,
                UIColor.clear.cgColor,
            ] as CFArray
            let locations: [CGFloat] = [0.0, 0.5, 1.0]
            if let gradient = CGGradient(colorsSpace: colorSpace, colors: glowColors, locations: locations) {
                context.drawRadialGradient(
                    gradient,
                    startCenter: center, startRadius: 0,
                    endCenter: center, endRadius: radius,
                    options: .drawsAfterEndLocation
                )
            }

            // Text setup — SF Pro Rounded Heavy, wide kerning
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

    // MARK: - Secondary Button

    static let secondaryButtonTexts = [
        "I can wait",
        "Fine.",
        "You're right",
        "Fair enough",
    ]

    func getSecondaryButtonText() -> String {
        Self.secondaryButtonTexts.randomElement() ?? Self.secondaryButtonTexts[0]
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

    /// Bright lavender subtitle — readable enough to screenshot
    static let subtitleColor = UIColor(red: 215/255, green: 195/255, blue: 245/255, alpha: 1.0)

    /// Deep dark purple background — matches splash #080012
    static let background = UIColor(red: 8/255, green: 0, blue: 18/255, alpha: 0.97)
}
