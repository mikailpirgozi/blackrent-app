import { UnifiedTypography } from '@/components/ui/UnifiedTypography';
import React from 'react';

import AvailabilityCalendar from '../components/availability/AvailabilityCalendar';

const AvailabilityPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="py-6">
        <UnifiedTypography variant="h4" className="mb-4">
          📅 Prehľad Dostupnosti Áut
        </UnifiedTypography>
        <UnifiedTypography variant="body1" className="text-gray-600 mb-4">
          Kalendárny prehľad dostupnosti všetkých vozidiel v systéme
        </UnifiedTypography>

        <AvailabilityCalendar />
      </div>
    </div>
  );
};

export default AvailabilityPage;
