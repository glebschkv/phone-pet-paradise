import { createRoot } from 'react-dom/client'
import { logger } from "@/lib/logger";
import App from './App.tsx'
import './index.css'
import { STORAGE_KEYS } from './lib/storage-keys'
import { initializeErrorReporting } from './lib/errorReporting'

// Initialize error reporting early
initializeErrorReporting();

// Initialize theme from settings
const initializeTheme = () => {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      const theme = settings.theme || 'system';

      const root = document.documentElement;
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    }
  } catch (error) {
    logger.error('Failed to initialize theme:', error);
  }
};

initializeTheme();

// Remove the inline HTML splash screen (if any).
// The native Capacitor splash is hidden from App.tsx after React mounts,
// so there's no black gap during the WKWebView cold start.
const splashEl = document.getElementById('splash-screen');
if (splashEl) {
  splashEl.remove();
}

createRoot(document.getElementById("root")!).render(<App />);
