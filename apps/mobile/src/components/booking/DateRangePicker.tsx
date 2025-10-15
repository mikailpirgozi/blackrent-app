/**
 * Date Range Picker Component
 * Calendar-based date range selection with availability check
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { format, parse, addDays, differenceInDays, isBefore, startOfDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import AppleDesign from '../../styles/apple-design-system';
import { checkVehicleAvailability } from '../../services/api/vehicle-service';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: number;
}

export interface DateRangePickerProps {
  vehicleId: string;
  onSelectRange: (range: DateRange) => void;
  minDays?: number;
  maxDays?: number;
}

export function DateRangePicker({
  vehicleId,
  onSelectRange,
  minDays = 1,
  maxDays = 90,
}: DateRangePickerProps) {
  const { t } = useTranslation(['booking', 'common']);
  
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  /**
   * Check availability when dates are selected
   */
  const checkAvailability = useCallback(
    async (start: string, end: string) => {
      try {
        setIsCheckingAvailability(true);
        
        const response = await checkVehicleAvailability(vehicleId, start, end);
        
        if (!response.available && response.conflicts) {
          // Extract unavailable date ranges
          const unavailable: string[] = [];
          response.conflicts.forEach((conflict) => {
            const conflictStart = parse(conflict.startDate, 'yyyy-MM-dd', new Date());
            const conflictEnd = parse(conflict.endDate, 'yyyy-MM-dd', new Date());
            const days = differenceInDays(conflictEnd, conflictStart);
            
            for (let i = 0; i <= days; i++) {
              const date = format(addDays(conflictStart, i), 'yyyy-MM-dd');
              unavailable.push(date);
            }
          });
          
          setUnavailableDates(unavailable);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Failed to check availability:', error);
        return true; // Assume available on error
      } finally {
        setIsCheckingAvailability(false);
      }
    },
    [vehicleId]
  );

  /**
   * Handle day press
   */
  const handleDayPress = useCallback(
    async (day: DateData) => {
      const selectedDate = day.dateString;
      
      // Prevent selecting unavailable dates
      if (unavailableDates.includes(selectedDate)) {
        return;
      }
      
      // First selection - start date
      if (!startDate || (startDate && endDate)) {
        setStartDate(selectedDate);
        setEndDate(null);
        return;
      }
      
      // Second selection - end date
      const start = parse(startDate, 'yyyy-MM-dd', new Date());
      const end = parse(selectedDate, 'yyyy-MM-dd', new Date());
      
      // Ensure end date is after start date
      if (isBefore(end, start)) {
        setStartDate(selectedDate);
        setEndDate(null);
        return;
      }
      
      const days = differenceInDays(end, start) + 1;
      
      // Validate day range
      if (days < minDays) {
        alert(t('booking:errors.minDays', { days: minDays }));
        return;
      }
      
      if (days > maxDays) {
        alert(t('booking:errors.maxDays', { days: maxDays }));
        return;
      }
      
      // Check availability for the range
      const available = await checkAvailability(startDate, selectedDate);
      
      if (!available) {
        alert(t('booking:errors.unavailableDates'));
        setStartDate(null);
        setEndDate(null);
        return;
      }
      
      setEndDate(selectedDate);
      
      // Notify parent
      onSelectRange({
        startDate,
        endDate: selectedDate,
        days,
      });
    },
    [startDate, endDate, unavailableDates, minDays, maxDays, checkAvailability, onSelectRange, t]
  );

  /**
   * Generate marked dates for calendar
   */
  const markedDates = useMemo(() => {
    const marked: Record<string, object> = {};
    
    // Mark unavailable dates
    unavailableDates.forEach((date) => {
      marked[date] = {
        disabled: true,
        disableTouchEvent: true,
        color: AppleDesign.Colors.systemRed,
        textColor: 'white',
      };
    });
    
    // Mark selected range
    if (startDate) {
      marked[startDate] = {
        startingDay: true,
        color: AppleDesign.Colors.systemBlue,
        textColor: 'white',
      };
      
      if (endDate) {
        marked[endDate] = {
          endingDay: true,
          color: AppleDesign.Colors.systemBlue,
          textColor: 'white',
        };
        
        // Mark days in between
        const start = parse(startDate, 'yyyy-MM-dd', new Date());
        const end = parse(endDate, 'yyyy-MM-dd', new Date());
        const days = differenceInDays(end, start);
        
        for (let i = 1; i < days; i++) {
          const date = format(addDays(start, i), 'yyyy-MM-dd');
          marked[date] = {
            color: AppleDesign.Colors.systemBlue,
            textColor: 'white',
          };
        }
      }
    }
    
    return marked;
  }, [startDate, endDate, unavailableDates]);

  /**
   * Calculate rental duration
   */
  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const end = parse(endDate, 'yyyy-MM-dd', new Date());
    
    return differenceInDays(end, start) + 1;
  }, [startDate, endDate]);

  /**
   * Reset selection
   */
  const handleReset = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('booking:dateRange.title')}</Text>
        {startDate && (
          <TouchableOpacity onPress={handleReset} testID="reset-dates">
            <Text style={styles.resetText}>{t('common:buttons.reset')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Calendar */}
      <Calendar
        current={today}
        minDate={today}
        maxDate={format(addDays(new Date(), 365), 'yyyy-MM-dd')}
        onDayPress={handleDayPress}
        markingType="period"
        markedDates={markedDates}
        theme={{
          backgroundColor: AppleDesign.Colors.systemBackground,
          calendarBackground: AppleDesign.Colors.systemBackground,
          textSectionTitleColor: AppleDesign.Colors.label,
          selectedDayBackgroundColor: AppleDesign.Colors.systemBlue,
          selectedDayTextColor: 'white',
          todayTextColor: AppleDesign.Colors.systemBlue,
          dayTextColor: AppleDesign.Colors.label,
          textDisabledColor: AppleDesign.Colors.tertiaryLabel,
          monthTextColor: AppleDesign.Colors.label,
          textMonthFontWeight: '700',
        }}
      />

      {/* Selection Info */}
      {startDate && (
        <View style={styles.selectionInfo}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>{t('booking:dateRange.from')}</Text>
            <Text style={styles.dateValue}>{format(parse(startDate, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy')}</Text>
          </View>
          
          {endDate ? (
            <>
              <Ionicons name="arrow-forward" size={20} color={AppleDesign.Colors.secondaryLabel} />
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>{t('booking:dateRange.to')}</Text>
                <Text style={styles.dateValue}>{format(parse(endDate, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy')}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.selectEndDate}>{t('booking:dateRange.selectEndDate')}</Text>
          )}
        </View>
      )}

      {/* Duration Info */}
      {rentalDays && (
        <View style={styles.durationInfo}>
          <Ionicons name="calendar-outline" size={20} color={AppleDesign.Colors.systemBlue} />
          <Text style={styles.durationText}>
            {t('booking:dateRange.duration', { days: rentalDays })}
          </Text>
        </View>
      )}

      {/* Loading */}
      {isCheckingAvailability && (
        <View style={styles.loading}>
          <ActivityIndicator color={AppleDesign.Colors.systemBlue} />
          <Text style={styles.loadingText}>{t('booking:checkingAvailability')}</Text>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: AppleDesign.Colors.systemBlue }]} />
          <Text style={styles.legendText}>{t('booking:legend.selected')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: AppleDesign.Colors.systemRed }]} />
          <Text style={styles.legendText}>{t('booking:legend.unavailable')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppleDesign.Colors.systemBackground,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.md,
  },
  title: {
    ...AppleDesign.Typography.title2,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  resetText: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '600',
  },
  
  // Selection Info
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: AppleDesign.Spacing.lg,
    backgroundColor: AppleDesign.Colors.secondarySystemBackground,
    borderRadius: AppleDesign.BorderRadius.card,
    margin: AppleDesign.Spacing.lg,
    gap: AppleDesign.Spacing.md,
  },
  dateInfo: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    ...AppleDesign.Typography.caption1,
    color: AppleDesign.Colors.secondaryLabel,
    marginBottom: AppleDesign.Spacing.xs,
  },
  dateValue: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.label,
    fontWeight: '700',
  },
  selectEndDate: {
    ...AppleDesign.Typography.body,
    color: AppleDesign.Colors.tertiaryLabel,
    fontStyle: 'italic',
  },
  
  // Duration
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.sm,
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingBottom: AppleDesign.Spacing.md,
  },
  durationText: {
    ...AppleDesign.Typography.headline,
    color: AppleDesign.Colors.systemBlue,
    fontWeight: '700',
  },
  
  // Loading
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.sm,
    padding: AppleDesign.Spacing.md,
  },
  loadingText: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.secondaryLabel,
  },
  
  // Legend
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AppleDesign.Spacing.lg,
    paddingHorizontal: AppleDesign.Spacing.lg,
    paddingTop: AppleDesign.Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppleDesign.Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...AppleDesign.Typography.footnote,
    color: AppleDesign.Colors.secondaryLabel,
  },
});


