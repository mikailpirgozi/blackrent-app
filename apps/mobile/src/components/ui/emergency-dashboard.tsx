import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Simple mock translation for emergency components
const useTranslation = () => ({
  t: (key: string, fallback?: string) => fallback || key.split('.').pop() || key
});
import { Button } from './button';
import { EmergencyButton } from './emergency-button';
import { AccidentReporter } from './accident-reporter';
import { SafetyMonitor } from './safety-monitor';
import { PanicMode } from './panic-mode';
import { emergencyService, EmergencyAlert, EmergencyContact } from '@/services/emergency-service';

// Simple mock auth hook for emergency components
const _useAuth = () => ({
  user: { id: 'user_123', name: 'Test User' }
});

interface EmergencyDashboardProps {
  userId: string;
  vehicleId?: string;
  bookingId?: string;
  className?: string;
}

export function EmergencyDashboard({
  userId,
  vehicleId = '',
  bookingId = '',
  className = ''
}: EmergencyDashboardProps) {
  const { t } = useTranslation();
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isAccidentReporterVisible, setIsAccidentReporterVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'contacts' | 'history'>('overview');

  useEffect(() => {
    // Load initial data
    loadActiveAlerts();
    loadEmergencyContacts();
    
    // Set up polling for active alerts
    const interval = setInterval(loadActiveAlerts, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadActiveAlerts = () => {
    const alerts = emergencyService.getActiveAlerts();
    setActiveAlerts(alerts);
  };

  const loadEmergencyContacts = () => {
    const _contacts = emergencyService.getEmergencyContacts();
    setEmergencyContacts(contacts);
  };

  const handleEmergencyCall = async (contactId?: string) => {
    try {
      if (contactId) {
        await emergencyService.makeEmergencyCall(contactId);
      } else {
        // Default emergency call (112)
        await emergencyService.makeEmergencyCall('emergency-sk');
      }
    } catch (error) {
      Alert.alert(
        t('error.title', 'Chyba'),
        t('emergency.callFailed', 'Nepodarilo sa uskutočniť núdzové volanie.')
      );
    }
  };

  const handleAccidentReport = async (report: any) => {
    try {
      await emergencyService.createEmergencyAlert(
        'accident',
        report.severity,
        userId,
        {
          vehicleId,
          bookingId,
          description: report.description,
          photos: report.photos?.map((p: any) => p.uri),
          autoDispatch: report.severity === 'critical'
        }
      );
      
      setIsAccidentReporterVisible(false);
      loadActiveAlerts();
    } catch (error) {
      Alert.alert(
        t('error.title', 'Chyba'),
        t('accident.reportFailed', 'Nepodarilo sa odoslať hlásenie nehody.')
      );
    }
  };

  const handlePanicTriggered = async (alert: any) => {
    try {
      if (alert.status === 'active') {
        await emergencyService.createEmergencyAlert(
          'panic',
          'critical',
          userId,
          {
            vehicleId,
            bookingId,
            description: 'Panic mode activated by user',
            autoDispatch: true
          }
        );
      }
      
      loadActiveAlerts();
    } catch (error) {
          }
  };

  const handleSafetyAlert = async (alert: any) => {
    try {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      switch (alert.severity) {
        case 'high':
        case 'critical':
          severity = alert.severity;
          break;
        case 'medium':
          severity = 'medium';
          break;
        default:
          severity = 'low';
      }

      await emergencyService.createEmergencyAlert(
        alert.type === 'speed' ? 'breakdown' : 'security',
        severity,
        userId,
        {
          vehicleId,
          bookingId,
          description: alert.message,
          autoDispatch: severity === 'critical'
        }
      );
      
      loadActiveAlerts();
    } catch (error) {
          }
  };

  const resolveAlert = async (alertId: string, status: 'resolved' | 'false_alarm') => {
    try {
      await emergencyService.resolveAlert(alertId, status);
      loadActiveAlerts();
    } catch (error) {
      Alert.alert(
        t('error.title', 'Chyba'),
        t('emergency.resolveFailed', 'Nepodarilo sa vyriešiť upozornenie.')
      );
    }
  };

  const getAlertIcon = (type: EmergencyAlert['type']) => {
    switch (type) {
      case 'accident': return 'car-sport';
      case 'breakdown': return 'construct';
      case 'panic': return 'warning';
      case 'medical': return 'medical';
      case 'security': return 'shield-checkmark';
      default: return 'alert-circle';
    }
  };

  const getAlertColor = (severity: EmergencyAlert['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getContactIcon = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'police': return 'shield';
      case 'medical': return 'medical';
      case 'fire': return 'flame';
      case 'roadside': return 'car';
      case 'blackrent': return 'headset';
      case 'personal': return 'person';
      default: return 'call';
    }
  };

  const renderOverviewTab = () => (
    <ScrollView className="flex-1">
      {/* Emergency Actions */}
      <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          {t('emergency.quickActions', 'Rýchle akcie')}
        </Text>
        
        <View className="flex-row justify-around">
          {/* Emergency Call */}
          <View className="items-center">
            <EmergencyButton
              onEmergencyCall={() => handleEmergencyCall()}
              emergencyNumber="112"
            />
          </View>
          
          {/* Panic Mode */}
          <View className="items-center">
            <PanicMode
              userId={userId}
              vehicleId={vehicleId}
              bookingId={bookingId}
              onPanicTriggered={handlePanicTriggered}
            />
          </View>
        </View>
        
        {/* Additional Actions */}
        <View className="flex-row space-x-3 mt-4">
          <Button
            onPress={() => setIsAccidentReporterVisible(true)}
            variant="outline"
            className="flex-1 flex-row items-center justify-center"
          >
            <Ionicons name="car-sport" size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-2">
              {t('accident.report', 'Nahlásiť nehodu')}
            </Text>
          </Button>
          
          <Button
            onPress={() => handleEmergencyCall('roadside-assistance')}
            variant="outline"
            className="flex-1 flex-row items-center justify-center"
          >
            <Ionicons name="construct" size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-2">
              {t('emergency.roadside', 'Odťah')}
            </Text>
          </Button>
        </View>
      </View>

      {/* Safety Monitor */}
      <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <SafetyMonitor
          vehicleId={vehicleId}
          bookingId={bookingId}
          onSafetyAlert={handleSafetyAlert}
          onEmergencyTriggered={() => handleEmergencyCall()}
        />
      </View>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            {t('emergency.activeAlerts', 'Aktívne upozornenia')}
          </Text>
          
          <View className="space-y-3">
            {activeAlerts.map((alert) => (
              <View
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-start flex-1">
                    <Ionicons 
                      name={getAlertIcon(alert.type) as any} 
                      size={20} 
                      color="currentColor" 
                    />
                    <View className="ml-3 flex-1">
                      <Text className="font-semibold">
                        {t(`emergency.${alert.type}`, alert.type)}
                      </Text>
                      {alert.description && (
                        <Text className="text-sm opacity-75 mt-1">
                          {alert.description}
                        </Text>
                      )}
                      <Text className="text-xs opacity-60 mt-1">
                        {alert.timestamp.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row space-x-2 ml-2">
                    <Button
                      onPress={() => resolveAlert(alert.id, 'resolved')}
                      variant="ghost"
                      className="p-1"
                    >
                      <Ionicons name="checkmark" size={16} color="currentColor" />
                    </Button>
                    <Button
                      onPress={() => resolveAlert(alert.id, 'false_alarm')}
                      variant="ghost"
                      className="p-1"
                    >
                      <Ionicons name="close" size={16} color="currentColor" />
                    </Button>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderContactsTab = () => (
    <ScrollView className="flex-1">
      <View className="bg-white rounded-lg border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">
          {t('emergency.contacts', 'Núdzové kontakty')}
        </Text>
        
        <View className="divide-y divide-gray-200">
          {emergencyContacts.map((contact) => (
            <View key={contact.id} className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                    <Ionicons 
                      name={getContactIcon(contact.type) as any} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-gray-900">
                      {contact.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {contact.phone}
                    </Text>
                  </View>
                </View>
                
                <Button
                  onPress={() => handleEmergencyCall(contact.id)}
                  className="px-4 py-2"
                >
                  <Ionicons name="call" size={16} color="white" />
                  <Text className="text-white ml-2">
                    {t('common.call', 'Volať')}
                  </Text>
                </Button>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView className="flex-1">
      <View className="bg-white rounded-lg p-4 border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          {t('emergency.history', 'História upozornení')}
        </Text>
        
        <View className="items-center py-8">
          <Ionicons name="time-outline" size={48} color="#D1D5DB" />
          <Text className="text-gray-500 mt-2">
            {t('emergency.noHistory', 'Žiadna história upozornení')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View className={`flex-1 ${className}`}>
      {/* Tab Navigation */}
      <View className="flex-row bg-white border-b border-gray-200">
        {[
          { key: 'overview', label: t('emergency.overview', 'Prehľad'), icon: 'grid-outline' },
          { key: 'contacts', label: t('emergency.contacts', 'Kontakty'), icon: 'call-outline' },
          { key: 'history', label: t('emergency.history', 'História'), icon: 'time-outline' },
        ].map((tab) => (
          <Button
            key={tab.key}
            onPress={() => setSelectedTab(tab.key as any)}
            variant="ghost"
            className={`
              flex-1 flex-row items-center justify-center py-3
              ${selectedTab === tab.key ? 'border-b-2 border-blue-500' : ''}
            `}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={selectedTab === tab.key ? '#3B82F6' : '#6B7280'} 
            />
            <Text className={`ml-2 ${
              selectedTab === tab.key ? 'text-blue-600 font-semibold' : 'text-gray-600'
            }`}>
              {tab.label}
            </Text>
          </Button>
        ))}
      </View>

      {/* Tab Content */}
      <View className="flex-1 p-4 bg-gray-50">
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'contacts' && renderContactsTab()}
        {selectedTab === 'history' && renderHistoryTab()}
      </View>

      {/* Accident Reporter Modal */}
      <AccidentReporter
        isVisible={isAccidentReporterVisible}
        onClose={() => setIsAccidentReporterVisible(false)}
        vehicleId={vehicleId}
        bookingId={bookingId}
        onReportSubmit={handleAccidentReport}
      />
    </View>
  );
}
