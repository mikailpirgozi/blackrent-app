/**
 * Add-Ons Selector Component
 * Allows users to select additional services for rental
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppleDesign } from '../../styles/apple-design-system';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import type { AddOn } from '../../types/booking';

interface AddOnsSelectorProps {
  onAddOnsChange: (addOns: AddOn[]) => void;
  selectedAddOns: AddOn[];
  numberOfDays: number;
}

// Mock add-ons - will be fetched from API
const AVAILABLE_ADDONS: Omit<AddOn, 'quantity'>[] = [
  {
    id: 'gps',
    name: 'GPS Navigácia',
    description: 'Moderná GPS navigácia s real-time dopravnými informáciami',
    price: 5,
    priceType: 'per_day',
  },
  {
    id: 'child-seat',
    name: 'Detská sedačka',
    description: 'Bezpečnostná sedačka pre deti (0-4 roky)',
    price: 8,
    priceType: 'per_day',
  },
  {
    id: 'additional-driver',
    name: 'Dodatočný vodič',
    description: 'Možnosť pridať ďalšieho registrovaného vodiča',
    price: 15,
    priceType: 'one_time',
  },
  {
    id: 'winter-tires',
    name: 'Zimné pneumatiky',
    description: 'Zimné pneumatiky pre bezpečnú jazdu v zime',
    price: 3,
    priceType: 'per_day',
  },
  {
    id: 'roof-rack',
    name: 'Strešný nosič',
    description: 'Strešný nosič pre lyže alebo bicykle',
    price: 10,
    priceType: 'per_day',
  },
  {
    id: 'wifi-hotspot',
    name: 'WiFi Hotspot',
    description: 'Mobilný WiFi router s neobmedzenými dátami',
    price: 7,
    priceType: 'per_day',
  },
];

export const AddOnsSelector: React.FC<AddOnsSelectorProps> = ({
  onAddOnsChange,
  selectedAddOns,
  numberOfDays,
}) => {
  const { t } = useTranslation(['booking', 'common']);
  const [addOns, setAddOns] = useState<AddOn[]>(selectedAddOns);

  const handleToggle = useCallback((addOn: Omit<AddOn, 'quantity'>) => {
    setAddOns((prev) => {
      const existingIndex = prev.findIndex((a) => a.id === addOn.id);
      
      if (existingIndex >= 0) {
        // Remove if exists
        const newAddOns = prev.filter((a) => a.id !== addOn.id);
        onAddOnsChange(newAddOns);
        return newAddOns;
      } else {
        // Add with quantity 1
        const newAddOn: AddOn = { ...addOn, quantity: 1 };
        const newAddOns = [...prev, newAddOn];
        onAddOnsChange(newAddOns);
        return newAddOns;
      }
    });
  }, [onAddOnsChange]);

  const handleQuantityChange = useCallback((addOnId: string, delta: number) => {
    setAddOns((prev) => {
      const newAddOns = prev.map((a) => {
        if (a.id === addOnId) {
          const newQuantity = Math.max(1, Math.min(5, a.quantity + delta));
          return { ...a, quantity: newQuantity };
        }
        return a;
      });
      onAddOnsChange(newAddOns);
      return newAddOns;
    });
  }, [onAddOnsChange]);

  const calculatePrice = useCallback((addOn: AddOn) => {
    if (addOn.priceType === 'per_day') {
      return addOn.price * addOn.quantity * numberOfDays;
    }
    return addOn.price * addOn.quantity;
  }, [numberOfDays]);

  const totalPrice = addOns.reduce((sum, addOn) => sum + calculatePrice(addOn), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('booking:steps.addons.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('booking:steps.addons.subtitle')}
        </Text>
      </View>

      {/* Add-ons List */}
      <View style={styles.addOnsList}>
        {AVAILABLE_ADDONS.map((addOn) => {
          const selectedAddOn = addOns.find((a) => a.id === addOn.id);
          const isSelected = !!selectedAddOn;
          const quantity = selectedAddOn?.quantity || 1;
          const price = isSelected 
            ? calculatePrice(selectedAddOn)
            : addOn.priceType === 'per_day' 
              ? addOn.price * numberOfDays 
              : addOn.price;

          return (
            <View key={addOn.id} style={styles.addOnCard}>
              <TouchableOpacity
                style={[
                  styles.addOnHeader,
                  isSelected && styles.addOnHeaderSelected,
                ]}
                onPress={() => handleToggle(addOn)}
                activeOpacity={0.7}
              >
                <View style={styles.addOnHeaderLeft}>
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </View>
                  
                  <View style={styles.addOnInfo}>
                    <Text style={[
                      styles.addOnName,
                      isSelected && styles.addOnNameSelected,
                    ]}>
                      {addOn.name}
                    </Text>
                    <Text style={styles.addOnDescription}>
                      {addOn.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.addOnPriceContainer}>
                  <Text style={styles.addOnPrice}>{price}€</Text>
                  <Text style={styles.addOnPriceType}>
                    {addOn.priceType === 'per_day' 
                      ? `${addOn.price}€ / ${t('common:perDay')}`
                      : t('booking:steps.addons.oneTime')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Quantity Selector (only for selected items that support quantity) */}
              {isSelected && ['child-seat', 'roof-rack'].includes(addOn.id) && (
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>
                    {t('booking:steps.addons.quantity')}:
                  </Text>
                  
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(addOn.id, -1)}
                      disabled={quantity <= 1}
                    >
                      <Ionicons 
                        name="remove" 
                        size={20} 
                        color={quantity <= 1 ? AppleDesign.Colors.tertiaryLabel : AppleDesign.Colors.systemBlue} 
                      />
                    </TouchableOpacity>

                    <Text style={styles.quantityValue}>{quantity}</Text>

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(addOn.id, 1)}
                      disabled={quantity >= 5}
                    >
                      <Ionicons 
                        name="add" 
                        size={20} 
                        color={quantity >= 5 ? AppleDesign.Colors.tertiaryLabel : AppleDesign.Colors.systemBlue} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Summary */}
      {addOns.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>
              {t('booking:steps.addons.selectedAddons')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setAddOns([]);
                onAddOnsChange([]);
              }}
            >
              <Text style={styles.clearAllText}>
                {t('booking:steps.addons.clearAll')}
              </Text>
            </TouchableOpacity>
          </View>

          {addOns.map((addOn) => (
            <View key={addOn.id} style={styles.summaryItem}>
              <View style={styles.summaryItemLeft}>
                <Text style={styles.summaryItemName}>
                  {addOn.name}
                  {addOn.quantity > 1 && ` × ${addOn.quantity}`}
                </Text>
                <Text style={styles.summaryItemDetail}>
                  {addOn.priceType === 'per_day'
                    ? `${addOn.price}€ × ${addOn.quantity} × ${numberOfDays} ${t('booking:priceBreakdown.days', { count: numberOfDays })}`
                    : `${addOn.price}€ × ${addOn.quantity}`}
                </Text>
              </View>
              <Text style={styles.summaryItemPrice}>
                {calculatePrice(addOn)}€
              </Text>
            </View>
          ))}

          <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>
              {t('booking:steps.addons.totalAddons')}
            </Text>
            <Text style={styles.summaryTotalValue}>{totalPrice}€</Text>
          </View>
        </View>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={24} color={AppleDesign.Colors.systemBlue} />
        <View style={styles.infoContent}>
          <Text style={styles.infoText}>
            {t('booking:steps.addons.infoText')}
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

  // Header
  header: {
    marginBottom: AppleDesign.Spacing.lg,
  },
  headerTitle: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    marginBottom: AppleDesign.Spacing.xs,
  },
  headerSubtitle: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.secondaryLabel,
  },

  // Add-ons List
  addOnsList: {
    gap: AppleDesign.Spacing.md,
  },

  // Add-on Card
  addOnCard: {
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    overflow: 'hidden',
    ...AppleDesign.Shadows.small,
  },
  addOnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: AppleDesign.Spacing.lg,
  },
  addOnHeaderSelected: {
    backgroundColor: AppleDesign.Colors.systemBlueLight || 'rgba(0, 122, 255, 0.05)',
  },
  addOnHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },

  // Checkbox
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: AppleDesign.Colors.systemGray4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: AppleDesign.Colors.systemBlue,
    borderColor: AppleDesign.Colors.systemBlue,
  },

  // Add-on Info
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
    marginBottom: 4,
  },
  addOnNameSelected: {
    color: AppleDesign.Colors.systemBlue,
  },
  addOnDescription: {
    ...AppleDesign.Typography.subheadline,
    color: AppleDesign.Colors.secondaryLabel,
  },

  // Price
  addOnPriceContainer: {
    alignItems: 'flex-end',
  },
  addOnPrice: {
    ...AppleDesign.Typography.title3,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  addOnPriceType: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.tertiaryLabel,
    marginTop: 2,
  },

  // Quantity Selector
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingVertical: AppleDesign.Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppleDesign.Colors.separator,
  },
  quantityLabel: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppleDesign.Colors.tertiarySystemFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },

  // Summary
  summary: {
    marginTop: AppleDesign.Spacing.xl,
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.large,
    ...AppleDesign.Shadows.small,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppleDesign.Spacing.md,
  },
  summaryTitle: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  clearAllText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemRed,
    fontWeight: '600',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: AppleDesign.Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: AppleDesign.Colors.separator,
  },
  summaryItemLeft: {
    flex: 1,
  },
  summaryItemName: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '600',
  },
  summaryItemDetail: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginTop: 2,
  },
  summaryItemPrice: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: AppleDesign.Spacing.md,
    paddingTop: AppleDesign.Spacing.md,
    borderTopWidth: 2,
    borderTopColor: AppleDesign.Colors.separator,
  },
  summaryTotalLabel: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  summaryTotalValue: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    gap: AppleDesign.Spacing.md,
    marginTop: AppleDesign.Spacing.lg,
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

