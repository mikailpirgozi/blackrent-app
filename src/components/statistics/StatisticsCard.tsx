/**
 * 📊 STATISTICS CARD
 *
 * Reusable card component pre štatistiky s responsive design
 */

import {
  Remove as StableIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Typography,
  useTheme,
} from '@mui/material';
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
  const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Nepoužívané

  // Get color based on theme
  const getColor = (colorName: string) => {
    const colors: Record<string, string> = {
      primary: theme.palette.primary.main,
      success: theme.palette.success.main,
      warning: theme.palette.warning.main,
      error: theme.palette.error.main,
      info: theme.palette.info.main,
    };
    return colors[colorName] || colorName;
  };

  const cardColor = getColor(color);

  // Get trend icon and color
  const getTrendDisplay = () => {
    if (!trend) return null;

    const isPositive =
      trend.isPositive !== undefined ? trend.isPositive : trend.value > 0;
    const absValue = Math.abs(trend.value);

    let trendIcon;
    let trendColor;

    if (absValue === 0) {
      trendIcon = <StableIcon fontSize="small" />;
      trendColor = theme.palette.text.secondary;
    } else if (isPositive) {
      trendIcon = <TrendingUpIcon fontSize="small" />;
      trendColor = theme.palette.success.main;
    } else {
      trendIcon = <TrendingDownIcon fontSize="small" />;
      trendColor = theme.palette.error.main;
    }

    return (
      <Chip
        size="small"
        icon={trendIcon}
        label={`${absValue > 0 ? (isPositive ? '+' : '-') : ''}${absValue.toFixed(1)}%`}
        sx={{
          backgroundColor: `${trendColor}20`,
          color: trendColor,
          fontSize: '0.7rem',
          height: 20,
          '& .MuiChip-icon': {
            color: trendColor,
            fontSize: 12,
          },
        }}
      />
    );
  };

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        borderRadius: compact ? 2 : 3,
        height: '100%',
        background: compact
          ? `linear-gradient(135deg, ${cardColor}08 0%, ${cardColor}15 100%)`
          : theme.palette.background.paper,
        border: `1px solid ${cardColor}20`,
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[6],
              borderColor: `${cardColor}40`,
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent
        sx={{
          p: compact ? 2 : 3,
          '&:last-child': { pb: compact ? 2 : 3 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: compact ? 1.5 : 2,
          }}
        >
          {/* Icon */}
          <Avatar
            sx={{
              backgroundColor: `${cardColor}15`,
              color: cardColor,
              width: compact ? 40 : 48,
              height: compact ? 40 : 48,
            }}
          >
            {icon}
          </Avatar>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Title */}
            <Typography
              variant={compact ? 'body2' : 'subtitle2'}
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                mb: 0.5,
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>

            {/* Value */}
            <Typography
              variant={compact ? 'h6' : 'h5'}
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.1,
                mb: subtitle || trend ? 0.5 : 0,
              }}
            >
              {typeof value === 'number' && value % 1 === 0
                ? value.toLocaleString('sk-SK')
                : value}
            </Typography>

            {/* Subtitle */}
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  mb: trend ? 0.5 : 0,
                }}
              >
                {subtitle}
              </Typography>
            )}

            {/* Trend */}
            {trend && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: 0.5,
                }}
              >
                {getTrendDisplay()}
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  vs {trend.period}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default memo(StatisticsCard);
