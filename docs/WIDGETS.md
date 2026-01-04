# Home Screen Widgets Setup Guide

This document explains how to complete the widget integration for NoMo Phone.

## Overview

The app includes infrastructure for iOS home screen widgets:
- **Quick Timer Widget** - Start a focus session directly from home screen
- **Streak Widget** - Display current streak and progress
- **Daily Progress Widget** - Show daily focus goal progress ring

## Current Implementation

### React/TypeScript Side (Complete)

1. **WidgetDataService** (`src/plugins/widget-data/index.ts`)
   - Manages shared data between app and widgets
   - Syncs timer, streak, progress, and stats data
   - Stores data in localStorage and native shared storage

2. **useWidgetSync Hook** (`src/hooks/useWidgetSync.ts`)
   - React hook to sync app state with widget data
   - Provides methods to update specific widget data sections

3. **Capacitor Plugin Bridge** (`ios/App/App/Sources/WidgetDataPlugin.swift`)
   - Swift plugin to save/load data from App Groups
   - Includes data models for widget consumption

## Native Implementation Required

### iOS Widget Extension Setup

To complete the widget integration, follow these steps in Xcode:

#### 1. Enable App Groups

1. Open the project in Xcode
2. Select the main app target
3. Go to "Signing & Capabilities"
4. Click "+ Capability" and add "App Groups"
5. Add the group: `group.com.phonepetparadise.app`

#### 2. Create Widget Extension

1. In Xcode, go to File > New > Target
2. Select "Widget Extension"
3. Name it "PetParadiseWidgets"
4. Choose "Include Configuration Intent" for customizable widgets

#### 3. Configure Widget Extension App Group

1. Select the widget extension target
2. Go to "Signing & Capabilities"
3. Add the same App Group: `group.com.phonepetparadise.app`

#### 4. Copy Data Models

Copy the `WidgetSharedData` struct and `WidgetDataReader` class from
`WidgetDataPlugin.swift` to your widget extension.

#### 5. Implement Widget Views

Example Timer Widget:

```swift
import WidgetKit
import SwiftUI

struct TimerWidgetEntry: TimelineEntry {
    let date: Date
    let data: WidgetSharedData?
}

struct TimerWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> TimerWidgetEntry {
        TimerWidgetEntry(date: Date(), data: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (TimerWidgetEntry) -> ()) {
        let entry = TimerWidgetEntry(date: Date(), data: WidgetDataReader.load())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TimerWidgetEntry>) -> ()) {
        let data = WidgetDataReader.load()
        let entry = TimerWidgetEntry(date: Date(), data: data)

        // Refresh every 15 minutes, or more frequently if timer is running
        let refreshInterval: TimeInterval = data?.timer.isRunning == true ? 60 : 900
        let nextUpdate = Date().addingTimeInterval(refreshInterval)

        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct TimerWidgetView: View {
    let entry: TimerWidgetEntry

    var body: some View {
        VStack {
            if let data = entry.data {
                if data.timer.isRunning {
                    Text("Focusing...")
                        .font(.headline)
                    Text(formatTime(data.timer.timeRemaining))
                        .font(.system(size: 32, weight: .bold, design: .monospaced))
                    if let task = data.timer.taskLabel ?? data.timer.category {
                        Text(task)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    Text("Start Focus")
                        .font(.headline)
                    Text("25:00")
                        .font(.system(size: 32, weight: .bold, design: .monospaced))
                        .foregroundColor(.secondary)
                }
            } else {
                Text("Open app to sync")
                    .foregroundColor(.secondary)
            }
        }
        .padding()
    }

    private func formatTime(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let secs = seconds % 60
        return String(format: "%02d:%02d", minutes, secs)
    }
}

@main
struct TimerWidget: Widget {
    let kind: String = "TimerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TimerWidgetProvider()) { entry in
            TimerWidgetView(entry: entry)
        }
        .configurationDisplayName("Focus Timer")
        .description("Quick access to your focus timer.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

Example Streak Widget:

```swift
struct StreakWidgetView: View {
    let entry: WidgetEntry

    var body: some View {
        VStack {
            if let data = entry.data {
                HStack {
                    Image(systemName: "flame.fill")
                        .foregroundColor(.orange)
                    Text("\(data.streak.currentStreak)")
                        .font(.system(size: 48, weight: .bold))
                }
                Text("Day Streak")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}
```

Example Progress Widget:

```swift
struct ProgressWidgetView: View {
    let entry: WidgetEntry

    var body: some View {
        VStack {
            if let data = entry.data {
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 8)
                    Circle()
                        .trim(from: 0, to: CGFloat(data.dailyProgress.percentComplete) / 100)
                        .stroke(Color.blue, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack {
                        Text("\(data.dailyProgress.percentComplete)%")
                            .font(.headline)
                        Text("\(data.dailyProgress.focusMinutes)/\(data.dailyProgress.goalMinutes)m")
                            .font(.caption2)
                    }
                }
                .padding()
            }
        }
    }
}
```

#### 6. Handle Widget Deep Links

To allow widgets to open the app and start a timer:

In `AppDelegate.swift`:
```swift
func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    if url.scheme == "petparadise" {
        if url.host == "start-timer" {
            // Post notification to React app
            NotificationCenter.default.post(name: NSNotification.Name("StartTimer"), object: nil)
        }
    }
    return true
}
```

In widget:
```swift
Link(destination: URL(string: "petparadise://start-timer")!) {
    // Widget content
}
```

### Android Widgets

For Android, you'll need to:

1. Create a Widget Provider class
2. Define widget layout in XML
3. Register in AndroidManifest.xml
4. Use SharedPreferences to read data

Example files needed:
- `android/app/src/main/java/com/phonepetparadise/TimerWidgetProvider.kt`
- `android/app/src/main/res/layout/timer_widget.xml`
- `android/app/src/main/res/xml/timer_widget_info.xml`

## Using Widget Sync in React

Import and use the hook in your app:

```tsx
import { useWidgetSync } from '@/hooks/useWidgetSync';

function App() {
  const { updateWidgetTimer, syncWidgetData } = useWidgetSync();

  // Sync on app load
  useEffect(() => {
    syncWidgetData();
  }, []);

  // Update when timer changes
  const handleTimerStart = () => {
    updateWidgetTimer({
      isRunning: true,
      timeRemaining: 25 * 60,
      sessionType: 'pomodoro',
    });
  };
}
```

## Testing Widgets

1. Build and run the main app to sync initial data
2. Add widgets from the home screen
3. Verify data displays correctly
4. Test timer start/stop syncing
5. Verify widgets refresh when app data changes
