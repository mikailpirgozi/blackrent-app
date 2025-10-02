/**
 * 🍎 BlackRent Mobile App - Tab Layout
 * Tab navigation with bottom tabs and optimized icons
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { ThemedTabBarIcon } from '../../components/ui/tab-bar-icon';
import { theme } from '../../styles/theme';

export default function TabLayout() {
  return (
    // @ts-ignore - Expo Router types issue
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.brand.primary,
        tabBarInactiveTintColor: theme.colors.tertiaryLabel,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.systemBackground,
          borderTopColor: theme.colors.separator,
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          ...Platform.select({
            ios: {
              // Use blur effect on iOS
              position: 'absolute',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
            },
            default: {
              elevation: 8,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}>
      {/* @ts-ignore - Expo Router types issue */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Domov',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <ThemedTabBarIcon 
              name="home" 
              focused={focused}
              size={24}
            />
          ),
        }}
      />
      {/* @ts-ignore - Expo Router types issue */}
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Katalóg',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <ThemedTabBarIcon 
              name="car" 
              focused={focused}
              size={24}
            />
          ),
        }}
      />
      {/* @ts-ignore - Expo Router types issue */}
      <Tabs.Screen
        name="store"
        options={{
          title: 'Obchod',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <ThemedTabBarIcon 
              name="shopping-bag" 
              focused={focused}
              size={24}
            />
          ),
        }}
      />
      {/* @ts-ignore - Expo Router types issue */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <ThemedTabBarIcon 
              name="settings" 
              focused={focused}
              size={24}
            />
          ),
        }}
      />
      {/* @ts-ignore - Expo Router types issue */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <ThemedTabBarIcon 
              name="user" 
              focused={focused}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
