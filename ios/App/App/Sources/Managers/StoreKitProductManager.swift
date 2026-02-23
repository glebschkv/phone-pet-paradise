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

    /// The storefront country code detected during the last product fetch.
    /// Used by StoreKitPlugin to pass to JS for currency-mismatch detection.
    private(set) var lastStorefrontCountryCode: String?

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

        // Capture storefront info for currency-mismatch detection on the JS side.
        // In TestFlight/sandbox, displayPrice can return USD even for non-US
        // storefronts — the JS layer uses this code to detect and work around it.
        if let storefront = await Storefront.current {
            lastStorefrontCountryCode = storefront.countryCode
            Log.storeKit.info("Storefront: \(storefront.countryCode), Device locale: \(Locale.current.identifier)")
        } else {
            // Storefront.current is nil in some TestFlight/sandbox scenarios.
            // Fall back to the device's locale region (2-letter ISO code, e.g. "NL",
            // "US", "DE") so the JS layer can still detect currency mismatches.
            let fallbackRegion: String?
            if #available(iOS 16, *) {
                fallbackRegion = Locale.current.region?.identifier
            } else {
                fallbackRegion = Locale.current.regionCode
            }
            lastStorefrontCountryCode = fallbackRegion
            Log.storeKit.info("Storefront unavailable, using device region: \(fallbackRegion ?? "nil"), locale: \(Locale.current.identifier)")
        }

        for product in products {
            Log.storeKit.debug("  \(product.id): displayPrice=\"\(product.displayPrice)\", price=\(product.price)")
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
    /// Always uses `product.displayPrice` — StoreKit already formats the price
    /// with the correct currency symbol for the user's App Store storefront.
    /// A previous version used NumberFormatter + Locale.current, but that
    /// applied the *device* locale's currency symbol (e.g. "$") instead of the
    /// storefront's (e.g. "€"), causing wrong currency display on TestFlight
    /// and for users whose device locale differs from their App Store region.
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
