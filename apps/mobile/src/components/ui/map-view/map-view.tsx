/**
 * 🗺️ MapView Component
 * Interactive map for visual vehicle search and location selection
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

import AppleDesign from '../../../styles/apple-design-system';
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { OptimizedFadeIn } from '../optimized-animations';

export interface MapLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  vehicleCount: number;
  priceRange: {
    min: number;
    max: number;
  };
}

interface MapViewProps {
  locations?: MapLocation[];
  onLocationSelect?: (location: MapLocation) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  showVehicleCounts?: boolean;
  style?: any;
}

// Mock locations (in real app, these would come from backend)
const mockLocations: MapLocation[] = [
  {
    id: '1',
    name: 'Bratislava Centrum',
    address: 'Hlavné námestie 1, Bratislava',
    latitude: 48.1486,
    longitude: 17.1077,
    vehicleCount: 24,
    priceRange: { min: 25, max: 150 },
  },
  {
    id: '2',
    name: 'Bratislava Letisko',
    address: 'M. R. Štefánika Airport',
    latitude: 48.1702,
    longitude: 17.2127,
    vehicleCount: 18,
    priceRange: { min: 30, max: 120 },
  },
  {
    id: '3',
    name: 'Nitra',
    address: 'Štefánikova trieda 1, Nitra',
    latitude: 48.3069,
    longitude: 18.0873,
    vehicleCount: 12,
    priceRange: { min: 20, max: 80 },
  },
];

export const MapView: React.FC<MapViewProps> = ({
  locations = mockLocations,
  onLocationSelect,
  onMapPress,
  showVehicleCounts = true,
  style,
}) => {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  const handleLocationPress = (location: MapLocation) => {
    haptic.light();
    setSelectedLocation(location);
    onLocationSelect?.(location);
  };

  const handleMapTypeToggle = () => {
    haptic.light();
    setMapType(prev => prev === 'standard' ? 'satellite' : 'standard');
  };

  const handleMyLocationPress = () => {
    haptic.medium();
    // In real app, this would center map on user's location
  };

  return (
    <View style={[styles.container, style]}>
      {/* Map Container - Placeholder for now */}
      <View style={styles.mapContainer}>
        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Ionicons
            name="map-outline"
            size={48}
            color={AppleDesign.Colors.tertiaryLabel}
          />
          <Text style={styles.mapPlaceholderText}>
            {t('map.placeholder', 'Mapa sa načítava...')}
          </Text>
          <Text style={styles.mapNote}>
            {t('map.note', 'Google Maps integrácia bude pridaná v ďalšej verzii')}
          </Text>
        </View>

        {/* Location Markers Overlay */}
        <View style={styles.markersContainer}>
          {locations.map((location, index) => (
            <OptimizedFadeIn key={location.id} delay={index * 100}>
              <TouchableOpacity
                style={[
                  styles.locationMarker,
                  selectedLocation?.id === location.id && styles.locationMarkerSelected,
                  {
                    // Position markers based on mock coordinates
                    top: `${20 + index * 25}%`,
                    left: `${30 + index * 20}%`,
                  },
                ]}
                onPress={() => handleLocationPress(location)}
                activeOpacity={0.8}
              >
                <View style={styles.markerContent}>
                  <Ionicons
                    name="location"
                    size={20}
                    color="white"
                  />
                  {showVehicleCounts && (
                    <Text style={styles.markerCount}>
                      {location.vehicleCount}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </OptimizedFadeIn>
          ))}
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleMapTypeToggle}
            activeOpacity={0.8}
          >
            <Ionicons
              name={mapType === 'standard' ? 'layers-outline' : 'map-outline'}
              size={20}
              color={AppleDesign.Colors.systemBlue}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleMyLocationPress}
            activeOpacity={0.8}
          >
            <Ionicons
              name="locate-outline"
              size={20}
              color={AppleDesign.Colors.systemBlue}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Location Info */}
      {selectedLocation && (
        <OptimizedFadeIn delay={0}>
          <View style={styles.locationInfo}>
            <View style={styles.locationHeader}>
              <View style={styles.locationIcon}>
                <Ionicons
                  name="location"
                  size={20}
                  color={AppleDesign.Colors.systemBlue}
                />
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>
                  {selectedLocation.name}
                </Text>
                <Text style={styles.locationAddress}>
                  {selectedLocation.address}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedLocation(null)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={AppleDesign.Colors.tertiaryLabel}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.locationStats}>
              <View style={styles.statItem}>
                <Ionicons
                  name="car-outline"
                  size={16}
                  color={AppleDesign.Colors.systemGreen}
                />
                <Text style={styles.statText}>
                  {selectedLocation.vehicleCount} vozidiel
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons
                  name="cash-outline"
                  size={16}
                  color={AppleDesign.Colors.systemOrange}
                />
                <Text style={styles.statText}>
                  €{selectedLocation.priceRange.min}-{selectedLocation.priceRange.max}/deň
                </Text>
              </View>
            </View>
          </View>
        </OptimizedFadeIn>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    margin: AppleDesign.Spacing.screenPadding,
    overflow: 'hidden',
    ...AppleDesign.Shadows.card,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppleDesign.Spacing.xl,
  },
  mapPlaceholderText: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: AppleDesign.Spacing.md,
    textAlign: 'center',
  },
  mapNote: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.tertiaryLabel,
    marginTop: AppleDesign.Spacing.sm,
    textAlign: 'center',
  },
  markersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  locationMarker: {
    position: 'absolute',
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderRadius: 20,
    padding: AppleDesign.Spacing.sm,
    ...AppleDesign.Shadows.button,
  },
  locationMarkerSelected: {
    backgroundColor: AppleDesign.Colors.systemOrange,
    transform: [{ scale: 1.2 }],
  },
  markerContent: {
    alignItems: 'center',
    minWidth: 24,
  },
  markerCount: {
    ...AppleDesign.Typography.caption2,
    color: 'white',
    fontWeight: '600',
    marginTop: 2,
  },
  mapControls: {
    position: 'absolute',
    top: AppleDesign.Spacing.lg,
    right: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.sm,
  },
  controlButton: {
    backgroundColor: AppleDesign.Colors.secondarySystemGroupedBackground,
    borderRadius: AppleDesign.BorderRadius.medium,
    padding: AppleDesign.Spacing.md,
    ...AppleDesign.Shadows.button,
  },
  locationInfo: {
    backgroundColor: AppleDesign.Colors.secondarySystemGroupedBackground,
    margin: AppleDesign.Spacing.screenPadding,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    ...AppleDesign.Shadows.card,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppleDesign.Colors.systemBlue + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    marginBottom: 2,
  },
  locationAddress: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  closeButton: {
    padding: AppleDesign.Spacing.xs,
  },
  locationStats: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.xs,
  },
  statText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '500',
  },
});
