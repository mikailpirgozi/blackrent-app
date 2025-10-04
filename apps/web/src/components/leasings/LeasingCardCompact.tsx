/**
 * ===================================================================
 * LEASING CARD COMPACT (VARIANT A) - Kompaktný dashboard štýl
 * ===================================================================
 * Dizajn inšpirovaný finančnými dashboardmi (Stripe, Wise)
 * - Ľavá časť: Ikona vozidla + značka, model, ŠPZ
 * - Stred: Progress bar splátok + status
 * - Pravá časť: Finančné info - Zostatok, Výška splátky
 * - Spodok: Leasingová spoločnosť + firma + tlačidlo Detail
 * ===================================================================
 */

import { useState } from 'react';
import { Calendar, CreditCard, AlertCircle, Car } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Leasing } from '@/types/leasing-types';
import { LeasingDetail } from './LeasingDetail';

interface LeasingCardCompactProps {
  leasing: Leasing;
}

export function LeasingCardCompact({ leasing }: LeasingCardCompactProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const formatMoney = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null) return '0.00 €';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00 €';
    return `${num.toFixed(2)} €`;
  };

  // Vypočítaj progress
  const progress =
    leasing.progressPercentage ||
    (leasing.paidInstallments / leasing.totalInstallments) * 100;

  // Zisti či je splátka splatná čoskoro
  const isDueSoon =
    leasing.daysUntilNextPayment !== undefined &&
    leasing.daysUntilNextPayment <= 7 &&
    leasing.daysUntilNextPayment >= 0;

  const isOverdue =
    leasing.daysUntilNextPayment !== undefined &&
    leasing.daysUntilNextPayment < 0;

  // Vehicle info
  const vehicleInfo = leasing.vehicle
    ? `${leasing.vehicle.brand} ${leasing.vehicle.model}`
    : 'Neznáme vozidlo';
  const licensePlate = leasing.vehicle?.licensePlate || 'N/A';
  const companyName = leasing.vehicle?.company || 'Bez firmy';

  return (
    <>
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          isOverdue
            ? 'border-destructive bg-destructive/5'
            : isDueSoon
              ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
              : 'hover:bg-accent/50'
        }`}
        onClick={() => setDetailOpen(true)}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            {/* LEFT: Vehicle Icon + Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Vehicle Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>

              {/* Vehicle Details */}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base truncate">
                  {vehicleInfo}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-mono">{licensePlate}</span>
                  <span>•</span>
                  <span className="truncate">{companyName}</span>
                </div>
              </div>
            </div>

            {/* CENTER: Progress + Status */}
            <div className="flex-1 space-y-2 min-w-0">
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {leasing.paidInstallments} / {leasing.totalInstallments}{' '}
                    splátok
                  </span>
                  <span className="font-semibold">{progress.toFixed(0)}%</span>
                </div>
                <Progress
                  value={progress}
                  className="h-1.5"
                  indicatorClassName={
                    isOverdue
                      ? 'bg-destructive'
                      : isDueSoon
                        ? 'bg-orange-500'
                        : 'bg-primary'
                  }
                />
              </div>

              {/* Next Payment Alert */}
              {leasing.nextPaymentDue && (
                <div
                  className={`flex items-center gap-1.5 text-xs ${
                    isOverdue
                      ? 'text-destructive font-medium'
                      : isDueSoon
                        ? 'text-orange-600 dark:text-orange-500 font-medium'
                        : 'text-muted-foreground'
                  }`}
                >
                  {isOverdue ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Calendar className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isOverdue
                      ? `Po splatnosti (${Math.abs(leasing.daysUntilNextPayment!)} dní)`
                      : isDueSoon
                        ? `Splátka o ${leasing.daysUntilNextPayment} dní`
                        : `${new Date(leasing.nextPaymentDue).toLocaleDateString('sk-SK')}`}
                  </span>
                </div>
              )}
            </div>

            {/* RIGHT: Financial Info + Actions */}
            <div className="flex flex-col items-end gap-3 flex-shrink-0">
              {/* Financial Stats */}
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground">Zostatok</div>
                <div className="text-xl font-bold">
                  {formatMoney(leasing.currentBalance)}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span className="font-semibold">
                    {formatMoney(leasing.totalMonthlyPayment || 0)}/mes
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                size="sm"
                variant={isOverdue || isDueSoon ? 'default' : 'outline'}
                onClick={e => {
                  e.stopPropagation();
                  setDetailOpen(true);
                }}
                className="w-full"
              >
                Detail
              </Button>
            </div>
          </div>

          {/* BOTTOM: Leasing Company + Badges */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {leasing.leasingCompany}
              </span>
              <Badge variant="outline" className="text-xs">
                {leasing.loanCategory}
              </Badge>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-2">
              {isDueSoon && (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-xs"
                >
                  Splatné čoskoro
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Po splatnosti
                </Badge>
              )}
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

