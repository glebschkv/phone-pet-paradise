import { registerPlugin } from '@capacitor/core';
import type { NomoTrackingPlugin } from './definitions';

const NomoTracking = registerPlugin<NomoTrackingPlugin>('NomoTracking', {
  web: () => import('./web').then(m => new m.NomoTrackingWeb()),
});

export * from './definitions';
export { NomoTracking };