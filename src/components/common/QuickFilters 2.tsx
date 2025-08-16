/**
 * ⚡ QUICK FILTERS
 * 
 * Reusable quick filter chips pre časté vyhľadávania
 */

import React, { memo } from 'react';
import {
  Box,
  Chip,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Star as PopularIcon
} from '@mui/icons-material';
import type { QuickFilter } from '../../hooks/useEnhancedSearch';

interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilter: string | null;
  onFilterSelect: (filterId: string | null) => void;
  showTitle?: boolean;
  compact?: boolean;
  maxVisible?: number;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  activeFilter,
  onFilterSelect,
  showTitle = true,
  compact = false,
  maxVisible
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  if (!filters || filters.length === 0) {
    return null;
  }

  // Limit visible filters on mobile
  const visibleFilters = maxVisible && isMobile 
    ? filters.slice(0, maxVisible)
    : filters;

  const handleFilterClick = (filterId: string) => {
    if (activeFilter === filterId) {
      onFilterSelect(null); // Deselect if already active
    } else {
      onFilterSelect(filterId);
    }
  };

  return (
    <Box sx={{ mb: compact ? 1 : 2 }}>
      {showTitle && (
        <Typography 
          variant={compact ? "caption" : "body2"} 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            mb: 1,
            color: 'text.secondary',
            fontWeight: 600
          }}
        >
          <FilterIcon sx={{ fontSize: 16, mr: 0.5 }} />
          Rýchle filtre:
        </Typography>
      )}
      
      <Stack 
        direction="row" 
        spacing={1} 
        sx={{ 
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        {visibleFilters.map((filter) => (
          <Tooltip 
            key={filter.id}
            title={filter.count ? `${filter.count} výsledkov` : filter.label}
            placement="top"
          >
            <Chip
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {filter.label}
                  {filter.count && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem',
                        opacity: 0.8,
                        fontWeight: 600
                      }}
                    >
                      ({filter.count})
                    </Typography>
                  )}
                </Box>
              }
              size={compact || isMobile ? 'small' : 'medium'}
              color={activeFilter === filter.id ? filter.color : 'default'}
              variant={activeFilter === filter.id ? 'filled' : 'outlined'}
              onClick={() => handleFilterClick(filter.id)}
              onDelete={activeFilter === filter.id ? () => onFilterSelect(null) : undefined}
              deleteIcon={<ClearIcon />}
              sx={{
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: theme.shadows[2],
                  borderColor: activeFilter === filter.id 
                    ? theme.palette[filter.color].main 
                    : theme.palette.primary.main
                },
                '&:active': {
                  transform: 'translateY(0px)'
                },
                // Highlight popular filters
                ...(filter.count && filter.count > 10 && {
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.warning.main,
                    display: activeFilter !== filter.id ? 'block' : 'none'
                  }
                })
              }}
            />
          </Tooltip>
        ))}
        
        {/* Show more indicator */}
        {maxVisible && isMobile && filters.length > maxVisible && (
          <Chip
            label={`+${filters.length - maxVisible}`}
            size="small"
            variant="outlined"
            sx={{ 
              opacity: 0.6,
              cursor: 'default'
            }}
          />
        )}
      </Stack>
    </Box>
  );
};

// Pre-defined quick filters pre rôzne entity
export const RENTAL_QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'active',
    label: 'Aktívne',
    value: 'active',
    color: 'success',
    icon: '🟢'
  },
  {
    id: 'pending',
    label: 'Čakajúce',
    value: 'pending', 
    color: 'warning',
    icon: '⏳'
  },
  {
    id: 'overdue',
    label: 'Preterminované',
    value: 'overdue',
    color: 'error',
    icon: '⚠️'
  },
  {
    id: 'this_month',
    label: 'Tento mesiac',
    value: 'this_month',
    color: 'primary',
    icon: '📅'
  },
  {
    id: 'high_value',
    label: 'Vysoká suma',
    value: 'high_value',
    color: 'secondary',
    icon: '💰'
  }
];

export const VEHICLE_QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'available',
    label: 'Dostupné',
    value: 'available',
    color: 'success',
    icon: '✅'
  },
  {
    id: 'rented',
    label: 'Prenajaté',
    value: 'rented',
    color: 'warning',
    icon: '🚗'
  },
  {
    id: 'maintenance',
    label: 'Servis',
    value: 'maintenance', 
    color: 'error',
    icon: '🔧'
  },
  {
    id: 'premium',
    label: 'Premium',
    value: 'premium',
    color: 'secondary',
    icon: '⭐'
  }
];

export const CUSTOMER_QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'vip',
    label: 'VIP',
    value: 'vip',
    color: 'secondary',
    icon: '👑'
  },
  {
    id: 'active_rentals',
    label: 'Aktívni',
    value: 'active_rentals',
    color: 'success',
    icon: '🎯'
  },
  {
    id: 'new',
    label: 'Noví',
    value: 'new',
    color: 'info',
    icon: '🆕'
  },
  {
    id: 'corporate',
    label: 'Firemní',
    value: 'corporate',
    color: 'primary',
    icon: '🏢'
  }
];

export default memo(QuickFilters);