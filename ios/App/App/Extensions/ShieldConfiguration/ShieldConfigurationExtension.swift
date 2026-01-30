import ManagedSettings
import ManagedSettingsUI
import UIKit
import os.log

// MARK: - Shield Configuration Extension
// This extension provides custom UI for blocked apps during focus sessions

private let shieldLog = OSLog(subsystem: "co.nomoinc.nomo.ShieldConfiguration", category: "ShieldConfig")

class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    override init() {
        os_log("ShieldConfigurationExtension INIT called", log: shieldLog, type: .default)
        super.init()
    }

    // MARK: - Shield Configuration for Applications

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        os_log("configuration(shielding application) called: %{public}@", log: shieldLog, type: .default, application.localizedDisplayName ?? "unknown")
        return createFocusShieldConfiguration(
            title: "Stay Focused!",
            subtitle: application.localizedDisplayName ?? "This app is blocked"
        )
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        os_log("configuration(shielding application in category) called: %{public}@", log: shieldLog, type: .default, category.localizedDisplayName ?? "unknown")
        return createFocusShieldConfiguration(
            title: "Stay Focused!",
            subtitle: "\(category.localizedDisplayName ?? "This category") is blocked during your focus session"
        )
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        os_log("configuration(shielding webDomain) called: %{public}@", log: shieldLog, type: .default, webDomain.domain ?? "unknown")
        return createFocusShieldConfiguration(
            title: "Stay Focused!",
            subtitle: "\(webDomain.domain ?? "This website") is blocked during your focus session"
        )
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        os_log("configuration(shielding webDomain in category) called", log: shieldLog, type: .default)
        return createFocusShieldConfiguration(
            title: "Stay Focused!",
            subtitle: "Web browsing in \(category.localizedDisplayName ?? "this category") is blocked"
        )
    }

    // MARK: - Create Shield Configuration

    private func createFocusShieldConfiguration(title: String, subtitle: String) -> ShieldConfiguration {
        os_log("createFocusShieldConfiguration called - title: %{public}@, subtitle: %{public}@", log: shieldLog, type: .default, title, subtitle)

        // Record that user attempted to open a blocked app
        let helper = ShieldConfigurationHelper()
        os_log("ShieldConfigurationHelper created successfully", log: shieldLog, type: .default)

        helper.recordShieldAttempt()
        os_log("Shield attempt recorded, total: %d", log: shieldLog, type: .default, helper.shieldAttempts)

        // Get motivational message
        let motivationalMessage = helper.getMotivationalMessage()
        os_log("Motivational message: %{public}@", log: shieldLog, type: .default, motivationalMessage)

        let icon = helper.createNoMoIcon()
        os_log("Icon created: %{public}@", log: shieldLog, type: .default, icon != nil ? "YES" : "NO")

        let config = ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: ShieldConfigurationHelper.shieldBackgroundColor,
            icon: icon,
            title: ShieldConfiguration.Label(
                text: title,
                color: UIColor.white
            ),
            subtitle: ShieldConfiguration.Label(
                text: motivationalMessage,
                color: ShieldConfigurationHelper.shieldSubtitleColor
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Return to NoMo",
                color: UIColor.white
            ),
            primaryButtonBackgroundColor: ShieldConfigurationHelper.shieldButtonColor,
            secondaryButtonLabel: nil
        )
        os_log("ShieldConfiguration created successfully, returning", log: shieldLog, type: .default)
        return config
    }
}
