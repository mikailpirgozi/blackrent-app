import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Collapse,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
// Using HTML5 date inputs instead of MUI date pickers for simplicity
import {
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  CheckCircle as AvailableIcon,
  Cancel as RentedIcon,
  Build as MaintenanceIcon,
  Refresh as RefreshIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandLess as CollapseIcon,
  ExpandMore as ExpandIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { sk } from 'date-fns/locale';
import { API_BASE_URL } from '../../services/api';

interface VehicleAvailability {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  status: 'available' | 'rented' | 'maintenance';
  rentalId?: string;
  customerName?: string;
}

interface CalendarDay {
  date: string;
  vehicles: VehicleAvailability[];
}

const AvailabilityCalendar: React.FC = () => {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // View mode: 'navigation' (prev/next months) or 'range' (custom date range)
  const [viewMode, setViewMode] = useState<'navigation' | 'range'>('navigation');
  const [fromDate, setFromDate] = useState<Date | null>(new Date());
  const [toDate, setToDate] = useState<Date | null>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // +30 days
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchCalendarData = async (forceMonth = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Dočasne používame production API aj v development mode kým nevyriešime lokálny backend
      let apiUrl = `${API_BASE_URL}/availability/calendar`;
      
      if (viewMode === 'range' && fromDate && toDate) {
        // Custom date range mode
        const startDate = format(fromDate, 'yyyy-MM-dd');
        const endDate = format(toDate, 'yyyy-MM-dd');
        apiUrl += `?startDate=${startDate}&endDate=${endDate}`;
        console.log('🗓️ Fetching calendar data for range:', { startDate, endDate });
      } else {
        // Navigation mode
        const today = new Date();
        const isToday = 
          currentDate.getFullYear() === today.getFullYear() && 
          currentDate.getMonth() === today.getMonth() && 
          currentDate.getDate() === today.getDate();
        
        if (forceMonth || !isToday) {
          // Len ak navigujeme do konkrétneho mesiaca alebo nie je dnes
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth() + 1;
          apiUrl += `?year=${year}&month=${month}`;
          console.log('🗓️ Fetching calendar data for month:', { year, month });
        } else {
          console.log('🗓️ Fetching default calendar data (today + 30 days)');
        }
      }
      
      // Custom fetch pre availability API s timeout
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      // Vytvoríme AbortController pre timeout (3 sekundy)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Calendar data received:', data.data);
        setCalendarData(data.data.calendar || []);
        setVehicles(data.data.vehicles || []);
      } else {
        setError(data.error || 'Chyba pri načítaní dát');
      }
    } catch (err: any) {
      console.error('❌ Calendar fetch error:', err);
      setError('Chyba pri načítaní kalendárnych dát');
      
      // Ak backend nefunguje, zobrazíme aspoň základné dáta
      const mockVehicles = [
        { id: '1', brand: 'BMW', model: 'X3', licensePlate: 'BA-123-AB' },
        { id: '2', brand: 'Audi', model: 'A4', licensePlate: 'BA-456-CD' },
        { id: '3', brand: 'Mercedes', model: 'C-Class', licensePlate: 'BA-789-EF' }
      ];
      setVehicles(mockVehicles);
      
      // Mock kalendárne dáta pre celý mesiac
      const mockCalendar = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      }).map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        vehicles: mockVehicles.map(vehicle => ({
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          licensePlate: vehicle.licensePlate,
          status: Math.random() > 0.7 ? 'available' : (Math.random() > 0.5 ? 'rented' : 'maintenance') as 'available' | 'rented' | 'maintenance',
          customerName: Math.random() > 0.6 ? `Zákazník ${Math.floor(Math.random() * 100)}` : undefined
        }))
      }));
      setCalendarData(mockCalendar);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'navigation') {
      const isCurrentMonth = 
        currentDate.getFullYear() === new Date().getFullYear() && 
        currentDate.getMonth() === new Date().getMonth();
      
      fetchCalendarData(!isCurrentMonth);
    } else {
      // Range mode - fetch when dates change
      fetchCalendarData();
    }
  }, [currentDate, viewMode, fromDate, toDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleRefresh = () => {
    if (viewMode === 'navigation') {
      const isCurrentMonth = 
        currentDate.getFullYear() === new Date().getFullYear() && 
        currentDate.getMonth() === new Date().getMonth();
      
      fetchCalendarData(!isCurrentMonth);
    } else {
      fetchCalendarData();
    }
  };

  const handleViewModeChange = (event: React.SyntheticEvent, newValue: 'navigation' | 'range') => {
    setViewMode(newValue);
  };

  const handleQuickRange = (days: number) => {
    const today = new Date();
    setFromDate(today);
    setToDate(new Date(today.getTime() + days * 24 * 60 * 60 * 1000));
  };

  // Filter functions
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setBrandFilter('all');
    setCompanyFilter('all');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Get unique values for filter dropdowns
  const uniqueBrands = Array.from(new Set(vehicles.map(v => v.brand).filter(Boolean))).sort();
  const uniqueCompanies = Array.from(new Set(vehicles.map(v => v.company).filter(Boolean))).sort();

  // Filter vehicles based on current filters
  const filteredVehicles = vehicles.filter(vehicle => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matches = [
        vehicle.brand?.toLowerCase(),
        vehicle.model?.toLowerCase(), 
        vehicle.licensePlate?.toLowerCase(),
        `${vehicle.brand} ${vehicle.model}`.toLowerCase()
      ].some(field => field?.includes(query));
      
      if (!matches) return false;
    }

    // Brand filter
    if (brandFilter !== 'all' && vehicle.brand !== brandFilter) {
      return false;
    }

    // Company filter
    if (companyFilter !== 'all' && vehicle.company !== companyFilter) {
      return false;
    }

    return true;
  });

  // Filter calendar data to show only filtered vehicles
  const filteredCalendarData = calendarData.map(dayData => ({
    ...dayData,
    vehicles: dayData.vehicles.filter(v => filteredVehicles.some(fv => fv.id === v.vehicleId))
  }));

  // Additional status filtering for the status filter
  const statusFilteredCalendarData = statusFilter === 'all' 
    ? filteredCalendarData
    : filteredCalendarData.map(dayData => ({
        ...dayData,
        vehicles: dayData.vehicles.filter(v => v.status === statusFilter)
      }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'rented': return 'error';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <AvailableIcon fontSize="small" />;
      case 'rented': return <RentedIcon fontSize="small" />;
      case 'maintenance': return <MaintenanceIcon fontSize="small" />;
      default: return <CarIcon fontSize="small" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Dostupné';
      case 'rented': return 'Obsadené';
      case 'maintenance': return 'Údržba';
      default: return status;
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Načítavam kalendár dostupnosti...
        </Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2} mb={2}>
          <Typography variant="h6" display="flex" alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }}>
            <CalendarIcon sx={{ mr: 1 }} />
            Prehľad Dostupnosti
          </Typography>
          
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* View Mode Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={viewMode} onChange={handleViewModeChange} centered>
            <Tab label="📅 Navigácia mesiacov" value="navigation" />
            <Tab label="📊 Vlastný rozsah" value="range" />
          </Tabs>
        </Box>

        {/* Navigation Mode Controls */}
        {viewMode === 'navigation' && (
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
            <IconButton onClick={handlePrevMonth} size="small">
              <PrevIcon />
            </IconButton>
            
            <Typography 
              variant="h6"
              sx={{ 
                minWidth: { xs: 150, md: 200 }, 
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: { xs: '0.9rem', md: '1.25rem' }
              }}
              onClick={handleToday}
            >
              {format(currentDate, 'MMMM yyyy', { locale: sk })}
            </Typography>
            
            <IconButton onClick={handleNextMonth} size="small">
              <NextIcon />
            </IconButton>
          </Box>
        )}

        {/* Date Range Mode Controls */}
        {viewMode === 'range' && (
          <Card sx={{ mb: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                📊 Vlastný dátumový rozsah
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Od dátumu"
                    type="date"
                    value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value) : null;
                      setFromDate(newDate);
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Do dátumu"
                    type="date"
                    value={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value) : null;
                      setToDate(newDate);
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box display="flex" gap={1} flexWrap="wrap" justifyContent={{ xs: 'center', md: 'flex-start' }}>
                    <Button size="small" variant="outlined" onClick={() => handleQuickRange(7)}>
                      Dnes + 7 dní
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleQuickRange(14)}>
                      Dnes + 14 dní
                    </Button>  
                    <Button size="small" variant="outlined" onClick={() => handleQuickRange(30)}>
                      Dnes + 30 dní
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error} - Zobrazujem testovacie dáta
          </Alert>
        )}

        {/* Search Bar - Always Visible */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="medium"
                  label="🔍 Vyhľadať vozidlo"
                  placeholder="Zadajte značku, model alebo ŠPZ (napr. BMW, X5, BA123AB...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1.1rem'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center" gap={1} flexWrap="wrap">
                  {searchQuery && (
                    <Button
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={() => setSearchQuery('')}
                      color="secondary"
                      variant="outlined"
                    >
                      Vyčistiť hľadanie
                    </Button>
                  )}
                  <Button
                    size="small"
                    onClick={toggleFilters}
                    startIcon={<FilterIcon />}
                    endIcon={showFilters ? <CollapseIcon /> : <ExpandIcon />}
                    variant={showFilters ? "contained" : "outlined"}
                  >
                    Rozšírené filtre
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Advanced Filters Panel - Collapsible */}
        <Collapse in={showFilters}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" display="flex" alignItems="center">
                  <FilterIcon sx={{ mr: 1 }} />
                  Rozšírené filtre
                </Typography>
                {(statusFilter !== 'all' || brandFilter !== 'all' || companyFilter !== 'all') && (
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={() => {
                      setStatusFilter('all');
                      setBrandFilter('all');
                      setCompanyFilter('all');
                    }}
                    color="secondary"
                  >
                    Vyčistiť filtre
                  </Button>
                )}
              </Box>

              <Grid container spacing={2}>
                {/* Status Filter */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stav vozidiel</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Stav vozidiel"
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <MenuItem value="all">📋 Všetky stavy</MenuItem>
                      <MenuItem value="available">✅ Dostupné</MenuItem>
                      <MenuItem value="rented">🔴 Obsadené</MenuItem>
                      <MenuItem value="maintenance">🔧 Údržba</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Brand Filter */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Značka vozidiel</InputLabel>
                    <Select
                      value={brandFilter}
                      label="Značka vozidiel"
                      onChange={(e) => setBrandFilter(e.target.value)}
                    >
                      <MenuItem value="all">🚗 Všetky značky</MenuItem>
                      {uniqueBrands.map(brand => (
                        <MenuItem key={brand} value={brand}>
                          {brand}
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
                      value={companyFilter}
                      label="Firma"
                      onChange={(e) => setCompanyFilter(e.target.value)}
                    >
                      <MenuItem value="all">🏢 Všetky firmy</MenuItem>
                      {uniqueCompanies.map(company => (
                        <MenuItem key={company} value={company}>
                          {company}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>

        <TableContainer 
          component={Paper} 
          sx={{ 
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#555',
            }
          }}
        >
          <Table size="small" sx={{ minWidth: { xs: 600, md: 'auto' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  minWidth: { xs: 100, md: 120 },
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'background.paper',
                  zIndex: 1,
                  borderRight: '1px solid rgba(224, 224, 224, 1)'
                }}>
                  <strong>Dátum</strong>
                </TableCell>
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map(vehicle => (
                    <TableCell key={vehicle.id} align="center" sx={{ minWidth: { xs: 90, md: 110 } }}>
                      <Tooltip title={`${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}`}>
                        <Box sx={{ minWidth: { xs: 80, md: 100 } }}>
                          <Typography variant="caption" display="block" sx={{ 
                            fontSize: { xs: '0.65rem', md: '0.75rem' },
                            lineHeight: 1.2
                          }}>
                            <strong>{vehicle.brand}</strong>
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ 
                            fontSize: { xs: '0.6rem', md: '0.7rem' },
                            lineHeight: 1.1
                          }}>
                            {vehicle.model}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ 
                            fontSize: { xs: '0.55rem', md: '0.65rem' },
                            lineHeight: 1
                          }}>
                            {vehicle.licensePlate}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  ))
                ) : (
                  <TableCell align="center">
                    <Typography variant="body2" color="textSecondary">
                      Žiadne vozidlá nevyhovujú filtrom
                    </Typography>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <SearchIcon color="disabled" sx={{ fontSize: 48 }} />
                      <Typography variant="h6" color="textSecondary">
                        Žiadne vozidlá nevyhovujú filtrom
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Skúste upraviť filtre alebo vyčistiť vyhľadávanie
                      </Typography>
                      <Button size="small" onClick={handleResetFilters} sx={{ mt: 1 }}>
                        Vyčistiť všetky filtre
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                statusFilteredCalendarData.map(dayData => {
                  const day = new Date(dayData.date);
                  return (
                    <TableRow key={dayData.date}>
                      <TableCell sx={{ 
                        minWidth: { xs: 100, md: 120 },
                        position: 'sticky',
                        left: 0,
                        backgroundColor: 'background.paper',
                        zIndex: 1,
                        borderRight: '1px solid rgba(224, 224, 224, 1)'
                      }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                          <strong>{format(day, 'dd.MM', { locale: sk })}</strong>
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ 
                          fontSize: { xs: '0.65rem', md: '0.75rem' },
                          display: { xs: 'none', sm: 'block' }
                        }}>
                          {format(day, 'EEE', { locale: sk })}
                        </Typography>
                      </TableCell>
                      {filteredVehicles.map(vehicle => {
                        const vehicleStatus = dayData.vehicles.find(v => v.vehicleId === vehicle.id);
                        return (
                          <TableCell key={vehicle.id} align="center" sx={{ 
                            minWidth: { xs: 90, md: 110 },
                            px: { xs: 0.5, md: 1 }
                          }}>
                            {vehicleStatus && (
                              <Tooltip title={
                                `${vehicleStatus.vehicleName} - ${getStatusText(vehicleStatus.status)}${vehicleStatus.customerName ? ` (${vehicleStatus.customerName})` : ''}`
                              }>
                                <Chip
                                  icon={getStatusIcon(vehicleStatus.status)}
                                  label={getStatusText(vehicleStatus.status)}
                                  color={getStatusColor(vehicleStatus.status) as any}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    fontSize: { xs: '0.6rem', md: '0.7rem' }, 
                                    height: { xs: 20, md: 24 },
                                    '& .MuiChip-icon': {
                                      fontSize: { xs: '0.75rem', md: '1rem' }
                                    }
                                  }}
                                />
                              </Tooltip>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box mt={2} display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2}>
          <Box display="flex" alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} gap={2} flexWrap="wrap">
            <Typography variant="caption" color="textSecondary" textAlign={{ xs: 'center', md: 'left' }}>
              Zobrazuje sa: <strong>{filteredVehicles.length}</strong> z {vehicles.length} vozidiel
            </Typography>
            <Typography variant="caption" color="textSecondary">
              •  {calendarData.length} dní
            </Typography>
            {(searchQuery || statusFilter !== 'all' || brandFilter !== 'all' || companyFilter !== 'all') && (
              <Chip 
                label="Filtrované" 
                size="small" 
                color="primary" 
                variant="outlined"
                icon={<FilterIcon />}
              />
            )}
          </Box>
          <Typography variant="caption" color="textSecondary" textAlign={{ xs: 'center', md: 'right' }} sx={{ display: { xs: 'none', sm: 'block' } }}>
            💡 Tip: Horizontálne scrollujte pre zobrazenie všetkých vozidiel
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar; 