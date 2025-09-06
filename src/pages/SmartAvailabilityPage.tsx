/**
 * 🎯 SMART AVAILABILITY PAGE
 *
 * Nová stránka pre optimalizovanú dostupnosť vozidiel
 * Nahradí pôvodný AvailabilityPage s lepším UX
 */

import { Container } from '@mui/material';
import React from 'react';

import SmartAvailabilityDashboard from '../components/availability/SmartAvailabilityDashboard';
import Layout from '../components/Layout';

const SmartAvailabilityPage: React.FC = () => {
  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <SmartAvailabilityDashboard />
      </Container>
    </Layout>
  );
};

export default SmartAvailabilityPage;
