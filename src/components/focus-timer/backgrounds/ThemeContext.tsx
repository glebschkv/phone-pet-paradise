import { createContext, useContext, ReactNode, useMemo } from 'react';

// Theme accent colors that adapt to each background
export interface ThemeColors {
  // Timer ring gradient
  ringStart: string;
  ringMid: string;
  ringEnd: string;
  // Glow effects
  glow: string;
  glowStrong: string;
  // Text and UI
  textPrimary: string;
  textSecondary: string;
  // Glass morphism
  glassBg: string;
  glassBorder: string;
  // Status indicators
  activeGlow: string;
}

export const themeColorMap: Record<string, ThemeColors> = {
  sky: {
    ringStart: 'hsl(200 70% 60%)',
    ringMid: 'hsl(180 60% 55%)',
    ringEnd: 'hsl(45 70% 60%)',
    glow: 'hsl(200 60% 60% / 0.4)',
    glowStrong: 'hsl(200 70% 65% / 0.6)',
    textPrimary: 'hsl(220 30% 20%)',
    textSecondary: 'hsl(220 20% 40%)',
    glassBg: 'hsl(200 40% 30% / 0.25)',
    glassBorder: 'hsl(200 30% 80% / 0.3)',
    activeGlow: 'hsl(200 70% 55%)',
  },
  night: {
    ringStart: 'hsl(260 60% 70%)',
    ringMid: 'hsl(280 50% 65%)',
    ringEnd: 'hsl(200 55% 65%)',
    glow: 'hsl(260 50% 70% / 0.5)',
    glowStrong: 'hsl(260 60% 75% / 0.7)',
    textPrimary: 'hsl(0 0% 98%)',
    textSecondary: 'hsl(240 20% 80%)',
    glassBg: 'hsl(240 30% 15% / 0.4)',
    glassBorder: 'hsl(260 30% 60% / 0.25)',
    activeGlow: 'hsl(260 60% 70%)',
  },
  sunset: {
    ringStart: 'hsl(25 85% 60%)',
    ringMid: 'hsl(350 70% 60%)',
    ringEnd: 'hsl(280 50% 60%)',
    glow: 'hsl(30 80% 60% / 0.5)',
    glowStrong: 'hsl(25 85% 65% / 0.7)',
    textPrimary: 'hsl(0 0% 100%)',
    textSecondary: 'hsl(30 30% 90%)',
    glassBg: 'hsl(280 30% 20% / 0.35)',
    glassBorder: 'hsl(30 50% 70% / 0.25)',
    activeGlow: 'hsl(30 85% 60%)',
  },
  snow: {
    ringStart: 'hsl(200 50% 65%)',
    ringMid: 'hsl(210 45% 70%)',
    ringEnd: 'hsl(180 40% 75%)',
    glow: 'hsl(200 40% 70% / 0.5)',
    glowStrong: 'hsl(200 50% 80% / 0.6)',
    textPrimary: 'hsl(210 30% 20%)',
    textSecondary: 'hsl(210 20% 40%)',
    glassBg: 'hsl(210 30% 40% / 0.2)',
    glassBorder: 'hsl(0 0% 100% / 0.35)',
    activeGlow: 'hsl(200 50% 65%)',
  },
  forest: {
    ringStart: 'hsl(140 50% 50%)',
    ringMid: 'hsl(160 45% 55%)',
    ringEnd: 'hsl(80 50% 55%)',
    glow: 'hsl(140 45% 55% / 0.5)',
    glowStrong: 'hsl(140 50% 60% / 0.6)',
    textPrimary: 'hsl(150 20% 15%)',
    textSecondary: 'hsl(150 15% 35%)',
    glassBg: 'hsl(150 30% 25% / 0.3)',
    glassBorder: 'hsl(140 30% 60% / 0.25)',
    activeGlow: 'hsl(140 50% 50%)',
  },
  city: {
    ringStart: 'hsl(280 60% 65%)',
    ringMid: 'hsl(200 70% 60%)',
    ringEnd: 'hsl(330 60% 60%)',
    glow: 'hsl(280 50% 65% / 0.5)',
    glowStrong: 'hsl(280 60% 70% / 0.7)',
    textPrimary: 'hsl(0 0% 98%)',
    textSecondary: 'hsl(280 20% 75%)',
    glassBg: 'hsl(260 30% 15% / 0.45)',
    glassBorder: 'hsl(280 40% 60% / 0.3)',
    activeGlow: 'hsl(280 60% 65%)',
  },
};

interface ThemeContextValue {
  theme: string;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'sky',
  colors: themeColorMap.sky,
});

export const useThemeColors = () => useContext(ThemeContext);

interface ThemeProviderProps {
  theme: string;
  children: ReactNode;
}

export const FocusThemeProvider = ({ theme, children }: ThemeProviderProps) => {
  const value = useMemo(() => ({
    theme,
    colors: themeColorMap[theme] || themeColorMap.sky,
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
