import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.nomoinc.nomo',
  appName: 'NoMo Phone',
  webDir: 'dist',
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
      label: "co.nomoinc.nomo.background-tracking",
      description: "Tracks app usage and awards points for time away from device"
    }
  },
};

export default config;