import UIKit
import DeviceActivity
import FamilyControls
import UserNotifications
import CoreData
import Capacitor
import CallKit

// MARK: - Data Models
struct AwaySession: Codable {
    let startTime: Date
    let endTime: Date
    let duration: TimeInterval
    let sessionType: SessionType
    let wasInterrupted: Bool
    let interruptionReason: InterruptionReason?
}

enum SessionType: String, Codable {
    case focus = "focus"
    case sleep = "sleep"
    case work = "work"
    case regular = "regular"
}

enum InterruptionReason: String, Codable {
    case call = "call"
    case emergency = "emergency"
    case workApp = "workApp"
    case shortUsage = "shortUsage"
}

// MARK: - Capacitor Plugin
@objc(NomoTrackingPlugin)
public class NomoTrackingPlugin: CAPPlugin {
    private let trackingManager = NomoTrackingManager.shared
    
    @objc func getTodayStats(_ call: CAPPluginCall) {
        let stats = trackingManager.getTodayStats()
        call.resolve([
            "totalTime": stats.totalTime,
            "sessionCount": stats.sessionCount,
            "longestSession": stats.longestSession
        ])
    }
    
    @objc func getCurrentStreak(_ call: CAPPluginCall) {
        call.resolve(["streak": trackingManager.currentStreak])
    }
    
    @objc func getWeeklyAverage(_ call: CAPPluginCall) {
        let average = trackingManager.getWeeklyAverage()
        call.resolve(["averageTime": average])
    }
    
    @objc func toggleWorkMode(_ call: CAPPluginCall) {
        trackingManager.toggleWorkMode()
        call.resolve()
    }
    
    @objc func requestPermissions(_ call: CAPPluginCall) {
        trackingManager.requestPermissions { granted in
            call.resolve(["granted": granted])
        }
    }
    
    public override func load() {
        // Listen for point awards from the tracking manager
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSessionCompleted),
            name: .awardPoints,
            object: nil
        )
    }
    
    @objc private func handleSessionCompleted(_ notification: Notification) {
        guard let points = notification.userInfo?["points"] as? Int,
              let session = notification.userInfo?["session"] as? AwaySession else { return }
        
        // Notify the JavaScript side
        notifyListeners("sessionCompleted", data: [
            "points": points,
            "duration": session.duration,
            "sessionType": session.sessionType.rawValue
        ])
    }
}

// MARK: - Main Tracking Manager (Your existing code with modifications)
class NomoTrackingManager: NSObject, ObservableObject {
    static let shared = NomoTrackingManager()
    
    @Published var currentStreak: Int = 0
    @Published var todayAwayTime: TimeInterval = 0
    @Published var isCurrentlyAway: Bool = false
    
    private var sessionStartTime: Date?
    private var backgroundTime: Date?
    private var hasScreenTimePermission = false
    private var workModeEnabled = false
    
    // Edge case tracking
    private var lastAppUsage: Date?
    private var callInProgress = false
    private var shortUsageThreshold: TimeInterval = 30
    private var minimumSessionLength: TimeInterval = 300
    private var maximumSessionLength: TimeInterval = 28800
    
    override init() {
        super.init()
        setupNotificationCenter()
        loadSavedData()
    }
    
    private func loadSavedData() {
        currentStreak = UserDefaults.standard.integer(forKey: "currentStreak")
        workModeEnabled = UserDefaults.standard.bool(forKey: "workModeEnabled")
    }
    
    // MARK: - Permission Handling
    func requestPermissions(completion: @escaping (Bool) -> Void) {
        Task {
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                await MainActor.run {
                    self.hasScreenTimePermission = true
                    self.setupDeviceActivityMonitoring()
                    completion(true)
                }
            } catch {
                print("Screen Time permission denied: \(error)")
                await MainActor.run {
                    self.hasScreenTimePermission = false
                    completion(false)
                }
            }
        }
        
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if granted {
                print("Notification permission granted")
            }
        }
    }
    
    // MARK: - Notification Center Setup
    private func setupNotificationCenter() {
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
    
    // MARK: - App Lifecycle Tracking
    @objc private func appDidEnterBackground() {
        backgroundTime = Date()
        startAwaySession()
        scheduleCheckInNotifications()
        print("📱 App entered background at \(backgroundTime!)")
    }
    
    @objc private func appWillEnterForeground() {
        guard let backgroundTime = backgroundTime else { return }
        
        let awayDuration = Date().timeIntervalSince(backgroundTime)
        endAwaySession(duration: awayDuration)
        
        cancelCheckInNotifications()
        print("📱 App returned to foreground after \(awayDuration) seconds")
    }
    
    @objc private func appDidBecomeActive() {
        lastAppUsage = Date()
        isCurrentlyAway = false
    }
    
    // MARK: - Session Management
    private func startAwaySession() {
        sessionStartTime = Date()
        isCurrentlyAway = true
        
        let sessionType = determineSessionType()
        print("🎯 Starting \(sessionType) session")
    }
    
    private func endAwaySession(duration: TimeInterval) {
        guard let startTime = sessionStartTime else { return }
        
        let processedSession = processSession(
            startTime: startTime,
            duration: duration
        )
        
        if processedSession.duration >= minimumSessionLength {
            rewardUser(for: processedSession)
            updateStreaks(with: processedSession)
        }
        
        sessionStartTime = nil
        isCurrentlyAway = false
        
        saveSession(processedSession)
    }
    
    // MARK: - Edge Case Processing
    private func processSession(startTime: Date, duration: TimeInterval) -> AwaySession {
        var adjustedDuration = duration
        var wasInterrupted = false
        var interruptionReason: InterruptionReason?
        
        if adjustedDuration > maximumSessionLength {
            adjustedDuration = maximumSessionLength
            print("⏰ Capped session at maximum length")
        }
        
        if callInProgress {
            wasInterrupted = true
            interruptionReason = .call
            callInProgress = false
        }
        
        if adjustedDuration < shortUsageThreshold {
            wasInterrupted = true
            interruptionReason = .shortUsage
        }
        
        let sessionType = determineSessionType()
        if sessionType == .work && workModeEnabled {
            adjustedDuration *= 1.2
        }
        
        return AwaySession(
            startTime: startTime,
            endTime: Date(),
            duration: adjustedDuration,
            sessionType: sessionType,
            wasInterrupted: wasInterrupted,
            interruptionReason: interruptionReason
        )
    }
    
    private func determineSessionType() -> SessionType {
        let hour = Calendar.current.component(.hour, from: Date())
        
        if hour >= 22 || hour <= 6 {
            return .sleep
        }
        
        if workModeEnabled && hour >= 9 && hour <= 17 {
            return .work
        }
        
        if UserDefaults.standard.bool(forKey: "focusSessionActive") {
            return .focus
        }
        
        return .regular
    }
    
    // MARK: - Reward System
    private func rewardUser(for session: AwaySession) {
        let basePoints = calculateBasePoints(for: session.duration)
        let multiplier = getMultiplier(for: session.sessionType)
        let finalPoints = Int(Double(basePoints) * multiplier)
        
        print("🎉 Rewarding \(finalPoints) points for \(session.duration/60) minute session")
        
        NotificationCenter.default.post(
            name: .awardPoints,
            object: nil,
            userInfo: ["points": finalPoints, "session": session]
        )
    }
    
    private func calculateBasePoints(for duration: TimeInterval) -> Int {
        let minutes = Int(duration / 60)
        
        switch minutes {
        case 5..<30: return minutes * 2
        case 30..<60: return 60 + (minutes - 30) * 3
        case 60..<120: return 150 + (minutes - 60) * 4
        default: return 390 + (minutes - 120) * 2
        }
    }
    
    private func getMultiplier(for sessionType: SessionType) -> Double {
        switch sessionType {
        case .focus: return 1.5
        case .work: return 1.2
        case .sleep: return 0.3
        case .regular: return 1.0
        }
    }
    
    // MARK: - Streak Management
    private func updateStreaks(with session: AwaySession) {
        let today = Calendar.current.startOfDay(for: Date())
        let lastStreakDate = UserDefaults.standard.object(forKey: "lastStreakDate") as? Date
        
        todayAwayTime += session.duration
        
        if let lastDate = lastStreakDate {
            let daysBetween = Calendar.current.dateComponents([.day], from: lastDate, to: today).day ?? 0
            
            if daysBetween == 1 {
                currentStreak += 1
            } else if daysBetween > 1 {
                currentStreak = 1
            }
        } else {
            currentStreak = 1
        }
        
        UserDefaults.standard.set(today, forKey: "lastStreakDate")
        UserDefaults.standard.set(currentStreak, forKey: "currentStreak")
    }
    
    // MARK: - Screen Time Integration
    private func setupDeviceActivityMonitoring() {
        guard hasScreenTimePermission else { return }
        
        // Create DeviceActivity monitoring schedule
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59),
            repeats: true
        )
        
        let activity = DeviceActivityName("phoneTracking")
        let center = DeviceActivityCenter()
        
        do {
            try center.startMonitoring(activity, during: schedule)
            print("🔍 DeviceActivity monitoring started successfully")
        } catch {
            print("❌ Failed to start DeviceActivity monitoring: \(error)")
            fallbackToBasicTracking()
        }
    }
    
    private func fallbackToBasicTracking() {
        print("📱 Using basic app lifecycle tracking as fallback")
    }
    
    // MARK: - Notifications
    private func scheduleCheckInNotifications() {
        let content = UNMutableNotificationContent()
        content.title = "Still staying strong? 💪"
        content.body = "Keep it up! Your pets are growing while you're away."
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1800, repeats: false)
        let request = UNNotificationRequest(identifier: "checkin_30min", content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
    }
    
    private func cancelCheckInNotifications() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: ["checkin_30min"]
        )
    }
    
    // MARK: - Data Persistence
    private func saveSession(_ session: AwaySession) {
        var sessions = getSavedSessions()
        sessions.append(session)
        
        let thirtyDaysAgo = Date().addingTimeInterval(-30 * 24 * 60 * 60)
        sessions = sessions.filter { $0.startTime > thirtyDaysAgo }
        
        if let data = try? JSONEncoder().encode(sessions) {
            UserDefaults.standard.set(data, forKey: "awaySessions")
        }
    }
    
    private func getSavedSessions() -> [AwaySession] {
        guard let data = UserDefaults.standard.data(forKey: "awaySessions"),
              let sessions = try? JSONDecoder().decode([AwaySession].self, from: data) else {
            return []
        }
        return sessions
    }
    
    // MARK: - Public Interface
    func toggleWorkMode() {
        workModeEnabled.toggle()
        UserDefaults.standard.set(workModeEnabled, forKey: "workModeEnabled")
    }
    
    func getTodayStats() -> (totalTime: TimeInterval, sessionCount: Int, longestSession: TimeInterval) {
        let sessions = getSavedSessions()
        let today = Calendar.current.startOfDay(for: Date())
        let todaySessions = sessions.filter { 
            Calendar.current.isDate($0.startTime, inSameDayAs: today)
        }
        
        let totalTime = todaySessions.reduce(0) { $0 + $1.duration }
        let longestSession = todaySessions.map { $0.duration }.max() ?? 0
        
        return (totalTime, todaySessions.count, longestSession)
    }
    
    func getWeeklyAverage() -> TimeInterval {
        let sessions = getSavedSessions()
        let weekAgo = Date().addingTimeInterval(-7 * 24 * 60 * 60)
        let weekSessions = sessions.filter { $0.startTime > weekAgo }
        
        let totalTime = weekSessions.reduce(0) { $0 + $1.duration }
        return totalTime / 7
    }
}

// MARK: - Extensions
extension Notification.Name {
    static let awardPoints = Notification.Name("awardPoints")
}