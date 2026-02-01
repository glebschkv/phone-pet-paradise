import UIKit
import Capacitor
import WebKit

/**
 * AppDelegate
 *
 * Main application delegate for NoMo Phone.
 * Handles app lifecycle, URL schemes, and background task registration.
 */
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    // MARK: - Properties

    var window: UIWindow?

    /// Throwaway WKWebView used to pre-warm the Networking/GPU/WebContent
    /// XPC processes. Creating this early causes iOS to start those processes
    /// in parallel with the rest of app setup, shaving time off the cold start.
    private var prewarmWebView: WKWebView?

    // MARK: - App Lifecycle

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        Log.lifecycle.info("Application did finish launching")
        Log.app.info("\(AppConfig.appName) v\(AppConfig.fullVersion)")

        // Pre-warm WKWebView XPC processes as early as possible.
        // The Networking/GPU/WebContent processes take 2-8s on cold start.
        // Creating a throwaway WKWebView here kicks off those launches in
        // parallel with background task registration and UI setup.
        prewarmWebView = WKWebView(frame: .zero)
        prewarmWebView?.loadHTMLString("", baseURL: nil)

        // Register background tasks early
        registerBackgroundTasks()

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        Log.lifecycle.debug("Application will resign active")
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        Log.lifecycle.debug("Application did enter background")
        // BackgroundTaskManager lifecycle is handled by DeviceActivityPlugin's
        // NotificationCenter observers — no need to call it here too
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        Log.lifecycle.debug("Application will enter foreground")
        // BackgroundTaskManager lifecycle is handled by DeviceActivityPlugin's
        // NotificationCenter observers — no need to call it here too
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        Log.lifecycle.debug("Application did become active")
        // Release the pre-warm WebView — Capacitor's WebView is running now.
        // The XPC processes stay alive once launched so this just frees the view.
        if prewarmWebView != nil {
            prewarmWebView = nil
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        Log.lifecycle.info("Application will terminate")
    }

    // MARK: - URL Handling

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        Log.app.debug("Application opened with URL: \(url.absoluteString)")
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        Log.app.debug("Application continuing user activity: \(userActivity.activityType)")
        return ApplicationDelegateProxy.shared.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }

    // MARK: - Background Tasks

    private func registerBackgroundTasks() {
        BackgroundTaskManager.shared.registerBackgroundTasks()
        Log.background.info("Background tasks registered from AppDelegate")
    }
}
