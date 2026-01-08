# ADR-003: Mobile Framework Selection (Capacitor)

## Status
Accepted

## Context

Phone Pet Paradise needs to run on:
- iOS (App Store distribution)
- Android (Play Store distribution)
- Web (PWA for testing/preview)

Requirements:
- Access to native APIs (notifications, haptics, in-app purchases)
- Single codebase for all platforms
- Fast development iteration
- TypeScript support
- Good performance for animations

We evaluated:
- **React Native** - Native UI, large ecosystem
- **Flutter** - Google's cross-platform, Dart language
- **Capacitor** - Web-based, wraps web app in native shell
- **Ionic** - Similar to Capacitor, more opinionated
- **PWA only** - No native shell needed

## Decision

We chose **Capacitor** to wrap our React web application in native iOS and Android shells.

### Why Capacitor

1. **Leverage existing React expertise** - Team already knows React
2. **Single codebase** - Same code runs on web, iOS, and Android
3. **Native API access** - Capacitor plugins for device APIs
4. **TypeScript-first** - Excellent TypeScript support
5. **Gradual adoption** - Can add native features incrementally

### Architecture

```
┌─────────────────────────────────────────────┐
│                 React App                    │
│            (TypeScript + Vite)               │
├─────────────────────────────────────────────┤
│              Capacitor Bridge                │
├─────────────────────────────────────────────┤
│   Capacitor     │    Custom Native          │
│   Plugins       │    Plugins                │
│  - Haptics      │  - DeviceActivity         │
│  - LocalNotif   │  - AppBlocking            │
│  - StatusBar    │  - StoreKit (IAP)         │
│  - Keyboard     │  - WidgetData             │
├─────────────────────────────────────────────┤
│     iOS Native      │    Android Native      │
│     (Swift/ObjC)    │    (Kotlin/Java)       │
└─────────────────────────────────────────────┘
```

### Custom Plugins

We implemented 4 custom Capacitor plugins for features not available in the ecosystem:

1. **DeviceActivity** - iOS Screen Time API integration
2. **AppBlocking** - Block apps during focus sessions
3. **StoreKit** - iOS in-app purchases
4. **WidgetData** - Sync data to home screen widgets

## Consequences

### Positive
- **Faster development** - Web technologies are familiar
- **Code sharing** - ~95% code shared across platforms
- **Easy debugging** - Chrome DevTools for most issues
- **PWA fallback** - App works in browser for testing
- **Hot reload** - Fast iteration during development

### Negative
- **Not truly native UI** - Animations need careful optimization
- **Performance ceiling** - Can't match pure native for heavy graphics
- **Plugin gaps** - Some native APIs require custom plugin development
- **Bundle size** - Larger than pure native apps

### Trade-offs
- We accept slightly lower performance ceiling for development speed
- Custom plugins required for advanced iOS features (Screen Time)
- Need iOS-specific optimizations for smooth 60fps animations

## Alternatives Considered

### React Native
- **Pro**: Native UI components, large ecosystem, Expo for easy setup
- **Con**: Different paradigm from web React, bridge overhead, harder debugging

### Flutter
- **Pro**: Excellent performance, beautiful UI, single language (Dart)
- **Con**: New language to learn, smaller ecosystem than React, not web-first

### PWA Only
- **Pro**: Simplest approach, no native code needed
- **Con**: Limited API access (no Screen Time, limited notifications), no App Store presence

### Native (Swift + Kotlin)
- **Pro**: Best performance, full API access, platform-specific UI
- **Con**: Two separate codebases, 2x development time, different skills needed
