import Foundation
import Capacitor
import StoreKit

/**
 * StoreKitPlugin
 *
 * Capacitor plugin for StoreKit 2 in-app purchases.
 * Thin coordinator that delegates to focused managers.
 */
@available(iOS 15.0, *)
@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin, CAPBridgedPlugin {

    // MARK: - Plugin Configuration

    public let identifier = "StoreKitPlugin"
    public let jsName = "StoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finishTransaction", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSubscriptionStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPurchaseHistory", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise)
    ]

    // MARK: - Dependencies

    private let productManager: StoreKitProductManager
    private let transactionManager: StoreKitTransactionManager
    private let purchaseService: StoreKitPurchaseService

    // MARK: - Initialization

    public override init() {
        self.productManager = .shared
        self.transactionManager = .shared
        self.purchaseService = .shared
        super.init()
    }

    public override func load() {
        Log.storeKit.info("StoreKitPlugin loading")
        setupTransactionHandler()
        transactionManager.startListening()
    }

    deinit {
        transactionManager.stopListening()
    }

    // MARK: - Transaction Handler Setup

    private func setupTransactionHandler() {
        transactionManager.setTransactionHandler { [weak self] data in
            self?.notifyListeners("transactionUpdated", data: data)
        }
    }

    // MARK: - Get Products

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let productIds = call.getArray("productIds", String.self), !productIds.isEmpty else {
            call.reject("Missing or empty productIds parameter", "STOREKIT_INVALID_PARAMS")
            return
        }

        Task {
            do {
                let products = try await productManager.fetchProducts(productIds: productIds)
                let productsData = products.map { productManager.productToDictionary($0) }
                call.resolve(["products": productsData])
            } catch {
                Log.storeKit.failure("getProducts failed", error: error)
                call.reject("Failed to fetch products: \(error.localizedDescription)", errorCode(from: error))
            }
        }
    }

    // MARK: - Purchase

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), !productId.isEmpty else {
            call.reject("Missing productId parameter", "STOREKIT_INVALID_PARAMS")
            return
        }

        Task {
            do {
                let result = try await purchaseService.purchase(productId: productId)

                switch result {
                case .success(let success):
                    call.resolve(success.asDictionary)

                case .cancelled:
                    call.resolve([
                        "success": false,
                        "cancelled": true,
                        "message": Strings.StoreKitStrings.purchaseCancelled
                    ])

                case .pending:
                    call.resolve([
                        "success": false,
                        "pending": true,
                        "message": Strings.StoreKitStrings.purchasePending
                    ])
                }
            } catch {
                Log.storeKit.failure("purchase failed", error: error)
                call.reject("Purchase failed: \(error.localizedDescription)", errorCode(from: error))
            }
        }
    }

    // MARK: - Finish Transaction

    /// Finishes a transaction after server-side validation.
    /// Must be called after purchase + server validation to tell Apple the purchase is complete.
    @objc func finishTransaction(_ call: CAPPluginCall) {
        guard let transactionIdString = call.getString("transactionId"),
              let transactionId = UInt64(transactionIdString) else {
            call.reject("Missing or invalid transactionId parameter", "STOREKIT_INVALID_PARAMS")
            return
        }

        Task {
            let success = await transactionManager.finishStoredTransaction(transactionId: transactionId)
            call.resolve(["success": success])
        }
    }

    // MARK: - Restore Purchases

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                let result = try await purchaseService.restorePurchases()
                call.resolve(result.asDictionary)
            } catch {
                Log.storeKit.failure("restorePurchases failed", error: error)
                call.reject("Failed to restore purchases: \(error.localizedDescription)", errorCode(from: error))
            }
        }
    }

    // MARK: - Subscription Status

    @objc func getSubscriptionStatus(_ call: CAPPluginCall) {
        Task {
            let status = await purchaseService.getSubscriptionStatus()
            call.resolve(status.asDictionary)
        }
    }

    // MARK: - Purchase History

    @objc func getPurchaseHistory(_ call: CAPPluginCall) {
        Task {
            let history = await purchaseService.getPurchaseHistory()
            call.resolve(["history": history])
        }
    }

    // MARK: - Manage Subscriptions

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                try await purchaseService.showManageSubscriptions()
                call.resolve(["success": true])
            } catch {
                Log.storeKit.failure("manageSubscriptions failed", error: error)
                call.reject("Failed to show subscription management: \(error.localizedDescription)", errorCode(from: error))
            }
        }
    }

    // MARK: - Error Handling

    private func errorCode(from error: Error) -> String {
        if let storeKitError = error as? StoreKitError {
            return storeKitError.errorCode
        }
        return "STOREKIT_UNKNOWN"
    }
}

// MARK: - Strings Extension

extension Strings {
    enum StoreKit {
        static var purchaseCancelled: String {
            NSLocalizedString("storekit.purchase_cancelled",
                             value: "User cancelled the purchase",
                             comment: "Message when user cancels a purchase")
        }

        static var purchasePending: String {
            NSLocalizedString("storekit.purchase_pending",
                             value: "Purchase is pending approval",
                             comment: "Message when purchase requires approval")
        }
    }
}
