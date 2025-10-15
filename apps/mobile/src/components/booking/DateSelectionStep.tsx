/**
 * Date Selection Step
 * First step in booking flow - select pickup and return dates
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DateRangePicker, type DateRange } from './DateRangePicker';
import type { BookingDates } from '../../types/booking';
import { differenceInDays } from 'date-fns';

interface DateSelectionStepProps {
  vehicleId: string;
  initialDates?: BookingDates;
  onDatesChange: (dates: BookingDates | null) => void;
  unavailableDates?: string[];
}

export const DateSelectionStep: React.FC<DateSelectionStepProps> = ({
  vehicleId,
  initialDates,
  onDatesChange,
  unavailableDates = [],
}) => {
  const [selectedRange, setSelectedRange] = useState<DateRange>({
    startDate: initialDates?.startDate || null,
    endDate: initialDates?.endDate || null,
  });

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setSelectedRange(range);

    if (range.startDate && range.endDate) {
      const numberOfDays = differenceInDays(range.endDate, range.startDate);
      onDatesChange({
        startDate: range.startDate,
        endDate: range.endDate,
        numberOfDays,
      });
    } else {
      onDatesChange(null);
    }
  }, [onDatesChange]);

  return (
    <View style={styles.container}>
      <DateRangePicker
        onDateRangeChange={handleDateRangeChange}
        unavailableDates={unavailableDates}
        minRentalDays={1}
        maxRentalDays={90}
        initialStartDate={selectedRange.startDate || undefined}
        initialEndDate={selectedRange.endDate || undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

