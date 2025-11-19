import { useState, useEffect } from 'react';

export type ThemeName = 'purple' | 'ocean' | 'forest' | 'sunset';

export interface Theme {
  name: string;
  displayName: string;
  className: string;
  gradient: string;
  emoji: string;
}

export const themes: Record<ThemeName, Theme> = {
  purple: {
    name: 'purple',
    displayName: 'Purple Dawn',
    className: '',
    gradient: 'var(--gradient-primary)',
    emoji: '🌸'
  },
  ocean: {
    name: 'ocean',
    displayName: 'Ocean Breeze',
    className: 'theme-ocean',
    gradient: 'var(--gradient-ocean)',
    emoji: '🌊'
  },
  forest: {
    name: 'forest',
    displayName: 'Forest Calm',
    className: 'theme-forest',
    gradient: 'var(--gradient-forest)',
    emoji: '🌲'
  },
  sunset: {
    name: 'sunset',
    displayName: 'Sunset Glow',
    className: 'theme-sunset',
    gradient: 'var(--gradient-sunset)',
    emoji: '🌅'
  }
};

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as ThemeName) || 'purple';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    Object.values(themes).forEach(theme => {
      if (theme.className) {
        root.classList.remove(theme.className);
      }
    });

    // Add current theme class
    const theme = themes[currentTheme];
    if (theme.className) {
      root.classList.add(theme.className);
    }

    // Save to localStorage
    localStorage.setItem('app-theme', currentTheme);
  }, [currentTheme]);

  return {
    currentTheme,
    setCurrentTheme,
    theme: themes[currentTheme],
    allThemes: themes
  };
}
