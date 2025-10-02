/**
 * 🎨 Theme Context Provider pre BlackRent Mobile
 * Poskytuje centralizovanú správu témy a dark mode podporu
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, themeUtils, styledSystem, ThemeContextType } from '../styles/theme';

// ===================================
// 🎯 THEME CONTEXT
// ===================================
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ===================================
// 🎨 THEME PROVIDER PROPS
// ===================================
interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: 'light' | 'dark' | 'system';
}

// ===================================
// 🎭 THEME PROVIDER COMPONENT
// ===================================
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'system',
}) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(initialTheme);
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Determine if dark mode is active
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  // ===================================
  // 🔄 THEME PERSISTENCE
  // ===================================
  const THEME_STORAGE_KEY = '@blackrent_theme_mode';

  // Load saved theme from AsyncStorage
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeMode(savedTheme as 'light' | 'dark' | 'system');
        }
      } catch (error) {
              }
    };

    loadSavedTheme();
  }, []);

  // Save theme to AsyncStorage when it changes
  const saveTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeMode(newTheme);
    } catch (error) {
          }
  };

  // ===================================
  // 📱 SYSTEM THEME LISTENER
  // ===================================
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // ===================================
  // 🎨 THEME UTILITIES
  // ===================================
  const toggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    saveTheme(nextTheme);
  };

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    saveTheme(newTheme);
  };

  // Get dynamic colors based on current theme
  const getDynamicColors = () => ({
    background: isDark ? theme.colors.dark.systemBackground : theme.colors.systemBackground,
    text: isDark ? theme.colors.dark.label : theme.colors.label,
    secondaryText: isDark ? theme.colors.dark.secondaryLabel : theme.colors.secondaryLabel,
    cardBackground: isDark ? theme.colors.dark.secondarySystemGroupedBackground : theme.colors.secondarySystemGroupedBackground,
    separator: isDark ? theme.colors.dark.tertiaryLabel : theme.colors.separator,
  });

  // Enhanced theme object with current mode
  const enhancedTheme = {
    ...theme,
    isDark,
    mode: themeMode,
    systemColorScheme,
    dynamicColors: getDynamicColors(),
  };

  // ===================================
  // 🎯 CONTEXT VALUE
  // ===================================
  const contextValue: ThemeContextType = {
    theme: enhancedTheme as any,
    isDark,
    toggleTheme,
    setTheme,
    themeMode,
    systemColorScheme,
    utils: {
      ...themeUtils,
      getDynamicColor: (lightColor: string, darkColor: string) => 
        isDark ? darkColor : lightColor,
    },
    styled: styledSystem,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// ===================================
// 🪝 USE THEME HOOK
// ===================================
export const useTheme = (): ThemeContextType => {
  const _context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// ===================================
// 🎨 THEME HOOKS
// ===================================

// Hook for getting current colors
export const useColors = () => {
  const { theme, isDark } = useTheme();
  
  return {
    ...theme.colors,
    dynamic: theme.dynamicColors,
    brand: theme.brand,
    semantic: theme.semantic,
    isDark,
  };
};

// Hook for getting typography styles
export const useTypography = () => {
  const { theme } = useTheme();
  return theme.typography;
};

// Hook for getting spacing values
export const useSpacing = () => {
  const { theme, utils } = useTheme();
  
  return {
    ...theme.spacing,
    create: utils.spacing,
  };
};

// Hook for getting component variants
export const useVariants = () => {
  const { theme, utils } = useTheme();
  
  return {
    ...theme.variants,
    get: utils.getVariant,
  };
};

// Hook for styled system utilities
export const useStyled = () => {
  const { styled } = useTheme();
  return styled;
};

// ===================================
// 🎭 THEME UTILITIES
// ===================================

// HOC for theme-aware components
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: typeof theme }>
) => {
  return (props: P) => {
    const { theme } = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

// Theme-aware styled component creator
export const createThemedComponent = <P extends object>(
  BaseComponent: React.ComponentType<P>,
  getStyles: (theme: any, isDark: boolean) => any
) => {
  return (props: P) => {
    const { theme, isDark } = useTheme();
    const styles = getStyles(theme, isDark);
    
    return <BaseComponent {...props} style={[styles, (props as any).style]} />;
  };
};

// Export types
export type { ThemeContextType };

// Export default
export default ThemeProvider;
