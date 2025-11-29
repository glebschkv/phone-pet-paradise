import { registerPlugin } from '@capacitor/core';

export interface AppReviewPlugin {
  /**
   * Request an App Store review prompt.
   * Note: iOS controls when the review dialog actually appears.
   */
  requestReview(): Promise<{ success: boolean; message: string }>;
}

const AppReview = registerPlugin<AppReviewPlugin>('AppReview', {
  web: () => import('./web').then(m => new m.AppReviewWeb()),
});

export { AppReview };
