/**
 * 📊 RESPONSIVE CHART
 *
 * Mobile-optimized chart wrapper s responsive design
 */

import { Typography } from '@/components/ui/typography';
import { useMediaQuery } from '@/hooks/use-media-query';
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
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 640px)');

  // Responsive height
  const chartHeight = isMobile ? Math.min(height, 250) : height;

  // Custom tooltip for better mobile experience
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<Record<string, unknown>>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-[120px]">
          <Typography variant="body2" className="font-semibold mb-1">
            {label}
          </Typography>
          {payload.map((entry: Record<string, unknown>, index: number) => (
            <Typography
              key={index}
              variant="body2"
              className="block leading-tight"
              style={{ color: entry.color as string }}
            >
              {String(entry.name)}:{' '}
              {typeof entry.value === 'number'
                ? entry.value.toLocaleString()
                : String(entry.value)}
              {entry.unit ? ` ${String(entry.unit)}` : ''}
            </Typography>
          ))}
        </div>
      );
    }
    return null;
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
            {showLegend && <Legend />}

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
            {showLegend && <Legend />}

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
            {showLegend && <Legend />}

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
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="w-full">
      {title && (
        <Typography
          variant={isMobile ? 'body2' : 'h6'}
          className="text-center mb-4 font-semibold text-foreground"
        >
          {title}
        </Typography>
      )}

      <ResponsiveContainer width="100%" height={chartHeight}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default memo(ResponsiveChart);
