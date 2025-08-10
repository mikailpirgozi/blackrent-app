/**
 * 🚀 VIRTUALIZED AVAILABILITY TABLE
 * 
 * Vysoko optimalizovaná tabuľka dostupnosti s virtuálnym scrollingom
 * Používa @tanstack/react-virtual pre efektívne renderovanie veľkých datasetov
 * 
 * Features:
 * - Virtualizácia riadkov (vozidlá)
 * - Virtualizácia stĺpcov (dni)
 * - Fixné hlavičky
 * - Plynulý scrolling aj pri 100+ vozidlách a 90+ dňoch
 * - Minimálna spotreba pamäte
 */

import React, { useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  Paper,
  useTheme
} from '@mui/material';
import {
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
  Build as MaintenanceIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';

// Types
interface DailyStatus {
  date: string;
  status: 'available' | 'rented' | 'maintenance' | 'service' | 'blocked';
  reason?: string;
  customerName?: string;
  rentalId?: string;
}

interface VehicleAvailability {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  brand: string;
  category: string;
  company: string;
  location?: string;
  dailyStatus: DailyStatus[];
  availableDays: number;
  totalDays: number;
  availabilityPercent: number;
}

interface VirtualizedAvailabilityTableProps {
  data: VehicleAvailability[];
  dateRange: { from: Date; to: Date };
  onVehicleClick?: (vehicleId: string) => void;
  onDayClick?: (vehicleId: string, date: string) => void;
}

// Constants
const ROW_HEIGHT = 60; // Výška riadku v px
const COLUMN_WIDTH = 40; // Šírka stĺpca pre deň v px
const FIXED_COLUMNS_WIDTH = 400; // Šírka fixných stĺpcov (vozidlo info)
const HEADER_HEIGHT = 50; // Výška hlavičky

const VirtualizedAvailabilityTable: React.FC<VirtualizedAvailabilityTableProps> = ({
  data,
  dateRange,
  onVehicleClick,
  onDayClick
}) => {
  const theme = useTheme();
  
  // Refs pre scroll containers
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  
  // Calculate dates array
  const dates = useMemo(() => {
    const datesArray: Date[] = [];
    const currentDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    
    while (currentDate <= endDate) {
      datesArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return datesArray;
  }, [dateRange]);
  
  // Row virtualizer (vozidlá)
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5, // Renderuj 5 extra riadkov mimo viewport
  });
  
  // Column virtualizer (dni)
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: dates.length,
    getScrollElement: () => scrollableAreaRef.current,
    estimateSize: () => COLUMN_WIDTH,
    overscan: 10, // Renderuj 10 extra stĺpcov mimo viewport
  });
  
  // Get status display info
  const getStatusDisplay = useCallback((status: string) => {
    switch (status) {
      case 'available':
        return {
          color: theme.palette.success.main,
          icon: <AvailableIcon sx={{ fontSize: 16 }} />,
          label: 'Dostupné'
        };
      case 'rented':
        return {
          color: theme.palette.error.main,
          icon: <UnavailableIcon sx={{ fontSize: 16 }} />,
          label: 'Prenajaté'
        };
      case 'maintenance':
      case 'service':
        return {
          color: theme.palette.warning.main,
          icon: <MaintenanceIcon sx={{ fontSize: 16 }} />,
          label: 'Servis'
        };
      default:
        return {
          color: theme.palette.grey[500],
          icon: <UnavailableIcon sx={{ fontSize: 16 }} />,
          label: 'Blokované'
        };
    }
  }, [theme]);
  
  // Render single cell
  const renderCell = useCallback((vehicle: VehicleAvailability, dayIndex: number) => {
    const dayStatus = vehicle.dailyStatus[dayIndex];
    if (!dayStatus) return null;
    
    const statusDisplay = getStatusDisplay(dayStatus.status);
    const date = dates[dayIndex];
    
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="caption" display="block">
              {format(date, 'dd.MM.yyyy', { locale: sk })}
            </Typography>
            <Typography variant="caption" display="block">
              {statusDisplay.label}
            </Typography>
            {dayStatus.customerName && (
              <Typography variant="caption" display="block">
                Zákazník: {dayStatus.customerName}
              </Typography>
            )}
            {dayStatus.reason && (
              <Typography variant="caption" display="block">
                Dôvod: {dayStatus.reason}
              </Typography>
            )}
          </Box>
        }
        arrow
      >
        <Box
          onClick={() => onDayClick?.(vehicle.vehicleId, dayStatus.date)}
          sx={{
            width: COLUMN_WIDTH,
            height: ROW_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: statusDisplay.color,
            opacity: 0.8,
            cursor: 'pointer',
            '&:hover': {
              opacity: 1,
            },
            borderRight: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {statusDisplay.icon}
        </Box>
      </Tooltip>
    );
  }, [dates, getStatusDisplay, onDayClick, theme]);
  
  return (
    <Paper
      elevation={2}
      sx={{
        width: '100%',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: HEADER_HEIGHT,
          display: 'flex',
          borderBottom: `2px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.grey[100],
        }}
      >
        {/* Fixed header columns */}
        <Box
          sx={{
            width: FIXED_COLUMNS_WIDTH,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            borderRight: `2px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Vozidlo / Dni
          </Typography>
        </Box>
        
        {/* Scrollable date headers */}
        <Box
          ref={scrollableAreaRef}
          sx={{
            flex: 1,
            overflowX: 'auto',
            display: 'flex',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.grey[200],
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[400],
              borderRadius: 4,
            },
          }}
        >
          <Box
            style={{
              width: `${columnVirtualizer.getTotalSize()}px`,
              height: '100%',
              position: 'relative',
            }}
          >
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
              <Box
                key={virtualColumn.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${virtualColumn.size}px`,
                  height: '100%',
                  transform: `translateX(${virtualColumn.start}px)`,
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="caption" fontWeight="bold">
                    {format(dates[virtualColumn.index], 'dd', { locale: sk })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(dates[virtualColumn.index], 'MMM', { locale: sk })}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      
      {/* Body */}
      <Box
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <Box
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const vehicle = data[virtualRow.index];
            
            return (
              <Box
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Box sx={{ display: 'flex', height: '100%' }}>
                  {/* Fixed vehicle info columns */}
                  <Box
                    onClick={() => onVehicleClick?.(vehicle.vehicleId)}
                    sx={{
                      width: FIXED_COLUMNS_WIDTH,
                      display: 'flex',
                      alignItems: 'center',
                      px: 2,
                      gap: 2,
                      borderRight: `2px solid ${theme.palette.divider}`,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {vehicle.vehicleName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vehicle.licensePlate}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={vehicle.category}
                      variant="outlined"
                    />
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={
                        vehicle.availabilityPercent >= 80 ? 'success.main' :
                        vehicle.availabilityPercent >= 50 ? 'warning.main' : 'error.main'
                      }
                    >
                      {vehicle.availabilityPercent}%
                    </Typography>
                  </Box>
                  
                  {/* Scrollable day cells */}
                  <Box
                    sx={{
                      flex: 1,
                      overflowX: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <Box
                      style={{
                        width: `${columnVirtualizer.getTotalSize()}px`,
                        height: '100%',
                        position: 'relative',
                      }}
                    >
                      {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
                        <Box
                          key={virtualColumn.key}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: `${virtualColumn.size}px`,
                            height: '100%',
                            transform: `translateX(${virtualColumn.start}px)`,
                          }}
                        >
                          {renderCell(vehicle, virtualColumn.index)}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};

export default VirtualizedAvailabilityTable;