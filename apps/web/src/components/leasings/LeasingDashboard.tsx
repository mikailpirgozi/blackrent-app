/**
 * ===================================================================
 * LEASING DASHBOARD - Overview cards
 * ===================================================================
 */

import { AlertCircle, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LeasingDashboard as DashboardData } from '@/types/leasing-types';

interface LeasingDashboardProps {
  data: DashboardData;
}

export function LeasingDashboard({ data }: LeasingDashboardProps) {
  const formatMoney = (amount: number) => `${amount.toFixed(2)} €`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Celkové zadlženie */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Celkové zadlženie
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatMoney(data.totalDebt)}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.activeLeasingsCount} aktívnych leasingov
          </p>
        </CardContent>
      </Card>

      {/* Mesačné náklady */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Mesačné náklady</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatMoney(data.monthlyTotalCost)}
          </div>
          <p className="text-xs text-muted-foreground">
            Celkové mesačné splátky
          </p>
        </CardContent>
      </Card>

      {/* Nadchádzajúce splátky */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Nadchádzajúce splátky
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">7 dní:</span>
              <Badge variant="secondary">
                {data.upcomingPayments.within7Days}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">30 dní:</span>
              <Badge variant="outline">
                {data.upcomingPayments.within30Days}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Po splatnosti */}
      <Card
        className={data.overduePayments.length > 0 ? 'border-destructive' : ''}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Po splatnosti</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {data.overduePayments.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.overduePayments.length > 0
              ? 'Vyžaduje pozornosť!'
              : 'Všetko v poriadku'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
