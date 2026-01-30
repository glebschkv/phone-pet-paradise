import ManagedSettings
import ManagedSettingsUI
import UIKit
import os.log

// Minimal ShieldConfiguration extension for debugging
// No dependencies on helper classes or shared constants

private let log = OSLog(subsystem: "co.nomoinc.nomo.shield", category: "Shield")

class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    override init() {
        os_log("SHIELD EXTENSION INIT", log: log, type: .fault)
        super.init()
    }

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        os_log("SHIELD: shielding app: %{public}@", log: log, type: .fault, application.localizedDisplayName ?? "unknown")
        return makeConfig()
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        os_log("SHIELD: shielding app in category", log: log, type: .fault)
        return makeConfig()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        os_log("SHIELD: shielding web domain", log: log, type: .fault)
        return makeConfig()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        os_log("SHIELD: shielding web domain in category", log: log, type: .fault)
        return makeConfig()
    }

    private func makeConfig() -> ShieldConfiguration {
        os_log("SHIELD: makeConfig called", log: log, type: .fault)
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.1, green: 0.05, blue: 0.15, alpha: 0.95),
            icon: UIImage(systemName: "moon.stars.fill"),
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
            primaryButtonBackgroundColor: UIColor(red: 0.5, green: 0.3, blue: 0.8, alpha: 1.0),
            secondaryButtonLabel: nil
        )
    }
}
