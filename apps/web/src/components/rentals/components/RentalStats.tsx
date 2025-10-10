import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { isAfter, isBefore, isToday, isTomorrow, parseISO } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Download,
  Upload,
  MoreVertical,
} from 'lucide-react';

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
  onAdd?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  canCreate?: boolean;
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
  onAdd,
  onExport,
  onImport,
  canCreate = true,
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

  // 🎯 Collapsible state
  const [isOpen, setIsOpen] = useState(false); // Default zbalené pre kompaktnosť

  if (isLoading) {
    return (
      <div className="mb-4 mx-2 md:mx-0 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 animate-pulse">
        <p className="text-sm text-muted-foreground">Načítavam štatistiky...</p>
      </div>
    );
  }

  // 🎯 ULTRA KOMPAKTNÉ METRIKY - len najdôležitejšie
  const compactMetrics = [
    {
      label: 'Preterminované',
      value: stats.overdue,
      color: stats.overdue > 0 ? 'destructive' : 'secondary',
      filterType: 'overdue',
    },
    {
      label: 'Dnes',
      value: stats.todayActivity,
      color: stats.todayActivity > 0 ? 'warning' : 'secondary',
      filterType: 'todayActivity',
    },
    {
      label: 'Zajtra',
      value: stats.tomorrowReturns,
      color: stats.tomorrowReturns > 0 ? 'warning' : 'secondary',
      filterType: 'tomorrowReturns',
    },
    {
      label: 'Aktívne',
      value: stats.active,
      color: 'default',
      filterType: 'active',
    },
    {
      label: 'Nezaplatené',
      value: stats.unpaid,
      color: stats.unpaid > 0 ? 'destructive' : 'secondary',
      filterType: 'unpaid',
    },
    {
      label: 'Čakajúce',
      value: stats.pending,
      color: stats.pending > 0 ? 'warning' : 'secondary',
      filterType: 'pending',
    },
  ];

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="mb-2 mx-2 md:mx-0"
    >
      <Card className="bg-gradient-to-r from-background via-primary/5 to-background shadow-sm hover:shadow-md border border-border/50 transition-all duration-200">
        <CardContent className="p-2 md:p-2.5">
          {/* 📊 ULTRA KOMPAKTNÝ HEADER - minimálna výška */}
          <div className="flex items-center justify-between gap-2">
            {/* Ľavá strana - Metriky inline */}
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              <span className="text-base">📊</span>

              {compactMetrics.map((metric, index) => (
                <Badge
                  key={index}
                  variant={metric.color as 'default' | 'destructive' | 'outline' | 'secondary'}
                  className={cn(
                    'cursor-pointer hover:scale-105 transition-transform text-[0.7rem] px-1.5 py-0 h-5',
                    metric.value > 0 ? 'opacity-100' : 'opacity-60'
                  )}
                  onClick={() =>
                    metric.value > 0 &&
                    handleMetricClick(metric.filterType, metric.value)
                  }
                >
                  {metric.value} {metric.label}
                </Badge>
              ))}
            </div>

            {/* Pravá strana - Akcie + Celkom + Toggle */}
            <div className="flex items-center gap-1.5">
              {/* Nový prenájom */}
              {canCreate && onAdd && (
                <Button
                  onClick={onAdd}
                  size="sm"
                  className="h-6 text-[0.7rem] px-2 bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nový
                </Button>
              )}

              {/* Export/Import dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onExport && (
                    <DropdownMenuItem onClick={onExport}>
                      <Download className="h-3.5 w-3.5 mr-2" />
                      Export CSV
                    </DropdownMenuItem>
                  )}
                  {onImport && (
                    <DropdownMenuItem onClick={onImport}>
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      Import CSV
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="text-[0.7rem] text-muted-foreground whitespace-nowrap">
                {stats.total}
              </span>

              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                >
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-primary" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* 📊 ROZBALENÉ - všetky metriky - kompaktnejšie */}
          <CollapsibleContent className="mt-2 animate-slide-down">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
              {allMetrics.map((metric, index) => (
                <div
                  key={index}
                  onClick={() =>
                    metric.clickable &&
                    handleMetricClick(metric.filterType, metric.value)
                  }
                  className={cn(
                    'p-1.5 rounded-md border transition-all duration-200',
                    metric.clickable
                      ? 'cursor-pointer hover:scale-105 hover:shadow-sm'
                      : 'cursor-default opacity-60',
                    metric.urgent
                      ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                      : metric.color === 'warning'
                        ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                        : metric.color === 'success'
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                          : metric.color === 'info'
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                            : 'bg-muted/50 border-border'
                  )}
                >
                  <div
                    className={cn(
                      'text-base font-bold',
                      metric.color === 'error' || metric.urgent
                        ? 'text-red-600 dark:text-red-400'
                        : metric.color === 'warning'
                          ? 'text-orange-600 dark:text-orange-400'
                          : metric.color === 'success'
                            ? 'text-green-600 dark:text-green-400'
                            : metric.color === 'info'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-primary'
                    )}
                  >
                    {metric.value}
                  </div>
                  <div className="text-[0.6rem] text-muted-foreground leading-tight">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};
