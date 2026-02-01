import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.nomoinc.nomo',
  appName: 'NoMo Phone',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0a0014',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#a855f7',
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