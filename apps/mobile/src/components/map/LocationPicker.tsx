/**
 * LocationPicker Component
 * Location selection and delivery options
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AppleDesign from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  workingHours: string;
  features: string[];
}

interface LocationPickerProps {
  selectedLocationId?: string;
  onLocationSelect: (location: PickupLocation) => void;
  enableDelivery?: boolean;
  onDeliveryRequest?: (address: string, coordinates: Location.LocationObjectCoords) => void;
}

// Mock pickup locations (replace with API call)
const MOCK_LOCATIONS: PickupLocation[] = [
  {
    id: '1',
    name: 'BlackRent Bratislava - Centrum',
    address: 'Obchodná 2',
    city: 'Bratislava',
    coordinates: { latitude: 48.1486, longitude: 17.1077 },
    workingHours: 'Po-Pia: 8:00-20:00, So-Ne: 9:00-18:00',
    features: ['parking', 'wifi', 'coffee'],
  },
  {
    id: '2',
    name: 'BlackRent Bratislava - Letisko',
    address: 'M. R. Štefánika Airport',
    city: 'Bratislava',
    coordinates: { latitude: 48.1702, longitude: 17.2127 },
    workingHours: '24/7',
    features: ['parking', 'terminal'],
  },
  {
    id: '3',
    name: 'BlackRent Košice',
    address: 'Hlavná 48',
    city: 'Košice',
    coordinates: { latitude: 48.7164, longitude: 21.2611 },
    workingHours: 'Po-Pia: 8:00-18:00',
    features: ['parking', 'wifi'],
  },
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  selectedLocationId,
  onLocationSelect,
  enableDelivery = true,
  onDeliveryRequest,
}) => {
  const { t } = useTranslation(['booking', 'common']);
  const [locations] = useState<PickupLocation[]>(MOCK_LOCATIONS);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState(false);

  // Request location permission and get user's location
  const getUserLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('common:errors.general'),
          'Potrebujeme prístup k vašej polohe pre výpočet vzdialeností'
        );
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation(location.coords);
      console.log('[LocationPicker] User location:', location.coords);
    } catch (error) {
      console.error('[LocationPicker] Failed to get location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  }, [t]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Get distance to location from user
  const getDistanceToLocation = useCallback(
    (location: PickupLocation): string | null => {
      if (!userLocation) return null;

      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.coordinates.latitude,
        location.coordinates.longitude
      );

      if (distance < 1) {
        return `${Math.round(distance * 1000)} m`;
      }

      return `${distance.toFixed(1)} km`;
    },
    [userLocation, calculateDistance]
  );

  // Handle location selection
  const handleLocationSelect = useCallback(
    (location: PickupLocation) => {
      onLocationSelect(location);
    },
    [onLocationSelect]
  );

  // Handle delivery request
  const handleDeliveryRequest = useCallback(async () => {
    if (!userLocation) {
      Alert.alert(
        t('common:errors.general'),
        'Potrebujeme vašu polohu pre doručenie vozidla'
      );
      return;
    }

    try {
      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const formattedAddress = `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}, ${address.postalCode || ''}`.trim();
        
        if (onDeliveryRequest) {
          onDeliveryRequest(formattedAddress, userLocation);
        }
      }
    } catch (error) {
      console.error('[LocationPicker] Failed to geocode:', error);
      Alert.alert(t('common:errors.general'), 'Nepodarilo sa získať vašu adresu');
    }
  }, [userLocation, onDeliveryRequest, t]);

  const renderLocationCard = (location: PickupLocation) => {
    const isSelected = selectedLocationId === location.id;
    const distance = getDistanceToLocation(location);

    return (
      <TouchableOpacity
        key={location.id}
        style={[styles.locationCard, isSelected && styles.locationCardSelected]}
        onPress={() => handleLocationSelect(location)}
        activeOpacity={0.7}
      >
        <View style={styles.locationHeader}>
          <View style={styles.locationIcon}>
            <Ionicons
              name={isSelected ? 'location' : 'location-outline'}
              size={24}
              color={isSelected ? AppleDesign.Colors.systemBlue : AppleDesign.Colors.label}
            />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationAddress}>
              {location.address}, {location.city}
            </Text>
          </View>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={AppleDesign.Colors.systemBlue} />
            </View>
          )}
        </View>

        <View style={styles.locationDetails}>
          <View style={styles.locationMeta}>
            <Ionicons name="time-outline" size={16} color={AppleDesign.Colors.secondaryLabel} />
            <Text style={styles.locationMetaText}>{location.workingHours}</Text>
          </View>
          {distance && (
            <View style={styles.locationMeta}>
              <Ionicons name="navigate-outline" size={16} color={AppleDesign.Colors.secondaryLabel} />
              <Text style={styles.locationMetaText}>{distance}</Text>
            </View>
          )}
        </View>

        {location.features.length > 0 && (
          <View style={styles.locationFeatures}>
            {location.features.map((feature) => (
              <View key={feature} style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Miesto vyzdvihnutia</Text>

      {/* Toggle between pickup and delivery */}
      {enableDelivery && (
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, !deliveryMode && styles.modeButtonActive]}
            onPress={() => setDeliveryMode(false)}
          >
            <Ionicons
              name="business-outline"
              size={20}
              color={!deliveryMode ? '#FFFFFF' : AppleDesign.Colors.label}
            />
            <Text
              style={[
                styles.modeButtonText,
                !deliveryMode && styles.modeButtonTextActive,
              ]}
            >
              Pobočka
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, deliveryMode && styles.modeButtonActive]}
            onPress={() => setDeliveryMode(true)}
          >
            <Ionicons
              name="car-outline"
              size={20}
              color={deliveryMode ? '#FFFFFF' : AppleDesign.Colors.label}
            />
            <Text
              style={[
                styles.modeButtonText,
                deliveryMode && styles.modeButtonTextActive,
              ]}
            >
              Dovoz
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pickup locations list */}
      {!deliveryMode && (
        <ScrollView
          style={styles.locationsList}
          contentContainerStyle={styles.locationsListContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoadingLocation && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={AppleDesign.Colors.systemBlue} />
              <Text style={styles.loadingText}>Získavam vašu polohu...</Text>
            </View>
          )}

          {locations.map(renderLocationCard)}
        </ScrollView>
      )}

      {/* Delivery option */}
      {deliveryMode && (
        <View style={styles.deliveryContainer}>
          <View style={styles.deliveryInfo}>
            <Ionicons name="information-circle" size={24} color={AppleDesign.Colors.systemBlue} />
            <Text style={styles.deliveryInfoText}>
              Vozidlo vám dovezieme priamo na vašu adresu. Poplatok za dovoz sa vypočíta podľa
              vzdialenosti.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.deliveryButton}
            onPress={handleDeliveryRequest}
            disabled={!userLocation || isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="location" size={20} color="#FFFFFF" />
                <Text style={styles.deliveryButtonText}>Použiť moju polohu</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.lg,
  },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    borderRadius: AppleDesign.BorderRadius.button,
    padding: 4,
    marginBottom: AppleDesign.Spacing.lg,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.xs,
    paddingVertical: AppleDesign.Spacing.sm,
    borderRadius: AppleDesign.BorderRadius.button - 2,
  },
  modeButtonActive: {
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  modeButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },

  // Locations List
  locationsList: {
    flex: 1,
  },
  locationsListContent: {
    paddingBottom: AppleDesign.Spacing.xl,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
    paddingVertical: AppleDesign.Spacing.md,
  },
  loadingText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },

  // Location Card
  locationCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  locationCardSelected: {
    borderColor: AppleDesign.Colors.systemBlue,
    backgroundColor: AppleDesign.Colors.systemBlueLight || 'rgba(0, 122, 255, 0.1)',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: AppleDesign.Spacing.md,
  },
  locationIcon: {
    marginRight: AppleDesign.Spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.secondaryLabel,
  },
  selectedBadge: {
    marginLeft: AppleDesign.Spacing.sm,
  },
  locationDetails: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.lg,
    marginBottom: AppleDesign.Spacing.sm,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationMetaText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  locationFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppleDesign.Spacing.xs,
    marginTop: AppleDesign.Spacing.sm,
  },
  featureBadge: {
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: 4,
    borderRadius: AppleDesign.BorderRadius.small,
  },
  featureBadgeText: {
    ...AppleDesign.Typography.caption2,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '500',
  },

  // Delivery
  deliveryContainer: {
    flex: 1,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemBlueLight || 'rgba(0, 122, 255, 0.1)',
    padding: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.large,
    marginBottom: AppleDesign.Spacing.xl,
  },
  deliveryInfoText: {
    flex: 1,
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  deliveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.sm,
    backgroundColor: AppleDesign.Colors.systemBlue,
    paddingVertical: AppleDesign.Spacing.lg,
    borderRadius: AppleDesign.BorderRadius.button,
  },
  deliveryButtonText: {
    ...AppleDesign.Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

