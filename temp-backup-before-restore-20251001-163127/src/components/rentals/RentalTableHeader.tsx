/**
 * 📊 RENTAL TABLE HEADER
 *
 * Memoized header komponent pre RentalList tabuľku
 */

import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';
import React, { memo } from 'react';

import { PrimaryButton } from '../ui';

interface RentalTableHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onAddRental: () => void;
  onRefresh: () => void;
  onExport: () => void;
  isLoading?: boolean;
  totalCount: number;
  filteredCount: number;
}

const RentalTableHeader: React.FC<RentalTableHeaderProps> = ({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  onAddRental,
  onRefresh,
  onExport,
  isLoading = false,
  totalCount,
  filteredCount,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
        mb: 3,
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 3,
        boxShadow: `0 2px 12px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'}`,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Title and Stats */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: 'primary.main' }}
        >
          📋 Rezervácie
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {filteredCount !== totalCount
            ? `${filteredCount} z ${totalCount}`
            : `${totalCount} celkom`}
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box
        sx={{
          flex: isMobile ? '1' : '0 0 300px',
          order: isMobile ? 1 : 0,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Vyhľadať rezervácie..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <UnifiedIcon name="search" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  disabled={isLoading}
                >
                  <UnifiedIcon name="clear" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: theme.palette.background.default,
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              },
            },
          }}
        />
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          order: isMobile ? 2 : 0,
          justifyContent: isMobile ? 'center' : 'flex-end',
        }}
      >
        <Tooltip title="Filtrovať">
          <IconButton
            onClick={onToggleFilters}
            color={showFilters ? 'primary' : 'default'}
            disabled={isLoading}
            sx={{
              backgroundColor: showFilters
                ? theme.palette.primary.main + '20'
                : 'transparent',
              '&:hover': {
                backgroundColor: showFilters
                  ? theme.palette.primary.main + '30'
                  : theme.palette.action.hover,
              },
            }}
          >
            <UnifiedIcon name="filter" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Obnoviť">
          <IconButton onClick={onRefresh} disabled={isLoading}>
            <UnifiedIcon name="refresh" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Exportovať">
          <IconButton onClick={onExport} disabled={isLoading}>
            <UnifiedIcon name="export" />
          </IconButton>
        </Tooltip>

        <PrimaryButton
          startIcon={<UnifiedIcon name="add" />}
          onClick={onAddRental}
          disabled={isLoading}
          sx={{ px: 3 }}
        >
          {isMobile ? 'Pridať' : 'Nová rezervácia'}
        </PrimaryButton>
      </Box>
    </Box>
  );
};

// Export memoized component
export default memo(RentalTableHeader);
