import Foundation
import FamilyControls

/**
 * PermissionsManager
 *
 * Manages Family Controls authorization for Screen Time API access.
 * Handles permission requests and status checks.
 */
final class PermissionsManager: PermissionsManaging {

    // MARK: - Singleton

    static let shared = PermissionsManager()

    // MARK: - Properties

    private let authorizationCenter: AuthorizationCenter

    // MARK: - Initialization

    init(authorizationCenter: AuthorizationCenter = .shared) {
        self.authorizationCenter = authorizationCenter
        Log.permissions.debug("PermissionsManager initialized")
    }

    // MARK: - Authorization Status

    var authorizationStatus: AuthorizationStatus {
        checkAuthorization()
    }

    func checkAuthorization() -> AuthorizationStatus {
        switch authorizationCenter.authorizationStatus {
        case .notDetermined:
            return .notDetermined
        case .denied:
            return .denied
        case .approved:
            return .approved
        @unknown default:
            Log.permissions.warning("Unknown authorization status encountered")
            return .denied
        }
    }

    // MARK: - Request Authorization

    func requestAuthorization() async throws {
        Log.permissions.operationStart("requestAuthorization")

        do {
            try await authorizationCenter.requestAuthorization(for: .individual)
            Log.permissions.success("Authorization granted")
        } catch {
            Log.permissions.failure("Authorization request failed", error: error)
            throw PluginError.permissionDenied(feature: "Family Controls")
        }
    }

    // MARK: - Validation

    /// Validates that Family Controls permission is granted, throws if not
    func requireAuthorization() throws {
        guard authorizationStatus.isGranted else {
            throw PluginError.permissionDenied(feature: "Family Controls")
        }
    }
}

// MARK: - Status Response

extension PermissionsManager {
    /// Returns authorization status as a dictionary for plugin response
    var statusResponse: [String: Any] {
        let status = authorizationStatus
        return [
            "status": status.isGranted ? "granted" : "denied",
            "familyControlsEnabled": status.isGranted
        ]
    }
}
