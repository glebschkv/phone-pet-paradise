import Foundation
import Capacitor
import DeviceActivity
import FamilyControls
import ManagedSettings
import BackgroundTasks

// MARK: - Shared Data Manager
class FocusDataManager {
    static let shared = FocusDataManager()

    private let userDefaults: UserDefaults?

    private init() {
        userDefaults = AppConfig.sharedUserDefaults
    }

    var isFocusSessionActive: Bool {
        get { userDefaults?.bool(forKey: AppConfig.StorageKeys.focusSessionActive) ?? false }
        set { userDefaults?.set(newValue, forKey: AppConfig.StorageKeys.focusSessionActive) }
    }

    var shieldAttempts: Int {
        get { userDefaults?.integer(forKey: AppConfig.StorageKeys.shieldAttempts) ?? 0 }
        set { userDefaults?.set(newValue, forKey: AppConfig.StorageKeys.shieldAttempts) }
    }

    var lastShieldAttemptTimestamp: Double {
        get { userDefaults?.double(forKey: AppConfig.StorageKeys.lastShieldAttempt) ?? 0 }
        set { userDefaults?.set(newValue, forKey: AppConfig.StorageKeys.lastShieldAttempt) }
    }

    func resetShieldAttempts() {
        shieldAttempts = 0
        lastShieldAttemptTimestamp = 0
    }

    func recordShieldAttempt() {
        shieldAttempts += 1
        lastShieldAttemptTimestamp = Date().timeIntervalSince1970
    }
}

// MARK: - Device Activity Plugin
@objc(DeviceActivityPlugin)
public class DeviceActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "DeviceActivityPlugin"
    public let jsName = "DeviceActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAppPicker", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSelectedApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSelectedApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearSelectedApps", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startAppBlocking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopAppBlocking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getBlockingStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getShieldAttempts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resetShieldAttempts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startMonitoring", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopMonitoring", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getUsageData", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "recordActiveTime", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "triggerHapticFeedback", returnType: CAPPluginReturnPromise)
    ]

    private var deviceActivityCenter = DeviceActivityCenter()
    private var authorizationCenter = AuthorizationCenter.shared
    private var isMonitoring = false
    private var lastActiveTime: Date?
    private var sessionStartTime: Date?

    // ManagedSettings store for app blocking
    private let store = ManagedSettingsStore()

    // Current app selection (stored in app group for extension access)
    private var currentSelection: FamilyActivitySelection? {
        didSet {
            saveSelectionToAppGroup()
        }
    }

    // MARK: - Permission Methods

    @objc func requestPermissions(_ call: CAPPluginCall) {
        Task {
            do {
                try await authorizationCenter.requestAuthorization(for: .individual)
                await MainActor.run {
                    call.resolve([
                        "status": "granted",
                        "familyControlsEnabled": true
                    ])
                }
            } catch {
                await MainActor.run {
                    call.reject("Failed to request permissions: \(error.localizedDescription)")
                }
            }
        }
    }

    @objc func checkPermissions(_ call: CAPPluginCall) {
        let status = authorizationCenter.authorizationStatus
        call.resolve([
            "status": status == .approved ? "granted" : "denied",
            "familyControlsEnabled": status == .approved
        ])
    }

    // MARK: - App Selection Methods

    @objc func openAppPicker(_ call: CAPPluginCall) {
        // This method triggers the native FamilyActivityPicker
        // The actual picker UI is handled via SwiftUI - we need to notify the app to show it
        DispatchQueue.main.async {
            self.notifyJS("showAppPicker", data: [:])
            call.resolve(["success": true])
        }
    }

    @objc func setSelectedApps(_ call: CAPPluginCall) {
        // This receives the serialized selection from the app picker
        guard let selectionData = call.getString("selection") else {
            call.reject("No selection data provided")
            return
        }

        // Store selection data in app group for extension access
        if let userDefaults = AppConfig.sharedUserDefaults {
            userDefaults.set(selectionData, forKey: AppConfig.StorageKeys.blockedAppsSelection)
            userDefaults.synchronize()
        }

        call.resolve([
            "success": true,
            "message": "App selection saved"
        ])
    }

    @objc func getSelectedApps(_ call: CAPPluginCall) {
        if let userDefaults = AppConfig.sharedUserDefaults,
           let selectionData = userDefaults.string(forKey: AppConfig.StorageKeys.blockedAppsSelection) {
            call.resolve([
                "hasSelection": true,
                "selection": selectionData
            ])
        } else {
            call.resolve([
                "hasSelection": false,
                "selection": ""
            ])
        }
    }

    @objc func clearSelectedApps(_ call: CAPPluginCall) {
        if let userDefaults = AppConfig.sharedUserDefaults {
            userDefaults.removeObject(forKey: AppConfig.StorageKeys.blockedAppsSelection)
            userDefaults.synchronize()
        }

        // Clear any active shields
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil

        call.resolve(["success": true])
    }

    // MARK: - App Blocking Methods

    @objc func startAppBlocking(_ call: CAPPluginCall) {
        guard authorizationCenter.authorizationStatus == .approved else {
            call.reject("Family Controls permissions not granted")
            return
        }

        // Mark focus session as active
        FocusDataManager.shared.isFocusSessionActive = true
        FocusDataManager.shared.resetShieldAttempts()

        // Load selection from app group and apply shields
        if let userDefaults = AppConfig.sharedUserDefaults,
           let selectionData = userDefaults.data(forKey: AppConfig.StorageKeys.blockedAppsSelection) {
            do {
                let selection = try JSONDecoder().decode(FamilyActivitySelection.self, from: selectionData)

                // Apply shields to selected apps
                store.shield.applications = selection.applicationTokens
                store.shield.applicationCategories = .specific(selection.categoryTokens)
                store.shield.webDomains = selection.webDomainTokens

                call.resolve([
                    "success": true,
                    "appsBlocked": selection.applicationTokens.count,
                    "categoriesBlocked": selection.categoryTokens.count,
                    "domainsBlocked": selection.webDomainTokens.count
                ])
            } catch {
                // If we can't decode stored selection, just enable basic blocking
                call.resolve([
                    "success": true,
                    "appsBlocked": 0,
                    "categoriesBlocked": 0,
                    "domainsBlocked": 0,
                    "note": "No apps configured for blocking"
                ])
            }
        } else {
            call.resolve([
                "success": true,
                "appsBlocked": 0,
                "categoriesBlocked": 0,
                "domainsBlocked": 0,
                "note": "No apps configured for blocking"
            ])
        }
    }

    @objc func stopAppBlocking(_ call: CAPPluginCall) {
        // Mark focus session as inactive
        FocusDataManager.shared.isFocusSessionActive = false

        // Get shield attempts before clearing
        let attempts = FocusDataManager.shared.shieldAttempts

        // Clear all shields
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil

        call.resolve([
            "success": true,
            "shieldAttempts": attempts
        ])
    }

    @objc func getBlockingStatus(_ call: CAPPluginCall) {
        let isActive = FocusDataManager.shared.isFocusSessionActive
        let attempts = FocusDataManager.shared.shieldAttempts
        let lastAttempt = FocusDataManager.shared.lastShieldAttemptTimestamp

        let hasAppsBlocked = store.shield.applications != nil &&
                            !(store.shield.applications?.isEmpty ?? true)

        call.resolve([
            "isBlocking": isActive && hasAppsBlocked,
            "focusSessionActive": isActive,
            "shieldAttempts": attempts,
            "lastShieldAttemptTimestamp": lastAttempt,
            "hasAppsConfigured": hasAppsBlocked
        ])
    }

    @objc func getShieldAttempts(_ call: CAPPluginCall) {
        call.resolve([
            "attempts": FocusDataManager.shared.shieldAttempts,
            "lastAttemptTimestamp": FocusDataManager.shared.lastShieldAttemptTimestamp
        ])
    }

    @objc func resetShieldAttempts(_ call: CAPPluginCall) {
        FocusDataManager.shared.resetShieldAttempts()
        call.resolve(["success": true])
    }

    // MARK: - Monitoring Methods

    @objc func startMonitoring(_ call: CAPPluginCall) {
        guard authorizationCenter.authorizationStatus == .approved else {
            call.reject("Device Activity permissions not granted")
            return
        }

        let activityName = DeviceActivityName(AppConfig.ActivityMonitoring.activityName)
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59),
            repeats: true
        )

        do {
            try deviceActivityCenter.startMonitoring(activityName, during: schedule)
            isMonitoring = true
            sessionStartTime = Date()

            // Register background task for app lifecycle tracking
            registerBackgroundTasks()

            call.resolve([
                "success": true,
                "monitoring": true,
                "startTime": sessionStartTime?.timeIntervalSince1970 ?? 0
            ])
        } catch {
            call.reject("Failed to start monitoring: \(error.localizedDescription)")
        }
    }

    @objc func stopMonitoring(_ call: CAPPluginCall) {
        let activityName = DeviceActivityName(AppConfig.ActivityMonitoring.activityName)
        deviceActivityCenter.stopMonitoring([activityName])
        isMonitoring = false

        call.resolve([
            "success": true,
            "monitoring": false
        ])
    }

    @objc func getUsageData(_ call: CAPPluginCall) {
        // Calculate time away from app
        let now = Date()
        var timeAwayMinutes = 0.0

        if let lastActive = lastActiveTime {
            timeAwayMinutes = now.timeIntervalSince(lastActive) / 60.0
        }

        call.resolve([
            "timeAwayMinutes": timeAwayMinutes,
            "isMonitoring": isMonitoring,
            "lastActiveTime": lastActiveTime?.timeIntervalSince1970 ?? 0,
            "currentTime": now.timeIntervalSince1970,
            "shieldAttempts": FocusDataManager.shared.shieldAttempts
        ])
    }

    @objc func recordActiveTime(_ call: CAPPluginCall) {
        lastActiveTime = Date()

        call.resolve([
            "success": true,
            "timestamp": lastActiveTime?.timeIntervalSince1970 ?? 0
        ])
    }

    // MARK: - Haptic Feedback

    @objc func triggerHapticFeedback(_ call: CAPPluginCall) {
        let style = call.getString("style") ?? "medium"

        DispatchQueue.main.async {
            switch style {
            case "light":
                let feedback = UIImpactFeedbackGenerator(style: .light)
                feedback.impactOccurred()
            case "heavy":
                let feedback = UIImpactFeedbackGenerator(style: .heavy)
                feedback.impactOccurred()
            case "success":
                let feedback = UINotificationFeedbackGenerator()
                feedback.notificationOccurred(.success)
            case "warning":
                let feedback = UINotificationFeedbackGenerator()
                feedback.notificationOccurred(.warning)
            case "error":
                let feedback = UINotificationFeedbackGenerator()
                feedback.notificationOccurred(.error)
            default:
                let feedback = UIImpactFeedbackGenerator(style: .medium)
                feedback.impactOccurred()
            }
        }

        call.resolve(["success": true])
    }

    // MARK: - Background Tasks

    private func registerBackgroundTasks() {
        // Register background task for app lifecycle monitoring
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: AppConfig.backgroundTaskIdentifier,
            using: nil
        ) { [weak self] task in
            guard let refreshTask = task as? BGAppRefreshTask else {
                task.setTaskCompleted(success: false)
                return
            }
            self?.handleBackgroundTracking(task: refreshTask)
        }
    }

    private func handleBackgroundTracking(task: BGAppRefreshTask) {
        // Record that app went to background
        self.notifyJS("appLifecycleChange", data: [
            "state": "background",
            "timestamp": Date().timeIntervalSince1970
        ])

        // Schedule next background refresh
        self.scheduleBackgroundAppRefresh()

        task.setTaskCompleted(success: true)
    }

    private func scheduleBackgroundAppRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: AppConfig.backgroundTaskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: AppConfig.backgroundRefreshIntervalMinutes * 60)

        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("[DeviceActivityPlugin] Failed to schedule background refresh: \(error)")
        }
    }

    // MARK: - App Group Helpers

    private func saveSelectionToAppGroup() {
        guard let selection = currentSelection,
              let userDefaults = AppConfig.sharedUserDefaults else { return }

        do {
            let data = try JSONEncoder().encode(selection)
            userDefaults.set(data, forKey: AppConfig.StorageKeys.blockedAppsSelection)
            userDefaults.synchronize()
        } catch {
            print("[DeviceActivityPlugin] Failed to save selection: \(error)")
        }
    }

    // MARK: - Lifecycle

    override public func load() {
        // Add app lifecycle observers
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    @objc private func appDidEnterBackground() {
        lastActiveTime = Date()
        scheduleBackgroundAppRefresh()

        notifyJS("appLifecycleChange", data: [
            "state": "background",
            "timestamp": Date().timeIntervalSince1970,
            "lastActiveTime": lastActiveTime?.timeIntervalSince1970 ?? 0
        ])
    }

    @objc private func appWillEnterForeground() {
        notifyJS("appLifecycleChange", data: [
            "state": "foreground",
            "timestamp": Date().timeIntervalSince1970,
            "lastActiveTime": lastActiveTime?.timeIntervalSince1970 ?? 0
        ])
    }

    @objc private func appDidBecomeActive() {
        let now = Date()
        var timeAwayMinutes = 0.0

        if let lastActive = lastActiveTime {
            timeAwayMinutes = now.timeIntervalSince(lastActive) / 60.0
        }

        notifyJS("appLifecycleChange", data: [
            "state": "active",
            "timestamp": now.timeIntervalSince1970,
            "timeAwayMinutes": timeAwayMinutes,
            "lastActiveTime": lastActiveTime?.timeIntervalSince1970 ?? 0,
            "shieldAttempts": FocusDataManager.shared.shieldAttempts
        ])

        lastActiveTime = now
    }

    private func notifyJS(_ eventName: String, data: [String: Any]) {
        bridge?.triggerJSEvent(eventName: eventName, target: "window", data: data)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}
