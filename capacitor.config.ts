import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.354c50c576064f429b59577c9adb3ef7',
  appName: 'Pet Island - A Lovable Project',
  webDir: 'dist',
  server: {
    url: 'https://354c50c5-7606-4f42-9b59-577c9adb3ef7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#3b82c7',
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
      label: "app.lovable.354c50c576064f429b59577c9adb3ef7.background-tracking",
      description: "Tracks app usage and awards points for time away from device"
    }
  },
};

export default config;