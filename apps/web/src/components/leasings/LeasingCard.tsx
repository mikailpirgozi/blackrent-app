/**
 * ===================================================================
 * LEASING CARD - Jedna karta leasingu v zozname
 * ===================================================================
 */

import { useState } from 'react';
import { Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Leasing } from '@/types/leasing-types';
import { LeasingDetail } from './LeasingDetail';

interface LeasingCardProps {
  leasing: Leasing;
}

export function LeasingCard({ leasing }: LeasingCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const formatMoney = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toFixed(2)} €`;
  };

  // Vypočítaj progress
  const progress =
    leasing.progressPercentage ||
    (leasing.paidInstallments / leasing.totalInstallments) * 100;

  // Zisti či je splátka splatná čoskoro
  const isDueSoon =
    leasing.daysUntilNextPayment !== undefined &&
    leasing.daysUntilNextPayment <= 2;

  const isOverdue =
    leasing.daysUntilNextPayment !== undefined &&
    leasing.daysUntilNextPayment < 0;

  return (
    <>
      <Card
        className={`cursor-pointer transition-colors hover:bg-accent ${
          isOverdue
            ? 'border-destructive'
            : isDueSoon
              ? 'border-orange-500'
              : ''
        }`}
        onClick={() => setDetailOpen(true)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            {/* Left side - Info */}
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {leasing.leasingCompany}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {leasing.loanCategory}
                  </p>
                </div>
                <Badge variant="outline">{leasing.paymentType}</Badge>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {leasing.paidInstallments} / {leasing.totalInstallments}{' '}
                    splátok
                  </span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Financial info */}
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Zostatok:</span>
                  <span className="ml-2 font-semibold">
                    {formatMoney(leasing.currentBalance)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {formatMoney(leasing.totalMonthlyPayment || 0)}/mes.
                  </span>
                </div>
              </div>

              {/* Next payment alert */}
              {leasing.nextPaymentDue && (
                <div
                  className={`flex items-center gap-2 text-sm ${
                    isOverdue
                      ? 'text-destructive'
                      : isDueSoon
                        ? 'text-orange-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {isOverdue ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                  <span>
                    {isOverdue
                      ? `Po splatnosti (${Math.abs(leasing.daysUntilNextPayment!)} dní)`
                      : isDueSoon
                        ? `Splátka splatná o ${leasing.daysUntilNextPayment} dni`
                        : `Najbližšia splátka: ${new Date(leasing.nextPaymentDue).toLocaleDateString('sk-SK')}`}
                  </span>
                </div>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex flex-col items-end gap-2">
              <Button
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  setDetailOpen(true);
                }}
              >
                Detail
              </Button>

              {isDueSoon && (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-800"
                >
                  Splatné čoskoro
                </Badge>
              )}

              {isOverdue && <Badge variant="destructive">Po splatnosti</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail drawer */}
      {detailOpen && (
        <LeasingDetail
          leasingId={leasing.id}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </>
  );
}
