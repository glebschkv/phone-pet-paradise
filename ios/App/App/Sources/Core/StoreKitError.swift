import Foundation

/**
 * StoreKitError
 *
 * Error types for StoreKit operations.
 * Provides structured error handling with localized descriptions.
 */
enum StoreKitError: Error, LocalizedError {

    case transactionVerificationFailed
    case productNotFound(productId: String)
    case purchaseFailed(reason: String)
    case restoreFailed(reason: String)
    case networkError(underlying: Error?)
    case windowSceneUnavailable
    case unknownError(message: String)

    // MARK: - LocalizedError

    var errorDescription: String? {
        switch self {
        case .transactionVerificationFailed:
            return Strings.StoreKitStrings.transactionVerificationFailed
        case .productNotFound(let productId):
            return "Product not found: \(productId)"
        case .purchaseFailed(let reason):
            return "Purchase failed: \(reason)"
        case .restoreFailed(let reason):
            return "Restore failed: \(reason)"
        case .networkError(let underlying):
            if let error = underlying {
                return "Network error: \(error.localizedDescription)"
            }
            return "A network error occurred"
        case .windowSceneUnavailable:
            return "Could not get window scene"
        case .unknownError(let message):
            return message
        }
    }

    // MARK: - Error Code

    var errorCode: String {
        switch self {
        case .transactionVerificationFailed: return "STOREKIT_001"
        case .productNotFound: return "STOREKIT_002"
        case .purchaseFailed: return "STOREKIT_003"
        case .restoreFailed: return "STOREKIT_004"
        case .networkError: return "STOREKIT_005"
        case .windowSceneUnavailable: return "STOREKIT_006"
        case .unknownError: return "STOREKIT_999"
        }
    }
}

// MARK: - Strings Extension

private extension Strings.StoreKitStrings {
    static var transactionVerificationFailed: String {
        NSLocalizedString("storekit.transaction_verification_failed",
                         value: "Transaction verification failed",
                         comment: "")
    }
}
