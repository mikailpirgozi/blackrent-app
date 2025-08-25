import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Button,
  Collapse,
  IconButton,
  Avatar,
  Divider,
  Alert,
  Fade,
  Skeleton,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
  Euro as EuroIcon,
  ShowChart as ShowChartIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Dashboard as DashboardIcon,
  Percent as PercentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays, isAfter, isBefore, startOfYear, endOfYear, getDaysInMonth } from 'date-fns';
import { sk } from 'date-fns/locale';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import StatisticsMobile from './statistics/StatisticsMobile';
import OverviewTab from './statistics/OverviewTab';
import ChartsTab from './statistics/ChartsTab';
import CompaniesTab from './statistics/CompaniesTab';
import PaymentsTab from './statistics/PaymentsTab';
import TopStatsTab from './statistics/TopStatsTab';
import EmployeesTab from './statistics/EmployeesTab';
import CustomTooltip from './statistics/CustomTooltip';
import { logger } from '../utils/smartLogger';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

const Statistics: React.FC = () => {
  const { state, getFilteredVehicles } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [tabValue, setTabValue] = useState(0);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'all'>('month');
  
  // Nové state pre filtrovanie
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());

  // State pre pagination Top štatistík
  const [showVehiclesByUtilization, setShowVehiclesByUtilization] = useState(10);
  const [showVehiclesByRevenue, setShowVehiclesByRevenue] = useState(10);
  const [showVehiclesByRentals, setShowVehiclesByRentals] = useState(10);
  const [showCustomersByRentals, setShowCustomersByRentals] = useState(10);
  const [showCustomersByRevenue, setShowCustomersByRevenue] = useState(10);
  const [showCustomersByDays, setShowCustomersByDays] = useState(10);

  // Reálne dáta z aplikácie s novými metrikami
  const stats = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Definícia filtrovacieho obdobia
    let filterStartDate: Date;
    let filterEndDate: Date;
    
    if (timeRange === 'month') {
      filterStartDate = startOfMonth(new Date(filterYear, filterMonth));
      filterEndDate = endOfMonth(new Date(filterYear, filterMonth));
    } else if (timeRange === 'year') {
      filterStartDate = startOfYear(new Date(filterYear, 0));
      filterEndDate = endOfYear(new Date(filterYear, 0));
    } else { // 'all'
      filterStartDate = new Date(2020, 0, 1); // Začiatok BlackRent
      filterEndDate = new Date();
    }

    logger.debug('Statistics filter period', {
      timeRange,
      filterYear,
      filterMonth,
      filterStartDate: format(filterStartDate, 'yyyy-MM-dd'),
      filterEndDate: format(filterEndDate, 'yyyy-MM-dd')
    });

    // Filtrované prenájmy pre vybrané obdobie
    const filteredRentals = state.rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate >= filterStartDate && rentalDate <= filterEndDate;
    });

    // Filtrované náklady pre vybrané obdobie a iba Black Holding
    const filteredExpenses = state.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isInPeriod = expenseDate >= filterStartDate && expenseDate <= filterEndDate;
      const isBlackHolding = expense.company?.toLowerCase().includes('black holding');
      return isInPeriod && isBlackHolding;
    });

    logger.performance('Statistics data processed', {
      rentals: filteredRentals.length,
      expenses: filteredExpenses.length,
      totalExpenseAmount: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      timeRange
    });

    // NOVÉ METRIKY
    // 1. Celkové tržby za obdobie
    const totalRevenuePeriod = filteredRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
    
    // 2. Náklady Black Holding za obdobie
    const blackHoldingExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // 3. Celkové provízie za obdobie
    const totalCommissionPeriod = filteredRentals.reduce((sum, rental) => sum + (rental.commission || 0), 0);

    // POKROČILÉ AUTO ŠTATISTIKY - používame filtrované vozidlá (bez private)
    const filteredVehicles = getFilteredVehicles();
    const vehicleStats = filteredVehicles.map(vehicle => {
      const vehicleRentals = filteredRentals.filter(rental => rental.vehicleId === vehicle.id);
      
      // Celkové príjmy z auta
      const totalRevenue = vehicleRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
      
      // Počet prenájmov
      const rentalCount = vehicleRentals.length;
      
      // Celkové dni prenájmu
      const totalDaysRented = vehicleRentals.reduce((sum, rental) => {
        return sum + differenceInDays(new Date(rental.endDate), new Date(rental.startDate)) + 1;
      }, 0);
      
      // Výpočet % vyťaženosti
      let utilizationPercentage = 0;
      if (timeRange === 'month') {
        const daysInMonth = getDaysInMonth(new Date(filterYear, filterMonth));
        utilizationPercentage = (totalDaysRented / daysInMonth) * 100;
      } else if (timeRange === 'year') {
        const daysInYear = 365; // Zjednodušene
        utilizationPercentage = (totalDaysRented / daysInYear) * 100;
      } else {
        // Pre 'all' - vypočítame od začiatku BlackRent
        const daysSinceStart = differenceInDays(new Date(), new Date(2020, 0, 1));
        utilizationPercentage = (totalDaysRented / daysSinceStart) * 100;
      }
      
      return {
        vehicle,
        totalRevenue,
        rentalCount,
        totalDaysRented,
        utilizationPercentage: Math.min(utilizationPercentage, 100), // Max 100%
        avgRevenuePerRental: rentalCount > 0 ? totalRevenue / rentalCount : 0
      };
    }).filter(stat => stat.rentalCount > 0); // Iba autá s prenájmami

    // POKROČILÉ ZÁKAZNÍK ŠTATISTIKY  
    const customerStats = filteredRentals.reduce((acc, rental) => {
      const customerId = rental.customerId || rental.customerName;
      if (!customerId) return acc;
      
      if (!acc[customerId]) {
        acc[customerId] = {
          customerName: rental.customerName,
          customer: rental.customer,
          totalRevenue: 0,
          rentalCount: 0,
          totalDaysRented: 0,
          lastRentalDate: new Date(rental.startDate),
          avgRentalDuration: 0
        };
      }
      
      acc[customerId].totalRevenue += rental.totalPrice || 0;
      acc[customerId].rentalCount += 1;
      
      const rentalDays = differenceInDays(new Date(rental.endDate), new Date(rental.startDate)) + 1;
      acc[customerId].totalDaysRented += rentalDays;
      
      // Aktualizácia posledného prenájmu
      if (new Date(rental.startDate) > acc[customerId].lastRentalDate) {
        acc[customerId].lastRentalDate = new Date(rental.startDate);
      }
      
      return acc;
    }, {} as Record<string, {
      customerName: string;
      customer?: any;
      totalRevenue: number;
      rentalCount: number;
      totalDaysRented: number;
      lastRentalDate: Date;
      avgRentalDuration: number;
    }>);

    // Výpočet priemernej dĺžky prenájmu pre každého zákazníka
    Object.values(customerStats).forEach(customer => {
      customer.avgRentalDuration = customer.rentalCount > 0 
        ? customer.totalDaysRented / customer.rentalCount 
        : 0;
    });

    const customerStatsArray = Object.values(customerStats);

    // TOP AUTO ŠTATISTIKY
    const topVehicleByUtilization = vehicleStats.length > 0 ? vehicleStats.reduce((prev, current) => 
      prev.utilizationPercentage > current.utilizationPercentage ? prev : current
    , vehicleStats[0]) : null;

    const topVehicleByRevenue = vehicleStats.length > 0 ? vehicleStats.reduce((prev, current) => 
      prev.totalRevenue > current.totalRevenue ? prev : current
    , vehicleStats[0]) : null;

    const topVehicleByRentals = vehicleStats.length > 0 ? vehicleStats.reduce((prev, current) => 
      prev.rentalCount > current.rentalCount ? prev : current
    , vehicleStats[0]) : null;

    // TOP ZÁKAZNÍK ŠTATISTIKY
    const topCustomerByRentals = customerStatsArray.length > 0 ? customerStatsArray.reduce((prev, current) => 
      prev.rentalCount > current.rentalCount ? prev : current
    , customerStatsArray[0]) : null;

    const topCustomerByRevenue = customerStatsArray.length > 0 ? customerStatsArray.reduce((prev, current) => 
      prev.totalRevenue > current.totalRevenue ? prev : current
    , customerStatsArray[0]) : null;

    const topCustomerByDays = customerStatsArray.length > 0 ? customerStatsArray.reduce((prev, current) => 
      prev.totalDaysRented > current.totalDaysRented ? prev : current
    , customerStatsArray[0]) : null;

    // Existujúce výpočty (pre všetky časy)
    const currentMonthRentals = state.rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate.getMonth() === currentMonth && rentalDate.getFullYear() === currentYear;
    });

    const currentYearRentals = state.rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate.getFullYear() === currentYear;
    });

    const selectedMonthRentals = state.rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate.getMonth() === selectedMonth && rentalDate.getFullYear() === selectedYear;
    });

    const selectedYearRentals = state.rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate.getFullYear() === selectedYear;
    });

    // Aktívne prenájmy
    const activeRentals = state.rentals.filter(rental => {
      const now = new Date();
      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      return isAfter(now, startDate) && isBefore(now, endDate);
    });

    // Dnešné vrátenia
    const todayReturns = state.rentals.filter(rental => {
      const today = new Date();
      const endDate = new Date(rental.endDate);
      return format(today, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
    });

    // Zajtrajšie vrátenia
    const tomorrowReturns = state.rentals.filter(rental => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endDate = new Date(rental.endDate);
      return format(tomorrow, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
    });

    // Nezaplatené prenájmy
    const unpaidRentals = state.rentals.filter(rental => !rental.paid);

    // Výpočet celkových príjmov (všetky časy)
    const totalRevenue = state.rentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
    const totalCommission = state.rentals.reduce((sum, rental) => sum + (rental.commission || 0), 0);

    // Výpočet priemerných hodnôt
    const avgRentalPrice = state.rentals.length > 0 ? totalRevenue / state.rentals.length : 0;
    const avgRentalDuration = state.rentals.length > 0 
      ? state.rentals.reduce((sum, rental) => {
          const days = differenceInDays(new Date(rental.endDate), new Date(rental.startDate)) + 1;
          return sum + days;
        }, 0) / state.rentals.length 
      : 0;

    // Štatistiky podľa spôsobu platby
    const paymentMethodStats = state.rentals.reduce((acc, rental) => {
      const method = rental.paymentMethod || 'unknown';
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0 };
      }
      acc[method].count++;
      acc[method].revenue += rental.totalPrice || 0;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    // Štatistiky podľa firiem
    const companyStats = state.rentals.reduce((acc, rental) => {
      const company = rental.vehicle?.company || 'Bez firmy';
      if (!acc[company]) {
        acc[company] = { count: 0, revenue: 0, commission: 0 };
      }
      acc[company].count++;
      acc[company].revenue += rental.totalPrice || 0;
      acc[company].commission += rental.commission || 0;
      return acc;
    }, {} as Record<string, { count: number; revenue: number; commission: number }>);

    // Mesiačné dáta pre graf
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = subMonths(new Date(), 11 - i);
      const monthRentals = state.rentals.filter(rental => {
        const rentalDate = new Date(rental.startDate);
        return rentalDate.getMonth() === month.getMonth() && rentalDate.getFullYear() === month.getFullYear();
      });

      return {
        month: format(month, 'MMM yyyy'),
        rentals: monthRentals.length,
        revenue: monthRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0),
        commission: monthRentals.reduce((sum, rental) => sum + (rental.commission || 0), 0),
      };
    });

    return {
      // Nové metriky
      totalRevenuePeriod,
      blackHoldingExpenses,
      totalCommissionPeriod,
      filteredRentals,
      filteredExpenses,
      
      // Pokročilé štatistiky
      vehicleStats,
      customerStatsArray,
      topVehicleByUtilization,
      topVehicleByRevenue,
      topVehicleByRentals,
      topCustomerByRentals,
      topCustomerByRevenue,
      topCustomerByDays,
      
      // Sortované zoznamy pre Top 10+ - vytvárame kópie aby sa nemutoval originálny array
      vehiclesByUtilization: (() => {
        const sorted = [...vehicleStats].sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
        logger.debug('Vehicles by utilization (top 3)', sorted.slice(0, 3).map(v => ({
          vehicle: `${v.vehicle.brand} ${v.vehicle.model}`,
          utilization: v.utilizationPercentage.toFixed(1) + '%'
        })));
        return sorted;
      })(),
      vehiclesByRevenue: (() => {
        const sorted = [...vehicleStats].sort((a, b) => b.totalRevenue - a.totalRevenue);
        logger.debug('Vehicles by revenue (top 3)', sorted.slice(0, 3).map(v => ({
          vehicle: `${v.vehicle.brand} ${v.vehicle.model}`,
          revenue: v.totalRevenue + '€'
        })));
        return sorted;
      })(),
      vehiclesByRentals: (() => {
        const sorted = [...vehicleStats].sort((a, b) => b.rentalCount - a.rentalCount);
        logger.debug('Vehicles by rentals (top 3)', sorted.slice(0, 3).map(v => ({
          vehicle: `${v.vehicle.brand} ${v.vehicle.model}`,
          rentals: v.rentalCount + 'x'
        })));
        return sorted;
      })(),
      customersByRentals: (() => {
        const sorted = [...customerStatsArray].sort((a, b) => b.rentalCount - a.rentalCount);
        logger.debug('Customers by rentals (top 3)', sorted.slice(0, 3).map(c => ({
          customer: c.customerName,
          rentals: c.rentalCount + 'x'
        })));
        return sorted;
      })(),
      customersByRevenue: (() => {
        const sorted = [...customerStatsArray].sort((a, b) => b.totalRevenue - a.totalRevenue);
        logger.debug('Customers by revenue (top 3)', sorted.slice(0, 3).map(c => ({
          customer: c.customerName,
          revenue: c.totalRevenue + '€'
        })));
        return sorted;
      })(),
      customersByDays: (() => {
        const sorted = [...customerStatsArray].sort((a, b) => b.totalDaysRented - a.totalDaysRented);
        logger.debug('Customers by days (top 3)', sorted.slice(0, 3).map(c => ({
          customer: c.customerName,
          days: c.totalDaysRented + ' dní'
        })));
        return sorted;
      })(),
      
      // Existujúce
      currentMonthRentals,
      currentYearRentals,
      selectedMonthRentals,
      selectedYearRentals,
      activeRentals,
      todayReturns,
      tomorrowReturns,
      unpaidRentals,
      totalRevenue,
      totalCommission,
      avgRentalPrice,
      avgRentalDuration,
      paymentMethodStats,
      companyStats,
      monthlyData,

      // 📊 EMPLOYEE STATISTICS: Štatistiky zamestnancov na základe protokolov
      employeeStats: (() => {
        // Filtrované protokoly pre vybrané obdobie
        const filteredProtocols = state.protocols.filter(protocol => {
          const protocolDate = new Date(protocol.createdAt);
          return protocolDate >= filterStartDate && protocolDate <= filterEndDate;
        });



        // Zoskupenie protokolov podľa zamestnanca
        const employeeProtocolStats = filteredProtocols.reduce((acc, protocol) => {
          const employeeName = protocol.createdBy || 'Neznámy';
          
          if (!acc[employeeName]) {
            acc[employeeName] = {
              employeeName,
              handoverCount: 0,
              returnCount: 0,
              totalProtocols: 0,
              handoverRevenue: 0,
              returnRevenue: 0,
              totalRevenue: 0,
              rentals: new Set<string>() // Pre sledovanie unikátnych prenájmov
            };
          }

          // Nájdi prenájom pre tento protokol (hľadaj vo všetkých prenájmoch, nie len filtrovaných)
          const rental = state.rentals.find(r => r.id === protocol.rentalId);
          
          // Skús získať cenu z rôznych zdrojov
          let rentalPrice = 0;
          if (rental?.totalPrice) {
            rentalPrice = rental.totalPrice;
          } else if (protocol.rentalData?.totalPrice) {
            rentalPrice = protocol.rentalData.totalPrice;
          }



          if (protocol.type === 'handover') {
            acc[employeeName].handoverCount++;
            acc[employeeName].handoverRevenue += rentalPrice;
          } else {
            acc[employeeName].returnCount++;
            acc[employeeName].returnRevenue += rentalPrice;
          }

          acc[employeeName].totalProtocols++;
          acc[employeeName].totalRevenue += rentalPrice;
          acc[employeeName].rentals.add(protocol.rentalId);

          return acc;
        }, {} as Record<string, {
          employeeName: string;
          handoverCount: number;
          returnCount: number;
          totalProtocols: number;
          handoverRevenue: number;
          returnRevenue: number;
          totalRevenue: number;
          rentals: Set<string>;
        }>);

        // Konverzia na array a pridanie počtu unikátnych prenájmov
        const employeeStatsArray = Object.values(employeeProtocolStats).map(emp => ({
          ...emp,
          uniqueRentals: emp.rentals.size,
          rentals: undefined // Odstránime Set z výsledku
        }));

        // Sortovanie podľa celkového počtu protokolov
        const topEmployeesByProtocols = [...employeeStatsArray].sort((a, b) => b.totalProtocols - a.totalProtocols);
        const topEmployeesByRevenue = [...employeeStatsArray].sort((a, b) => b.totalRevenue - a.totalRevenue);
        const topEmployeesByHandovers = [...employeeStatsArray].sort((a, b) => b.handoverCount - a.handoverCount);
        const topEmployeesByReturns = [...employeeStatsArray].sort((a, b) => b.returnCount - a.returnCount);

        return {
          allEmployees: employeeStatsArray,
          topEmployeesByProtocols,
          topEmployeesByRevenue,
          topEmployeesByHandovers,
          topEmployeesByReturns,
          totalProtocols: filteredProtocols.length,
          totalHandovers: filteredProtocols.filter(p => p.type === 'handover').length,
          totalReturns: filteredProtocols.filter(p => p.type === 'return').length,
          activeEmployees: employeeStatsArray.length
        };
      })(),
    };
  }, [state.rentals, state.expenses, state.vehicles, state.protocols, selectedYear, selectedMonth, timeRange, filterYear, filterMonth]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleMonthExpansion = (monthKey: string) => {
    setExpandedMonth(expandedMonth === monthKey ? null : monthKey);
  };

  // Custom Tooltip pre grafy


  // Modernizované štatistické karty
  const StatCard = ({ title, value, subtitle, icon, gradient, trend }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    gradient: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <Card sx={{ 
      height: '100%',
      background: gradient,
      color: 'white',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        transform: 'translateY(-4px)',
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, opacity: 0.9 }}>
              {title.toUpperCase()}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ opacity: 0.8 }}>
            {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 40 } })}
          </Box>
        </Box>
        
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            {trend.isPositive ? (
              <TrendingUpIcon sx={{ fontSize: 16 }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16 }} />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              vs. predch. obdobie
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Komponenta pre TOP štatistiky


  // Pomocná funkcia pre formátovanie obdobia
  const formatPeriod = () => {
    if (timeRange === 'month') {
      return format(new Date(filterYear, filterMonth), 'MMMM yyyy', { locale: sk });
    } else if (timeRange === 'year') {
      return `${filterYear}`;
    } else {
      return 'Celá doba BlackRent';
    }
  };

  // Mobile view
  if (isMobile) {
    return (
      <StatisticsMobile
        stats={stats}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        filterYear={filterYear}
        filterMonth={filterMonth}
        onFilterYearChange={setFilterYear}
        onFilterMonthChange={setFilterMonth}
        onRefresh={() => {
          // Force re-computation of stats
          window.location.reload();
        }}
        isLoading={false}
      />
    );
  }

  // Desktop view
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Modern Header */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DashboardIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Štatistiky & Dashboard
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Prehľad výkonnosti a obchodných trendov
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                  Obdobie
                </InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as 'month' | 'year' | 'all')}
                  label="Obdobie"
                  sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '.MuiSvgIcon-root': {
                      color: 'white',
                    },
                  }}
                >
                  <MenuItem value="month">Mesiac</MenuItem>
                  <MenuItem value="year">Rok</MenuItem>
                  <MenuItem value="all">Celá doba</MenuItem>
                </Select>
              </FormControl>

              {timeRange === 'month' && (
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                    Mesiac
                  </InputLabel>
                  <Select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value as number)}
                    label="Mesiac"
                    sx={{
                      color: 'white',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white',
                      },
                      '.MuiSvgIcon-root': {
                        color: 'white',
                      },
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <MenuItem key={i} value={i}>
                        {format(new Date(2023, i), 'MMMM', { locale: sk })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {(timeRange === 'month' || timeRange === 'year') && (
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                    Rok
                  </InputLabel>
                  <Select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value as number)}
                    label="Rok"
                    sx={{
                      color: 'white',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white',
                      },
                      '.MuiSvgIcon-root': {
                        color: 'white',
                      },
                    }}
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}
              
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                Obnoviť
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Info karta s vybraným obdobím */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          📊 Zobrazujú sa dáta za obdobie: <strong>{formatPeriod()}</strong>
        </Typography>
        <Typography variant="body2">
          Prenájmy: {stats.filteredRentals.length} • Náklady Black Holding: {stats.filteredExpenses.length}
        </Typography>
      </Alert>

      {/* NOVÉ štatistické karty pre vybrané obdobie */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Tržby za obdobie"
            value={`${stats.totalRevenuePeriod.toLocaleString()} €`}
            subtitle={formatPeriod()}
            icon={<CreditCardIcon />}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Náklady Black Holding"
            value={`${stats.blackHoldingExpenses.toLocaleString()} €`}
            subtitle={formatPeriod()}
            icon={<AccountBalanceIcon />}
            gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Provízie za obdobie"
            value={`${stats.totalCommissionPeriod.toLocaleString()} €`}
            subtitle={formatPeriod()}
            icon={<PercentIcon />}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
        </Grid>
      </Grid>

      {/* Existujúce kľúčové metriky */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#667eea' }}>
        Všeobecné štatistiky
      </Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Celkové príjmy"
            value={`${stats.totalRevenue.toLocaleString()} €`}
            subtitle="Všetky časy"
            icon={<EuroIcon />}
            gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
            trend={{ value: 12.5, isPositive: true }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aktívne prenájmy"
            value={stats.activeRentals.length}
            subtitle="Momentálne aktívne"
            icon={<CarIcon />}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Dnešné vrátenia"
            value={stats.todayReturns.length}
            subtitle="Vrátenia dnes"
            icon={<CalendarIcon />}
            gradient="linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Nezaplatené"
            value={stats.unpaidRentals.length}
            subtitle="Čakajú na platbu"
            icon={<WarningIcon />}
            gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
          />
        </Grid>
      </Grid>

      {/* Modernizované Tabs */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          background: 'linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)'
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="statistics tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 64,
                '&.Mui-selected': {
                  color: '#667eea',
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#667eea',
                height: 3,
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon />
                  Prehľad
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShowChartIcon />
                  Grafy
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  Firmy
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentIcon />
                  Platby
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrophyIcon />
                  Top štatistiky
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon />
                  Zamestnanci
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Tab 1: Prehľad */}
        <TabPanel value={tabValue} index={0}>
          <OverviewTab stats={stats} />
        </TabPanel>

        {/* Tab 2: Grafy */}
        <TabPanel value={tabValue} index={1}>
          <ChartsTab stats={stats} COLORS={COLORS} />
        </TabPanel>

        {/* Tab 3: Firmy */}
        <TabPanel value={tabValue} index={2}>
          <CompaniesTab stats={stats} />
        </TabPanel>

        {/* Tab 4: Platby */}
        <TabPanel value={tabValue} index={3}>
          <PaymentsTab stats={stats} />
        </TabPanel>

        {/* Tab 5: NOVÝ - Top štatistiky */}
        <TabPanel value={tabValue} index={4}>
          <TopStatsTab 
            stats={stats}
            formatPeriod={formatPeriod}
            showVehiclesByUtilization={showVehiclesByUtilization}
            showVehiclesByRevenue={showVehiclesByRevenue}
            showVehiclesByRentals={showVehiclesByRentals}
            showCustomersByRentals={showCustomersByRentals}
            showCustomersByRevenue={showCustomersByRevenue}
            showCustomersByDays={showCustomersByDays}
            setShowVehiclesByUtilization={setShowVehiclesByUtilization}
            setShowVehiclesByRevenue={setShowVehiclesByRevenue}
            setShowVehiclesByRentals={setShowVehiclesByRentals}
            setShowCustomersByRentals={setShowCustomersByRentals}
            setShowCustomersByRevenue={setShowCustomersByRevenue}
            setShowCustomersByDays={setShowCustomersByDays}
          />
        </TabPanel>

        {/* Tab 6: Zamestnanci */}
        <TabPanel value={tabValue} index={5}>
          <EmployeesTab stats={stats} formatPeriod={formatPeriod} />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Statistics;
