/**
 * 🎯 SMART AVAILABILITY PAGE
 *
 * Nová stránka pre optimalizovanú dostupnosť vozidiel
 * Nahradí pôvodný AvailabilityPage s lepším UX
 */

import { Container } from '@mui/material';
import React from 'react';

import SmartAvailabilityDashboard from '../components/availability/SmartAvailabilityDashboard';

const SmartAvailabilityPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <SmartAvailabilityDashboard />
    </Container>
  );
};

export default SmartAvailabilityPage;
