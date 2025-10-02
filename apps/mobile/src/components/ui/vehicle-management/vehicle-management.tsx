/**
 * 🚗 Vehicle Management System
 * Kompletná správa vozidiel pre autopožičovne
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Apple Design System
import AppleDesign from '../../../styles/apple-design-system';
import { OptimizedFadeIn, OptimizedSlideIn } from '../optimized-animations';
import { AppleCard } from '../apple-card/apple-card';
import { AppleButton } from '../apple-button/apple-button';

// Hooks
import { useTranslation } from '../../../hooks/use-translation';
import { useHapticFeedback } from '../../../utils/haptic-feedback';
import { logger } from '../../../utils/logger';

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  category: 'economy' | 'premium' | 'luxury' | 'suv' | 'sports';
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic';
  seats: number;
  doors: number;
  pricePerDay: number;
  pricingTiers: {
    '1day': number;
    '2-3days': number;
    '4-7days': number;
    '8-14days': number;
    '15-23days': number;
    '24-30days': number;
    '31+days': number;
  };
  deposit: number;
  allowedKm: number;
  kmOverageFee: number;
  location: {
    name: string;
    coordinates: { latitude: number; longitude: number };
  };
  deliverySettings: {
    freeDeliveryRadius: number;
    deliveryFeePerKm: number;
    maxDeliveryRadius: number;
  };
  features: string[];
  images: string[];
  isActive: boolean;
  availability: {
    [date: string]: boolean;
  };
  bookings: number;
  revenue: number;
  utilization: number;
  rating: number;
  reviews: number;
}

interface VehicleManagementProps {
  onVehicleSelect?: (vehicle: Vehicle) => void;
  onVehicleAdd?: () => void;
  onVehicleEdit?: (vehicle: Vehicle) => void;
  onVehicleDelete?: (vehicleId: string) => void;
}

export function VehicleManagement({
  onVehicleSelect,
  onVehicleAdd,
  onVehicleEdit,
  onVehicleDelete,
}: VehicleManagementProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'utilization' | 'rating'>('revenue');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock data - v reálnej aplikácii by sa načítalo z API
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setIsLoading(true);
    
    try {
      // Simulácia načítania dát z API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockVehicles: Vehicle[] = [
        {
          id: '1',
          name: 'BMW 3 Series',
          brand: 'BMW',
          model: '3 Series',
          year: 2023,
          category: 'premium',
          fuelType: 'petrol',
          transmission: 'automatic',
          seats: 5,
          doors: 4,
          pricePerDay: 89,
          pricingTiers: {
            '1day': 89,
            '2-3days': 85,
            '4-7days': 79,
            '8-14days': 75,
            '15-23days': 69,
            '24-30days': 65,
            '31+days': 59,
          },
          deposit: 500,
          allowedKm: 200,
          kmOverageFee: 0.25,
          location: {
            name: 'Bratislava - Hlavná stanica',
            coordinates: { latitude: 48.1486, longitude: 17.1077 },
          },
          deliverySettings: {
            freeDeliveryRadius: 10,
            deliveryFeePerKm: 1.5,
            maxDeliveryRadius: 50,
          },
          features: ['Klimatizácia', 'GPS', 'Bluetooth', 'Parkovacie senzory'],
          images: [],
          isActive: true,
          availability: {},
          bookings: 23,
          revenue: 4580,
          utilization: 89,
          rating: 4.8,
          reviews: 15,
        },
        {
          id: '2',
          name: 'Audi A4',
          brand: 'Audi',
          model: 'A4',
          year: 2022,
          category: 'premium',
          fuelType: 'diesel',
          transmission: 'automatic',
          seats: 5,
          doors: 4,
          pricePerDay: 85,
          pricingTiers: {
            '1day': 85,
            '2-3days': 81,
            '4-7days': 75,
            '8-14days': 71,
            '15-23days': 65,
            '24-30days': 61,
            '31+days': 55,
          },
          deposit: 500,
          allowedKm: 200,
          kmOverageFee: 0.25,
          location: {
            name: 'Bratislava - Letisko',
            coordinates: { latitude: 48.1702, longitude: 17.2127 },
          },
          deliverySettings: {
            freeDeliveryRadius: 15,
            deliveryFeePerKm: 1.2,
            maxDeliveryRadius: 60,
          },
          features: ['Klimatizácia', 'GPS', 'Bluetooth', 'Kožené sedadlá'],
          images: [],
          isActive: true,
          availability: {},
          bookings: 19,
          revenue: 3820,
          utilization: 76,
          rating: 4.6,
          reviews: 12,
        },
        {
          id: '3',
          name: 'Mercedes C-Class',
          brand: 'Mercedes',
          model: 'C-Class',
          year: 2023,
          category: 'luxury',
          fuelType: 'hybrid',
          transmission: 'automatic',
          seats: 5,
          doors: 4,
          pricePerDay: 95,
          pricingTiers: {
            '1day': 95,
            '2-3days': 91,
            '4-7days': 85,
            '8-14days': 81,
            '15-23days': 75,
            '24-30days': 71,
            '31+days': 65,
          },
          deposit: 600,
          allowedKm: 200,
          kmOverageFee: 0.30,
          location: {
            name: 'Bratislava - Centrum',
            coordinates: { latitude: 48.1486, longitude: 17.1077 },
          },
          deliverySettings: {
            freeDeliveryRadius: 20,
            deliveryFeePerKm: 1.0,
            maxDeliveryRadius: 80,
          },
          features: ['Klimatizácia', 'GPS', 'Bluetooth', 'Masážne sedadlá', 'Panoramatická strecha'],
          images: [],
          isActive: false,
          availability: {},
          bookings: 15,
          revenue: 3600,
          utilization: 68,
          rating: 4.9,
          reviews: 8,
        },
      ];
      
      setVehicles(mockVehicles);
      logger.info('Vehicles loaded successfully');
      
    } catch (error) {
      logger.error('Failed to load vehicles:', error);
      Alert.alert('Chyba', 'Nepodarilo sa načítať vozidlá');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVehicles = vehicles
    .filter(vehicle => {
      const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || vehicle.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'revenue':
          return b.revenue - a.revenue;
        case 'utilization':
          return b.utilization - a.utilization;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const categories = [
    { id: 'all', name: 'Všetky', icon: 'car' },
    { id: 'economy', name: 'Economy', icon: 'car-outline' },
    { id: 'premium', name: 'Premium', icon: 'car-sport' },
    { id: 'luxury', name: 'Luxury', icon: 'diamond' },
    { id: 'suv', name: 'SUV', icon: 'car' },
    { id: 'sports', name: 'Sports', icon: 'flash' },
  ];

  const handleVehiclePress = (vehicle: Vehicle) => {
    haptic.light();
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
    onVehicleSelect?.(vehicle);
  };

  const handleAddVehicle = () => {
    haptic.medium();
    setShowAddModal(true);
    onVehicleAdd?.();
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    haptic.medium();
    setShowDetailsModal(false);
    onVehicleEdit?.(vehicle);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    haptic.warning();
    
    Alert.alert(
      'Odstrániť vozidlo',
      'Ste si istí, že chcete odstrániť toto vozidlo? Táto akcia sa nedá vrátiť.',
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Odstrániť',
          style: 'destructive',
          onPress: () => {
            setVehicles(prev => prev.filter(v => v.id !== vehicleId));
            setShowDetailsModal(false);
            onVehicleDelete?.(vehicleId);
            logger.info(`Vehicle ${vehicleId} deleted`);
          },
        },
      ]
    );
  };

  const handleToggleActive = (vehicleId: string, isActive: boolean) => {
    haptic.light();
    
    setVehicles(prev =>
      prev.map(vehicle =>
        vehicle.id === vehicleId ? { ...vehicle, isActive } : vehicle
      )
    );
    
    logger.info(`Vehicle ${vehicleId} ${isActive ? 'activated' : 'deactivated'}`);
  };

  const _getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.icon || 'car';
  };

  const getCategoryName = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.name || category;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? AppleDesign.Colors.systemGreen : AppleDesign.Colors.systemGray;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <OptimizedFadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Správa vozidiel</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddVehicle}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </OptimizedFadeIn>

      {/* Search and Filters */}
      <OptimizedSlideIn delay={100} direction="up">
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={AppleDesign.Colors.secondaryLabel}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Vyhľadať vozidlá..."
              placeholderTextColor={AppleDesign.Colors.secondaryLabel}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={AppleDesign.Colors.secondaryLabel}
                />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  haptic.light();
                }}
              >
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color={
                    selectedCategory === category.id
                      ? 'white'
                      : AppleDesign.Colors.secondaryLabel
                  }
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category.id && styles.categoryButtonTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Zoradiť podľa:</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                // V reálnej aplikácii by sa tu zobrazil picker
                Alert.alert('Zoradenie', 'Vyberte spôsob zoradenia');
              }}
            >
              <Text style={styles.sortButtonText}>
                {sortBy === 'name' ? 'Názov' :
                 sortBy === 'revenue' ? 'Príjem' :
                 sortBy === 'utilization' ? 'Využitie' :
                 'Hodnotenie'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={AppleDesign.Colors.systemBlue}
              />
            </TouchableOpacity>
          </View>
        </View>
      </OptimizedSlideIn>

      {/* Vehicles List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppleDesign.Colors.systemBlue} />
          <Text style={styles.loadingText}>Načítavam vozidlá...</Text>
        </View>
      ) : (
        <ScrollView style={styles.vehiclesList}>
          {filteredVehicles.map((vehicle, index) => (
            <OptimizedSlideIn key={vehicle.id} delay={200 + index * 50} direction="up">
              <TouchableOpacity
                style={styles.vehicleCard}
                onPress={() => handleVehiclePress(vehicle)}
              >
                <AppleCard>
                  <View style={styles.vehicleCardContent}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleName}>{vehicle.name}</Text>
                        <Text style={styles.vehicleDetails}>
                          {vehicle.year} • {getCategoryName(vehicle.category)} • {vehicle.fuelType}
                        </Text>
                      </View>
                      <View style={styles.vehicleStatus}>
                        <View
                          style={[
                            styles.statusIndicator,
                            { backgroundColor: getStatusColor(vehicle.isActive) },
                          ]}
                        />
                        <Switch
                          value={vehicle.isActive}
                          onValueChange={(value) => handleToggleActive(vehicle.id, value)}
                          trackColor={{
                            false: AppleDesign.Colors.systemGray4,
                            true: AppleDesign.Colors.systemGreen,
                          }}
                          thumbColor="white"
                        />
                      </View>
                    </View>

                    <View style={styles.vehicleMetrics}>
                      <View style={styles.metric}>
                        <Text style={styles.metricValue}>€{vehicle.revenue}</Text>
                        <Text style={styles.metricLabel}>Príjem</Text>
                      </View>
                      <View style={styles.metric}>
                        <Text style={styles.metricValue}>{vehicle.bookings}</Text>
                        <Text style={styles.metricLabel}>Rezervácie</Text>
                      </View>
                      <View style={styles.metric}>
                        <Text style={styles.metricValue}>{vehicle.utilization}%</Text>
                        <Text style={styles.metricLabel}>Využitie</Text>
                      </View>
                      <View style={styles.metric}>
                        <Text style={styles.metricValue}>{vehicle.rating}</Text>
                        <Text style={styles.metricLabel}>Hodnotenie</Text>
                      </View>
                    </View>

                    <View style={styles.vehicleFooter}>
                      <Text style={styles.vehiclePrice}>
                        €{vehicle.pricePerDay}/deň
                      </Text>
                      <View style={styles.vehicleActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditVehicle(vehicle)}
                        >
                          <Ionicons
                            name="pencil"
                            size={16}
                            color={AppleDesign.Colors.systemBlue}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteVehicle(vehicle.id)}
                        >
                          <Ionicons
                            name="trash"
                            size={16}
                            color={AppleDesign.Colors.systemRed}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </AppleCard>
              </TouchableOpacity>
            </OptimizedSlideIn>
          ))}
          
          {filteredVehicles.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Ionicons
                name="car-outline"
                size={64}
                color={AppleDesign.Colors.systemGray3}
              />
              <Text style={styles.emptyStateTitle}>Žiadne vozidlá</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || selectedCategory !== 'all'
                  ? 'Nenašli sa žiadne vozidlá pre zadané kritériá'
                  : 'Zatiaľ nemáte pridané žiadne vozidlá'}
              </Text>
              {!searchQuery && selectedCategory === 'all' && (
                <AppleButton
                  title="Pridať prvé vozidlo"
                  onPress={handleAddVehicle}
                  style={styles.emptyStateButton}
                />
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Vehicle Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        {selectedVehicle && (
          <VehicleDetailsModal
            vehicle={selectedVehicle}
            onClose={() => setShowDetailsModal(false)}
            onEdit={() => handleEditVehicle(selectedVehicle)}
            onDelete={() => handleDeleteVehicle(selectedVehicle.id)}
          />
        )}
      </Modal>
    </View>
  );
}

// Vehicle Details Modal Component
function VehicleDetailsModal({
  vehicle,
  onClose,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.modalCloseText}>Zavrieť</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{vehicle.name}</Text>
        <TouchableOpacity onPress={onEdit}>
          <Text style={styles.modalEditText}>Upraviť</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        <AppleCard style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Základné informácie</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Značka:</Text>
            <Text style={styles.detailValue}>{vehicle.brand}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model:</Text>
            <Text style={styles.detailValue}>{vehicle.model}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rok:</Text>
            <Text style={styles.detailValue}>{vehicle.year}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kategória:</Text>
            <Text style={styles.detailValue}>{vehicle.category}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Palivo:</Text>
            <Text style={styles.detailValue}>{vehicle.fuelType}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prevodovka:</Text>
            <Text style={styles.detailValue}>{vehicle.transmission}</Text>
          </View>
        </AppleCard>

        <AppleCard style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Cenník</Text>
          
          {Object.entries(vehicle.pricingTiers).map(([period, price]) => (
            <View key={period} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{period}:</Text>
              <Text style={styles.detailValue}>€{price}</Text>
            </View>
          ))}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Depozit:</Text>
            <Text style={styles.detailValue}>€{vehicle.deposit}</Text>
          </View>
        </AppleCard>

        <AppleCard style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Štatistiky</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rezervácie:</Text>
            <Text style={styles.detailValue}>{vehicle.bookings}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Príjem:</Text>
            <Text style={styles.detailValue}>€{vehicle.revenue}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Využitie:</Text>
            <Text style={styles.detailValue}>{vehicle.utilization}%</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hodnotenie:</Text>
            <Text style={styles.detailValue}>{vehicle.rating} ({vehicle.reviews} recenzií)</Text>
          </View>
        </AppleCard>

        <View style={styles.modalActions}>
          <AppleButton
            title="Upraviť vozidlo"
            onPress={onEdit}
            style={styles.modalActionButton}
          />
          <AppleButton
            title="Odstrániť vozidlo"
            onPress={onDelete}
            variant="destructive"
            style={styles.modalActionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingTop: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.md,
  },
  headerTitle: {
    ...AppleDesign.Typography.largeTitle,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppleDesign.Colors.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppleDesign.Colors.systemBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Search Section
  searchSection: {
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.medium,
    paddingHorizontal: AppleDesign.Spacing.md,
    marginBottom: AppleDesign.Spacing.md,
  },
  searchIcon: {
    marginRight: AppleDesign.Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: AppleDesign.Spacing.md,
    fontSize: 16,
    color: AppleDesign.Colors.label,
  },
  clearButton: {
    padding: AppleDesign.Spacing.xs,
  },
  
  // Categories
  categoriesScroll: {
    marginBottom: AppleDesign.Spacing.md,
  },
  categoriesContainer: {
    paddingRight: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.medium,
    gap: AppleDesign.Spacing.xs,
  },
  categoryButtonActive: {
    backgroundColor: AppleDesign.Colors.systemBlue,
  },
  categoryButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  
  // Sort
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.xs,
  },
  sortButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },
  loadingText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Vehicles List
  vehiclesList: {
    flex: 1,
    paddingHorizontal: AppleDesign.Spacing.lg,
  },
  vehicleCard: {
    marginBottom: AppleDesign.Spacing.md,
  },
  vehicleCardContent: {
    padding: AppleDesign.Spacing.lg,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: AppleDesign.Spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  vehicleDetails: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  vehicleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Metrics
  vehicleMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppleDesign.Colors.systemGray6,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  metricLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Footer
  vehicleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehiclePrice: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppleDesign.Colors.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppleDesign.Spacing.xl,
    gap: AppleDesign.Spacing.md,
  },
  emptyStateTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  emptyStateText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyStateButton: {
    marginTop: AppleDesign.Spacing.lg,
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: AppleDesign.Colors.systemGroupedBackground,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemBackground,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.systemGray6,
  },
  modalCloseText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
  modalTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  modalEditText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: AppleDesign.Spacing.lg,
  },
  detailsCard: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  detailsTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.sm,
  },
  detailLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  detailValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '500',
  },
  modalActions: {
    gap: AppleDesign.Spacing.md,
    paddingBottom: AppleDesign.Spacing.xl,
  },
  modalActionButton: {
    marginHorizontal: 0,
  },
});
