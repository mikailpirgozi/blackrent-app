import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  CheckCircle,
  Cancel,
  Warning,
  DirectionsCar,
  Build,
  Refresh
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { sk } from 'date-fns/locale';
import { apiService } from '../../services/api';
import { useApp } from '../../context/AppContext';

// 🚀 NOVÉ TYPY PRE KALENDÁRNE DÁTA
interface CalendarVehicle {
  vehicleId: number;
  vehicleName: string;
  licensePlate: string;
  status: 'available' | 'rented' | 'flexible' | 'maintenance' | 'unavailable';
  rentalId?: number;
  customerName?: string;
  isFlexible?: boolean;
  unavailabilityType?: string;
  unavailabilityReason?: string;
}

interface CalendarDay {
  date: string;
  vehicles: CalendarVehicle[];
}

interface CalendarData {
  calendar: CalendarDay[];
  vehicles: Array<{
    id: number;
    brand: string;
    model: string;
    licensePlate: string;
    status: string;
  }>;
  rentals?: any[];
  unavailabilities?: any[];
}

interface AvailabilityCalendarProps {
  vehicleId?: number;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  loading?: boolean;
  error?: string;
  searchQuery?: string;
  isMobile?: boolean;
  selectedCompany?: string;
  categoryFilter?: any[];
  availableFromDate?: string;
  availableToDate?: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  vehicleId,
  onDateSelect,
  selectedDate,
  loading: externalLoading = false,
  error: externalError,
  searchQuery,
  isMobile,
  selectedCompany,
  categoryFilter,
  availableFromDate,
  availableToDate
}) => {
  const { getFilteredVehicles } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');

  // 🚀 NAČÍTANIE KALENDÁRNYCH DÁT Z API
  const loadCalendarData = async (month: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      console.log('📅 Loading calendar data for:', format(monthStart, 'yyyy-MM-dd'), 'to', format(monthEnd, 'yyyy-MM-dd'));
      
      // Volanie API endpointu pre kalendárne dáta
      const calendarData = await apiService.get<CalendarData>(`/availability/calendar?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}`);
      
      if (calendarData) {
        setCalendarData(calendarData);
        console.log('✅ Calendar data loaded:', calendarData);
      } else {
        throw new Error('Failed to load calendar data');
      }
    } catch (err) {
      console.error('❌ Error loading calendar data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  // Načítanie dát pri zmene mesiaca
  useEffect(() => {
    loadCalendarData(currentMonth);
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleRefresh = () => {
    loadCalendarData(currentMonth);
  };

  // 🚀 NOVÁ LOGIKA PRE ZÍSKANIE STATUSU DŇA
  const getDayData = (date: Date): CalendarDay | null => {
    if (!calendarData) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarData.calendar.find(day => day.date === dateStr) || null;
  };

  // 🚀 NOVÁ LOGIKA PRE ZOBRAZENIE STATUSOV VOZIDIEL
  const getVehicleStatusCounts = (date: Date) => {
    const dayData = getDayData(date);
    if (!dayData) {
      return { available: 0, rented: 0, maintenance: 0, flexible: 0, unavailable: 0, total: 0 };
    }

    const counts = {
      available: 0,
      rented: 0,
      maintenance: 0,
      flexible: 0,
      unavailable: 0,
      total: dayData.vehicles.length
    };

    dayData.vehicles.forEach(vehicle => {
      switch (vehicle.status) {
        case 'available':
          counts.available++;
          break;
        case 'rented':
          counts.rented++;
          break;
        case 'flexible':
          counts.flexible++;
          break;
        case 'maintenance':
          counts.maintenance++;
          break;
        default:
          counts.unavailable++;
      }
    });

    return counts;
  };

  // 🚀 FILTROVANIE VOZIDIEL PODĽA SEARCH A COMPANY
  const getFilteredVehiclesForDay = (date: Date): CalendarVehicle[] => {
    const dayData = getDayData(date);
    if (!dayData) return [];

    let filteredVehicles = dayData.vehicles;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredVehicles = filteredVehicles.filter(vehicle =>
        vehicle.vehicleName.toLowerCase().includes(query) ||
        vehicle.licensePlate.toLowerCase().includes(query) ||
        (vehicle.customerName && vehicle.customerName.toLowerCase().includes(query))
      );
    }

    return filteredVehicles;
  };

  // 🚀 RENDER KALENDÁRNYCH DNÍ
  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(day => {
      const counts = getVehicleStatusCounts(day);
      const isSelected = selectedDate && isSameDay(day, selectedDate);
      const isDayToday = isToday(day);

      // Určenie hlavnej farby dňa na základe najčastejšieho statusu
      let primaryColor = '#f5f5f5';
      let primaryStatus = 'Žiadne dáta';

      if (counts.total > 0) {
        if (counts.rented > counts.available) {
          primaryColor = '#ffebee'; // Light red
          primaryStatus = `${counts.rented} prenajatých`;
        } else if (counts.available > 0) {
          primaryColor = '#e8f5e8'; // Light green
          primaryStatus = `${counts.available} dostupných`;
        } else if (counts.maintenance > 0) {
          primaryColor = '#fff3e0'; // Light orange
          primaryStatus = `${counts.maintenance} údržba`;
        }
      }

      return (
        <Grid item xs={12/7} key={day.toISOString()}>
          <Tooltip title={`${format(day, 'dd.MM.yyyy', { locale: sk })} - ${primaryStatus}`}>
            <Card
              sx={{
                height: 80,
                cursor: 'pointer',
                backgroundColor: primaryColor,
                border: isSelected ? '2px solid #1976d2' : isDayToday ? '2px solid #ff9800' : '1px solid #e0e0e0',
                borderRadius: 1,
                '&:hover': {
                  boxShadow: 2,
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleDateClick(day)}
            >
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {format(day, 'd')}
                </Typography>
                
                {counts.total > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    {counts.rented > 0 && (
                      <Chip 
                        label={`${counts.rented} prenajatých`}
                        size="small"
                        sx={{ 
                          height: 16, 
                          fontSize: '0.65rem',
                          backgroundColor: '#f44336',
                          color: 'white'
                        }}
                      />
                    )}
                    {counts.available > 0 && (
                      <Chip 
                        label={`${counts.available} voľných`}
                        size="small"
                        sx={{ 
                          height: 16, 
                          fontSize: '0.65rem',
                          backgroundColor: '#4caf50',
                          color: 'white'
                        }}
                      />
                    )}
                    {counts.maintenance > 0 && (
                      <Chip 
                        label={`${counts.maintenance} údržba`}
                        size="small"
                        sx={{ 
                          height: 16, 
                          fontSize: '0.65rem',
                          backgroundColor: '#ff9800',
                          color: 'white'
                        }}
                      />
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>
      );
    });
  };

  // 🚀 RENDER TÝŽDŇOVÝCH DNÍ
  const renderWeekDays = () => {
    const weekDays = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
    
    return weekDays.map(day => (
      <Grid item xs={12/7} key={day}>
        <Typography 
          variant="body2" 
          sx={{ 
            textAlign: 'center', 
            fontWeight: 600, 
            color: '#666',
            py: 1
          }}
        >
          {day}
        </Typography>
      </Grid>
    ));
  };

  // 🚀 RENDER TABUĽKOVÉHO POHĽADU
  const renderTableView = () => {
    if (!calendarData) return null;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayData = calendarData.calendar.find(day => day.date === todayStr);

    if (!todayData) {
      return (
        <Alert severity="info">
          Žiadne dáta pre dnešný deň ({format(today, 'dd.MM.yyyy', { locale: sk })})
        </Alert>
      );
    }

    const filteredVehicles = getFilteredVehiclesForDay(today);

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vozidlo</TableCell>
              <TableCell>ŠPZ</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Zákazník</TableCell>
              <TableCell>Poznámka</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVehicles.map((vehicle) => (
              <TableRow key={vehicle.vehicleId}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsCar fontSize="small" />
                    {vehicle.vehicleName}
                  </Box>
                </TableCell>
                <TableCell>{vehicle.licensePlate}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      vehicle.status === 'available' ? 'Dostupné' :
                      vehicle.status === 'rented' ? 'Prenajatý' :
                      vehicle.status === 'flexible' ? 'Flexibilný' :
                      vehicle.status === 'maintenance' ? 'Údržba' :
                      'Nedostupné'
                    }
                    color={
                      vehicle.status === 'available' ? 'success' :
                      vehicle.status === 'rented' ? 'error' :
                      vehicle.status === 'flexible' ? 'warning' :
                      vehicle.status === 'maintenance' ? 'info' :
                      'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {vehicle.customerName || '-'}
                </TableCell>
                <TableCell>
                  {vehicle.unavailabilityReason || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading || externalLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Načítavam kalendárne dáta...</Typography>
      </Box>
    );
  }

  if (error || externalError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error || externalError}
        <Box sx={{ mt: 1 }}>
          <IconButton onClick={handleRefresh} size="small">
            <Refresh />
          </IconButton>
        </Box>
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header s navigáciou */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePreviousMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
            {format(currentMonth, 'MMMM yyyy', { locale: sk })}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRight />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            onClick={() => setViewMode(viewMode === 'calendar' ? 'table' : 'calendar')}
            color={viewMode === 'table' ? 'primary' : 'default'}
          >
            <CalendarToday />
          </IconButton>
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Obsah */}
      {viewMode === 'calendar' ? (
        <Grid container spacing={1}>
          {/* Týždňové dni */}
          {renderWeekDays()}
          
          {/* Kalendárne dni */}
          {renderCalendarDays()}
        </Grid>
      ) : (
        renderTableView()
      )}

      {/* Legenda */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: 0.5 }} />
          <Typography variant="caption">Dostupné</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#f44336', borderRadius: 0.5 }} />
          <Typography variant="caption">Prenajatý</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#ff9800', borderRadius: 0.5 }} />
          <Typography variant="caption">Údržba</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#9e9e9e', borderRadius: 0.5 }} />
          <Typography variant="caption">Nedostupné</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default AvailabilityCalendar;