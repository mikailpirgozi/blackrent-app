import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// Mock MapView for now - will be replaced with actual implementation
const MapView = ({ children, ...props }: any) => (
  <View className="bg-gray-200 items-center justify-center">
    <Text className="text-gray-500">Mapa bude dostupná po inštalácii react-native-maps</Text>
    {children}
  </View>
);
const Marker = ({ children, ...props }: any) => <View>{children}</View>;
const Polyline = (props: any) => null;
const PROVIDER_GOOGLE = 'google';
import { Button } from './button';
// Simple mock translation for emergency components
const useTranslation = () => ({
  t: (key: string, fallback?: string) => fallback || key.split('.').pop() || key
});
import { realTimeService, LiveTracking } from '@/services/real-time-service';
// Temporarily disabled Reanimated - using simple View instead
const Animated = { View };

interface LiveTrackingProps {
  bookingId: string;
  vehicleId: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dropoffLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onStatusUpdate?: (status: LiveTracking['status']) => void;
  className?: string;
}

interface TrackingData extends LiveTracking {
  route?: {
    latitude: number;
    longitude: number;
  }[];
  estimatedDistance?: number; // in meters
  estimatedDuration?: number; // in minutes
}

export function LiveTrackingComponent({
  bookingId,
  vehicleId,
  pickupLocation,
  dropoffLocation,
  onStatusUpdate,
  className = ''
}: LiveTrackingProps) {
  const { t } = useTranslation();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: pickupLocation.latitude,
    longitude: pickupLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    // Subscribe to location updates
    const handleLocationUpdate = (tracking: LiveTracking) => {
      if (tracking.bookingId === bookingId) {
        setTrackingData(prev => ({
          ...tracking,
          route: prev?.route ? [...prev.route, tracking.location] : [tracking.location],
          estimatedDistance: prev?.estimatedDistance,
          estimatedDuration: prev?.estimatedDuration,
        }));
        
        onStatusUpdate?.(tracking.status);
        
        // Update map region to follow vehicle
        setMapRegion({
          latitude: tracking.location.latitude,
          longitude: tracking.location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    };

    realTimeService.on('location_update', handleLocationUpdate);
    
    // Subscribe to tracking channel
    realTimeService.subscribe([`tracking_${bookingId}`]);
    
    // Get user's current location
    getCurrentLocation();
    
    // Start tracking
    startTracking();

    return () => {
      realTimeService.off('location_update', handleLocationUpdate);
      realTimeService.unsubscribe([`tracking_${bookingId}`]);
      stopTracking();
    };
  }, [bookingId]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('location.permissionDenied', 'Povolenie zamietnuté'),
          t('tracking.locationRequired', 'Potrebujeme prístup k lokácii pre sledovanie.')
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    } catch (error) {
          }
  };

  const startTracking = () => {
    setIsTracking(true);
    
    // Mock initial tracking data
    const initialTracking: TrackingData = {
      bookingId,
      vehicleId,
      status: 'pickup_pending',
      location: {
        latitude: pickupLocation.latitude + (Math.random() - 0.5) * 0.01,
        longitude: pickupLocation.longitude + (Math.random() - 0.5) * 0.01,
        address: 'Na ceste k vám...',
        speed: 0,
        heading: 0,
      },
      estimatedArrival: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      lastUpdated: new Date(),
      route: [],
      estimatedDistance: 2500, // 2.5 km
      estimatedDuration: 15, // 15 minutes
    };
    
    setTrackingData(initialTracking);
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  const getStatusInfo = (status: LiveTracking['status']) => {
    switch (status) {
      case 'pickup_pending':
        return {
          title: t('tracking.pickupPending', 'Čaká sa na vyzdvihnutie'),
          description: t('tracking.pickupPendingDesc', 'Vodič sa pripravuje na cestu'),
          icon: 'time-outline',
          color: 'text-yellow-600 bg-yellow-100',
        };
      case 'in_transit_pickup':
        return {
          title: t('tracking.inTransitPickup', 'Na ceste k vám'),
          description: t('tracking.inTransitPickupDesc', 'Vodič sa blíži k mistu vyzdvihnutia'),
          icon: 'car',
          color: 'text-blue-600 bg-blue-100',
        };
      case 'arrived_pickup':
        return {
          title: t('tracking.arrivedPickup', 'Prišiel na miesto'),
          description: t('tracking.arrivedPickupDesc', 'Vodič čaká na mieste vyzdvihnutia'),
          icon: 'location',
          color: 'text-green-600 bg-green-100',
        };
      case 'in_progress':
        return {
          title: t('tracking.inProgress', 'Prenájom prebieha'),
          description: t('tracking.inProgressDesc', 'Užívajte si jazdu!'),
          icon: 'checkmark-circle',
          color: 'text-green-600 bg-green-100',
        };
      case 'in_transit_return':
        return {
          title: t('tracking.inTransitReturn', 'Návrat vozidla'),
          description: t('tracking.inTransitReturnDesc', 'Na ceste k miestu vrátenia'),
          icon: 'return-up-back',
          color: 'text-orange-600 bg-orange-100',
        };
      case 'arrived_return':
        return {
          title: t('tracking.arrivedReturn', 'Na mieste vrátenia'),
          description: t('tracking.arrivedReturnDesc', 'Vozidlo je pripravené na vrátenie'),
          icon: 'flag',
          color: 'text-purple-600 bg-purple-100',
        };
      case 'completed':
        return {
          title: t('tracking.completed', 'Dokončené'),
          description: t('tracking.completedDesc', 'Prenájom bol úspešne dokončený'),
          icon: 'checkmark-done-circle',
          color: 'text-green-600 bg-green-100',
        };
      default:
        return {
          title: t('tracking.unknown', 'Neznámy stav'),
          description: '',
          icon: 'help-circle',
          color: 'text-gray-600 bg-gray-100',
        };
    }
  };

  const formatETA = (eta?: Date) => {
    if (!eta) return '';
    
    const now = new Date();
    const diff = eta.getTime() - now.getTime();
    
    if (diff <= 0) return t('tracking.arrived', 'Prišiel');
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) {
      return t('tracking.minutesETA', `${minutes} min`);
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return t('tracking.hoursETA', `${hours}h ${remainingMinutes}min`);
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    } else {
      return `${(distance / 1000).toFixed(1)} km`;
    }
  };

  const statusInfo = trackingData ? getStatusInfo(trackingData.status) : null;

  if (!trackingData) {
    return (
      <View className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}>
        <View className="items-center py-8">
          <Ionicons name="location-outline" size={48} color="#D1D5DB" />
          <Text className="text-gray-500 mt-2">
            {t('tracking.loading', 'Načítava sa sledovanie...')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Status Header */}
      {statusInfo && (
        <View className={`p-4 ${statusInfo.color}`}>
          <View className="flex-row items-center">
            <Ionicons name={statusInfo.icon as any} size={24} color="currentColor" />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-lg">
                {statusInfo.title}
              </Text>
              <Text className="opacity-75">
                {statusInfo.description}
              </Text>
            </View>
            {trackingData.estimatedArrival && (
              <View className="items-end">
                <Text className="font-bold text-lg">
                  {formatETA(trackingData.estimatedArrival)}
                </Text>
                <Text className="text-xs opacity-75">
                  {t('tracking.eta', 'ETA')}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Map */}
      <View className="h-64">
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsTraffic={true}
        >
          {/* Pickup Location */}
          <Marker
            coordinate={pickupLocation}
            title={t('tracking.pickup', 'Vyzdvihnutie')}
            description={pickupLocation.address}
            pinColor="green"
          />
          
          {/* Dropoff Location */}
          {dropoffLocation && (
            <Marker
              coordinate={dropoffLocation}
              title={t('tracking.dropoff', 'Vrátenie')}
              description={dropoffLocation.address}
              pinColor="red"
            />
          )}
          
          {/* Vehicle Location */}
          <Marker
            coordinate={trackingData.location}
            title={t('tracking.vehicle', 'Vozidlo')}
            description={trackingData.location.address}
          >
            <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
              <Ionicons name="car" size={16} color="white" />
            </View>
          </Marker>
          
          {/* Route */}
          {trackingData.route && trackingData.route.length > 1 && (
            <Polyline
              coordinates={trackingData.route}
              strokeColor="#3B82F6"
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>
      </View>

      {/* Details */}
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-500">
              {t('tracking.currentLocation', 'Aktuálna poloha')}
            </Text>
            <Text className="font-semibold text-gray-900">
              {trackingData.location.address}
            </Text>
          </View>
          
          {trackingData.location.speed !== undefined && (
            <View className="items-end">
              <Text className="text-sm text-gray-500">
                {t('tracking.speed', 'Rýchlosť')}
              </Text>
              <Text className="font-semibold text-gray-900">
                {Math.round(trackingData.location.speed || 0)} km/h
              </Text>
            </View>
          )}
        </View>

        {/* Trip Info */}
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-sm text-gray-500">
              {t('tracking.distance', 'Vzdialenosť')}
            </Text>
            <Text className="font-semibold text-gray-900">
              {formatDistance(trackingData.estimatedDistance)}
            </Text>
          </View>
          
          <View className="flex-1 items-center">
            <Text className="text-sm text-gray-500">
              {t('tracking.duration', 'Trvanie')}
            </Text>
            <Text className="font-semibold text-gray-900">
              {trackingData.estimatedDuration} min
            </Text>
          </View>
          
          <View className="flex-1 items-end">
            <Text className="text-sm text-gray-500">
              {t('tracking.lastUpdate', 'Aktualizované')}
            </Text>
            <Text className="font-semibold text-gray-900">
              {trackingData.lastUpdated.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 mt-4">
          <Button
            onPress={() => {
              // Center map on vehicle
              setMapRegion({
                latitude: trackingData.location.latitude,
                longitude: trackingData.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }}
            variant="outline"
            className="flex-1 flex-row items-center justify-center"
          >
            <Ionicons name="locate" size={16} color="#6B7280" />
            <Text className="text-gray-700 ml-2">
              {t('tracking.centerMap', 'Centrovať')}
            </Text>
          </Button>
          
          <Button
            onPress={() => {
              // Call driver (mock)
              Alert.alert(
                t('tracking.callDriver', 'Volať vodičovi'),
                t('tracking.callDriverMessage', 'Chcete zavolať vodičovi?'),
                [
                  { text: t('common.cancel', 'Zrušiť'), style: 'cancel' },
                  { text: t('common.call', 'Volať'), onPress: () => {} }
                ]
              );
            }}
            className="flex-1 flex-row items-center justify-center"
          >
            <Ionicons name="call" size={16} color="white" />
            <Text className="text-white ml-2">
              {t('common.call', 'Volať')}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
