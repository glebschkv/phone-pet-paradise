import Foundation
import UIKit

/**
 * HapticFeedbackManager
 *
 * Provides haptic feedback functionality with various styles.
 * Ensures feedback is triggered on the main thread.
 */
final class HapticFeedbackManager: HapticFeedbackProviding {

    // MARK: - Singleton

    static let shared = HapticFeedbackManager()

    // MARK: - Initialization

    init() {
        Log.app.debug("HapticFeedbackManager initialized")
    }

    // MARK: - Trigger Feedback

    @MainActor
    func triggerFeedback(style: HapticStyle) {
        switch style {
        case .light:
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case .medium:
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case .heavy:
            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case .success:
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        case .warning:
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
        case .error:
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }

        Log.app.debug("Haptic feedback triggered: \(style.rawValue)")
    }

    /// Async version for use in Task contexts
    func triggerFeedbackAsync(style: HapticStyle) async {
        await MainActor.run {
            triggerFeedback(style: style)
        }
    }
}

// MARK: - Style Parsing

extension HapticFeedbackManager {
    /// Parses a string into a HapticStyle, defaulting to medium
    static func parseStyle(_ string: String?) -> HapticStyle {
        guard let string = string else { return .medium }
        return HapticStyle(rawValue: string) ?? .medium
    }
}
