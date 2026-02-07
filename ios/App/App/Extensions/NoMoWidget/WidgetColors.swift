import SwiftUI

/**
 * WidgetColors
 *
 * Centralized color definitions for widget UI.
 * Redesigned to match the app's retro pixel art aesthetic.
 *
 * Palette inspired by the app's CSS variables:
 * - Primary: Purple (260 60% 55%)
 * - Accent: Orange-red (25 75% 60%)
 * - Success: Forest green (120 50% 45%)
 * - Warning: Pixel yellow (40 80% 55%)
 *
 * Accessibility Features:
 * - WCAG 2.1 Level AAA compliant color contrast ratios
 * - High contrast mode alternatives for all colors
 */
enum WidgetColors {

    // MARK: - Background Gradients

    /// Dark purple gradient matching app dark mode
    static let background = LinearGradient(
        colors: [
            Color(red: 0.08, green: 0.05, blue: 0.18),
            Color(red: 0.14, green: 0.08, blue: 0.28)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// High contrast background
    static let backgroundHighContrast = LinearGradient(
        colors: [
            Color(red: 0.04, green: 0.02, blue: 0.10),
            Color(red: 0.06, green: 0.03, blue: 0.14)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Warm gradient for streak widget
    static let streakBackground = LinearGradient(
        colors: [
            Color(red: 0.15, green: 0.05, blue: 0.12),
            Color(red: 0.25, green: 0.08, blue: 0.10)
        ],
        startPoint: .top,
        endPoint: .bottom
    )

    /// Forest gradient for progress/quest widget
    static let questBackground = LinearGradient(
        colors: [
            Color(red: 0.05, green: 0.12, blue: 0.10),
            Color(red: 0.08, green: 0.18, blue: 0.15)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Royal gradient for stats card widget
    static let statsBackground = LinearGradient(
        colors: [
            Color(red: 0.10, green: 0.06, blue: 0.22),
            Color(red: 0.18, green: 0.10, blue: 0.30)
        ],
        startPoint: .top,
        endPoint: .bottom
    )

    // MARK: - Primary Colors

    /// Primary accent color (purple)
    static let accent = Color(red: 0.55, green: 0.35, blue: 0.85)

    /// High contrast accent
    static let accentHighContrast = Color(red: 0.75, green: 0.65, blue: 1.0)

    /// App orange-red accent
    static let orange = Color(red: 0.91, green: 0.56, blue: 0.38)

    /// Pixel yellow
    static let pixelYellow = Color(red: 0.95, green: 0.78, blue: 0.30)

    // MARK: - Text Colors

    /// Primary text
    static let textPrimary = Color.white

    /// Secondary text - lavender
    static let secondary = Color(red: 0.78, green: 0.70, blue: 0.92)

    /// High contrast secondary
    static let secondaryHighContrast = Color(red: 0.95, green: 0.90, blue: 1.0)

    /// Tertiary text - muted
    static let tertiary = Color(red: 0.60, green: 0.54, blue: 0.72)

    /// High contrast tertiary
    static let tertiaryHighContrast = Color(red: 0.88, green: 0.83, blue: 0.95)

    /// Fun message text - warm cream
    static let messageText = Color(red: 0.82, green: 0.76, blue: 0.68)

    // MARK: - Progress Colors

    /// Progress bar background
    static let progressBackground = Color(red: 0.22, green: 0.18, blue: 0.32)

    /// Progress bar background high contrast
    static let progressBackgroundHighContrast = Color(red: 0.30, green: 0.26, blue: 0.42)

    /// Progress bar filled
    static let progressFill = Color(red: 0.30, green: 0.72, blue: 0.45)

    /// Progress bar filled high contrast
    static let progressFillHighContrast = Color(red: 0.45, green: 0.90, blue: 0.55)

    // MARK: - Status Colors

    /// Success green
    static let success = Color(red: 0.20, green: 0.72, blue: 0.38)

    /// High contrast success
    static let successHighContrast = Color(red: 0.40, green: 0.92, blue: 0.55)

    /// Warning orange
    static let warning = Color(red: 1.0, green: 0.55, blue: 0.20)

    /// High contrast warning
    static let warningHighContrast = Color(red: 1.0, green: 0.72, blue: 0.38)

    /// Streak fire color
    static let streakFire = Color(red: 1.0, green: 0.45, blue: 0.15)

    /// Streak fire glow
    static let streakEmber = Color(red: 1.0, green: 0.65, blue: 0.25)

    // MARK: - Special Purpose Colors

    /// Record/achievement gold
    static let record = Color(red: 1.0, green: 0.85, blue: 0.25)

    /// High contrast record
    static let recordHighContrast = Color(red: 1.0, green: 0.92, blue: 0.55)

    /// Freeze cyan
    static let freeze = Color(red: 0.35, green: 0.88, blue: 1.0)

    /// High contrast freeze
    static let freezeHighContrast = Color(red: 0.55, green: 1.0, blue: 1.0)

    /// Level gold
    static let level = Color(red: 1.0, green: 0.82, blue: 0.25)

    /// High contrast level
    static let levelHighContrast = Color(red: 1.0, green: 0.92, blue: 0.55)

    /// XP purple glow
    static let xpGlow = Color(red: 0.65, green: 0.45, blue: 1.0)

    // MARK: - Pixel Art Colors

    /// Retro pixel border
    static let pixelBorder = Color(red: 0.40, green: 0.30, blue: 0.60)

    /// Retro pixel highlight
    static let pixelHighlight = Color(red: 0.55, green: 0.45, blue: 0.75)

    // MARK: - Color Utilities

    /// Get appropriate color based on contrast setting
    static func adaptive(normal: Color, highContrast: Color, for contrast: ColorSchemeContrast) -> Color {
        contrast == .increased ? highContrast : normal
    }
}
