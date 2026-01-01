import XCTest
@testable import App

final class FocusDataManagerTests: XCTestCase {

    var sut: FocusDataManager!

    override func setUp() {
        super.setUp()
        sut = FocusDataManager.shared
        // Reset state before each test
        sut.resetShieldAttempts()
    }

    override func tearDown() {
        // Clean up after each test
        sut.resetShieldAttempts()
        sut.isFocusSessionActive = false
        super.tearDown()
    }

    // MARK: - Singleton Tests

    func testSharedInstanceIsSingleton() {
        let instance1 = FocusDataManager.shared
        let instance2 = FocusDataManager.shared

        XCTAssertTrue(instance1 === instance2)
    }

    // MARK: - Focus Session State Tests

    func testFocusSessionActiveDefaultsToFalse() {
        XCTAssertFalse(sut.isFocusSessionActive)
    }

    func testSetFocusSessionActive() {
        sut.isFocusSessionActive = true
        XCTAssertTrue(sut.isFocusSessionActive)

        sut.isFocusSessionActive = false
        XCTAssertFalse(sut.isFocusSessionActive)
    }

    // MARK: - Shield Attempts Tests

    func testShieldAttemptsDefaultsToZero() {
        sut.resetShieldAttempts()
        XCTAssertEqual(sut.shieldAttempts, 0)
    }

    func testRecordShieldAttemptIncrementsCount() {
        sut.resetShieldAttempts()

        sut.recordShieldAttempt()
        XCTAssertEqual(sut.shieldAttempts, 1)

        sut.recordShieldAttempt()
        XCTAssertEqual(sut.shieldAttempts, 2)

        sut.recordShieldAttempt()
        XCTAssertEqual(sut.shieldAttempts, 3)
    }

    func testRecordShieldAttemptSetsTimestamp() {
        sut.resetShieldAttempts()

        let beforeTime = Date().timeIntervalSince1970
        sut.recordShieldAttempt()
        let afterTime = Date().timeIntervalSince1970

        XCTAssertGreaterThanOrEqual(sut.lastShieldAttemptTimestamp, beforeTime)
        XCTAssertLessThanOrEqual(sut.lastShieldAttemptTimestamp, afterTime)
    }

    func testResetShieldAttempts() {
        sut.recordShieldAttempt()
        sut.recordShieldAttempt()
        sut.recordShieldAttempt()

        XCTAssertEqual(sut.shieldAttempts, 3)
        XCTAssertGreaterThan(sut.lastShieldAttemptTimestamp, 0)

        sut.resetShieldAttempts()

        XCTAssertEqual(sut.shieldAttempts, 0)
        XCTAssertEqual(sut.lastShieldAttemptTimestamp, 0)
    }

    // MARK: - Timestamp Tests

    func testLastShieldAttemptTimestampDefaultsToZero() {
        sut.resetShieldAttempts()
        XCTAssertEqual(sut.lastShieldAttemptTimestamp, 0)
    }

    func testMultipleRecordingsUpdateTimestamp() {
        sut.resetShieldAttempts()

        sut.recordShieldAttempt()
        let firstTimestamp = sut.lastShieldAttemptTimestamp

        // Wait a small amount
        Thread.sleep(forTimeInterval: 0.01)

        sut.recordShieldAttempt()
        let secondTimestamp = sut.lastShieldAttemptTimestamp

        XCTAssertGreaterThanOrEqual(secondTimestamp, firstTimestamp)
    }

    // MARK: - Integration Tests

    func testFocusSessionWithShieldAttempts() {
        // Start a focus session
        sut.isFocusSessionActive = true
        XCTAssertTrue(sut.isFocusSessionActive)

        // Record some shield attempts during the session
        sut.recordShieldAttempt()
        sut.recordShieldAttempt()

        XCTAssertEqual(sut.shieldAttempts, 2)

        // End the session
        sut.isFocusSessionActive = false
        XCTAssertFalse(sut.isFocusSessionActive)

        // Shield attempts should still be recorded
        XCTAssertEqual(sut.shieldAttempts, 2)

        // Reset for next session
        sut.resetShieldAttempts()
        XCTAssertEqual(sut.shieldAttempts, 0)
    }
}
