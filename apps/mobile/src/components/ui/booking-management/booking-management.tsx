/**
 * 📋 Booking Management System
 * Kompletné sledovanie a správa rezervácií pre autopožičovne
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
  RefreshControl,
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

interface Booking {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleImage?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalPrice: number;
  deposit: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod: 'card' | 'cash' | 'bank_transfer';
  extras: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  documents: {
    contract?: string;
    invoice?: string;
    handoverProtocol?: string;
    returnProtocol?: string;
  };
  timeline: {
    timestamp: string;
    action: string;
    description: string;
    user: string;
  }[];
}

interface BookingManagementProps {
  onBookingSelect?: (booking: Booking) => void;
  onBookingUpdate?: (booking: Booking) => void;
  onBookingCancel?: (bookingId: string) => void;
}

export function BookingManagement({
  onBookingSelect,
  onBookingUpdate,
  onBookingCancel,
}: BookingManagementProps) {
  const { t } = useTranslation();
  const haptic = useHapticFeedback();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'price' | 'customer'>('date');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock data - v reálnej aplikácii by sa načítalo z API
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    
    try {
      // Simulácia načítania dát z API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBookings: Booking[] = [
        {
          id: 'BK001',
          vehicleId: '1',
          vehicleName: 'BMW 3 Series',
          customerId: 'C001',
          customerName: 'Mária Kováčová',
          customerEmail: 'maria.kovacova@email.com',
          customerPhone: '+421 900 123 456',
          startDate: '2024-01-15',
          endDate: '2024-01-18',
          pickupLocation: 'Bratislava - Hlavná stanica',
          dropoffLocation: 'Bratislava - Hlavná stanica',
          status: 'active',
          totalPrice: 267,
          deposit: 500,
          paymentStatus: 'paid',
          paymentMethod: 'card',
          extras: ['GPS navigácia', 'Detská sedačka'],
          notes: 'Potrebujem vozidlo na služobnú cestu',
          createdAt: '2024-01-10T10:30:00Z',
          updatedAt: '2024-01-14T15:45:00Z',
          documents: {
            contract: 'contract_BK001.pdf',
            invoice: 'invoice_BK001.pdf',
            handoverProtocol: 'handover_BK001.pdf',
          },
          timeline: [
            {
              timestamp: '2024-01-10T10:30:00Z',
              action: 'created',
              description: 'Rezervácia vytvorená',
              user: 'Mária Kováčová',
            },
            {
              timestamp: '2024-01-10T10:35:00Z',
              action: 'payment',
              description: 'Platba úspešne spracovaná',
              user: 'System',
            },
            {
              timestamp: '2024-01-14T15:45:00Z',
              action: 'confirmed',
              description: 'Rezervácia potvrdená autopožičovňou',
              user: 'Admin',
            },
          ],
        },
        {
          id: 'BK002',
          vehicleId: '2',
          vehicleName: 'Audi A4',
          customerId: 'C002',
          customerName: 'Peter Novák',
          customerEmail: 'peter.novak@email.com',
          customerPhone: '+421 905 987 654',
          startDate: '2024-01-16',
          endDate: '2024-01-19',
          pickupLocation: 'Bratislava - Letisko',
          dropoffLocation: 'Košice - Centrum',
          status: 'confirmed',
          totalPrice: 285,
          deposit: 500,
          paymentStatus: 'paid',
          paymentMethod: 'bank_transfer',
          extras: ['Rozšírené poistenie'],
          notes: '',
          createdAt: '2024-01-12T14:20:00Z',
          updatedAt: '2024-01-12T14:25:00Z',
          documents: {
            contract: 'contract_BK002.pdf',
            invoice: 'invoice_BK002.pdf',
          },
          timeline: [
            {
              timestamp: '2024-01-12T14:20:00Z',
              action: 'created',
              description: 'Rezervácia vytvorená',
              user: 'Peter Novák',
            },
            {
              timestamp: '2024-01-12T14:25:00Z',
              action: 'payment',
              description: 'Čaká sa na potvrdenie platby',
              user: 'System',
            },
          ],
        },
        {
          id: 'BK003',
          vehicleId: '3',
          vehicleName: 'Mercedes C-Class',
          customerId: 'C003',
          customerName: 'Jana Svobodová',
          customerEmail: 'jana.svobodova@email.com',
          customerPhone: '+420 777 123 456',
          startDate: '2024-01-14',
          endDate: '2024-01-16',
          pickupLocation: 'Bratislava - Centrum',
          dropoffLocation: 'Bratislava - Centrum',
          status: 'completed',
          totalPrice: 240,
          deposit: 600,
          paymentStatus: 'refunded',
          paymentMethod: 'card',
          extras: [],
          notes: 'Výborná komunikácia, ďakujem!',
          createdAt: '2024-01-08T09:15:00Z',
          updatedAt: '2024-01-16T18:30:00Z',
          documents: {
            contract: 'contract_BK003.pdf',
            invoice: 'invoice_BK003.pdf',
            handoverProtocol: 'handover_BK003.pdf',
            returnProtocol: 'return_BK003.pdf',
          },
          timeline: [
            {
              timestamp: '2024-01-08T09:15:00Z',
              action: 'created',
              description: 'Rezervácia vytvorená',
              user: 'Jana Svobodová',
            },
            {
              timestamp: '2024-01-14T10:00:00Z',
              action: 'handover',
              description: 'Vozidlo odovzdané zákazníkovi',
              user: 'Admin',
            },
            {
              timestamp: '2024-01-16T18:30:00Z',
              action: 'completed',
              description: 'Vozidlo vrátené, rezervácia dokončená',
              user: 'Admin',
            },
          ],
        },
      ];
      
      setBookings(mockBookings);
      logger.info('Bookings loaded successfully');
      
    } catch (error) {
      logger.error('Failed to load bookings:', error);
      Alert.alert('Chyba', 'Nepodarilo sa načítať rezervácie');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    haptic.light();
    
    try {
      await loadBookings();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredBookings = bookings
    .filter(booking => {
      const matchesSearch = 
        booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.vehicleName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'price':
          return b.totalPrice - a.totalPrice;
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });

  const statusOptions = [
    { id: 'all', name: 'Všetky', color: AppleDesign.Colors.systemGray },
    { id: 'pending', name: 'Čaká', color: AppleDesign.Colors.systemOrange },
    { id: 'confirmed', name: 'Potvrdené', color: AppleDesign.Colors.systemBlue },
    { id: 'active', name: 'Aktívne', color: AppleDesign.Colors.systemGreen },
    { id: 'completed', name: 'Dokončené', color: AppleDesign.Colors.systemGray },
    { id: 'cancelled', name: 'Zrušené', color: AppleDesign.Colors.systemRed },
  ];

  const handleBookingPress = (booking: Booking) => {
    haptic.light();
    setSelectedBooking(booking);
    setShowDetailsModal(true);
    onBookingSelect?.(booking);
  };

  const handleStatusChange = (bookingId: string, newStatus: Booking['status']) => {
    haptic.medium();
    
    Alert.alert(
      'Zmeniť stav rezervácie',
      `Chcete zmeniť stav rezervácie ${bookingId} na "${getStatusName(newStatus)}"?`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Potvrdiť',
          onPress: () => {
            setBookings(prev =>
              prev.map(booking =>
                booking.id === bookingId
                  ? {
                      ...booking,
                      status: newStatus,
                      updatedAt: new Date().toISOString(),
                      timeline: [
                        ...booking.timeline,
                        {
                          timestamp: new Date().toISOString(),
                          action: 'status_changed',
                          description: `Stav zmenený na ${getStatusName(newStatus)}`,
                          user: 'Admin',
                        },
                      ],
                    }
                  : booking
              )
            );
            
            const updatedBooking = bookings.find(b => b.id === bookingId);
            if (updatedBooking) {
              onBookingUpdate?.({ ...updatedBooking, status: newStatus });
            }
            
            logger.info(`Booking ${bookingId} status changed to ${newStatus}`);
          },
        },
      ]
    );
  };

  const handleCancelBooking = (bookingId: string) => {
    haptic.warning();
    
    Alert.alert(
      'Zrušiť rezerváciu',
      'Ste si istí, že chcete zrušiť túto rezerváciu? Zákazník bude informovaný emailom.',
      [
        { text: 'Nie', style: 'cancel' },
        {
          text: 'Zrušiť rezerváciu',
          style: 'destructive',
          onPress: () => {
            handleStatusChange(bookingId, 'cancelled');
            onBookingCancel?.(bookingId);
          },
        },
      ]
    );
  };

  const getStatusColor = (status: Booking['status']) => {
    const statusOption = statusOptions.find(s => s.id === status);
    return statusOption?.color || AppleDesign.Colors.systemGray;
  };

  const getStatusName = (status: Booking['status']) => {
    const statusOption = statusOptions.find(s => s.id === status);
    return statusOption?.name || status;
  };

  const getPaymentStatusColor = (status: Booking['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return AppleDesign.Colors.systemGreen;
      case 'pending':
        return AppleDesign.Colors.systemOrange;
      case 'failed':
        return AppleDesign.Colors.systemRed;
      case 'refunded':
        return AppleDesign.Colors.systemBlue;
      default:
        return AppleDesign.Colors.systemGray;
    }
  };

  const getPaymentStatusName = (status: Booking['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return 'Zaplatené';
      case 'pending':
        return 'Čaká';
      case 'failed':
        return 'Zlyhalo';
      case 'refunded':
        return 'Vrátené';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <OptimizedFadeIn delay={0}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rezervácie</Text>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>
              {filteredBookings.length} z {bookings.length}
            </Text>
          </View>
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
              placeholder="Vyhľadať rezervácie..."
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
            style={styles.statusScroll}
            contentContainerStyle={styles.statusContainer}
          >
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status.id}
                style={[
                  styles.statusButton,
                  selectedStatus === status.id && styles.statusButtonActive,
                  selectedStatus === status.id && { backgroundColor: status.color },
                ]}
                onPress={() => {
                  setSelectedStatus(status.id);
                  haptic.light();
                }}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    selectedStatus === status.id && styles.statusButtonTextActive,
                  ]}
                >
                  {status.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </OptimizedSlideIn>

      {/* Bookings List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppleDesign.Colors.systemBlue} />
          <Text style={styles.loadingText}>Načítavam rezervácie...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.bookingsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={AppleDesign.Colors.systemBlue}
            />
          }
        >
          {filteredBookings.map((booking, index) => (
            <OptimizedSlideIn key={booking.id} delay={200 + index * 50} direction="up">
              <TouchableOpacity
                style={styles.bookingCard}
                onPress={() => handleBookingPress(booking)}
              >
                <AppleCard>
                  <View style={styles.bookingCardContent}>
                    <View style={styles.bookingHeader}>
                      <View style={styles.bookingInfo}>
                        <Text style={styles.bookingId}>#{booking.id}</Text>
                        <Text style={styles.bookingVehicle}>{booking.vehicleName}</Text>
                        <Text style={styles.bookingCustomer}>{booking.customerName}</Text>
                      </View>
                      <View style={styles.bookingStatus}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(booking.status) + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: getStatusColor(booking.status) },
                            ]}
                          >
                            {getStatusName(booking.status)}
                          </Text>
                        </View>
                        <Text style={styles.bookingPrice}>€{booking.totalPrice}</Text>
                      </View>
                    </View>

                    <View style={styles.bookingDetails}>
                      <View style={styles.bookingDates}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={AppleDesign.Colors.secondaryLabel}
                        />
                        <Text style={styles.bookingDatesText}>
                          {new Date(booking.startDate).toLocaleDateString('sk-SK')} - {new Date(booking.endDate).toLocaleDateString('sk-SK')}
                        </Text>
                      </View>
                      
                      <View style={styles.bookingLocation}>
                        <Ionicons
                          name="location-outline"
                          size={16}
                          color={AppleDesign.Colors.secondaryLabel}
                        />
                        <Text style={styles.bookingLocationText} numberOfLines={1}>
                          {booking.pickupLocation}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.bookingFooter}>
                      <View style={styles.paymentStatus}>
                        <View
                          style={[
                            styles.paymentBadge,
                            { backgroundColor: getPaymentStatusColor(booking.paymentStatus) + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.paymentBadgeText,
                              { color: getPaymentStatusColor(booking.paymentStatus) },
                            ]}
                          >
                            {getPaymentStatusName(booking.paymentStatus)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.bookingActions}>
                        {booking.status === 'pending' && (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: AppleDesign.Colors.systemGreen + '20' }]}
                            onPress={() => handleStatusChange(booking.id, 'confirmed')}
                          >
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={AppleDesign.Colors.systemGreen}
                            />
                          </TouchableOpacity>
                        )}
                        
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: AppleDesign.Colors.systemRed + '20' }]}
                            onPress={() => handleCancelBooking(booking.id)}
                          >
                            <Ionicons
                              name="close"
                              size={16}
                              color={AppleDesign.Colors.systemRed}
                            />
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: AppleDesign.Colors.systemBlue + '20' }]}
                          onPress={() => handleBookingPress(booking)}
                        >
                          <Ionicons
                            name="eye"
                            size={16}
                            color={AppleDesign.Colors.systemBlue}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </AppleCard>
              </TouchableOpacity>
            </OptimizedSlideIn>
          ))}
          
          {filteredBookings.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={AppleDesign.Colors.systemGray3}
              />
              <Text style={styles.emptyStateTitle}>Žiadne rezervácie</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || selectedStatus !== 'all'
                  ? 'Nenašli sa žiadne rezervácie pre zadané kritériá'
                  : 'Zatiaľ nemáte žiadne rezervácie'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Booking Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        {selectedBooking && (
          <BookingDetailsModal
            booking={selectedBooking}
            onClose={() => setShowDetailsModal(false)}
            onStatusChange={(status) => {
              handleStatusChange(selectedBooking.id, status);
              setShowDetailsModal(false);
            }}
            onCancel={() => {
              handleCancelBooking(selectedBooking.id);
              setShowDetailsModal(false);
            }}
          />
        )}
      </Modal>
    </View>
  );
}

// Booking Details Modal Component
function BookingDetailsModal({
  booking,
  onClose,
  onStatusChange,
  onCancel,
}: {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (status: Booking['status']) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.modalCloseText}>Zavrieť</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>#{booking.id}</Text>
        <TouchableOpacity onPress={() => Alert.alert('Upraviť', 'Funkcia bude implementovaná')}>
          <Text style={styles.modalEditText}>Upraviť</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        <AppleCard style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Základné informácie</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vozidlo:</Text>
            <Text style={styles.detailValue}>{booking.vehicleName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Zákazník:</Text>
            <Text style={styles.detailValue}>{booking.customerName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{booking.customerEmail}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Telefón:</Text>
            <Text style={styles.detailValue}>{booking.customerPhone}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Obdobie:</Text>
            <Text style={styles.detailValue}>
              {new Date(booking.startDate).toLocaleDateString('sk-SK')} - {new Date(booking.endDate).toLocaleDateString('sk-SK')}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vyzdvihnutie:</Text>
            <Text style={styles.detailValue}>{booking.pickupLocation}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vrátenie:</Text>
            <Text style={styles.detailValue}>{booking.dropoffLocation}</Text>
          </View>
        </AppleCard>

        <AppleCard style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Platba</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Celková suma:</Text>
            <Text style={styles.detailValue}>€{booking.totalPrice}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Depozit:</Text>
            <Text style={styles.detailValue}>€{booking.deposit}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Spôsob platby:</Text>
            <Text style={styles.detailValue}>
              {booking.paymentMethod === 'card' ? 'Karta' :
               booking.paymentMethod === 'cash' ? 'Hotovosť' :
               'Bankový prevod'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stav platby:</Text>
            <Text style={[styles.detailValue, { color: getPaymentStatusColor(booking.paymentStatus) }]}>
              {getPaymentStatusName(booking.paymentStatus)}
            </Text>
          </View>
        </AppleCard>

        {booking.extras.length > 0 && (
          <AppleCard style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Doplnky</Text>
            {booking.extras.map((extra, index) => (
              <Text key={index} style={styles.extraItem}>• {extra}</Text>
            ))}
          </AppleCard>
        )}

        {booking.notes && (
          <AppleCard style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Poznámky</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </AppleCard>
        )}

        <AppleCard style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>História</Text>
          {booking.timeline.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <View style={styles.timelineDot} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDescription}>{event.description}</Text>
                <Text style={styles.timelineTimestamp}>
                  {new Date(event.timestamp).toLocaleString('sk-SK')} • {event.user}
                </Text>
              </View>
            </View>
          ))}
        </AppleCard>

        <View style={styles.modalActions}>
          {booking.status === 'pending' && (
            <AppleButton
              title="Potvrdiť rezerváciu"
              onPress={() => onStatusChange('confirmed')}
              style={styles.modalActionButton}
            />
          )}
          
          {booking.status === 'confirmed' && (
            <AppleButton
              title="Označiť ako aktívne"
              onPress={() => onStatusChange('active')}
              style={styles.modalActionButton}
            />
          )}
          
          {booking.status === 'active' && (
            <AppleButton
              title="Dokončiť rezerváciu"
              onPress={() => onStatusChange('completed')}
              style={styles.modalActionButton}
            />
          )}
          
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <AppleButton
              title="Zrušiť rezerváciu"
              onPress={onCancel}
              variant="destructive"
              style={styles.modalActionButton}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Helper functions
function getPaymentStatusColor(status: Booking['paymentStatus']) {
  switch (status) {
    case 'paid':
      return AppleDesign.Colors.systemGreen;
    case 'pending':
      return AppleDesign.Colors.systemOrange;
    case 'failed':
      return AppleDesign.Colors.systemRed;
    case 'refunded':
      return AppleDesign.Colors.systemBlue;
    default:
      return AppleDesign.Colors.systemGray;
  }
}

function getPaymentStatusName(status: Booking['paymentStatus']) {
  switch (status) {
    case 'paid':
      return 'Zaplatené';
    case 'pending':
      return 'Čaká';
    case 'failed':
      return 'Zlyhalo';
    case 'refunded':
      return 'Vrátené';
    default:
      return status;
  }
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
  headerStats: {
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  headerStatsText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '500',
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
  
  // Status Filter
  statusScroll: {
    marginBottom: AppleDesign.Spacing.md,
  },
  statusContainer: {
    paddingRight: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.sm,
  },
  statusButton: {
    paddingHorizontal: AppleDesign.Spacing.md,
    paddingVertical: AppleDesign.Spacing.sm,
    backgroundColor: AppleDesign.Colors.systemGray6,
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  statusButtonActive: {
    // backgroundColor set dynamically
  },
  statusButtonText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: 'white',
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
  
  // Bookings List
  bookingsList: {
    flex: 1,
    paddingHorizontal: AppleDesign.Spacing.lg,
  },
  bookingCard: {
    marginBottom: AppleDesign.Spacing.md,
  },
  bookingCardContent: {
    padding: AppleDesign.Spacing.lg,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: AppleDesign.Spacing.md,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingId: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  bookingVehicle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: AppleDesign.Spacing.xs,
  },
  bookingCustomer: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  bookingStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: AppleDesign.Spacing.xs,
    borderRadius: AppleDesign.BorderRadius.small,
    marginBottom: AppleDesign.Spacing.xs,
  },
  statusBadgeText: {
    ...AppleDesign.Typography.caption1,
    fontWeight: '600',
  },
  bookingPrice: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  
  // Booking Details
  bookingDetails: {
    marginBottom: AppleDesign.Spacing.md,
    gap: AppleDesign.Spacing.sm,
  },
  bookingDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
  },
  bookingDatesText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },
  bookingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.sm,
  },
  bookingLocationText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    flex: 1,
  },
  
  // Booking Footer
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: AppleDesign.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.systemGray6,
  },
  paymentStatus: {
    flex: 1,
  },
  paymentBadge: {
    paddingHorizontal: AppleDesign.Spacing.sm,
    paddingVertical: AppleDesign.Spacing.xs,
    borderRadius: AppleDesign.BorderRadius.small,
    alignSelf: 'flex-start',
  },
  paymentBadgeText: {
    ...AppleDesign.Typography.caption1,
    fontWeight: '600',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    flex: 1,
    textAlign: 'right',
  },
  extraItem: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    marginBottom: AppleDesign.Spacing.xs,
  },
  notesText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    lineHeight: 22,
  },
  
  // Timeline
  timelineItem: {
    flexDirection: 'row',
    marginBottom: AppleDesign.Spacing.md,
  },
  timelineIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: AppleDesign.Spacing.md,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppleDesign.Colors.systemBlue,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDescription: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    marginBottom: AppleDesign.Spacing.xs,
  },
  timelineTimestamp: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Modal Actions
  modalActions: {
    gap: AppleDesign.Spacing.md,
    paddingBottom: AppleDesign.Spacing.xl,
  },
  modalActionButton: {
    marginHorizontal: 0,
  },
});
