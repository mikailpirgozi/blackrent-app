import { User as PersonIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Typography } from '@/components/ui/typography';
import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import CustomTooltip from './CustomTooltip';

interface CompanyData {
  count: number;
  revenue: number;
  commission: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
}

interface StatsData {
  monthlyData: MonthlyData[];
  companyStats: Record<string, CompanyData>;
  avgRentalPrice: number;
  avgRentalDuration: number;
  totalCommission: number;
  tomorrowReturns: Array<{ id: string; customerName: string }>;
}

interface OverviewTabProps {
  stats: StatsData;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Mesiačný trend */}
      <div className="lg:col-span-8">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-blue-600 mb-4">
              Mesiačný trend príjmov
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#667eea"
                  fill="url(#colorRevenue)"
                  strokeWidth={3}
                  name="Príjmy"
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rýchle štatistiky */}
      <div className="lg:col-span-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-blue-600 mb-4">
              Rýchle štatistiky
            </Typography>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center p-4 rounded-lg bg-gray-50">
                <Typography variant="body2" className="font-semibold">
                  Priemerná cena
                </Typography>
                <Typography variant="h6" className="font-bold text-green-600">
                  {stats.avgRentalPrice.toFixed(2)} €
                </Typography>
              </div>
              <Separator />
              <div className="flex justify-between items-center p-4 rounded-lg bg-gray-50">
                <Typography variant="body2" className="font-semibold">
                  Priemerná dĺžka
                </Typography>
                <Typography variant="h6" className="font-bold text-blue-600">
                  {stats.avgRentalDuration.toFixed(1)} dní
                </Typography>
              </div>
              <Separator />
              <div className="flex justify-between items-center p-4 rounded-lg bg-gray-50">
                <Typography variant="body2" className="font-semibold">
                  Celková provízia
                </Typography>
                <Typography variant="h6" className="font-bold text-yellow-600">
                  {stats.totalCommission.toLocaleString()} €
                </Typography>
              </div>
              <Separator />
              <div className="flex justify-between items-center p-4 rounded-lg bg-gray-50">
                <Typography variant="body2" className="font-semibold">
                  Zajtrajšie vrátenia
                </Typography>
                <Typography variant="h6" className="font-bold text-cyan-600">
                  {stats.tomorrowReturns.length}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top firmy */}
      <div className="col-span-12">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-blue-600 mb-4">
              Top firmy podľa príjmov
            </Typography>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">Firma</TableHead>
                    <TableHead className="text-right font-bold">
                      Počet prenájmov
                    </TableHead>
                    <TableHead className="text-right font-bold">
                      Príjmy
                    </TableHead>
                    <TableHead className="text-right font-bold">
                      Provízia
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(stats.companyStats)
                    .sort(([, a], [, b]) => b.revenue - a.revenue)
                    .slice(0, 5)
                    .map(([company, data]) => (
                      <TableRow
                        key={company}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 bg-blue-600">
                              <AvatarFallback className="text-white text-xs">
                                <PersonIcon className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <Typography variant="body2" className="font-medium">
                              {company}
                            </Typography>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-blue-600 text-white font-semibold">
                            {data.count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Typography
                            variant="body2"
                            className="font-bold text-green-600"
                          >
                            {data.revenue.toLocaleString()} €
                          </Typography>
                        </TableCell>
                        <TableCell className="text-right">
                          <Typography
                            variant="body2"
                            className="font-bold text-yellow-600"
                          >
                            {data.commission.toLocaleString()} €
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
