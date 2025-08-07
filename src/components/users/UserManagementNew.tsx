import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

/**
 * @deprecated This component has been replaced by IntegratedUserManagement.tsx
 * This is kept only for compatibility during the transition period.
 */
const UserManagementNew: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Tento komponent bol nahradený novým integrovaným systémom správy používateľov.
      </Alert>
      <Typography variant="h5" gutterBottom>
        Správa používateľov
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Prosím, použite novú integrovanú správu používateľov v hlavnom menu.
      </Typography>
    </Box>
  );
};

export default UserManagementNew;
