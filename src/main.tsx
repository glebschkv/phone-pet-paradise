import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize theme from settings
const initializeTheme = () => {
  try {
    const savedSettings = localStorage.getItem('app-settings');
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
    console.error('Failed to initialize theme:', error);
  }
};

initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
