import Foundation
import StoreKit
import UIKit

/**
 * StoreKitPurchaseService
 *
 * Handles purchase flow, restoration, and subscription management.
 */
@available(iOS 15.0, *)
final class StoreKitPurchaseService {

    // MARK: - Singleton

    static let shared = StoreKitPurchaseService()

    // MARK: - Dependencies

    private let productManager: StoreKitProductManager
    private let transactionManager: StoreKitTransactionManager

    // MARK: - Initialization

    init(
        productManager: StoreKitProductManager = .shared,
        transactionManager: StoreKitTransactionManager = .shared
    ) {
        self.productManager = productManager
        self.transactionManager = transactionManager
        Log.storeKit.debug("StoreKitPurchaseService initialized")
    }

    // MARK: - Purchase

    /// Purchases a product by ID
    func purchase(productId: String) async throws -> PurchaseResult {
        Log.storeKit.operationStart("purchase: \(productId)")

        let product = try await productManager.getProduct(productId: productId)
        let result = try await product.purchase()

        switch result {
        case .success(let verification):
            let transaction = try transactionManager.verifyTransaction(verification)
            let jwsRepresentation = verification.jwsRepresentation

            await transactionManager.finishTransaction(transaction)

            Log.storeKit.success("Purchase completed: \(productId)")
            return .success(PurchaseSuccess(
                transaction: transaction,
                jwsRepresentation: jwsRepresentation
            ))

        case .userCancelled:
            Log.storeKit.info("Purchase cancelled by user: \(productId)")
            return .cancelled

        case .pending:
            Log.storeKit.info("Purchase pending: \(productId)")
            return .pending

        @unknown default:
            throw StoreKitError.purchaseFailed(reason: "Unknown purchase result")
        }
    }

    // MARK: - Restore Purchases

    /// Restores all purchases with retry logic
    func restorePurchases() async throws -> RestoreResult {
        Log.storeKit.operationStart("restorePurchases")

        // Sync with AppStore
        try await withRetry {
            try await AppStore.sync()
        }

        let entitlements = await transactionManager.getCurrentEntitlements()

        let purchases = entitlements.map { verified -> [String: Any] in
            let transaction = verified.transaction
            return [
                "productId": transaction.productID,
                "transactionId": String(transaction.id),
                "originalTransactionId": String(transaction.originalID),
                "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                "expirationDate": transaction.expirationDate?.timeIntervalSince1970 as Any,
                "signedTransaction": verified.jwsRepresentation,
                "environment": StoreKitConverters.environmentString(transaction)
            ]
        }

        Log.storeKit.success("Restored \(purchases.count) purchases")
        return RestoreResult(purchases: purchases)
    }

    // MARK: - Subscription Status

    /// Gets current subscription and purchase status
    func getSubscriptionStatus() async -> SubscriptionStatus {
        Log.storeKit.operationStart("getSubscriptionStatus")

        let entitlements = await transactionManager.getCurrentEntitlements()

        var activeSubscriptions: [[String: Any]] = []
        var purchasedProducts: [[String: Any]] = []

        for verified in entitlements {
            let transaction = verified.transaction
            let purchaseInfo: [String: Any] = [
                "productId": transaction.productID,
                "transactionId": String(transaction.id),
                "originalTransactionId": String(transaction.originalID),
                "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                "expirationDate": transaction.expirationDate?.timeIntervalSince1970 as Any,
                "isUpgraded": transaction.isUpgraded,
                "signedTransaction": verified.jwsRepresentation,
                "environment": StoreKitConverters.environmentString(transaction)
            ]

            if transaction.expirationDate != nil {
                activeSubscriptions.append(purchaseInfo)
            } else {
                purchasedProducts.append(purchaseInfo)
            }
        }

        Log.storeKit.success("Found \(activeSubscriptions.count) subscriptions, \(purchasedProducts.count) products")
        return SubscriptionStatus(
            activeSubscriptions: activeSubscriptions,
            purchasedProducts: purchasedProducts
        )
    }

    // MARK: - Purchase History

    /// Gets complete purchase history
    func getPurchaseHistory() async -> [[String: Any]] {
        Log.storeKit.operationStart("getPurchaseHistory")

        let transactions = await transactionManager.getTransactionHistory()

        let history = transactions.map { transaction -> [String: Any] in
            [
                "productId": transaction.productID,
                "transactionId": String(transaction.id),
                "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
                "expirationDate": transaction.expirationDate?.timeIntervalSince1970 as Any,
                "revocationDate": transaction.revocationDate?.timeIntervalSince1970 as Any
            ]
        }

        Log.storeKit.success("Retrieved \(history.count) history items")
        return history
    }

    // MARK: - Subscription Management

    /// Shows the subscription management UI
    @MainActor
    func showManageSubscriptions() async throws {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            throw StoreKitError.windowSceneUnavailable
        }

        try await AppStore.showManageSubscriptions(in: windowScene)
        Log.storeKit.success("Showed subscription management")
    }
}

// MARK: - Result Types

@available(iOS 15.0, *)
enum PurchaseResult {
    case success(PurchaseSuccess)
    case cancelled
    case pending
}

@available(iOS 15.0, *)
struct PurchaseSuccess {
    let transaction: Transaction
    let jwsRepresentation: String

    var asDictionary: [String: Any] {
        [
            "success": true,
            "transactionId": String(transaction.id),
            "originalTransactionId": String(transaction.originalID),
            "productId": transaction.productID,
            "purchaseDate": transaction.purchaseDate.timeIntervalSince1970,
            "expirationDate": transaction.expirationDate?.timeIntervalSince1970 as Any,
            "signedTransaction": jwsRepresentation,
            "environment": StoreKitConverters.environmentString(transaction),
            "storefrontCountryCode": transaction.storefrontCountryCode
        ]
    }
}

struct RestoreResult {
    let purchases: [[String: Any]]

    var asDictionary: [String: Any] {
        [
            "success": true,
            "restoredCount": purchases.count,
            "purchases": purchases
        ]
    }
}

struct SubscriptionStatus {
    let activeSubscriptions: [[String: Any]]
    let purchasedProducts: [[String: Any]]

    var hasActiveSubscription: Bool {
        !activeSubscriptions.isEmpty || !purchasedProducts.isEmpty
    }

    var asDictionary: [String: Any] {
        [
            "hasActiveSubscription": hasActiveSubscription,
            "activeSubscriptions": activeSubscriptions,
            "purchasedProducts": purchasedProducts
        ]
    }
}
