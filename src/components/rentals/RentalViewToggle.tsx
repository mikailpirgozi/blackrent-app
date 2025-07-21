import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ViewComfy as ViewComfyIcon,
  GridView as GridViewIcon
} from '@mui/icons-material';

export type ViewMode = 'table' | 'cards' | 'grid' | 'list';

interface RentalViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const RentalViewToggle: React.FC<RentalViewToggleProps> = ({
  viewMode,
  onViewModeChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null,
  ) => {
    if (newMode !== null) {
      onViewModeChange(newMode);
    }
  };

  // Na mobile zobrazujeme len relevantné možnosti
  const mobileModes: ViewMode[] = ['cards', 'list'];
  const desktopModes: ViewMode[] = ['table', 'cards', 'grid'];

  const modes = isMobile ? mobileModes : desktopModes;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={handleChange}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            px: 2,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }
          }
        }}
      >
        {modes.includes('table') && (
          <ToggleButton value="table">
            <Tooltip title="Tabuľka">
              <ViewListIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        )}
        
        {modes.includes('cards') && (
          <ToggleButton value="cards">
            <Tooltip title="Karty">
              <ViewModuleIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        )}
        
        {modes.includes('grid') && (
          <ToggleButton value="grid">
            <Tooltip title="Mriežka">
              <GridViewIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        )}
        
        {modes.includes('list') && (
          <ToggleButton value="list">
            <Tooltip title="Zoznam">
              <ViewComfyIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        )}
      </ToggleButtonGroup>
    </Box>
  );
};

export default RentalViewToggle; 