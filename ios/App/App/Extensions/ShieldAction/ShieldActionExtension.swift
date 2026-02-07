import ManagedSettings
import ManagedSettingsUI
import UIKit

/// Handles button taps on the shield overlay.
/// Both primary ("Back to NoMo") and secondary button close the blocked app.
/// NOTE: Do NOT import FamilyControls here — it crashes the extension on launch.
class ShieldActionExtension: ShieldActionDelegate {

    func handle(
        action: ShieldAction,
        for application: Application,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        completionHandler(.close)
    }

    func handle(
        action: ShieldAction,
        for webDomain: WebDomain,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        completionHandler(.close)
    }

    func handle(
        action: ShieldAction,
        for category: ActivityCategory,
        completionHandler: @escaping (ShieldActionResponse) -> Void
    ) {
        completionHandler(.close)
    }
}
