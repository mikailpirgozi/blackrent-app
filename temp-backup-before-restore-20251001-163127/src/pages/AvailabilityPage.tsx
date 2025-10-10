import { Box, Container, Typography } from '@mui/material';
import React from 'react';

import AvailabilityCalendar from '../components/availability/AvailabilityCalendar';

const AvailabilityPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Typography variant="h4" gutterBottom>
          📅 Prehľad Dostupnosti Áut
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Kalendárny prehľad dostupnosti všetkých vozidiel v systéme
        </Typography>

        <AvailabilityCalendar />
      </Box>
    </Container>
  );
};

export default AvailabilityPage;
