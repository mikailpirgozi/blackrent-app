/**
 * 🎯 SMART AVAILABILITY PAGE
 *
 * Nová stránka pre optimalizovanú dostupnosť vozidiel
 * Nahradí pôvodný AvailabilityPage s lepším UX
 */

import React from 'react';

import SmartAvailabilityDashboard from '../components/availability/SmartAvailabilityDashboard';

const SmartAvailabilityPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-4">
      <SmartAvailabilityDashboard />
    </div>
  );
};

export default SmartAvailabilityPage;
