/**
 * useBackgroundTheme Hook
 *
 * Manages background theme state with localStorage persistence.
 * Validates themes against premium status — free themes (night, sky)
 * are always available; premium themes require an active subscription.
 */

import { useState, useEffect, useCallback } from "react";
import { BACKGROUND_THEME_KEY, BACKGROUND_THEMES } from "../constants";

export const useBackgroundTheme = (isPremium: boolean) => {
  const [backgroundTheme, setBackgroundTheme] = useState<string>('night');

  // Load background theme from localStorage (validate against premium status)
  useEffect(() => {
    const savedTheme = localStorage.getItem(BACKGROUND_THEME_KEY);
    const theme = BACKGROUND_THEMES.find(t => t.id === savedTheme);

    if (theme && (!theme.requiresPremium || isPremium)) {
      setBackgroundTheme(savedTheme!);
    } else {
      // Fall back to first free theme
      const freeThemes = BACKGROUND_THEMES.filter(t => !t.requiresPremium);
      if (freeThemes.length > 0) {
        setBackgroundTheme(freeThemes[0].id);
      }
    }
  }, [isPremium]);

  // Save background theme to localStorage (only if accessible)
  const changeBackgroundTheme = useCallback((themeId: string) => {
    const theme = BACKGROUND_THEMES.find(t => t.id === themeId);
    if (theme && (!theme.requiresPremium || isPremium)) {
      setBackgroundTheme(themeId);
      localStorage.setItem(BACKGROUND_THEME_KEY, themeId);
    }
  }, [isPremium]);

  return {
    backgroundTheme,
    changeBackgroundTheme,
  };
};
