import Foundation
import FamilyControls
import ManagedSettings

/**
 * AppBlockingManager
 *
 * Manages app blocking using ManagedSettings shield functionality.
 * Handles app selection storage and shield application.
 */
@available(iOS 15.0, *)
final class AppBlockingManager: AppBlockingManaging {

    // MARK: - Singleton

    static let shared = AppBlockingManager()

    // MARK: - Properties

    private let store: ManagedSettingsStore
    private let focusDataManager: FocusDataManager
    private let userDefaults: UserDefaults?

    // MARK: - Initialization

    init(
        store: ManagedSettingsStore = ManagedSettingsStore(),
        focusDataManager: FocusDataManager = .shared,
        userDefaults: UserDefaults? = nil
    ) {
        self.store = store
        self.focusDataManager = focusDataManager
        self.userDefaults = userDefaults ?? AppConfig.sharedUserDefaults
        Log.blocking.debug("AppBlockingManager initialized")
    }

    // MARK: - Blocking Status

    var isBlocking: Bool {
        focusDataManager.isFocusSessionActive && hasAppsConfigured
    }

    var hasAppsConfigured: Bool {
        guard let apps = store.shield.applications else { return false }
        return !apps.isEmpty
    }

    // MARK: - Start Blocking

    func startBlocking() throws -> BlockingResult {
        Log.blocking.operationStart("startBlocking")

        // Start focus session
        focusDataManager.startSession()

        // Load and apply selection
        guard let selectionData = userDefaults?.data(forKey: AppConfig.StorageKeys.blockedAppsSelection) else {
            Log.blocking.info("No apps configured for blocking")
            return BlockingResult(
                success: true,
                appsBlocked: 0,
                categoriesBlocked: 0,
                domainsBlocked: 0,
                shieldAttempts: 0,
                note: "No apps configured for blocking"
            )
        }

        do {
            let selection = try JSONDecoder().decode(FamilyActivitySelection.self, from: selectionData)
            return applyShields(selection: selection)
        } catch {
            Log.blocking.warning("Failed to decode selection, continuing without shields: \(error)")
            return BlockingResult(
                success: true,
                appsBlocked: 0,
                categoriesBlocked: 0,
                domainsBlocked: 0,
                shieldAttempts: 0,
                note: "Selection decode failed, no apps blocked"
            )
        }
    }

    private func applyShields(selection: FamilyActivitySelection) -> BlockingResult {
        store.shield.applications = selection.applicationTokens
        store.shield.applicationCategories = .specific(selection.categoryTokens)
        store.shield.webDomains = selection.webDomainTokens

        let result = BlockingResult(
            success: true,
            appsBlocked: selection.applicationTokens.count,
            categoriesBlocked: selection.categoryTokens.count,
            domainsBlocked: selection.webDomainTokens.count,
            shieldAttempts: 0,
            note: nil
        )

        Log.blocking.success("Shields applied: \(result.appsBlocked) apps, \(result.categoriesBlocked) categories, \(result.domainsBlocked) domains")
        return result
    }

    // MARK: - Stop Blocking

    func stopBlocking() -> BlockingResult {
        Log.blocking.operationStart("stopBlocking")

        let attempts = focusDataManager.endSession()
        clearShields()

        Log.blocking.success("Blocking stopped with \(attempts) shield attempts")
        return BlockingResult(
            success: true,
            appsBlocked: 0,
            categoriesBlocked: 0,
            domainsBlocked: 0,
            shieldAttempts: attempts,
            note: nil
        )
    }

    private func clearShields() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
    }

    // MARK: - Blocking Status

    func getBlockingStatus() -> BlockingStatus {
        BlockingStatus(
            isBlocking: isBlocking,
            focusSessionActive: focusDataManager.isFocusSessionActive,
            shieldAttempts: focusDataManager.shieldAttempts,
            lastShieldAttemptTimestamp: focusDataManager.lastShieldAttemptTimestamp,
            hasAppsConfigured: hasAppsConfigured
        )
    }

    // MARK: - Selection Management

    func saveSelection(_ data: String) throws {
        guard let userDefaults = userDefaults else {
            throw PluginError.sharedContainerUnavailable
        }
        userDefaults.set(data, forKey: AppConfig.StorageKeys.blockedAppsSelection)
        Log.blocking.info("Selection saved")
    }

    func loadSelection() -> String? {
        userDefaults?.string(forKey: AppConfig.StorageKeys.blockedAppsSelection)
    }

    func clearSelection() {
        userDefaults?.removeObject(forKey: AppConfig.StorageKeys.blockedAppsSelection)
        clearShields()
        Log.blocking.info("Selection cleared")
    }
}
