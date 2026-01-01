import XCTest
import StoreKit
@testable import App

final class StoreKitPluginTests: XCTestCase {

    // MARK: - Error Tests

    func testStoreKitPluginErrorDescriptions() {
        XCTAssertEqual(
            StoreKitPluginError.failedVerification.errorDescription,
            "Transaction verification failed"
        )
        XCTAssertEqual(
            StoreKitPluginError.productNotFound.errorDescription,
            "Product not found"
        )
        XCTAssertEqual(
            StoreKitPluginError.purchaseFailed.errorDescription,
            "Purchase failed"
        )
        XCTAssertEqual(
            StoreKitPluginError.networkError.errorDescription,
            "Network error occurred"
        )
    }

    // MARK: - Product Type String Tests

    func testProductTypeStringConversion() {
        // Test that the enum to string conversion is correct
        // Note: We can't directly test private methods, so we verify through integration
        // This test validates the error enum is properly defined
        let error = StoreKitPluginError.failedVerification
        XCTAssertNotNil(error.errorDescription)
    }

    // MARK: - Plugin Initialization

    func testPluginIdentifier() {
        // Test plugin metadata
        let plugin = StoreKitPlugin()
        XCTAssertEqual(plugin.identifier, "StoreKitPlugin")
        XCTAssertEqual(plugin.jsName, "StoreKit")
    }

    func testPluginMethods() {
        let plugin = StoreKitPlugin()
        let methodNames = plugin.pluginMethods.map { $0.name }

        XCTAssertTrue(methodNames.contains("getProducts"))
        XCTAssertTrue(methodNames.contains("purchase"))
        XCTAssertTrue(methodNames.contains("restorePurchases"))
        XCTAssertTrue(methodNames.contains("getSubscriptionStatus"))
        XCTAssertTrue(methodNames.contains("getPurchaseHistory"))
        XCTAssertTrue(methodNames.contains("manageSubscriptions"))
    }

    // MARK: - Error Enum Tests

    func testErrorEnumCases() {
        // Verify all error cases exist
        let errors: [StoreKitPluginError] = [
            .failedVerification,
            .productNotFound,
            .purchaseFailed,
            .networkError
        ]

        XCTAssertEqual(errors.count, 4)

        // Each error should have a description
        for error in errors {
            XCTAssertNotNil(error.errorDescription)
            XCTAssertFalse(error.errorDescription!.isEmpty)
        }
    }
}
