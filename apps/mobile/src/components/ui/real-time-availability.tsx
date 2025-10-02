import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './button';
import { SmartImage } from './smart-image/smart-image';
// Simple mock translation for emergency components
const useTranslation = () => ({
  t: (key: string, fallback?: string) => fallback || key.split('.').pop() || key
});
import { realTimeService, VehicleAvailability } from '@/services/real-time-service';
// Temporarily disabled Reanimated - using simple View instead
const Animated = { View };
const _Layout = { springify: () => ({}) };

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  image: string;
  pricePerDay: number;
  rating: number;
  reviewCount: number;
  features: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  company: {
    id: string;
    name: string;
    rating: number;
  };
}

interface RealTimeAvailabilityProps {
  searchLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  searchDates?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    priceRange?: [number, number];
    vehicleTypes?: string[];
    features?: string[];
    minRating?: number;
  };
  onVehicleSelect?: (vehicle: Vehicle) => void;
  className?: string;
}

export function RealTimeAvailability({
  searchLocation,
  searchDates,
  filters,
  onVehicleSelect,
  className = ''
}: RealTimeAvailabilityProps) {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availability, setAvailability] = useState<Map<string, VehicleAvailability>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Subscribe to vehicle availability updates
    const handleAvailabilityUpdate = (update: VehicleAvailability) => {
      setAvailability(prev => {
        const newMap = new Map(prev);
        newMap.set(update.vehicleId, update);
        return newMap;
      });
      setLastUpdated(new Date());
    };

    realTimeService.on('vehicle_availability', handleAvailabilityUpdate);
    
    // Subscribe to availability updates
    realTimeService.subscribe(['vehicle_availability']);
    
    // Load initial data
    loadVehicles();

    return () => {
      realTimeService.off('vehicle_availability', handleAvailabilityUpdate);
    };
  }, [searchLocation, searchDates, filters]);

  const loadVehicles = async () => {
    setIsLoading(true);
    
    try {
      // Mock vehicle data - in production, fetch from API
      const mockVehicles: Vehicle[] = [
        {
          id: 'vehicle_1',
          name: 'BMW X5 xDrive40i',
          brand: 'BMW',
          model: 'X5',
          year: 2023,
          image: '/assets/images/vehicles/bmw-x5.webp',
          pricePerDay: 89,
          rating: 4.8,
          reviewCount: 124,
          features: ['GPS', 'Klimatizácia', 'Bluetooth', 'Kamera'],
          location: {
            latitude: 48.1486,
            longitude: 17.1077,
            address: 'Bratislava Centrum'
          },
          company: {
            id: 'company_1',
            name: 'Premium Cars SK',
            rating: 4.9
          }
        },
        {
          id: 'vehicle_2',
          name: 'Audi Q7 quattro',
          brand: 'Audi',
          model: 'Q7',
          year: 2022,
          image: '/assets/images/vehicles/audi-q7.webp',
          pricePerDay: 95,
          rating: 4.7,
          reviewCount: 89,
          features: ['GPS', 'Klimatizácia', 'Bluetooth', 'Kožené sedadlá'],
          location: {
            latitude: 48.1520,
            longitude: 17.1100,
            address: 'Bratislava Staré Mesto'
          },
          company: {
            id: 'company_2',
            name: 'Luxury Rent',
            rating: 4.8
          }
        },
        {
          id: 'vehicle_3',
          name: 'Mercedes GLE 350d',
          brand: 'Mercedes-Benz',
          model: 'GLE',
          year: 2023,
          image: '/assets/images/vehicles/mercedes-gle.webp',
          pricePerDay: 105,
          rating: 4.9,
          reviewCount: 156,
          features: ['GPS', 'Klimatizácia', 'Bluetooth', 'Panoráma', 'Masáž'],
          location: {
            latitude: 48.1450,
            longitude: 17.1050,
            address: 'Bratislava Nové Mesto'
          },
          company: {
            id: 'company_3',
            name: 'Elite Motors',
            rating: 4.9
          }
        }
      ];

      // Apply filters
      let filteredVehicles = mockVehicles;
      
      if (filters?.priceRange) {
        filteredVehicles = filteredVehicles.filter(v => 
          v.pricePerDay >= filters.priceRange![0] && 
          v.pricePerDay <= filters.priceRange![1]
        );
      }
      
      if (filters?.minRating) {
        filteredVehicles = filteredVehicles.filter(v => v.rating >= filters.minRating!);
      }

      setVehicles(filteredVehicles);
      
      // Mock initial availability
      const mockAvailability = new Map<string, VehicleAvailability>();
      filteredVehicles.forEach(vehicle => {
        mockAvailability.set(vehicle.id, {
          vehicleId: vehicle.id,
          isAvailable: Math.random() > 0.2, // 80% chance of being available
          availableFrom: new Date(),
          availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          location: vehicle.location,
          lastUpdated: new Date()
        });
      });
      
      setAvailability(mockAvailability);
      
    } catch (error) {
          } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadVehicles();
    setIsRefreshing(false);
  };

  const calculateDistance = (vehicleLocation: { latitude: number; longitude: number }) => {
    if (!searchLocation) return null;
    
    // Simple distance calculation (not accurate for production)
    const lat1 = searchLocation.latitude;
    const lon1 = searchLocation.longitude;
    const lat2 = vehicleLocation.latitude;
    const lon2 = vehicleLocation.longitude;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  };

  const formatDistance = (distance: number | null) => {
    if (!distance) return '';
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  };

  const getAvailabilityStatus = (vehicleId: string) => {
    const avail = availability.get(vehicleId);
    if (!avail) {
      return {
        status: 'unknown',
        text: t('availability.checking', 'Kontroluje sa...'),
        color: 'text-gray-500 bg-gray-100'
      };
    }
    
    if (avail.isAvailable) {
      return {
        status: 'available',
        text: t('availability.available', 'Dostupné'),
        color: 'text-green-700 bg-green-100'
      };
    } else {
      return {
        status: 'unavailable',
        text: t('availability.unavailable', 'Nedostupné'),
        color: 'text-red-700 bg-red-100'
      };
    }
  };

  const renderVehicleCard = (vehicle: Vehicle, index: number) => {
    const availabilityStatus = getAvailabilityStatus(vehicle.id);
    const distance = calculateDistance(vehicle.location);
    
    return (
      <View
        key={vehicle.id}
        className="bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden"
      >
        {/* Vehicle Image */}
        <View className="relative">
          <SmartImage
            images={[vehicle.image]}
            style={{ width: '100%', height: 192 }}
          />
          
          {/* Availability Badge */}
          <View className={`absolute top-3 right-3 px-2 py-1 rounded-full ${availabilityStatus.color}`}>
            <Text className="text-xs font-semibold">
              {availabilityStatus.text}
            </Text>
          </View>
          
          {/* Live Update Indicator */}
          <View className="absolute top-3 left-3 flex-row items-center bg-black/70 px-2 py-1 rounded-full">
            <View className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse" />
            <Text className="text-white text-xs">
              {t('availability.live', 'LIVE')}
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {vehicle.name}
              </Text>
              <Text className="text-sm text-gray-500">
                {vehicle.company.name}
              </Text>
            </View>
            
            <View className="items-end">
              <Text className="text-xl font-bold text-blue-600">
                €{vehicle.pricePerDay}
              </Text>
              <Text className="text-sm text-gray-500">
                {t('common.perDay', 'za deň')}
              </Text>
            </View>
          </View>

          {/* Rating and Reviews */}
          <View className="flex-row items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text className="text-sm font-semibold text-gray-900 ml-1">
                {vehicle.rating}
              </Text>
              <Text className="text-sm text-gray-500 ml-1">
                ({vehicle.reviewCount} {t('common.reviews', 'recenzií')})
              </Text>
            </View>
            
            {distance && (
              <View className="flex-row items-center ml-auto">
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text className="text-sm text-gray-500 ml-1">
                  {formatDistance(distance)}
                </Text>
              </View>
            )}
          </View>

          {/* Features */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            {vehicle.features.slice(0, 4).map((feature, idx) => (
              <View key={idx} className="bg-gray-100 px-2 py-1 rounded">
                <Text className="text-xs text-gray-700">
                  {feature}
                </Text>
              </View>
            ))}
            {vehicle.features.length > 4 && (
              <View className="bg-gray-100 px-2 py-1 rounded">
                <Text className="text-xs text-gray-700">
                  +{vehicle.features.length - 4}
                </Text>
              </View>
            )}
          </View>

          {/* Location and Last Updated */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-sm text-gray-500">
                {vehicle.location.address}
              </Text>
            </View>
            
            <Text className="text-xs text-gray-400">
              {t('availability.updated', 'Aktualizované')}: {
                availability.get(vehicle.id)?.lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
            </Text>
          </View>

          {/* Action Button */}
          <Button
            onPress={() => onVehicleSelect?.(vehicle)}
            disabled={!availability.get(vehicle.id)?.isAvailable}
            className={`
              ${availability.get(vehicle.id)?.isAvailable 
                ? 'bg-blue-500' 
                : 'bg-gray-300'
              }
            `}
          >
            <Text className="text-white font-semibold">
              {availability.get(vehicle.id)?.isAvailable
                ? t('common.selectVehicle', 'Vybrať vozidlo')
                : t('availability.notAvailable', 'Nedostupné')
              }
            </Text>
          </Button>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}>
        <View className="items-center py-8">
          <Ionicons name="car-outline" size={48} color="#D1D5DB" />
          <Text className="text-gray-500 mt-2">
            {t('availability.loading', 'Načítava sa dostupnosť...')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`${className}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {t('availability.realTime', 'Real-time dostupnosť')}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            <Text className="text-sm text-gray-500">
              {t('availability.lastUpdate', 'Posledná aktualizácia')}: {
                lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
            </Text>
          </View>
        </View>
        
        <Button
          onPress={handleRefresh}
          variant="outline"
          className="px-3 py-2"
        >
          <Ionicons name="refresh" size={16} color="#6B7280" />
        </Button>
      </View>

      {/* Vehicle List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        {vehicles.length > 0 ? (
          vehicles.map((vehicle, index) => renderVehicleCard(vehicle, index))
        ) : (
          <View className="bg-white rounded-lg p-8 border border-gray-200 items-center">
            <Ionicons name="car-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-500 mt-2 text-center">
              {t('availability.noVehicles', 'Žiadne vozidlá nevyhovujú vašim kritériám')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
