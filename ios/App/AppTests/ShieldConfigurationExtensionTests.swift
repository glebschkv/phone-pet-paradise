import XCTest
@testable import App

/**
 * ShieldConfigurationExtensionTests
 *
 * Unit tests for ShieldConfiguration extension logic.
 * Since extensions run in separate processes, we test the helper class
 * that encapsulates the extension's testable logic.
 */
final class ShieldConfigurationExtensionTests: XCTestCase {

    // MARK: - Properties

    var sut: ShieldConfigurationHelper!
    var mockUserDefaults: UserDefaults!

    // MARK: - Setup & Teardown

    override func setUp() {
        super.setUp()
        // Create isolated UserDefaults for testing
        mockUserDefaults = UserDefaults(suiteName: "ShieldConfigurationTests")
        mockUserDefaults?.removePersistentDomain(forName: "ShieldConfigurationTests")
        sut = ShieldConfigurationHelper(userDefaults: mockUserDefaults)
    }

    override func tearDown() {
        // Clean up test data
        mockUserDefaults?.removePersistentDomain(forName: "ShieldConfigurationTests")
        mockUserDefaults = nil
        sut = nil
        super.tearDown()
    }

    // MARK: - Shield Attempt Counter Tests

    func testRecordShieldAttemptIncrementsCounter() {
        // Given
        sut.resetShieldAttempts()
        XCTAssertEqual(sut.shieldAttempts, 0)

        // When
        sut.recordShieldAttempt()

        // Then
        XCTAssertEqual(sut.shieldAttempts, 1)
    }

    func testRecordShieldAttemptMultipleTimes() {
        // Given
        sut.resetShieldAttempts()

        // When
        sut.recordShieldAttempt()
        sut.recordShieldAttempt()
        sut.recordShieldAttempt()

        // Then
        XCTAssertEqual(sut.shieldAttempts, 3)
    }

    func testRecordShieldAttemptSetsTimestamp() {
        // Given
        sut.resetShieldAttempts()
        let beforeTime = Date().timeIntervalSince1970

        // When
        sut.recordShieldAttempt()

        // Then
        let afterTime = Date().timeIntervalSince1970
        XCTAssertGreaterThanOrEqual(sut.lastShieldAttemptTimestamp, beforeTime)
        XCTAssertLessThanOrEqual(sut.lastShieldAttemptTimestamp, afterTime)
    }

    func testRecordShieldAttemptUpdatesTimestamp() {
        // Given
        sut.resetShieldAttempts()
        sut.recordShieldAttempt()
        let firstTimestamp = sut.lastShieldAttemptTimestamp

        // Wait a small amount
        Thread.sleep(forTimeInterval: 0.01)

        // When
        sut.recordShieldAttempt()
        let secondTimestamp = sut.lastShieldAttemptTimestamp

        // Then
        XCTAssertGreaterThanOrEqual(secondTimestamp, firstTimestamp)
    }

    func testResetShieldAttempts() {
        // Given
        sut.recordShieldAttempt()
        sut.recordShieldAttempt()
        sut.recordShieldAttempt()
        XCTAssertEqual(sut.shieldAttempts, 3)
        XCTAssertGreaterThan(sut.lastShieldAttemptTimestamp, 0)

        // When
        sut.resetShieldAttempts()

        // Then
        XCTAssertEqual(sut.shieldAttempts, 0)
        XCTAssertEqual(sut.lastShieldAttemptTimestamp, 0)
    }

    // MARK: - Motivational Message Tests

    func testGetMotivationalMessageReturnsValidString() {
        // When
        let message = sut.getMotivationalMessage()

        // Then
        XCTAssertFalse(message.isEmpty)
    }

    func testGetMotivationalMessageReturnsFromValidList() {
        // Given
        let validMessages = sut.getAllMotivationalMessages()

        // When
        let message = sut.getMotivationalMessage()

        // Then
        XCTAssertTrue(validMessages.contains(message))
    }

    func testMotivationalMessagesNotEmpty() {
        // When
        let messages = sut.getAllMotivationalMessages()

        // Then
        XCTAssertFalse(messages.isEmpty)
        XCTAssertGreaterThan(messages.count, 0)
    }

    func testMotivationalMessagesContainsExpectedContent() {
        // When
        let messages = sut.getAllMotivationalMessages()

        // Then - verify key motivational messages exist
        XCTAssertTrue(messages.contains("Your focus pet is counting on you!"))
        XCTAssertTrue(messages.contains("Focus = XP = Level Up!"))
        XCTAssertTrue(messages.contains("Your pet believes in you!"))
    }

    func testMotivationalMessageHasCorrectCount() {
        // When
        let messages = sut.getAllMotivationalMessages()

        // Then - should have exactly 10 messages
        XCTAssertEqual(messages.count, 10)
    }

    func testAllMotivationalMessagesAreNonEmpty() {
        // When
        let messages = sut.getAllMotivationalMessages()

        // Then
        for message in messages {
            XCTAssertFalse(message.isEmpty)
            XCTAssertGreaterThan(message.count, 5) // Reasonable minimum length
        }
    }

    // MARK: - Icon Creation Tests

    func testCreateNoMoIconDoesNotReturnNil() {
        // When
        let icon = sut.createNoMoIcon()

        // Then
        XCTAssertNotNil(icon)
    }

    func testCreateNoMoIconReturnsValidImage() {
        // When
        let icon = sut.createNoMoIcon()

        // Then
        XCTAssertNotNil(icon)
        XCTAssertGreaterThan(icon!.size.width, 0)
        XCTAssertGreaterThan(icon!.size.height, 0)
    }

    func testCreateNoMoIconIsReusable() {
        // When - create icon multiple times
        let icon1 = sut.createNoMoIcon()
        let icon2 = sut.createNoMoIcon()

        // Then - both should be valid
        XCTAssertNotNil(icon1)
        XCTAssertNotNil(icon2)
    }

    // MARK: - Shield Configuration Color Tests

    func testShieldBackgroundColorIsNotNil() {
        // When
        let color = ShieldConfigurationHelper.shieldBackgroundColor

        // Then
        XCTAssertNotNil(color)
    }

    func testShieldSubtitleColorIsNotNil() {
        // When
        let color = ShieldConfigurationHelper.shieldSubtitleColor

        // Then
        XCTAssertNotNil(color)
    }

    func testShieldButtonColorIsNotNil() {
        // When
        let color = ShieldConfigurationHelper.shieldButtonColor

        // Then
        XCTAssertNotNil(color)
    }

    func testShieldBackgroundColorHasCorrectComponents() {
        // Given
        let color = ShieldConfigurationHelper.shieldBackgroundColor
        var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
        color.getRed(&red, green: &green, blue: &blue, alpha: &alpha)

        // Then - verify dark purple/black tint
        XCTAssertEqual(red, 0.1, accuracy: 0.01)
        XCTAssertEqual(green, 0.05, accuracy: 0.01)
        XCTAssertEqual(blue, 0.15, accuracy: 0.01)
        XCTAssertEqual(alpha, 0.95, accuracy: 0.01)
    }

    // MARK: - Default State Tests

    func testDefaultShieldAttemptsIsZero() {
        // Given - fresh UserDefaults
        let freshDefaults = UserDefaults(suiteName: "FreshShieldTest")
        freshDefaults?.removePersistentDomain(forName: "FreshShieldTest")
        let freshHelper = ShieldConfigurationHelper(userDefaults: freshDefaults)

        // Then
        XCTAssertEqual(freshHelper.shieldAttempts, 0)

        // Cleanup
        freshDefaults?.removePersistentDomain(forName: "FreshShieldTest")
    }

    func testDefaultLastShieldAttemptTimestampIsZero() {
        // Given - fresh UserDefaults
        let freshDefaults = UserDefaults(suiteName: "FreshShieldTest2")
        freshDefaults?.removePersistentDomain(forName: "FreshShieldTest2")
        let freshHelper = ShieldConfigurationHelper(userDefaults: freshDefaults)

        // Then
        XCTAssertEqual(freshHelper.lastShieldAttemptTimestamp, 0)

        // Cleanup
        freshDefaults?.removePersistentDomain(forName: "FreshShieldTest2")
    }

    // MARK: - Integration Tests

    func testShieldAttemptTrackingDuringFocusSession() {
        // Given - clean state
        sut.resetShieldAttempts()

        // When - simulate multiple blocked app attempts
        sut.recordShieldAttempt()
        Thread.sleep(forTimeInterval: 0.01)
        sut.recordShieldAttempt()
        Thread.sleep(forTimeInterval: 0.01)
        sut.recordShieldAttempt()

        // Then
        XCTAssertEqual(sut.shieldAttempts, 3)
        XCTAssertGreaterThan(sut.lastShieldAttemptTimestamp, 0)
    }

    func testConfigurationCreationFlow() {
        // Given
        sut.resetShieldAttempts()
        let initialAttempts = sut.shieldAttempts

        // When - simulate configuration being requested (which calls recordShieldAttempt)
        sut.recordShieldAttempt()

        // Then - attempt should be recorded
        XCTAssertEqual(sut.shieldAttempts, initialAttempts + 1)

        // And - icon should be creatable
        let icon = sut.createNoMoIcon()
        XCTAssertNotNil(icon)

        // And - motivational message should be available
        let message = sut.getMotivationalMessage()
        XCTAssertFalse(message.isEmpty)
    }

    // MARK: - Static Messages Tests

    func testStaticMotivationalMessagesMatchInstance() {
        // When
        let staticMessages = ShieldConfigurationHelper.motivationalMessages
        let instanceMessages = sut.getAllMotivationalMessages()

        // Then
        XCTAssertEqual(staticMessages, instanceMessages)
    }

    func testMotivationalMessagesAreUnique() {
        // When
        let messages = sut.getAllMotivationalMessages()
        let uniqueMessages = Set(messages)

        // Then - all messages should be unique
        XCTAssertEqual(messages.count, uniqueMessages.count)
    }
}
