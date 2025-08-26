import React from 'react';
import {
  Box,
  Button
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';


interface RentalActionsProps {
  isMobile: boolean;
  handleAdd: () => void;
}

export const RentalActions: React.FC<RentalActionsProps> = ({
  isMobile,
  handleAdd
}) => {

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: { xs: 1, md: 2 }, 
      mb: 3,
      mx: { xs: 2, md: 0 }, // Margin len na mobile pre správne centrovanie
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      {/* Pridať prenájom */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{
          minWidth: { xs: 'auto', md: '140px' },
          fontSize: { xs: '0.8rem', md: '0.875rem' },
          px: { xs: 2, md: 3 },
          py: { xs: 1, md: 1.5 },
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(25,118,210,0.3)'
        }}
      >
        {isMobile ? 'Pridať' : 'Nový prenájom'}
      </Button>
    </Box>
  );
};
