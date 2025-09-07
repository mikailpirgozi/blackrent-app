import {
  Clear as ClearIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';

interface RentalSearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  filtersComponent: React.ReactNode;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  filteredCount: number;
  totalCount: number;
}

export function RentalSearchAndFilters({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  onClearFilters,
  filtersComponent,
  hasActiveFilters,
  activeFiltersCount,
  filteredCount,
  totalCount,
}: RentalSearchAndFiltersProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Search bar */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <TextField
          fullWidth
          placeholder="Hľadať prenájmy (zákazník, vozidlo, ŠPZ, poznámky...)"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexShrink: 0,
            flexDirection: { xs: 'row', sm: 'row' },
          }}
        >
          <Button
            variant={showFilters ? 'contained' : 'outlined'}
            startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            endIcon={
              hasActiveFilters && (
                <Chip
                  label={activeFiltersCount}
                  size="small"
                  color="primary"
                  sx={{ ml: 0.5, minWidth: 20, height: 20 }}
                />
              )
            }
            onClick={onToggleFilters}
            sx={{ minWidth: 120 }}
          >
            <FilterListIcon sx={{ mr: 0.5 }} />
            Filtre
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ClearIcon />}
              onClick={onClearFilters}
              size="small"
            >
              Vymazať
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter results info */}
      {(hasActiveFilters || searchQuery) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Zobrazených: {filteredCount} z {totalCount} prenájmov
            {searchQuery && ` pre "${searchQuery}"`}
          </Typography>
        </Box>
      )}

      {/* Advanced filters */}
      <Collapse in={showFilters}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <FilterListIcon />
              Pokročilé filtre
            </Typography>
            {filtersComponent}
          </CardContent>
        </Card>
      </Collapse>
    </Box>
  );
}
