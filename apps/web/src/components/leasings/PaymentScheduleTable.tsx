/**
 * ===================================================================
 * PAYMENT SCHEDULE TABLE - Interaktívna tabuľka splátok
 * ===================================================================
 */

import { useState } from 'react';
import { Check, X, Calendar, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useMarkPayment,
  useUnmarkPayment,
  useBulkMarkPayments,
} from '@/lib/react-query/hooks/useLeasings';
import type { PaymentScheduleItem } from '@/types/leasing-types';

interface PaymentScheduleTableProps {
  leasingId: string;
  schedule: PaymentScheduleItem[];
}

export function PaymentScheduleTable({
  leasingId,
  schedule,
}: PaymentScheduleTableProps) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const markMutation = useMarkPayment(leasingId);
  const unmarkMutation = useUnmarkPayment(leasingId);
  const bulkMarkMutation = useBulkMarkPayments(leasingId);

  const formatMoney = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0.00 €';
    return `${numAmount.toFixed(2)} €`;
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('sk-SK');

  const getStatus = (
    item: PaymentScheduleItem
  ): 'paid' | 'overdue' | 'due_soon' | 'upcoming' => {
    if (item.isPaid) return 'paid';

    const today = new Date();
    const dueDate = new Date(item.dueDate);
    const daysUntil = Math.floor(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 2) return 'due_soon';
    return 'upcoming';
  };

  const handleTogglePayment = async (item: PaymentScheduleItem) => {
    if (item.isPaid) {
      await unmarkMutation.mutateAsync(item.installmentNumber);
    } else {
      await markMutation.mutateAsync({
        installmentNumber: item.installmentNumber,
      });
    }
  };

  const handleBulkMark = async () => {
    if (selectedItems.length === 0) return;

    await bulkMarkMutation.mutateAsync({
      installmentNumbers: selectedItems,
    });

    setSelectedItems([]);
  };

  const handleSelectAll = () => {
    const unpaidItems = schedule.filter(item => !item.isPaid);
    if (selectedItems.length === unpaidItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(unpaidItems.map(item => item.installmentNumber));
    }
  };

  const unpaidCount = schedule.filter(item => !item.isPaid).length;
  const overdueCount = schedule.filter(
    item => getStatus(item) === 'overdue'
  ).length;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{unpaidCount}</span>
              <span className="text-muted-foreground"> nesplatených</span>
            </div>
            {overdueCount > 0 && (
              <Badge variant="destructive">{overdueCount} po splatnosti</Badge>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} vybraných
              </span>
              <Button
                size="sm"
                onClick={handleBulkMark}
                disabled={bulkMarkMutation.isPending}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Označiť ako uhradené
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedItems.length === unpaidCount && unpaidCount > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Splatnosť</TableHead>
              <TableHead className="text-right">Istina</TableHead>
              <TableHead className="text-right">Úrok</TableHead>
              <TableHead className="text-right">Poplatok</TableHead>
              <TableHead className="text-right">Celkom</TableHead>
              <TableHead className="text-right">Zostatok</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map(item => {
              const status = getStatus(item);
              const isSelected = selectedItems.includes(item.installmentNumber);

              return (
                <TableRow
                  key={item.id}
                  className={
                    status === 'overdue'
                      ? 'bg-destructive/5'
                      : status === 'due_soon'
                        ? 'bg-orange-50'
                        : status === 'paid'
                          ? 'opacity-60'
                          : ''
                  }
                >
                  <TableCell>
                    {!item.isPaid && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={checked => {
                          if (checked) {
                            setSelectedItems([
                              ...selectedItems,
                              item.installmentNumber,
                            ]);
                          } else {
                            setSelectedItems(
                              selectedItems.filter(
                                n => n !== item.installmentNumber
                              )
                            );
                          }
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.installmentNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(item.dueDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(item.principal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(item.interest)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(item.monthlyFee)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(item.totalPayment)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatMoney(item.remainingBalance)}
                  </TableCell>
                  <TableCell>
                    {status === 'paid' ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Uhradené
                      </Badge>
                    ) : status === 'overdue' ? (
                      <Badge variant="destructive">Po splatnosti</Badge>
                    ) : status === 'due_soon' ? (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-800"
                      >
                        Čoskoro
                      </Badge>
                    ) : (
                      <Badge variant="outline">Plánované</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={item.isPaid ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleTogglePayment(item)}
                      disabled={
                        markMutation.isPending || unmarkMutation.isPending
                      }
                    >
                      {item.isPaid ? (
                        <>
                          <X className="mr-1 h-3 w-3" />
                          Zrušiť
                        </>
                      ) : (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          Zaplatiť
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
