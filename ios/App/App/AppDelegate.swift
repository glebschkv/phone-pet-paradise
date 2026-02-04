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

        // Safety timeout: force-dismiss splash after 15 seconds even if JS
        // never calls dismissSplash(). Prevents a permanently frozen UI if
        // the WebContent process hangs or JS throws during init.
        DispatchQueue.main.asyncAfter(deadline: .now() + 15.0) { [weak splash] in
            guard let splash = splash, splash.parent != nil else { return }
            Log.lifecycle.warning("Splash safety timeout — force dismissing after 15s")
            splash.dismissSplash(completion: nil)
        }
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
/// with layered glow effects, scanlines, and smooth entrance animations.
///
/// Lifecycle:
///   1. SceneDelegate adds this as a child VC overlay when the scene connects
///   2. The loading bar animates while WKWebView + React initialize behind it
///   3. JS calls DeviceActivity.dismissSplash() → posts notification
///   4. This VC fades out and removes itself, revealing the web content
final class AnimatedSplashViewController: UIViewController {

    // MARK: - UI Elements

    private let gradientLayer = CAGradientLayer()
    private let scanlineView = UIView()
    private let glowLayer = CAGradientLayer()
    private let glowContainer = UIView()
    private let iconContainer = UIView()
    private let iconImageView = UIImageView()
    private let titleLabel = UILabel()
    private let taglineLabel = UILabel()
    private let barTrackView = UIView()
    private let barFillView = UIView()
    private let shimmerLayer = CAGradientLayer()
    private let contentStack = UIView()

    private var barFillWidthConstraint: NSLayoutConstraint!
    private let trackWidth: CGFloat = 220

    // MARK: - Colors

    private let bgTop     = UIColor(red: 8/255,   green: 0,       blue: 18/255,  alpha: 1) // #080012
    private let bgMid     = UIColor(red: 22/255,  green: 4/255,   blue: 42/255,  alpha: 1) // #16042a
    private let bgBot     = UIColor(red: 10/255,  green: 0,       blue: 24/255,  alpha: 1) // #0a0018
    private let purple    = UIColor(red: 168/255, green: 85/255,  blue: 247/255, alpha: 1) // #a855f7
    private let purpleLt  = UIColor(red: 192/255, green: 132/255, blue: 252/255, alpha: 1) // #c084fc
    private let purpleDk  = UIColor(red: 126/255, green: 34/255,  blue: 206/255, alpha: 1) // #7e22ce
    private let textClr   = UIColor(red: 240/255, green: 230/255, blue: 255/255, alpha: 1) // #f0e6ff
    private let tagClr    = UIColor(red: 168/255, green: 140/255, blue: 210/255, alpha: 0.55)
    private let trackClr  = UIColor(red: 168/255, green: 85/255,  blue: 247/255, alpha: 0.08)

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        setupBackground()
        setupScanlines()
        setupContent()

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
        glowLayer.frame = glowContainer.bounds
        shimmerLayer.frame = CGRect(x: 0, y: 0, width: trackWidth, height: 4)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        playEntranceAnimations()
    }

    // MARK: - Background

    private func setupBackground() {
        gradientLayer.colors = [bgTop.cgColor, bgMid.cgColor, bgBot.cgColor]
        gradientLayer.locations = [0.0, 0.4, 1.0]
        gradientLayer.startPoint = CGPoint(x: 0.5, y: 0)
        gradientLayer.endPoint = CGPoint(x: 0.5, y: 1)
        view.layer.insertSublayer(gradientLayer, at: 0)
    }

    private func setupScanlines() {
        scanlineView.translatesAutoresizingMaskIntoConstraints = false
        scanlineView.isUserInteractionEnabled = false
        scanlineView.alpha = 0.03
        view.addSubview(scanlineView)

        NSLayoutConstraint.activate([
            scanlineView.topAnchor.constraint(equalTo: view.topAnchor),
            scanlineView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            scanlineView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scanlineView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        // Repeating 2px scanlines via a tiled pattern
        let lineH: CGFloat = 2
        let gapH: CGFloat = 2
        let patH = lineH + gapH
        UIGraphicsBeginImageContextWithOptions(CGSize(width: 4, height: patH), false, 0)
        if let ctx = UIGraphicsGetCurrentContext() {
            ctx.setFillColor(UIColor.white.cgColor)
            ctx.fill(CGRect(x: 0, y: 0, width: 4, height: lineH))
        }
        if let img = UIGraphicsGetImageFromCurrentImageContext() {
            scanlineView.backgroundColor = UIColor(patternImage: img)
        }
        UIGraphicsEndImageContext()
    }

    // MARK: - Content Layout

    private func setupContent() {
        contentStack.translatesAutoresizingMaskIntoConstraints = false
        contentStack.alpha = 0 // will fade-in via entrance animation
        view.addSubview(contentStack)

        NSLayoutConstraint.activate([
            contentStack.topAnchor.constraint(equalTo: view.topAnchor),
            contentStack.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            contentStack.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            contentStack.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        setupGlow()
        setupIcon()
        setupTitle()
        setupTagline()
        setupLoadingBar()
    }

    // MARK: - Glow (radial gradient)

    private func setupGlow() {
        glowContainer.translatesAutoresizingMaskIntoConstraints = false
        glowContainer.isUserInteractionEnabled = false
        contentStack.addSubview(glowContainer)

        NSLayoutConstraint.activate([
            glowContainer.widthAnchor.constraint(equalToConstant: 360),
            glowContainer.heightAnchor.constraint(equalToConstant: 360),
            glowContainer.centerXAnchor.constraint(equalTo: contentStack.centerXAnchor),
            glowContainer.centerYAnchor.constraint(equalTo: contentStack.centerYAnchor, constant: -60),
        ])

        glowLayer.type = .radial
        glowLayer.colors = [
            purple.withAlphaComponent(0.22).cgColor,
            purpleDk.withAlphaComponent(0.08).cgColor,
            UIColor.clear.cgColor,
        ]
        glowLayer.locations = [0.0, 0.45, 1.0]
        glowLayer.startPoint = CGPoint(x: 0.5, y: 0.5)
        glowLayer.endPoint = CGPoint(x: 1.0, y: 1.0)
        glowContainer.layer.addSublayer(glowLayer)
    }

    // MARK: - Icon

    private func setupIcon() {
        iconContainer.translatesAutoresizingMaskIntoConstraints = false
        contentStack.addSubview(iconContainer)

        if let img = UIImage(named: "SplashIcon") {
            iconImageView.image = img
        } else if let icons = Bundle.main.infoDictionary?["CFBundleIcons"] as? [String: Any],
                  let primary = icons["CFBundlePrimaryIcon"] as? [String: Any],
                  let files = primary["CFBundleIconFiles"] as? [String],
                  let last = files.last {
            iconImageView.image = UIImage(named: last)
        }

        iconImageView.contentMode = .scaleAspectFill
        iconImageView.layer.cornerRadius = 22
        iconImageView.clipsToBounds = true
        iconImageView.translatesAutoresizingMaskIntoConstraints = false
        iconContainer.addSubview(iconImageView)

        // Glow shadow on the container (not clipped)
        iconContainer.layer.shadowColor = purple.cgColor
        iconContainer.layer.shadowOpacity = 0.5
        iconContainer.layer.shadowRadius = 24
        iconContainer.layer.shadowOffset = CGSize(width: 0, height: 6)

        NSLayoutConstraint.activate([
            iconContainer.widthAnchor.constraint(equalToConstant: 96),
            iconContainer.heightAnchor.constraint(equalToConstant: 96),
            iconContainer.centerXAnchor.constraint(equalTo: contentStack.centerXAnchor),
            iconContainer.centerYAnchor.constraint(equalTo: contentStack.centerYAnchor, constant: -80),

            iconImageView.topAnchor.constraint(equalTo: iconContainer.topAnchor),
            iconImageView.bottomAnchor.constraint(equalTo: iconContainer.bottomAnchor),
            iconImageView.leadingAnchor.constraint(equalTo: iconContainer.leadingAnchor),
            iconImageView.trailingAnchor.constraint(equalTo: iconContainer.trailingAnchor),
        ])
    }

    // MARK: - Title

    private func setupTitle() {
        let fontSize: CGFloat = 42
        // Prefer SF Pro Rounded for a friendlier, premium feel
        if let desc = UIFont.systemFont(ofSize: fontSize, weight: .heavy)
                    .fontDescriptor.withDesign(.rounded) {
            titleLabel.font = UIFont(descriptor: desc, size: fontSize)
        } else {
            titleLabel.font = UIFont.systemFont(ofSize: fontSize, weight: .heavy)
        }

        titleLabel.textAlignment = .center
        titleLabel.translatesAutoresizingMaskIntoConstraints = false

        let text = "NOMO"
        let attributed = NSMutableAttributedString(string: text)
        attributed.addAttribute(.kern, value: 12.0,
                                range: NSRange(location: 0, length: text.count))
        attributed.addAttribute(.foregroundColor, value: textClr,
                                range: NSRange(location: 0, length: text.count))
        titleLabel.attributedText = attributed

        // Subtle purple glow
        titleLabel.layer.shadowColor = purple.cgColor
        titleLabel.layer.shadowOpacity = 0.55
        titleLabel.layer.shadowRadius = 16
        titleLabel.layer.shadowOffset = .zero

        contentStack.addSubview(titleLabel)

        NSLayoutConstraint.activate([
            titleLabel.centerXAnchor.constraint(equalTo: contentStack.centerXAnchor),
            titleLabel.topAnchor.constraint(equalTo: iconContainer.bottomAnchor, constant: 24),
        ])
    }

    // MARK: - Tagline

    private func setupTagline() {
        taglineLabel.textAlignment = .center
        taglineLabel.translatesAutoresizingMaskIntoConstraints = false

        let text = "FOCUS  \u{00B7}  GROW  \u{00B7}  COLLECT"
        let attributed = NSMutableAttributedString(string: text)
        attributed.addAttribute(.kern, value: 4.0,
                                range: NSRange(location: 0, length: text.count))
        attributed.addAttribute(.foregroundColor, value: tagClr,
                                range: NSRange(location: 0, length: text.count))
        let tagFontSize: CGFloat = 11
        if let desc = UIFont.systemFont(ofSize: tagFontSize, weight: .semibold)
                .fontDescriptor.withDesign(.rounded) {
            attributed.addAttribute(.font, value: UIFont(descriptor: desc, size: tagFontSize),
                                    range: NSRange(location: 0, length: text.count))
        } else {
            attributed.addAttribute(.font, value: UIFont.systemFont(ofSize: tagFontSize, weight: .semibold),
                                    range: NSRange(location: 0, length: text.count))
        }
        taglineLabel.attributedText = attributed

        contentStack.addSubview(taglineLabel)

        NSLayoutConstraint.activate([
            taglineLabel.centerXAnchor.constraint(equalTo: contentStack.centerXAnchor),
            taglineLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 10),
        ])
    }

    // MARK: - Loading Bar

    private func setupLoadingBar() {
        // Track
        barTrackView.backgroundColor = trackClr
        barTrackView.layer.cornerRadius = 2
        barTrackView.clipsToBounds = true
        barTrackView.translatesAutoresizingMaskIntoConstraints = false
        contentStack.addSubview(barTrackView)

        // Fill
        barFillView.layer.cornerRadius = 2
        barFillView.clipsToBounds = true
        barFillView.translatesAutoresizingMaskIntoConstraints = false

        // Gradient fill
        let fillGradient = CAGradientLayer()
        fillGradient.colors = [purple.cgColor, purpleLt.cgColor]
        fillGradient.startPoint = CGPoint(x: 0, y: 0.5)
        fillGradient.endPoint = CGPoint(x: 1, y: 0.5)
        fillGradient.frame = CGRect(x: 0, y: 0, width: trackWidth, height: 4)
        fillGradient.cornerRadius = 2
        barFillView.layer.addSublayer(fillGradient)

        // Shimmer highlight that sweeps across the fill
        shimmerLayer.colors = [
            UIColor.clear.cgColor,
            UIColor.white.withAlphaComponent(0.35).cgColor,
            UIColor.clear.cgColor,
        ]
        shimmerLayer.locations = [0.0, 0.5, 1.0]
        shimmerLayer.startPoint = CGPoint(x: 0, y: 0.5)
        shimmerLayer.endPoint = CGPoint(x: 1, y: 0.5)
        shimmerLayer.frame = CGRect(x: 0, y: 0, width: trackWidth, height: 4)
        barFillView.layer.addSublayer(shimmerLayer)

        barTrackView.addSubview(barFillView)

        barFillWidthConstraint = barFillView.widthAnchor.constraint(equalToConstant: trackWidth * 0.25)

        NSLayoutConstraint.activate([
            barTrackView.widthAnchor.constraint(equalToConstant: trackWidth),
            barTrackView.heightAnchor.constraint(equalToConstant: 4),
            barTrackView.centerXAnchor.constraint(equalTo: contentStack.centerXAnchor),
            barTrackView.topAnchor.constraint(equalTo: taglineLabel.bottomAnchor, constant: 44),

            barFillView.leadingAnchor.constraint(equalTo: barTrackView.leadingAnchor),
            barFillView.topAnchor.constraint(equalTo: barTrackView.topAnchor),
            barFillView.bottomAnchor.constraint(equalTo: barTrackView.bottomAnchor),
            barFillWidthConstraint,
        ])
    }

    // MARK: - Animations

    private func playEntranceAnimations() {
        // Entrance: content fades in and slides up
        contentStack.transform = CGAffineTransform(translationX: 0, y: 14)
        UIView.animate(
            withDuration: 0.6,
            delay: 0.05,
            options: .curveEaseOut,
            animations: { [weak self] in
                self?.contentStack.alpha = 1
                self?.contentStack.transform = .identity
            }
        )

        // Loading bar fill: 25% → 80% with ease, autoreverse
        let targetWidth = trackWidth * 0.80
        UIView.animate(
            withDuration: 2.0,
            delay: 0.3,
            options: [.autoreverse, .repeat, .curveEaseInOut],
            animations: { [weak self] in
                self?.barFillWidthConstraint.constant = targetWidth
                self?.barTrackView.layoutIfNeeded()
            }
        )

        // Shimmer sweep across the loading bar
        let shimmerAnim = CABasicAnimation(keyPath: "locations")
        shimmerAnim.fromValue = [-0.3, -0.15, 0.0]
        shimmerAnim.toValue = [1.0, 1.15, 1.3]
        shimmerAnim.duration = 1.6
        shimmerAnim.repeatCount = .infinity
        shimmerAnim.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
        shimmerLayer.add(shimmerAnim, forKey: "shimmer")

        // Glow breathing: gentle scale + opacity
        UIView.animate(
            withDuration: 3.0,
            delay: 0,
            options: [.autoreverse, .repeat, .curveEaseInOut],
            animations: { [weak self] in
                self?.glowContainer.transform = CGAffineTransform(scaleX: 1.12, y: 1.12)
                self?.glowContainer.alpha = 0.7
            }
        )
    }

    // MARK: - Dismiss

    /// Fade out and remove from the view hierarchy.
    func dismissSplash(completion: (() -> Void)? = nil) {
        NotificationCenter.default.removeObserver(self)

        barFillView.layer.removeAllAnimations()
        shimmerLayer.removeAllAnimations()
        glowContainer.layer.removeAllAnimations()

        UIView.animate(
            withDuration: 0.5,
            delay: 0,
            usingSpringWithDamping: 1.0,
            initialSpringVelocity: 0,
            options: .curveEaseOut,
            animations: { [weak self] in
                self?.view.alpha = 0
                self?.contentStack.transform = CGAffineTransform(translationX: 0, y: -10)
            },
            completion: { [weak self] _ in
                self?.view.removeFromSuperview()
                self?.removeFromParent()
                completion?()
            }
        )
    }
}
