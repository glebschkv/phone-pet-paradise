#import <Capacitor/Capacitor.h>

CAP_PLUGIN(AppReviewPlugin, "AppReview",
    CAP_PLUGIN_METHOD(requestReview, CAPPluginReturnPromise);
)
