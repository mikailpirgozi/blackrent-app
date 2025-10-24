import { useExpenses } from '@/lib/react-query/hooks/useExpenses';
import { useAllProtocols } from '@/lib/react-query/hooks/useProtocols';
import { useRentals } from '@/lib/react-query/hooks/useRentals';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import type { Rental } from '@/types';
import {
  Building2 as AccountBalanceIcon,
  BarChart3 as AssessmentIcon,
  Building as BusinessIcon,
  Calendar as CalendarIcon,
  Car as CarIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  LayoutDashboard as DashboardIcon,
  Euro as EuroIcon,
  DollarSign as MoneyIcon,
  CreditCard as PaymentIcon,
  Percent as PercentIcon,
  User as PersonIcon,
  RefreshCw as RefreshIcon,
  TrendingUp as ShowChartIcon,
  Gauge as SpeedIcon,
  Star as StarIcon,
  Clock as TimeIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Trophy as TrophyIcon,
  AlertTriangle as WarningIcon,
  ChevronDown as KeyboardArrowDownIcon,
} from 'lucide-react';
import {
  differenceInDays,
  endOfMonth,
  endOfYear,
  format,
  getDaysInMonth,
  isAfter,
  isBefore,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useState, useCallback, useRef } from 'react';

// Throttling properties for window object
interface ThrottlingWindow extends globalThis.Window {
  lastStatsLog?: number;
  lastPerfLog?: number;
  lastVehiclesLog?: number;
  lastCustomersLog?: number;
}
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { logger } from '../utils/smartLogger';
import StatisticsMobile from './statistics/StatisticsMobile';

// shadcn/ui imports - postupná migrácia z MUI
import { Button as ShadcnButton } from '@/components/ui/button';
import {
  Card as ShadcnCard,
  CardContent as ShadcnCardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table as ShadcnTable,
  TableBody as ShadcnTableBody,
  TableCell as ShadcnTableCell,
  TableHead as ShadcnTableHead,
  TableHeader as ShadcnTableHeader,
  TableRow as ShadcnTableRow,
} from '@/components/ui/table';
import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Alert as ShadcnAlert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Type definitions
interface VehicleStatistic extends Record<string, unknown> {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    company?: string;
  };
  totalRevenue: number;
  rentalCount: number;
  totalDaysRented: number;
  utilizationPercentage: number;
  avgRevenuePerRental: number;
}

interface CustomerStatistic extends Record<string, unknown> {
  customerName: string;
  customer: Record<string, unknown> | undefined;
  totalRevenue: number;
  rentalCount: number;
  totalDaysRented: number;
  lastRentalDate: Date;
  avgRentalDuration: number;
}

interface EmployeeStatistic extends Record<string, unknown> {
  employeeName: string;
  handoverCount: number;
  returnCount: number;
  totalProtocols: number;
  handoverRevenue: number;
  returnRevenue: number;
  totalRevenue: number;
  uniqueRentals: number;
}

const COLORS = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#f5576c',
  '#4facfe',
  '#00f2fe',
];

const Statistics: React.FC = () => {
  // React Query hooks
  const { data: rentals = [] } = useRentals();
  const { data: expenses = [] } = useExpenses();
  const { data: protocols = [] } = useAllProtocols();
  const { data: vehicles = [] } = useVehicles();

  const isMobile = window.innerWidth < 768;

  // Loading state
  // const isLoading =
  //   rentalsLoading || expensesLoading || protocolsLoading || vehiclesLoading;

  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedMonth] = useState(new Date().getMonth());
  const [tabValue, setTabValue] = useState(0);
  // const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'all'>('month');

  // Nové state pre filtrovanie
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());

  // State pre pagination Top štatistík
  const [showVehiclesByUtilization, setShowVehiclesByUtilization] =
    useState(10);
  const [showVehiclesByRevenue, setShowVehiclesByRevenue] = useState(10);
  const [showVehiclesByRentals, setShowVehiclesByRentals] = useState(10);
  const [showCustomersByRentals, setShowCustomersByRentals] = useState(10);
  const [showCustomersByRevenue, setShowCustomersByRevenue] = useState(10);
  const [showCustomersByDays, setShowCustomersByDays] = useState(10);

  // Debounced statistics calculation
  const debounceTimeoutRef = useRef<number>();
  const [debouncedStats, setDebouncedStats] = useState<ReturnType<
    typeof computeStatistics
  > | null>(null);

  const calculateStats = useCallback(() => {
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = window.setTimeout(() => {
      const newStats = computeStatistics();
      setDebouncedStats(newStats);
    }, 300); // 300ms debounce
  }, [
    rentals,
    expenses,
    protocols,
    vehicles,
    selectedYear,
    selectedMonth,
    timeRange,
    filterYear,
    filterMonth,
  ]);

  // Trigger calculation when dependencies change
  React.useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const computeStatistics = useCallback(() => {
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
    } else {
      // 'all'
      filterStartDate = new Date(2020, 0, 1); // Začiatok BlackRent
      filterEndDate = new Date();
    }

    // Throttled logging - len raz za 5 sekúnd
    if (
      !(window as ThrottlingWindow).lastStatsLog ||
      Date.now() - (window as ThrottlingWindow).lastStatsLog! > 5000
    ) {
      logger.debug('Statistics filter period', {
        timeRange,
        filterYear,
        filterMonth,
        filterStartDate: format(filterStartDate, 'yyyy-MM-dd'),
        filterEndDate: format(filterEndDate, 'yyyy-MM-dd'),
      });
      (window as ThrottlingWindow).lastStatsLog = Date.now();
    }

    // Filtrované prenájmy pre vybrané obdobie
    const filteredRentals = rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate >= filterStartDate && rentalDate <= filterEndDate;
    });

    // Filtrované náklady pre vybrané obdobie a iba Black Holding
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isInPeriod =
        expenseDate >= filterStartDate && expenseDate <= filterEndDate;
      const isBlackHolding = expense.company
        ?.toLowerCase()
        .includes('black holding');
      return isInPeriod && isBlackHolding;
    });

    // Throttled performance logging
    if (
      !(window as ThrottlingWindow).lastPerfLog ||
      Date.now() - (window as ThrottlingWindow).lastPerfLog! > 5000
    ) {
      logger.performance('Statistics data processed', {
        rentals: filteredRentals.length,
        expenses: filteredExpenses.length,
        totalExpenseAmount: filteredExpenses.reduce(
          (sum, exp) => sum + exp.amount,
          0
        ),
        timeRange,
      });
      (window as ThrottlingWindow).lastPerfLog = Date.now();
    }

    // NOVÉ METRIKY
    // 1. Celkové tržby za obdobie
    const totalRevenuePeriod = filteredRentals.reduce(
      (sum, rental) => sum + (rental.totalPrice || 0),
      0
    );

    // 2. Náklady Black Holding za obdobie
    const blackHoldingExpenses = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // 3. Celkové provízie za obdobie
    const totalCommissionPeriod = filteredRentals.reduce(
      (sum, rental) => sum + (rental.commission || 0),
      0
    );

    // POKROČILÉ AUTO ŠTATISTIKY - používame vozidlá s definovanou kategóriou
    const filteredVehicles = vehicles.filter(
      vehicle => vehicle.category !== undefined
    );
    const vehicleStats = filteredVehicles
      .map(vehicle => {
        const vehicleRentals = filteredRentals.filter(
          rental => rental.vehicleId === vehicle.id
        );

        // Celkové príjmy z auta
        const totalRevenue = vehicleRentals.reduce(
          (sum, rental) => sum + (rental.totalPrice || 0),
          0
        );

        // Počet prenájmov
        const rentalCount = vehicleRentals.length;

        // Celkové dni prenájmu
        const totalDaysRented = vehicleRentals.reduce((sum, rental) => {
          return (
            sum +
            differenceInDays(
              new Date(rental.endDate),
              new Date(rental.startDate)
            ) +
            1
          );
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
          const daysSinceStart = differenceInDays(
            new Date(),
            new Date(2020, 0, 1)
          );
          utilizationPercentage = (totalDaysRented / daysSinceStart) * 100;
        }

        return {
          vehicle,
          totalRevenue,
          rentalCount,
          totalDaysRented,
          utilizationPercentage: Math.min(utilizationPercentage, 100), // Max 100%
          avgRevenuePerRental: rentalCount > 0 ? totalRevenue / rentalCount : 0,
        };
      })
      .filter(stat => stat.rentalCount > 0); // Iba autá s prenájmami

    // POKROČILÉ ZÁKAZNÍK ŠTATISTIKY
    const customerStats = filteredRentals.reduce(
      (acc, rental) => {
        const customerId = rental.customerId || rental.customerName;
        if (!customerId) return acc;

        if (!acc[customerId]) {
          acc[customerId] = {
            customerName: rental.customerName,
            customer: rental.customer as Record<string, unknown> | undefined,
            totalRevenue: 0,
            rentalCount: 0,
            totalDaysRented: 0,
            lastRentalDate: new Date(rental.startDate),
            avgRentalDuration: 0,
          };
        }

        const customer = acc[customerId];
        if (customer) {
          customer.totalRevenue += rental.totalPrice || 0;
          customer.rentalCount += 1;

          const rentalDays =
            differenceInDays(
              new Date(rental.endDate),
              new Date(rental.startDate)
            ) + 1;
          customer.totalDaysRented += rentalDays;

          // Aktualizácia posledného prenájmu
          if (new Date(rental.startDate) > customer.lastRentalDate) {
            customer.lastRentalDate = new Date(rental.startDate);
          }
        }

        return acc;
      },
      {} as Record<string, CustomerStatistic>
    );

    // Výpočet priemernej dĺžky prenájmu pre každého zákazníka
    Object.values(customerStats).forEach(customer => {
      customer.avgRentalDuration =
        customer.rentalCount > 0
          ? customer.totalDaysRented / customer.rentalCount
          : 0;
    });

    const customerStatsArray = Object.values(customerStats);

    // TOP AUTO ŠTATISTIKY
    const topVehicleByUtilization =
      vehicleStats.length > 0
        ? vehicleStats.reduce(
            (prev, current) =>
              prev &&
              current &&
              prev.utilizationPercentage > current.utilizationPercentage
                ? prev
                : current,
            vehicleStats[0]
          )
        : null;

    const topVehicleByRevenue =
      vehicleStats.length > 0
        ? vehicleStats.reduce(
            (prev, current) =>
              prev && current && prev.totalRevenue > current.totalRevenue
                ? prev
                : current,
            vehicleStats[0]
          )
        : null;

    const topVehicleByRentals =
      vehicleStats.length > 0
        ? vehicleStats.reduce(
            (prev, current) =>
              prev && current && prev.rentalCount > current.rentalCount
                ? prev
                : current,
            vehicleStats[0]
          )
        : null;

    // TOP ZÁKAZNÍK ŠTATISTIKY
    const topCustomerByRentals =
      customerStatsArray.length > 0
        ? customerStatsArray.reduce(
            (prev, current) =>
              prev && current && prev.rentalCount > current.rentalCount
                ? prev
                : current,
            customerStatsArray[0]
          )
        : null;

    const topCustomerByRevenue =
      customerStatsArray.length > 0
        ? customerStatsArray.reduce(
            (prev, current) =>
              prev && current && prev.totalRevenue > current.totalRevenue
                ? prev
                : current,
            customerStatsArray[0]
          )
        : null;

    const topCustomerByDays =
      customerStatsArray.length > 0
        ? customerStatsArray.reduce(
            (prev, current) =>
              prev && current && prev.totalDaysRented > current.totalDaysRented
                ? prev
                : current,
            customerStatsArray[0]
          )
        : null;

    // Existujúce výpočty (pre všetky časy)
    const currentMonthRentals = rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return (
        rentalDate.getMonth() === currentMonth &&
        rentalDate.getFullYear() === currentYear
      );
    });

    const currentYearRentals = rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate.getFullYear() === currentYear;
    });

    const selectedMonthRentals = rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return (
        rentalDate.getMonth() === selectedMonth &&
        rentalDate.getFullYear() === selectedYear
      );
    });

    const selectedYearRentals = rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate.getFullYear() === selectedYear;
    });

    // Aktívne prenájmy
    const activeRentals = rentals.filter(rental => {
      const now = new Date();
      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      return isAfter(now, startDate) && isBefore(now, endDate);
    });

    // Dnešné vrátenia
    const todayReturns = rentals.filter(rental => {
      const today = new Date();
      const endDate = new Date(rental.endDate);
      return format(today, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
    });

    // Zajtrajšie vrátenia
    const tomorrowReturns = rentals.filter(rental => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endDate = new Date(rental.endDate);
      return format(tomorrow, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
    });

    // Nezaplatené prenájmy
    const unpaidRentals = rentals.filter(rental => !rental.paid);

    // Výpočet celkových príjmov (všetky časy)
    const totalRevenue = rentals.reduce(
      (sum, rental) => sum + (rental.totalPrice || 0),
      0
    );
    const totalCommission = rentals.reduce(
      (sum, rental) => sum + (rental.commission || 0),
      0
    );

    // Výpočet priemerných hodnôt
    const avgRentalPrice =
      rentals.length > 0 ? totalRevenue / rentals.length : 0;
    const avgRentalDuration =
      rentals.length > 0
        ? rentals.reduce((sum, rental) => {
            const days =
              differenceInDays(
                new Date(rental.endDate),
                new Date(rental.startDate)
              ) + 1;
            return sum + days;
          }, 0) / rentals.length
        : 0;

    // Štatistiky podľa spôsobu platby
    const paymentMethodStats = rentals.reduce(
      (acc, rental) => {
        const method = rental.paymentMethod || 'unknown';
        if (!acc[method]) {
          acc[method] = { count: 0, revenue: 0 };
        }
        const paymentMethod = acc[method];
        if (paymentMethod) {
          paymentMethod.count++;
          paymentMethod.revenue += rental.totalPrice || 0;
        }
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>
    );

    // Štatistiky podľa firiem
    const companyStats = rentals.reduce(
      (acc, rental) => {
        const company = rental.vehicle?.company || 'Bez firmy';
        if (!acc[company]) {
          acc[company] = { count: 0, revenue: 0, commission: 0 };
        }
        const companyData = acc[company];
        if (companyData) {
          companyData.count++;
          companyData.revenue += rental.totalPrice || 0;
          companyData.commission += rental.commission || 0;
        }
        return acc;
      },
      {} as Record<
        string,
        { count: number; revenue: number; commission: number }
      >
    );

    // Mesiačné dáta pre graf
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = subMonths(new Date(), 11 - i);
      const monthRentals = rentals.filter(rental => {
        const rentalDate = new Date(rental.startDate);
        return (
          rentalDate.getMonth() === month.getMonth() &&
          rentalDate.getFullYear() === month.getFullYear()
        );
      });

      return {
        month: format(month, 'MMM yyyy'),
        rentals: monthRentals.length,
        revenue: monthRentals.reduce(
          (sum, rental) => sum + (rental.totalPrice || 0),
          0
        ),
        commission: monthRentals.reduce(
          (sum, rental) => sum + (rental.commission || 0),
          0
        ),
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
        const sorted = [...vehicleStats].sort(
          (a, b) => b.utilizationPercentage - a.utilizationPercentage
        );
        // Throttled logging pre vozidlá
        if (
          !(window as ThrottlingWindow).lastVehiclesLog ||
          Date.now() - (window as ThrottlingWindow).lastVehiclesLog! > 5000
        ) {
          logger.debug(
            'Vehicles by utilization (top 3)',
            sorted.slice(0, 3).map(v => ({
              vehicle: `${v.vehicle.brand} ${v.vehicle.model}`,
              utilization: v.utilizationPercentage.toFixed(1) + '%',
            }))
          );
          (window as ThrottlingWindow).lastVehiclesLog = Date.now();
        }
        return sorted;
      })(),
      vehiclesByRevenue: (() => {
        const sorted = [...vehicleStats].sort(
          (a, b) => b.totalRevenue - a.totalRevenue
        );
        // Throttled logging pre vozidlá
        if (
          !(window as ThrottlingWindow).lastVehiclesLog ||
          Date.now() - (window as ThrottlingWindow).lastVehiclesLog! > 5000
        ) {
          logger.debug(
            'Vehicles by revenue (top 3)',
            sorted.slice(0, 3).map(v => ({
              vehicle: `${v.vehicle.brand} ${v.vehicle.model}`,
              revenue: v.totalRevenue + '€',
            }))
          );
        }
        return sorted;
      })(),
      vehiclesByRentals: (() => {
        const sorted = [...vehicleStats].sort(
          (a, b) => b.rentalCount - a.rentalCount
        );
        // Throttled logging pre vozidlá
        if (
          !(window as ThrottlingWindow).lastVehiclesLog ||
          Date.now() - (window as ThrottlingWindow).lastVehiclesLog! > 5000
        ) {
          logger.debug(
            'Vehicles by rentals (top 3)',
            sorted.slice(0, 3).map(v => ({
              vehicle: `${v.vehicle.brand} ${v.vehicle.model}`,
              rentals: v.rentalCount + 'x',
            }))
          );
        }
        return sorted;
      })(),
      customersByRentals: (() => {
        const sorted = [...customerStatsArray].sort(
          (a, b) => b.rentalCount - a.rentalCount
        );
        // Throttled logging pre zákazníkov
        if (
          !(window as ThrottlingWindow).lastCustomersLog ||
          Date.now() - (window as ThrottlingWindow).lastCustomersLog! > 5000
        ) {
          logger.debug(
            'Customers by rentals (top 3)',
            sorted.slice(0, 3).map(c => ({
              customer: c.customerName,
              rentals: c.rentalCount + 'x',
            }))
          );
          (window as ThrottlingWindow).lastCustomersLog = Date.now();
        }
        return sorted;
      })(),
      customersByRevenue: (() => {
        const sorted = [...customerStatsArray].sort(
          (a, b) => b.totalRevenue - a.totalRevenue
        );
        // Throttled logging pre zákazníkov
        if (
          !(window as ThrottlingWindow).lastCustomersLog ||
          Date.now() - (window as ThrottlingWindow).lastCustomersLog! > 5000
        ) {
          logger.debug(
            'Customers by revenue (top 3)',
            sorted.slice(0, 3).map(c => ({
              customer: c.customerName,
              revenue: c.totalRevenue + '€',
            }))
          );
        }
        return sorted;
      })(),
      customersByDays: (() => {
        const sorted = [...customerStatsArray].sort(
          (a, b) => b.totalDaysRented - a.totalDaysRented
        );
        // Throttled logging pre zákazníkov
        if (
          !(window as ThrottlingWindow).lastCustomersLog ||
          Date.now() - (window as ThrottlingWindow).lastCustomersLog! > 5000
        ) {
          logger.debug(
            'Customers by days (top 3)',
            sorted.slice(0, 3).map(c => ({
              customer: c.customerName,
              days: c.totalDaysRented + ' dní',
            }))
          );
        }
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
        const filteredProtocols = (
          protocols as Array<{
            createdAt: string;
            type: string;
            rentalId: string;
            createdBy?: string;
            rentalData?: { totalPrice?: number };
          }>
        ).filter(
          (protocol: {
            createdAt: string;
            type: string;
            rentalId: string;
            createdBy?: string;
            rentalData?: { totalPrice?: number };
          }) => {
            const protocolDate = new Date(protocol.createdAt);
            return (
              protocolDate >= filterStartDate && protocolDate <= filterEndDate
            );
          }
        );

        // Zoskupenie protokolov podľa zamestnanca
        const employeeProtocolStats = filteredProtocols.reduce(
          (
            acc: Record<
              string,
              {
                employeeName: string;
                handoverCount: number;
                returnCount: number;
                totalProtocols: number;
                handoverRevenue: number;
                returnRevenue: number;
                totalRevenue: number;
                rentals: Set<string>;
              }
            >,
            protocol: {
              createdAt: string;
              type: string;
              rentalId: string;
              createdBy?: string;
              rentalData?: { totalPrice?: number };
            }
          ) => {
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
                rentals: new Set<string>(), // Pre sledovanie unikátnych prenájmov
              };
            }

            // Nájdi prenájom pre tento protokol (hľadaj vo všetkých prenájmoch, nie len filtrovaných)
            const rental = rentals.find(r => r.id === protocol.rentalId);

            // Skús získať cenu z rôznych zdrojov
            let rentalPrice = 0;
            if (rental?.totalPrice) {
              rentalPrice = rental.totalPrice;
            } else if (protocol.rentalData?.totalPrice) {
              rentalPrice = protocol.rentalData.totalPrice;
            }

            const employee = acc[employeeName];
            if (employee) {
              if (protocol.type === 'handover') {
                employee.handoverCount++;
                employee.handoverRevenue += rentalPrice;
              } else {
                employee.returnCount++;
                employee.returnRevenue += rentalPrice;
              }
            }

            if (employee) {
              employee.totalProtocols++;
              employee.totalRevenue += rentalPrice;
              employee.rentals.add(protocol.rentalId);
            }

            return acc;
          },
          {} as Record<
            string,
            {
              employeeName: string;
              handoverCount: number;
              returnCount: number;
              totalProtocols: number;
              handoverRevenue: number;
              returnRevenue: number;
              totalRevenue: number;
              rentals: Set<string>;
            }
          >
        );

        // Konverzia na array a pridanie počtu unikátnych prenájmov
        const employeeStatsArray = Object.values(employeeProtocolStats).map(
          (emp: {
            employeeName: string;
            handoverCount: number;
            returnCount: number;
            totalProtocols: number;
            handoverRevenue: number;
            returnRevenue: number;
            totalRevenue: number;
            rentals: Set<string>;
          }) => ({
            employeeName: emp.employeeName,
            handoverCount: emp.handoverCount,
            returnCount: emp.returnCount,
            totalProtocols: emp.totalProtocols,
            handoverRevenue: emp.handoverRevenue,
            returnRevenue: emp.returnRevenue,
            totalRevenue: emp.totalRevenue,
            uniqueRentals: emp.rentals.size,
          })
        );

        // Sortovanie podľa celkového počtu protokolov
        const topEmployeesByProtocols = [...employeeStatsArray].sort(
          (a, b) => b.totalProtocols - a.totalProtocols
        );
        const topEmployeesByRevenue = [...employeeStatsArray].sort(
          (a, b) => b.totalRevenue - a.totalRevenue
        );
        const topEmployeesByHandovers = [...employeeStatsArray].sort(
          (a, b) => b.handoverCount - a.handoverCount
        );
        const topEmployeesByReturns = [...employeeStatsArray].sort(
          (a, b) => b.returnCount - a.returnCount
        );

        return {
          allEmployees: employeeStatsArray,
          topEmployeesByProtocols,
          topEmployeesByRevenue,
          topEmployeesByHandovers,
          topEmployeesByReturns,
          totalProtocols: filteredProtocols.length,
          totalHandovers: filteredProtocols.filter(
            (p: { type: string }) => p.type === 'handover'
          ).length,
          totalReturns: filteredProtocols.filter(
            (p: { type: string }) => p.type === 'return'
          ).length,
          activeEmployees: employeeStatsArray.length,
        };
      })(),
    };
  }, [
    rentals,
    expenses,
    protocols,
    vehicles,
    selectedYear,
    selectedMonth,
    timeRange,
    filterYear,
    filterMonth,
  ]);

  // Use debounced stats or fallback to empty object
  const stats = debouncedStats as NonNullable<typeof debouncedStats>;

  // Loading state
  if (!debouncedStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítavam štatistiky...</p>
        </div>
      </div>
    );
  }

  // const toggleMonthExpansion = (monthKey: string) => {
  //   setExpandedMonth(expandedMonth === monthKey ? null : monthKey);
  // };

  // Custom Tooltip pre grafy
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ color: string; value: number; name: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <ShadcnCard className="p-4 shadow-lg">
          <ShadcnCardContent className="p-0">
            <p className="text-sm font-bold mb-2">{label}</p>
            {payload.map(
              (
                entry: { color: string; value: number; name: string },
                index: number
              ) => (
                <p
                  key={index}
                  className="text-sm"
                  style={{ color: entry.color }}
                >
                  {entry.name}: {entry.value.toLocaleString()} €
                </p>
              )
            )}
          </ShadcnCardContent>
        </ShadcnCard>
      );
    }
    return null;
  };

  // Modernizované štatistické karty
  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    gradient,
    trend,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    gradient: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <ShadcnCard
      className="h-full text-white shadow-lg transition-all duration-200 hover:shadow-2xl hover:-translate-y-1"
      style={{ background: gradient }}
    >
      <ShadcnCardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h6 className="text-lg font-semibold mb-2 opacity-90 uppercase">
              {title}
            </h6>
            <h4 className="text-3xl font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h4>
            {subtitle && <p className="text-sm opacity-80 mt-1">{subtitle}</p>}
          </div>
          <div className="opacity-80">
            {React.cloneElement(icon as React.ReactElement, {
              className: 'h-10 w-10',
            })}
          </div>
        </div>

        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.isPositive ? (
              <TrendingUpIcon className="h-4 w-4" />
            ) : (
              <TrendingDownIcon className="h-4 w-4" />
            )}
            <span className="text-sm font-semibold">
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-sm opacity-80">vs. predch. obdobie</span>
          </div>
        )}
      </ShadcnCardContent>
    </ShadcnCard>
  );

  // Komponenta pre TOP štatistiky
  const TopStatCard = ({
    title,
    icon,
    data,
    primaryValue,
    secondaryValue,
    gradient,
    percentage,
  }: {
    title: string;
    icon: React.ReactNode;
    data: Record<string, unknown>;
    primaryValue: string;
    secondaryValue: string;
    gradient: string;
    percentage?: number;
  }) => (
    <ShadcnCard className="h-full shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
      <ShadcnCardContent>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white"
            style={{ background: gradient }}
          >
            {icon}
          </div>
          <div className="flex-1">
            <h6 className="text-lg font-bold text-blue-500">{title}</h6>
            <p className="text-sm text-gray-600">
              {data && typeof data === 'object'
                ? 'vehicle' in data &&
                  data.vehicle &&
                  typeof data.vehicle === 'object'
                  ? `${(data.vehicle as Record<string, unknown>).brand || ''} ${(data.vehicle as Record<string, unknown>).model || ''}`.trim() ||
                    'N/A'
                  : 'customerName' in data &&
                      typeof data.customerName === 'string'
                    ? data.customerName
                    : 'N/A'
                : 'N/A'}
            </p>
          </div>
          <TrophyIcon className="h-8 w-8 text-yellow-500" />
        </div>

        <div className="mb-4">
          <h4 className="text-3xl font-bold text-blue-500 mb-1">
            {primaryValue}
          </h4>
          <p className="text-sm text-gray-600">{secondaryValue}</p>
        </div>

        {percentage !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Vyťaženosť</span>
              <span className="text-sm font-semibold text-blue-500">
                {percentage.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(percentage, 100)}
              className="h-2 bg-gray-200"
            />
          </div>
        )}
      </ShadcnCardContent>
    </ShadcnCard>
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
    emptyMessage = 'Žiadne dáta',
  }: {
    title: string;
    icon: React.ReactNode;
    gradient: string;
    data: Record<string, unknown>[];
    showCount: number;
    onLoadMore: () => void;
    renderItem: (
      _item: Record<string, unknown>,
      _index: number
    ) => React.ReactNode;
    emptyMessage?: string;
  }) => (
    <ShadcnCard className="h-fit shadow-md transition-all duration-200 hover:shadow-lg">
      <ShadcnCardContent>
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
            style={{ background: gradient }}
          >
            {icon}
          </div>
          <div className="flex-1">
            <h6 className="text-lg font-bold text-blue-500">{title}</h6>
            <p className="text-sm text-gray-600">
              Top {Math.min(showCount, data.length)} z {data.length}
            </p>
          </div>
          <TrophyIcon className="h-6 w-6 text-yellow-500" />
        </div>

        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-base text-gray-600">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {data
                .slice(0, showCount)
                .map((item, index) => renderItem(item, index))}
            </div>

            {showCount < data.length && (
              <div className="mt-6 text-center">
                <ShadcnButton
                  variant="outline"
                  onClick={onLoadMore}
                  className="border-blue-500 text-blue-500 hover:border-blue-600 hover:bg-blue-50"
                >
                  <KeyboardArrowDownIcon className="mr-2 h-4 w-4" />
                  Zobraziť ďalších {Math.min(10, data.length - showCount)}
                </ShadcnButton>
              </div>
            )}
          </>
        )}
      </ShadcnCardContent>
    </ShadcnCard>
  );

  // Pomocná funkcia pre formátovanie obdobia
  const formatPeriod = () => {
    if (timeRange === 'month') {
      return format(new Date(filterYear, filterMonth), 'MMMM yyyy', {
        locale: sk,
      });
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
    <div className="p-4 md:p-6">
      {/* Modern Header */}
      <ShadcnCard className="mb-6 shadow-xl">
        <ShadcnCardContent className="bg-gradient-to-br from-blue-500 to-purple-600 text-white relative p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <DashboardIcon className="h-8 w-8" />
              <div>
                <h4 className="text-3xl font-bold mb-1">
                  Štatistiky & Dashboard
                </h4>
                <p className="text-base opacity-90">
                  Prehľad výkonnosti a obchodných trendov
                </p>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="min-w-[120px]">
                <Label className="text-white text-sm mb-2 block">Obdobie</Label>
                <ShadcnSelect
                  value={timeRange}
                  onValueChange={(value: 'month' | 'year' | 'all') =>
                    setTimeRange(value)
                  }
                >
                  <SelectTrigger className="text-white border-white/30 hover:border-white/50 focus:border-white bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Mesiac</SelectItem>
                    <SelectItem value="year">Rok</SelectItem>
                    <SelectItem value="all">Celá doba</SelectItem>
                  </SelectContent>
                </ShadcnSelect>
              </div>

              {timeRange === 'month' && (
                <div className="min-w-[140px]">
                  <Label className="text-white text-sm mb-2 block">
                    Mesiac
                  </Label>
                  <ShadcnSelect
                    value={filterMonth.toString()}
                    onValueChange={value => setFilterMonth(Number(value))}
                  >
                    <SelectTrigger className="text-white border-white/30 hover:border-white/50 focus:border-white bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {format(new Date(2023, i), 'MMMM', { locale: sk })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </ShadcnSelect>
                </div>
              )}

              {(timeRange === 'month' || timeRange === 'year') && (
                <div className="min-w-[100px]">
                  <Label className="text-white text-sm mb-2 block">Rok</Label>
                  <ShadcnSelect
                    value={filterYear.toString()}
                    onValueChange={value => setFilterYear(Number(value))}
                  >
                    <SelectTrigger className="text-white border-white/30 hover:border-white/50 focus:border-white bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </ShadcnSelect>
                </div>
              )}

              <ShadcnButton
                variant="secondary"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                <RefreshIcon className="mr-2 h-4 w-4" />
                Obnoviť
              </ShadcnButton>
            </div>
          </div>
        </ShadcnCardContent>
      </ShadcnCard>

      {/* Info karta s vybraným obdobím */}
      <ShadcnAlert className="mb-6">
        <AlertTitle className="font-semibold">
          📊 Zobrazujú sa dáta za obdobie: <strong>{formatPeriod()}</strong>
        </AlertTitle>
        <AlertDescription>
          Prenájmy: {stats?.filteredRentals?.length || 0} • Náklady Black
          Holding: {stats?.filteredExpenses?.length || 0}
        </AlertDescription>
      </ShadcnAlert>

      {/* NOVÉ štatistické karty pre vybrané obdobie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Tržby za obdobie"
          value={`${stats?.totalRevenuePeriod?.toLocaleString() || '0'} €`}
          subtitle={formatPeriod()}
          icon={<CreditCardIcon />}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />

        <StatCard
          title="Náklady Black Holding"
          value={`${stats?.blackHoldingExpenses?.toLocaleString() || '0'} €`}
          subtitle={formatPeriod()}
          icon={<AccountBalanceIcon />}
          gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
        />

        <StatCard
          title="Provízie za obdobie"
          value={`${stats?.totalCommissionPeriod?.toLocaleString() || '0'} €`}
          subtitle={formatPeriod()}
          icon={<PercentIcon />}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        />
      </div>

      {/* Existujúce kľúčové metriky */}
      <h5 className="text-xl font-bold mb-4 text-blue-500">
        Všeobecné štatistiky
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Celkové príjmy"
          value={`${stats?.totalRevenue?.toLocaleString() || '0'} €`}
          subtitle="Všetky časy"
          icon={<EuroIcon />}
          gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
          trend={{ value: 12.5, isPositive: true }}
        />

        <StatCard
          title="Aktívne prenájmy"
          value={stats?.activeRentals?.length || 0}
          subtitle="Momentálne aktívne"
          icon={<CarIcon />}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />

        <StatCard
          title="Dnešné vrátenia"
          value={stats?.todayReturns?.length || 0}
          subtitle="Vrátenia dnes"
          icon={<CalendarIcon />}
          gradient="linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)"
        />

        <StatCard
          title="Nezaplatené"
          value={stats?.unpaidRentals?.length || 0}
          subtitle="Čakajú na platbu"
          icon={<WarningIcon />}
          gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
        />
      </div>

      {/* Modernizované Tabs */}
      <ShadcnCard className="mb-6 shadow-md">
        <ShadcnTabs
          value={tabValue.toString()}
          onValueChange={value => setTabValue(Number(value))}
          className="w-full"
        >
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-gray-50 to-gray-100">
              <TabsTrigger
                value="0"
                className="flex items-center gap-2 text-base font-semibold min-h-16 data-[state=active]:text-blue-500"
              >
                <AssessmentIcon className="h-5 w-5" />
                Prehľad
              </TabsTrigger>
              <TabsTrigger
                value="1"
                className="flex items-center gap-2 text-base font-semibold min-h-16 data-[state=active]:text-blue-500"
              >
                <ShowChartIcon className="h-5 w-5" />
                Grafy
              </TabsTrigger>
              <TabsTrigger
                value="2"
                className="flex items-center gap-2 text-base font-semibold min-h-16 data-[state=active]:text-blue-500"
              >
                <BusinessIcon className="h-5 w-5" />
                Firmy
              </TabsTrigger>
              <TabsTrigger
                value="3"
                className="flex items-center gap-2 text-base font-semibold min-h-16 data-[state=active]:text-blue-500"
              >
                <PaymentIcon className="h-5 w-5" />
                Platby
              </TabsTrigger>
              <TabsTrigger
                value="4"
                className="flex items-center gap-2 text-base font-semibold min-h-16 data-[state=active]:text-blue-500"
              >
                <TrophyIcon className="h-5 w-5" />
                Top štatistiky
              </TabsTrigger>
              <TabsTrigger
                value="5"
                className="flex items-center gap-2 text-base font-semibold min-h-16 data-[state=active]:text-blue-500"
              >
                <PersonIcon className="h-5 w-5" />
                Zamestnanci
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Prehľad */}
          <TabsContent value="0" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Mesiačný trend */}
              <div className="lg:col-span-8">
                <ShadcnCard className="shadow-md transition-all duration-200 hover:shadow-lg">
                  <ShadcnCardContent>
                    <h6 className="text-lg font-bold mb-2 text-blue-500">
                      Mesiačný trend príjmov
                    </h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={stats?.monthlyData || []}>
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
                          <linearGradient
                            id="colorRevenue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#667eea"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#667eea"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>

              {/* Rýchle štatistiky */}
              <div className="lg:col-span-4">
                <ShadcnCard className="shadow-md transition-all duration-200 hover:shadow-lg">
                  <ShadcnCardContent>
                    <h6 className="text-lg font-bold mb-2 text-blue-500">
                      Rýchle štatistiky
                    </h6>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center p-4 rounded bg-gray-50">
                        <span className="text-sm font-semibold">
                          Priemerná cena
                        </span>
                        <span className="text-lg font-bold text-teal-600">
                          {stats?.avgRentalPrice?.toFixed(2) || '0.00'} €
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center p-4 rounded bg-gray-50">
                        <span className="text-sm font-semibold">
                          Priemerná dĺžka
                        </span>
                        <span className="text-lg font-bold text-blue-500">
                          {stats?.avgRentalDuration?.toFixed(1) || '0.0'} dní
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center p-4 rounded bg-gray-50">
                        <span className="text-sm font-semibold">
                          Celková provízia
                        </span>
                        <span className="text-lg font-bold text-orange-500">
                          {stats?.totalCommission?.toLocaleString() || '0'} €
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center p-4 rounded bg-gray-50">
                        <span className="text-sm font-semibold">
                          Zajtrajšie vrátenia
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {stats?.tomorrowReturns?.length || 0}
                        </span>
                      </div>
                    </div>
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>

              {/* Top firmy */}
              <div className="col-span-12">
                <ShadcnCard className="shadow-md transition-all duration-200 hover:shadow-lg">
                  <ShadcnCardContent>
                    <h6 className="text-lg font-bold mb-2 text-blue-500">
                      Top firmy podľa príjmov
                    </h6>
                    <div className="overflow-x-auto">
                      <ShadcnTable>
                        <ShadcnTableHeader>
                          <ShadcnTableRow className="bg-gray-50">
                            <ShadcnTableHead className="font-bold">
                              Firma
                            </ShadcnTableHead>
                            <ShadcnTableHead className="text-right font-bold">
                              Počet prenájmov
                            </ShadcnTableHead>
                            <ShadcnTableHead className="text-right font-bold">
                              Príjmy
                            </ShadcnTableHead>
                            <ShadcnTableHead className="text-right font-bold">
                              Provízia
                            </ShadcnTableHead>
                          </ShadcnTableRow>
                        </ShadcnTableHeader>
                        <ShadcnTableBody>
                          {Object.entries(stats?.companyStats || {})
                            .sort(([, a], [, b]) => {
                              const aData = a as {
                                count: number;
                                revenue: number;
                                commission: number;
                              };
                              const bData = b as {
                                count: number;
                                revenue: number;
                                commission: number;
                              };
                              return bData.revenue - aData.revenue;
                            })
                            .slice(0, 5)
                            .map(([company, data]) => {
                              const typedData = data as {
                                count: number;
                                revenue: number;
                                commission: number;
                              };
                              return (
                                <ShadcnTableRow
                                  key={company}
                                  className="hover:bg-gray-50 transition-colors duration-200"
                                >
                                  <ShadcnTableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                        <PersonIcon className="h-4 w-4 text-white" />
                                      </div>
                                      <span className="text-sm font-medium">
                                        {company}
                                      </span>
                                    </div>
                                  </ShadcnTableCell>
                                  <ShadcnTableCell className="text-right">
                                    <Badge className="bg-blue-500 text-white font-semibold">
                                      {typedData.count}
                                    </Badge>
                                  </ShadcnTableCell>
                                  <ShadcnTableCell className="text-right">
                                    <span className="text-sm font-bold text-teal-600">
                                      {typedData.revenue.toLocaleString()} €
                                    </span>
                                  </ShadcnTableCell>
                                  <ShadcnTableCell className="text-right">
                                    <span className="text-sm font-bold text-orange-500">
                                      {typedData.commission.toLocaleString()} €
                                    </span>
                                  </ShadcnTableCell>
                                </ShadcnTableRow>
                              );
                            })}
                        </ShadcnTableBody>
                      </ShadcnTable>
                    </div>
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Grafy */}
          <TabsContent value="1" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Stĺpcový graf - mesiačné prenájmy */}
              <div className="lg:col-span-6">
                <ShadcnCard className="shadow-md transition-all duration-200 hover:shadow-lg">
                  <ShadcnCardContent>
                    <h6 className="text-lg font-bold mb-2 text-blue-500">
                      Počet prenájmov podľa mesiacov
                    </h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats?.monthlyData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="rentals"
                          fill="#667eea"
                          name="Prenájmy"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>

              {/* Koláčový graf - spôsoby platby */}
              <div className="lg:col-span-6">
                <ShadcnCard className="shadow-md transition-all duration-200 hover:shadow-lg">
                  <ShadcnCardContent>
                    <h6 className="text-lg font-bold mb-2 text-blue-500">
                      Rozdelenie podľa spôsobu platby
                    </h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            stats?.paymentMethodStats || {}
                          ).map(([method, data]) => {
                            const typedData = data as {
                              count: number;
                              revenue: number;
                            };
                            return {
                              name: method,
                              value: typedData.count,
                            };
                          })}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#667eea"
                          dataKey="value"
                        >
                          {Object.entries(stats?.paymentMethodStats || {}).map(
                            (_entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>

              {/* Línový graf - trend príjmov vs provízií */}
              <div className="col-span-12">
                <ShadcnCard className="shadow-md transition-all duration-200 hover:shadow-lg">
                  <ShadcnCardContent>
                    <h6 className="text-lg font-bold mb-2 text-blue-500">
                      Trend príjmov vs provízií
                    </h6>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={stats?.monthlyData || []}>
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
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Firmy */}
          <TabsContent value="2" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(stats?.companyStats || {})
                .sort(([, a], [, b]) => {
                  const aData = a as {
                    count: number;
                    revenue: number;
                    commission: number;
                  };
                  const bData = b as {
                    count: number;
                    revenue: number;
                    commission: number;
                  };
                  return bData.revenue - aData.revenue;
                })
                .map(([company, data]) => {
                  const typedData = data as {
                    count: number;
                    revenue: number;
                    commission: number;
                  };
                  return (
                    <div key={company}>
                      <ShadcnCard className="shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
                        <ShadcnCardContent>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <PersonIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h6 className="text-lg font-bold">{company}</h6>
                              <span className="text-sm text-gray-600">
                                {typedData.count} prenájmov
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between mb-2 p-3 rounded bg-gray-50">
                            <span className="text-sm font-semibold">
                              Príjmy:
                            </span>
                            <span className="text-sm font-bold text-teal-600">
                              {typedData.revenue.toLocaleString()} €
                            </span>
                          </div>

                          <div className="flex justify-between p-3 rounded bg-orange-50">
                            <span className="text-sm font-semibold">
                              Provízia:
                            </span>
                            <span className="text-sm font-bold text-orange-600">
                              {typedData.commission.toLocaleString()} €
                            </span>
                          </div>
                        </ShadcnCardContent>
                      </ShadcnCard>
                    </div>
                  );
                })}
            </div>
          </TabsContent>

          {/* Tab 4: Platby */}
          <TabsContent value="3" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <ShadcnCard className="shadow-md transition-all duration-200 hover:shadow-lg">
                  <ShadcnCardContent>
                    <h6 className="text-lg font-bold mb-2 text-blue-500">
                      Štatistiky platieb
                    </h6>
                    <div className="overflow-x-auto">
                      <ShadcnTable>
                        <ShadcnTableHeader>
                          <ShadcnTableRow className="bg-gray-50">
                            <ShadcnTableHead className="font-bold">
                              Spôsob platby
                            </ShadcnTableHead>
                            <ShadcnTableHead className="text-right font-bold">
                              Počet
                            </ShadcnTableHead>
                            <ShadcnTableHead className="text-right font-bold">
                              Príjmy
                            </ShadcnTableHead>
                            <ShadcnTableHead className="text-right font-bold">
                              Podiel
                            </ShadcnTableHead>
                          </ShadcnTableRow>
                        </ShadcnTableHeader>
                        <ShadcnTableBody>
                          {Object.entries(stats?.paymentMethodStats || {})
                            .sort(([, a], [, b]) => {
                              const aData = a as {
                                count: number;
                                revenue: number;
                              };
                              const bData = b as {
                                count: number;
                                revenue: number;
                              };
                              return bData.revenue - aData.revenue;
                            })
                            .map(([method, data]) => {
                              const typedData = data as {
                                count: number;
                                revenue: number;
                              };
                              const percentage =
                                (typedData.revenue /
                                  (stats?.totalRevenue || 1)) *
                                100;
                              return (
                                <ShadcnTableRow
                                  key={method}
                                  className="hover:bg-gray-50 transition-colors duration-200"
                                >
                                  <ShadcnTableCell>
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-blue-500 text-white font-semibold">
                                        {method}
                                      </Badge>
                                    </div>
                                  </ShadcnTableCell>
                                  <ShadcnTableCell className="text-right">
                                    <span className="text-sm font-bold">
                                      {typedData.count}
                                    </span>
                                  </ShadcnTableCell>
                                  <ShadcnTableCell className="text-right">
                                    <span className="text-sm font-bold text-teal-600">
                                      {typedData.revenue.toLocaleString()} €
                                    </span>
                                  </ShadcnTableCell>
                                  <ShadcnTableCell className="text-right">
                                    <span className="text-sm font-bold text-gray-600">
                                      {percentage.toFixed(1)}%
                                    </span>
                                  </ShadcnTableCell>
                                </ShadcnTableRow>
                              );
                            })}
                        </ShadcnTableBody>
                      </ShadcnTable>
                    </div>
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>

              <div className="lg:col-span-4">
                <ShadcnCard className="shadow-md transition-all duration-200 hover:shadow-lg">
                  <ShadcnCardContent>
                    <h6 className="text-lg font-bold mb-2 text-blue-500">
                      Nezaplatené prenájmy
                    </h6>
                    {stats?.unpaidRentals?.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
                        <p className="text-lg font-bold text-green-600 mb-2">
                          Všetky prenájmy sú zaplatené!
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {(stats?.unpaidRentals as Rental[] | undefined)
                          ?.slice(0, 5)
                          .map(rental => (
                            <div
                              key={rental.id}
                              className="p-4 border border-gray-200 rounded-lg bg-orange-50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                            >
                              <p className="text-sm font-bold">
                                {rental.customerName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {rental.vehicle?.brand} {rental.vehicle?.model}
                              </p>
                              <p className="text-sm font-bold text-red-600">
                                {typeof rental.totalPrice === 'number'
                                  ? rental.totalPrice.toLocaleString()
                                  : '0'}{' '}
                                €
                              </p>
                            </div>
                          ))}
                        {stats?.unpaidRentals?.length &&
                          stats.unpaidRentals.length > 5 && (
                            <p className="text-sm text-gray-600 text-center font-bold">
                              +{' '}
                              {stats?.unpaidRentals?.length
                                ? stats.unpaidRentals.length - 5
                                : 0}{' '}
                              ďalších
                            </p>
                          )}
                      </div>
                    )}
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>
            </div>
          </TabsContent>

          {/* Tab 5: NOVÝ - Top štatistiky */}
          <TabsContent value="4" className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Úvodný prehľad */}
              <div>
                <ShadcnCard
                  className="mb-6 text-white shadow-xl"
                  style={{
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <ShadcnCardContent>
                    <div className="flex items-center gap-4">
                      <TrophyIcon className="h-12 w-12" />
                      <div>
                        <h4 className="text-3xl font-bold mb-2">
                          TOP Štatistiky
                        </h4>
                        <p className="text-lg opacity-90">
                          Najlepšie výkony za obdobie: {formatPeriod()}
                        </p>
                      </div>
                    </div>
                  </ShadcnCardContent>
                </ShadcnCard>
              </div>

              {/* 🏆 NAJLEPŠIE VÝKONY - Prehľadové karty */}
              <div>
                <h5 className="text-2xl font-bold mb-4 text-blue-500 flex items-center gap-2">
                  <StarIcon className="h-5 w-5" />
                  🏆 Najlepšie výkony
                </h5>
              </div>

              {/* Top výkony v 3 kartách */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <TopStatCard
                    title="Najvyťaženejšie auto"
                    icon={<SpeedIcon className="h-6 w-6" />}
                    data={
                      (stats?.topVehicleByUtilization as Record<
                        string,
                        unknown
                      >) || {}
                    }
                    primaryValue={
                      stats?.topVehicleByUtilization
                        ? `${stats.topVehicleByUtilization.utilizationPercentage.toFixed(1)}%`
                        : 'N/A'
                    }
                    secondaryValue={
                      stats?.topVehicleByUtilization
                        ? `${stats.topVehicleByUtilization.totalDaysRented} dní prenájmu`
                        : ''
                    }
                    gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    percentage={
                      stats?.topVehicleByUtilization?.utilizationPercentage
                    }
                  />
                </div>

                <div>
                  <TopStatCard
                    title="Najvýnosnejšie auto"
                    icon={<EuroIcon className="h-6 w-6" />}
                    data={
                      (stats.topVehicleByRevenue as Record<string, unknown>) ||
                      {}
                    }
                    primaryValue={
                      stats.topVehicleByRevenue
                        ? `${stats.topVehicleByRevenue.totalRevenue.toLocaleString()} €`
                        : 'N/A'
                    }
                    secondaryValue={
                      stats.topVehicleByRevenue
                        ? `${stats.topVehicleByRevenue.rentalCount} prenájmov`
                        : ''
                    }
                    gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                  />
                </div>

                <div>
                  <TopStatCard
                    title="Najaktívnejší zákazník"
                    icon={<PersonIcon className="h-6 w-6" />}
                    data={
                      (stats.topCustomerByRentals as Record<string, unknown>) ||
                      {}
                    }
                    primaryValue={
                      stats.topCustomerByRentals
                        ? `${stats.topCustomerByRentals.rentalCount}x`
                        : 'N/A'
                    }
                    secondaryValue={
                      stats.topCustomerByRentals
                        ? `${stats.topCustomerByRentals.totalRevenue.toLocaleString()} € celkom`
                        : ''
                    }
                    gradient="linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)"
                  />
                </div>
              </div>

              {/* Divider */}
              <div>
                <Separator className="my-4" />
              </div>

              {/* 🚗 TOP AUTÁ - Detailné rebríčky */}
              <div>
                <h5 className="text-2xl font-bold mb-4 text-blue-500 flex items-center gap-2">
                  <CarIcon className="h-5 w-5" />
                  🚗 TOP Autá - Detailné rebríčky
                </h5>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <TopListCard
                    title="Najvyťaženejšie autá"
                    icon={<SpeedIcon />}
                    gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    data={
                      stats.vehiclesByUtilization as Record<string, unknown>[]
                    }
                    showCount={showVehiclesByUtilization}
                    onLoadMore={() =>
                      setShowVehiclesByUtilization(prev => prev + 10)
                    }
                    renderItem={(vehicleData, index) => {
                      const vehicle = vehicleData as VehicleStatistic;
                      return (
                        <div
                          key={vehicle.vehicle?.id || index}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                            index < 3 ? 'bg-blue-50' : 'bg-gray-50'
                          } ${
                            index === 0
                              ? 'border-2 border-yellow-400'
                              : 'border border-gray-200'
                          }`}
                        >
                          <div
                            className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index < 3 ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <CarIcon className="h-4 w-4 text-white" />
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-bold">
                              {vehicle.vehicle?.brand || 'N/A'}{' '}
                              {vehicle.vehicle?.model || ''}
                            </p>
                            <p className="text-xs text-gray-600">
                              {vehicle.vehicle?.licensePlate || 'N/A'} •{' '}
                              {vehicle.totalDaysRented || 0} dní
                            </p>
                          </div>

                          <div className="text-right min-w-20">
                            <p
                              className={`text-lg font-bold ${
                                (vehicle.utilizationPercentage || 0) > 70
                                  ? 'text-green-500'
                                  : (vehicle.utilizationPercentage || 0) > 40
                                    ? 'text-orange-500'
                                    : 'text-red-500'
                              }`}
                            >
                              {(vehicle.utilizationPercentage || 0).toFixed(1)}%
                            </p>
                            <Progress
                              value={Math.min(
                                vehicle.utilizationPercentage || 0,
                                100
                              )}
                              className={`h-1.5 ${
                                (vehicle.utilizationPercentage || 0) > 70
                                  ? 'bg-green-500'
                                  : (vehicle.utilizationPercentage || 0) > 40
                                    ? 'bg-orange-500'
                                    : 'bg-red-500'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    }}
                    emptyMessage="Žiadne autá v tomto období"
                  />
                </div>

                <div>
                  <TopListCard
                    title="Najvýnosnejšie autá"
                    icon={<EuroIcon />}
                    gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
                    data={stats.vehiclesByRevenue as Record<string, unknown>[]}
                    showCount={showVehiclesByRevenue}
                    onLoadMore={() =>
                      setShowVehiclesByRevenue(prev => prev + 10)
                    }
                    renderItem={(vehicleData, index) => {
                      const vehicle = vehicleData as VehicleStatistic;
                      return (
                        <div
                          key={vehicle.vehicle?.id || index}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                            index < 3 ? 'bg-teal-50' : 'bg-gray-50'
                          } ${
                            index === 0
                              ? 'border-2 border-yellow-400'
                              : 'border border-gray-200'
                          }`}
                        >
                          <div
                            className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index < 3 ? 'bg-teal-500' : 'bg-gray-400'
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center">
                            <CarIcon className="h-4 w-4 text-white" />
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-bold">
                              {vehicle.vehicle?.brand || 'N/A'}{' '}
                              {vehicle.vehicle?.model || ''}
                            </p>
                            <p className="text-xs text-gray-600">
                              {vehicle.vehicle?.licensePlate || 'N/A'} •{' '}
                              {vehicle.rentalCount || 0} prenájmov
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-teal-600">
                              {(vehicle.totalRevenue || 0).toLocaleString()} €
                            </p>
                            <p className="text-xs text-gray-600">
                              {(vehicle.avgRevenuePerRental || 0).toFixed(0)}{' '}
                              €/prenájom
                            </p>
                          </div>
                        </div>
                      );
                    }}
                    emptyMessage="Žiadne autá v tomto období"
                  />
                </div>

                <div>
                  <TopListCard
                    title="Najčastejšie prenajímané"
                    icon={<CarIcon />}
                    gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                    data={stats.vehiclesByRentals as Record<string, unknown>[]}
                    showCount={showVehiclesByRentals}
                    onLoadMore={() =>
                      setShowVehiclesByRentals(prev => prev + 10)
                    }
                    renderItem={(vehicleData, index) => {
                      const vehicle = vehicleData as VehicleStatistic;
                      return (
                        <div
                          key={vehicle.vehicle?.id || index}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                            index < 3 ? 'bg-pink-50' : 'bg-gray-50'
                          } ${
                            index === 0
                              ? 'border-2 border-yellow-400'
                              : 'border border-gray-200'
                          }`}
                        >
                          <div
                            className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index < 3 ? 'bg-pink-500' : 'bg-gray-400'
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center">
                            <CarIcon className="h-4 w-4 text-white" />
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-bold">
                              {vehicle.vehicle?.brand || 'N/A'}{' '}
                              {vehicle.vehicle?.model || ''}
                            </p>
                            <p className="text-xs text-gray-600">
                              {vehicle.vehicle?.licensePlate || 'N/A'} •{' '}
                              {vehicle.totalDaysRented || 0} dní celkom
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-pink-500">
                              {vehicle.rentalCount || 0}x
                            </p>
                            <p className="text-xs text-gray-600">
                              {(vehicle.totalRevenue || 0).toLocaleString()} €
                              celkom
                            </p>
                          </div>
                        </div>
                      );
                    }}
                    emptyMessage="Žiadne autá v tomto období"
                  />
                </div>

                {/* Divider */}
                <div>
                  <Separator className="my-4" />
                </div>

                {/* 👥 TOP ZÁKAZNÍCI - Detailné rebríčky */}
                <div>
                  <h5 className="text-2xl font-bold mb-4 text-blue-500 flex items-center gap-2">
                    <PersonIcon className="h-5 w-5" />
                    👥 TOP Zákazníci - Detailné rebríčky
                  </h5>
                </div>

                <div>
                  <TopListCard
                    title="Najaktívnejší zákazníci"
                    icon={<StarIcon />}
                    gradient="linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)"
                    data={stats.customersByRentals as Record<string, unknown>[]}
                    showCount={showCustomersByRentals}
                    onLoadMore={() =>
                      setShowCustomersByRentals(prev => prev + 10)
                    }
                    renderItem={(customerData, index) => {
                      const customer = customerData as CustomerStatistic;
                      return (
                        <div
                          key={customer.customerName || index}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                            index < 3 ? 'bg-pink-50' : 'bg-gray-50'
                          } ${
                            index === 0
                              ? 'border-2 border-yellow-400'
                              : 'border border-gray-200'
                          }`}
                        >
                          <div
                            className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index < 3 ? 'bg-pink-500' : 'bg-gray-400'
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div className="w-10 h-10 rounded-full bg-pink-400 flex items-center justify-center">
                            <PersonIcon className="h-4 w-4 text-white" />
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-bold">
                              {customer.customerName || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {customer.totalDaysRented || 0} dní celkom •
                              Priemer:{' '}
                              {(customer.avgRentalDuration || 0).toFixed(1)} dní
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-pink-500">
                              {customer.rentalCount || 0}x
                            </p>
                            <p className="text-xs text-gray-600">
                              {(customer.totalRevenue || 0).toLocaleString()} €
                              celkom
                            </p>
                          </div>
                        </div>
                      );
                    }}
                    emptyMessage="Žiadni zákazníci v tomto období"
                  />
                </div>

                <div>
                  <TopListCard
                    title="Najziskovejší zákazníci"
                    icon={<MoneyIcon />}
                    gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
                    data={stats.customersByRevenue as Record<string, unknown>[]}
                    showCount={showCustomersByRevenue}
                    onLoadMore={() =>
                      setShowCustomersByRevenue(prev => prev + 10)
                    }
                    renderItem={(customerData, index) => {
                      const customer = customerData as CustomerStatistic;
                      return (
                        <div
                          key={customer.customerName || index}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                            index < 3 ? 'bg-red-50' : 'bg-gray-50'
                          } ${
                            index === 0
                              ? 'border-2 border-yellow-400'
                              : 'border border-gray-200'
                          }`}
                        >
                          <div
                            className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index < 3 ? 'bg-red-500' : 'bg-gray-400'
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                            <PersonIcon className="h-4 w-4 text-white" />
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-bold">
                              {customer.customerName || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {customer.rentalCount || 0} prenájmov •{' '}
                              {customer.totalDaysRented || 0} dní
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-red-500">
                              {(customer.totalRevenue || 0).toLocaleString()} €
                            </p>
                            <p className="text-xs text-gray-600">
                              {(
                                (customer.totalRevenue || 0) /
                                (customer.rentalCount || 1)
                              ).toFixed(0)}{' '}
                              €/prenájom
                            </p>
                          </div>
                        </div>
                      );
                    }}
                    emptyMessage="Žiadni zákazníci v tomto období"
                  />
                </div>

                <div>
                  <TopListCard
                    title="Najdlhodobejší zákazníci"
                    icon={<TimeIcon />}
                    gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                    data={stats.customersByDays as Record<string, unknown>[]}
                    showCount={showCustomersByDays}
                    onLoadMore={() => setShowCustomersByDays(prev => prev + 10)}
                    renderItem={(customerData, index) => {
                      const customer = customerData as CustomerStatistic;
                      return (
                        <div
                          key={customer.customerName || index}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                            index < 3 ? 'bg-blue-50' : 'bg-gray-50'
                          } ${
                            index === 0
                              ? 'border-2 border-yellow-400'
                              : 'border border-gray-200'
                          }`}
                        >
                          <div
                            className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index < 3 ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
                            <PersonIcon className="h-4 w-4 text-white" />
                          </div>

                          <div className="flex-1">
                            <p className="text-sm font-bold">
                              {customer.customerName || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {customer.rentalCount || 0} prenájmov •{' '}
                              {(customer.totalRevenue || 0).toLocaleString()} €
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-500">
                              {customer.totalDaysRented || 0} dní
                            </p>
                            <p className="text-xs text-gray-600">
                              Priemer:{' '}
                              {(customer.avgRentalDuration || 0).toFixed(1)}{' '}
                              dní/prenájom
                            </p>
                          </div>
                        </div>
                      );
                    }}
                    emptyMessage="Žiadni zákazníci v tomto období"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 6: Zamestnanci */}
          <TabsContent value="5" className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Header */}
              <div>
                <h5 className="text-2xl font-bold mb-4 text-blue-500 flex items-center gap-2">
                  <PersonIcon className="h-5 w-5" />
                  Výkon zamestnancov za obdobie: {formatPeriod()}
                </h5>
              </div>

              {/* Employee Statistics Cards */}
              {stats.employeeStats &&
              stats.employeeStats.activeEmployees > 0 ? (
                <>
                  {/* Summary Stats */}
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <ShadcnCard
                          className="shadow-md text-white"
                          style={{
                            background:
                              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          }}
                        >
                          <ShadcnCardContent className="text-center">
                            <h4 className="text-3xl font-bold mb-2">
                              {stats.employeeStats.totalProtocols}
                            </h4>
                            <p className="text-sm">Celkovo protokolov</p>
                          </ShadcnCardContent>
                        </ShadcnCard>
                      </div>
                      <div>
                        <ShadcnCard
                          className="shadow-md text-white"
                          style={{
                            background:
                              'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          }}
                        >
                          <ShadcnCardContent className="text-center">
                            <h4 className="text-3xl font-bold mb-2">
                              {stats.employeeStats.totalHandovers}
                            </h4>
                            <p className="text-sm">Odovzdaní</p>
                          </ShadcnCardContent>
                        </ShadcnCard>
                      </div>
                      <div>
                        <ShadcnCard
                          className="shadow-md text-white"
                          style={{
                            background:
                              'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          }}
                        >
                          <ShadcnCardContent className="text-center">
                            <h4 className="text-3xl font-bold mb-2">
                              {stats.employeeStats.totalReturns}
                            </h4>
                            <p className="text-sm">Prebraní</p>
                          </ShadcnCardContent>
                        </ShadcnCard>
                      </div>
                      <div>
                        <ShadcnCard
                          className="shadow-md text-white"
                          style={{
                            background:
                              'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                          }}
                        >
                          <ShadcnCardContent className="text-center">
                            <h4 className="text-3xl font-bold mb-2">
                              {stats.employeeStats.activeEmployees}
                            </h4>
                            <p className="text-sm">Aktívnych zamestnancov</p>
                          </ShadcnCardContent>
                        </ShadcnCard>
                      </div>
                    </div>
                  </div>

                  {/* Top Employees by Protocols */}
                  <div>
                    <ShadcnCard className="shadow-md h-full">
                      <ShadcnCardContent>
                        <h6 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <TrophyIcon className="h-5 w-5" />
                          Top zamestnanci (protokoly)
                        </h6>
                        <div className="max-h-96 overflow-y-auto">
                          {stats.employeeStats.topEmployeesByProtocols
                            .slice(0, 10)
                            .map(
                              (
                                employeeData: Record<string, unknown>,
                                index: number
                              ) => {
                                const employee =
                                  employeeData as EmployeeStatistic;
                                return (
                                  <div
                                    key={employee.employeeName || index}
                                    className={`flex justify-between items-center p-4 mb-2 rounded-lg border ${
                                      index < 3
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                          index === 0
                                            ? 'bg-yellow-500'
                                            : index === 1
                                              ? 'bg-gray-400'
                                              : index === 2
                                                ? 'bg-yellow-600'
                                                : 'bg-blue-500'
                                        }`}
                                      >
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold">
                                          {employee.employeeName || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {employee.handoverCount || 0}{' '}
                                          odovzdaní •{' '}
                                          {employee.returnCount || 0} prebraní
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-lg font-bold text-blue-500">
                                      {employee.totalProtocols || 0}
                                    </span>
                                  </div>
                                );
                              }
                            )}
                        </div>
                      </ShadcnCardContent>
                    </ShadcnCard>
                  </div>

                  {/* Top Employees by Revenue */}
                  <div>
                    <ShadcnCard className="shadow-md h-full">
                      <ShadcnCardContent>
                        <h6 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <EuroIcon className="h-5 w-5" />
                          Top zamestnanci (tržby)
                        </h6>
                        <div className="max-h-96 overflow-y-auto">
                          {stats.employeeStats.topEmployeesByRevenue
                            .slice(0, 10)
                            .map(
                              (
                                employeeData: Record<string, unknown>,
                                index: number
                              ) => {
                                const employee =
                                  employeeData as EmployeeStatistic;
                                return (
                                  <div
                                    key={employee.employeeName || index}
                                    className={`flex justify-between items-center p-4 mb-2 rounded-lg border ${
                                      index < 3
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                          index === 0
                                            ? 'bg-yellow-500'
                                            : index === 1
                                              ? 'bg-gray-400'
                                              : index === 2
                                                ? 'bg-yellow-600'
                                                : 'bg-green-500'
                                        }`}
                                      >
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold">
                                          {employee.employeeName || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {employee.totalProtocols || 0}{' '}
                                          protokolov
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-lg font-bold text-green-500">
                                      €
                                      {(
                                        employee.totalRevenue || 0
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                );
                              }
                            )}
                        </div>
                      </ShadcnCardContent>
                    </ShadcnCard>
                  </div>

                  {/* Detailed Employee Table */}
                  <div>
                    <ShadcnCard className="shadow-md">
                      <ShadcnCardContent>
                        <h6 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <AssessmentIcon className="h-5 w-5" />
                          Detailné štatistiky zamestnancov
                        </h6>
                        <ShadcnTable>
                          <ShadcnTableHeader>
                            <ShadcnTableRow>
                              <ShadcnTableHead className="font-semibold">
                                Zamestnanec
                              </ShadcnTableHead>
                              <ShadcnTableHead className="text-center font-semibold">
                                Protokoly
                              </ShadcnTableHead>
                              <ShadcnTableHead className="text-center font-semibold">
                                Odovzdania
                              </ShadcnTableHead>
                              <ShadcnTableHead className="text-center font-semibold">
                                Prebrania
                              </ShadcnTableHead>
                              <ShadcnTableHead className="text-right font-semibold">
                                Tržby
                              </ShadcnTableHead>
                              <ShadcnTableHead className="text-center font-semibold">
                                Prenájmy
                              </ShadcnTableHead>
                            </ShadcnTableRow>
                          </ShadcnTableHeader>
                          <ShadcnTableBody>
                            {stats.employeeStats.allEmployees
                              .sort(
                                (
                                  a: { totalProtocols: number },
                                  b: { totalProtocols: number }
                                ) =>
                                  (b.totalProtocols || 0) -
                                  (a.totalProtocols || 0)
                              )
                              .map(
                                (
                                  employeeData: Record<string, unknown>,
                                  index: number
                                ) => {
                                  const employee =
                                    employeeData as EmployeeStatistic;
                                  return (
                                    <ShadcnTableRow
                                      key={employee.employeeName || index}
                                      className="odd:bg-gray-50"
                                    >
                                      <ShadcnTableCell>
                                        <div className="flex items-center gap-2">
                                          <PersonIcon className="h-4 w-4 text-blue-600" />
                                          <span className="text-sm font-semibold">
                                            {employee.employeeName || 'N/A'}
                                          </span>
                                        </div>
                                      </ShadcnTableCell>
                                      <ShadcnTableCell className="text-center">
                                        <Badge className="bg-blue-500 text-white">
                                          {employee.totalProtocols || 0}
                                        </Badge>
                                      </ShadcnTableCell>
                                      <ShadcnTableCell className="text-center">
                                        <Badge className="bg-purple-500 text-white">
                                          {employee.handoverCount || 0}
                                        </Badge>
                                      </ShadcnTableCell>
                                      <ShadcnTableCell className="text-center">
                                        <Badge className="bg-cyan-500 text-white">
                                          {employee.returnCount || 0}
                                        </Badge>
                                      </ShadcnTableCell>
                                      <ShadcnTableCell className="text-right">
                                        <span className="text-sm font-semibold text-green-500">
                                          €
                                          {(
                                            employee.totalRevenue || 0
                                          ).toLocaleString()}
                                        </span>
                                      </ShadcnTableCell>
                                      <ShadcnTableCell className="text-center">
                                        <p className="text-sm">
                                          {employee.uniqueRentals || 0}
                                        </p>
                                      </ShadcnTableCell>
                                    </ShadcnTableRow>
                                  );
                                }
                              )}
                          </ShadcnTableBody>
                        </ShadcnTable>
                      </ShadcnCardContent>
                    </ShadcnCard>
                  </div>
                </>
              ) : (
                <div>
                  <ShadcnCard className="shadow-md">
                    <ShadcnCardContent className="text-center py-8">
                      <PersonIcon className="h-16 w-16 text-gray-600 mb-4" />
                      <p className="text-lg font-bold text-gray-600 mb-2">
                        Žiadne protokoly za vybrané obdobie
                      </p>
                      <p className="text-sm text-gray-600">
                        V tomto období neboli vytvorené žiadne protokoly
                        odovzdávania alebo preberania vozidiel.
                      </p>
                    </ShadcnCardContent>
                  </ShadcnCard>
                </div>
              )}
            </div>
          </TabsContent>
        </ShadcnTabs>
      </ShadcnCard>
    </div>
  );
};

export default Statistics;
