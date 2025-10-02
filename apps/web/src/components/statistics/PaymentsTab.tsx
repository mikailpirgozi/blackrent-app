import { CheckCircle as CheckCircleIcon } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import React from 'react';

interface PaymentMethodData {
  count: number;
  revenue: number;
}

interface UnpaidRental {
  id: string;
  customerName: string;
  vehicle?: {
    brand: string;
    model: string;
  };
  totalPrice?: number;
}

interface StatsData {
  paymentMethodStats: Record<string, PaymentMethodData>;
  totalRevenue: number;
  unpaidRentals: UnpaidRental[];
}

interface PaymentsTabProps {
  stats: StatsData;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardContent>
            <h3 className="text-lg font-bold text-[#667eea] mb-4">
              Štatistiky platieb
            </h3>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">
                      Spôsob platby
                    </TableHead>
                    <TableHead className="text-right font-bold">
                      Počet
                    </TableHead>
                    <TableHead className="text-right font-bold">
                      Príjmy
                    </TableHead>
                    <TableHead className="text-right font-bold">
                      Podiel
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(stats.paymentMethodStats)
                    .sort(([, a], [, b]) => b.revenue - a.revenue)
                    .map(([method, data]) => {
                      const percentage =
                        (data.revenue / stats.totalRevenue) * 100;
                      return (
                        <TableRow
                          key={method}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[#667eea] text-white font-semibold">
                                {method}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-bold">
                              {data.count}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-bold text-[#11998e]">
                              {data.revenue.toLocaleString()} €
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-muted-foreground font-bold">
                              {percentage.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardContent>
            <h3 className="text-lg font-bold text-[#667eea] mb-4">
              Nezaplatené prenájmy
            </h3>
            {stats.unpaidRentals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mb-4 mx-auto" />
                <p className="text-base text-green-500 mb-4 font-bold">
                  Všetky prenájmy sú zaplatené!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {stats.unpaidRentals.slice(0, 5).map((rental: UnpaidRental) => (
                  <div
                    key={rental.id}
                    className="p-4 border border-border rounded-lg bg-orange-50 transition-all hover:shadow-md hover:-translate-y-1"
                  >
                    <p className="text-sm font-bold">
                      {rental.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rental.vehicle?.brand} {rental.vehicle?.model}
                    </p>
                    <p className="text-sm text-destructive font-bold">
                      {rental.totalPrice?.toLocaleString()} €
                    </p>
                  </div>
                ))}
                {stats.unpaidRentals.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center font-bold">
                    + {stats.unpaidRentals.length - 5} ďalších
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentsTab;
