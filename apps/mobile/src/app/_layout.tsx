/**
 * 🍎 BlackRent Mobile App - Root Layout
 * Main app layout with initialization and providers
 */

import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { QueryProvider } from '../providers/QueryProvider';
import { initI18n } from '../i18n/config';

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize i18n and mark as ready
    async function initialize() {
      try {
        await initI18n();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // Continue even if i18n fails
      }
    }
    
    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>🍎 BlackRent Mobile</Text>
        <Text style={styles.subtitle}>Načítavam...</Text>
      </View>
    );
  }

  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="emergency" 
              options={{ 
                headerShown: true,
                title: 'Núdzový Kontakt',
                presentation: 'modal'
              }} 
            />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

