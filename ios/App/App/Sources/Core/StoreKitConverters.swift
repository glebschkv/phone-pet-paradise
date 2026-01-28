import Foundation
import StoreKit

/**
 * StoreKitConverters
 *
 * Utility functions for converting StoreKit types to strings.
 * Centralized type conversion logic for consistent output.
 */
@available(iOS 15.0, *)
enum StoreKitConverters {

    // MARK: - Product Type

    /// Converts Product.ProductType to a string
    static func productTypeString(_ type: Product.ProductType) -> String {
        switch type {
        case .consumable:
            return "consumable"
        case .nonConsumable:
            return "nonConsumable"
        case .autoRenewable:
            return "autoRenewable"
        case .nonRenewable:
            return "nonRenewable"
        default:
            return "unknown"
        }
    }

    // MARK: - Subscription Period

    /// Converts SubscriptionPeriod.Unit to a string
    static func periodUnitString(_ unit: Product.SubscriptionPeriod.Unit) -> String {
        switch unit {
        case .day:
            return "day"
        case .week:
            return "week"
        case .month:
            return "month"
        case .year:
            return "year"
        default:
            return "unknown"
        }
    }

    // MARK: - Environment

    /// Gets the environment string (sandbox/production) from a transaction
    static func environmentString(_ transaction: Transaction) -> String {
        if #available(iOS 16.0, *) {
            switch transaction.environment {
            case .sandbox:
                return "sandbox"
            case .production:
                return "production"
            case .xcode:
                return "sandbox"
            default:
                return "production"
            }
        } else {
            // Fallback for iOS 15
            if let receiptURL = Bundle.main.appStoreReceiptURL,
               receiptURL.lastPathComponent == "sandboxReceipt" {
                return "sandbox"
            }
            return "production"
        }
    }
}
