import XCTest
@testable import App

final class AppReviewPluginTests: XCTestCase {

    // MARK: - Plugin Initialization

    func testPluginIdentifier() {
        let plugin = AppReviewPlugin()
        XCTAssertEqual(plugin.identifier, "AppReviewPlugin")
        XCTAssertEqual(plugin.jsName, "AppReview")
    }

    func testPluginMethods() {
        let plugin = AppReviewPlugin()
        let methodNames = plugin.pluginMethods.map { $0.name }

        XCTAssertTrue(methodNames.contains("requestReview"))
        XCTAssertEqual(plugin.pluginMethods.count, 1)
    }

    func testPluginMethodReturnType() {
        let plugin = AppReviewPlugin()
        let method = plugin.pluginMethods.first { $0.name == "requestReview" }

        XCTAssertNotNil(method)
        // Verify it returns a promise
        XCTAssertEqual(method?.returnType, CAPPluginReturnPromise)
    }
}
