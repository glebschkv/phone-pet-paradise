#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(NomoTrackingPlugin, "NomoTracking",
           CAP_PLUGIN_METHOD(getTodayStats, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getCurrentStreak, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getWeeklyAverage, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(toggleWorkMode, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
)