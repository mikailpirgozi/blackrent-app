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
} from '@mui/material';
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
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      console.log('🗓️ Fetching calendar data for:', { year, month });
      
      // Custom fetch pre availability API - dočasne na port 5001 s timeout
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5001/api' : API_BASE_URL;
      
      // Vytvoríme AbortController pre timeout (3 sekundy)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${apiUrl}/availability/calendar?year=${year}&month=${month}`, {
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
    fetchCalendarData();
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" display="flex" alignItems="center">
            <CalendarIcon sx={{ mr: 1 }} />
            Prehľad Dostupnosti
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={handlePrevMonth} size="small">
              <PrevIcon />
            </IconButton>
            
            <Typography 
              variant="h6" 
              sx={{ 
                minWidth: 200, 
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                px: 1,
                py: 0.5,
                borderRadius: 1
              }}
              onClick={handleToday}
            >
              {format(currentDate, 'MMMM yyyy', { locale: sk })}
            </Typography>
            
            <IconButton onClick={handleNextMonth} size="small">
              <NextIcon />
            </IconButton>
            
            <IconButton onClick={fetchCalendarData} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error} - Zobrazujem testovacie dáta
          </Alert>
        )}

        {/* Filter Panel */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ pb: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={showFilters ? 2 : 0}>
              <Typography variant="subtitle1" display="flex" alignItems="center">
                <FilterIcon sx={{ mr: 1 }} />
                Filtre vozidiel
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {(searchQuery || statusFilter !== 'all' || brandFilter !== 'all' || companyFilter !== 'all') && (
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleResetFilters}
                    color="secondary"
                  >
                    Vyčistiť
                  </Button>
                )}
                <Button
                  size="small"
                  onClick={toggleFilters}
                  endIcon={showFilters ? <CollapseIcon /> : <ExpandIcon />}
                >
                  {showFilters ? 'Skryť' : 'Zobraziť'}
                </Button>
              </Box>
            </Box>

            <Collapse in={showFilters}>
              <Grid container spacing={2}>
                {/* Search */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Vyhľadať vozidlo"
                    placeholder="BMW, X5, BA123AB..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>

                {/* Status Filter */}
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stav</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Stav"
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <MenuItem value="all">Všetky</MenuItem>
                      <MenuItem value="available">Dostupné</MenuItem>
                      <MenuItem value="rented">Obsadené</MenuItem>
                      <MenuItem value="maintenance">Údržba</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Brand Filter */}
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Značka</InputLabel>
                    <Select
                      value={brandFilter}
                      label="Značka"
                      onChange={(e) => setBrandFilter(e.target.value)}
                    >
                      <MenuItem value="all">Všetky značky</MenuItem>
                      {uniqueBrands.map(brand => (
                        <MenuItem key={brand} value={brand}>
                          {brand}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Company Filter */}
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Firma</InputLabel>
                    <Select
                      value={companyFilter}
                      label="Firma"
                      onChange={(e) => setCompanyFilter(e.target.value)}
                    >
                      <MenuItem value="all">Všetky firmy</MenuItem>
                      {uniqueCompanies.map(company => (
                        <MenuItem key={company} value={company}>
                          {company}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Dátum</strong></TableCell>
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map(vehicle => (
                    <TableCell key={vehicle.id} align="center">
                      <Tooltip title={vehicle.licensePlate}>
                        <Box sx={{ minWidth: 80 }}>
                          <Typography variant="caption" display="block">
                            <strong>{vehicle.brand} {vehicle.model}</strong>
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
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
                      <TableCell sx={{ minWidth: 120 }}>
                        <Typography variant="body2">
                          <strong>{format(day, 'dd.MM.yyyy', { locale: sk })}</strong>
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(day, 'EEEE', { locale: sk })}
                        </Typography>
                      </TableCell>
                      {filteredVehicles.map(vehicle => {
                        const vehicleStatus = dayData.vehicles.find(v => v.vehicleId === vehicle.id);
                        return (
                          <TableCell key={vehicle.id} align="center" sx={{ minWidth: 100 }}>
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
                                  sx={{ fontSize: '0.7rem', height: 24 }}
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

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Typography variant="caption" color="textSecondary">
              Zobrazuje sa: {filteredVehicles.length} z {vehicles.length} vozidiel
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
          <Typography variant="caption" color="textSecondary">
            💡 Tip: Horizontálne scrollujte pre zobrazenie všetkých vozidiel
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar; 