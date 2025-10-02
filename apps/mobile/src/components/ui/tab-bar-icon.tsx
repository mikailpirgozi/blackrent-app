/**
 * 📱 Optimalizovaný TabBar Icon komponent
 * Používa Ionicons namiesto emoji pre lepší výkon a konzistentný vzhľad
 */

import React, { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

// ===================================
// 🎯 PROPS INTERFACE
// ===================================
interface TabBarIconProps {
  name: string;
  color: string;
  size?: number;
  focused?: boolean;
}

// ===================================
// 🎨 ICON MAPPING
// ===================================
const iconMap: Record<string, { 
  default: keyof typeof Ionicons.glyphMap; 
  focused: keyof typeof Ionicons.glyphMap;
}> = {
  home: {
    default: 'home-outline',
    focused: 'home',
  },
  car: {
    default: 'car-outline',
    focused: 'car',
  },
  'shopping-bag': {
    default: 'bag-outline',
    focused: 'bag',
  },
  user: {
    default: 'person-outline',
    focused: 'person',
  },
  catalog: {
    default: 'grid-outline',
    focused: 'grid',
  },
  store: {
    default: 'storefront-outline',
    focused: 'storefront',
  },
  profile: {
    default: 'person-circle-outline',
    focused: 'person-circle',
  },
  search: {
    default: 'search-outline',
    focused: 'search',
  },
  bookings: {
    default: 'calendar-outline',
    focused: 'calendar',
  },
  favorites: {
    default: 'heart-outline',
    focused: 'heart',
  },
  settings: {
    default: 'settings-outline',
    focused: 'settings',
  },
  notifications: {
    default: 'notifications-outline',
    focused: 'notifications',
  },
};

// ===================================
// 📱 TAB BAR ICON COMPONENT
// ===================================
const TabBarIcon: React.FC<TabBarIconProps> = memo(({
  name,
  color,
  size = 24,
  focused = false,
}) => {
  // Get icon configuration
  const iconConfig = iconMap[name];
  
  if (!iconConfig) {
    // Fallback icon for unknown names
    return (
      <Ionicons
        name="help-circle-outline"
        size={size}
        color={color}
      />
    );
  }

  // Select appropriate icon based on focus state
  const iconName = focused ? iconConfig.focused : iconConfig.default;

  return (
    <Ionicons
      name={iconName}
      size={size}
      color={color}
      style={{
        // Add subtle shadow for better visibility
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.name === nextProps.name &&
    prevProps.color === nextProps.color &&
    prevProps.size === nextProps.size &&
    prevProps.focused === nextProps.focused
  );
});

// Set display name for debugging
TabBarIcon.displayName = 'TabBarIcon';

// ===================================
// 🎨 THEMED TAB BAR ICON
// ===================================
interface ThemedTabBarIconProps extends Omit<TabBarIconProps, 'color'> {
  variant?: 'primary' | 'secondary' | 'muted';
  focused?: boolean;
}

export const ThemedTabBarIcon: React.FC<ThemedTabBarIconProps> = memo(({
  variant = 'primary',
  focused = false,
  ...props
}) => {
  // Get color based on variant and focus state
  const getColor = () => {
    if (focused) {
      switch (variant) {
        case 'primary':
          return theme.brand.primary;
        case 'secondary':
          return theme.brand.secondary;
        case 'muted':
          return theme.colors.secondaryLabel;
        default:
          return theme.brand.primary;
      }
    } else {
      return theme.colors.tertiaryLabel;
    }
  };

  return (
    <TabBarIcon
      {...props}
      color={getColor()}
      focused={focused}
    />
  );
});

// Set display name for debugging
ThemedTabBarIcon.displayName = 'ThemedTabBarIcon';

// ===================================
// 🎯 UTILITY FUNCTIONS
// ===================================
export const getAvailableIcons = (): string[] => {
  return Object.keys(iconMap);
};

export const hasIcon = (name: string): boolean => {
  return name in iconMap;
};

export const addCustomIcon = (
  name: string, 
  icons: { 
    default: keyof typeof Ionicons.glyphMap; 
    focused: keyof typeof Ionicons.glyphMap;
  }
) => {
  iconMap[name] = icons;
};

// Export default component
export default TabBarIcon;
export type { TabBarIconProps, ThemedTabBarIconProps };
