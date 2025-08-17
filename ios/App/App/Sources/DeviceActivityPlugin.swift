import Foundation
import Capacitor
import DeviceActivity
import FamilyControls
import BackgroundTasks

@objc(DeviceActivityPlugin)
public class DeviceActivityPlugin: CAPPlugin {
    private var deviceActivityCenter = DeviceActivityCenter()
    private var authorizationCenter = AuthorizationCenter.shared
    private var isMonitoring = false
    private var lastActiveTime: Date?
    private var sessionStartTime: Date?
    
    @objc func requestPermissions(_ call: CAPPluginCall) {
        Task {
            do {
                try await authorizationCenter.requestAuthorization(for: .individual)
                await MainActor.run {
                    call.resolve([
                        "status": "granted",
                        "familyControlsEnabled": true
                    ])
                }
            } catch {
                await MainActor.run {
                    call.reject("Failed to request permissions: \(error.localizedDescription)")
                }
            }
        }
    }
    
    @objc func checkPermissions(_ call: CAPPluginCall) {
        let status = authorizationCenter.authorizationStatus
        call.resolve([
            "status": status == .approved ? "granted" : "denied",
            "familyControlsEnabled": status == .approved
        ])
    }
    
    @objc func startMonitoring(_ call: CAPPluginCall) {
        guard authorizationCenter.authorizationStatus == .approved else {
            call.reject("Device Activity permissions not granted")
            return
        }
        
        let activityName = DeviceActivityName("phoneUsageTracking")
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59),
            repeats: true
        )
        
        do {
            try deviceActivityCenter.startMonitoring(activityName, during: schedule)
            isMonitoring = true
            sessionStartTime = Date()
            
            // Register background task for app lifecycle tracking
            registerBackgroundTasks()
            
            call.resolve([
                "success": true,
                "monitoring": true,
                "startTime": sessionStartTime?.timeIntervalSince1970 ?? 0
            ])
        } catch {
            call.reject("Failed to start monitoring: \(error.localizedDescription)")
        }
    }
    
    @objc func stopMonitoring(_ call: CAPPluginCall) {
        let activityName = DeviceActivityName("phoneUsageTracking")
        deviceActivityCenter.stopMonitoring([activityName])
        isMonitoring = false
        
        call.resolve([
            "success": true,
            "monitoring": false
        ])
    }
    
    @objc func getUsageData(_ call: CAPPluginCall) {
        // Calculate time away from app
        let now = Date()
        var timeAwayMinutes = 0.0
        
        if let lastActive = lastActiveTime {
            timeAwayMinutes = now.timeIntervalSince(lastActive) / 60.0
        }
        
        call.resolve([
            "timeAwayMinutes": timeAwayMinutes,
            "isMonitoring": isMonitoring,
            "lastActiveTime": lastActiveTime?.timeIntervalSince1970 ?? 0,
            "currentTime": now.timeIntervalSince1970
        ])
    }
    
    @objc func recordActiveTime(_ call: CAPPluginCall) {
        lastActiveTime = Date()
        
        call.resolve([
            "success": true,
            "timestamp": lastActiveTime?.timeIntervalSince1970 ?? 0
        ])
    }
    
    @objc func triggerHapticFeedback(_ call: CAPPluginCall) {
        let style = call.getString("style") ?? "medium"
        
        DispatchQueue.main.async {
            switch style {
            case "light":
                let feedback = UIImpactFeedbackGenerator(style: .light)
                feedback.impactOccurred()
            case "heavy":
                let feedback = UIImpactFeedbackGenerator(style: .heavy)
                feedback.impactOccurred()
            case "success":
                let feedback = UINotificationFeedbackGenerator()
                feedback.notificationOccurred(.success)
            case "warning":
                let feedback = UINotificationFeedbackGenerator()
                feedback.notificationOccurred(.warning)
            case "error":
                let feedback = UINotificationFeedbackGenerator()
                feedback.notificationOccurred(.error)
            default:
                let feedback = UIImpactFeedbackGenerator(style: .medium)
                feedback.impactOccurred()
            }
        }
        
        call.resolve(["success": true])
    }
    
    private func registerBackgroundTasks() {
        // Register background task for app lifecycle monitoring
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "app.lovable.354c50c576064f429b59577c9adb3ef7.background-tracking",
            using: nil
        ) { task in
            self.handleBackgroundTracking(task: task as! BGAppRefreshTask)
        }
    }
    
    private func handleBackgroundTracking(task: BGAppRefreshTask) {
        // Record that app went to background
        self.notifyJS("appLifecycleChange", data: [
            "state": "background",
            "timestamp": Date().timeIntervalSince1970
        ])
        
        // Schedule next background refresh
        self.scheduleBackgroundAppRefresh()
        
        task.setTaskCompleted(success: true)
    }
    
    private func scheduleBackgroundAppRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: "app.lovable.354c50c576064f429b59577c9adb3ef7.background-tracking")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        try? BGTaskScheduler.shared.submit(request)
    }
    
    override public func load() {
        // Add app lifecycle observers
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }
    
    @objc private func appDidEnterBackground() {
        lastActiveTime = Date()
        scheduleBackgroundAppRefresh()
        
        notifyJS("appLifecycleChange", data: [
            "state": "background",
            "timestamp": Date().timeIntervalSince1970,
            "lastActiveTime": lastActiveTime?.timeIntervalSince1970 ?? 0
        ])
    }
    
    @objc private func appWillEnterForeground() {
        notifyJS("appLifecycleChange", data: [
            "state": "foreground",
            "timestamp": Date().timeIntervalSince1970,
            "lastActiveTime": lastActiveTime?.timeIntervalSince1970 ?? 0
        ])
    }
    
    @objc private func appDidBecomeActive() {
        let now = Date()
        var timeAwayMinutes = 0.0
        
        if let lastActive = lastActiveTime {
            timeAwayMinutes = now.timeIntervalSince(lastActive) / 60.0
        }
        
        notifyJS("appLifecycleChange", data: [
            "state": "active",
            "timestamp": now.timeIntervalSince1970,
            "timeAwayMinutes": timeAwayMinutes,
            "lastActiveTime": lastActiveTime?.timeIntervalSince1970 ?? 0
        ])
        
        lastActiveTime = now
    }
    
    private func notifyJS(_ eventName: String, data: [String: Any]) {
        bridge?.triggerJSEvent(eventName: eventName, target: "window", data: data)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}