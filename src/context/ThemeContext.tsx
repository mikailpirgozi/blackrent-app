import type { Theme } from '@mui/material/styles';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { darkTheme } from '../theme/darkTheme';
import { theme as lightTheme } from '../theme/theme';

interface ThemeContextType {
  isDarkMode: boolean;
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Check system preference and saved preference
  const getInitialDarkMode = (): boolean => {
    // First check localStorage
    const saved = localStorage.getItem('blackrent-dark-mode');
    if (saved !== null) {
      return JSON.parse(saved);
    }

    // Then check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    isDarkMode ? darkTheme : lightTheme
  );

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('blackrent-dark-mode', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Update theme when isDarkMode changes
  useEffect(() => {
    setCurrentTheme(isDarkMode ? darkTheme : lightTheme);

    // Update document class for CSS-in-JS components
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#ffffff';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#1f2937';
    }
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set preference
      const saved = localStorage.getItem('blackrent-dark-mode');
      if (saved === null) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value: ThemeContextType = {
    isDarkMode,
    theme: currentTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
