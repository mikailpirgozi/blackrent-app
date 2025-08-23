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
  Chip
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  CheckCircle,
  Cancel,
  Warning,
  DirectionsCar,
  Build
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
  availabilityData = [],
  loading = false,
  error,
  searchQuery,
  isMobile,
  selectedCompany,
  categoryFilter,
  availableFromDate,
  availableToDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthData, setMonthData] = useState<AvailabilityData[]>([]);

  useEffect(() => {
    // Filter data for current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const filteredData = availabilityData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= monthStart && itemDate <= monthEnd;
    });
    
    setMonthData(filteredData);
  }, [currentMonth, availabilityData]);

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

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = monthData.find(item => item.date === dateStr);
    
    if (!dayData) {
      return { status: 'unknown', color: '#f5f5f5', icon: null };
    }

    if (dayData.maintenance) {
      return { status: 'maintenance', color: '#ff9800', icon: <Warning fontSize="small" /> };
    }
    
    if (dayData.reserved) {
      return { status: 'reserved', color: '#f44336', icon: <Cancel fontSize="small" /> };
    }
    
    if (dayData.available) {
      return { status: 'available', color: '#4caf50', icon: <CheckCircle fontSize="small" /> };
    }
    
    return { status: 'unavailable', color: '#9e9e9e', icon: <Cancel fontSize="small" /> };
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(day => {
      const { status, color, icon } = getDateStatus(day);
      const isSelected = selectedDate && isSameDay(day, selectedDate);
      const isToday = isSameDay(day, new Date());

      return (
        <Grid item xs={12/7} key={day.toISOString()}>
          <Tooltip title={`${format(day, 'dd.MM.yyyy', { locale: sk })} - ${status}`}>
            <Box
              sx={{
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: color,
                border: isSelected ? '2px solid #1976d2' : isToday ? '2px solid #ff9800' : '1px solid #e0e0e0',
                borderRadius: 1,
                cursor: 'pointer',
                position: 'relative',
                '&:hover': {
                  opacity: 0.8,
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleDateClick(day)}
            >
              <Typography
                variant="body2"
                sx={{
                  color: status === 'available' ? 'white' : status === 'reserved' ? 'white' : 'black',
                  fontWeight: isSelected ? 'bold' : 'normal'
                }}
              >
                {format(day, 'd')}
              </Typography>
              {icon && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    color: status === 'available' ? 'white' : status === 'reserved' ? 'white' : 'inherit'
                  }}
                >
                  {icon}
                </Box>
              )}
            </Box>
          </Tooltip>
        </Grid>
      );
    });
  };

  const renderWeekDays = () => {
    const weekDays = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
    
    return weekDays.map(day => (
      <Grid item xs={12/7} key={day}>
        <Typography
          variant="body2"
          align="center"
          sx={{
            fontWeight: 'bold',
            color: 'text.secondary',
            py: 1
          }}
        >
          {day}
        </Typography>
      </Grid>
    ));
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton onClick={handlePreviousMonth} disabled={loading}>
          <ChevronLeft />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday color="primary" />
          <Typography variant="h6">
            {format(currentMonth, 'MMMM yyyy', { locale: sk })}
          </Typography>
        </Box>
        
        <IconButton onClick={handleNextMonth} disabled={loading}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Calendar */}
      {!loading && (
        <Grid container spacing={1}>
          {/* Week days header */}
          {renderWeekDays()}
          
          {/* Calendar days */}
          {renderCalendarDays()}
        </Grid>
      )}

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: 0.5 }} />
          <Typography variant="caption">Dostupné</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#f44336', borderRadius: 0.5 }} />
          <Typography variant="caption">Rezervované</Typography>
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
