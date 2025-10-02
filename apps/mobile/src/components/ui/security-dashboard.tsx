/**
 * 🔒 Security Dashboard Component
 * Comprehensive security monitoring and compliance dashboard
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { securityManager, useSecurityStatus } from '../../utils/security-manager';
import { gdprManager, useGDPRCompliance } from '../../utils/gdpr-compliance';
import { pciManager, usePCICompliance } from '../../utils/pci-compliance';
import { appPerformanceManager, usePerformanceStatus } from '../../utils/app-performance-manager';
import { AppleCard } from './apple-card/apple-card';
import { logger } from '../../utils/logger';

interface SecurityDashboardProps {
  userId?: string;
  onSecurityAction?: (action: string, data?: any) => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  userId,
  onSecurityAction,
}) => {
  const securityStatus = useSecurityStatus();
  const { complianceStatus } = usePCICompliance();
  const { privacyData, recordConsent, requestDataExport, requestDataDeletion } = useGDPRCompliance(userId);
  const performanceStatus = usePerformanceStatus();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'gdpr' | 'pci' | 'performance'>('overview');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      loadAuditLogs();
    }
  }, [userId]);

  const loadAuditLogs = async () => {
    try {
      const logs = securityManager.getAuditLogs({
        userId,
        startDate: Date.now() - (7 * 24 * 60 * 60 * 1000), // Last 7 days
      });
      setAuditLogs(logs.slice(0, 10)); // Show latest 10
    } catch (error) {
      logger.error('Failed to load audit logs', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const success = await securityManager.authenticateWithBiometrics('Access security settings');
      if (success) {
        Alert.alert('Success', 'Biometric authentication successful');
        onSecurityAction?.('biometric_auth_success');
      } else {
        Alert.alert('Failed', 'Biometric authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication error');
      logger.error('Biometric auth error', error);
    }
  };

  const handleDataExport = async () => {
    try {
      const requestId = await requestDataExport?.();
      if (requestId) {
        Alert.alert('Success', `Data export request submitted. Request ID: ${requestId}`);
        onSecurityAction?.('data_export_requested', { requestId });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request data export');
      logger.error('Data export error', error);
    }
  };

  const handleDataDeletion = async () => {
    Alert.alert(
      'Confirm Data Deletion',
      'Are you sure you want to delete your personal data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const requestId = await requestDataDeletion?.();
              if (requestId) {
                Alert.alert('Success', `Data deletion request submitted. Request ID: ${requestId}`);
                onSecurityAction?.('data_deletion_requested', { requestId });
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to request data deletion');
              logger.error('Data deletion error', error);
            }
          },
        },
      ]
    );
  };

  const handleConsentChange = async (consentType: any, granted: boolean) => {
    try {
      await recordConsent?.(consentType, granted);
      Alert.alert('Success', `Consent ${granted ? 'granted' : 'revoked'} for ${consentType}`);
      onSecurityAction?.('consent_changed', { consentType, granted });
    } catch (error) {
      Alert.alert('Error', 'Failed to update consent');
      logger.error('Consent update error', error);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#10B981'; // Green
      case 'medium': return '#F59E0B'; // Yellow
      case 'high': return '#EF4444'; // Red
      case 'critical': return '#DC2626'; // Dark Red
      default: return '#6B7280'; // Gray
    }
  };

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? '#10B981' : '#EF4444';
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Security Dashboard</Text>
        <Text className="text-sm text-gray-600 mt-1">
          Monitor your security, privacy, and compliance status
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white px-6 py-3 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-4">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'gdpr', label: 'Privacy (GDPR)' },
              { key: 'pci', label: 'Payments (PCI)' },
              { key: 'performance', label: 'Performance' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === tab.key
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-gray-100 border border-gray-300'
                }`}
              >
                <Text
                  className={`font-medium ${
                    activeTab === tab.key ? 'text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ padding: 20 }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View className="space-y-6">
            {/* Security Status Cards */}
            <View className="grid grid-cols-2 gap-4">
              <AppleCard padding="medium">
                <View className="items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: getStatusColor(securityStatus.encryptionEnabled) + '20' }}
                  >
                    <Text
                      className="text-2xl"
                      style={{ color: getStatusColor(securityStatus.encryptionEnabled) }}
                    >
                      🔒
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-900">Encryption</Text>
                  <Text className="text-xs text-gray-600">
                    {securityStatus.encryptionEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </AppleCard>

              <AppleCard padding="medium">
                <View className="items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: getStatusColor(securityStatus.biometricsAvailable) + '20' }}
                  >
                    <Text
                      className="text-2xl"
                      style={{ color: getStatusColor(securityStatus.biometricsAvailable) }}
                    >
                      👆
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-900">Biometrics</Text>
                  <Text className="text-xs text-gray-600">
                    {securityStatus.biometricsAvailable ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
              </AppleCard>

              <AppleCard padding="medium">
                <View className="items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: getRiskLevelColor(securityStatus.riskLevel) + '20' }}
                  >
                    <Text
                      className="text-2xl"
                      style={{ color: getRiskLevelColor(securityStatus.riskLevel) }}
                    >
                      ⚠️
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-900">Risk Level</Text>
                  <Text className="text-xs text-gray-600 capitalize">
                    {securityStatus.riskLevel}
                  </Text>
                </View>
              </AppleCard>

              <AppleCard padding="medium">
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-2">
                    <Text className="text-2xl text-blue-600">👥</Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-900">Sessions</Text>
                  <Text className="text-xs text-gray-600">
                    {securityStatus.activeSessions} active
                  </Text>
                </View>
              </AppleCard>
            </View>

            {/* Quick Actions */}
            <AppleCard padding="large">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={handleBiometricAuth}
                  className="flex-row items-center justify-between p-3 bg-blue-50 rounded-lg"
                >
                  <View className="flex-row items-center">
                    <Text className="text-blue-600 mr-3">👆</Text>
                    <Text className="font-medium text-blue-900">Test Biometric Authentication</Text>
                  </View>
                  <Text className="text-blue-600">→</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDataExport}
                  className="flex-row items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <View className="flex-row items-center">
                    <Text className="text-green-600 mr-3">📥</Text>
                    <Text className="font-medium text-green-900">Export My Data</Text>
                  </View>
                  <Text className="text-green-600">→</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => performanceStatus.optimizeNow()}
                  className="flex-row items-center justify-between p-3 bg-purple-50 rounded-lg"
                >
                  <View className="flex-row items-center">
                    <Text className="text-purple-600 mr-3">⚡</Text>
                    <Text className="font-medium text-purple-900">Optimize Performance</Text>
                  </View>
                  <Text className="text-purple-600">→</Text>
                </TouchableOpacity>
              </View>
            </AppleCard>

            {/* Recent Security Events */}
            <AppleCard padding="large">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</Text>
              {auditLogs.length > 0 ? (
                <View className="space-y-3">
                  {auditLogs.map((log, index) => (
                    <View key={index} className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <View className="flex-1">
                        <Text className="font-medium text-gray-900 capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleString()}
                        </Text>
                      </View>
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: getRiskLevelColor(log.riskLevel) + '20' }}
                      >
                        <Text
                          className="text-xs font-medium capitalize"
                          style={{ color: getRiskLevelColor(log.riskLevel) }}
                        >
                          {log.riskLevel}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-gray-500 text-center py-4">No recent security events</Text>
              )}
            </AppleCard>
          </View>
        )}

        {/* GDPR Tab */}
        {activeTab === 'gdpr' && (
          <View className="space-y-6">
            <AppleCard padding="large">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Privacy Consents</Text>
              {privacyData?.consents && (
                <View className="space-y-4">
                  {Object.entries(privacyData.consents).map(([consentType, granted]) => (
                    <View key={consentType} className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-medium text-gray-900 capitalize">
                          {consentType.replace(/_/g, ' ')}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {granted ? 'Consent granted' : 'Consent not granted'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleConsentChange(consentType, !granted)}
                        className={`px-4 py-2 rounded-lg ${
                          granted ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'
                        }`}
                      >
                        <Text
                          className={`font-medium ${
                            granted ? 'text-green-700' : 'text-gray-700'
                          }`}
                        >
                          {granted ? 'Revoke' : 'Grant'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </AppleCard>

            <AppleCard padding="large">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Data Rights</Text>
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={handleDataExport}
                  className="flex-row items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <View>
                    <Text className="font-medium text-blue-900">Export My Data</Text>
                    <Text className="text-sm text-blue-700">Download all your personal data</Text>
                  </View>
                  <Text className="text-blue-600">📥</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDataDeletion}
                  className="flex-row items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <View>
                    <Text className="font-medium text-red-900">Delete My Data</Text>
                    <Text className="text-sm text-red-700">Request deletion of your personal data</Text>
                  </View>
                  <Text className="text-red-600">🗑️</Text>
                </TouchableOpacity>
              </View>
            </AppleCard>
          </View>
        )}

        {/* PCI Tab */}
        {activeTab === 'pci' && (
          <View className="space-y-6">
            <AppleCard padding="large">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Payment Security Status</Text>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">PCI DSS Compliance</Text>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: complianceStatus.isCompliant ? '#10B981' : '#EF4444',
                    }}
                  >
                    <Text className="text-white text-sm font-medium">
                      {complianceStatus.isCompliant ? 'Compliant' : 'Non-Compliant'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">Active Fraud Alerts</Text>
                  <Text className="text-gray-600">{complianceStatus.activeAlerts}</Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">Risk Level</Text>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: getRiskLevelColor(complianceStatus.riskLevel) + '20' }}
                  >
                    <Text
                      className="text-sm font-medium capitalize"
                      style={{ color: getRiskLevelColor(complianceStatus.riskLevel) }}
                    >
                      {complianceStatus.riskLevel}
                    </Text>
                  </View>
                </View>
              </View>
            </AppleCard>
          </View>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <View className="space-y-6">
            <AppleCard padding="large">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Performance Status</Text>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">System Health</Text>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: performanceStatus.isHealthy ? '#10B981' : '#EF4444',
                    }}
                  >
                    <Text className="text-white text-sm font-medium">
                      {performanceStatus.isHealthy ? 'Healthy' : 'Issues Detected'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">Memory Usage</Text>
                  <Text className="text-gray-600">
                    {performanceStatus.memoryUsage.toFixed(1)} MB
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">Cache Efficiency</Text>
                  <Text className="text-gray-600">
                    {(performanceStatus.cacheEfficiency * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>

              {performanceStatus.recommendations.length > 0 && (
                <View className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Text className="font-medium text-yellow-900 mb-2">Recommendations</Text>
                  {performanceStatus.recommendations.map((rec, index) => (
                    <Text key={index} className="text-sm text-yellow-800">
                      • {rec}
                    </Text>
                  ))}
                </View>
              )}
            </AppleCard>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
