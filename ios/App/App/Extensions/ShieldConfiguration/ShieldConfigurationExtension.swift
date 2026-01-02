import ManagedSettings
import ManagedSettingsUI
import UIKit

// MARK: - Shield Configuration Extension
// This extension provides custom UI for blocked apps during focus sessions

class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    private let helper = ShieldConfigurationHelper()

    // MARK: - Shield Configuration for Applications

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return createFocusShieldConfiguration(
            title: "Stay Focused!",
            subtitle: application.localizedDisplayName ?? "This app is blocked"
        )
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        return createFocusShieldConfiguration(
            title: "Stay Focused!",
            subtitle: "\(category.localizedDisplayName ?? "This category") is blocked during your focus session"
        )
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        return createFocusShieldConfiguration(
            title: "Stay Focused!",
            subtitle: "\(webDomain.domain ?? "This website") is blocked during your focus session"
        )
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        return createFocusShieldConfiguration(
            title: "Stay Focused!",
            subtitle: "Web browsing in \(category.localizedDisplayName ?? "this category") is blocked"
        )
    }

    // MARK: - Create Shield Configuration

    private func createFocusShieldConfiguration(title: String, subtitle: String) -> ShieldConfiguration {
        // Record that user attempted to open a blocked app
        helper.recordShieldAttempt()

        // Get motivational message
        let motivationalMessage = helper.getMotivationalMessage()

        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: ShieldConfigurationHelper.shieldBackgroundColor,
            icon: helper.createNoMoIcon(),
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
    }
}
