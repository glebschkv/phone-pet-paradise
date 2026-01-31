import Foundation
import Capacitor
import UIKit
import SwiftUI
import FamilyControls

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
 *
 * Note: Some managers (AppBlockingManager, ActivityMonitorManager) require
 * extension-only entitlements. They gracefully degrade when running in the
 * main app without those entitlements.
 */
@objc(DeviceActivityPlugin)
public class DeviceActivityPlugin: CAPPlugin, CAPBridgedPlugin {

    // MARK: - Plugin Configuration

    public let identifier = "DeviceActivityPlugin"
    public let jsName = "DeviceActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAppPicker", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise),
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

    // MARK: - Managers (lazy to avoid crashes if entitlements are missing)

    private lazy var permissionsManager: PermissionsManager = .shared
    private lazy var blockingManager: AppBlockingManager = .shared
    private lazy var monitorManager: ActivityMonitorManager = .shared
    private lazy var backgroundManager: BackgroundTaskManager = .shared
    private lazy var hapticManager: HapticFeedbackManager = .shared
    private lazy var focusDataManager: FocusDataManager = .shared

    /// Track whether the plugin loaded successfully
    private var pluginLoadedSuccessfully = false

    // MARK: - Lifecycle

    public override func load() {
        Log.app.info("DeviceActivityPlugin loading...")

        // Setup lifecycle observers (safe - just NotificationCenter)
        setupLifecycleObservers()

        // Setup background handler (accesses backgroundManager - should be safe)
        setupBackgroundEventHandler()

        pluginLoadedSuccessfully = true
        Log.app.info("DeviceActivityPlugin loaded successfully")

        // Diagnostic: check Family Controls entitlement status at startup
        diagnoseEntitlement()
    }

    /// Checks if the Family Controls entitlement is properly configured
    /// by reading the embedded provisioning profile and checking initial auth status.
    /// Also checks whether extension .appex bundles are embedded correctly.
    private func diagnoseEntitlement() {
        Log.app.info("=== FAMILY CONTROLS DIAGNOSTIC ===")

        // Check 1: Initial authorization status from AuthorizationCenter
        if #available(iOS 16.0, *) {
            let rawStatus = FamilyControls.AuthorizationCenter.shared.authorizationStatus
            Log.app.info("[DIAG] AuthorizationCenter.authorizationStatus = \(rawStatus)")
            Log.app.info("[DIAG] Raw value description: \(String(describing: rawStatus))")
        }

        // Check 2: Look for Family Controls entitlement in embedded profile
        if let profilePath = Bundle.main.path(forResource: "embedded", ofType: "mobileprovision"),
           let profileData = try? Data(contentsOf: URL(fileURLWithPath: profilePath)) {
            let profileString = String(data: profileData, encoding: .ascii) ?? ""
            let hasFamilyControls = profileString.contains("com.apple.developer.family-controls")
            Log.app.info("[DIAG] Provisioning profile found: YES")
            Log.app.info("[DIAG] Family Controls entitlement in profile: \(hasFamilyControls ? "YES ✅" : "NO ⚠️ (may be normal for dev builds)")")
        } else {
            Log.app.info("[DIAG] Provisioning profile found: NO (simulator build or missing)")
        }

        // Check 3: Bundle ID
        Log.app.info("[DIAG] Bundle ID: \(Bundle.main.bundleIdentifier ?? "unknown")")

        // Check 4: Look for embedded extensions (.appex bundles in PlugIns directory)
        Log.app.info("=== EXTENSION DIAGNOSTIC ===")
        let bundlePath = Bundle.main.bundlePath
        let plugInsPath = (bundlePath as NSString).appendingPathComponent("PlugIns")
        let fileManager = FileManager.default

        if fileManager.fileExists(atPath: plugInsPath) {
            Log.app.info("[EXT] PlugIns directory: EXISTS ✅")
            do {
                let contents = try fileManager.contentsOfDirectory(atPath: plugInsPath)
                Log.app.info("[EXT] PlugIns contents: \(contents.joined(separator: ", "))")

                for item in contents {
                    let appexPath = (plugInsPath as NSString).appendingPathComponent(item)
                    Log.app.info("[EXT] --- Extension: \(item) ---")

                    // Read the extension's Info.plist
                    let infoPlistPath = (appexPath as NSString).appendingPathComponent("Info.plist")
                    if let infoPlist = NSDictionary(contentsOfFile: infoPlistPath) {
                        // Get bundle identifier
                        let bundleId = infoPlist["CFBundleIdentifier"] as? String ?? "unknown"
                        Log.app.info("[EXT]   Bundle ID: \(bundleId)")

                        // Get executable name
                        let executable = infoPlist["CFBundleExecutable"] as? String ?? "unknown"
                        Log.app.info("[EXT]   Executable: \(executable)")

                        // Get minimum OS version
                        let minOS = infoPlist["MinimumOSVersion"] as? String ?? "unknown"
                        Log.app.info("[EXT]   MinimumOSVersion: \(minOS)")

                        // Get NSExtension dictionary
                        if let nsExtension = infoPlist["NSExtension"] as? [String: Any] {
                            let pointId = nsExtension["NSExtensionPointIdentifier"] as? String ?? "MISSING!"
                            let principalClass = nsExtension["NSExtensionPrincipalClass"] as? String ?? "MISSING!"
                            Log.app.info("[EXT]   NSExtensionPointIdentifier: \(pointId)")
                            Log.app.info("[EXT]   NSExtensionPrincipalClass: \(principalClass)")

                            // Check if the extension point identifier is correct for shield config
                            if item.contains("Shield") || item.contains("shield") {
                                if pointId == "com.apple.ManagedSettingsUI.shield-configuration-service" {
                                    Log.app.info("[EXT]   Shield extension point: CORRECT ✅")
                                } else {
                                    Log.app.info("[EXT]   Shield extension point: WRONG ❌ (expected com.apple.ManagedSettingsUI.shield-configuration-service)")
                                }
                            }
                        } else {
                            Log.app.info("[EXT]   NSExtension: MISSING! ❌")
                        }

                        // Check if the executable binary exists
                        let execPath = (appexPath as NSString).appendingPathComponent(executable)
                        let execExists = fileManager.fileExists(atPath: execPath)
                        Log.app.info("[EXT]   Executable binary exists: \(execExists ? "YES ✅" : "NO ❌")")

                        // Check if the extension has its own embedded.mobileprovision
                        let extProfilePath = (appexPath as NSString).appendingPathComponent("embedded.mobileprovision")
                        let hasProfile = fileManager.fileExists(atPath: extProfilePath)
                        Log.app.info("[EXT]   Has embedded.mobileprovision: \(hasProfile ? "YES" : "NO")")

                        if hasProfile, let profileData = try? Data(contentsOf: URL(fileURLWithPath: extProfilePath)) {
                            let profileStr = String(data: profileData, encoding: .ascii) ?? ""
                            let extHasFC = profileStr.contains("com.apple.developer.family-controls")
                            Log.app.info("[EXT]   Extension profile has Family Controls: \(extHasFC ? "YES ✅" : "NO ❌")")
                        }
                    } else {
                        Log.app.info("[EXT]   Info.plist: MISSING or UNREADABLE ❌")
                    }
                }
            } catch {
                Log.app.info("[EXT] Error reading PlugIns directory: \(error)")
            }
        } else {
            Log.app.info("[EXT] PlugIns directory: DOES NOT EXIST ❌ — No extensions are embedded!")
        }

        Log.app.info("=== END DIAGNOSTIC ===")
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // MARK: - Diagnostic Methods

    /// Simple echo method to verify the native plugin bridge is working.
    /// Returns immediately without accessing any managers or entitlements.
    @objc func echo(_ call: CAPPluginCall) {
        // Include entitlement diagnostic in echo response
        var hasEntitlementInProfile = false
        if let profilePath = Bundle.main.path(forResource: "embedded", ofType: "mobileprovision"),
           let profileData = try? Data(contentsOf: URL(fileURLWithPath: profilePath)) {
            let profileString = String(data: profileData, encoding: .ascii) ?? ""
            hasEntitlementInProfile = profileString.contains("com.apple.developer.family-controls")
        }

        var initialAuthStatus = "unknown"
        if #available(iOS 16.0, *) {
            let status = FamilyControls.AuthorizationCenter.shared.authorizationStatus
            switch status {
            case .notDetermined: initialAuthStatus = "notDetermined"
            case .denied: initialAuthStatus = "denied"
            case .approved: initialAuthStatus = "approved"
            @unknown default: initialAuthStatus = "unknown(\(status))"
            }
        }

        call.resolve([
            "pluginLoaded": pluginLoadedSuccessfully,
            "platform": "ios",
            "timestamp": Date().timeIntervalSince1970,
            "familyControlsEntitlementInProfile": hasEntitlementInProfile,
            "initialAuthStatus": initialAuthStatus,
            "bundleId": Bundle.main.bundleIdentifier ?? "unknown"
        ])
    }

    // MARK: - Permission Methods

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        // Wrap in safe access to handle any potential crash from FamilyControls
        let response = safePermissionsCheck()
        call.resolve(response)
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        Task {
            // requestAuthorization no longer throws — it always completes
            // and we check the resulting status afterwards
            try? await permissionsManager.requestAuthorization()
            let response = safeDetailedPermissionsCheck()
            await MainActor.run {
                call.resolve(response)
            }
        }
    }

    /// Opens the app's Settings page where users can re-enable permissions
    @objc func openSettings(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let settingsUrl = URL(string: UIApplication.openSettingsURLString) else {
                call.resolveFailure(message: "Could not create Settings URL")
                return
            }
            if UIApplication.shared.canOpenURL(settingsUrl) {
                await UIApplication.shared.open(settingsUrl)
                call.resolveSuccess()
            } else {
                call.resolveFailure(message: "Cannot open Settings")
            }
        }
    }

    /// Safely checks permissions status, returning a safe default if anything fails.
    /// This prevents the plugin from crashing if FamilyControls is unavailable.
    private func safePermissionsCheck() -> [String: Any] {
        let status = permissionsManager.authorizationStatus
        return [
            "status": status.isGranted ? "granted" : (status == .notDetermined ? "notDetermined" : "denied"),
            "familyControlsEnabled": status.isGranted
        ]
    }

    /// Detailed permissions check with diagnostics for requestPermissions responses
    private func safeDetailedPermissionsCheck() -> [String: Any] {
        return permissionsManager.detailedStatusResponse
    }

    // MARK: - App Selection Methods

    /// Reference to the pending picker call so it stays alive during presentation
    private var pendingPickerCall: CAPPluginCall?

    @objc func openAppPicker(_ call: CAPPluginCall) {
        Log.app.info("[openAppPicker] Method called")

        // CRITICAL: Tell Capacitor to keep this call alive.
        // Without this, Capacitor auto-resolves with {"success":true} when
        // the method returns (before the async picker presentation completes).
        call.keepAlive = true

        if #available(iOS 16.0, *) {
            // Prevent multiple simultaneous picker presentations
            if pendingPickerCall != nil {
                Log.app.info("[openAppPicker] Picker already open, ignoring")
                call.keepAlive = false
                call.resolve(["success": false, "reason": "pickerAlreadyOpen"])
                return
            }

            pendingPickerCall = call

            DispatchQueue.main.async { [weak self] in
                guard let self = self else {
                    Log.app.info("[openAppPicker] Self deallocated")
                    call.keepAlive = false
                    call.reject("Plugin deallocated")
                    return
                }

                guard let viewController = self.bridge?.viewController else {
                    Log.app.info("[openAppPicker] No view controller available (bridge=\(String(describing: self.bridge)))")
                    self.pendingPickerCall = nil
                    call.keepAlive = false
                    call.reject("No view controller available")
                    return
                }

                Log.app.info("[openAppPicker] VC found: \(type(of: viewController)), presentedVC: \(String(describing: viewController.presentedViewController))")

                // Dismiss any existing presentation first
                if viewController.presentedViewController != nil {
                    Log.app.info("[openAppPicker] Dismissing existing presented VC first")
                    viewController.dismiss(animated: false) { [weak self] in
                        self?.presentAppPicker(from: viewController, call: call)
                    }
                } else {
                    self.presentAppPicker(from: viewController, call: call)
                }
            }
        } else {
            Log.app.info("[openAppPicker] iOS 16+ not available")
            call.keepAlive = false
            call.reject("FamilyActivityPicker requires iOS 16+")
        }
    }

    @available(iOS 16.0, *)
    private func presentAppPicker(from viewController: UIViewController, call: CAPPluginCall) {
        Log.app.info("[openAppPicker] Presenting picker...")

        // Load existing selection so the picker starts with current state
        let existingSelection = blockingManager.loadActivitySelection() ?? FamilyActivitySelection()
        Log.app.info("[openAppPicker] Existing selection: \(existingSelection.applicationTokens.count) apps, \(existingSelection.categoryTokens.count) categories")

        let pickerView = AppPickerView(
            selection: existingSelection,
            onDone: { [weak self] selection in
                Log.app.info("[openAppPicker] User tapped Done with \(selection.applicationTokens.count) apps")
                viewController.dismiss(animated: true) {
                    guard let self = self else { return }
                    self.pendingPickerCall = nil
                    do {
                        try self.blockingManager.saveActivitySelection(selection)
                        let apps = selection.applicationTokens.count
                        let categories = selection.categoryTokens.count
                        let domains = selection.webDomainTokens.count
                        Log.app.info("[openAppPicker] Selection saved: \(apps) apps, \(categories) categories, \(domains) domains")
                        call.keepAlive = false
                        call.resolve([
                            "success": true,
                            "appsSelected": apps,
                            "categoriesSelected": categories,
                            "domainsSelected": domains,
                            "hasSelection": apps > 0 || categories > 0 || domains > 0
                        ])
                    } catch {
                        Log.app.failure("Failed to save app selection", error: error)
                        call.keepAlive = false
                        call.reject("Failed to save selection: \(error.localizedDescription)")
                    }
                }
            },
            onCancel: { [weak self] in
                Log.app.info("[openAppPicker] User tapped Cancel")
                viewController.dismiss(animated: true) {
                    self?.pendingPickerCall = nil
                    call.keepAlive = false
                    call.resolve([
                        "success": false,
                        "cancelled": true
                    ])
                }
            }
        )

        let hostingController = UIHostingController(rootView: pickerView)
        hostingController.modalPresentationStyle = .formSheet
        viewController.present(hostingController, animated: true) {
            Log.app.info("[openAppPicker] Picker presented successfully")
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
        backgroundManager.appDidEnterBackground()
        notifyJS("appLifecycleChange", data: [
            "state": "background",
            "timestamp": Date().timeIntervalSince1970
        ])
    }

    @objc private func appWillEnterForeground() {
        backgroundManager.appWillEnterForeground()
        notifyJS("appLifecycleChange", data: [
            "state": "foreground",
            "timestamp": Date().timeIntervalSince1970
        ])
    }

    @objc private func appDidBecomeActive() {
        notifyJS("appLifecycleChange", data: [
            "state": "active",
            "timestamp": Date().timeIntervalSince1970,
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

// MARK: - App Picker View

/// SwiftUI wrapper around Apple's FamilyActivityPicker.
/// Presented modally from the Capacitor plugin when the user taps "Select Apps to Block".
@available(iOS 16.0, *)
private struct AppPickerView: View {
    @State var selection: FamilyActivitySelection
    let onDone: (FamilyActivitySelection) -> Void
    let onCancel: () -> Void

    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Block Apps")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            onCancel()
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") {
                            onDone(selection)
                        }
                        .fontWeight(.semibold)
                    }
                }
        }
    }
}
