/**
 * 📱 STATISTICS MOBILE
 *
 * Mobile-optimized statistics dashboard s collapsible sections
 */

import {
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  Euro as EuroIcon,
  Percent as PercentIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Assessment as StatsIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React, { memo, useMemo, useState } from 'react';

import CollapsibleSection from './CollapsibleSection';
import ResponsiveChart from './ResponsiveChart';
import StatisticsCard from './StatisticsCard';

interface ChartDataItem extends Record<string, unknown> {
  name: string;
  revenue: number;
  rentals?: number;
  commission?: number;
  utilization?: number;
}

interface StatisticsMobileProps {
  stats: Record<string, unknown>; // Statistics data from parent component
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
  isLoading = false,
}) => {
  const theme = useTheme();

  // State pre expanded sections
  const [expandedSections] = useState<Set<string>>(
    new Set(['overview']) // Overview je default expanded
  );

  // const toggleSection = (sectionId: string) => {
  //   const newExpanded = new Set(expandedSections);
  //   if (newExpanded.has(sectionId)) {
  //     newExpanded.delete(sectionId);
  //   } else {
  //     newExpanded.add(sectionId);
  //   }
  //   setExpandedSections(newExpanded);
  // };

  // Prepare chart data
  const chartData = useMemo((): {
    monthly: ChartDataItem[];
    vehicleStats: ChartDataItem[];
    topCustomers: ChartDataItem[];
  } => {
    if (!stats) return { monthly: [], vehicleStats: [], topCustomers: [] };

    // Monthly revenue data - podporuj monthlyStats (mobil starý) alebo monthlyData (desktop nový)
    const monthlyData: ChartDataItem[] =
      stats.monthlyStats && Array.isArray(stats.monthlyStats)
        ? (stats.monthlyStats as Record<string, unknown>[]).map(
            (month: Record<string, unknown>, index: number): ChartDataItem => ({
              name: `${index + 1}/${filterYear}`,
              revenue: Number(month.totalRevenue || 0),
              rentals: Number(month.totalRentals || 0),
              commission: Number(month.totalCommission || 0),
            })
          )
        : stats.monthlyData && Array.isArray(stats.monthlyData)
          ? (stats.monthlyData as Record<string, unknown>[]).map(
              (m: Record<string, unknown>): ChartDataItem => ({
                name: String(m.month),
                revenue: Number(m.revenue || 0),
                rentals: Number(m.rentals || 0),
                commission: Number(m.commission || 0),
              })
            )
          : [];

    // Vehicle statistics - podporuj topVehiclesByRevenue alebo vehiclesByRevenue (desktop nový)
    const vehiclesSource =
      stats.topVehiclesByRevenue && Array.isArray(stats.topVehiclesByRevenue)
        ? stats.topVehiclesByRevenue
        : stats.vehiclesByRevenue && Array.isArray(stats.vehiclesByRevenue)
          ? stats.vehiclesByRevenue
          : [];

    const vehicleData: ChartDataItem[] = (
      vehiclesSource as Record<string, unknown>[]
    )
      .slice(0, 5)
      .map(
        (v: Record<string, unknown>): ChartDataItem => ({
          name: String(
            v.name ||
              ((v.vehicle as Record<string, unknown>)
                ? `${(v.vehicle as Record<string, unknown>).brand || ''} ${(v.vehicle as Record<string, unknown>).model || ''}`
                : `${v.brand ?? ''} ${v.model ?? ''}`.trim()) ||
              'Neznáme vozidlo'
          ),
          revenue: Number(v.totalRevenue || v.revenue || 0),
          utilization: Number(
            v.utilizationRate || v.utilizationPercentage || 0
          ),
        })
      );

    // Top customers - podporuj topCustomersByRevenue alebo customersByRevenue (desktop nový)
    const customersSource =
      stats.topCustomersByRevenue && Array.isArray(stats.topCustomersByRevenue)
        ? stats.topCustomersByRevenue
        : stats.customersByRevenue && Array.isArray(stats.customersByRevenue)
          ? stats.customersByRevenue
          : [];

    const customerData: ChartDataItem[] = customersSource.slice(0, 5).map(
      (c: Record<string, unknown>): ChartDataItem => ({
        name: String(
          c.customerName ||
            (c.customer as Record<string, unknown>)?.name ||
            'Neznámy zákazník'
        ),
        revenue: Number(c.totalRevenue || c.revenue || 0),
        rentals: Number(c.totalRentals || c.rentalCount || 0),
      })
    );

    return {
      monthly: monthlyData,
      vehicleStats: vehicleData,
      topCustomers: customerData,
    };
  }, [stats, filterYear]);

  // Derivované agregácie pre mobil z desktop štatistík
  const derivedTotals = useMemo(() => {
    const rentals =
      stats?.filteredRentals && Array.isArray(stats.filteredRentals)
        ? stats.filteredRentals
        : [];
    const totalRentals = rentals.length || stats?.totalRentals || 0;
    const activeVehicleIds = new Set<string>();
    rentals.forEach((r: Record<string, unknown>) => {
      if (r.vehicleId) activeVehicleIds.add(r.vehicleId as string);
      else if ((r.vehicle as Record<string, unknown>)?.id)
        activeVehicleIds.add(
          (r.vehicle as Record<string, unknown>).id as string
        );
    });
    const activeVehicles = activeVehicleIds.size;
    const customerKeys = new Set<string>();
    rentals.forEach((r: Record<string, unknown>) => {
      const key =
        r.customerId ||
        r.customerName ||
        (r.customer as Record<string, unknown>)?.id;
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
    'Január',
    'Február',
    'Marec',
    'Apríl',
    'Máj',
    'Jún',
    'Júl',
    'August',
    'September',
    'Október',
    'November',
    'December',
  ];

  if (!stats) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info">📊 Načítavajú sa štatistiky...</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with filters */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}
        >
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
              onChange={e =>
                onTimeRangeChange(e.target.value as 'month' | 'year' | 'all')
              }
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
                  onChange={e => onFilterYearChange(Number(e.target.value))}
                >
                  {availableYears.map(year => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {timeRange === 'month' && (
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Mesiac</InputLabel>
                  <Select
                    value={filterMonth}
                    label="Mesiac"
                    onChange={e => onFilterMonthChange(Number(e.target.value))}
                  >
                    {months.map((month, index) => (
                      <MenuItem key={index} value={index}>
                        {month}
                      </MenuItem>
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
              trend={
                stats.revenueTrend && typeof stats.revenueTrend === 'number'
                  ? {
                      value: stats.revenueTrend as number,
                      period: 'vs minulý mesiac',
                      isPositive: (stats.revenueTrend as number) > 0,
                    }
                  : undefined
              }
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
              trend={
                stats.rentalsTrend && typeof stats.rentalsTrend === 'number'
                  ? {
                      value: stats.rentalsTrend as number,
                      period: 'vs minulý mesiac',
                      isPositive: (stats.rentalsTrend as number) > 0,
                    }
                  : undefined
              }
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
              {
                key: 'revenue',
                color: theme.palette.success.main,
                name: 'Príjem',
              },
              {
                key: 'commission',
                color: theme.palette.warning.main,
                name: 'Provízia',
              },
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
          defaultExpanded={false}
          badge={chartData.vehicleStats.length}
          compact
        >
          {chartData.vehicleStats.length > 0 ? (
            <ResponsiveChart
              type="bar"
              data={chartData.vehicleStats}
              height={200}
              xAxisKey="name"
              dataKey="revenue"
              showGrid={false}
              colors={[theme.palette.primary.main]}
            />
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ p: 2, textAlign: 'center' }}
            >
              Žiadne dáta o vozidlách
            </Typography>
          )}
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
        const companiesArray = Array.isArray(stats?.companiesStats)
          ? stats.companiesStats
          : stats?.companyStats && typeof stats.companyStats === 'object'
            ? Object.entries(stats.companyStats).map(
                ([companyName, data]: [string, Record<string, unknown>]) => ({
                  companyName,
                  totalRevenue: data.revenue || 0,
                  totalRentals: data.count || 0,
                })
              )
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
                {companiesArray
                  .slice(0, 3)
                  .map((company: Record<string, unknown>, index: number) => (
                    <Grid item xs={12} key={index}>
                      <StatisticsCard
                        title={
                          (company.companyName as string) || 'Nezadaná firma'
                        }
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
      {stats.employeeStats &&
        (stats.employeeStats as Record<string, unknown>).activeEmployees &&
        typeof (stats.employeeStats as Record<string, unknown>)
          .activeEmployees === 'number' &&
        ((stats.employeeStats as Record<string, unknown>)
          .activeEmployees as number) > 0 && (
          <Box sx={{ mt: 2 }}>
            <CollapsibleSection
              title="Výkon zamestnancov"
              icon={<PersonIcon />}
              color="success"
              defaultExpanded={false}
              badge={
                (stats.employeeStats as Record<string, unknown>)
                  .activeEmployees as number
              }
              compact
            >
              <Grid container spacing={2}>
                {(
                  (stats.employeeStats as Record<string, unknown>)
                    .topEmployeesByProtocols as Record<string, unknown>[]
                )
                  .slice(0, 3)
                  .map((employee: Record<string, unknown>, index: number) => (
                    <Grid item xs={12} key={index}>
                      <StatisticsCard
                        title={
                          (employee.employeeName as string) ||
                          'Neznámy zamestnanec'
                        }
                        value={`${employee.totalProtocols} protokolov`}
                        subtitle={`${employee.handoverCount} odovzdaní • ${employee.returnCount} prebraní • €${employee.totalRevenue?.toLocaleString() || 0}`}
                        icon={<PersonIcon />}
                        color={
                          index === 0
                            ? 'success'
                            : index === 1
                              ? 'warning'
                              : 'info'
                        }
                        compact
                      />
                    </Grid>
                  ))}
              </Grid>

              {/* Summary stats */}
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  📊 Celkové štatistiky protokolov
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  {String(
                    (stats.employeeStats as Record<string, unknown>)
                      .totalProtocols || 0
                  )}{' '}
                  protokolov •{' '}
                  {String(
                    (stats.employeeStats as Record<string, unknown>)
                      .totalHandovers || 0
                  )}{' '}
                  odovzdaní •{' '}
                  {String(
                    (stats.employeeStats as Record<string, unknown>)
                      .totalReturns || 0
                  )}{' '}
                  prebraní
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
            {timeRange === 'month'
              ? `${months[filterMonth]} ${filterYear}`
              : timeRange === 'year'
                ? `Rok ${filterYear}`
                : 'Celkové obdobie'}
            : {String(derivedTotals.totalRentals || 0)} prenájmov • €
            {String(stats.totalRevenuePeriod?.toLocaleString() || 0)} príjem • €
            {String(stats.totalCommissionPeriod?.toLocaleString() || 0)}{' '}
            provízie • €
            {String(stats.blackHoldingExpenses?.toLocaleString() || 0)} náklady
            BH
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default memo(StatisticsMobile);
