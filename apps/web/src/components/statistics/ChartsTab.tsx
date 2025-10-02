import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import React from 'react';
import {
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

import CustomTooltip from './CustomTooltip';

interface PaymentMethodData {
  count: number;
  revenue: number;
}

interface MonthlyData {
  month: string;
  rentals: number;
  revenue: number;
  commission: number;
}

interface StatsData {
  monthlyData: MonthlyData[];
  paymentMethodStats: Record<string, PaymentMethodData>;
}

interface ChartsTabProps {
  stats: StatsData;
  COLORS: string[];
}

const ChartsTab: React.FC<ChartsTabProps> = ({ stats, COLORS }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stĺpcový graf - mesiačné prenájmy */}
      <div className="lg:col-span-1">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-blue-600 mb-4">
              Počet prenájmov podľa mesiacov
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="rentals"
                  fill="#667eea"
                  name="Prenájmy"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Koláčový graf - spôsoby platby */}
      <div className="lg:col-span-1">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-blue-600 mb-4">
              Rozdelenie podľa spôsobu platby
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.paymentMethodStats).map(
                    ([method, data]) => ({
                      name: method,
                      value: data.count,
                    })
                  )}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#667eea"
                  dataKey="value"
                >
                  {Object.entries(stats.paymentMethodStats).map(
                    (_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Línový graf - trend príjmov vs provízií */}
      <div className="col-span-2">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-blue-600 mb-4">
              Trend príjmov vs provízií
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#667eea"
                  strokeWidth={3}
                  name="Príjmy"
                  dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  stroke="#11998e"
                  strokeWidth={3}
                  name="Provízie"
                  dot={{ fill: '#11998e', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChartsTab;
