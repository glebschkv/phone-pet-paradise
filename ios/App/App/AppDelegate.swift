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
        // The Networking/GPU/WebContent processes take 2-14s on cold start.
        // Creating a throwaway WKWebView kicks off Networking/GPU/WebContent
        // process launches in parallel with plugin registration and UI setup.
        // IMPORTANT: Keep this view alive until XPC processes finish —
        // releasing it too early causes "XPC connection interrupted" and
        // forces Capacitor's WebView to restart them from scratch.
        let config = WKWebViewConfiguration()
        config.suppressesIncrementalRendering = true
        prewarmWebView = WKWebView(frame: .zero, configuration: config)
        prewarmWebView?.loadHTMLString("<body style='background:#0a0014'></body>", baseURL: nil)

        // Release the pre-warm view after 30s — by then Capacitor's WebView
        // owns the XPC connections and the throwaway is no longer needed.
        DispatchQueue.main.asyncAfter(deadline: .now() + 30) { [weak self] in
            self?.prewarmWebView = nil
        }

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
