#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(DeviceActivityPlugin, "DeviceActivity",
           // Diagnostic methods
           CAP_PLUGIN_METHOD(echo, CAPPluginReturnPromise);

           // Permission methods
           CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(checkPermissions, CAPPluginReturnPromise);

           // Settings
           CAP_PLUGIN_METHOD(openSettings, CAPPluginReturnPromise);

           // App selection methods
           CAP_PLUGIN_METHOD(openAppPicker, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setSelectedApps, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getSelectedApps, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(clearSelectedApps, CAPPluginReturnPromise);

           // App blocking methods
           CAP_PLUGIN_METHOD(startAppBlocking, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopAppBlocking, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getBlockingStatus, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getShieldAttempts, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(resetShieldAttempts, CAPPluginReturnPromise);

           // Monitoring methods
           CAP_PLUGIN_METHOD(startMonitoring, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopMonitoring, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getUsageData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(recordActiveTime, CAPPluginReturnPromise);

           // Haptic feedback
           CAP_PLUGIN_METHOD(triggerHapticFeedback, CAPPluginReturnPromise);

           // Splash
           CAP_PLUGIN_METHOD(dismissSplash, CAPPluginReturnPromise);
)