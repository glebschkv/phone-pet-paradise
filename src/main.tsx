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

// The HTML splash screen (#splash-screen) lives OUTSIDE #root in index.html
// so it stays visible during React's initial render. App.tsx fades it out
// once the React tree is mounted. Do NOT remove it here — that causes a
// brief black flash before React paints.

createRoot(document.getElementById("root")!).render(<App />);
