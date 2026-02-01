import Foundation
import BackgroundTasks
import UIKit

/**
 * BackgroundTaskManager
 *
 * Manages background task registration and scheduling for app lifecycle tracking.
 */
final class BackgroundTaskManager: BackgroundTaskManaging {

    // MARK: - Singleton

    static let shared = BackgroundTaskManager()

    // MARK: - Properties

    private let taskScheduler: BGTaskScheduler
    private var onBackgroundEvent: (([String: Any]) -> Void)?
    private var isRegistered = false

    // MARK: - Initialization

    init(taskScheduler: BGTaskScheduler = .shared) {
        self.taskScheduler = taskScheduler
        Log.background.debug("BackgroundTaskManager initialized")
    }

    // MARK: - Configuration

    /// Sets the callback for background events
    func setBackgroundEventHandler(_ handler: @escaping ([String: Any]) -> Void) {
        self.onBackgroundEvent = handler
    }

    // MARK: - Registration

    func registerBackgroundTasks() {
        guard !isRegistered else {
            Log.background.debug("Background tasks already registered, skipping")
            return
        }

        Log.background.operationStart("registerBackgroundTasks")

        taskScheduler.register(
            forTaskWithIdentifier: AppConfig.backgroundTaskIdentifier,
            using: nil
        ) { [weak self] task in
            guard let refreshTask = task as? BGAppRefreshTask else {
                Log.background.error("Received unexpected task type")
                task.setTaskCompleted(success: false)
                return
            }
            self?.handleBackgroundRefresh(task: refreshTask)
        }

        isRegistered = true
        Log.background.success("Background tasks registered")
    }

    // MARK: - Scheduling

    func scheduleBackgroundRefresh() {
        guard isRegistered else {
            Log.background.debug("Skipping background refresh schedule — tasks not registered")
            return
        }

        let request = BGAppRefreshTaskRequest(identifier: AppConfig.backgroundTaskIdentifier)
        request.earliestBeginDate = Date(
            timeIntervalSinceNow: AppConfig.backgroundRefreshIntervalMinutes * 60
        )

        do {
            try taskScheduler.submit(request)
            Log.background.info("Background refresh scheduled for \(AppConfig.backgroundRefreshIntervalMinutes) minutes")
        } catch {
            Log.background.failure("Failed to schedule background refresh", error: error)
        }
    }

    // MARK: - Task Handling

    private func handleBackgroundRefresh(task: BGAppRefreshTask) {
        Log.background.info("Handling background refresh")

        // Notify listeners
        onBackgroundEvent?([
            "state": "background",
            "timestamp": Date().timeIntervalSince1970
        ])

        // Schedule next refresh
        scheduleBackgroundRefresh()

        task.setTaskCompleted(success: true)
        Log.background.success("Background refresh completed")
    }
}

// MARK: - App Lifecycle Integration

extension BackgroundTaskManager {
    /// Call when app enters background
    func appDidEnterBackground() {
        Log.lifecycle.info("App entered background")
        scheduleBackgroundRefresh()
    }

    /// Call when app enters foreground
    func appWillEnterForeground() {
        Log.lifecycle.info("App entering foreground")
    }
}
