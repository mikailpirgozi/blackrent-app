import {
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';

// Types - PRESNE TIE ISTÉ ako v RentalListNew.tsx
interface FilterState {
  // Základné filtre - arrays pre multi-select
  status: string[];
  paymentMethod: string[];
  company: string[];
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
  protocolStatus: string[];

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
  timeFilter: string;

  // Cenové filtre
  priceRange: string;

  // Stav platby
  paymentStatus: string;

  // Zobrazenie
  showOnlyActive: boolean;
  showOnlyOverdue: boolean;
  showOnlyCompleted: boolean;
}

interface RentalFiltersProps {
  // Search state
  searchQuery: string;
  setSearchQuery: (value: string) => void;

  // Filter visibility
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;

  // Advanced filters
  advancedFilters: FilterState;
  handleAdvancedFiltersChange: (filters: FilterState) => void;

  // Helper functions
  toggleFilterValue: (filterKey: keyof FilterState, value: string) => void;
  isFilterValueSelected: (
    filterKey: keyof FilterState,
    value: string
  ) => boolean;
  resetAllFilters: () => void;

  // Unique values for dropdowns
  uniquePaymentMethods: string[];
  uniqueCompanies: string[];
  uniqueStatuses: string[];
  uniqueVehicleBrands: string[];
  uniqueInsuranceCompanies: string[];
  uniqueInsuranceTypes: string[];

  // Filtered rentals count
  filteredRentalsCount: number;
  totalRentalsCount: number;

  // Mobile filters
  showFiltersMobile: boolean;
  setShowFiltersMobile: () => void;
}

export const RentalFilters: React.FC<RentalFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  advancedFilters,
  handleAdvancedFiltersChange,
  toggleFilterValue,
  isFilterValueSelected,
  resetAllFilters,
  uniquePaymentMethods,
  uniqueCompanies,
  uniqueStatuses,
  uniqueVehicleBrands,
  filteredRentalsCount,
  totalRentalsCount,
}) => {
  return (
    <Card
      sx={{
        mb: 3,
        mx: { xs: 1, md: 0 }, // Menší symetrický margin na mobile
        backgroundColor: 'background.paper',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Hlavný riadok s vyhľadávaním a tlačidlami */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', md: 'center' },
            mb: 2,
          }}
        >
          {/* Search Input */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: { xs: 'none', md: 1 },
              minWidth: { xs: '100%', md: 250 },
            }}
          >
            <TextField
              placeholder="Hľadať prenájmy..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'background.default',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, color: 'text.secondary' }}>
                    <SearchIcon fontSize="small" />
                  </Box>
                ),
              }}
            />
          </Box>

          {/* Sorting controls */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              minWidth: { xs: '100%', md: 'auto' },
            }}
          >
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Zoradiť podľa</InputLabel>
              <Select
                value={advancedFilters.sortBy}
                label="Zoradiť podľa"
                onChange={e =>
                  handleAdvancedFiltersChange({
                    ...advancedFilters,
                    sortBy: e.target.value as
                      | 'created_at'
                      | 'start_date'
                      | 'end_date',
                  })
                }
                sx={{
                  borderRadius: 2,
                  backgroundColor: 'background.default',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <MenuItem value="created_at">Dátumu vytvorenia</MenuItem>
                <MenuItem value="start_date">Dátumu začiatku</MenuItem>
                <MenuItem value="end_date">Dátumu konca</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={advancedFilters.sortOrder}
                onChange={e =>
                  handleAdvancedFiltersChange({
                    ...advancedFilters,
                    sortOrder: e.target.value as 'asc' | 'desc',
                  })
                }
                sx={{
                  borderRadius: 2,
                  backgroundColor: 'background.default',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <MenuItem value="desc">
                  {advancedFilters.sortBy === 'created_at'
                    ? 'Najnovšie'
                    : 'Zostupne'}
                </MenuItem>
                <MenuItem value="asc">
                  {advancedFilters.sortBy === 'created_at'
                    ? 'Najstaršie'
                    : 'Vzostupne'}
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Tlačidlá v riadku na mobile, vedľa seba na desktop */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'row', md: 'row' },
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'space-between', md: 'flex-start' },
            }}
          >
            {/* 🚀 KOMPAKTNÉ FILTRE - len ikonka */}
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              size="small"
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: showFilters ? 'primary.main' : 'rgba(0,0,0,0.23)',
                bgcolor: showFilters ? 'primary.main' : 'transparent',
                color: showFilters ? 'white' : 'inherit',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: showFilters ? 'primary.dark' : 'rgba(0,0,0,0.04)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
              }}
            >
              <FilterListIcon fontSize="small" />
            </IconButton>

            {/* Reset Button */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetAllFilters}
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                transition: 'all 0.3s ease',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                px: { xs: 1, md: 2 },
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'white',
                  borderColor: 'error.main',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>

        {/* Search results info */}
        {(searchQuery ||
          (Array.isArray(advancedFilters.status) &&
            advancedFilters.status.length > 0) ||
          (Array.isArray(advancedFilters.paymentMethod) &&
            advancedFilters.paymentMethod.length > 0) ||
          (Array.isArray(advancedFilters.company) &&
            advancedFilters.company.length > 0) ||
          advancedFilters.dateFrom ||
          advancedFilters.dateTo ||
          advancedFilters.priceMin ||
          advancedFilters.priceMax ||
          (Array.isArray(advancedFilters.protocolStatus) &&
            advancedFilters.protocolStatus.length > 0)) && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Zobrazených: {filteredRentalsCount} z {totalRentalsCount} prenájmov
          </Typography>
        )}

        {/* 🚀 RÝCHLE FILTRE - len tie najdôležitejšie */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            mb: 2,
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Rýchle filtre:
            {/* Počet označených filtrov */}
            {(() => {
              const totalSelected =
                (Array.isArray(advancedFilters.paymentMethod)
                  ? advancedFilters.paymentMethod.length
                  : 0) +
                (Array.isArray(advancedFilters.status)
                  ? advancedFilters.status.length
                  : 0) +
                (Array.isArray(advancedFilters.protocolStatus)
                  ? advancedFilters.protocolStatus.length
                  : 0);
              return totalSelected > 0 ? (
                <Chip
                  label={totalSelected}
                  size="small"
                  color="primary"
                  variant="filled"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                  }}
                />
              ) : null;
            })()}
          </Typography>

          {/* Spôsob platby */}
          {uniquePaymentMethods.slice(0, 3).map(method => {
            const getPaymentMethodLabel = (method: string) => {
              switch (method) {
                case 'cash':
                  return 'Hotovosť';
                case 'bank_transfer':
                  return 'Bankový prevod';
                case 'direct_to_owner':
                  return 'Priamo majiteľovi';
                case 'card':
                  return 'Kartou';
                case 'crypto':
                  return 'Kryptomeny';
                default:
                  return method;
              }
            };

            return (
              <Chip
                key={method}
                label={getPaymentMethodLabel(method)}
                size="small"
                variant={
                  isFilterValueSelected('paymentMethod', method)
                    ? 'filled'
                    : 'outlined'
                }
                color={
                  isFilterValueSelected('paymentMethod', method)
                    ? 'primary'
                    : 'default'
                }
                onClick={() => toggleFilterValue('paymentMethod', method)}
                sx={{
                  borderRadius: 2,
                  '&:hover': { transform: 'translateY(-1px)' },
                  transition: 'all 0.2s ease',
                  // Výrazné zvýraznenie označených filtrov
                  ...(isFilterValueSelected('paymentMethod', method) && {
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                    border: '2px solid',
                    borderColor: 'primary.main',
                  }),
                }}
              />
            );
          })}

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Stav prenájmu */}
          <Chip
            label="Aktívne"
            size="small"
            variant={
              isFilterValueSelected('status', 'active') ? 'filled' : 'outlined'
            }
            color={
              isFilterValueSelected('status', 'active') ? 'success' : 'default'
            }
            onClick={() => toggleFilterValue('status', 'active')}
            sx={{
              borderRadius: 2,
              '&:hover': { transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
              // Výrazné zvýraznenie označených filtrov
              ...(isFilterValueSelected('status', 'active') && {
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)',
                border: '2px solid',
                borderColor: 'success.main',
              }),
            }}
          />
          <Chip
            label="Čakajúci"
            size="small"
            variant={
              isFilterValueSelected('status', 'pending') ? 'filled' : 'outlined'
            }
            color={
              isFilterValueSelected('status', 'pending') ? 'warning' : 'default'
            }
            onClick={() => toggleFilterValue('status', 'pending')}
            sx={{
              borderRadius: 2,
              '&:hover': { transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
              // Výrazné zvýraznenie označených filtrov
              ...(isFilterValueSelected('status', 'pending') && {
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(237, 108, 2, 0.3)',
                border: '2px solid',
                borderColor: 'warning.main',
              }),
            }}
          />
          <Chip
            label="Ukončené"
            size="small"
            variant={
              isFilterValueSelected('status', 'completed')
                ? 'filled'
                : 'outlined'
            }
            color={
              isFilterValueSelected('status', 'completed') ? 'info' : 'default'
            }
            onClick={() => toggleFilterValue('status', 'completed')}
            sx={{
              borderRadius: 2,
              '&:hover': { transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
              // Výrazné zvýraznenie označených filtrov
              ...(isFilterValueSelected('status', 'completed') && {
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(2, 136, 209, 0.3)',
                border: '2px solid',
                borderColor: 'info.main',
              }),
            }}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Platobné filtre */}
          <Chip
            label="Zaplatené"
            size="small"
            variant={
              isFilterValueSelected('paymentStatus', 'paid')
                ? 'filled'
                : 'outlined'
            }
            color={
              isFilterValueSelected('paymentStatus', 'paid')
                ? 'success'
                : 'default'
            }
            onClick={() => toggleFilterValue('paymentStatus', 'paid')}
            sx={{
              borderRadius: 2,
              '&:hover': { transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
              ...(isFilterValueSelected('paymentStatus', 'paid') && {
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)',
                border: '2px solid',
                borderColor: 'success.main',
              }),
            }}
          />
          <Chip
            label="Nezaplatené"
            size="small"
            variant={
              isFilterValueSelected('paymentStatus', 'unpaid')
                ? 'filled'
                : 'outlined'
            }
            color={
              isFilterValueSelected('paymentStatus', 'unpaid')
                ? 'error'
                : 'default'
            }
            onClick={() => toggleFilterValue('paymentStatus', 'unpaid')}
            sx={{
              borderRadius: 2,
              '&:hover': { transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
              ...(isFilterValueSelected('paymentStatus', 'unpaid') && {
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)',
                border: '2px solid',
                borderColor: 'error.main',
              }),
            }}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Stavy protokolov */}
          <Chip
            label="Bez protokolu"
            size="small"
            variant={
              isFilterValueSelected('protocolStatus', 'none')
                ? 'filled'
                : 'outlined'
            }
            color={
              isFilterValueSelected('protocolStatus', 'none')
                ? 'warning'
                : 'default'
            }
            onClick={() => toggleFilterValue('protocolStatus', 'none')}
            sx={{
              borderRadius: 2,
              '&:hover': { transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
              ...(isFilterValueSelected('protocolStatus', 'none') && {
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(237, 108, 2, 0.3)',
                border: '2px solid',
                borderColor: 'warning.main',
              }),
            }}
          />
          <Chip
            label="S protokolom"
            size="small"
            variant={
              isFilterValueSelected('protocolStatus', 'with_handover')
                ? 'filled'
                : 'outlined'
            }
            color={
              isFilterValueSelected('protocolStatus', 'with_handover')
                ? 'success'
                : 'default'
            }
            onClick={() => toggleFilterValue('protocolStatus', 'with_handover')}
            sx={{
              borderRadius: 2,
              '&:hover': { transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
              ...(isFilterValueSelected('protocolStatus', 'with_handover') && {
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)',
                border: '2px solid',
                borderColor: 'success.main',
              }),
            }}
          />
        </Box>

        {/* Pokročilé filtre */}
        <Collapse in={showFilters}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FilterListIcon fontSize="small" />
              Filtre
            </Typography>

            <Grid container spacing={3}>
              {/* Spôsob platby */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Spôsob platby</InputLabel>
                  <Select
                    multiple
                    value={
                      Array.isArray(advancedFilters.paymentMethod)
                        ? advancedFilters.paymentMethod
                        : []
                    }
                    onChange={e =>
                      handleAdvancedFiltersChange({
                        ...advancedFilters,
                        paymentMethod: Array.isArray(e.target.value)
                          ? e.target.value
                          : [e.target.value],
                      })
                    }
                    label="Spôsob platby"
                    renderValue={selected => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map(value => {
                          const getPaymentMethodLabel = (method: string) => {
                            switch (method) {
                              case 'cash':
                                return 'Hotovosť';
                              case 'bank_transfer':
                                return 'Bankový prevod';
                              case 'direct_to_owner':
                                return 'Priamo majiteľovi';
                              case 'card':
                                return 'Kartou';
                              case 'crypto':
                                return 'Kryptomeny';
                              default:
                                return method;
                            }
                          };
                          return (
                            <Chip
                              key={value}
                              label={getPaymentMethodLabel(value)}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {uniquePaymentMethods.map(method => {
                      const getPaymentMethodLabel = (method: string) => {
                        switch (method) {
                          case 'cash':
                            return 'Hotovosť';
                          case 'bank_transfer':
                            return 'Bankový prevod';
                          case 'direct_to_owner':
                            return 'Priamo majiteľovi';
                          case 'card':
                            return 'Kartou';
                          case 'crypto':
                            return 'Kryptomeny';
                          default:
                            return method;
                        }
                      };
                      return (
                        <MenuItem key={method} value={method}>
                          {getPaymentMethodLabel(method)}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              {/* Firma */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Firma</InputLabel>
                  <Select
                    multiple
                    value={
                      Array.isArray(advancedFilters.company)
                        ? advancedFilters.company
                        : []
                    }
                    onChange={e =>
                      handleAdvancedFiltersChange({
                        ...advancedFilters,
                        company: Array.isArray(e.target.value)
                          ? e.target.value
                          : [e.target.value],
                      })
                    }
                    label="Firma"
                    renderValue={selected => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map(value => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {uniqueCompanies.map(company => (
                      <MenuItem key={company} value={company}>
                        {company}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Stav prenájmu */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Stav prenájmu</InputLabel>
                  <Select
                    multiple
                    value={
                      Array.isArray(advancedFilters.status)
                        ? advancedFilters.status
                        : []
                    }
                    onChange={e =>
                      handleAdvancedFiltersChange({
                        ...advancedFilters,
                        status: Array.isArray(e.target.value)
                          ? e.target.value
                          : [e.target.value],
                      })
                    }
                    label="Stav prenájmu"
                    renderValue={selected => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map(value => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {uniqueStatuses.map(status => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Dátum od */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  size="small"
                  fullWidth
                  label="Dátum od"
                  type="date"
                  value={advancedFilters.dateFrom || ''}
                  onChange={e =>
                    handleAdvancedFiltersChange({
                      ...advancedFilters,
                      dateFrom: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Dátum do */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  size="small"
                  fullWidth
                  label="Dátum do"
                  type="date"
                  value={advancedFilters.dateTo || ''}
                  onChange={e =>
                    handleAdvancedFiltersChange({
                      ...advancedFilters,
                      dateTo: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
