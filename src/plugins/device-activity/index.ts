import { registerPlugin } from '@capacitor/core';
import type { DeviceActivityPlugin } from './definitions';

const DeviceActivity = registerPlugin<DeviceActivityPlugin>('DeviceActivity', {
  web: () => import('./web').then(m => new m.DeviceActivityWeb()),
});

export * from './definitions';
export { DeviceActivity };