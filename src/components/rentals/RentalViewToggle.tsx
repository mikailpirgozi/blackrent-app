import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useMediaQuery,
  useTheme,
  Typography,
  Chip
} from '@mui/material';
import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ViewComfy as ViewComfyIcon,
  GridView as GridViewIcon,
  ViewColumn as ViewColumnIcon,
  ViewAgenda as ViewAgendaIcon
} from '@mui/icons-material';

export type ViewMode = 'table' | 'cards' | 'grid' | 'list' | 'compact' | 'detailed';

interface RentalViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount: number;
  filteredCount: number;
  showCounts?: boolean;
}

const RentalViewToggle: React.FC<RentalViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  showCounts = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const viewModes = [
    {
      value: 'table' as ViewMode,
      icon: <ViewListIcon />,
      label: 'Tabuľka',
      description: 'Klasické zobrazenie v tabuľke'
    },
    {
      value: 'cards' as ViewMode,
      icon: <ViewModuleIcon />,
      label: 'Karty',
      description: 'Zobrazenie v kartách'
    },
    {
      value: 'grid' as ViewMode,
      icon: <GridViewIcon />,
      label: 'Mriežka',
      description: 'Kompaktné zobrazenie v mriežke'
    },
    {
      value: 'list' as ViewMode,
      icon: <ViewAgendaIcon />,
      label: 'Zoznam',
      description: 'Jednoduchý zoznam'
    },
    {
      value: 'compact' as ViewMode,
      icon: <ViewComfyIcon />,
      label: 'Kompaktné',
      description: 'Minimálne zobrazenie'
    },
    {
      value: 'detailed' as ViewMode,
      icon: <ViewColumnIcon />,
      label: 'Detailné',
      description: 'Rozšírené informácie'
    }
  ];

  // Na mobile zobrazíme len najdôležitejšie režimy
  const mobileViewModes = viewModes.filter(mode => 
    ['table', 'cards', 'compact'].includes(mode.value)
  );

  const availableModes = isMobile ? mobileViewModes : viewModes;

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: { xs: 1, md: 2 },
      flexWrap: 'wrap'
    }}>
      {/* Počty */}
      {showCounts && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            Zobrazených:
          </Typography>
          <Chip
            label={`${filteredCount} z ${totalCount}`}
            size="small"
            color={filteredCount < totalCount ? 'primary' : 'default'}
            variant={filteredCount < totalCount ? 'filled' : 'outlined'}
            sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
          />
        </Box>
      )}

      {/* Prepínače zobrazenia */}
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, newMode) => {
          if (newMode !== null) {
            onViewModeChange(newMode);
          }
        }}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            px: { xs: 1, md: 2 },
            py: { xs: 0.5, md: 1 },
            minWidth: { xs: 40, md: 'auto' },
            height: { xs: 40, md: 'auto' },
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: 'action.hover',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            },
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'white',
              borderColor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }
          }
        }}
      >
        {availableModes.map((mode) => (
          <Tooltip
            key={mode.value}
            title={mode.description}
            placement="top"
          >
            <ToggleButton value={mode.value}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 0, md: 1 },
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <Box sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                  {mode.icon}
                </Box>
                {!isMobile && (
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {mode.label}
                  </Typography>
                )}
              </Box>
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default RentalViewToggle; 