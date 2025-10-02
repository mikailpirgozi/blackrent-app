import {
  Building,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Percent,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import type { Settlement } from '../../types';

interface PremiumSettlementCardProps {
  settlement: Settlement;
  onView: (settlement: Settlement) => void;
  onDownload?: (settlement: Settlement) => void;
}

const PremiumSettlementCard: React.FC<PremiumSettlementCardProps> = ({
  settlement,
  onView,
  onDownload,
}) => {
  // Status configuration
  const statusConfig = {
    pending: {
      label: 'Čaká',
      icon: Clock,
      gradient: 'from-orange-500 to-amber-600',
      bgClass: 'bg-orange-50 dark:bg-orange-950',
      textClass: 'text-orange-700 dark:text-orange-300',
    },
    completed: {
      label: 'Dokončené',
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      bgClass: 'bg-green-50 dark:bg-green-950',
      textClass: 'text-green-700 dark:text-green-300',
    },
    disputed: {
      label: 'Sporné',
      icon: AlertTriangle,
      gradient: 'from-red-500 to-pink-600',
      bgClass: 'bg-red-50 dark:bg-red-950',
      textClass: 'text-red-700 dark:text-red-300',
    },
  };

  // Use pending as default since Settlement doesn't have status
  const config = statusConfig.pending;
  const StatusIcon = config.icon;

  // Calculate profit/loss
  const profit = settlement.profit || 0;
  const totalRevenue = settlement.totalIncome || 0;
  const profitPercentage = totalRevenue
    ? ((profit / totalRevenue) * 100).toFixed(1)
    : '0';

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
      {/* Gradient header */}
      <div className={`relative h-28 bg-gradient-to-r ${config.gradient} overflow-hidden`}>
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-2xl animate-blob" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-2xl animate-blob animation-delay-2000" />
        </div>

        {/* Header content */}
        <div className="relative h-full flex flex-col justify-center px-6">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            {settlement.period && (
              <Typography variant="caption" className="text-white/80">
                {format(new Date(settlement.period.from), 'd. MMM', { locale: sk })} - {format(new Date(settlement.period.to), 'd. MMM yyyy', { locale: sk })}
              </Typography>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <Typography variant="h6" className="text-white font-bold">
                {settlement.company || 'Neznáma firma'}
              </Typography>
              <Typography variant="caption" className="text-white/80">
                Vyúčtovanie
              </Typography>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Financial Overview */}
        <div className="grid grid-cols-2 gap-3">
          {/* Revenue */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <Typography variant="caption" className="text-muted-foreground">
                Príjmy
              </Typography>
            </div>
            <Typography variant="h5" className="font-bold text-green-600">
              €{settlement.totalIncome?.toFixed(2) || '0.00'}
            </Typography>
          </div>

          {/* Expenses */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <Typography variant="caption" className="text-muted-foreground">
                Náklady
              </Typography>
            </div>
            <Typography variant="h5" className="font-bold text-red-600">
              €{settlement.totalExpenses?.toFixed(2) || '0.00'}
            </Typography>
          </div>
        </div>

        <Separator />

        {/* Profit/Loss */}
        <div className={`p-4 rounded-lg ${profit >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-pink-600'}`}>
          <div className="flex items-center justify-between text-white">
            <div>
              <Typography variant="caption" className="text-white/80 mb-1">
                {profit >= 0 ? 'Zisk' : 'Strata'}
              </Typography>
              <Typography variant="h4" className="font-bold">
                €{Math.abs(profit).toFixed(2)}
              </Typography>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end mb-1">
                <Percent className="h-4 w-4" />
                <Typography variant="h5" className="font-bold">
                  {profitPercentage}%
                </Typography>
              </div>
              <Typography variant="caption" className="text-white/80">
                Marža
              </Typography>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-2">
          {settlement.rentals && (
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Typography variant="h6" className="font-bold">
                {settlement.rentals.length}
              </Typography>
              <Typography variant="caption" className="text-muted-foreground">
                Prenájmov
              </Typography>
            </div>
          )}
          
          {settlement.totalCommission !== undefined && (
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Typography variant="h6" className="font-bold text-primary">
                €{settlement.totalCommission.toFixed(0)}
              </Typography>
              <Typography variant="caption" className="text-muted-foreground">
                Provízia
              </Typography>
            </div>
          )}

          {settlement.expenses && (
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Typography variant="h6" className="font-bold">
                {settlement.expenses.length}
              </Typography>
              <Typography variant="caption" className="text-muted-foreground">
                Nákladov
              </Typography>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onView(settlement)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Eye className="h-4 w-4 mr-1" />
            Detail
          </Button>

          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(settlement)}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          )}
        </div>
      </CardContent>

      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
    </Card>
  );
};

export default PremiumSettlementCard;

