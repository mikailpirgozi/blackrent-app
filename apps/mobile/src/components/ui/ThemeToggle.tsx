/**
 * 🌓 Theme Toggle Component
 * Allows users to switch between Light, Dark, and System theme modes
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import AppleDesign from '../../styles/apple-design-system';

interface ThemeToggleProps {
  style?: ViewStyle;
  showLabel?: boolean;
}

export function ThemeToggle({ style, showLabel = true }: ThemeToggleProps) {
  const { theme, isDark, themeMode, setTheme } = useTheme();

  const themes = [
    { 
      mode: 'light' as const, 
      icon: 'sunny' as const, 
      label: 'Svetlý',
      color: AppleDesign.Colors.systemOrange,
    },
    { 
      mode: 'dark' as const, 
      icon: 'moon' as const, 
      label: 'Tmavý',
      color: AppleDesign.Colors.systemIndigo,
    },
    { 
      mode: 'system' as const, 
      icon: 'phone-portrait' as const, 
      label: 'Systém',
      color: AppleDesign.Colors.systemGray,
    },
  ];

  const handleThemePress = (mode: 'light' | 'dark' | 'system') => {
    setTheme(mode);
  };

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <Text style={[
          styles.label,
          { color: isDark ? theme.colors.dark.secondaryLabel : theme.colors.secondaryLabel }
        ]}>
          Vzhľad aplikácie
        </Text>
      )}
      
      <View style={styles.buttonsContainer}>
        {themes.map((themeOption) => {
          const isActive = themeMode === themeOption.mode;
          
          return (
            <TouchableOpacity
              key={themeOption.mode}
              style={[
                styles.button,
                {
                  backgroundColor: isDark 
                    ? theme.colors.dark.tertiarySystemFill 
                    : theme.colors.tertiarySystemFill
                },
                isActive && {
                  backgroundColor: theme.brand.primary,
                  shadowColor: theme.brand.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                },
              ]}
              onPress={() => handleThemePress(themeOption.mode)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={themeOption.icon}
                size={24}
                color={isActive ? '#FFFFFF' : themeOption.color}
              />
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: isActive 
                      ? '#FFFFFF' 
                      : isDark 
                        ? theme.colors.dark.label 
                        : theme.colors.label
                  }
                ]}
              >
                {themeOption.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Current Status */}
      <View style={styles.statusContainer}>
        <Ionicons 
          name="information-circle-outline" 
          size={16} 
          color={isDark ? theme.colors.dark.tertiaryLabel : theme.colors.tertiaryLabel} 
        />
        <Text style={[
          styles.statusText,
          { color: isDark ? theme.colors.dark.tertiaryLabel : theme.colors.tertiaryLabel }
        ]}>
          {themeMode === 'system' 
            ? `Systém: ${isDark ? 'Tmavý režim' : 'Svetlý režim'}` 
            : `Aktívny: ${themeMode === 'dark' ? 'Tmavý režim' : 'Svetlý režim'}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: AppleDesign.Spacing.md,
  },
  label: {
    ...AppleDesign.Typography.footnote,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.sm,
    paddingHorizontal: AppleDesign.Spacing.sm,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.xs,
  },
  buttonText: {
    ...AppleDesign.Typography.footnote,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.xs,
    marginTop: AppleDesign.Spacing.sm,
  },
  statusText: {
    ...AppleDesign.Typography.caption2,
  },
});

