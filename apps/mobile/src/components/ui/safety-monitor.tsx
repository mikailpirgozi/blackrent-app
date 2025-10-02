import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
// Simple mock translation for emergency components
const useTranslation = () => ({
  t: (key: string, fallback?: string) => fallback || key.split('.').pop() || key
});
import { Button } from './button';

interface SafetyAlert {
  id: string;
  type: 'speed' | 'geofence' | 'maintenance' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface SafetyMonitorProps {
  vehicleId?: string;
  bookingId?: string;
  speedLimit?: number; // km/h
  geofenceRadius?: number; // meters
  onSafetyAlert?: (alert: SafetyAlert) => void;
  onEmergencyTriggered?: () => void;
  className?: string;
}

interface VehicleStatus {
  speed: number; // km/h
  location: Location.LocationObject | null;
  isMoving: boolean;
  batteryLevel?: number;
  fuelLevel?: number;
  engineStatus: 'on' | 'off' | 'unknown';
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export function SafetyMonitor({
  vehicleId = '',
  bookingId = '',
  speedLimit = 130, // Default Slovak highway speed limit
  geofenceRadius = 1000, // 1km default
  onSafetyAlert,
  onEmergencyTriggered,
  className = ''
}: SafetyMonitorProps) {
  const { t } = useTranslation();
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>({
    speed: 0,
    location: null,
    isMoving: false,
    engineStatus: 'unknown'
  });
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [isMonitoring]);

  const startMonitoring = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('location.permissionDenied', 'Povolenie zamietnuté'),
          t('safety.locationRequired', 'Potrebujeme prístup k lokácii pre bezpečnostné monitorovanie.')
        );
        return;
      }

      // Start location tracking
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every second
          distanceInterval: 1, // Update every meter
        },
        (location) => {
          updateVehicleStatus(location);
        }
      );

      // Store subscription for cleanup
      locationSubscriptionRef.current = locationSubscription;

    } catch (error) {
            createAlert('emergency', 'critical', t('safety.monitoringError', 'Chyba pri spustení monitorovania'));
    }
  };

  const stopMonitoring = () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
    }
  };

  const updateVehicleStatus = (location: Location.LocationObject) => {
    const speed = location.coords.speed ? location.coords.speed * 3.6 : 0; // Convert m/s to km/h
    const isMoving = speed > 5; // Consider moving if speed > 5 km/h

    setVehicleStatus(prev => ({
      ...prev,
      speed,
      location,
      isMoving
    }));

    // Check for speed violations
    if (speed > speedLimit) {
      createAlert(
        'speed',
        speed > speedLimit * 1.2 ? 'high' : 'medium',
        t('safety.speedViolation', `Prekročenie rýchlosti: ${Math.round(speed)} km/h (limit: ${speedLimit} km/h)`)
      );
    }

    // Check maintenance alerts (mock data for demo)
    checkMaintenanceAlerts();
  };

  const checkMaintenanceAlerts = () => {
    // Mock maintenance check - in real app this would come from vehicle API
    const mockMaintenanceDate = new Date();
    mockMaintenanceDate.setDate(mockMaintenanceDate.getDate() + 7); // Due in 7 days

    if (Math.random() < 0.001) { // 0.1% chance per update for demo
      createAlert(
        'maintenance',
        'medium',
        t('safety.maintenanceDue', 'Servis vozidla je potrebný do 7 dní')
      );
    }
  };

  const createAlert = (
    type: SafetyAlert['type'],
    severity: SafetyAlert['severity'],
    message: string
  ) => {
    const alert: SafetyAlert = {
      id: Date.now().toString(),
      type,
      severity,
      message,
      timestamp: new Date(),
      location: vehicleStatus.location ? {
        latitude: vehicleStatus.location.coords.latitude,
        longitude: vehicleStatus.location.coords.longitude,
      } : undefined
    };

    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    onSafetyAlert?.(alert);

    // Haptic feedback for important alerts
    if (severity === 'high' || severity === 'critical') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Auto-dismiss non-critical alerts
    if (severity !== 'critical') {
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 10000); // Remove after 10 seconds
    }
  };

  const triggerEmergency = () => {
    setEmergencyMode(true);
    createAlert(
      'emergency',
      'critical',
      t('safety.emergencyTriggered', 'Núdzový režim aktivovaný')
    );
    onEmergencyTriggered?.();
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getAlertIcon = (type: SafetyAlert['type']) => {
    switch (type) {
      case 'speed': return 'speedometer';
      case 'geofence': return 'location';
      case 'maintenance': return 'construct';
      case 'emergency': return 'warning';
      default: return 'alert-circle';
    }
  };

  const getAlertColor = (severity: SafetyAlert['severity']) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <View className={`${className}`}>
      {/* Monitoring Toggle */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {t('safety.monitoring', 'Bezpečnostné monitorovanie')}
          </Text>
          <Text className="text-sm text-gray-500">
            {isMonitoring 
              ? t('safety.active', 'Aktívne') 
              : t('safety.inactive', 'Neaktívne')
            }
          </Text>
        </View>
        
        <Button
          onPress={() => setIsMonitoring(!isMonitoring)}
          variant={isMonitoring ? 'default' : 'outline'}
          className="px-4 py-2"
        >
          <Ionicons 
            name={isMonitoring ? 'shield-checkmark' : 'shield-outline'} 
            size={20} 
            color={isMonitoring ? 'white' : '#6B7280'} 
          />
          <Text className={`ml-2 ${isMonitoring ? 'text-white' : 'text-gray-700'}`}>
            {isMonitoring ? t('common.on', 'Zapnuté') : t('common.off', 'Vypnuté')}
          </Text>
        </Button>
      </View>

      {/* Vehicle Status */}
      {isMonitoring && (
        <View className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            {t('safety.vehicleStatus', 'Stav vozidla')}
          </Text>
          
          <View className="grid grid-cols-2 gap-4">
            <View className="flex-row items-center">
              <Ionicons name="speedometer" size={20} color="#6B7280" />
              <View className="ml-2">
                <Text className="text-sm text-gray-500">
                  {t('safety.speed', 'Rýchlosť')}
                </Text>
                <Text className="font-semibold text-gray-900">
                  {Math.round(vehicleStatus.speed)} km/h
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons 
                name={vehicleStatus.isMoving ? 'car' : 'car-outline'} 
                size={20} 
                color={vehicleStatus.isMoving ? '#10B981' : '#6B7280'} 
              />
              <View className="ml-2">
                <Text className="text-sm text-gray-500">
                  {t('safety.status', 'Stav')}
                </Text>
                <Text className="font-semibold text-gray-900">
                  {vehicleStatus.isMoving 
                    ? t('safety.moving', 'V pohybe') 
                    : t('safety.stationary', 'Stojí')
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Emergency Button */}
      {isMonitoring && (
        <View className="mb-4">
          <Button
            onPress={triggerEmergency}
            className={`
              ${emergencyMode ? 'bg-red-600' : 'bg-red-500'} 
              flex-row items-center justify-center py-3
            `}
          >
            <Ionicons name="warning" size={24} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              {emergencyMode 
                ? t('safety.emergencyActive', 'NÚDZA AKTÍVNA') 
                : t('safety.emergency', 'NÚDZA')
              }
            </Text>
          </Button>
        </View>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <View className="space-y-2">
          <Text className="text-lg font-semibold text-gray-900">
            {t('safety.alerts', 'Upozornenia')}
          </Text>
          
          {alerts.map((alert) => (
            <View
              key={alert.id}
              className={`
                flex-row items-center justify-between p-3 rounded-lg
                ${getAlertColor(alert.severity)}
              `}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons 
                  name={getAlertIcon(alert.type) as any} 
                  size={20} 
                  color="currentColor" 
                />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold">
                    {alert.message}
                  </Text>
                  <Text className="text-xs opacity-75">
                    {alert.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
              </View>
              
              {alert.severity !== 'critical' && (
                <Button
                  onPress={() => dismissAlert(alert.id)}
                  variant="ghost"
                  className="p-1"
                >
                  <Ionicons name="close" size={16} color="currentColor" />
                </Button>
              )}
            </View>
          ))}
        </View>
      )}

      {/* No Alerts Message */}
      {isMonitoring && alerts.length === 0 && (
        <View className="bg-green-50 border border-green-200 rounded-lg p-4">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text className="text-green-800 font-semibold ml-2">
              {t('safety.allGood', 'Všetko v poriadku')}
            </Text>
          </View>
          <Text className="text-green-700 text-sm mt-1">
            {t('safety.noAlerts', 'Žiadne bezpečnostné upozornenia')}
          </Text>
        </View>
      )}
    </View>
  );
}
