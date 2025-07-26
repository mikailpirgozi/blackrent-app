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
  Assessment as AssessmentIcon,
  Euro as EuroIcon,
  ShowChart as ShowChartIcon,
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Dashboard as DashboardIcon
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

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

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
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                  Obdobie
                </InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as 'month' | 'quarter' | 'year')}
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
                  <MenuItem value="quarter">Štvrťrok</MenuItem>
                  <MenuItem value="year">Rok</MenuItem>
                </Select>
              </FormControl>
              
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

      {/* Modernizované kľúčové metriky */}
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
      </Card>
    </Box>
  );
};

export default Statistics;
