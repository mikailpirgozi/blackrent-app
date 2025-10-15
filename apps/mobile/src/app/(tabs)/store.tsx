/**
 * 🛍️ Store Screen
 * E-commerce store for vehicle accessories and services
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppleDesign from '../../styles/apple-design-system';

export default function StoreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Obchod</Text>
          <Text style={styles.headerSubtitle}>Príslušenstvo a služby</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.welcomeText}>Obchod bude čoskoro dostupný</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingTop: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.md,
  },
  headerTitle: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: AppleDesign.Spacing.xs,
  },
  content: {
    padding: AppleDesign.Spacing.lg,
  },
  welcomeText: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    textAlign: 'center',
  },
});

