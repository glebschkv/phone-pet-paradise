import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.nomoinc.nomo',
  appName: 'NoMo Phone',
  webDir: 'dist',
  ios: {
    // Set WKWebView background to dark so there's no white flash between
    // LaunchScreen.storyboard dismissing and HTML content rendering.
    backgroundColor: '#0a0014',
  },
  plugins: {
    SplashScreen: {
      // Auto-hide Capacitor's built-in splash immediately so the native
      // AnimatedSplashViewController (shown by SceneDelegate) is visible.
      // Capacitor's splash is a window-level overlay that sits ABOVE the
      // animated splash on rootVC.view, blocking it if left visible.
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: '#0a0014',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    DeviceActivity: {
      ios: {
        src: "ios",
        path: "App/App/Sources/DeviceActivityPlugin.swift"
      }
    },
    BackgroundTask: {
      label: "co.nomoinc.nomo.background-tracking",
      description: "Tracks app usage and awards points for time away from device"
    }
  },
};

export default config;