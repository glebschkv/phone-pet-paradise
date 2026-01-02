import ManagedSettings
import ManagedSettingsUI
import UIKit

// MARK: - Shield Configuration Extension
// This extension provides custom UI for blocked apps during focus sessions

class ShieldConfigurationExtension: ShieldConfigurationDataSource {

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
        recordShieldAttempt()

        // Get motivational message
        let motivationalMessage = getMotivationalMessage()

        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.1, green: 0.05, blue: 0.15, alpha: 0.95),
            icon: createNoMoIcon(),
            title: ShieldConfiguration.Label(
                text: title,
                color: UIColor.white
            ),
            subtitle: ShieldConfiguration.Label(
                text: motivationalMessage,
                color: UIColor(red: 0.7, green: 0.6, blue: 0.9, alpha: 1.0)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Return to NoMo",
                color: UIColor.white
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.5, green: 0.3, blue: 0.8, alpha: 1.0),
            secondaryButtonLabel: nil
        )
    }

    // MARK: - Helpers

    private func createNoMoIcon() -> UIImage? {
        // Create a simple focus icon using SF Symbols
        let config = UIImage.SymbolConfiguration(pointSize: 60, weight: .bold)
        return UIImage(systemName: "moon.stars.fill", withConfiguration: config)?
            .withTintColor(UIColor(red: 0.8, green: 0.6, blue: 1.0, alpha: 1.0), renderingMode: .alwaysOriginal)
    }

    private func recordShieldAttempt() {
        guard let userDefaults = SharedConstants.sharedUserDefaults else { return }

        let currentAttempts = userDefaults.integer(forKey: SharedConstants.StorageKeys.shieldAttempts)
        userDefaults.set(currentAttempts + 1, forKey: SharedConstants.StorageKeys.shieldAttempts)
        userDefaults.set(Date().timeIntervalSince1970, forKey: SharedConstants.StorageKeys.lastShieldAttempt)
    }

    private func getMotivationalMessage() -> String {
        let messages = [
            "Your focus pet is counting on you!",
            "Stay strong - your future self will thank you!",
            "Every minute of focus earns you rewards!",
            "You're doing great! Keep focusing!",
            "Distractions can wait - your goals can't!",
            "Focus now, scroll later!",
            "Your streak depends on you!",
            "Almost there! Don't give up now!",
            "Focus = XP = Level Up!",
            "Your pet believes in you!"
        ]
        return messages.randomElement() ?? messages[0]
    }
}
