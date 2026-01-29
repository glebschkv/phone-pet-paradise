/**
 * Patches the iOS capacitor.config.json to include custom in-app plugin classes.
 *
 * Capacitor's `cap copy` auto-generates packageClassList from npm packages only.
 * Custom plugins defined in the Xcode project (not npm) need to be added manually.
 * This script runs after `cap copy ios` to inject them.
 */
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'ios', 'App', 'App', 'capacitor.config.json');

// Custom plugin class names — must match @objc(ClassName) in Swift
const CUSTOM_PLUGINS = [
  'DeviceActivityPlugin',
  'StoreKitPlugin',
  'WidgetDataPlugin',
  'AppReviewPlugin',
];

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  if (!config.packageClassList) {
    config.packageClassList = [];
  }

  let added = 0;
  for (const plugin of CUSTOM_PLUGINS) {
    if (!config.packageClassList.includes(plugin)) {
      config.packageClassList.push(plugin);
      added++;
    }
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, '\t') + '\n');

  if (added > 0) {
    console.log(`✔ Added ${added} custom plugin(s) to packageClassList: ${CUSTOM_PLUGINS.join(', ')}`);
  } else {
    console.log('✔ Custom plugins already in packageClassList');
  }
} catch (err) {
  console.error('⚠ Failed to patch iOS config:', err.message);
  process.exit(1);
}
