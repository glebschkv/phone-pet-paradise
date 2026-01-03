import SwiftUI
import WidgetKit

/**
 * NoMoWidgetBundle
 *
 * Main entry point for all NoMo widgets.
 * Bundles together Timer, Streak, Progress, and Stats widgets.
 */
@main
struct NoMoWidgetBundle: WidgetBundle {
    var body: some Widget {
        NoMoTimerWidget()
        NoMoStreakWidget()
        NoMoProgressWidget()
        NoMoStatsWidget()
    }
}
