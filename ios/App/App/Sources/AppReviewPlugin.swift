import Foundation
import Capacitor
import StoreKit

/**
 * AppReviewPlugin
 *
 * Capacitor plugin for requesting App Store reviews using SKStoreReviewController.
 */
@objc(AppReviewPlugin)
public class AppReviewPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppReviewPlugin"
    public let jsName = "AppReview"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestReview", returnType: CAPPluginReturnPromise)
    ]

    /**
     * Request an App Store review prompt.
     *
     * Note: iOS controls when the review dialog actually appears.
     * The system may not show the prompt if:
     * - The user has already reviewed the app
     * - The prompt has been shown too recently
     * - The device is in a restricted mode
     */
    @objc func requestReview(_ call: CAPPluginCall) {
        Task { @MainActor in
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
                // Use the modern API for iOS 16+
                if #available(iOS 16.0, *) {
                    AppStore.requestReview(in: windowScene)
                } else {
                    // Fallback for iOS 14-15
                    SKStoreReviewController.requestReview(in: windowScene)
                }

                call.resolve(["success": true, "message": "Review request sent"])
            } else {
                // Fallback without window scene
                if #available(iOS 14.0, *) {
                    if let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                        SKStoreReviewController.requestReview(in: scene)
                        call.resolve(["success": true, "message": "Review request sent"])
                    } else {
                        call.reject("Could not get active window scene")
                    }
                } else {
                    call.reject("iOS version too old for in-app review")
                }
            }
        }
    }
}
