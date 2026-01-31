import Foundation
import FamilyControls
import ManagedSettings

/**
 * AppBlockingManager
 *
 * Manages app blocking using ManagedSettings shield functionality.
 * Handles app selection storage and shield application.
 *
 * Note: ManagedSettingsStore requires the managed-settings entitlement which
 * is only available in app extensions. The main app creates this manager but
 * the store may be nil if the entitlement is missing. All store access is guarded.
 */
@available(iOS 15.0, *)
final class AppBlockingManager: AppBlockingManaging {

    // MARK: - Singleton

    static let shared = AppBlockingManager()

    // MARK: - Properties

    /// ManagedSettingsStore is optional because it requires the managed-settings
    /// entitlement which is only available in app extensions, not the main app.
    /// Creating ManagedSettingsStore() without the entitlement causes a crash,
    /// so we only create it when running inside an extension.
    private var store: ManagedSettingsStore?
    private let focusDataManager: FocusDataManager
    private let userDefaults: UserDefaults?

    // MARK: - Initialization

    init(
        store: ManagedSettingsStore? = nil,
        focusDataManager: FocusDataManager = .shared,
        userDefaults: UserDefaults? = nil
    ) {
        // ManagedSettingsStore works in both the main app and extensions
        // as long as the Family Controls entitlement is present.
        if let store = store {
            self.store = store
        } else {
            self.store = ManagedSettingsStore()
        }
        self.focusDataManager = focusDataManager
        self.userDefaults = userDefaults ?? AppConfig.sharedUserDefaults
        Log.blocking.debug("AppBlockingManager initialized (store available: \(self.store != nil))")
    }

    // MARK: - Blocking Status

    var isBlocking: Bool {
        focusDataManager.isFocusSessionActive && hasAppsConfigured
    }

    var hasAppsConfigured: Bool {
        // Check if shields are currently applied on the store
        if let store = store,
           let apps = store.shield.applications,
           !apps.isEmpty {
            return true
        }
        // Also check if there's a saved selection (apps picked but session not started yet)
        return userDefaults?.data(forKey: AppConfig.StorageKeys.blockedAppsSelection) != nil
    }

    // MARK: - Start Blocking

    func startBlocking() throws -> BlockingResult {
        Log.blocking.operationStart("startBlocking")

        // Start focus session
        focusDataManager.startSession()

        guard let store = store else {
            Log.blocking.warning("ManagedSettingsStore not available - entitlement may be missing")
            return BlockingResult(
                success: false,
                appsBlocked: 0,
                categoriesBlocked: 0,
                domainsBlocked: 0,
                shieldAttempts: 0,
                note: "ManagedSettings not available in main app"
            )
        }

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
            return applyShields(store: store, selection: selection)
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

    private func applyShields(store: ManagedSettingsStore, selection: FamilyActivitySelection) -> BlockingResult {
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
        guard let store = store else { return }
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
    }

    // MARK: - Blocking Status

    func getBlockingStatus() -> BlockingStatus {
        let selection = loadActivitySelection()
        return BlockingStatus(
            isBlocking: isBlocking,
            focusSessionActive: focusDataManager.isFocusSessionActive,
            shieldAttempts: focusDataManager.shieldAttempts,
            lastShieldAttemptTimestamp: focusDataManager.lastShieldAttemptTimestamp,
            hasAppsConfigured: hasAppsConfigured,
            selectedAppsCount: selection?.applicationTokens.count ?? 0,
            selectedCategoriesCount: selection?.categoryTokens.count ?? 0
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

    /// Saves a FamilyActivitySelection as encoded Data (used by native picker)
    func saveActivitySelection(_ selection: FamilyActivitySelection) throws {
        guard let userDefaults = userDefaults else {
            throw PluginError.sharedContainerUnavailable
        }
        let data = try JSONEncoder().encode(selection)
        userDefaults.set(data, forKey: AppConfig.StorageKeys.blockedAppsSelection)
        Log.blocking.info("Activity selection saved: \(selection.applicationTokens.count) apps, \(selection.categoryTokens.count) categories, \(selection.webDomainTokens.count) domains")
    }

    /// Loads the saved FamilyActivitySelection (used by native picker to restore state)
    func loadActivitySelection() -> FamilyActivitySelection? {
        guard let data = userDefaults?.data(forKey: AppConfig.StorageKeys.blockedAppsSelection) else {
            return nil
        }
        return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
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
