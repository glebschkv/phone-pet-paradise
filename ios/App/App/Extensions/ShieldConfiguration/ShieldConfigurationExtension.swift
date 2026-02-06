import ManagedSettings
import ManagedSettingsUI
import UIKit
import os.log

private let log = OSLog(subsystem: "co.nomoinc.nomo.ShieldConfiguration", category: "Shield")

// Minimal ShieldConfiguration extension - stripped down for debugging.
// If this still crashes, the issue is signing/provisioning, not code.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        os_log("SHIELD: config for app", log: log, type: .fault)
        return makeConfig()
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        os_log("SHIELD: config for app in category", log: log, type: .fault)
        return makeConfig()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        os_log("SHIELD: config for domain", log: log, type: .fault)
        return makeConfig()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        os_log("SHIELD: config for domain in category", log: log, type: .fault)
        return makeConfig()
    }

    private func makeConfig() -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.1, green: 0.05, blue: 0.15, alpha: 0.95),
            title: ShieldConfiguration.Label(
                text: "Stay Focused!",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "Your focus pet is counting on you!",
                color: UIColor(red: 0.8, green: 0.7, blue: 0.9, alpha: 1.0)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Return to NoMo",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.5, green: 0.3, blue: 0.8, alpha: 1.0)
        )
    }
}
