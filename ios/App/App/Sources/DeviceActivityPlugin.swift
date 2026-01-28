import Foundation
import Capacitor
import UIKit

/**
 * DeviceActivityPlugin
 *
 * Capacitor plugin coordinating device activity, app blocking, and monitoring.
 * Delegates to specialized managers for each concern.
 *
 * Architecture:
 * - PermissionsManager: Handles Family Controls authorization
 * - AppBlockingManager: Manages shield application and removal
 * - ActivityMonitorManager: Handles device activity monitoring
 * - BackgroundTaskManager: Manages background task scheduling
 * - HapticFeedbackManager: Provides haptic feedback
 * - FocusDataManager: Manages focus session state
 */
@objc(DeviceActivityPlugin)
public class DeviceActivityPlugin: CAPPlugin, CAPBridgedPlugin {

    // MARK: - Plugin Configuration

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

    // MARK: - Managers

    private let permissionsManager: PermissionsManager
    private let blockingManager: AppBlockingManager
    private let monitorManager: ActivityMonitorManager
    private let backgroundManager: BackgroundTaskManager
    private let hapticManager: HapticFeedbackManager
    private let focusDataManager: FocusDataManager

    // MARK: - Initialization

    public override init() {
        self.permissionsManager = .shared
        self.blockingManager = .shared
        self.monitorManager = .shared
        self.backgroundManager = .shared
        self.hapticManager = .shared
        self.focusDataManager = .shared
        super.init()
    }

    /// Designated initializer for testing with injected dependencies
    init(
        permissionsManager: PermissionsManager,
        blockingManager: AppBlockingManager,
        monitorManager: ActivityMonitorManager,
        backgroundManager: BackgroundTaskManager,
        hapticManager: HapticFeedbackManager,
        focusDataManager: FocusDataManager
    ) {
        self.permissionsManager = permissionsManager
        self.blockingManager = blockingManager
        self.monitorManager = monitorManager
        self.backgroundManager = backgroundManager
        self.hapticManager = hapticManager
        self.focusDataManager = focusDataManager
        super.init()
    }

    // MARK: - Lifecycle

    public override func load() {
        Log.app.info("DeviceActivityPlugin loaded")
        setupLifecycleObservers()
        setupBackgroundEventHandler()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - Permission Methods

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        Task {
            do {
                try await permissionsManager.requestAuthorization()
                await MainActor.run {
                    call.resolve(permissionsManager.statusResponse)
                }
            } catch {
                await MainActor.run {
                    call.reject(with: error as? PluginError ?? .permissionDenied(feature: "Family Controls"))
                }
            }
        }
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(permissionsManager.statusResponse)
    }

    // MARK: - App Selection Methods

    @objc func openAppPicker(_ call: CAPPluginCall) {
        Task { @MainActor in
            notifyJS("showAppPicker", data: [:])
            call.resolveSuccess()
        }
    }

    @objc func setSelectedApps(_ call: CAPPluginCall) {
        do {
            let selection = try PluginValidation.requiredString(call, key: "selection")
            try blockingManager.saveSelection(selection)
            call.resolveSuccess(["message": Strings.Blocking.selectionSaved])
        } catch {
            call.reject(with: error as? PluginError ?? .invalidParameter(name: "selection", reason: "invalid"))
        }
    }

    @objc func getSelectedApps(_ call: CAPPluginCall) {
        if let selection = blockingManager.loadSelection() {
            call.resolve([
                "hasSelection": true,
                "selection": selection
            ])
        } else {
            call.resolve([
                "hasSelection": false,
                "selection": ""
            ])
        }
    }

    @objc func clearSelectedApps(_ call: CAPPluginCall) {
        blockingManager.clearSelection()
        call.resolveSuccess()
    }

    // MARK: - App Blocking Methods

    @objc func startAppBlocking(_ call: CAPPluginCall) {
        do {
            try permissionsManager.requireAuthorization()
            let result = try blockingManager.startBlocking()
            call.resolve(result.asDictionary)
        } catch {
            call.reject(with: error as? PluginError ?? .blockingNotConfigured)
        }
    }

    @objc func stopAppBlocking(_ call: CAPPluginCall) {
        let result = blockingManager.stopBlocking()
        call.resolve(result.asDictionary)
    }

    @objc func getBlockingStatus(_ call: CAPPluginCall) {
        let status = blockingManager.getBlockingStatus()
        call.resolve(status.asDictionary)
    }

    @objc func getShieldAttempts(_ call: CAPPluginCall) {
        call.resolve([
            "attempts": focusDataManager.shieldAttempts,
            "lastAttemptTimestamp": focusDataManager.lastShieldAttemptTimestamp
        ])
    }

    @objc func resetShieldAttempts(_ call: CAPPluginCall) {
        focusDataManager.resetShieldAttempts()
        call.resolveSuccess()
    }

    // MARK: - Monitoring Methods

    @objc func startMonitoring(_ call: CAPPluginCall) {
        do {
            try permissionsManager.requireAuthorization()
            let result = try monitorManager.startMonitoring()
            backgroundManager.registerBackgroundTasks()
            call.resolve(result.asDictionary)
        } catch {
            call.reject(with: error as? PluginError ?? .monitoringFailed(reason: "Unknown error"))
        }
    }

    @objc func stopMonitoring(_ call: CAPPluginCall) {
        let result = monitorManager.stopMonitoring()
        call.resolve(result.asDictionary)
    }

    @objc func getUsageData(_ call: CAPPluginCall) {
        let data = monitorManager.getUsageData()
        call.resolve(data.asDictionary)
    }

    @objc func recordActiveTime(_ call: CAPPluginCall) {
        monitorManager.recordActiveTime()
        call.resolveSuccess([
            "timestamp": Date().timeIntervalSince1970
        ])
    }

    // MARK: - Haptic Feedback

    @objc func triggerHapticFeedback(_ call: CAPPluginCall) {
        let styleString = call.getString("style")
        let style = HapticFeedbackManager.parseStyle(styleString)

        Task {
            await hapticManager.triggerFeedbackAsync(style: style)
            await MainActor.run {
                call.resolveSuccess()
            }
        }
    }

    // MARK: - Lifecycle Observers

    private func setupLifecycleObservers() {
        let center = NotificationCenter.default

        center.addObserver(
            self,
            selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )

        center.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )

        center.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    private func setupBackgroundEventHandler() {
        backgroundManager.setBackgroundEventHandler { [weak self] data in
            self?.notifyJS("appLifecycleChange", data: data)
        }
    }

    @objc private func appDidEnterBackground() {
        monitorManager.recordActiveTime()
        backgroundManager.appDidEnterBackground()

        notifyJS("appLifecycleChange", data: [
            "state": "background",
            "timestamp": Date().timeIntervalSince1970,
            "lastActiveTime": monitorManager.getUsageData().lastActiveTime
        ])
    }

    @objc private func appWillEnterForeground() {
        backgroundManager.appWillEnterForeground()

        notifyJS("appLifecycleChange", data: [
            "state": "foreground",
            "timestamp": Date().timeIntervalSince1970,
            "lastActiveTime": monitorManager.getUsageData().lastActiveTime
        ])
    }

    @objc private func appDidBecomeActive() {
        let timeAway = monitorManager.updateActiveTime()

        notifyJS("appLifecycleChange", data: [
            "state": "active",
            "timestamp": Date().timeIntervalSince1970,
            "timeAwayMinutes": timeAway / 60.0,
            "lastActiveTime": monitorManager.getUsageData().lastActiveTime,
            "shieldAttempts": focusDataManager.shieldAttempts
        ])
    }

    // MARK: - JS Communication

    private func notifyJS(_ eventName: String, data: [String: Any]) {
        if let jsonData = try? JSONSerialization.data(withJSONObject: data),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            bridge?.triggerJSEvent(eventName: eventName, target: "window", data: jsonString)
        }
    }
}
