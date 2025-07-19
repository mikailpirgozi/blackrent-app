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
import { useApp } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';

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

    // Aktívne prenájmy (dnešný dátum je medzi start a end)
    const activeRentals = state.rentals.filter(rental => {
      const start = new Date(rental.startDate);
      const end = new Date(rental.endDate);
      const today = new Date();
      return today >= start && today <= end;
    });

    // Výpočet príjmov
    const totalRevenue = state.rentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
    const monthlyRevenue = currentMonthRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
    const yearlyRevenue = currentYearRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);

    // Výpočet provízií
    const totalCommission = state.rentals.reduce((sum, rental) => sum + (rental.commission || 0), 0);
    const monthlyCommission = currentMonthRentals.reduce((sum, rental) => sum + (rental.commission || 0), 0);

    // Výpočet nákladov
    const totalExpenses = state.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const monthlyExpenses = state.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).reduce((sum, expense) => sum + (expense.amount || 0), 0);

    return {
      totalRentals: state.rentals.length,
      totalRevenue,
      totalCommission,
      totalExpenses,
      activeRentals: activeRentals.length,
      totalVehicles: state.vehicles.length,
      totalCustomers: state.customers.length,
      monthlyRevenue,
      monthlyCommission,
      monthlyExpenses,
      monthlyRentals: currentMonthRentals.length,
      yearlyRevenue,
      yearlyRentals: currentYearRentals.length,
      profit: totalRevenue - totalExpenses,
      monthlyProfit: monthlyRevenue - monthlyExpenses,
    };
  }, [state.rentals, state.expenses, state.vehicles, state.customers]);

  // Mesiačné dáta pre grafy
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date(),
    });

    return months.map(month => {
      const monthRentals = state.rentals.filter(rental => {
        const rentalDate = new Date(rental.startDate);
        return rentalDate.getMonth() === month.getMonth() && rentalDate.getFullYear() === month.getFullYear();
      });

      const monthExpenses = state.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month.getMonth() && expenseDate.getFullYear() === month.getFullYear();
      });

      const revenue = monthRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
      const commission = monthRentals.reduce((sum, rental) => sum + (rental.commission || 0), 0);
      const expenses = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

      return {
        month: format(month, 'MMM yyyy', { locale: sk }),
        revenue,
        commission,
        expenses,
        profit: revenue - expenses,
        rentals: monthRentals.length,
      };
    });
  }, [state.rentals, state.expenses]);

  // Dáta pre vozidlá
  const vehicleStats = useMemo(() => {
    const vehicleRentals = state.vehicles.map(vehicle => {
      const rentals = state.rentals.filter(rental => rental.vehicleId === vehicle.id);
      const revenue = rentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0);
      const expenses = state.expenses
        .filter(expense => expense.vehicleId === vehicle.id)
        .reduce((sum, expense) => sum + (expense.amount || 0), 0);

      return {
        name: `${vehicle.brand} ${vehicle.model}`,
        rentals: rentals.length,
        revenue,
        expenses,
        profit: revenue - expenses,
        licensePlate: vehicle.licensePlate,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return vehicleRentals;
  }, [state.vehicles, state.rentals, state.expenses]);

  // Dáta pre kategórie nákladov
  const expenseCategories = useMemo(() => {
    const categories = state.expenses.reduce((acc, expense) => {
      const category = expense.category || 'other';
      if (!acc[category]) {
        acc[category] = { amount: 0, count: 0 };
      }
      acc[category].amount += expense.amount || 0;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    return Object.entries(categories).map(([category, data]) => ({
      name: category === 'service' ? 'Servis' : 
            category === 'insurance' ? 'Poistenie' :
            category === 'fuel' ? 'Palivo' : 'Iné',
      value: data.amount,
      count: data.count,
    }));
  }, [state.expenses]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'text.primary' }}>
        📊 Štatistiky a Reporty
      </Typography>

      {/* Hlavné metriky */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Celkové príjmy
              </Typography>
              <Typography variant="h4">
                €{stats.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {stats.totalRentals} prenájmov
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Celkový zisk
              </Typography>
              <Typography variant="h4">
                €{stats.profit.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Po odpočítaní nákladov
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aktívne prenájmy
              </Typography>
              <Typography variant="h4">
                {stats.activeRentals}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Momentálne aktívne
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mesačné príjmy
              </Typography>
              <Typography variant="h4">
                €{stats.monthlyRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {stats.monthlyRentals} prenájmov tento mesiac
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs pre rôzne reporty */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="📈 Mesačné trendy" />
          <Tab label="🚗 Vozidlá" />
          <Tab label="💰 Náklady" />
          <Tab label="📋 Detailné reporty" />
        </Tabs>

        {/* Mesačné trendy */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Príjmy vs Náklady (12 mesiacov)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `€${value?.toLocaleString()}`} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" name="Príjmy" />
                      <Area type="monotone" dataKey="expenses" stackId="1" stroke="#ff7300" fill="#ff7300" name="Náklady" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Počet prenájmov
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="rentals" fill="#82ca9d" name="Prenájmy" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Vozidlá */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ziskovosť vozidiel
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={vehicleStats.slice(0, 10)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => `€${value?.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Príjmy" />
                      <Bar dataKey="expenses" fill="#ff7300" name="Náklady" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top vozidlá podľa príjmov
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Vozidlo</TableCell>
                          <TableCell align="right">Príjmy</TableCell>
                          <TableCell align="right">Prenájmy</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {vehicleStats.slice(0, 5).map((vehicle) => (
                          <TableRow key={vehicle.licensePlate}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {vehicle.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {vehicle.licensePlate}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              €{vehicle.revenue.toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              {vehicle.rentals}
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

        {/* Náklady */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rozdelenie nákladov
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `€${value?.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Celkové náklady: €{stats.totalExpenses.toLocaleString()}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {expenseCategories.map((category, index) => (
                      <Box key={category.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: COLORS[index % COLORS.length],
                              mr: 1,
                            }}
                          />
                          <Typography variant="body2">{category.name}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          €{category.value.toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Detailné reporty */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Mesačný súhrn
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Príjmy:</Typography>
                      <Typography fontWeight="bold" color="success.main">
                        €{stats.monthlyRevenue.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Provízie:</Typography>
                      <Typography fontWeight="bold" color="info.main">
                        €{stats.monthlyCommission.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Náklady:</Typography>
                      <Typography fontWeight="bold" color="error.main">
                        €{stats.monthlyExpenses.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="h6">Zisk:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        €{stats.monthlyProfit.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Celkový súhrn
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Celkové príjmy:</Typography>
                      <Typography fontWeight="bold" color="success.main">
                        €{stats.totalRevenue.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Celkové provízie:</Typography>
                      <Typography fontWeight="bold" color="info.main">
                        €{stats.totalCommission.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Celkové náklady:</Typography>
                      <Typography fontWeight="bold" color="error.main">
                        €{stats.totalExpenses.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="h6">Celkový zisk:</Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        €{stats.profit.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Aktívne prenájmy
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Zákazník</TableCell>
                          <TableCell>Vozidlo</TableCell>
                          <TableCell>Od</TableCell>
                          <TableCell>Do</TableCell>
                          <TableCell align="right">Cena</TableCell>
                          <TableCell align="right">Provízia</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {state.rentals
                          .filter(rental => {
                            const start = new Date(rental.startDate);
                            const end = new Date(rental.endDate);
                            const today = new Date();
                            return today >= start && today <= end;
                          })
                          .map((rental) => (
                            <TableRow key={rental.id}>
                              <TableCell>{rental.customerName}</TableCell>
                              <TableCell>
                                {state.vehicles.find(v => v.id === rental.vehicleId)?.licensePlate || 'N/A'}
                              </TableCell>
                              <TableCell>{format(new Date(rental.startDate), 'dd.MM.yyyy')}</TableCell>
                              <TableCell>{format(new Date(rental.endDate), 'dd.MM.yyyy')}</TableCell>
                              <TableCell align="right">€{rental.totalPrice?.toLocaleString()}</TableCell>
                              <TableCell align="right">€{rental.commission?.toLocaleString()}</TableCell>
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
      </Paper>
    </Box>
  );
};

export default Statistics;
