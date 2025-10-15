/**
 * Booking Summary Component
 * Displays price breakdown and booking details
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppleDesign } from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import type { BookingData } from '../../types/booking';
import type { Vehicle } from '../../types/vehicle';
import { format } from 'date-fns';

interface BookingSummaryProps {
  bookingData: BookingData;
  vehicle: Vehicle;
  showTaxes?: boolean;
  showTerms?: boolean;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  bookingData,
  vehicle,
  showTaxes = true,
  showTerms = false,
}) => {
  const { t } = useTranslation(['booking', 'common']);

  // Calculate prices
  const priceCalculation = useMemo(() => {
    if (!bookingData.dates) {
      return {
        vehiclePrice: 0,
        insurancePrice: 0,
        addOnsPrice: 0,
        subtotal: 0,
        taxes: 0,
        total: 0,
        deposit: 0,
      };
    }

    const days = bookingData.dates.numberOfDays;
    
    // Find appropriate pricing tier
    const pricingTier = vehicle.pricing?.find(
      (tier) => days >= tier.minDays && days <= tier.maxDays
    ) || vehicle.pricing?.[0];
    
    const pricePerDay = pricingTier?.pricePerDay || 0;
    const vehiclePrice = pricePerDay * days;

    // Insurance price
    const insurancePrice = bookingData.insurance 
      ? bookingData.insurance.price * days 
      : 0;

    // Add-ons price
    const addOnsPrice = bookingData.addOns?.reduce((sum, addOn) => {
      if (addOn.priceType === 'per_day') {
        return sum + (addOn.price * addOn.quantity * days);
      }
      return sum + (addOn.price * addOn.quantity);
    }, 0) || 0;

    const subtotal = vehiclePrice + insurancePrice + addOnsPrice;
    const taxes = subtotal * 0.20; // 20% VAT
    const total = subtotal + taxes;
    
    // Deposit calculation (vehicle-specific or default 20%)
    const deposit = vehicle.deposit || (total * 0.20);

    return {
      vehiclePrice,
      insurancePrice,
      addOnsPrice,
      subtotal,
      taxes,
      total,
      deposit,
      pricePerDay,
      days,
    };
  }, [bookingData, vehicle]);

  if (!bookingData.dates) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calculator-outline" size={48} color={AppleDesign.Colors.tertiaryLabel} />
        <Text style={styles.emptyText}>
          {t('booking:summary.selectDatesFirst')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Vehicle Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('booking:summary.vehicleInfo')}</Text>
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {vehicle.brand} {vehicle.model}
            </Text>
            {vehicle.year && (
              <Text style={styles.vehicleDetail}>
                {t('vehicle:year')}: {vehicle.year}
              </Text>
            )}
            {vehicle.licensePlate && (
              <Text style={styles.vehicleDetail}>
                {t('vehicle:licensePlate')}: {vehicle.licensePlate}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Rental Period */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('booking:summary.rentalPeriod')}</Text>
        <View style={styles.datesCard}>
          <View style={styles.dateRow}>
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>{t('booking:steps.dates.pickupDate')}</Text>
              <Text style={styles.dateValue}>
                {format(bookingData.dates.startDate, 'dd.MM.yyyy')}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color={AppleDesign.Colors.secondaryLabel} />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>{t('booking:steps.dates.returnDate')}</Text>
              <Text style={styles.dateValue}>
                {format(bookingData.dates.endDate, 'dd.MM.yyyy')}
              </Text>
            </View>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {t('booking:priceBreakdown.days', { count: priceCalculation.days })}
            </Text>
          </View>
        </View>
      </View>

      {/* Price Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('booking:summary.priceBreakdown')}</Text>
        <View style={styles.priceCard}>
          {/* Vehicle Price */}
          <View style={styles.priceRow}>
            <View style={styles.priceRowLeft}>
              <Text style={styles.priceLabel}>
                {t('booking:priceBreakdown.vehicleRental')}
              </Text>
              <Text style={styles.priceDetail}>
                {priceCalculation.pricePerDay}€ × {priceCalculation.days} {t('booking:priceBreakdown.days', { count: priceCalculation.days })}
              </Text>
            </View>
            <Text style={styles.priceValue}>{priceCalculation.vehiclePrice.toFixed(2)}€</Text>
          </View>

          {/* Insurance */}
          {bookingData.insurance && (
            <View style={styles.priceRow}>
              <View style={styles.priceRowLeft}>
                <Text style={styles.priceLabel}>
                  {bookingData.insurance.name}
                </Text>
                <Text style={styles.priceDetail}>
                  {bookingData.insurance.price}€ × {priceCalculation.days} {t('booking:priceBreakdown.days', { count: priceCalculation.days })}
                </Text>
              </View>
              <Text style={styles.priceValue}>{priceCalculation.insurancePrice.toFixed(2)}€</Text>
            </View>
          )}

          {/* Add-ons */}
          {bookingData.addOns && bookingData.addOns.length > 0 && (
            <>
              {bookingData.addOns.map((addOn) => {
                const addOnTotal = addOn.priceType === 'per_day'
                  ? addOn.price * addOn.quantity * priceCalculation.days
                  : addOn.price * addOn.quantity;

                return (
                  <View key={addOn.id} style={styles.priceRow}>
                    <View style={styles.priceRowLeft}>
                      <Text style={styles.priceLabel}>
                        {addOn.name} {addOn.quantity > 1 && `× ${addOn.quantity}`}
                      </Text>
                      <Text style={styles.priceDetail}>
                        {addOn.price}€ {addOn.priceType === 'per_day' 
                          ? `× ${addOn.quantity} × ${priceCalculation.days} ${t('booking:priceBreakdown.days', { count: priceCalculation.days })}`
                          : `× ${addOn.quantity}`}
                      </Text>
                    </View>
                    <Text style={styles.priceValue}>{addOnTotal.toFixed(2)}€</Text>
                  </View>
                );
              })}
            </>
          )}

          {/* Subtotal */}
          <View style={[styles.priceRow, styles.subtotalRow]}>
            <Text style={styles.subtotalLabel}>{t('booking:priceBreakdown.subtotal')}</Text>
            <Text style={styles.subtotalValue}>{priceCalculation.subtotal.toFixed(2)}€</Text>
          </View>

          {/* Taxes */}
          {showTaxes && (
            <View style={styles.priceRow}>
              <View style={styles.priceRowLeft}>
                <Text style={styles.priceLabel}>
                  {t('booking:priceBreakdown.vat')} (20%)
                </Text>
              </View>
              <Text style={styles.priceValue}>{priceCalculation.taxes.toFixed(2)}€</Text>
            </View>
          )}

          {/* Total */}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('booking:priceBreakdown.total')}</Text>
            <Text style={styles.totalValue}>{priceCalculation.total.toFixed(2)}€</Text>
          </View>

          {/* Deposit */}
          <View style={styles.depositCard}>
            <View style={styles.depositIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color={AppleDesign.Colors.systemBlue} />
            </View>
            <View style={styles.depositInfo}>
              <Text style={styles.depositLabel}>{t('booking:priceBreakdown.deposit')}</Text>
              <Text style={styles.depositDescription}>
                {t('booking:priceBreakdown.depositDescription')}
              </Text>
            </View>
            <Text style={styles.depositValue}>{priceCalculation.deposit.toFixed(2)}€</Text>
          </View>
        </View>
      </View>

      {/* Terms & Conditions */}
      {showTerms && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking:summary.termsAndConditions')}</Text>
          <View style={styles.termsCard}>
            <View style={styles.termItem}>
              <Ionicons name="checkmark-circle" size={20} color={AppleDesign.Colors.systemGreen} />
              <Text style={styles.termText}>
                {t('booking:summary.terms.cancelation')}
              </Text>
            </View>
            <View style={styles.termItem}>
              <Ionicons name="checkmark-circle" size={20} color={AppleDesign.Colors.systemGreen} />
              <Text style={styles.termText}>
                {t('booking:summary.terms.modification')}
              </Text>
            </View>
            <View style={styles.termItem}>
              <Ionicons name="checkmark-circle" size={20} color={AppleDesign.Colors.systemGreen} />
              <Text style={styles.termText}>
                {t('booking:summary.terms.insurance')}
              </Text>
            </View>
            <View style={styles.termItem}>
              <Ionicons name="checkmark-circle" size={20} color={AppleDesign.Colors.systemGreen} />
              <Text style={styles.termText}>
                {t('booking:summary.terms.fuel')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Important Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color={AppleDesign.Colors.systemBlue} />
        <View style={styles.infoContent}>
          <Text style={styles.infoText}>
            {t('booking:summary.importantInfo')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: AppleDesign.Spacing.xl,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: AppleDesign.Spacing.xl,
  },
  emptyText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: AppleDesign.Spacing.md,
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: AppleDesign.Spacing.xl,
  },
  sectionTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.md,
  },

  // Vehicle Card
  vehicleCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    ...AppleDesign.Shadows.small,
  },
  vehicleInfo: {
    gap: AppleDesign.Spacing.xs,
  },
  vehicleName: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  vehicleDetail: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.secondaryLabel,
  },

  // Dates Card
  datesCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    ...AppleDesign.Shadows.small,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppleDesign.Spacing.md,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: 4,
  },
  dateValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  durationBadge: {
    backgroundColor: AppleDesign.Colors.systemBlueLight || 'rgba(0, 122, 255, 0.1)',
    paddingVertical: AppleDesign.Spacing.sm,
    paddingHorizontal: AppleDesign.Spacing.md,
    borderRadius: AppleDesign.BorderRadius.medium,
    alignSelf: 'flex-start',
  },
  durationText: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },

  // Price Card
  priceCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    ...AppleDesign.Shadows.small,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: AppleDesign.Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  priceRowLeft: {
    flex: 1,
  },
  priceLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  priceDetail: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: 2,
  },
  priceValue: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },

  // Subtotal
  subtotalRow: {
    marginTop: AppleDesign.Spacing.sm,
    paddingTop: AppleDesign.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.separator,
    borderBottomWidth: 0,
  },
  subtotalLabel: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  subtotalValue: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },

  // Total
  totalRow: {
    marginTop: AppleDesign.Spacing.md,
    paddingTop: AppleDesign.Spacing.md,
    borderTopWidth: 2,
    borderTopColor: AppleDesign.Colors.separator,
    borderBottomWidth: 0,
  },
  totalLabel: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  totalValue: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },

  // Deposit
  depositCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
    marginTop: AppleDesign.Spacing.lg,
    padding: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemBlueLight || 'rgba(0, 122, 255, 0.1)',
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  depositIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppleDesign.Colors.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  depositInfo: {
    flex: 1,
  },
  depositLabel: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  depositDescription: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: 2,
  },
  depositValue: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },

  // Terms Card
  termsCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    padding: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.md,
    ...AppleDesign.Shadows.small,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AppleDesign.Spacing.sm,
  },
  termText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    flex: 1,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
    padding: AppleDesign.Spacing.md,
    backgroundColor: AppleDesign.Colors.systemBlueLight || 'rgba(0, 122, 255, 0.1)',
    borderRadius: AppleDesign.BorderRadius.medium,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
  },
});

