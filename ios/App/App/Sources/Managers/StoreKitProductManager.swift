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

        // Log storefront info for debugging price-currency mismatches
        if let storefront = await Storefront.current {
            Log.storeKit.info("Storefront: \(storefront.countryCode), Device locale: \(Locale.current.identifier)")
        }

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

    /// Converts a product to a dictionary for JS.
    /// Uses a device-locale price formatter so that European users see "€X,XX"
    /// even when the sandbox/TestFlight storefront is US (which would make
    /// `product.displayPrice` return "$X.XX").  In production the storefront
    /// matches the real user's region so both values are identical.
    func productToDictionary(_ product: Product) -> [String: Any] {
        // Format price using the device's current locale — this matches the
        // currency the user actually expects to see.
        let localizedPrice: String = {
            let formatter = NumberFormatter()
            formatter.numberStyle = .currency
            formatter.locale = Locale.current
            return formatter.string(from: product.price as NSDecimalNumber)
                ?? product.displayPrice
        }()

        var data: [String: Any] = [
            "id": product.id,
            "displayName": product.displayName,
            "description": product.description,
            "price": product.price.description,
            "displayPrice": localizedPrice,
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
