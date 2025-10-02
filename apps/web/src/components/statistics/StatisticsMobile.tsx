/**
 * 📱 STATISTICS MOBILE
 *
 * Mobile-optimized statistics dashboard s collapsible sections
 */

import {
  Building2 as BusinessIcon,
  Calendar as CalendarIcon,
  Car as CarIcon,
  Euro as EuroIcon,
  Percent as PercentIcon,
  User as PersonIcon,
  Receipt as ReceiptIcon,
  RefreshCw as RefreshIcon,
  BarChart3 as StatsIcon,
  TrendingUp as TrendIcon,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Typography } from '@/components/ui/typography';
import React, { memo, useMemo } from 'react';

import CollapsibleSection from './CollapsibleSection';
import ResponsiveChart from './ResponsiveChart';
import StatisticsCard from './StatisticsCard';

type ChartDataItem = {
  name: string;
  revenue: number;
  rentals?: number;
  commission?: number;
  utilization?: number;
};

type StatisticsMobileProps = {
  stats: Record<string, unknown>; // Statistics data from parent component
  timeRange: 'month' | 'year' | 'all';
  onTimeRangeChange: (_range: 'month' | 'year' | 'all') => void;
  filterYear: number;
  filterMonth: number;
  onFilterYearChange: (_year: number) => void;
  onFilterMonthChange: (_month: number) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
};

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

  // State pre expanded sections
  const expandedSections = useMemo(
    () => new Set(['overview']), // Overview je default expanded
    []
  );

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
      <div className="p-6 text-center">
        <Alert>
          <AlertDescription>📊 Načítavajú sa štatistiky...</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4">
      <>
        {/* Header with filters */}
        <div className="mb-6">
          <Typography
            variant="h5"
            className="font-semibold mb-4 text-center"
          >
            📊 Štatistiky
          </Typography>

          {/* Time Range and Filters */}
          <div className="space-y-4">
            {/* Time Range Selector */}
            <Select
              value={timeRange}
              onValueChange={(value: 'month' | 'year' | 'all') =>
                onTimeRangeChange(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Časové obdobie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mesiac</SelectItem>
                <SelectItem value="year">Rok</SelectItem>
                <SelectItem value="all">Celkovo</SelectItem>
              </SelectContent>
            </Select>

            {/* Year/Month filters */}
            {timeRange !== 'all' && (
              <div className="flex gap-2">
                <Select
                  value={filterYear.toString()}
                  onValueChange={(value) => onFilterYearChange(Number(value))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Rok" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {timeRange === 'month' && (
                  <Select
                    value={filterMonth.toString()}
                    onValueChange={(value) =>
                      onFilterMonthChange(Number(value))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Mesiac" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Refresh button */}
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={isLoading}
                size="sm"
                className="w-full"
              >
                <RefreshIcon className="h-4 w-4 mr-2" />
                {isLoading ? 'Načítavam...' : 'Obnoviť'}
              </Button>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <CollapsibleSection
          title="Prehľad"
          icon={<StatsIcon />}
          color="primary"
          defaultExpanded={expandedSections.has('overview')}
          badge={6}
          compact
        >
          <div className="grid grid-cols-2 gap-4">
            <StatisticsCard
              title="Celkový príjem"
              value={`€${stats.totalRevenuePeriod?.toLocaleString() || 0}`}
              icon={<EuroIcon />}
              color="success"
              {...(stats.revenueTrend && typeof stats.revenueTrend === 'number' ? {
                trend: {
                  value: stats.revenueTrend as number,
                  period: 'vs minulý mesiac',
                  isPositive: (stats.revenueTrend as number) > 0,
                }
              } : {})}
              compact
            />

            <StatisticsCard
              title="Provízie"
              value={`€${stats.totalCommissionPeriod?.toLocaleString() || 0}`}
              icon={<PercentIcon />}
              color="secondary"
              compact
            />

            <StatisticsCard
              title="Prenájmy"
              value={(derivedTotals.totalRentals || 0).toLocaleString()}
              icon={<ReceiptIcon />}
              color="primary"
              {...(stats.rentalsTrend && typeof stats.rentalsTrend === 'number' ? {
                trend: {
                  value: stats.rentalsTrend as number,
                  period: 'vs minulý mesiac',
                  isPositive: (stats.rentalsTrend as number) > 0,
                }
              } : {})}
              compact
            />

            <StatisticsCard
              title="Náklady BH"
              value={`€${stats.blackHoldingExpenses?.toLocaleString() || 0}`}
              icon={<BusinessIcon />}
              color="error"
              compact
            />

            <StatisticsCard
              title="Aktívne vozidlá"
              value={(derivedTotals.activeVehicles || 0).toLocaleString()}
              icon={<CarIcon />}
              color="info"
              compact
            />

            <StatisticsCard
              title="Zákazníci"
              value={(derivedTotals.totalCustomers || 0).toLocaleString()}
              icon={<PersonIcon />}
              color="warning"
              compact
            />
          </div>
        </CollapsibleSection>

        {/* Revenue Chart */}
        <div className="mt-4">
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
                  color: '#10b981',
                  name: 'Príjem',
                },
                {
                  key: 'commission',
                  color: '#f59e0b',
                  name: 'Provízia',
                },
              ]}
              showGrid={false}
            />
          </CollapsibleSection>
        </div>

        {/* Vehicle Performance */}
        {chartData.vehicleStats.length > 0 ? (
          <div className="mt-4">
            <CollapsibleSection
              title="Najlepšie vozidlá"
              icon={<CarIcon />}
              color="primary"
              defaultExpanded={false}
              badge={chartData.vehicleStats.length}
              compact={true}
            >
              <ResponsiveChart
                type="bar"
                data={chartData.vehicleStats}
                height={200}
                xAxisKey="name"
                dataKey="revenue"
                showGrid={false}
                colors={['#3b82f6']}
              />
            </CollapsibleSection>
          </div>
        ) : null}

        {/* Top Customers */}
        <div className="mt-4">
          <CollapsibleSection
            title="Top zákazníci"
            icon={<PersonIcon />}
            color="warning"
            defaultExpanded={expandedSections.has('customers')}
            {...(chartData.topCustomers.length > 0 ? {
              badge: chartData.topCustomers.length
            } : {})}
            compact
          >
            <ResponsiveChart
              type="bar"
              data={chartData.topCustomers}
              height={200}
              xAxisKey="name"
              dataKey="revenue"
              showGrid={false}
              colors={['#f59e0b']}
            />
          </CollapsibleSection>
        </div>

        {/* Companies Performance */}
        {(() => {
          const companiesArray: Array<{
            companyName: string;
            totalRevenue: number;
            totalRentals: number;
          }> = Array.isArray(stats?.companiesStats)
            ? (stats.companiesStats as Record<string, unknown>[]).map(
                (c: Record<string, unknown>) => ({
                  companyName: String(c.companyName || 'Nezadaná firma'),
                  totalRevenue: Number(c.totalRevenue || 0),
                  totalRentals: Number(c.totalRentals || 0),
                })
              )
            : stats?.companyStats && typeof stats.companyStats === 'object'
              ? Object.entries(
                  stats.companyStats as Record<string, Record<string, unknown>>
                ).map(([companyName, data]) => ({
                  companyName: String(companyName),
                  totalRevenue: Number(data.revenue || 0),
                  totalRentals: Number(data.count || 0),
                }))
              : [];

          if (companiesArray.length === 0) return null;

          return (
            <div className="mt-4">
              <CollapsibleSection
                title="Výkon firiem"
                icon={<BusinessIcon />}
                color="info"
                defaultExpanded={expandedSections.has('companies')}
                badge={companiesArray.length}
                compact={true}
              >
                <div className="space-y-4">
                  {companiesArray.slice(0, 3).map((company, index) => (
                    <StatisticsCard
                      key={index}
                      title={company.companyName}
                      value={`€${company.totalRevenue.toLocaleString()}`}
                      subtitle={`${company.totalRentals} prenájmov`}
                      icon={<BusinessIcon />}
                      color="info"
                      compact
                    />
                  ))}
                </div>
              </CollapsibleSection>
            </div>
          );
        })()}

        {/* Monthly Calendar View */}
        {timeRange === 'month' && (
          <div className="mt-4">
            <CollapsibleSection
              title="Mesačný kalendár"
              icon={<CalendarIcon />}
              color="secondary"
              defaultExpanded={false}
              compact
            >
              <div className="p-4 text-center">
                <Typography variant="body2" className="text-muted-foreground">
                  🗓️ Kalendárne zobrazenie bude implementované v ďalšej verzii
                </Typography>
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* Employee Performance */}
        {stats.employeeStats &&
          (stats.employeeStats as Record<string, unknown>).activeEmployees &&
          typeof (stats.employeeStats as Record<string, unknown>)
            .activeEmployees === 'number' &&
          ((stats.employeeStats as Record<string, unknown>)
            .activeEmployees as number) > 0 && (
            <div className="mt-4">
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
                <div className="space-y-4">
                  {(
                    (stats.employeeStats as Record<string, unknown>)
                      .topEmployeesByProtocols as Record<string, unknown>[]
                  )
                    .slice(0, 3)
                    .map((employee: Record<string, unknown>, index: number) => (
                      <StatisticsCard
                        key={index}
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
                    ))}
                </div>

                {/* Summary stats */}
                <div className="mt-4 p-4 bg-card rounded-lg">
                  <Typography variant="body2" className="font-semibold mb-2">
                    📊 Celkové štatistiky protokolov
                  </Typography>
                  <Typography variant="caption" className="block">
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
                </div>
              </CollapsibleSection>
            </div>
          )}

        {/* Performance Summary */}
        <div className="mt-4 mb-6">
          <Alert>
            <Typography variant="body2" className="font-semibold">
              📈 Súhrn výkonu
            </Typography>
            <Typography variant="caption" className="block mt-1">
              {timeRange === 'month'
                ? `${months[filterMonth]} ${filterYear}`
                : timeRange === 'year'
                  ? `Rok ${filterYear}`
                  : 'Celkové obdobie'}
              : {String(derivedTotals.totalRentals || 0)} prenájmov • €
              {String(stats.totalRevenuePeriod?.toLocaleString() || 0)} príjem •
              €{String(stats.totalCommissionPeriod?.toLocaleString() || 0)}{' '}
              provízie • €
              {String(stats.blackHoldingExpenses?.toLocaleString() || 0)}{' '}
              náklady BH
            </Typography>
          </Alert>
        </div>
      </>
    </div>
  );
};

export default memo(StatisticsMobile);
