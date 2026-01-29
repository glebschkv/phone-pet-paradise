import Foundation
import FamilyControls

/**
 * PermissionsManager
 *
 * Manages Family Controls authorization for Screen Time API access.
 * Handles permission requests and status checks.
 */
@available(iOS 15.0, *)
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
        default:
            Log.permissions.warning("Unknown authorization status encountered")
            return .denied
        }
    }

    // MARK: - Request Authorization

    func requestAuthorization() async throws {
        Log.permissions.operationStart("requestAuthorization")

        if #available(iOS 16.0, *) {
            do {
                try await authorizationCenter.requestAuthorization(for: .individual)
                Log.permissions.success("Authorization granted")
            } catch {
                // Apple throws when the user denies or when there's a system issue.
                // Don't re-throw — let the caller check the resulting status instead.
                // This avoids treating user denial as a hard error.
                Log.permissions.info("Authorization request completed with result: \(error.localizedDescription)")
            }
        } else {
            // On iOS 15, authorization is requested via the system
            // when first accessing Family Controls features
            Log.permissions.info("iOS 15: Authorization handled by system prompt")
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

@available(iOS 15.0, *)
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
