import Foundation
import Capacitor

/**
 * PluginValidation
 *
 * Input validation utilities for Capacitor plugin methods.
 * Provides type-safe parameter extraction with proper error handling.
 */
enum PluginValidation {

    // MARK: - String Validation

    /// Extracts a required string parameter
    static func requiredString(_ call: CAPPluginCall, key: String) throws -> String {
        guard let value = call.getString(key) else {
            throw PluginError.missingParameter(name: key)
        }
        guard !value.isEmpty else {
            throw PluginError.invalidParameter(name: key, reason: "cannot be empty")
        }
        return value
    }

    /// Extracts an optional string parameter with default
    static func optionalString(_ call: CAPPluginCall, key: String, default defaultValue: String) -> String {
        call.getString(key) ?? defaultValue
    }

    // MARK: - Number Validation

    /// Extracts a required integer parameter
    static func requiredInt(_ call: CAPPluginCall, key: String) throws -> Int {
        guard let value = call.getInt(key) else {
            throw PluginError.missingParameter(name: key)
        }
        return value
    }

    /// Extracts a required integer with range validation
    static func requiredInt(_ call: CAPPluginCall, key: String, min: Int? = nil, max: Int? = nil) throws -> Int {
        let value = try requiredInt(call, key: key)
        if let min = min, value < min {
            throw PluginError.invalidParameter(name: key, reason: "must be at least \(min)")
        }
        if let max = max, value > max {
            throw PluginError.invalidParameter(name: key, reason: "must be at most \(max)")
        }
        return value
    }

    /// Extracts an optional integer parameter with default
    static func optionalInt(_ call: CAPPluginCall, key: String, default defaultValue: Int) -> Int {
        call.getInt(key) ?? defaultValue
    }

    /// Extracts a required double parameter
    static func requiredDouble(_ call: CAPPluginCall, key: String) throws -> Double {
        guard let value = call.getDouble(key) else {
            throw PluginError.missingParameter(name: key)
        }
        return value
    }

    // MARK: - Boolean Validation

    /// Extracts a required boolean parameter
    static func requiredBool(_ call: CAPPluginCall, key: String) throws -> Bool {
        guard let value = call.getBool(key) else {
            throw PluginError.missingParameter(name: key)
        }
        return value
    }

    /// Extracts an optional boolean parameter with default
    static func optionalBool(_ call: CAPPluginCall, key: String, default defaultValue: Bool) -> Bool {
        call.getBool(key) ?? defaultValue
    }

    // MARK: - Array Validation

    /// Extracts a required string array parameter
    static func requiredStringArray(_ call: CAPPluginCall, key: String) throws -> [String] {
        guard let value = call.getArray(key, String.self) else {
            throw PluginError.missingParameter(name: key)
        }
        return value
    }

    /// Extracts a non-empty string array parameter
    static func requiredNonEmptyStringArray(_ call: CAPPluginCall, key: String) throws -> [String] {
        let value = try requiredStringArray(call, key: key)
        guard !value.isEmpty else {
            throw PluginError.invalidParameter(name: key, reason: "cannot be empty")
        }
        return value
    }

    // MARK: - Object Validation

    /// Extracts a required object parameter
    static func requiredObject(_ call: CAPPluginCall, key: String) throws -> [String: Any] {
        guard let value = call.getObject(key) else {
            throw PluginError.missingParameter(name: key)
        }
        return value
    }

    /// Extracts an optional object parameter
    static func optionalObject(_ call: CAPPluginCall, key: String) -> [String: Any]? {
        call.getObject(key)
    }

    // MARK: - Data Validation

    /// Extracts and decodes a required Data parameter from base64
    static func requiredData(_ call: CAPPluginCall, key: String) throws -> Data {
        let base64String = try requiredString(call, key: key)
        guard let data = Data(base64Encoded: base64String) else {
            throw PluginError.invalidFormat(field: key, expected: "base64 encoded data")
        }
        return data
    }

    // MARK: - Enum Validation

    /// Extracts and validates a string parameter against allowed values
    static func requiredEnum(_ call: CAPPluginCall, key: String, allowed: [String]) throws -> String {
        let value = try requiredString(call, key: key)
        guard allowed.contains(value) else {
            throw PluginError.invalidParameter(name: key, reason: "must be one of: \(allowed.joined(separator: ", "))")
        }
        return value
    }

    /// Extracts an optional enum string parameter with default
    static func optionalEnum(_ call: CAPPluginCall, key: String, allowed: [String], default defaultValue: String) -> String {
        guard let value = call.getString(key) else {
            return defaultValue
        }
        return allowed.contains(value) ? value : defaultValue
    }
}

// MARK: - CAPPluginCall Extensions

extension CAPPluginCall {
    /// Rejects the call with a PluginError
    func reject(with error: PluginError) {
        Log.app.failure("Plugin call rejected", error: error)
        self.reject(error.errorDescription ?? "Unknown error", error.errorCode)
    }

    /// Resolves with a success status
    func resolveSuccess(_ data: [String: Any] = [:]) {
        var result = data
        result["success"] = true
        self.resolve(result)
    }

    /// Resolves with a failure status (non-throwing)
    func resolveFailure(message: String, data: [String: Any] = [:]) {
        var result = data
        result["success"] = false
        result["message"] = message
        self.resolve(result)
    }
}
