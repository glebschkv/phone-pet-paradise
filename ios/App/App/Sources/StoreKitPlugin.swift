import Foundation
import Capacitor
import StoreKit

/**
 * StoreKitPlugin
 *
 * Capacitor plugin for StoreKit 2 in-app purchases.
 * Handles subscriptions, consumables, and non-consumables.
 * Includes retry logic for network operations.
 */
@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreKitPlugin"
    public let jsName = "StoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSubscriptionStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPurchaseHistory", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise)
    ]

    private var products: [String: Product] = [:]
    private var updateListenerTask: Task<Void, Error>?

    public override func load() {
        // Start listening for transaction updates
        updateListenerTask = listenForTransactions()
    }

    deinit {
        updateListenerTask?.cancel()
    }

    // MARK: - Transaction Listener

    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached { [weak self] in
            for await result in Transaction.updates {
                do {
                    let transaction = try self?.checkVerified(result)
                    if let transaction = transaction {
                        await transaction.finish()
                        self?.notifyListeners("transactionUpdated", data: [
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id),
                            "purchaseDate": transaction.purchaseDate.timeIntervalSince1970
                        ])
                    }
                } catch {
                    print("[StoreKitPlugin] Transaction verification failed: \(error)")
                }
            }
        }
    }

    // MARK: - Get Products (with retry)

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let productIds = call.getArray("productIds", String.self) else {
            call.reject("Missing productIds parameter")
            return
        }

        Task {
            do {
                // Use retry logic for network operation
                let storeProducts = try await withRetry {
                    try await Product.products(for: Set(productIds))
                }

                var productsData: [[String: Any]] = []
                for product in storeProducts {
                    self.products[product.id] = product

                    var productData: [String: Any] = [
                        "id": product.id,
                        "displayName": product.displayName,
                        "description": product.description,
                        "price": product.price.description,
                        "displayPrice": product.displayPrice,
                        "type": self.productTypeString(product.type)
                    ]

                    // Add subscription info if applicable
                    if let subscription = product.subscription {
                        productData["subscriptionPeriod"] = [
                            "unit": self.periodUnitString(subscription.subscriptionPeriod.unit),
                            "value": subscription.subscriptionPeriod.value
                        ]
                    }

                    productsData.append(productData)
                }

                call.resolve(["products": productsData])
            } catch {
                call.reject("Failed to fetch products: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Purchase

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId parameter")
            return
        }

        Task {
            do {
                // Get product if not cached (with retry)
                var product = self.products[productId]
                if product == nil {
                    let products = try await withRetry {
                        try await Product.products(for: [productId])
                    }
                    product = products.first
                    if let p = product {
                        self.products[productId] = p
                    }
                }

                guard let product = product else {
                    call.reject("Product not found: \(productId)")
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    let transaction = try self.checkVerified(verification)

                    // Get the JWS representation for server-side validation
                    let jwsRepresentation = verification.jwsRepresentation

                    // Finish the transaction
                    await transaction.finish()

                    // Determine environment (sandbox vs production)
                    let environment = self.getEnvironmentString(transaction)

                    call.resolve([
                        "success": true,
                        "transactionId": String(transaction.id),
                        "originalTransactionId": String(transaction.originalID),
                        "productId": transaction.productID,
                        "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                        "expirationDate": transaction.expirationDate?.timeIntervalSince1970 as Any,
                        "signedTransaction": jwsRepresentation,
                        "environment": environment,
                        "storefrontCountryCode": transaction.storefrontCountryCode
                    ])

                case .userCancelled:
                    call.resolve([
                        "success": false,
                        "cancelled": true,
                        "message": "User cancelled the purchase"
                    ])

                case .pending:
                    call.resolve([
                        "success": false,
                        "pending": true,
                        "message": "Purchase is pending approval"
                    ])

                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Restore Purchases (with retry)

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                // Retry AppStore sync for network resilience
                try await withRetry {
                    try await AppStore.sync()
                }

                var restoredPurchases: [[String: Any]] = []

                // Get all current entitlements
                for await result in Transaction.currentEntitlements {
                    do {
                        let transaction = try self.checkVerified(result)
                        let jwsRepresentation = result.jwsRepresentation
                        let environment = self.getEnvironmentString(transaction)

                        restoredPurchases.append([
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id),
                            "originalTransactionId": String(transaction.originalID),
                            "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                            "expirationDate": transaction.expirationDate?.timeIntervalSince1970 as Any,
                            "signedTransaction": jwsRepresentation,
                            "environment": environment
                        ])
                    } catch {
                        print("[StoreKitPlugin] Failed to verify transaction: \(error)")
                    }
                }

                call.resolve([
                    "success": true,
                    "restoredCount": restoredPurchases.count,
                    "purchases": restoredPurchases
                ])
            } catch {
                call.reject("Failed to restore purchases: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Get Subscription Status

    @objc func getSubscriptionStatus(_ call: CAPPluginCall) {
        Task {
            var activeSubscriptions: [[String: Any]] = []
            var purchasedProducts: [[String: Any]] = []

            // Check all current entitlements
            for await result in Transaction.currentEntitlements {
                do {
                    let transaction = try self.checkVerified(result)
                    let jwsRepresentation = result.jwsRepresentation
                    let environment = self.getEnvironmentString(transaction)

                    let purchaseInfo: [String: Any] = [
                        "productId": transaction.productID,
                        "transactionId": String(transaction.id),
                        "originalTransactionId": String(transaction.originalID),
                        "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                        "expirationDate": transaction.expirationDate?.timeIntervalSince1970 as Any,
                        "isUpgraded": transaction.isUpgraded,
                        "signedTransaction": jwsRepresentation,
                        "environment": environment
                    ]

                    if transaction.expirationDate != nil {
                        // This is a subscription
                        activeSubscriptions.append(purchaseInfo)
                    } else {
                        // This is a non-consumable or lifetime purchase
                        purchasedProducts.append(purchaseInfo)
                    }
                } catch {
                    print("[StoreKitPlugin] Failed to verify entitlement: \(error)")
                }
            }

            call.resolve([
                "hasActiveSubscription": !activeSubscriptions.isEmpty || !purchasedProducts.isEmpty,
                "activeSubscriptions": activeSubscriptions,
                "purchasedProducts": purchasedProducts
            ])
        }
    }

    // MARK: - Get Purchase History

    @objc func getPurchaseHistory(_ call: CAPPluginCall) {
        Task {
            var history: [[String: Any]] = []

            for await result in Transaction.all {
                do {
                    let transaction = try self.checkVerified(result)
                    history.append([
                        "productId": transaction.productID,
                        "transactionId": String(transaction.id),
                        "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                        "expirationDate": transaction.expirationDate?.timeIntervalSince1970 as Any,
                        "revocationDate": transaction.revocationDate?.timeIntervalSince1970 as Any
                    ])
                } catch {
                    print("[StoreKitPlugin] Failed to verify history transaction: \(error)")
                }
            }

            call.resolve(["history": history])
        }
    }

    // MARK: - Manage Subscriptions

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
                call.reject("Could not get window scene")
                return
            }

            do {
                try await AppStore.showManageSubscriptions(in: windowScene)
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to show subscription management: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Helper Methods

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreKitPluginError.failedVerification
        case .verified(let safe):
            return safe
        }
    }

    private func productTypeString(_ type: Product.ProductType) -> String {
        switch type {
        case .consumable:
            return "consumable"
        case .nonConsumable:
            return "nonConsumable"
        case .autoRenewable:
            return "autoRenewable"
        case .nonRenewable:
            return "nonRenewable"
        @unknown default:
            return "unknown"
        }
    }

    private func periodUnitString(_ unit: Product.SubscriptionPeriod.Unit) -> String {
        switch unit {
        case .day:
            return "day"
        case .week:
            return "week"
        case .month:
            return "month"
        case .year:
            return "year"
        @unknown default:
            return "unknown"
        }
    }

    private func getEnvironmentString(_ transaction: Transaction) -> String {
        if #available(iOS 16.0, *) {
            switch transaction.environment {
            case .sandbox:
                return "sandbox"
            case .production:
                return "production"
            case .xcode:
                return "sandbox"
            @unknown default:
                return "production"
            }
        } else {
            if let receiptURL = Bundle.main.appStoreReceiptURL,
               receiptURL.lastPathComponent == "sandboxReceipt" {
                return "sandbox"
            }
            return "production"
        }
    }
}

// MARK: - Errors

enum StoreKitPluginError: Error, LocalizedError {
    case failedVerification
    case productNotFound
    case purchaseFailed

    var errorDescription: String? {
        switch self {
        case .failedVerification:
            return "Transaction verification failed"
        case .productNotFound:
            return "Product not found"
        case .purchaseFailed:
            return "Purchase failed"
        }
    }
}
