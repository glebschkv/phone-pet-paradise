import FamilyControls
import ManagedSettings
import ManagedSettingsUI
import UIKit
import os.log

private let log = OSLog(subsystem: "co.nomoinc.nomo.ShieldConfiguration", category: "Shield")

class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    private let helper = ShieldConfigurationHelper()

    override init() {
        super.init()
        let bundleID = Bundle.main.bundleIdentifier ?? "unknown"
        let moduleName = String(reflecting: type(of: self)).components(separatedBy: ".").first ?? "unknown"
        os_log("SHIELD EXTENSION INIT - bundle: %{public}@, module: %{public}@", log: log, type: .fault, bundleID, moduleName)
    }

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        os_log("SHIELD: shielding app: %{public}@", log: log, type: .fault, application.localizedDisplayName ?? "unknown")
        helper.recordShieldAttempt()
        return makeConfig()
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        os_log("SHIELD: shielding app in category", log: log, type: .fault)
        helper.recordShieldAttempt()
        return makeConfig()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        os_log("SHIELD: shielding web domain", log: log, type: .fault)
        helper.recordShieldAttempt()
        return makeConfig()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        os_log("SHIELD: shielding web domain in category", log: log, type: .fault)
        helper.recordShieldAttempt()
        return makeConfig()
    }

    private func makeConfig() -> ShieldConfiguration {
        let message = helper.getMotivationalMessage()
        os_log("SHIELD: makeConfig - message: %{public}@", log: log, type: .fault, message)

        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: ShieldConfigurationHelper.shieldBackgroundColor,
            icon: helper.createNoMoIcon(),
            title: ShieldConfiguration.Label(
                text: "Stay Focused!",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: message,
                color: ShieldConfigurationHelper.shieldSubtitleColor
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Return to NoMo",
                color: .white
            ),
            primaryButtonBackgroundColor: ShieldConfigurationHelper.shieldButtonColor,
            secondaryButtonLabel: nil
        )
    }
}
