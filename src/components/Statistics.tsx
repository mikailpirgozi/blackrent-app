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
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays, isAfter, isBefore } from 'date-fns';
import { sk } from 'date-fns/locale';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Statistics: React.FC = () => {
  const { state } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [tabValue, setTabValue] = useState(0);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  // Reálne dáta z aplikácie
  const stats = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Filtrovanie prenájmov pre aktuálny mesiac
    const currentMonthRentals = state.rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate.getMonth() === currentMonth && rentalDate.getFullYear() === currentYear;
    });

    // Filtrovanie prenájmov pre aktuálny rok
    const currentYearRentals = state.rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate.getFullYear() === currentYear;
    });

    // Filtrovanie prenájmov pre vybraný mesiac
    const selectedMonthRentals = state.rentals.filter(rental => {
      const rentalDate = new Date(rental.startDate);
      return rentalDate.getMonth() === selectedMonth && rentalDate.getFullYear() === selectedYear;
    });

    // Filtrovanie prenájmov pre vybraný rok
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

    // Výpočet celkových príjmov
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
    };
  }, [state.rentals, selectedYear, selectedMonth]);

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

  // Statistiky kariet
  const StatCard = ({ title, value, subtitle, icon, color, trend }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <Fade in={true} timeout={500}>
      <Card sx={{ 
        height: '100%', 
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
              {icon}
            </Avatar>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {trend.isPositive ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography variant="caption" color={trend.isPositive ? 'success.main' : 'error.main'}>
                  {trend.value}%
                </Typography>
              </Box>
            )}
          </Box>
          
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Fade>
  );

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  Štatistiky a Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Prehľad výkonnosti a trendov
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small">
                <InputLabel>Obdobie</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as 'month' | 'quarter' | 'year')}
                  label="Obdobie"
                >
                  <MenuItem value="month">Mesiac</MenuItem>
                  <MenuItem value="quarter">Štvrťrok</MenuItem>
                  <MenuItem value="year">Rok</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                size="small"
              >
                Obnoviť
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Kľúčové metriky */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Celkové príjmy"
            value={`${stats.totalRevenue.toLocaleString()} €`}
            subtitle="Všetky časy"
            icon={<MoneyIcon />}
            color="success.main"
            trend={{ value: 12.5, isPositive: true }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aktívne prenájmy"
            value={stats.activeRentals.length}
            subtitle="Momentálne aktívne"
            icon={<CarIcon />}
            color="primary.main"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Dnešné vrátenia"
            value={stats.todayReturns.length}
            subtitle="Vrátenia dnes"
            icon={<CalendarIcon />}
            color="warning.main"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Nezaplatené"
            value={stats.unpaidRentals.length}
            subtitle="Čakajú na platbu"
            icon={<WarningIcon />}
            color="error.main"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="statistics tabs">
            <Tab label="Prehľad" />
            <Tab label="Grafy" />
            <Tab label="Firmy" />
            <Tab label="Platby" />
          </Tabs>
        </Box>

        {/* Tab 1: Prehľad */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Mesiačný trend */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
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
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                        name="Príjmy"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Rýchle štatistiky */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rýchle štatistiky
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Priemerná cena</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {stats.avgRentalPrice.toFixed(2)} €
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Priemerná dĺžka</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {stats.avgRentalDuration.toFixed(1)} dní
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Celková provízia</Typography>
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {stats.totalCommission.toLocaleString()} €
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Zajtrajšie vrátenia</Typography>
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
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top firmy podľa príjmov
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Firma</TableCell>
                          <TableCell align="right">Počet prenájmov</TableCell>
                          <TableCell align="right">Príjmy</TableCell>
                          <TableCell align="right">Provízia</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(stats.companyStats)
                          .sort(([,a], [,b]) => b.revenue - a.revenue)
                          .slice(0, 5)
                          .map(([company, data]) => (
                            <TableRow key={company}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                    <PersonIcon fontSize="small" />
                                  </Avatar>
                                  <Typography variant="body2" fontWeight="medium">
                                    {company}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={data.count} size="small" color="primary" variant="outlined" />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold">
                                  {data.revenue.toLocaleString()} €
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="warning.main">
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
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Počet prenájmov podľa mesiacov
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="rentals" fill="#8884d8" name="Prenájmy" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Koláčový graf - spôsoby platby */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
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
                        fill="#8884d8"
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
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
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
                        stroke="#8884d8" 
                        strokeWidth={3}
                        name="Príjmy"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="commission" 
                        stroke="#82ca9d" 
                        strokeWidth={3}
                        name="Provízie"
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
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
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
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Príjmy:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {data.revenue.toLocaleString()} €
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Provízia:</Typography>
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
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Štatistiky platieb
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Spôsob platby</TableCell>
                          <TableCell align="right">Počet</TableCell>
                          <TableCell align="right">Príjmy</TableCell>
                          <TableCell align="right">Podiel</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(stats.paymentMethodStats)
                          .sort(([,a], [,b]) => b.revenue - a.revenue)
                          .map(([method, data]) => {
                            const percentage = (data.revenue / stats.totalRevenue) * 100;
                            return (
                              <TableRow key={method}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip 
                                      label={method} 
                                      size="small" 
                                      color="primary" 
                                      variant="outlined" 
                                    />
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    {data.count}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    {data.revenue.toLocaleString()} €
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color="text.secondary">
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
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Nezaplatené prenájmy
                  </Typography>
                  {stats.unpaidRentals.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                      <Typography variant="body1" color="success.main" gutterBottom>
                        Všetky prenájmy sú zaplatené!
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {stats.unpaidRentals.slice(0, 5).map((rental) => (
                        <Box key={rental.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
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
                        <Typography variant="body2" color="text.secondary" textAlign="center">
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
      </Card>
    </Box>
  );
};

export default Statistics;
