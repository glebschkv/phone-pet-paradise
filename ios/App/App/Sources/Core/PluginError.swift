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
            return String(localized: "error.missing_parameter \(name)", defaultValue: "Missing required parameter: \(name)")
        case .invalidParameter(let name, let reason):
            return String(localized: "error.invalid_parameter \(name) \(reason)", defaultValue: "Invalid parameter '\(name)': \(reason)")
        case .invalidFormat(let field, let expected):
            return String(localized: "error.invalid_format \(field) \(expected)", defaultValue: "Invalid format for '\(field)'. Expected: \(expected)")

        // Permissions
        case .permissionDenied(let feature):
            return String(localized: "error.permission_denied \(feature)", defaultValue: "\(feature) permission denied")
        case .permissionNotDetermined(let feature):
            return String(localized: "error.permission_not_determined \(feature)", defaultValue: "\(feature) permission not yet requested")
        case .permissionRestricted(let feature):
            return String(localized: "error.permission_restricted \(feature)", defaultValue: "\(feature) is restricted on this device")

        // StoreKit
        case .productNotFound(let productId):
            return String(localized: "error.product_not_found \(productId)", defaultValue: "Product not found: \(productId)")
        case .purchaseFailed(let reason):
            return String(localized: "error.purchase_failed \(reason)", defaultValue: "Purchase failed: \(reason)")
        case .purchaseCancelled:
            return String(localized: "error.purchase_cancelled", defaultValue: "Purchase was cancelled")
        case .purchasePending:
            return String(localized: "error.purchase_pending", defaultValue: "Purchase is pending approval")
        case .transactionVerificationFailed:
            return String(localized: "error.transaction_verification_failed", defaultValue: "Transaction verification failed")
        case .noActiveSubscription:
            return String(localized: "error.no_active_subscription", defaultValue: "No active subscription found")

        // Device Activity
        case .monitoringFailed(let reason):
            return String(localized: "error.monitoring_failed \(reason)", defaultValue: "Monitoring failed: \(reason)")
        case .selectionDecodingFailed:
            return String(localized: "error.selection_decoding_failed", defaultValue: "Failed to decode app selection")
        case .activitySchedulingFailed(let reason):
            return String(localized: "error.activity_scheduling_failed \(reason)", defaultValue: "Activity scheduling failed: \(reason)")

        // Blocking
        case .blockingNotConfigured:
            return String(localized: "error.blocking_not_configured", defaultValue: "App blocking is not configured")
        case .shieldApplicationFailed(let reason):
            return String(localized: "error.shield_application_failed \(reason)", defaultValue: "Failed to apply shield: \(reason)")

        // Storage
        case .sharedContainerUnavailable:
            return String(localized: "error.shared_container_unavailable", defaultValue: "Shared container is unavailable")
        case .dataEncodingFailed:
            return String(localized: "error.data_encoding_failed", defaultValue: "Failed to encode data")
        case .dataDecodingFailed:
            return String(localized: "error.data_decoding_failed", defaultValue: "Failed to decode data")

        // System
        case .windowSceneUnavailable:
            return String(localized: "error.window_scene_unavailable", defaultValue: "Window scene is unavailable")
        case .backgroundTaskFailed(let reason):
            return String(localized: "error.background_task_failed \(reason)", defaultValue: "Background task failed: \(reason)")
        case .networkError(let underlying):
            if let error = underlying {
                return String(localized: "error.network_error", defaultValue: "Network error: \(error.localizedDescription)")
            }
            return String(localized: "error.network_error_generic", defaultValue: "A network error occurred")
        case .unknownError(let message):
            return String(localized: "error.unknown \(message)", defaultValue: "An error occurred: \(message)")
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
