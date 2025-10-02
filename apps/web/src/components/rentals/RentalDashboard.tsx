import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { isAfter, isBefore, isToday, isTomorrow } from 'date-fns';
import React, { useMemo } from 'react';

import type { Rental } from '../../types';

interface ProtocolData {
  handover?: Record<string, unknown>;
  return?: Record<string, unknown>;
}

interface RentalDashboardProps {
  rentals: Rental[];
  protocols?: Record<string, ProtocolData>;
  isLoading?: boolean;
  onQuickFilter?: (filterType: string, value?: string | number) => void;
}

interface DashboardStats {
  total: number;
  active: number;
  todayActivity: number;
  tomorrowReturns: number;
  weekActivity: number;
  overdue: number;
  newToday: number;
  unpaid: number;
  pending: number;
  withHandover: number;
  withReturn: number;
  totalRevenue: number;
  avgDailyRevenue: number;
}

interface MetricData {
  label: string;
  value: number;
  color: 'error' | 'warning' | 'success' | 'info';
  urgent: boolean;
  filterType: string;
  clickable: boolean;
}


const RentalDashboard: React.FC<RentalDashboardProps> = ({
  rentals,
  protocols = {},
  isLoading = false,
  onQuickFilter,
}) => {

  // 📊 Vypočítaj kľúčové metriky
  const stats: DashboardStats = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const active = rentals.filter(rental => {
      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      // Prenájom je aktívny len ak: začal a ešte neskončil
      return (
        (isAfter(today, startDate) || isToday(startDate)) &&
        (isBefore(today, endDate) || isToday(endDate))
      );
    });

    // Dnes aktivita - prenájmy ktoré sa dnes začínajú ALEBO končia
    const todayActivity = rentals.filter(rental => {
      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      return isToday(startDate) || isToday(endDate);
    });

    const tomorrowReturns = rentals.filter(rental => {
      const endDate = new Date(rental.endDate);
      return isTomorrow(endDate);
    });

    // Tento týždeň aktivita - prenájmy ktoré sa tento týždeň začínajú ALEBO končia
    const weekActivity = rentals.filter(rental => {
      const startDate = new Date(rental.startDate);
      const endDate = new Date(rental.endDate);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay())); // Najbližšia nedeľa
      endOfWeek.setHours(23, 59, 59, 999);

      const startsThisWeek =
        isAfter(startDate, today) && isBefore(startDate, endOfWeek);
      const endsThisWeek =
        isAfter(endDate, today) && isBefore(endDate, endOfWeek);

      return startsThisWeek || endsThisWeek;
    });

    // Preterminované - prenájmy ktoré mali skončiť ale ešte sa nevrátili
    const overdue = rentals.filter(rental => {
      const endDate = new Date(rental.endDate);
      // Preterminované sú tie čo skončili pred dnes a nemajú return protokol
      return isBefore(endDate, today) && !protocols[rental.id]?.return;
    });

    // Nové dnes - prenájmy vytvorené dnes
    const newToday = rentals.filter(rental => {
      const createdDate = new Date(rental.createdAt);
      return isToday(createdDate);
    });

    const unpaid = rentals.filter(rental => !rental.paid);
    const pending = rentals.filter(
      rental => rental.status === 'pending' || !rental.confirmed
    );

    const withHandover = rentals.filter(
      rental => protocols[rental.id]?.handover
    );
    const withReturn = rentals.filter(rental => protocols[rental.id]?.return);

    const totalRevenue = rentals.reduce(
      (sum, rental) => sum + (rental.totalPrice || 0),
      0
    );
    const avgDailyRevenue =
      rentals.length > 0 ? totalRevenue / Math.max(rentals.length, 1) : 0;

    return {
      total: rentals.length,
      active: active.length,
      todayActivity: todayActivity.length,
      tomorrowReturns: tomorrowReturns.length,
      weekActivity: weekActivity.length,
      overdue: overdue.length,
      newToday: newToday.length,
      unpaid: unpaid.length,
      pending: pending.length,
      withHandover: withHandover.length,
      withReturn: withReturn.length,
      totalRevenue,
      avgDailyRevenue,
    };
  }, [rentals, protocols]);

  // 📊 Všetky metriky v jednom kompaktnom riadku
  const allMetrics: MetricData[] = [
    {
      label: 'Preterminované',
      value: stats.overdue,
      color: stats.overdue > 0 ? 'error' : 'success',
      urgent: stats.overdue > 0,
      filterType: 'overdue',
      clickable: stats.overdue > 0,
    },
    {
      label: 'Dnes odovzdanie/vrátenie',
      value: stats.todayActivity,
      color: stats.todayActivity > 0 ? 'warning' : 'success',
      urgent: stats.todayActivity > 0,
      filterType: 'todayActivity',
      clickable: stats.todayActivity > 0,
    },
    {
      label: 'Zajtra vrátenie',
      value: stats.tomorrowReturns,
      color: stats.tomorrowReturns > 0 ? 'warning' : 'success',
      urgent: stats.tomorrowReturns > 0,
      filterType: 'tomorrowReturns',
      clickable: stats.tomorrowReturns > 0,
    },
    {
      label: 'Tento týždeň odovzdanie/vrátenie',
      value: stats.weekActivity,
      color: 'info',
      urgent: false,
      filterType: 'weekActivity',
      clickable: stats.weekActivity > 0,
    },
    {
      label: 'Nové dnes',
      value: stats.newToday,
      color: 'success',
      urgent: false,
      filterType: 'newToday',
      clickable: stats.newToday > 0,
    },
    {
      label: 'Aktívne prenájmy',
      value: stats.active,
      color: 'info',
      urgent: false,
      filterType: 'active',
      clickable: stats.active > 0,
    },
    {
      label: 'Nezaplatené',
      value: stats.unpaid,
      color: stats.unpaid > 0 ? 'warning' : 'success',
      urgent: stats.unpaid > 0,
      filterType: 'unpaid',
      clickable: stats.unpaid > 0,
    },
    {
      label: 'Čakajúce',
      value: stats.pending,
      color: stats.pending > 0 ? 'warning' : 'success',
      urgent: stats.pending > 0,
      filterType: 'pending',
      clickable: stats.pending > 0,
    },
  ];

  // 🖱️ Handler pre klik na metriku
  const handleMetricClick = (filterType: string, value: number) => {
    if (value > 0 && onQuickFilter) {
      onQuickFilter(filterType);
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-6 p-4">
        <CardContent>
          <h6 className="text-lg font-semibold text-muted-foreground">
            Načítavam dashboard...
          </h6>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-background shadow-lg border border-border rounded-lg">
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            📊 Dashboard prenájmov
          </h2>

          <p className="text-sm text-muted-foreground">
            Celkom: <strong>{stats.total}</strong> prenájmov
          </p>
        </div>

        {/* 📊 ULTRA KOMPAKTNÝ DASHBOARD - všetko v jednom riadku */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1">
          {allMetrics.map((metric, index) => (
            <div key={index}>
              <Card
                onClick={() =>
                  handleMetricClick(metric.filterType, metric.value)
                }
                className={cn(
                  "min-h-[60px] rounded border transition-all duration-200",
                  metric.clickable ? "cursor-pointer hover:-translate-y-0.5" : "cursor-default",
                  // Color-based styling - zachovávam všetky farby a gradienty
                  metric.color === 'success' && (metric.urgent 
                    ? "bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:shadow-lg hover:shadow-green-200" 
                    : "bg-gradient-to-br from-green-25 to-green-50 border-green-200 hover:shadow-md hover:shadow-green-100"),
                  metric.color === 'warning' && (metric.urgent 
                    ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 hover:shadow-lg hover:shadow-yellow-200" 
                    : "bg-gradient-to-br from-yellow-25 to-yellow-50 border-yellow-200 hover:shadow-md hover:shadow-yellow-100"),
                  metric.color === 'error' && (metric.urgent 
                    ? "bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:shadow-lg hover:shadow-red-200" 
                    : "bg-gradient-to-br from-red-25 to-red-50 border-red-200 hover:shadow-md hover:shadow-red-100"),
                  metric.color === 'info' && (metric.urgent 
                    ? "bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-300 hover:shadow-lg hover:shadow-cyan-200" 
                    : "bg-gradient-to-br from-cyan-25 to-cyan-50 border-cyan-200 hover:shadow-md hover:shadow-cyan-100")
                )}
              >
                <CardContent className="text-center py-1 px-1 last:pb-1">
                  <h6 className={cn(
                    "font-bold leading-tight",
                    "text-sm sm:text-base md:text-lg", // responsive font sizes zachované
                    // Color-based text colors - zachovávam všetky farby
                    metric.color === 'success' && "text-green-600", 
                    metric.color === 'warning' && "text-yellow-600",
                    metric.color === 'error' && "text-red-600",
                    metric.color === 'info' && "text-cyan-600"
                  )}>
                    {metric.value}
                  </h6>

                  <span className="text-muted-foreground text-[0.55rem] sm:text-[0.6rem] md:text-[0.65rem] block leading-none mt-0.5">
                    {metric.label}
                  </span>

                  {metric.clickable && (
                    <span className={cn(
                      "text-[0.5rem] sm:text-[0.55rem] mt-0.5",
                      // Color-based text colors - zachovávam všetky farby
                      metric.color === 'success' && "text-green-600", 
                      metric.color === 'warning' && "text-yellow-600",
                      metric.color === 'error' && "text-red-600",
                      metric.color === 'info' && "text-cyan-600"
                    )}>
                      👆
                    </span>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* 💰 FINANČNÝ PREHĽAD - len reálne dáta */}
        {stats.totalRevenue > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex justify-center gap-16">
              <div className="text-center">
                <h6 className="text-lg font-semibold text-green-600">
                  {stats.totalRevenue.toLocaleString('sk-SK')}€
                </h6>
                <span className="text-xs text-muted-foreground">
                  Celkové tržby
                </span>
              </div>
              <div className="text-center">
                <h6 className="text-lg font-semibold text-cyan-600">
                  {Math.round(stats.avgDailyRevenue).toLocaleString('sk-SK')}€
                </h6>
                <span className="text-xs text-muted-foreground">
                  Priemerná cena
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RentalDashboard;
