import UIKit
import WebKit
import Capacitor

/**
 * AppDelegate
 *
 * Main application delegate for NoMo Phone.
 * Handles app launch, scene configuration, URL schemes, and background tasks.
 *
 * UIScene lifecycle adopted — SceneDelegate handles per-scene events
 * (foreground/background/active), while AppDelegate handles global events
 * (launch, terminate, background tasks, scene configuration).
 */
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    // MARK: - App Lifecycle

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        Log.lifecycle.info("Application did finish launching")
        Log.app.info("\(AppConfig.appName) v\(AppConfig.fullVersion)")

        // Register background tasks early
        registerBackgroundTasks()

        return true
    }

    // MARK: - Scene Configuration

    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        let config = UISceneConfiguration(
            name: "Default Configuration",
            sessionRole: connectingSceneSession.role
        )
        config.delegateClass = SceneDelegate.self
        config.storyboard = UIStoryboard(name: "Main", bundle: nil)
        return config
    }

    func application(
        _ application: UIApplication,
        didDiscardSceneSessions sceneSessions: Set<UISceneSession>
    ) {
        Log.lifecycle.debug("Discarded \(sceneSessions.count) scene session(s)")
    }

    // MARK: - URL Handling (fallback for non-scene flows)

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

    // MARK: - Termination

    func applicationWillTerminate(_ application: UIApplication) {
        Log.lifecycle.info("Application will terminate")
    }

    // MARK: - Background Tasks

    private func registerBackgroundTasks() {
        BackgroundTaskManager.shared.registerBackgroundTasks()
        Log.background.info("Background tasks registered from AppDelegate")
    }
}

// MARK: - Scene Delegate
// Defined in the same file as AppDelegate so Xcode always compiles it
// without needing a separate entry in the build sources list.

/// Handles per-scene lifecycle events: foreground, background, URL opening, etc.
/// The animated splash is presented here (instead of AppDelegate) because
/// the window is owned by the scene in UIScene-based apps.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    // MARK: - Scene Lifecycle

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let _ = scene as? UIWindowScene else { return }
        Log.lifecycle.info("Scene connected")

        // Show the animated splash once UIKit has finished setting up the window.
        // Runs on the next run-loop iteration so window + rootVC are available.
        DispatchQueue.main.async { [weak self] in
            self?.showAnimatedSplash()
        }

        // Handle URLs passed at launch
        if !connectionOptions.urlContexts.isEmpty {
            self.scene(scene, openURLContexts: connectionOptions.urlContexts)
        }

        // Handle universal links passed at launch
        if let userActivity = connectionOptions.userActivities.first {
            self.scene(scene, continue: userActivity)
        }
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        Log.lifecycle.debug("Scene did become active")
    }

    func sceneWillResignActive(_ scene: UIScene) {
        Log.lifecycle.debug("Scene will resign active")
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        Log.lifecycle.debug("Scene did enter background")
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        Log.lifecycle.debug("Scene will enter foreground")
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        Log.lifecycle.debug("Scene disconnected")
    }

    // MARK: - URL Handling

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            Log.app.debug("Scene opened with URL: \(context.url.absoluteString)")
            _ = ApplicationDelegateProxy.shared.application(
                UIApplication.shared,
                open: context.url,
                options: [:]
            )
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        Log.app.debug("Scene continuing user activity: \(userActivity.activityType)")
        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            continue: userActivity,
            restorationHandler: { _ in }
        )
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

        Log.lifecycle.info("Animated splash presented")
    }
}

// MARK: - Custom Bridge View Controller
// Subclass of CAPBridgeViewController that disables WKWebView gestures which
// conflict with iOS system gesture recognizers, preventing the
// "System gesture gate timed out" error on touch interactions.

class NomoViewController: CAPBridgeViewController {

    override func capacitorDidLoad() {
        super.capacitorDidLoad()

        guard let wv = webView else { return }

        // Disable back/forward swipe navigation — the app is a single-page web
        // app with no browser-style history, and the edge-swipe gesture recognizer
        // competes with the system's screen-edge gesture gate.
        wv.allowsBackForwardNavigationGestures = false

        // Disable link previews (3D Touch / long-press previews) — prevents the
        // web view from installing extra long-press gesture recognizers.
        wv.allowsLinkPreview = false

        // Let taps pass through immediately rather than waiting for the scroll
        // view to decide whether the touch is a scroll or a tap. This eliminates
        // the 150ms delay that contributes to gesture-gate timeouts.
        wv.scrollView.delaysContentTouches = false

        // Ensure the scroll view doesn't swallow button taps that start on a
        // subview (which is every tap in a WKWebView).
        wv.scrollView.canCancelContentTouches = true
    }

    /// Defer system edge gestures in favour of in-app touch handling.
    /// This tells iOS "my app needs the screen edges, so wait for my gesture
    /// recognizers first before triggering Control Center / Notification Center
    /// / back-swipe", which eliminates gesture-gate contention.
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge {
        return .all
    }
}

// MARK: - Animated Splash View Controller
// Defined here (same file as AppDelegate) so Xcode always compiles it
// without needing a separate file in the build sources list.

/// Native animated splash screen shown AFTER the static LaunchScreen.storyboard
/// and BEFORE WKWebView content is ready.  Displays the branded NOMO design
/// with a continuously-animating loading bar so users know the app is alive.
///
/// Lifecycle:
///   1. SceneDelegate adds this as a child VC overlay when the scene connects
///   2. The loading bar animates while WKWebView + React initialize behind it
///   3. JS calls DeviceActivity.dismissSplash() → posts notification
///   4. This VC fades out and removes itself, revealing the web content
final class AnimatedSplashViewController: UIViewController {

    // MARK: - UI Elements

    private let gradientLayer = CAGradientLayer()
    private let glowView = UIView()
    private let iconImageView = UIImageView()
    private let titleLabel = UILabel()
    private let taglineLabel = UILabel()
    private let barTrackView = UIView()
    private let barFillView = UIView()
    private let barGlowView = UIView()
    private let statusLabel = UILabel()

    private var barFillWidthConstraint: NSLayoutConstraint!
    private var trackWidth: CGFloat = 180

    // MARK: - Colors (matching index.html neon splash)

    private let bgTop    = UIColor(red: 10/255, green: 0, blue: 20/255, alpha: 1)       // #0a0014
    private let bgMid    = UIColor(red: 26/255, green: 5/255, blue: 48/255, alpha: 1)    // #1a0530
    private let bgBot    = UIColor(red: 13/255, green: 0, blue: 32/255, alpha: 1)        // #0d0020
    private let purple   = UIColor(red: 168/255, green: 85/255, blue: 247/255, alpha: 1) // #a855f7
    private let purpleLt = UIColor(red: 192/255, green: 132/255, blue: 252/255, alpha: 1)// #c084fc
    private let textClr  = UIColor(red: 226/255, green: 212/255, blue: 240/255, alpha: 1)// #e2d4f0
    private let tagClr   = UIColor(red: 168/255, green: 130/255, blue: 220/255, alpha: 0.6)

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        setupGradient()
        setupGlow()
        setupIcon()
        setupTitle()
        setupTagline()
        setupLoadingBar()
        setupStatusLabel()

        // Listen for dismiss notification from DeviceActivityPlugin
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDismissNotification),
            name: Notification.Name("AnimatedSplashDismiss"),
            object: nil
        )
    }

    @objc private func handleDismissNotification() {
        dismissSplash(completion: nil)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        gradientLayer.frame = view.bounds
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        startAnimations()
    }

    // MARK: - Setup

    private func setupGradient() {
        gradientLayer.colors = [bgTop.cgColor, bgMid.cgColor, bgBot.cgColor]
        gradientLayer.locations = [0.0, 0.4, 1.0]
        gradientLayer.startPoint = CGPoint(x: 0.5, y: 0)
        gradientLayer.endPoint = CGPoint(x: 0.5, y: 1)
        view.layer.insertSublayer(gradientLayer, at: 0)
    }

    private func setupGlow() {
        glowView.translatesAutoresizingMaskIntoConstraints = false
        glowView.backgroundColor = purple.withAlphaComponent(0.15)
        glowView.layer.cornerRadius = 150
        view.addSubview(glowView)

        NSLayoutConstraint.activate([
            glowView.widthAnchor.constraint(equalToConstant: 300),
            glowView.heightAnchor.constraint(equalToConstant: 300),
            glowView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            glowView.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -80),
        ])
    }

    private func setupIcon() {
        // Try the SplashIcon image set first, fall back to AppIcon
        if let img = UIImage(named: "SplashIcon") {
            iconImageView.image = img
        } else if let icons = Bundle.main.infoDictionary?["CFBundleIcons"] as? [String: Any],
                  let primary = icons["CFBundlePrimaryIcon"] as? [String: Any],
                  let files = primary["CFBundleIconFiles"] as? [String],
                  let last = files.last {
            iconImageView.image = UIImage(named: last)
        }

        iconImageView.contentMode = .scaleAspectFill
        iconImageView.layer.cornerRadius = 16
        iconImageView.clipsToBounds = true
        iconImageView.translatesAutoresizingMaskIntoConstraints = false

        // Purple shadow
        iconImageView.layer.shadowColor = UIColor(red: 147/255, green: 51/255, blue: 234/255, alpha: 1).cgColor
        iconImageView.layer.shadowOpacity = 0.4
        iconImageView.layer.shadowRadius = 15
        iconImageView.layer.shadowOffset = CGSize(width: 0, height: 4)
        iconImageView.layer.masksToBounds = false

        view.addSubview(iconImageView)

        NSLayoutConstraint.activate([
            iconImageView.widthAnchor.constraint(equalToConstant: 72),
            iconImageView.heightAnchor.constraint(equalToConstant: 72),
            iconImageView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            iconImageView.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -70),
        ])
    }

    private func setupTitle() {
        titleLabel.text = "NOMO"
        titleLabel.font = UIFont.systemFont(ofSize: 48, weight: .black)
        titleLabel.textColor = textClr
        titleLabel.textAlignment = .center
        titleLabel.translatesAutoresizingMaskIntoConstraints = false

        // Letter spacing
        if let text = titleLabel.text {
            let attributed = NSMutableAttributedString(string: text)
            attributed.addAttribute(.kern, value: 8.0,
                                    range: NSRange(location: 0, length: text.count))
            attributed.addAttribute(.foregroundColor, value: textClr,
                                    range: NSRange(location: 0, length: text.count))
            titleLabel.attributedText = attributed
        }

        // Purple text glow via shadow
        titleLabel.layer.shadowColor = purple.cgColor
        titleLabel.layer.shadowOpacity = 0.8
        titleLabel.layer.shadowRadius = 20
        titleLabel.layer.shadowOffset = .zero

        view.addSubview(titleLabel)

        NSLayoutConstraint.activate([
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            titleLabel.topAnchor.constraint(equalTo: iconImageView.bottomAnchor, constant: 20),
        ])
    }

    private func setupTagline() {
        taglineLabel.text = "FOCUS  \u{00B7}  GROW  \u{00B7}  COLLECT"
        taglineLabel.font = UIFont.systemFont(ofSize: 11, weight: .regular)
        taglineLabel.textColor = tagClr
        taglineLabel.textAlignment = .center
        taglineLabel.translatesAutoresizingMaskIntoConstraints = false

        // Letter spacing
        if let text = taglineLabel.text {
            let attributed = NSMutableAttributedString(string: text)
            attributed.addAttribute(.kern, value: 3.0,
                                    range: NSRange(location: 0, length: text.count))
            attributed.addAttribute(.foregroundColor, value: tagClr,
                                    range: NSRange(location: 0, length: text.count))
            taglineLabel.attributedText = attributed
        }

        view.addSubview(taglineLabel)

        NSLayoutConstraint.activate([
            taglineLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            taglineLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
        ])
    }

    private func setupLoadingBar() {
        trackWidth = 180

        // Track
        barTrackView.backgroundColor = UIColor.white.withAlphaComponent(0.08)
        barTrackView.layer.cornerRadius = 3
        barTrackView.layer.borderWidth = 1
        barTrackView.layer.borderColor = purple.withAlphaComponent(0.2).cgColor
        barTrackView.clipsToBounds = true
        barTrackView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(barTrackView)

        // Fill (starts at ~30%)
        barFillView.layer.cornerRadius = 3
        barFillView.clipsToBounds = true
        barFillView.translatesAutoresizingMaskIntoConstraints = false

        // Gradient fill layer
        let fillGradient = CAGradientLayer()
        fillGradient.colors = [purple.cgColor, purpleLt.cgColor]
        fillGradient.startPoint = CGPoint(x: 0, y: 0.5)
        fillGradient.endPoint = CGPoint(x: 1, y: 0.5)
        fillGradient.frame = CGRect(x: 0, y: 0, width: trackWidth, height: 6)
        barFillView.layer.addSublayer(fillGradient)

        // Glow on the fill
        barFillView.layer.shadowColor = purple.cgColor
        barFillView.layer.shadowOpacity = 0.6
        barFillView.layer.shadowRadius = 5
        barFillView.layer.shadowOffset = .zero
        barFillView.layer.masksToBounds = false

        barTrackView.addSubview(barFillView)

        let initialWidth = trackWidth * 0.3
        barFillWidthConstraint = barFillView.widthAnchor.constraint(equalToConstant: initialWidth)

        NSLayoutConstraint.activate([
            barTrackView.widthAnchor.constraint(equalToConstant: trackWidth),
            barTrackView.heightAnchor.constraint(equalToConstant: 6),
            barTrackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            barTrackView.topAnchor.constraint(equalTo: taglineLabel.bottomAnchor, constant: 40),

            barFillView.leadingAnchor.constraint(equalTo: barTrackView.leadingAnchor),
            barFillView.topAnchor.constraint(equalTo: barTrackView.topAnchor),
            barFillView.bottomAnchor.constraint(equalTo: barTrackView.bottomAnchor),
            barFillWidthConstraint,
        ])
    }

    private func setupStatusLabel() {
        statusLabel.text = "Getting everything ready..."
        statusLabel.font = UIFont.systemFont(ofSize: 12, weight: .medium)
        statusLabel.textColor = tagClr
        statusLabel.textAlignment = .center
        statusLabel.alpha = 0.8
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(statusLabel)

        NSLayoutConstraint.activate([
            statusLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            statusLabel.topAnchor.constraint(equalTo: barTrackView.bottomAnchor, constant: 16),
        ])
    }

    // MARK: - Animations

    private func startAnimations() {
        // Loading bar: animate width from 30% → 85% with ease-in-out, autoreverse
        let targetWidth = trackWidth * 0.85
        UIView.animate(
            withDuration: 1.8,
            delay: 0,
            options: [.autoreverse, .repeat, .curveEaseInOut],
            animations: { [weak self] in
                self?.barFillWidthConstraint.constant = targetWidth
                self?.barTrackView.layoutIfNeeded()
            }
        )

        // Glow pulse: scale the purple circle gently
        UIView.animate(
            withDuration: 2.5,
            delay: 0,
            options: [.autoreverse, .repeat, .curveEaseInOut],
            animations: { [weak self] in
                self?.glowView.transform = CGAffineTransform(scaleX: 1.15, y: 1.15)
                self?.glowView.alpha = 0.25
            }
        )
    }

    // MARK: - Dismiss

    /// Fade out and remove from the view hierarchy.
    func dismissSplash(completion: (() -> Void)? = nil) {
        NotificationCenter.default.removeObserver(self)

        // Stop repeating animations
        barFillView.layer.removeAllAnimations()
        glowView.layer.removeAllAnimations()

        UIView.animate(
            withDuration: 0.4,
            delay: 0,
            options: .curveEaseOut,
            animations: { [weak self] in
                self?.view.alpha = 0
            },
            completion: { [weak self] _ in
                self?.view.removeFromSuperview()
                self?.removeFromParent()
                completion?()
            }
        )
    }
}
