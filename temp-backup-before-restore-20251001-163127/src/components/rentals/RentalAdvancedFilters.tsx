import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  Clear as ClearIcon,
  Euro as EuroIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Assignment as ProtocolIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';

export interface FilterState {
  // Základné filtre
  status: string;
  paymentMethod: string;
  company: string;
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
  protocolStatus: string;

  // Rozšírené filtre
  customerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  licensePlate: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  insuranceCompany: string;
  insuranceType: string;

  // Časové filtre
  timeFilter: string; // 'all', 'today', 'week', 'month', 'quarter', 'year', 'custom'

  // Cenové filtre
  priceRange: string; // 'all', 'low', 'medium', 'high', 'custom'

  // Stav platby
  paymentStatus: string; // 'all', 'paid', 'unpaid', 'partial'

  // Zobrazenie
  showOnlyActive: boolean;
  showOnlyOverdue: boolean;
  showOnlyCompleted: boolean;
}

interface RentalAdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset?: () => void;
  onSavePreset?: () => void;
  availableStatuses?: string[];
  availableCompanies?: string[];
  availablePaymentMethods?: string[];
  availableVehicleBrands?: string[];
  availableInsuranceCompanies?: string[];
  availableInsuranceTypes?: string[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const RentalAdvancedFilters: React.FC<RentalAdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset = () => {},
  onSavePreset = () => {},
  availableStatuses = [],
  availableCompanies = [],
  availablePaymentMethods = [],
  availableVehicleBrands = [],
  availableInsuranceCompanies = [],
  availableInsuranceTypes = [],
}) => {
  const handleFilterChange = (key: keyof FilterState, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleQuickFilter = (type: string) => {
    switch (type) {
      case 'today': {
        const today = new Date().toISOString().split('T')[0];
        handleFilterChange('timeFilter', 'today');
        handleFilterChange('dateFrom', today);
        handleFilterChange('dateTo', today);
        break;
      }
      case 'week': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        handleFilterChange('timeFilter', 'week');
        handleFilterChange('dateFrom', weekAgo.toISOString().split('T')[0]);
        handleFilterChange('dateTo', new Date().toISOString().split('T')[0]);
        break;
      }
      case 'month': {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        handleFilterChange('timeFilter', 'month');
        handleFilterChange('dateFrom', monthAgo.toISOString().split('T')[0]);
        handleFilterChange('dateTo', new Date().toISOString().split('T')[0]);
        break;
      }
      case 'active':
        handleFilterChange('showOnlyActive', true);
        handleFilterChange('showOnlyOverdue', false);
        handleFilterChange('showOnlyCompleted', false);
        break;
      case 'overdue':
        handleFilterChange('showOnlyActive', false);
        handleFilterChange('showOnlyOverdue', true);
        handleFilterChange('showOnlyCompleted', false);
        break;
      case 'completed':
        handleFilterChange('showOnlyActive', false);
        handleFilterChange('showOnlyOverdue', false);
        handleFilterChange('showOnlyCompleted', true);
        break;
    }
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: { xs: 2, md: 3 },
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          mb: 3,
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: { xs: '1.1rem', md: '1.25rem' },
          }}
        >
          <UnifiedIcon name="filter" color="primary" />
          Rozšírené filtre
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: { xs: 'center', sm: 'flex-end' },
          }}
        >
          <Tooltip title="Uložiť preset">
            <IconButton size="small" onClick={onSavePreset} color="primary">
              <UnifiedIcon name="save" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vymazať všetky filtre">
            <IconButton size="small" onClick={onReset} color="error">
              <UnifiedIcon name="clear" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Rýchle filtre */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            mb: 2,
            fontWeight: 600,
            fontSize: { xs: '0.875rem', md: '1rem' },
          }}
        >
          Rýchle filtre
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 0.5, md: 1 },
            justifyContent: { xs: 'center', md: 'flex-start' },
          }}
        >
          <Chip
            label="Dnes"
            onClick={() => handleQuickFilter('today')}
            color={filters.timeFilter === 'today' ? 'primary' : 'default'}
            variant={filters.timeFilter === 'today' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="Posledný týždeň"
            onClick={() => handleQuickFilter('week')}
            color={filters.timeFilter === 'week' ? 'primary' : 'default'}
            variant={filters.timeFilter === 'week' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="Posledný mesiac"
            onClick={() => handleQuickFilter('month')}
            color={filters.timeFilter === 'month' ? 'primary' : 'default'}
            variant={filters.timeFilter === 'month' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="Aktívne"
            onClick={() => handleQuickFilter('active')}
            color={filters.showOnlyActive ? 'success' : 'default'}
            variant={filters.showOnlyActive ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="Po termíne"
            onClick={() => handleQuickFilter('overdue')}
            color={filters.showOnlyOverdue ? 'error' : 'default'}
            variant={filters.showOnlyOverdue ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            label="Dokončené"
            onClick={() => handleQuickFilter('completed')}
            color={filters.showOnlyCompleted ? 'default' : 'default'}
            variant={filters.showOnlyCompleted ? 'filled' : 'outlined'}
            size="small"
          />
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Rozšírené filtre v accordionoch */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Základné informácie */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<UnifiedIcon name="chevronDown" />}>
            <Typography
              variant="subtitle1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <UnifiedIcon name="user" fontSize="small" />
              Základné informácie
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stav prenájmu</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={e => handleFilterChange('status', e.target.value)}
                    label="Stav prenájmu"
                  >
                    <MenuItem value="all">Všetky stavy</MenuItem>
                    {availableStatuses.map(status => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Spôsob platby</InputLabel>
                  <Select
                    value={filters.paymentMethod}
                    onChange={e =>
                      handleFilterChange('paymentMethod', e.target.value)
                    }
                    label="Spôsob platby"
                  >
                    <MenuItem value="all">Všetky spôsoby</MenuItem>
                    {availablePaymentMethods.map(method => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Firma/požičovňa</InputLabel>
                  <Select
                    value={filters.company}
                    onChange={e =>
                      handleFilterChange('company', e.target.value)
                    }
                    label="Firma/požičovňa"
                  >
                    <MenuItem value="all">Všetky firmy</MenuItem>
                    {availableCompanies.map(company => (
                      <MenuItem key={company} value={company}>
                        {company}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stav protokolov</InputLabel>
                  <Select
                    value={filters.protocolStatus}
                    onChange={e =>
                      handleFilterChange('protocolStatus', e.target.value)
                    }
                    label="Stav protokolov"
                  >
                    <MenuItem value="all">Všetky</MenuItem>
                    <MenuItem value="handover">Len preberací</MenuItem>
                    <MenuItem value="return">Len vrátenie</MenuItem>
                    <MenuItem value="both">Oba protokoly</MenuItem>
                    <MenuItem value="none">Bez protokolov</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Časové filtre */}
        <Accordion>
          <AccordionSummary expandIcon={<UnifiedIcon name="chevronDown" />}>
            <Typography
              variant="subtitle1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <CalendarIcon fontSize="small" />
              Časové filtre
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Od dátumu"
                  value={filters.dateFrom}
                  onChange={e => handleFilterChange('dateFrom', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Do dátumu"
                  value={filters.dateTo}
                  onChange={e => handleFilterChange('dateTo', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Cenové filtre */}
        <Accordion>
          <AccordionSummary expandIcon={<UnifiedIcon name="chevronDown" />}>
            <Typography
              variant="subtitle1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <EuroIcon fontSize="small" />
              Cenové filtre
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Minimálna cena (€)"
                  value={filters.priceMin}
                  onChange={e => handleFilterChange('priceMin', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <EuroIcon
                        fontSize="small"
                        sx={{ mr: 1, color: 'text.secondary' }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Maximálna cena (€)"
                  value={filters.priceMax}
                  onChange={e => handleFilterChange('priceMax', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <EuroIcon
                        fontSize="small"
                        sx={{ mr: 1, color: 'text.secondary' }}
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Cenový rozsah</InputLabel>
                  <Select
                    value={filters.priceRange}
                    onChange={e =>
                      handleFilterChange('priceRange', e.target.value)
                    }
                    label="Cenový rozsah"
                  >
                    <MenuItem value="all">Všetky ceny</MenuItem>
                    <MenuItem value="low">Nízke (0-50€)</MenuItem>
                    <MenuItem value="medium">Stredné (50-200€)</MenuItem>
                    <MenuItem value="high">Vysoké (200€+)</MenuItem>
                    <MenuItem value="custom">Vlastný rozsah</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Informácie o zákazníkovi */}
        <Accordion>
          <AccordionSummary expandIcon={<UnifiedIcon name="chevronDown" />}>
            <Typography
              variant="subtitle1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <UnifiedIcon name="user" fontSize="small" />
              Zákazník
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Meno zákazníka"
                  value={filters.customerName}
                  onChange={e =>
                    handleFilterChange('customerName', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email zákazníka"
                  value={filters.customerEmail}
                  onChange={e =>
                    handleFilterChange('customerEmail', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Telefón zákazníka"
                  value={filters.customerPhone}
                  onChange={e =>
                    handleFilterChange('customerPhone', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Firma zákazníka"
                  value={filters.customerCompany}
                  onChange={e =>
                    handleFilterChange('customerCompany', e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Informácie o vozidle */}
        <Accordion>
          <AccordionSummary expandIcon={<UnifiedIcon name="chevronDown" />}>
            <Typography
              variant="subtitle1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <CarIcon fontSize="small" />
              Vozidlo
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Značka vozidla</InputLabel>
                  <Select
                    value={filters.vehicleBrand}
                    onChange={e =>
                      handleFilterChange('vehicleBrand', e.target.value)
                    }
                    label="Značka vozidla"
                  >
                    <MenuItem value="all">Všetky značky</MenuItem>
                    {availableVehicleBrands.map(brand => (
                      <MenuItem key={brand} value={brand}>
                        {brand}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Model vozidla"
                  value={filters.vehicleModel}
                  onChange={e =>
                    handleFilterChange('vehicleModel', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="ŠPZ"
                  value={filters.licensePlate}
                  onChange={e =>
                    handleFilterChange('licensePlate', e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Poistka */}
        <Accordion>
          <AccordionSummary expandIcon={<UnifiedIcon name="chevronDown" />}>
            <Typography
              variant="subtitle1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <UnifiedIcon name="protocol" fontSize="small" />
              Poistka
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Poisťovňa</InputLabel>
                  <Select
                    value={filters.insuranceCompany}
                    onChange={e =>
                      handleFilterChange('insuranceCompany', e.target.value)
                    }
                    label="Poisťovňa"
                  >
                    <MenuItem value="all">Všetky poisťovne</MenuItem>
                    {availableInsuranceCompanies.map(company => (
                      <MenuItem key={company} value={company}>
                        {company}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Typ poistky</InputLabel>
                  <Select
                    value={filters.insuranceType}
                    onChange={e =>
                      handleFilterChange('insuranceType', e.target.value)
                    }
                    label="Typ poistky"
                  >
                    <MenuItem value="all">Všetky typy</MenuItem>
                    {availableInsuranceTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Stav platby */}
        <Accordion>
          <AccordionSummary expandIcon={<UnifiedIcon name="chevronDown" />}>
            <Typography
              variant="subtitle1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <PaymentIcon fontSize="small" />
              Stav platby
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stav platby</InputLabel>
                  <Select
                    value={filters.paymentStatus}
                    onChange={e =>
                      handleFilterChange('paymentStatus', e.target.value)
                    }
                    label="Stav platby"
                  >
                    <MenuItem value="all">Všetky stavy</MenuItem>
                    <MenuItem value="paid">Uhradené</MenuItem>
                    <MenuItem value="unpaid">Neuhradené</MenuItem>
                    <MenuItem value="partial">Čiastočne uhradené</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default RentalAdvancedFilters;
