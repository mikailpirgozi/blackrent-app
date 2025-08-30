import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Euro as EuroIcon,
  Assignment as HandoverIcon,
  AssignmentReturn as ReturnIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  useTheme,
  useMediaQuery,
  Divider,
  Stack,
} from '@mui/material';
import {
  format,
  isToday,
  isTomorrow,
  isAfter,
  isBefore,
  startOfDay,
} from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useMemo } from 'react';

import { Rental } from '../../types';

interface RentalDashboardProps {
  rentals: Rental[];
  protocols?: Record<string, { handover?: any; return?: any }>;
  isLoading?: boolean;
  onQuickFilter?: (filterType: string, value?: any) => void;
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

const RentalDashboard: React.FC<RentalDashboardProps> = ({
  rentals,
  protocols = {},
  isLoading = false,
  onQuickFilter,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

    // Začínajúce dnes - prenájmy ktoré dnes začínajú
    const startingToday = rentals.filter(rental => {
      const startDate = new Date(rental.startDate);
      return isToday(startDate);
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
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" color="text.secondary">
          Načítavam dashboard...
        </Typography>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        mb: 3,
        backgroundColor: 'background.paper',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            📊 Dashboard prenájmov
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Celkom: <strong>{stats.total}</strong> prenájmov
          </Typography>
        </Box>

        {/* 📊 ULTRA KOMPAKTNÝ DASHBOARD - všetko v jednom riadku */}
        <Grid container spacing={0.25}>
          {allMetrics.map((metric, index) => (
            <Grid item xs={4} sm={3} md={2} lg={1.33} xl={1.2} key={index}>
              <Card
                onClick={() =>
                  handleMetricClick(metric.filterType, metric.value)
                }
                sx={{
                  background: metric.urgent
                    ? `linear-gradient(135deg, ${(theme.palette as any)[metric.color].main}15 0%, ${(theme.palette as any)[metric.color].main}25 100%)`
                    : `linear-gradient(135deg, ${(theme.palette as any)[metric.color].main}10 0%, ${(theme.palette as any)[metric.color].main}20 100%)`,
                  border: `1px solid ${(theme.palette as any)[metric.color].main}30`,
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  cursor: metric.clickable ? 'pointer' : 'default',
                  minHeight: 60,
                  '&:hover': metric.clickable
                    ? {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 15px ${(theme.palette as any)[metric.color].main}30`,
                      }
                    : {},
                }}
              >
                <CardContent
                  sx={{
                    textAlign: 'center',
                    py: 0.25,
                    px: 0.25,
                    '&:last-child': { pb: 0.25 },
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    sx={{
                      color: `${metric.color}.main`,
                      fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                      lineHeight: 1.1,
                    }}
                  >
                    {metric.value}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                      display: 'block',
                      lineHeight: 1,
                      mt: 0.1,
                    }}
                  >
                    {metric.label}
                  </Typography>

                  {metric.clickable && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: `${metric.color}.main`,
                        fontSize: { xs: '0.5rem', sm: '0.55rem' },
                        mt: 0.1,
                      }}
                    >
                      👆
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 💰 FINANČNÝ PREHĽAD - len reálne dáta */}
        {!isMobile && stats.totalRevenue > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  fontWeight="600"
                  sx={{ color: 'success.main' }}
                >
                  {stats.totalRevenue.toLocaleString('sk-SK')}€
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Celkové tržby
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  fontWeight="600"
                  sx={{ color: 'info.main' }}
                >
                  {Math.round(stats.avgDailyRevenue).toLocaleString('sk-SK')}€
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Priemerná cena
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RentalDashboard;
