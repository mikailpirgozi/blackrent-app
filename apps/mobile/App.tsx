import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initializeAppPerformance } from './src/utils/app-performance-manager';
import { securityManager } from './src/utils/security-manager';
import { gdprManager } from './src/utils/gdpr-compliance';
import { pciManager } from './src/utils/pci-compliance';
import { logger } from './src/utils/logger';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      logger.info('🚀 Starting BlackRent Mobile App initialization...');

      // Initialize security systems
      await Promise.all([
        securityManager.initialize(),
        gdprManager.initialize(),
        pciManager.initialize(),
        initializeAppPerformance({
          enableImageOptimization: true,
          enableBundleOptimization: true,
          enableCacheOptimization: true,
          enablePerformanceMonitoring: true,
        }),
      ]);

      logger.info('✅ All systems initialized successfully');
      setIsInitialized(true);
    } catch (error) {
      logger.error('❌ App initialization failed', error);
      setInitError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  if (initError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>❌ Initialization Error</Text>
        <Text style={styles.errorSubtitle}>{initError}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>🍎 BlackRent Mobile</Text>
        <Text style={styles.subtitle}>Inicializácia bezpečnostných systémov...</Text>
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🍎 BlackRent Mobile</Text>
      <Text style={styles.subtitle}>✅ Aplikácia je pripravená!</Text>
      <Text style={styles.features}>
        🔒 Security Manager{'\n'}
        🇪🇺 GDPR Compliance{'\n'}
        💳 PCI DSS Compliance{'\n'}
        🚀 Performance Optimization
      </Text>
      <StatusBar style="auto" />
    </View>
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
  features: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 20,
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
