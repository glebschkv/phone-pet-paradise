import ManagedSettings
import ManagedSettingsUI
import UIKit
import os.log

private let log = OSLog(subsystem: "co.nomoinc.nomo.ShieldConfiguration", category: "Shield")

/// Custom shield shown when a user tries to open a blocked app.
/// Neon-branded design matching the app's splash screen aesthetic.
/// NOTE: Do NOT import FamilyControls here — it crashes the extension on launch.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    private let helper = ShieldConfigurationHelper()

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        os_log("SHIELD: config for app: %{public}@", log: log, type: .fault, application.localizedDisplayName ?? "unknown")
        helper.recordShieldAttempt()
        return makeConfig()
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        os_log("SHIELD: config for app in category", log: log, type: .fault)
        helper.recordShieldAttempt()
        return makeConfig()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        os_log("SHIELD: config for domain", log: log, type: .fault)
        helper.recordShieldAttempt()
        return makeConfig()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        os_log("SHIELD: config for domain in category", log: log, type: .fault)
        helper.recordShieldAttempt()
        return makeConfig()
    }

    private func makeConfig() -> ShieldConfiguration {
        let message = helper.getMotivationalMessage()

        return ShieldConfiguration(
            backgroundBlurStyle: .systemThickMaterialDark,
            backgroundColor: ShieldConfigurationHelper.shieldBackgroundColor,
            icon: helper.createNoMoIcon(),
            title: ShieldConfiguration.Label(
                text: message,
                color: ShieldConfigurationHelper.shieldTitleColor
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Focus session in progress",
                color: ShieldConfigurationHelper.shieldSubtitleColor
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Back to NoMo",
                color: .white
            ),
            primaryButtonBackgroundColor: ShieldConfigurationHelper.shieldButtonColor,
            secondaryButtonLabel: nil
        )
    }
}
