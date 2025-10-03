/**
 * ===================================================================
 * EARLY REPAYMENT CARD - Kalkulačka predčasného splatenia
 * ===================================================================
 */

import { Calculator, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Leasing } from '@/types/leasing-types';
import { calculateEarlyRepayment } from '@/utils/leasing/EarlyRepaymentCalculator';

interface EarlyRepaymentCardProps {
  leasing: Leasing;
}

export function EarlyRepaymentCard({ leasing }: EarlyRepaymentCardProps) {
  const formatMoney = (amount: number) => `${amount.toFixed(2)} €`;

  // Vypočítaj predčasné splatenie
  const calculation = calculateEarlyRepayment({
    currentBalance: leasing.currentBalance,
    penaltyRate: leasing.earlyRepaymentPenalty,
    penaltyType: leasing.earlyRepaymentPenaltyType,
  });

  // Vypočítaj úsporu oproti normálnemu splácaniu
  const remainingPayments =
    leasing.remainingInstallments * (leasing.totalMonthlyPayment || 0);
  const savings = remainingPayments - calculation.totalAmount;
  const savingsPercentage =
    remainingPayments > 0 ? (savings / remainingPayments) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <CardTitle className="text-base">
            Kalkulačka predčasného splatenia
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Zostatok istiny:</span>
            <span className="font-medium">
              {formatMoney(calculation.currentPrincipalBalance)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Pokuta ({calculation.penaltyRate}%):
            </span>
            <span className="font-medium text-amber-600">
              + {formatMoney(calculation.penalty)}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="font-semibold">Celkom na zaplatenie:</span>
            <span className="text-lg font-bold">
              {formatMoney(calculation.totalAmount)}
            </span>
          </div>
        </div>

        {/* Savings Info */}
        {savings > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <TrendingDown className="h-4 w-4" />
              <span className="font-medium">
                Úspora oproti normálnemu splácaniu:
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-green-900">
                {formatMoney(savings)}
              </span>
              <span className="text-sm text-green-700">
                ({savingsPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}

        {savings <= 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-sm text-amber-800">
              <p className="font-medium">Predčasné splatenie nie je výhodné</p>
              <p className="text-xs mt-1">
                Pokuta je vyššia ako úspora na úrokoch.
              </p>
            </div>
          </div>
        )}

        {/* Comparison */}
        <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Normálne splácanie:</span>
            <span>{formatMoney(remainingPayments)}</span>
          </div>
          <div className="flex justify-between">
            <span>Predčasné splatenie:</span>
            <span>{formatMoney(calculation.totalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
