import React from 'react';
import {
  Box,
  Collapse,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  Button,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { format, subDays, addDays, startOfDay, endOfDay } from 'date-fns';

interface RentalAdvancedFiltersProps {
  open: boolean;
  onClose: () => void;
  
  // Filter states
  filters: {
    dateFrom: string;
    dateTo: string;
    vehicleBrand: string;
    vehicleModel: string;
    licensePlate: string;
    company: string;
    customerName: string;
    customerEmail: string;
    priceFrom: string;
    priceTo: string;
    paymentMethod: string;
    paymentStatus: string;
    hasHandoverProtocol: boolean;
    hasReturnProtocol: boolean;
    rentalStatus: string;
  };
  
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  
  // Data for dropdowns
  vehicles: any[];
  companies: string[];
  paymentMethods: { value: string; label: string }[];
}

const RentalAdvancedFilters: React.FC<RentalAdvancedFiltersProps> = ({
  open,
  onClose,
  filters,
  onFilterChange,
  onClearFilters,
  vehicles,
  companies,
  paymentMethods
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== false
  ).length;

  const quickDateFilters = [
    { label: 'Dnes', value: 'today', from: format(startOfDay(new Date()), 'yyyy-MM-dd'), to: format(endOfDay(new Date()), 'yyyy-MM-dd') },
    { label: 'Tento týždeň', value: 'week', from: format(startOfDay(subDays(new Date(), 7)), 'yyyy-MM-dd'), to: format(endOfDay(new Date()), 'yyyy-MM-dd') },
    { label: 'Tento mesiac', value: 'month', from: format(startOfDay(subDays(new Date(), 30)), 'yyyy-MM-dd'), to: format(endOfDay(new Date()), 'yyyy-MM-dd') },
    { label: 'Zajtra', value: 'tomorrow', from: format(startOfDay(addDays(new Date(), 1)), 'yyyy-MM-dd'), to: format(endOfDay(addDays(new Date(), 1)), 'yyyy-MM-dd') },
  ];

  const handleQuickDateFilter = (from: string, to: string) => {
    onFilterChange('dateFrom', from);
    onFilterChange('dateTo', to);
  };

  return (
    <Collapse in={open}>
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon />
              <Typography variant="h6">
                Rozšírené filtre
              </Typography>
              {activeFiltersCount > 0 && (
                <Chip 
                  label={activeFiltersCount} 
                  size="small" 
                  color="primary" 
                />
              )}
            </Box>
            <Button
              startIcon={<ClearIcon />}
              onClick={onClearFilters}
              size="small"
              variant="outlined"
            >
              Vyčistiť
            </Button>
          </Box>

          <Grid container spacing={2}>
            {/* Rýchle dátumové filtre */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Rýchle dátumové filtre
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {quickDateFilters.map((filter) => (
                  <Chip
                    key={filter.value}
                    label={filter.label}
                    onClick={() => handleQuickDateFilter(filter.from, filter.to)}
                    variant="outlined"
                    size="small"
                    clickable
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            {/* Dátumové filtre */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dátum od"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Dátum do"
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFilterChange('dateTo', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Vozidlo */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Značka vozidla"
                value={filters.vehicleBrand}
                onChange={(e) => onFilterChange('vehicleBrand', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Model vozidla"
                value={filters.vehicleModel}
                onChange={(e) => onFilterChange('vehicleModel', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ŠPZ"
                value={filters.licensePlate}
                onChange={(e) => onFilterChange('licensePlate', e.target.value)}
                size="small"
              />
            </Grid>

            {/* Firma a zákazník */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Firma</InputLabel>
                <Select
                  value={filters.company}
                  onChange={(e) => onFilterChange('company', e.target.value)}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Meno zákazníka"
                value={filters.customerName}
                onChange={(e) => onFilterChange('customerName', e.target.value)}
                size="small"
              />
            </Grid>

            {/* Cena */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cena od (€)"
                type="number"
                value={filters.priceFrom}
                onChange={(e) => onFilterChange('priceFrom', e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <span>€</span>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cena do (€)"
                type="number"
                value={filters.priceTo}
                onChange={(e) => onFilterChange('priceTo', e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <span>€</span>,
                }}
              />
            </Grid>

            {/* Platba */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Spôsob platby</InputLabel>
                <Select
                  value={filters.paymentMethod}
                  onChange={(e) => onFilterChange('paymentMethod', e.target.value)}
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Stav platby</InputLabel>
                <Select
                  value={filters.paymentStatus}
                  onChange={(e) => onFilterChange('paymentStatus', e.target.value)}
                  label="Stav platby"
                >
                  <MenuItem value="">Všetky</MenuItem>
                  <MenuItem value="paid">Zaplatené</MenuItem>
                  <MenuItem value="unpaid">Nezaplatené</MenuItem>
                  <MenuItem value="partial">Čiastočne zaplatené</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Protokoly */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Protokoly
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.hasHandoverProtocol}
                      onChange={(e) => onFilterChange('hasHandoverProtocol', e.target.checked)}
                      size="small"
                    />
                  }
                  label="S protokolom prevzatia"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.hasReturnProtocol}
                      onChange={(e) => onFilterChange('hasReturnProtocol', e.target.checked)}
                      size="small"
                    />
                  }
                  label="S protokolom vrátenia"
                />
              </Box>
            </Grid>

            {/* Stav prenájmu */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Stav prenájmu</InputLabel>
                <Select
                  value={filters.rentalStatus}
                  onChange={(e) => onFilterChange('rentalStatus', e.target.value)}
                  label="Stav prenájmu"
                >
                  <MenuItem value="">Všetky</MenuItem>
                  <MenuItem value="active">Aktívne</MenuItem>
                  <MenuItem value="completed">Ukončené</MenuItem>
                  <MenuItem value="cancelled">Zrušené</MenuItem>
                  <MenuItem value="future">Budúce</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Collapse>
  );
};

export default RentalAdvancedFilters; 