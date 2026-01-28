import Foundation

/**
 * PluginError
 *
 * Unified error hierarchy for all Capacitor plugins.
 * Provides structured, localizable error messages with codes for debugging.
 */
enum PluginError: Error, LocalizedError {

    // MARK: - Validation Errors

    case missingParameter(name: String)
    case invalidParameter(name: String, reason: String)
    case invalidFormat(field: String, expected: String)

    // MARK: - Permission Errors

    case permissionDenied(feature: String)
    case permissionNotDetermined(feature: String)
    case permissionRestricted(feature: String)

    // MARK: - StoreKit Errors

    case productNotFound(productId: String)
    case purchaseFailed(reason: String)
    case purchaseCancelled
    case purchasePending
    case transactionVerificationFailed
    case noActiveSubscription

    // MARK: - Device Activity Errors

    case monitoringFailed(reason: String)
    case selectionDecodingFailed
    case activitySchedulingFailed(reason: String)

    // MARK: - Blocking Errors

    case blockingNotConfigured
    case shieldApplicationFailed(reason: String)

    // MARK: - Storage Errors

    case sharedContainerUnavailable
    case dataEncodingFailed
    case dataDecodingFailed

    // MARK: - System Errors

    case windowSceneUnavailable
    case backgroundTaskFailed(reason: String)
    case networkError(underlying: Error?)
    case unknownError(message: String)

    // MARK: - LocalizedError

    var errorDescription: String? {
        switch self {
        // Validation
        case .missingParameter(let name):
            return "Missing required parameter: \(name)"
        case .invalidParameter(let name, let reason):
            return "Invalid parameter '\(name)': \(reason)"
        case .invalidFormat(let field, let expected):
            return "Invalid format for '\(field)'. Expected: \(expected)"

        // Permissions
        case .permissionDenied(let feature):
            return "\(feature) permission denied"
        case .permissionNotDetermined(let feature):
            return "\(feature) permission not yet requested"
        case .permissionRestricted(let feature):
            return "\(feature) is restricted on this device"

        // StoreKit
        case .productNotFound(let productId):
            return "Product not found: \(productId)"
        case .purchaseFailed(let reason):
            return "Purchase failed: \(reason)"
        case .purchaseCancelled:
            return "Purchase was cancelled"
        case .purchasePending:
            return "Purchase is pending approval"
        case .transactionVerificationFailed:
            return "Transaction verification failed"
        case .noActiveSubscription:
            return "No active subscription found"

        // Device Activity
        case .monitoringFailed(let reason):
            return "Monitoring failed: \(reason)"
        case .selectionDecodingFailed:
            return "Failed to decode app selection"
        case .activitySchedulingFailed(let reason):
            return "Activity scheduling failed: \(reason)"

        // Blocking
        case .blockingNotConfigured:
            return "App blocking is not configured"
        case .shieldApplicationFailed(let reason):
            return "Failed to apply shield: \(reason)"

        // Storage
        case .sharedContainerUnavailable:
            return "Shared container is unavailable"
        case .dataEncodingFailed:
            return "Failed to encode data"
        case .dataDecodingFailed:
            return "Failed to decode data"

        // System
        case .windowSceneUnavailable:
            return "Window scene is unavailable"
        case .backgroundTaskFailed(let reason):
            return "Background task failed: \(reason)"
        case .networkError(let underlying):
            if let error = underlying {
                return "Network error: \(error.localizedDescription)"
            }
            return "A network error occurred"
        case .unknownError(let message):
            return "An error occurred: \(message)"
        }
    }

    // MARK: - Error Code

    var errorCode: String {
        switch self {
        case .missingParameter: return "VALIDATION_001"
        case .invalidParameter: return "VALIDATION_002"
        case .invalidFormat: return "VALIDATION_003"
        case .permissionDenied: return "PERMISSION_001"
        case .permissionNotDetermined: return "PERMISSION_002"
        case .permissionRestricted: return "PERMISSION_003"
        case .productNotFound: return "STOREKIT_001"
        case .purchaseFailed: return "STOREKIT_002"
        case .purchaseCancelled: return "STOREKIT_003"
        case .purchasePending: return "STOREKIT_004"
        case .transactionVerificationFailed: return "STOREKIT_005"
        case .noActiveSubscription: return "STOREKIT_006"
        case .monitoringFailed: return "ACTIVITY_001"
        case .selectionDecodingFailed: return "ACTIVITY_002"
        case .activitySchedulingFailed: return "ACTIVITY_003"
        case .blockingNotConfigured: return "BLOCKING_001"
        case .shieldApplicationFailed: return "BLOCKING_002"
        case .sharedContainerUnavailable: return "STORAGE_001"
        case .dataEncodingFailed: return "STORAGE_002"
        case .dataDecodingFailed: return "STORAGE_003"
        case .windowSceneUnavailable: return "SYSTEM_001"
        case .backgroundTaskFailed: return "SYSTEM_002"
        case .networkError: return "NETWORK_001"
        case .unknownError: return "UNKNOWN_001"
        }
    }
}

// MARK: - Plugin Error Conversion

extension PluginError {
    /// Creates a dictionary suitable for plugin rejection
    var rejectionData: [String: Any] {
        [
            "code": errorCode,
            "message": errorDescription ?? "Unknown error"
        ]
    }
}
