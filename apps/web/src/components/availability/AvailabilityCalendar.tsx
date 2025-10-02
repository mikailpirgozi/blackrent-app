import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Car,
  RefreshCw,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Button,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Spinner,
} from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useState } from 'react';

import type {
  CalendarDay,
  CalendarVehicle,
} from '@/lib/react-query/hooks/useAvailability';
import { useAvailabilityCalendar } from '@/lib/react-query/hooks/useAvailability';

interface AvailabilityCalendarProps {
  vehicleId?: number;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  loading?: boolean;
  error?: string;
  searchQuery?: string;
  isMobile?: boolean;
  selectedCompany?: string;
  categoryFilter?: string[];
  availableFromDate?: string;
  availableToDate?: string;
}

// 🎨 HELPER: Získanie farby podľa stavu vozidla
const getVehicleStatusColor = (
  status: string,
  unavailabilityType?: string
): string => {
  switch (status) {
    case 'available':
      return '#4caf50'; // Zelená - dostupné
    case 'rented':
      return '#f44336'; // Červená - prenajatý cez platformu
    case 'maintenance':
      return '#ff9800'; // Oranžová - údržba
    case 'unavailable':
      // Rozlíšenie podľa typu nedostupnosti
      switch (unavailabilityType) {
        case 'private_rental':
          return '#9c27b0'; // Fialová - prenájom mimo platformy
        case 'service':
          return '#2196f3'; // Modrá - servis
        case 'repair':
          return '#ff5722'; // Tmavo oranžová - oprava
        case 'blocked':
          return '#607d8b'; // Sivá - blokované
        case 'cleaning':
          return '#00bcd4'; // Cyan - čistenie
        case 'inspection':
          return '#795548'; // Hnedá - kontrola
        default:
          return '#9e9e9e'; // Svetlo sivá - nedostupné (všeobecne)
      }
    default:
      return '#9e9e9e'; // Svetlo sivá - neznámy stav
  }
};

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  onDateSelect,
  selectedDate,
  loading: externalLoading = false,
  error: externalError,
  searchQuery,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');

  // React Query hook pre načítanie kalendárnych dát
  const {
    data: calendarData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useAvailabilityCalendar(currentMonth);

  // Error handling - kombinujeme query error s external error
  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to load calendar data'
    : externalError;

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
    refetch();
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
      return {
        available: 0,
        rented: 0,
        maintenance: 0,
        flexible: 0,
        unavailable: 0,
        privateRental: 0,
        service: 0,
        total: 0,
      };
    }

    const counts = {
      available: 0,
      rented: 0,
      maintenance: 0,
      flexible: 0,
      unavailable: 0,
      privateRental: 0,
      service: 0,
      total: dayData.vehicles.length,
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
        case 'unavailable':
          // Rozlíšenie podľa typu nedostupnosti
          if (vehicle.unavailabilityType === 'private_rental') {
            counts.privateRental++;
          } else if (vehicle.unavailabilityType === 'service') {
            counts.service++;
          } else {
            counts.unavailable++;
          }
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
      filteredVehicles = filteredVehicles.filter(
        vehicle =>
          vehicle.vehicleName.toLowerCase().includes(query) ||
          vehicle.licensePlate.toLowerCase().includes(query) ||
          (vehicle.customerName &&
            vehicle.customerName.toLowerCase().includes(query))
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
        if (counts.privateRental > 0) {
          primaryColor = '#f3e5f5'; // Light purple - súkromné prenájmy majú prioritu
          primaryStatus = `${counts.privateRental} súkromných prenájmov`;
        } else if (counts.rented > counts.available) {
          primaryColor = '#ffebee'; // Light red
          primaryStatus = `${counts.rented} prenajatých`;
        } else if (counts.available > 0) {
          primaryColor = '#e8f5e8'; // Light green
          primaryStatus = `${counts.available} dostupných`;
        } else if (counts.service > 0) {
          primaryColor = '#e3f2fd'; // Light blue
          primaryStatus = `${counts.service} v servise`;
        } else if (counts.maintenance > 0) {
          primaryColor = '#fff3e0'; // Light orange
          primaryStatus = `${counts.maintenance} údržba`;
        }
      }

      return (
        <div key={day.toISOString()} className="col-span-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card
                  className="h-20 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  style={{
                    backgroundColor: primaryColor,
                    border: isSelected
                      ? '2px solid #1976d2'
                      : isDayToday
                        ? '2px solid #ff9800'
                        : '1px solid #e0e0e0',
                  }}
                  onClick={() => handleDateClick(day)}
                >
                  <CardContent className="p-2">
                    <div className="font-semibold mb-1">
                      {format(day, 'd')}
                    </div>

                    {counts.total > 0 && (
                      <div className="flex flex-col gap-1">
                        {counts.privateRental > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-4 text-xs text-white"
                            style={{
                              backgroundColor: getVehicleStatusColor(
                                'unavailable',
                                'private_rental'
                              ),
                            }}
                          >
                            {counts.privateRental} súkromných
                          </Badge>
                        )}
                        {counts.rented > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-4 text-xs text-white"
                            style={{
                              backgroundColor: getVehicleStatusColor('rented'),
                            }}
                          >
                            {counts.rented} prenajatých
                          </Badge>
                        )}
                        {counts.available > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-4 text-xs text-white"
                            style={{
                              backgroundColor: getVehicleStatusColor('available'),
                            }}
                          >
                            {counts.available} voľných
                          </Badge>
                        )}
                        {counts.service > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-4 text-xs text-white"
                            style={{
                              backgroundColor: getVehicleStatusColor(
                                'unavailable',
                                'service'
                              ),
                            }}
                          >
                            {counts.service} servis
                          </Badge>
                        )}
                        {counts.maintenance > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-4 text-xs text-white"
                            style={{
                              backgroundColor: getVehicleStatusColor('maintenance'),
                            }}
                          >
                            {counts.maintenance} údržba
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{format(day, 'dd.MM.yyyy', { locale: sk })} - {primaryStatus}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    });
  };

  // 🚀 RENDER TÝŽDŇOVÝCH DNÍ
  const renderWeekDays = () => {
    const weekDays = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];

    return weekDays.map(day => (
      <div key={day} className="col-span-1">
        <div className="text-center font-semibold text-gray-600 py-2">
          {day}
        </div>
      </div>
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
        <Alert>
          <AlertDescription>
            Žiadne dáta pre dnešný deň (
            {format(today, 'dd.MM.yyyy', { locale: sk })})
          </AlertDescription>
        </Alert>
      );
    }

    const filteredVehicles = getFilteredVehiclesForDay(today);

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vozidlo</TableHead>
              <TableHead>ŠPZ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Zákazník</TableHead>
              <TableHead>Poznámka</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.map(vehicle => (
              <TableRow key={vehicle.vehicleId}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {vehicle.vehicleName}
                  </div>
                </TableCell>
                <TableCell>{vehicle.licensePlate}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      vehicle.status === 'available'
                        ? 'default'
                        : vehicle.status === 'rented'
                          ? 'destructive'
                          : vehicle.status === 'flexible'
                            ? 'secondary'
                            : vehicle.status === 'maintenance'
                              ? 'outline'
                              : 'secondary'
                    }
                  >
                    {vehicle.status === 'available'
                      ? 'Dostupné'
                      : vehicle.status === 'rented'
                        ? 'Prenajatý'
                        : vehicle.status === 'flexible'
                          ? 'Flexibilný'
                          : vehicle.status === 'maintenance'
                            ? 'Údržba'
                            : 'Nedostupné'}
                  </Badge>
                </TableCell>
                <TableCell>{vehicle.customerName || '-'}</TableCell>
                <TableCell>{vehicle.unavailabilityReason || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading || externalLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
        <span className="ml-2">Načítavam kalendárne dáta...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          {error}
        </AlertDescription>
        <div className="mt-2">
          <Button onClick={handleRefresh} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <Card className="p-6">
      {/* Header s navigáciou */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: sk })}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() =>
              setViewMode(viewMode === 'calendar' ? 'table' : 'calendar')
            }
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Obsah */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-7 gap-1">
          {/* Týždňové dni */}
          {renderWeekDays()}

          {/* Kalendárne dni */}
          {renderCalendarDays()}
        </div>
      ) : (
        renderTableView()
      )}

      {/* Legenda */}
      <div className="mt-6 flex gap-4 flex-wrap justify-center">
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: getVehicleStatusColor('available'),
            }}
          />
          <span className="text-xs">Dostupné</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: getVehicleStatusColor('rented'),
            }}
          />
          <span className="text-xs">Prenajatý (platforma)</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: getVehicleStatusColor(
                'unavailable',
                'private_rental'
              ),
            }}
          />
          <span className="text-xs">Súkromný prenájom</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: getVehicleStatusColor('maintenance'),
            }}
          />
          <span className="text-xs">Údržba</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: getVehicleStatusColor('unavailable', 'service'),
            }}
          />
          <span className="text-xs">Servis</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: getVehicleStatusColor('unavailable', 'repair'),
            }}
          />
          <span className="text-xs">Oprava</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: getVehicleStatusColor('unavailable', 'cleaning'),
            }}
          />
          <span className="text-xs">Čistenie</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: getVehicleStatusColor('unavailable', 'blocked'),
            }}
          />
          <span className="text-xs">Blokované</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: getVehicleStatusColor('unavailable'),
            }}
          />
          <span className="text-xs">Nedostupné</span>
        </div>
      </div>
    </Card>
  );
};

export default AvailabilityCalendar;
