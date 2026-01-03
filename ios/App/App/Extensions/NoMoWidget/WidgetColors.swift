import SwiftUI

/**
 * WidgetColors
 *
 * Centralized color definitions for widget UI.
 * Matches the app's purple theme.
 */
enum WidgetColors {
    /// Widget background gradient
    static let background = LinearGradient(
        colors: [
            Color(red: 0.1, green: 0.05, blue: 0.2),
            Color(red: 0.15, green: 0.08, blue: 0.25)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Primary accent color (purple)
    static let accent = Color(red: 0.6, green: 0.4, blue: 0.9)

    /// Secondary text color
    static let secondary = Color(red: 0.7, green: 0.6, blue: 0.9)

    /// Tertiary text color
    static let tertiary = Color(red: 0.5, green: 0.45, blue: 0.6)

    /// Progress bar background
    static let progressBackground = Color(red: 0.2, green: 0.15, blue: 0.3)

    /// Success color
    static let success = Color.green

    /// Warning color
    static let warning = Color.orange
}
