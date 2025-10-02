/**
 * 🚨 BlackRent Mobile - Emergency Screen
 * 24/7 Emergency support and safety features
 * Now accessible from Profile section for better UX
 */

import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmergencyDashboard } from '@/components/ui/emergency-dashboard';

// Simple mock translation for emergency components
const useTranslation = () => ({
  t: (key: string, fallback?: string) => fallback || key.split('.').pop() || key
});

export default function EmergencyScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with back button */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-4 p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Núdzové funkcie
            </Text>
            <Text className="text-sm text-gray-600">
              24/7 Bezpečnostná podpora
            </Text>
          </View>
          <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center">
            <Ionicons name="shield-checkmark" size={16} color="#dc2626" />
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        <EmergencyDashboard userId="current-user" />
      </ScrollView>
    </SafeAreaView>
  );
}