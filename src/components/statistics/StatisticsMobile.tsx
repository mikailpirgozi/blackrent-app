/**
 * 📱 STATISTICS MOBILE
 * 
 * Mobile-optimized statistics dashboard s collapsible sections
 */

import React, { useState, memo, useMemo } from 'react';
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  useTheme,
  Typography,
  Alert
} from '@mui/material';
import {
  Assessment as StatsIcon,
  Euro as EuroIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Business as BusinessIcon,
  TrendingUp as TrendIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Percent as PercentIcon
} from '@mui/icons-material';
import StatisticsCard from './StatisticsCard';
import CollapsibleSection from './CollapsibleSection';
import ResponsiveChart from './ResponsiveChart';

interface StatisticsMobileProps {
  stats: any; // Statistics data from parent component
  timeRange: 'month' | 'year' | 'all';
  onTimeRangeChange: (range: 'month' | 'year' | 'all') => void;
  filterYear: number;
  filterMonth: number;
  onFilterYearChange: (year: number) => void;
  onFilterMonthChange: (month: number) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const StatisticsMobile: React.FC<StatisticsMobileProps> = ({
  stats,
  timeRange,
  onTimeRangeChange,
  filterYear,
  filterMonth,
  onFilterYearChange,
  onFilterMonthChange,
  onRefresh,
  isLoading = false
}) => {
  const theme = useTheme();
  
  // State pre expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview']) // Overview je default expanded
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!stats) return { monthly: [], vehicleStats: [], topCustomers: [] };

    // Monthly revenue data - podporuj monthlyStats (mobil starý) alebo monthlyData (desktop nový)
    const monthlyData = (stats.monthlyStats && Array.isArray(stats.monthlyStats))
      ? stats.monthlyStats.map((month: any, index: number) => ({
          name: `${index + 1}/${filterYear}`,
          revenue: month.totalRevenue || 0,
          rentals: month.totalRentals || 0,
          commission: month.totalCommission || 0
        }))
      : (stats.monthlyData && Array.isArray(stats.monthlyData))
        ? stats.monthlyData.map((m: any) => ({
            name: m.month,
            revenue: m.revenue || 0,
            rentals: m.rentals || 0,
            commission: m.commission || 0
          }))
        : [];

    // Vehicle statistics - podporuj topVehiclesByRevenue alebo vehiclesByRevenue (desktop nový)
    const vehiclesSource = (stats.topVehiclesByRevenue && Array.isArray(stats.topVehiclesByRevenue))
      ? stats.topVehiclesByRevenue
      : (stats.vehiclesByRevenue && Array.isArray(stats.vehiclesByRevenue))
        ? stats.vehiclesByRevenue
        : [];

    const vehicleData = vehiclesSource.slice(0, 5).map((v: any) => ({
      name: v.name || (v.vehicle ? `${v.vehicle.brand} ${v.vehicle.model}` : `${v.brand ?? ''} ${v.model ?? ''}`.trim()),
      revenue: v.totalRevenue || v.revenue || 0,
      utilization: v.utilizationRate || v.utilizationPercentage || 0
    }));

    // Top customers - podporuj topCustomersByRevenue alebo customersByRevenue (desktop nový)
    const customersSource = (stats.topCustomersByRevenue && Array.isArray(stats.topCustomersByRevenue))
      ? stats.topCustomersByRevenue
      : (stats.customersByRevenue && Array.isArray(stats.customersByRevenue))
        ? stats.customersByRevenue
        : [];

    const customerData = customersSource.slice(0, 5).map((c: any) => ({
      name: c.customerName || c.customer?.name || 'Neznámy zákazník',
      revenue: c.totalRevenue || c.revenue || 0,
      rentals: c.totalRentals || c.rentalCount || 0
    }));

    return {
      monthly: monthlyData,
      vehicleStats: vehicleData,
      topCustomers: customerData
    };
  }, [stats, filterYear]);

  // Derivované agregácie pre mobil z desktop štatistík
  const derivedTotals = useMemo(() => {
    const rentals = (stats?.filteredRentals && Array.isArray(stats.filteredRentals)) ? stats.filteredRentals : [];
    const totalRentals = rentals.length || stats?.totalRentals || 0;
    const activeVehicleIds = new Set<string>();
    rentals.forEach((r: any) => {
      if (r.vehicleId) activeVehicleIds.add(r.vehicleId);
      else if (r.vehicle?.id) activeVehicleIds.add(r.vehicle.id);
    });
    const activeVehicles = activeVehicleIds.size;
    const customerKeys = new Set<string>();
    rentals.forEach((r: any) => {
      const key = r.customerId || r.customerName || r.customer?.id;
      if (key) customerKeys.add(String(key));
    });
    const totalCustomers = customerKeys.size;
    return { totalRentals, activeVehicles, totalCustomers };
  }, [stats]);

  // Get years for filter
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  const months = [
    'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
    'Júl', 'August', 'September', 'Október', 'November', 'December'
  ];

  if (!stats) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info">
          📊 Načítavajú sa štatistiky...
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with filters */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
          📊 Štatistiky
        </Typography>

        {/* Time Range and Filters */}
        <Stack direction="column" spacing={2}>
          {/* Time Range Selector */}
          <FormControl size="small" fullWidth>
            <InputLabel>Časové obdobie</InputLabel>
            <Select
              value={timeRange}
              label="Časové obdobie"
              onChange={(e) => onTimeRangeChange(e.target.value as any)}
            >
              <MenuItem value="month">Mesiac</MenuItem>
              <MenuItem value="year">Rok</MenuItem>
              <MenuItem value="all">Celkovo</MenuItem>
            </Select>
          </FormControl>

          {/* Year/Month filters */}
          {timeRange !== 'all' && (
            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Rok</InputLabel>
                <Select
                  value={filterYear}
                  label="Rok"
                  onChange={(e) => onFilterYearChange(Number(e.target.value))}
                >
                  {availableYears.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {timeRange === 'month' && (
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Mesiac</InputLabel>
                  <Select
                    value={filterMonth}
                    label="Mesiac"
                    onChange={(e) => onFilterMonthChange(Number(e.target.value))}
                  >
                    {months.map((month, index) => (
                      <MenuItem key={index} value={index}>{month}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          )}

          {/* Refresh button */}
          {onRefresh && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={isLoading}
              size="small"
              fullWidth
            >
              {isLoading ? 'Načítavam...' : 'Obnoviť'}
            </Button>
          )}
        </Stack>
      </Box>

      {/* Overview Cards */}
      <CollapsibleSection
        title="Prehľad"
        icon={<StatsIcon />}
        color="primary"
        defaultExpanded={expandedSections.has('overview')}
        badge={6}
        compact
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <StatisticsCard
              title="Celkový príjem"
              value={`€${stats.totalRevenuePeriod?.toLocaleString() || 0}`}
              icon={<EuroIcon />}
              color="success"
              trend={stats.revenueTrend && {
                value: stats.revenueTrend,
                period: 'vs minulý mesiac',
                isPositive: stats.revenueTrend > 0
              }}
              compact
            />
          </Grid>
          
          <Grid item xs={6}>
            <StatisticsCard
              title="Provízie"
              value={`€${stats.totalCommissionPeriod?.toLocaleString() || 0}`}
              icon={<PercentIcon />}
              color="secondary"
              compact
            />
          </Grid>
          
          <Grid item xs={6}>
            <StatisticsCard
              title="Prenájmy"
              value={(derivedTotals.totalRentals || 0).toLocaleString()}
              icon={<ReceiptIcon />}
              color="primary"
              trend={stats.rentalsTrend && {
                value: stats.rentalsTrend,
                period: 'vs minulý mesiac',
                isPositive: stats.rentalsTrend > 0
              }}
              compact
            />
          </Grid>
          
          <Grid item xs={6}>
            <StatisticsCard
              title="Náklady BH"
              value={`€${stats.blackHoldingExpenses?.toLocaleString() || 0}`}
              icon={<BusinessIcon />}
              color="error"
              compact
            />
          </Grid>
          
          <Grid item xs={6}>
            <StatisticsCard
              title="Aktívne vozidlá"
              value={(derivedTotals.activeVehicles || 0).toLocaleString()}
              icon={<CarIcon />}
              color="info"
              compact
            />
          </Grid>
          
          <Grid item xs={6}>
            <StatisticsCard
              title="Zákazníci"
              value={(derivedTotals.totalCustomers || 0).toLocaleString()}
              icon={<PersonIcon />}
              color="warning"
              compact
            />
          </Grid>
        </Grid>
      </CollapsibleSection>

      {/* Revenue Chart */}
      <Box sx={{ mt: 2 }}>
        <CollapsibleSection
          title="Mesačné príjmy"
          icon={<TrendIcon />}
          color="success"
          defaultExpanded={expandedSections.has('revenue')}
          compact
        >
          <ResponsiveChart
            type="area"
            data={chartData.monthly}
            height={250}
            xAxisKey="name"
            series={[
              { key: 'revenue', color: theme.palette.success.main, name: 'Príjem' },
              { key: 'commission', color: theme.palette.warning.main, name: 'Provízia' }
            ]}
            showGrid={false}
          />
        </CollapsibleSection>
      </Box>

      {/* Vehicle Performance */}
      <Box sx={{ mt: 2 }}>
        <CollapsibleSection
          title="Najlepšie vozidlá"
          icon={<CarIcon />}
          color="primary"
          defaultExpanded={expandedSections.has('vehicles')}
          badge={chartData.vehicleStats.length}
          compact
        >
          <ResponsiveChart
            type="bar"
            data={chartData.vehicleStats}
            height={200}
            xAxisKey="name"
            dataKey="revenue"
            showGrid={false}
            colors={[theme.palette.primary.main]}
          />
        </CollapsibleSection>
      </Box>

      {/* Top Customers */}
      <Box sx={{ mt: 2 }}>
        <CollapsibleSection
          title="Top zákazníci"
          icon={<PersonIcon />}
          color="warning"
          defaultExpanded={expandedSections.has('customers')}
          badge={chartData.topCustomers.length}
          compact
        >
          <ResponsiveChart
            type="bar"
            data={chartData.topCustomers}
            height={200}
            xAxisKey="name"
            dataKey="revenue"
            showGrid={false}
            colors={[theme.palette.warning.main]}
          />
        </CollapsibleSection>
      </Box>

      {/* Companies Performance */}
      {(() => {
        const companiesArray = Array.isArray(stats?.companiesStats) ? stats.companiesStats
          : (stats?.companyStats && typeof stats.companyStats === 'object')
            ? Object.entries(stats.companyStats).map(([companyName, data]: any) => ({
                companyName,
                totalRevenue: data.revenue || 0,
                totalRentals: data.count || 0,
              }))
            : [];
        return companiesArray && companiesArray.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <CollapsibleSection
              title="Výkon firiem"
              icon={<BusinessIcon />}
              color="info"
              defaultExpanded={expandedSections.has('companies')}
              badge={companiesArray.length}
              compact
            >
              <Grid container spacing={2}>
                {companiesArray.slice(0, 3).map((company: any, index: number) => (
                  <Grid item xs={12} key={index}>
                    <StatisticsCard
                      title={company.companyName || 'Nezadaná firma'}
                      value={`€${(company.totalRevenue || 0).toLocaleString()}`}
                      subtitle={`${company.totalRentals || 0} prenájmov`}
                      icon={<BusinessIcon />}
                      color="info"
                      compact
                    />
                  </Grid>
                ))}
              </Grid>
            </CollapsibleSection>
          </Box>
        ) : null;
      })()}

      {/* Monthly Calendar View */}
      {timeRange === 'month' && (
        <Box sx={{ mt: 2 }}>
          <CollapsibleSection
            title="Mesačný kalendár"
            icon={<CalendarIcon />}
            color="secondary"
            defaultExpanded={false}
            compact
          >
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                🗓️ Kalendárne zobrazenie bude implementované v ďalšej verzii
              </Typography>
            </Box>
          </CollapsibleSection>
        </Box>
      )}

      {/* Employee Performance */}
      {stats.employeeStats && stats.employeeStats.activeEmployees > 0 && (
        <Box sx={{ mt: 2 }}>
          <CollapsibleSection
            title="Výkon zamestnancov"
            icon={<PersonIcon />}
            color="success"
            defaultExpanded={false}
            badge={stats.employeeStats.activeEmployees}
            compact
          >
            <Grid container spacing={2}>
              {stats.employeeStats.topEmployeesByProtocols.slice(0, 3).map((employee: any, index: number) => (
                <Grid item xs={12} key={index}>
                  <StatisticsCard
                    title={employee.employeeName}
                    value={`${employee.totalProtocols} protokolov`}
                    subtitle={`${employee.handoverCount} odovzdaní • ${employee.returnCount} prebraní • €${employee.totalRevenue?.toLocaleString() || 0}`}
                    icon={<PersonIcon />}
                    color={index === 0 ? 'success' : index === 1 ? 'warning' : 'info'}
                    compact
                  />
                </Grid>
              ))}
            </Grid>
            
            {/* Summary stats */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                📊 Celkové štatistiky protokolov
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                {stats.employeeStats.totalProtocols} protokolov • {stats.employeeStats.totalHandovers} odovzdaní • {stats.employeeStats.totalReturns} prebraní
              </Typography>
            </Box>
          </CollapsibleSection>
        </Box>
      )}

      {/* Performance Summary */}
      <Box sx={{ mt: 2, mb: 3 }}>
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            📈 Súhrn výkonu
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            {timeRange === 'month' ? `${months[filterMonth]} ${filterYear}` :
             timeRange === 'year' ? `Rok ${filterYear}` :
             'Celkové obdobie'
            }: {derivedTotals.totalRentals || 0} prenájmov • €{stats.totalRevenuePeriod?.toLocaleString() || 0} príjem • €{stats.totalCommissionPeriod?.toLocaleString() || 0} provízie • €{stats.blackHoldingExpenses?.toLocaleString() || 0} náklady BH
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default memo(StatisticsMobile);