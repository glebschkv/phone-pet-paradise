#import <Capacitor/Capacitor.h>

CAP_PLUGIN(WidgetDataPlugin, "WidgetData",
    CAP_PLUGIN_METHOD(saveData, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(loadData, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(refreshWidgets, CAPPluginReturnPromise);
)
