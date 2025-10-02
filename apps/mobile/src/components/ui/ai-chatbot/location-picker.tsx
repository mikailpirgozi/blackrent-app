/**
 * 🤖 Location Picker Component
 * Location sharing for chatbot
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '../../../styles/theme';

interface LocationPickerProps {
  onLocationSelected: (location: {
    id: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    address?: string;
    name: string;
  }) => void;
}

export function LocationPicker({ onLocationSelected }: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get current location
   */
  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Povolenie potrebné',
          'Pre zdieľanie lokácie potrebujeme prístup k vašej polohe.'
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      let address = 'Neznáma adresa';
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}, ${addr.country || ''}`.trim();
        }
      } catch (geocodeError) {
              }

      const locationData = {
        id: `loc_${Date.now()}`,
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        address,
        name: 'Moja aktuálna poloha'
      };

      onLocationSelected(locationData);

    } catch (error) {
            Alert.alert('Chyba', 'Nepodarilo sa získať vašu polohu.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Select location from map (placeholder)
   */
  const selectFromMap = () => {
    Alert.alert(
      'Výber z mapy',
      'Táto funkcia bude dostupná v budúcej verzii.',
      [{ text: 'OK' }]
    );
  };

  /**
   * Show location options
   */
  const showLocationOptions = () => {
    Alert.alert(
      'Zdieľať lokáciu',
      'Vyberte spôsob zdieľania lokácie',
      [
        { text: 'Zrušiť', style: 'cancel' },
        { text: '📍 Aktuálna poloha', onPress: getCurrentLocation },
        { text: '🗺️ Vybrať z mapy', onPress: selectFromMap },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={showLocationOptions}
      disabled={isLoading}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.secondarySystemFill,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginVertical: 8,
        opacity: isLoading ? 0.6 : 1,
      }}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isLoading ? 'hourglass' : 'location'}
        size={20}
        color={theme.brand.primary}
      />
      <Text
        style={{
          marginLeft: 8,
          fontSize: 16,
          color: theme.brand.primary,
          fontWeight: '500',
        }}
      >
        {isLoading ? 'Získavam polohu...' : 'Zdieľať lokáciu'}
      </Text>
    </TouchableOpacity>
  );
}
