import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { isAfter, isBefore, isToday, isTomorrow, parseISO } from 'date-fns';
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

import type { Rental } from '../../../types';

interface RentalStatsProps {
  rentals: Rental[];
  protocols?: Record<
    string,
    { handover?: Record<string, unknown>; return?: Record<string, unknown> }
  >;
  isLoading?: boolean;
  onQuickFilter?: (
    _filterType: string,
    _value?: string | number | boolean
  ) => void;
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

export const RentalStats: React.FC<RentalStatsProps> = ({
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
      // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
      const startDate =
        typeof rental.startDate === 'string'
          ? parseISO(rental.startDate)
          : rental.startDate;
      const endDate =
        typeof rental.endDate === 'string'
          ? parseISO(rental.endDate)
          : rental.endDate;
      // Prenájom je aktívny len ak: začal a ešte neskončil
      return (
        (isAfter(today, startDate) || isToday(startDate)) &&
        (isBefore(today, endDate) || isToday(endDate))
      );
    });

    // Dnes aktivita - prenájmy ktoré sa dnes začínajú ALEBO končia
    const todayActivity = rentals.filter(rental => {
      // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
      const startDate =
        typeof rental.startDate === 'string'
          ? parseISO(rental.startDate)
          : rental.startDate;
      const endDate =
        typeof rental.endDate === 'string'
          ? parseISO(rental.endDate)
          : rental.endDate;
      return isToday(startDate) || isToday(endDate);
    });

    const tomorrowReturns = rentals.filter(rental => {
      // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
      const endDate =
        typeof rental.endDate === 'string'
          ? parseISO(rental.endDate)
          : rental.endDate;
      return isTomorrow(endDate);
    });

    // Tento týždeň aktivita - prenájmy ktoré sa tento týždeň začínajú ALEBO končia
    const weekActivity = rentals.filter(rental => {
      // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
      const startDate =
        typeof rental.startDate === 'string'
          ? parseISO(rental.startDate)
          : rental.startDate;
      const endDate =
        typeof rental.endDate === 'string'
          ? parseISO(rental.endDate)
          : rental.endDate;
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
      // ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
      const endDate =
        typeof rental.endDate === 'string'
          ? parseISO(rental.endDate)
          : rental.endDate;
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
  const allMetrics = [
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
        <h3 className="text-lg text-muted-foreground">
          Načítavam štatistiky...
        </h3>
      </Card>
    );
  }

  return (
    <Card className="mb-6 mx-2 md:mx-0 bg-background shadow-lg border rounded-lg">
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            📊 Štatistiky prenájmov
          </h2>

          <p className="text-sm text-muted-foreground">
            Celkom: <strong>{stats.total}</strong> prenájmov
          </p>
        </div>

        {/* 📊 ULTRA KOMPAKTNÝ DASHBOARD - všetko v jednom riadku */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1">
          {allMetrics.map((metric, index) => (
            <Card
              key={index}
              onClick={() =>
                handleMetricClick(metric.filterType, metric.value)
              }
              className={cn(
                "min-h-[60px] transition-all duration-200 ease-in-out border rounded-md",
                metric.clickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg" : "cursor-default",
                metric.urgent 
                  ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950/20 dark:to-red-900/30 dark:border-red-800/30"
                  : metric.color === 'warning'
                  ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950/20 dark:to-orange-900/30 dark:border-orange-800/30"
                  : metric.color === 'success'
                  ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/20 dark:to-green-900/30 dark:border-green-800/30"
                  : metric.color === 'info'
                  ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/20 dark:to-blue-900/30 dark:border-blue-800/30"
                  : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
              )}
            >
              <CardContent className="text-center p-1">
                <div className={cn(
                  "text-lg font-bold leading-tight",
                  metric.color === 'error' || metric.urgent
                    ? "text-red-600 dark:text-red-400"
                    : metric.color === 'warning'
                    ? "text-orange-600 dark:text-orange-400"
                    : metric.color === 'success'
                    ? "text-green-600 dark:text-green-400"
                    : metric.color === 'info'
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-primary"
                )}>
                  {metric.value}
                </div>

                <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {metric.label}
                </div>

                {metric.clickable && (
                  <div className={cn(
                    "text-xs mt-0.5",
                    metric.color === 'error' || metric.urgent
                      ? "text-red-600 dark:text-red-400"
                      : metric.color === 'warning'
                      ? "text-orange-600 dark:text-orange-400"
                      : metric.color === 'success'
                      ? "text-green-600 dark:text-green-400"
                      : metric.color === 'info'
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-primary"
                  )}>
                    👆
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 💰 FINANČNÝ PREHĽAD - len reálne dáta */}
        {stats.totalRevenue > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {stats.totalRevenue.toLocaleString('sk-SK')}€
                </div>
                <div className="text-xs text-muted-foreground">
                  Celkové tržby
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {Math.round(stats.avgDailyRevenue).toLocaleString('sk-SK')}€
                </div>
                <div className="text-xs text-muted-foreground">
                  Priemerná cena
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
