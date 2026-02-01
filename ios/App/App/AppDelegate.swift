import UIKit
import Capacitor

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

    // MARK: - App Lifecycle

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        Log.lifecycle.info("Application did finish launching")
        Log.app.info("\(AppConfig.appName) v\(AppConfig.fullVersion)")

        // Register background tasks early
        registerBackgroundTasks()

        // Show the animated splash once UIKit has finished setting up the window.
        // Runs on the next run-loop iteration so window + rootVC are available.
        DispatchQueue.main.async { [weak self] in
            self?.showAnimatedSplash()
        }

        return true
    }

    // MARK: - Animated Splash

    private func showAnimatedSplash() {
        guard let rootVC = window?.rootViewController else {
            Log.lifecycle.info("No rootVC yet — skipping animated splash")
            return
        }

        let splash = AnimatedSplashViewController()
        splash.view.frame = rootVC.view.bounds
        splash.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        rootVC.addChild(splash)
        rootVC.view.addSubview(splash.view)
        splash.didMove(toParent: rootVC)

        AnimatedSplashViewController.shared = splash
        Log.lifecycle.info("Animated splash presented")
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
