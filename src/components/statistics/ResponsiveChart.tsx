/**
 * 📊 RESPONSIVE CHART
 *
 * Mobile-optimized chart wrapper s responsive design
 */

import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import React, { memo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ResponsiveChartProps {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: Array<Record<string, unknown>>;
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  dataKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  // Pie chart specific
  nameKey?: string;
  valueKey?: string;
  // Multiple series
  series?: Array<{
    key: string;
    color: string;
    name?: string;
  }>;
}

const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  type,
  data,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'],
  dataKey = 'value',
  xAxisKey = 'name',
  // yAxisKey = 'value', // unused
  nameKey = 'name',
  valueKey = 'value',
  series = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Responsive height
  const chartHeight = isMobile ? Math.min(height, 250) : height;

  // Custom tooltip for better mobile experience
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: unknown[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 1.5,
            boxShadow: theme.shadows[4],
            minWidth: 120,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {label}
          </Typography>
          {payload.map((entry: Record<string, unknown>, index: number) => (
            <Typography
              key={index}
              variant="caption"
              sx={{
                color: entry.color,
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              {entry.name}:{' '}
              {typeof entry.value === 'number'
                ? entry.value.toLocaleString()
                : entry.value}
              {entry.unit && ` ${entry.unit}`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Mobile-optimized legend
  const renderLegend = (props: { payload?: unknown[] }) => {
    if (!showLegend) return null;

    const { payload } = props;
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          mt: 1,
        }}
      >
        {payload?.map((entry: Record<string, unknown>, index: number) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: entry.color,
                borderRadius: 1,
              }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: {
        top: isMobile ? 10 : 20,
        right: isMobile ? 10 : 30,
        left: isMobile ? 10 : 20,
        bottom: isMobile ? 10 : 5,
      },
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart width={400} height={chartHeight} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? 'preserveStartEnd' : 0}
              angle={isSmallMobile ? -45 : 0}
              textAnchor={isSmallMobile ? 'end' : 'middle'}
              height={isSmallMobile ? 60 : 40}
            />
            <YAxis
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 40 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend content={renderLegend} />}

            {series.length > 0 ? (
              series.map(s => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  fill={s.color}
                  name={s.name || s.key}
                  radius={isMobile ? 2 : 4}
                />
              ))
            ) : (
              <Bar
                dataKey={dataKey}
                fill={colors[0]}
                radius={isMobile ? 2 : 4}
              />
            )}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart width={400} height={chartHeight} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? 'preserveStartEnd' : 0}
            />
            <YAxis
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 40 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend content={renderLegend} />}

            {series.length > 0 ? (
              series.map(s => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  name={s.name || s.key}
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{ r: isMobile ? 3 : 4 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                strokeWidth={isMobile ? 2 : 3}
                dot={{ r: isMobile ? 3 : 4 }}
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart width={400} height={chartHeight} {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? 'preserveStartEnd' : 0}
            />
            <YAxis
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 40 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend content={renderLegend} />}

            {series.length > 0 ? (
              series.map(s => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stackId="1"
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.6}
                  name={s.name || s.key}
                />
              ))
            ) : (
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.6}
              />
            )}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart width={400} height={chartHeight}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={isMobile ? 60 : 80}
              innerRadius={isMobile ? 25 : 40}
              paddingAngle={2}
              dataKey={valueKey}
              nameKey={nameKey}
              label={!isMobile}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend content={renderLegend} />}
          </PieChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          sx={{
            textAlign: 'center',
            mb: 2,
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>
      )}

      <ResponsiveContainer width="100%" height={chartHeight}>
        {renderChart()}
      </ResponsiveContainer>
    </Box>
  );
};

export default memo(ResponsiveChart);
