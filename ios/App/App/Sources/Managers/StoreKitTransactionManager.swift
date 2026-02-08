import Foundation
import StoreKit

/**
 * StoreKitTransactionManager
 *
 * Manages StoreKit transaction listening, verification, and finishing.
 * Handles the continuous stream of transaction updates.
 *
 * IMPORTANT: Transactions from the purchase flow are NOT auto-finished.
 * The JS side calls `finishTransaction` after successful server validation.
 * Only background transaction updates (renewals, deferred purchases) are
 * auto-finished by the listener.
 */
@available(iOS 15.0, *)
final class StoreKitTransactionManager {

    // MARK: - Singleton

    static let shared = StoreKitTransactionManager()

    // MARK: - Properties

    private var updateListenerTask: Task<Void, Error>?
    private var transactionHandler: (([String: Any]) -> Void)?

    /// Transactions pending server-side validation (keyed by transaction ID).
    /// The purchase flow stores them here; JS calls finishTransaction after validation.
    private var unfinishedTransactions: [UInt64: Transaction] = [:]
    private let lock = NSLock()

    // MARK: - Initialization

    init() {
        Log.storeKit.debug("StoreKitTransactionManager initialized")
    }

    deinit {
        stopListening()
    }

    // MARK: - Unfinished Transaction Storage

    /// Stores a transaction that is pending server-side validation.
    func storeUnfinishedTransaction(_ transaction: Transaction) {
        lock.lock()
        unfinishedTransactions[transaction.id] = transaction
        lock.unlock()
        Log.storeKit.debug("Stored unfinished transaction: \(transaction.id) (\(transaction.productID))")
    }

    /// Finishes a previously stored unfinished transaction by ID.
    /// Returns true if the transaction was found and finished.
    func finishStoredTransaction(transactionId: UInt64) async -> Bool {
        lock.lock()
        let transaction = unfinishedTransactions.removeValue(forKey: transactionId)
        lock.unlock()

        if let transaction = transaction {
            await transaction.finish()
            Log.storeKit.success("Finished stored transaction: \(transactionId) (\(transaction.productID))")
            return true
        }

        // Transaction not in our storage — try to find it in unfinished transactions
        // This handles the case where the app was restarted between purchase and finish
        for await result in Transaction.unfinished {
            do {
                let tx = try verifyTransaction(result)
                if tx.id == transactionId {
                    await tx.finish()
                    Log.storeKit.success("Finished unfinished transaction from store: \(transactionId)")
                    return true
                }
            } catch {
                continue
            }
        }

        Log.storeKit.warning("Transaction not found for finishing: \(transactionId)")
        return false
    }

    // MARK: - Transaction Listener

    /// Starts listening for transaction updates (renewals, deferred purchases, etc.)
    func startListening() {
        guard updateListenerTask == nil else {
            Log.storeKit.debug("Transaction listener already running")
            return
        }

        updateListenerTask = Task.detached { [weak self] in
            Log.storeKit.info("Started listening for transaction updates")

            for await result in Transaction.updates {
                do {
                    let transaction = try self?.verifyTransaction(result)
                    if let transaction = transaction {
                        // Auto-finish background updates (renewals, etc.)
                        // These are not from the active purchase flow.
                        await transaction.finish()
                        Log.storeKit.success("Transaction update finished: \(transaction.productID)")

                        let data: [String: Any] = [
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id),
                            "purchaseDate": transaction.purchaseDate.timeIntervalSince1970
                        ]
                        self?.transactionHandler?(data)
                    }
                } catch {
                    Log.storeKit.failure("Transaction verification failed", error: error)
                }
            }
        }
    }

    /// Stops listening for transaction updates
    func stopListening() {
        updateListenerTask?.cancel()
        updateListenerTask = nil
        Log.storeKit.info("Stopped listening for transaction updates")
    }

    /// Sets the handler for transaction updates
    func setTransactionHandler(_ handler: @escaping ([String: Any]) -> Void) {
        self.transactionHandler = handler
    }

    // MARK: - Transaction Verification

    /// Verifies a transaction result
    func verifyTransaction<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreKitError.transactionVerificationFailed
        case .verified(let safe):
            return safe
        }
    }

    /// Finishes a transaction
    func finishTransaction(_ transaction: Transaction) async {
        await transaction.finish()
        Log.storeKit.debug("Transaction finished: \(transaction.productID)")
    }

    // MARK: - Current Entitlements

    /// Gets all current entitlements with verification
    func getCurrentEntitlements() async -> [VerifiedTransaction] {
        var entitlements: [VerifiedTransaction] = []

        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try verifyTransaction(result)
                let jwsRepresentation = result.jwsRepresentation
                entitlements.append(VerifiedTransaction(
                    transaction: transaction,
                    jwsRepresentation: jwsRepresentation
                ))
            } catch {
                Log.storeKit.warning("Failed to verify entitlement: \(error)")
            }
        }

        return entitlements
    }

    /// Gets all transaction history with verification
    func getTransactionHistory() async -> [Transaction] {
        var history: [Transaction] = []

        for await result in Transaction.all {
            do {
                let transaction = try verifyTransaction(result)
                history.append(transaction)
            } catch {
                Log.storeKit.warning("Failed to verify history transaction: \(error)")
            }
        }

        return history
    }
}

// MARK: - Verified Transaction Wrapper

@available(iOS 15.0, *)
struct VerifiedTransaction {
    let transaction: Transaction
    let jwsRepresentation: String
}
