/**
 * Insurance Selection Step
 * Second step in booking flow - select insurance coverage
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { InsuranceSelector } from './InsuranceSelector';
import type { Insurance, BookingDates } from '../../types/booking';

interface InsuranceSelectionStepProps {
  dates: BookingDates;
  initialInsurance?: Insurance;
  onInsuranceChange: (insurance: Insurance | null) => void;
}

export const InsuranceSelectionStep: React.FC<InsuranceSelectionStepProps> = ({
  dates,
  initialInsurance,
  onInsuranceChange,
}) => {
  const handleInsuranceSelect = useCallback((insurance: Insurance | null) => {
    onInsuranceChange(insurance);
  }, [onInsuranceChange]);

  return (
    <View style={styles.container}>
      <InsuranceSelector
        onInsuranceSelect={handleInsuranceSelect}
        selectedInsurance={initialInsurance}
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

