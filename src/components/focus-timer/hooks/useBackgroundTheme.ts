/**
 * useBackgroundTheme Hook
 *
 * Manages background theme state with localStorage persistence.
 * Validates themes against user's unlock level and falls back to
 * the highest unlocked theme when necessary.
 */

import { useState, useEffect, useCallback } from "react";
import { BACKGROUND_THEME_KEY, BACKGROUND_THEMES } from "../constants";

export const useBackgroundTheme = (currentLevel: number) => {
  const [backgroundTheme, setBackgroundTheme] = useState<string>('sky');

  // Load background theme from localStorage (validate against unlock level)
  useEffect(() => {
    const savedTheme = localStorage.getItem(BACKGROUND_THEME_KEY);
    const theme = BACKGROUND_THEMES.find(t => t.id === savedTheme);

    if (theme && theme.unlockLevel <= currentLevel) {
      setBackgroundTheme(savedTheme!);
    } else {
      // Fall back to highest unlocked theme
      const unlockedThemes = BACKGROUND_THEMES.filter(t => t.unlockLevel <= currentLevel);
      if (unlockedThemes.length > 0) {
        setBackgroundTheme(unlockedThemes[unlockedThemes.length - 1].id);
      }
    }
  }, [currentLevel]);

  // Save background theme to localStorage (only if unlocked)
  const changeBackgroundTheme = useCallback((themeId: string) => {
    const theme = BACKGROUND_THEMES.find(t => t.id === themeId);
    if (theme && theme.unlockLevel <= currentLevel) {
      setBackgroundTheme(themeId);
      localStorage.setItem(BACKGROUND_THEME_KEY, themeId);
    }
  }, [currentLevel]);

  return {
    backgroundTheme,
    changeBackgroundTheme,
  };
};
