import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
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
  // const [currentTheme, setCurrentTheme] = useState<Theme>(
  //   isDarkMode ? darkTheme : lightTheme
  // ); // Removed - using shadcn/ui theme system

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('blackrent-dark-mode', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Update theme when isDarkMode changes
  useEffect(() => {
    // setCurrentTheme(isDarkMode ? darkTheme : lightTheme); // Removed - using shadcn/ui theme system

    // Update document class for shadcn/ui theme system
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
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
    // theme: currentTheme, // Removed - using shadcn/ui theme system
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
