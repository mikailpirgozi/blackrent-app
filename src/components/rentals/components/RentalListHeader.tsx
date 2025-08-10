import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface RentalListHeaderProps {
  filteredRentalsCount: number;
  activeRentalsCount: number;
  waitingForReturnCount: number;
  onAddRental: () => void;
  onExport: () => void;
  onRefresh: () => void;
}

export function RentalListHeader({
  filteredRentalsCount,
  activeRentalsCount,
  waitingForReturnCount,
  onAddRental,
  onExport,
  onRefresh
}: RentalListHeaderProps) {
  return (
    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', md: 'center' },
          gap: { xs: 2, md: 0 }
        }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ 
              mb: 1,
              fontSize: { xs: '1.75rem', md: '2.125rem' }
            }}>
              Prenájmy
            </Typography>
            <Typography variant="body1" sx={{ 
              opacity: 0.9,
              fontSize: { xs: '0.875rem', md: '1rem' }
            }}>
              Správa a prehľad všetkých prenájmov vozidiel
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }, 
            gap: 2 
          }}>
            {/* Stats */}
            <Box sx={{ 
              textAlign: { xs: 'center', md: 'right' }, 
              mr: { xs: 0, md: 2 },
              mb: { xs: 2, md: 0 }
            }}>
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 2, md: 3 },
                justifyContent: { xs: 'center', md: 'flex-end' }
              }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {filteredRentalsCount}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    zobrazených
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="success.light">
                    {activeRentalsCount}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    aktívnych
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="warning.light">
                    {waitingForReturnCount}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    čakajú na vrátenie
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Action buttons */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              alignItems: 'stretch'
            }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={onAddRental}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  minWidth: { xs: 'auto', sm: 140 }
                }}
                size="small"
              >
                Nový prenájom
              </Button>
              
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'rgba(255,255,255,0.5)',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
                size="small"
              >
                Obnoviť
              </Button>
              
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ExportIcon />}
                onClick={onExport}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'rgba(255,255,255,0.5)',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
                size="small"
              >
                Export CSV
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
