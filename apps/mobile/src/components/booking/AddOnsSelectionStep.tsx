/**
 * Add-Ons Selection Step
 * Third step in booking flow - select additional services
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { AddOnsSelector } from './AddOnsSelector';
import type { AddOn, BookingDates } from '../../types/booking';

interface AddOnsSelectionStepProps {
  dates: BookingDates;
  initialAddOns?: AddOn[];
  onAddOnsChange: (addOns: AddOn[]) => void;
}

export const AddOnsSelectionStep: React.FC<AddOnsSelectionStepProps> = ({
  dates,
  initialAddOns = [],
  onAddOnsChange,
}) => {
  const handleAddOnsChange = useCallback((addOns: AddOn[]) => {
    onAddOnsChange(addOns);
  }, [onAddOnsChange]);

  return (
    <View style={styles.container}>
      <AddOnsSelector
        onAddOnsChange={handleAddOnsChange}
        selectedAddOns={initialAddOns}
        numberOfDays={dates.numberOfDays}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

