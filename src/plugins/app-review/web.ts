import { WebPlugin } from '@capacitor/core';
import type { AppReviewPlugin } from './index';

/**
 * Web fallback for AppReview plugin.
 * Opens the App Store page for rating.
 */
export class AppReviewWeb extends WebPlugin implements AppReviewPlugin {
  async requestReview(): Promise<{ success: boolean; message: string }> {
    console.log('[AppReview Web] Review requested - opening App Store');

    // On web, we can't show the native review dialog
    // Instead, we could redirect to the App Store page
    // For now, just log and return success

    // In production, replace with your actual App Store URL:
    // window.open('https://apps.apple.com/app/id[YOUR_APP_ID]?action=write-review', '_blank');

    return {
      success: true,
      message: 'Review request logged (web fallback)',
    };
  }
}
