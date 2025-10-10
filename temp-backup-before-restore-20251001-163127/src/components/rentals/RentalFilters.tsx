import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { memo } from 'react';

import type { PaymentMethod, Vehicle } from '../../types';

interface RentalFiltersProps {
  // Basic filters
  filterVehicle: string;
  setFilterVehicle: (value: string) => void;
  filterCompany: string;
  setFilterCompany: (value: string) => void;
  filterCustomer: string;
  setFilterCustomer: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterPaid: string;
  setFilterPaid: (value: string) => void;
  filterDateFrom: string;
  setFilterDateFrom: (value: string) => void;
  filterDateTo: string;
  setFilterDateTo: (value: string) => void;
  filterPaymentMethod: string;
  setFilterPaymentMethod: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;

  // Priority filters
  showActive: boolean;
  setShowActive: (value: boolean) => void;
  showTodayReturns: boolean;
  setShowTodayReturns: (value: boolean) => void;
  showTomorrowReturns: boolean;
  setShowTomorrowReturns: (value: boolean) => void;
  showUnconfirmed: boolean;
  setShowUnconfirmed: (value: boolean) => void;
  showFuture: boolean;
  setShowFuture: (value: boolean) => void;
  showOldConfirmed: boolean;
  setShowOldConfirmed: (value: boolean) => void;
  showConfirmed: boolean;
  setShowConfirmed: (value: boolean) => void;
  showAll: boolean;
  setShowAll: (value: boolean) => void;

  // Data
  vehicles: Vehicle[];
  companies: string[];

  // Mobile
  isMobile: boolean;
  showFiltersMobile: boolean;
  setShowFiltersMobile: (value: boolean) => void;
}

const RentalFilters = memo<RentalFiltersProps>(
  ({
    filterVehicle,
    setFilterVehicle,
    filterCompany,
    setFilterCompany,
    filterCustomer,
    setFilterCustomer,
    filterStatus,
    // setFilterStatus, // TODO: Implement status filter functionality
    filterPaid,
    setFilterPaid,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    filterPaymentMethod,
    setFilterPaymentMethod,
    searchQuery,
    setSearchQuery,
    showActive,
    setShowActive,
    showTodayReturns,
    setShowTodayReturns,
    showTomorrowReturns,
    setShowTomorrowReturns,
    showUnconfirmed,
    setShowUnconfirmed,
    showFuture,
    setShowFuture,
    showOldConfirmed,
    setShowOldConfirmed,
    showConfirmed,
    setShowConfirmed,
    showAll,
    setShowAll,
    vehicles,
    companies,
    isMobile,
    showFiltersMobile,
    setShowFiltersMobile,
  }) => {
    const paymentMethods: { value: PaymentMethod; label: string }[] = [
      { value: 'cash', label: 'Hotovosť' },
      { value: 'bank_transfer', label: 'Bankový prevod' },
      { value: 'vrp', label: 'VRP' },
      { value: 'direct_to_owner', label: 'Priamo majiteľovi' },
    ];

    const activeFiltersCount = [
      filterVehicle,
      filterCompany,
      filterCustomer,
      filterStatus,
      filterPaid,
      filterDateFrom,
      filterDateTo,
      filterPaymentMethod,
      searchQuery,
    ].filter(filter => filter !== '').length;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          {/* Mobile filter toggle */}
          {isMobile && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UnifiedIcon name="filter" />
                <Typography variant="h6">Filtre</Typography>
                {activeFiltersCount > 0 && (
                  <Chip
                    label={activeFiltersCount}
                    size="small"
                    color="primary"
                  />
                )}
              </Box>
              <IconButton
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                size="small"
              >
                {showFiltersMobile ? <UnifiedIcon name="chevronUp" /> : <UnifiedIcon name="chevronDown" />}
              </IconButton>
            </Box>
          )}

          {/* Priority Filters */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Prioritné filtre
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showAll}
                    onChange={e => setShowAll(e.target.checked)}
                    size="small"
                  />
                }
                label="Zobraziť všetko"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showActive}
                    onChange={e => setShowActive(e.target.checked)}
                    size="small"
                  />
                }
                label="Aktívne"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showTodayReturns}
                    onChange={e => setShowTodayReturns(e.target.checked)}
                    size="small"
                  />
                }
                label="Dnešné vrátenia"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showTomorrowReturns}
                    onChange={e => setShowTomorrowReturns(e.target.checked)}
                    size="small"
                  />
                }
                label="Zajtrajšie vrátenia"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showUnconfirmed}
                    onChange={e => setShowUnconfirmed(e.target.checked)}
                    size="small"
                  />
                }
                label="Nepotvrdené"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showFuture}
                    onChange={e => setShowFuture(e.target.checked)}
                    size="small"
                  />
                }
                label="Budúce"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showOldConfirmed}
                    onChange={e => setShowOldConfirmed(e.target.checked)}
                    size="small"
                  />
                }
                label="Staré potvrdené"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showConfirmed}
                    onChange={e => setShowConfirmed(e.target.checked)}
                    size="small"
                  />
                }
                label="Potvrdené"
              />
            </Box>
          </Box>

          {/* Detailed Filters */}
          <Collapse in={!isMobile || showFiltersMobile}>
            <Grid container spacing={2}>
              {/* Search */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Vyhľadať"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  size="small"
                  placeholder="Meno zákazníka, ŠPZ, poznámka..."
                />
              </Grid>

              {/* Vehicle Filter */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vozidlo</InputLabel>
                  <Select
                    value={filterVehicle}
                    onChange={e => setFilterVehicle(e.target.value)}
                    label="Vozidlo"
                  >
                    <MenuItem value="">Všetky vozidlá</MenuItem>
                    {vehicles.map(vehicle => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Company Filter */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Firma</InputLabel>
                  <Select
                    value={filterCompany}
                    onChange={e => setFilterCompany(e.target.value)}
                    label="Firma"
                  >
                    <MenuItem value="">Všetky firmy</MenuItem>
                    {companies.map(company => (
                      <MenuItem key={company} value={company}>
                        {company}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Customer Filter */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Zákazník"
                  value={filterCustomer}
                  onChange={e => setFilterCustomer(e.target.value)}
                  size="small"
                />
              </Grid>

              {/* Payment Method Filter */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Spôsob platby</InputLabel>
                  <Select
                    value={filterPaymentMethod}
                    onChange={e => setFilterPaymentMethod(e.target.value)}
                    label="Spôsob platby"
                  >
                    <MenuItem value="">Všetky</MenuItem>
                    {paymentMethods.map(method => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Paid Status Filter */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stav platby</InputLabel>
                  <Select
                    value={filterPaid}
                    onChange={e => setFilterPaid(e.target.value)}
                    label="Stav platby"
                  >
                    <MenuItem value="">Všetky</MenuItem>
                    <MenuItem value="paid">Zaplatené</MenuItem>
                    <MenuItem value="unpaid">Nezaplatené</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Date From */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Dátum od"
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* Date To */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Dátum do"
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
    );
  }
);

RentalFilters.displayName = 'RentalFilters';

export default RentalFilters;
