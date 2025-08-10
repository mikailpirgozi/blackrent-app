import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Collapse,
  Grid,
  Paper,
  InputAdornment
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { RentalFiltersInterface } from '../RentalListInfinite';

interface RentalFiltersProps {
  filters: RentalFiltersInterface;
  onFiltersChange: (filters: Partial<RentalFiltersInterface>) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onResetFilters: () => void;
}

export function RentalFilters({
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
  onResetFilters
}: RentalFiltersProps) {
  
  // Predefined options (v reálnej aplikácii by sa načítali z API)
  const statusOptions = ['all', 'active', 'completed', 'pending', 'cancelled'];
  const paymentMethodOptions = ['all', 'cash', 'card', 'transfer', 'other'];
  const companyOptions = ['all', 'BlackRent Official', 'Miki', '3ple digit']; // Placeholder
  const vehicleBrandOptions = ['all', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Iveco']; // Placeholder

  return (
    <Box mb={3}>
      {/* Search and filter toggle */}
      <Box display="flex" gap={2} mb={2}>
        <TextField
          fullWidth
          placeholder="Hľadať prenájmy..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
        />
        
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={onToggleFilters}
          sx={{ minWidth: 120 }}
        >
          Filtre
        </Button>

        {Object.values(filters).some(v => v !== '' && v !== 'all') && (
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={onResetFilters}
            color="secondary"
          >
            Vymazať
          </Button>
        )}
      </Box>

      {/* Advanced filters */}
      <Collapse in={showFilters}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Date filters */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Dátumový filter</InputLabel>
                <Select
                  value={filters.dateFilter}
                  label="Dátumový filter"
                  onChange={(e) => onFiltersChange({ dateFilter: e.target.value })}
                >
                  <MenuItem value="all">Všetky dátumy</MenuItem>
                  <MenuItem value="today">Dnes</MenuItem>
                  <MenuItem value="week">Tento týždeň</MenuItem>
                  <MenuItem value="month">Tento mesiac</MenuItem>
                  <MenuItem value="custom">Vlastný rozsah</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Custom date range */}
            {filters.dateFilter === 'custom' && (
              <>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Od dátumu"
                    value={filters.dateFrom}
                    onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Do dátumu"
                    value={filters.dateTo}
                    onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            {/* Status filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Stav</InputLabel>
                <Select
                  value={filters.status}
                  label="Stav"
                  onChange={(e) => onFiltersChange({ status: e.target.value })}
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status} value={status}>
                      {status === 'all' ? 'Všetky stavy' : status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Company filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Firma</InputLabel>
                <Select
                  value={filters.company}
                  label="Firma"
                  onChange={(e) => onFiltersChange({ company: e.target.value })}
                >
                  {companyOptions.map(company => (
                    <MenuItem key={company} value={company}>
                      {company === 'all' ? 'Všetky firmy' : company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Payment method */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Spôsob platby</InputLabel>
                <Select
                  value={filters.paymentMethod}
                  label="Spôsob platby"
                  onChange={(e) => onFiltersChange({ paymentMethod: e.target.value })}
                >
                  {paymentMethodOptions.map(method => (
                    <MenuItem key={method} value={method}>
                      {method === 'all' ? 'Všetky spôsoby' : method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Vehicle brand */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Značka vozidla</InputLabel>
                <Select
                  value={filters.vehicleBrand}
                  label="Značka vozidla"
                  onChange={(e) => onFiltersChange({ vehicleBrand: e.target.value })}
                >
                  {vehicleBrandOptions.map(brand => (
                    <MenuItem key={brand} value={brand}>
                      {brand === 'all' ? 'Všetky značky' : brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Price range */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Min. cena"
                value={filters.priceMin}
                onChange={(e) => onFiltersChange({ priceMin: e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">€</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Max. cena"
                value={filters.priceMax}
                onChange={(e) => onFiltersChange({ priceMax: e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">€</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
    </Box>
  );
}
