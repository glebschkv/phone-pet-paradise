import Foundation
import OSLog

/**
 * Logger
 *
 * Centralized logging utility using OSLog for structured, production-ready logging.
 * Provides category-specific loggers for different subsystems.
 *
 * Usage:
 *   Log.storeKit.info("Product loaded successfully")
 *   Log.storeKit.error("Purchase failed: \(error)")
 *   Log.deviceActivity.debug("Monitoring started")
 */
enum Log {
    private static let subsystem = Bundle.main.bundleIdentifier ?? "co.nomoinc.nomo"

    // MARK: - Category Loggers

    /// Logger for StoreKit/IAP operations
    static let storeKit = Logger(subsystem: subsystem, category: "StoreKit")

    /// Logger for Device Activity and Screen Time operations
    static let deviceActivity = Logger(subsystem: subsystem, category: "DeviceActivity")

    /// Logger for app blocking and shield operations
    static let blocking = Logger(subsystem: subsystem, category: "Blocking")

    /// Logger for widget data synchronization
    static let widget = Logger(subsystem: subsystem, category: "Widget")

    /// Logger for permissions and authorization
    static let permissions = Logger(subsystem: subsystem, category: "Permissions")

    /// Logger for background task operations
    static let background = Logger(subsystem: subsystem, category: "Background")

    /// Logger for focus session management
    static let focus = Logger(subsystem: subsystem, category: "Focus")

    /// Logger for app lifecycle events
    static let lifecycle = Logger(subsystem: subsystem, category: "Lifecycle")

    /// Logger for general app operations
    static let app = Logger(subsystem: subsystem, category: "App")
}

// MARK: - Logger Extensions

extension Logger {
    /// Logs a successful operation with optional details
    func success(_ message: String) {
        self.info("✓ \(message)")
    }

    /// Logs a failure with error details
    func failure(_ message: String, error: Error? = nil) {
        if let error = error {
            self.error("✗ \(message): \(error.localizedDescription)")
        } else {
            self.error("✗ \(message)")
        }
    }

    /// Logs the start of an operation (for timing/debugging)
    func operationStart(_ operation: String) {
        self.debug("→ Starting: \(operation)")
    }

    /// Logs the end of an operation (for timing/debugging)
    func operationEnd(_ operation: String) {
        self.debug("← Completed: \(operation)")
    }
}
