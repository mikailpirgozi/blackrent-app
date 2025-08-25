import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Stack,
  Divider,
  Paper,
  Alert,
} from '@mui/material';

import { UnifiedCard } from './index';

// 🎨 UNIFIED DESIGN SYSTEM DEMO
export const UnifiedDemo: React.FC = () => {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        🚧 Unified Demo dočasne nedostupné
      </Typography>
      <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
        UnifiedButton a UnifiedChip komponenty sú dočasne vypnuté kvôli mobile chybe
      </Typography>
      
      <UnifiedCard variant="glass" padding="lg" sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          🎨 UnifiedCard stále funguje
        </Typography>
        <Typography variant="body2">
          Tento komponent je funkčný a môže sa používať
        </Typography>
      </UnifiedCard>
    </Box>
  );
};