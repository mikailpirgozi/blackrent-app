import { Add as AddIcon } from '@mui/icons-material';
import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import { Box, Button } from '@mui/material';
import React from 'react';

import { Can } from '../../common/PermissionGuard';

interface VehicleActionsProps {
  loading: boolean;
  isMobile: boolean;
  onAddVehicle: () => void;
  onCreateCompany: () => void;
  onCreateInvestor: () => void;
}

const VehicleActions: React.FC<VehicleActionsProps> = ({
  loading,
  isMobile,
  onAddVehicle,
  onCreateCompany,
  onCreateInvestor,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
        alignItems: isMobile ? 'stretch' : 'center',
        mb: 3,
      }}
    >
      {/* Add Vehicle Button */}
      <Can create="vehicles">
        <Button
          variant="contained"
          startIcon={<UnifiedIcon name="add" />}
          onClick={onAddVehicle}
          disabled={loading}
          sx={{
            bgcolor: '#1976d2',
            '&:hover': { bgcolor: '#1565c0' },
            borderRadius: 2,
            px: 3,
            py: 1,
          }}
        >
          Nové vozidlo
        </Button>
      </Can>

      {/* Create Company Button */}
      <Button
        variant="outlined"
        startIcon={<UnifiedIcon name="add" />}
        onClick={onCreateCompany}
        disabled={loading}
        sx={{
          borderColor: '#2196f3',
          color: '#2196f3',
          '&:hover': {
            borderColor: '#1976d2',
            color: '#1976d2',
            bgcolor: 'rgba(33, 150, 243, 0.04)',
          },
          borderRadius: 2,
          px: 3,
        }}
      >
        🏢 Pridať firmu
      </Button>

      {/* Create Investor Button */}
      <Button
        variant="outlined"
        startIcon={<UnifiedIcon name="add" />}
        onClick={onCreateInvestor}
        disabled={loading}
        sx={{
          borderColor: '#2196f3',
          color: '#2196f3',
          '&:hover': {
            borderColor: '#1976d2',
            color: '#1976d2',
            bgcolor: 'rgba(33, 150, 243, 0.04)',
          },
          borderRadius: 2,
          px: 3,
        }}
      >
        👤 Pridať spoluinvestora
      </Button>
    </Box>
  );
};

export default VehicleActions;
