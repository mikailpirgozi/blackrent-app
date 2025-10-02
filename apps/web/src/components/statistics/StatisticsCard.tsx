/**
 * 📊 STATISTICS CARD
 *
 * Reusable card component pre štatistiky s responsive design
 */

import {
  Minus as StableIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import React, { memo } from 'react';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    period: string;
    isPositive?: boolean;
  };
  color?: string;
  compact?: boolean;
  onClick?: () => void;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  compact = false,
  onClick,
}) => {
  // Get color based on theme
  const getColorClasses = (colorName: string) => {
    const colors: Record<string, string> = {
      primary: 'text-blue-600 bg-blue-50 border-blue-200',
      success: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      error: 'text-red-600 bg-red-50 border-red-200',
      info: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    };
    return colors[colorName] || colors.primary;
  };

  const colorClasses = getColorClasses(color);

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (!trend) return null;

    const isPositive =
      trend.isPositive !== undefined ? trend.isPositive : trend.value > 0;
    const absValue = Math.abs(trend.value);

    let trendIcon;
    let trendColorClasses;

    if (absValue === 0) {
      trendIcon = <StableIcon className="h-3 w-3" />;
      trendColorClasses = 'bg-gray-100 text-gray-600';
    } else if (isPositive) {
      trendIcon = <TrendingUpIcon className="h-3 w-3" />;
      trendColorClasses = 'bg-green-100 text-green-600';
    } else {
      trendIcon = <TrendingDownIcon className="h-3 w-3" />;
      trendColorClasses = 'bg-red-100 text-red-600';
    }

    return (
      <Badge
        variant="secondary"
        className={cn(
          'flex items-center gap-1 px-2 py-1 text-xs font-medium',
          trendColorClasses
        )}
      >
        {trendIcon}
        {`${absValue > 0 ? (isPositive ? '+' : '-') : ''}${absValue.toFixed(1)}%`}
      </Badge>
    );
  };

  return (
    <Card
      className={cn(
        'h-full transition-all duration-200',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg',
        compact ? 'rounded-lg' : 'rounded-xl',
        colorClasses
      )}
      onClick={onClick}
    >
      <CardContent className={cn('p-4', compact ? 'p-3' : 'p-6')}>
        <div className={cn('flex items-start gap-3', compact ? 'gap-2' : 'gap-4')}>
          {/* Icon */}
          <Avatar className={cn('flex-shrink-0', compact ? 'h-8 w-8' : 'h-12 w-12')}>
            <AvatarFallback className={cn('text-sm font-medium', compact ? 'text-xs' : 'text-sm')}>
              {icon}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <Typography
              variant={compact ? 'body2' : 'body2'}
              className="text-muted-foreground font-medium mb-1 leading-tight"
            >
              {title}
            </Typography>

            {/* Value */}
            <Typography
              variant={compact ? 'h6' : 'h5'}
              className="font-bold text-foreground leading-tight mb-1"
            >
              {typeof value === 'number' && value % 1 === 0
                ? value.toLocaleString('sk-SK')
                : value}
            </Typography>

            {/* Subtitle */}
            {subtitle && (
              <Typography
                variant="body2"
                className="text-muted-foreground block mb-1"
              >
                {subtitle}
              </Typography>
            )}

            {/* Trend */}
            {trend && (
              <div className="flex items-center justify-between mt-1">
                {getTrendDisplay()}
                <Typography variant="body2" className="text-muted-foreground">
                  vs {trend.period}
                </Typography>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(StatisticsCard);
