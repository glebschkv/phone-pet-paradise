#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(DeviceActivityPlugin, "DeviceActivity",
           CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(checkPermissions, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startMonitoring, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopMonitoring, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getUsageData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(recordActiveTime, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(triggerHapticFeedback, CAPPluginReturnPromise);
)