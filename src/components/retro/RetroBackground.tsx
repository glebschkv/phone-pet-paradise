import { memo } from 'react';
import {
  CustomImageBackground,
  DayHomeBackground,
  SunsetHomeBackground,
  NightHomeBackground,
  ForestHomeBackground,
  SnowHomeBackground,
  CityHomeBackground,
  RuinsHomeBackground,
  DeepOceanHomeBackground,
  DebugRulerBackground,
} from './backgrounds';

interface RetroBackgroundProps {
  theme?: string;
  customImage?: string; // Direct path to custom background image
}

/**
 * RetroBackground - Theme-aware background component
 *
 * Renders appropriate background based on theme name or custom image path.
 * Individual background components are split into separate files in ./backgrounds/
 * for better maintainability (previously 669 lines, now ~60 lines).
 */
export const RetroBackground = memo(({ theme = 'day', customImage }: RetroBackgroundProps) => {
  // If a custom image path is provided, use it directly
  if (customImage) {
    return (
      <CustomImageBackground
        key={`custom-${customImage}`}
        imagePath={customImage}
      />
    );
  }

  // Check if theme is actually an image path (starts with / or http)
  if (theme.startsWith('/') || theme.startsWith('http')) {
    return (
      <CustomImageBackground
        key={`custom-${theme}`}
        imagePath={theme}
      />
    );
  }

  switch (theme) {
    case 'debug':
      // Only show debug background in development mode
      return import.meta.env.DEV ? <DebugRulerBackground key="debug" /> : <DayHomeBackground key="day" />;
    case 'sunset':
      return <SunsetHomeBackground key="sunset" />;
    case 'night':
      return <NightHomeBackground key="night" />;
    case 'forest':
      return <ForestHomeBackground key="forest" />;
    case 'snow':
      return <SnowHomeBackground key="snow" />;
    case 'city':
      return <CityHomeBackground key="city" />;
    case 'ruins':
      return <RuinsHomeBackground key="ruins" />;
    case 'deepocean':
      return <DeepOceanHomeBackground key="deepocean" />;
    default:
      return <DayHomeBackground key="day" />;
  }
});

RetroBackground.displayName = 'RetroBackground';
