import Foundation
import StoreKit

/**
 * StoreKitProductManager
 *
 * Manages StoreKit product fetching and caching.
 * Uses retry logic for network resilience.
 */
@available(iOS 15.0, *)
final class StoreKitProductManager {

    // MARK: - Singleton

    static let shared = StoreKitProductManager()

    // MARK: - Properties

    private var cachedProducts: [String: Product] = [:]
    private let lock = NSLock()

    // MARK: - Initialization

    init() {
        Log.storeKit.debug("StoreKitProductManager initialized")
    }

    // MARK: - Product Fetching

    /// Fetches products by IDs with retry logic
    func fetchProducts(productIds: [String]) async throws -> [Product] {
        Log.storeKit.operationStart("fetchProducts")

        let products = try await withRetry {
            try await Product.products(for: Set(productIds))
        }

        // Cache the products
        lock.lock()
        for product in products {
            cachedProducts[product.id] = product
        }
        lock.unlock()

        Log.storeKit.success("Fetched \(products.count) products")
        return Array(products)
    }

    /// Gets a cached product or fetches it
    func getProduct(productId: String) async throws -> Product {
        // Check cache first
        lock.lock()
        if let cached = cachedProducts[productId] {
            lock.unlock()
            return cached
        }
        lock.unlock()

        // Fetch from store
        let products = try await fetchProducts(productIds: [productId])
        guard let product = products.first else {
            throw StoreKitError.productNotFound(productId: productId)
        }

        return product
    }

    /// Gets a cached product if available (non-async)
    func getCachedProduct(productId: String) -> Product? {
        lock.lock()
        defer { lock.unlock() }
        return cachedProducts[productId]
    }

    /// Clears the product cache
    func clearCache() {
        lock.lock()
        cachedProducts.removeAll()
        lock.unlock()
        Log.storeKit.debug("Product cache cleared")
    }

    // MARK: - Product Data Conversion

    /// Converts a product to a dictionary for JS
    func productToDictionary(_ product: Product) -> [String: Any] {
        var data: [String: Any] = [
            "id": product.id,
            "displayName": product.displayName,
            "description": product.description,
            "price": product.price.description,
            "displayPrice": product.displayPrice,
            "type": StoreKitConverters.productTypeString(product.type)
        ]

        if let subscription = product.subscription {
            data["subscriptionPeriod"] = [
                "unit": StoreKitConverters.periodUnitString(subscription.subscriptionPeriod.unit),
                "value": subscription.subscriptionPeriod.value
            ]
        }

        return data
    }
}
