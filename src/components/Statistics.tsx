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
  const { state } = useApp();
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

    // POKROČILÉ AUTO ŠTATISTIKY
    const vehicleStats = state.vehicles.map(vehicle => {
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
      
      // Sortované zoznamy pre Top 10+
      vehiclesByUtilization: vehicleStats.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage),
      vehiclesByRevenue: vehicleStats.sort((a, b) => b.totalRevenue - a.totalRevenue),
      vehiclesByRentals: vehicleStats.sort((a, b) => b.rentalCount - a.rentalCount),
      customersByRentals: customerStatsArray.sort((a, b) => b.rentalCount - a.rentalCount),
      customersByRevenue: customerStatsArray.sort((a, b) => b.totalRevenue - a.totalRevenue),
      customersByDays: customerStatsArray.sort((a, b) => b.totalDaysRented - a.totalDaysRented),
      
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

        // DEBUG: Log pre diagnostiku
        console.log('🔍 EMPLOYEE STATS DEBUG:', {
          totalProtocols: state.protocols.length,
          filteredProtocols: filteredProtocols.length,
          totalRentals: state.rentals.length,
          sampleProtocol: filteredProtocols[0],
          sampleRental: state.rentals[0]
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

          // DEBUG: Log pre každý protokol
          if (filteredProtocols.length <= 5) { // Len pre prvých 5 aby nezahlcoval
            console.log('🔍 PROTOCOL DEBUG:', {
              protocolId: protocol.id,
              rentalId: protocol.rentalId,
              employeeName,
              rentalFound: !!rental,
              rentalPrice,
              rentalTotalPrice: rental?.totalPrice,
              protocolRentalDataPrice: protocol.rentalData?.totalPrice,
              rentalObject: rental,
              protocolRentalData: protocol.rentalData
            });
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
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.name}: {entry.value.toLocaleString()} €
            </Typography>
          ))}
        </Card>
      );
    }
    return null;
  };

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
  const TopStatCard = ({ 
    title, 
    icon, 
    data, 
    primaryValue, 
    secondaryValue, 
    gradient,
    percentage 
  }: {
    title: string;
    icon: React.ReactNode;
    data: any;
    primaryValue: string;
    secondaryValue: string;
    gradient: string;
    percentage?: number;
  }) => (
    <Card sx={{ 
      height: '100%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        transform: 'translateY(-4px)',
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ 
            bgcolor: 'transparent',
            background: gradient,
            width: 56,
            height: 56
          }}>
            {icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data ? (data.vehicle ? `${data.vehicle.brand} ${data.vehicle.model}` : data.customerName) : 'N/A'}
            </Typography>
          </Box>
          <TrophyIcon sx={{ color: '#ffd700', fontSize: 32 }} />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea', mb: 0.5 }}>
            {primaryValue}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {secondaryValue}
          </Typography>
        </Box>
        
        {percentage !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Vyťaženosť
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
                {percentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(percentage, 100)} 
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  background: gradient,
                  borderRadius: 4,
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Nový komponent pre Top 10+ zoznamy
  const TopListCard = ({ 
    title, 
    icon, 
    gradient,
    data,
    showCount,
    onLoadMore,
    renderItem,
    emptyMessage = "Žiadne dáta"
  }: {
    title: string;
    icon: React.ReactNode;
    gradient: string;
    data: any[];
    showCount: number;
    onLoadMore: () => void;
    renderItem: (item: any, index: number) => React.ReactNode;
    emptyMessage?: string;
  }) => (
    <Card sx={{ 
      height: 'fit-content',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ 
            bgcolor: 'transparent',
            background: gradient,
            width: 48,
            height: 48
          }}>
            {icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Top {Math.min(showCount, data.length)} z {data.length}
            </Typography>
          </Box>
          <TrophyIcon sx={{ color: '#ffd700', fontSize: 28 }} />
        </Box>
        
        {data.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {data.slice(0, showCount).map((item, index) => renderItem(item, index))}
            </Box>
            
            {showCount < data.length && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={onLoadMore}
                  startIcon={<KeyboardArrowDownIcon />}
                  sx={{
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a6fd8',
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    }
                  }}
                >
                  Zobraziť ďalších {Math.min(10, data.length - showCount)}
                </Button>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

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
          <Grid container spacing={3}>
            {/* Mesiačný trend */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                    Mesiačný trend príjmov
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#667eea" 
                        fill="url(#colorRevenue)" 
                        strokeWidth={3}
                        name="Príjmy"
                      />
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Rýchle štatistiky */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                    Rýchle štatistiky
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: '#f8f9fa'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Priemerná cena</Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#11998e' }}>
                        {stats.avgRentalPrice.toFixed(2)} €
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: '#f8f9fa'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Priemerná dĺžka</Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#667eea' }}>
                        {stats.avgRentalDuration.toFixed(1)} dní
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: '#f8f9fa'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Celková provízia</Typography>
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {stats.totalCommission.toLocaleString()} €
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: '#f8f9fa'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Zajtrajšie vrátenia</Typography>
                      <Typography variant="h6" fontWeight="bold" color="info.main">
                        {stats.tomorrowReturns.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Top firmy */}
            <Grid item xs={12}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                    Top firmy podľa príjmov
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Firma</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Počet prenájmov</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Príjmy</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Provízia</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(stats.companyStats)
                          .sort(([,a], [,b]) => b.revenue - a.revenue)
                          .slice(0, 5)
                          .map(([company, data]) => (
                            <TableRow 
                              key={company}
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: '#f8f9fa' 
                                },
                                transition: 'background-color 0.2s ease'
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                                    <PersonIcon fontSize="small" />
                                  </Avatar>
                                  <Typography variant="body2" fontWeight="medium">
                                    {company}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={data.count} 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: '#667eea',
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold" sx={{ color: '#11998e' }}>
                                  {data.revenue.toLocaleString()} €
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="warning.main" fontWeight="bold">
                                  {data.commission.toLocaleString()} €
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Grafy */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Stĺpcový graf - mesiačné prenájmy */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                    Počet prenájmov podľa mesiacov
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="rentals" fill="#667eea" name="Prenájmy" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Koláčový graf - spôsoby platby */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                    Rozdelenie podľa spôsobu platby
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.paymentMethodStats).map(([method, data]) => ({
                          name: method,
                          value: data.count,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#667eea"
                        dataKey="value"
                      >
                        {Object.entries(stats.paymentMethodStats).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Línový graf - trend príjmov vs provízií */}
            <Grid item xs={12}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                    Trend príjmov vs provízií
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#667eea" 
                        strokeWidth={3}
                        name="Príjmy"
                        dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="commission" 
                        stroke="#11998e" 
                        strokeWidth={3}
                        name="Provízie"
                        dot={{ fill: '#11998e', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Firmy */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {Object.entries(stats.companyStats)
              .sort(([,a], [,b]) => b.revenue - a.revenue)
              .map(([company, data]) => (
                <Grid item xs={12} md={6} lg={4} key={company}>
                  <Card sx={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      transform: 'translateY(-4px)',
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: '#667eea' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {company}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {data.count} prenájmov
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mb: 1,
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: '#f8f9fa'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Príjmy:</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: '#11998e' }}>
                          {data.revenue.toLocaleString()} €
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: '#fff3e0'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Provízia:</Typography>
                        <Typography variant="body2" color="warning.main" fontWeight="bold">
                          {data.commission.toLocaleString()} €
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </TabPanel>

        {/* Tab 4: Platby */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                    Štatistiky platieb
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Spôsob platby</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Počet</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Príjmy</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Podiel</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(stats.paymentMethodStats)
                          .sort(([,a], [,b]) => b.revenue - a.revenue)
                          .map(([method, data]) => {
                            const percentage = (data.revenue / stats.totalRevenue) * 100;
                            return (
                              <TableRow 
                                key={method}
                                sx={{ 
                                  '&:hover': { 
                                    backgroundColor: '#f8f9fa' 
                                  },
                                  transition: 'background-color 0.2s ease'
                                }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip 
                                      label={method} 
                                      size="small" 
                                      sx={{
                                        backgroundColor: '#667eea',
                                        color: 'white',
                                        fontWeight: 600
                                      }}
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    {data.count}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#11998e' }}>
                                    {data.revenue.toLocaleString()} €
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color="text.secondary" fontWeight="bold">
                                    {percentage.toFixed(1)}%
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card sx={{ 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
                    Nezaplatené prenájmy
                  </Typography>
                  {stats.unpaidRentals.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                      <Typography variant="body1" color="success.main" gutterBottom fontWeight="bold">
                        Všetky prenájmy sú zaplatené!
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {stats.unpaidRentals.slice(0, 5).map((rental) => (
                        <Box 
                          key={rental.id} 
                          sx={{ 
                            p: 2, 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            borderRadius: 2,
                            backgroundColor: '#fff3e0',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              transform: 'translateY(-2px)',
                            }
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold">
                            {rental.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rental.vehicle?.brand} {rental.vehicle?.model}
                          </Typography>
                          <Typography variant="body2" color="error.main" fontWeight="bold">
                            {rental.totalPrice?.toLocaleString()} €
                          </Typography>
                        </Box>
                      ))}
                      {stats.unpaidRentals.length > 5 && (
                        <Typography variant="body2" color="text.secondary" textAlign="center" fontWeight="bold">
                          + {stats.unpaidRentals.length - 5} ďalších
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 5: NOVÝ - Top štatistiky */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            {/* TOP AUTO štatistiky */}
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#667eea', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CarIcon />
                TOP Autá za obdobie: {formatPeriod()}
              </Typography>
            </Grid>

            <Grid item xs={12} lg={4}>
              <TopListCard
                title="TOP Vyťažené autá"
                icon={<SpeedIcon />}
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                data={stats.vehiclesByUtilization}
                showCount={showVehiclesByUtilization}
                onLoadMore={() => setShowVehiclesByUtilization(prev => prev + 10)}
                renderItem={(vehicle, index) => (
                  <Box 
                    key={vehicle.vehicle.id}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: index < 3 ? 'rgba(102, 126, 234, 0.04)' : '#f8f9fa',
                      border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <Box sx={{ 
                      minWidth: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: index < 3 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#bdbdbd',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {index + 1}
                    </Box>
                    
                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#667eea' }}>
                      <CarIcon fontSize="small" />
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {vehicle.vehicle.brand} {vehicle.vehicle.model}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vehicle.vehicle.licensePlate} • {vehicle.totalDaysRented} dní
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ 
                        color: vehicle.utilizationPercentage > 70 ? '#4caf50' : 
                               vehicle.utilizationPercentage > 40 ? '#ff9800' : '#f44336'
                      }}>
                        {vehicle.utilizationPercentage.toFixed(1)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(vehicle.utilizationPercentage, 100)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            background: vehicle.utilizationPercentage > 70 ? '#4caf50' : 
                                       vehicle.utilizationPercentage > 40 ? '#ff9800' : '#f44336',
                            borderRadius: 3,
                          }
                        }}
                      />
                    </Box>
                  </Box>
                )}
                emptyMessage="Žiadne autá v tomto období"
              />
            </Grid>

            <Grid item xs={12} lg={4}>
              <TopListCard
                title="TOP Výnosné autá"
                icon={<EuroIcon />}
                gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                data={stats.vehiclesByRevenue}
                showCount={showVehiclesByRevenue}
                onLoadMore={() => setShowVehiclesByRevenue(prev => prev + 10)}
                renderItem={(vehicle, index) => (
                  <Box 
                    key={vehicle.vehicle.id}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: index < 3 ? 'rgba(17, 153, 142, 0.04)' : '#f8f9fa',
                      border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <Box sx={{ 
                      minWidth: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: index < 3 ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : '#bdbdbd',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {index + 1}
                    </Box>
                    
                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#11998e' }}>
                      <CarIcon fontSize="small" />
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {vehicle.vehicle.brand} {vehicle.vehicle.model}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vehicle.vehicle.licensePlate} • {vehicle.rentalCount} prenájmov
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#11998e' }}>
                        {vehicle.totalRevenue.toLocaleString()} €
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vehicle.avgRevenuePerRental.toFixed(0)} €/prenájom
                      </Typography>
                    </Box>
                  </Box>
                )}
                emptyMessage="Žiadne autá v tomto období"
              />
            </Grid>

            <Grid item xs={12} lg={4}>
              <TopListCard
                title="TOP Prenajímané autá"
                icon={<CarIcon />}
                gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                data={stats.vehiclesByRentals}
                showCount={showVehiclesByRentals}
                onLoadMore={() => setShowVehiclesByRentals(prev => prev + 10)}
                renderItem={(vehicle, index) => (
                  <Box 
                    key={vehicle.vehicle.id}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: index < 3 ? 'rgba(240, 147, 251, 0.04)' : '#f8f9fa',
                      border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <Box sx={{ 
                      minWidth: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: index < 3 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : '#bdbdbd',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {index + 1}
                    </Box>
                    
                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#f093fb' }}>
                      <CarIcon fontSize="small" />
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {vehicle.vehicle.brand} {vehicle.vehicle.model}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vehicle.vehicle.licensePlate} • {vehicle.totalDaysRented} dní celkom
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#f093fb' }}>
                        {vehicle.rentalCount}x
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {vehicle.totalRevenue.toLocaleString()} € celkom
                      </Typography>
                    </Box>
                  </Box>
                )}
                emptyMessage="Žiadne autá v tomto období"
              />
            </Grid>

            {/* TOP ZÁKAZNÍK štatistiky */}
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, mt: 4, color: '#667eea', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon />
                TOP Zákazníci za obdobie: {formatPeriod()}
              </Typography>
            </Grid>

            <Grid item xs={12} lg={4}>
              <TopListCard
                title="TOP Aktívni zákazníci"
                icon={<StarIcon />}
                gradient="linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)"
                data={stats.customersByRentals}
                showCount={showCustomersByRentals}
                onLoadMore={() => setShowCustomersByRentals(prev => prev + 10)}
                renderItem={(customer, index) => (
                  <Box 
                    key={customer.customerName}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: index < 3 ? 'rgba(255, 154, 158, 0.04)' : '#f8f9fa',
                      border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <Box sx={{ 
                      minWidth: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: index < 3 ? 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' : '#bdbdbd',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {index + 1}
                    </Box>
                    
                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#ff9a9e' }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {customer.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.totalDaysRented} dní celkom • Priemer: {customer.avgRentalDuration.toFixed(1)} dní
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#ff9a9e' }}>
                        {customer.rentalCount}x
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.totalRevenue.toLocaleString()} € celkom
                      </Typography>
                    </Box>
                  </Box>
                )}
                emptyMessage="Žiadni zákazníci v tomto období"
              />
            </Grid>

            <Grid item xs={12} lg={4}>
              <TopListCard
                title="TOP Ziskoví zákazníci"
                icon={<MoneyIcon />}
                gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
                data={stats.customersByRevenue}
                showCount={showCustomersByRevenue}
                onLoadMore={() => setShowCustomersByRevenue(prev => prev + 10)}
                renderItem={(customer, index) => (
                  <Box 
                    key={customer.customerName}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: index < 3 ? 'rgba(255, 107, 107, 0.04)' : '#f8f9fa',
                      border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <Box sx={{ 
                      minWidth: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: index < 3 ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' : '#bdbdbd',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {index + 1}
                    </Box>
                    
                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#ff6b6b' }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {customer.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.rentalCount} prenájmov • {customer.totalDaysRented} dní
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#ff6b6b' }}>
                        {customer.totalRevenue.toLocaleString()} €
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(customer.totalRevenue / customer.rentalCount).toFixed(0)} €/prenájom
                      </Typography>
                    </Box>
                  </Box>
                )}
                emptyMessage="Žiadni zákazníci v tomto období"
              />
            </Grid>

            <Grid item xs={12} lg={4}>
              <TopListCard
                title="TOP Dlhodobí zákazníci"
                icon={<TimeIcon />}
                gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                data={stats.customersByDays}
                showCount={showCustomersByDays}
                onLoadMore={() => setShowCustomersByDays(prev => prev + 10)}
                renderItem={(customer, index) => (
                  <Box 
                    key={customer.customerName}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2, 
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: index < 3 ? 'rgba(79, 172, 254, 0.04)' : '#f8f9fa',
                      border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <Box sx={{ 
                      minWidth: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: index < 3 ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : '#bdbdbd',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      {index + 1}
                    </Box>
                    
                    <Avatar sx={{ width: 40, height: 40, bgcolor: '#4facfe' }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {customer.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.rentalCount} prenájmov • {customer.totalRevenue.toLocaleString()} €
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#4facfe' }}>
                        {customer.totalDaysRented} dní
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Priemer: {customer.avgRentalDuration.toFixed(1)} dní/prenájom
                      </Typography>
                    </Box>
                  </Box>
                )}
                emptyMessage="Žiadni zákazníci v tomto období"
              />
            </Grid>

            {/* Zjednodušená detailná tabuľka - presunieme do iného tabu ak bude potreba */}
          </Grid>
        </TabPanel>

        {/* Tab 6: Zamestnanci */}
        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            {/* Header */}
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#667eea', display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon />
                Výkon zamestnancov za obdobie: {formatPeriod()}
              </Typography>
            </Grid>

            {/* Employee Statistics Cards */}
            {stats.employeeStats && stats.employeeStats.activeEmployees > 0 ? (
              <>
                {/* Summary Stats */}
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {stats.employeeStats.totalProtocols}
                          </Typography>
                          <Typography variant="body2">
                            Celkovo protokolov
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {stats.employeeStats.totalHandovers}
                          </Typography>
                          <Typography variant="body2">
                            Odovzdaní
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {stats.employeeStats.totalReturns}
                          </Typography>
                          <Typography variant="body2">
                            Prebraní
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            {stats.employeeStats.activeEmployees}
                          </Typography>
                          <Typography variant="body2">
                            Aktívnych zamestnancov
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Top Employees by Protocols */}
                <Grid item xs={12} lg={6}>
                  <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrophyIcon />
                        Top zamestnanci (protokoly)
                      </Typography>
                      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {stats.employeeStats.topEmployeesByProtocols.slice(0, 10).map((employee: any, index: number) => (
                          <Box key={index} sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 2,
                            mb: 1,
                            bgcolor: index < 3 ? 'rgba(102, 126, 234, 0.1)' : 'background.paper',
                            borderRadius: 2,
                            border: index < 3 ? '1px solid rgba(102, 126, 234, 0.2)' : '1px solid rgba(0,0,0,0.1)'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: '50%', 
                                bgcolor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#667eea',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700
                              }}>
                                {index + 1}
                              </Box>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {employee.employeeName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {employee.handoverCount} odovzdaní • {employee.returnCount} prebraní
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#667eea' }}>
                              {employee.totalProtocols}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Top Employees by Revenue */}
                <Grid item xs={12} lg={6}>
                  <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EuroIcon />
                        Top zamestnanci (tržby)
                      </Typography>
                      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {stats.employeeStats.topEmployeesByRevenue.slice(0, 10).map((employee: any, index: number) => (
                          <Box key={index} sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 2,
                            mb: 1,
                            bgcolor: index < 3 ? 'rgba(76, 175, 80, 0.1)' : 'background.paper',
                            borderRadius: 2,
                            border: index < 3 ? '1px solid rgba(76, 175, 80, 0.2)' : '1px solid rgba(0,0,0,0.1)'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: '50%', 
                                bgcolor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#4CAF50',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700
                              }}>
                                {index + 1}
                              </Box>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {employee.employeeName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {employee.totalProtocols} protokolov
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                              €{employee.totalRevenue?.toLocaleString() || 0}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Detailed Employee Table */}
                <Grid item xs={12}>
                  <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssessmentIcon />
                        Detailné štatistiky zamestnancov
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Zamestnanec</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600 }}>Protokoly</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600 }}>Odovzdania</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600 }}>Prebrania</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>Tržby</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600 }}>Prenájmy</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stats.employeeStats.allEmployees
                              .sort((a, b) => b.totalProtocols - a.totalProtocols)
                              .map((employee: any, index: number) => (
                              <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon color="primary" />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {employee.employeeName}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={employee.totalProtocols} 
                                    color="primary" 
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={employee.handoverCount} 
                                    color="secondary" 
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={employee.returnCount} 
                                    color="info" 
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                                    €{employee.totalRevenue?.toLocaleString() || 0}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">
                                    {employee.uniqueRentals || 0}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      Žiadne protokoly za vybrané obdobie
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      V tomto období neboli vytvorené žiadne protokoly odovzdávania alebo preberania vozidiel.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Statistics;
