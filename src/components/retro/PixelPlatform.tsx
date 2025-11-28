import { memo } from 'react';

interface PixelPlatformProps {
  theme?: string;
}

// Ground is already included in the background images (GRASSYPATH.png, etc.)
// This component is kept for backwards compatibility but renders nothing
export const PixelPlatform = memo(({ theme: _theme = 'day' }: PixelPlatformProps) => {
  return null;
});

PixelPlatform.displayName = 'PixelPlatform';
