// ✅ FÁZA 3.1: Extracted stats component z ExpenseListNew
import { Euro as EuroIcon, Receipt as ReceiptIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Expense } from '@/types';
import { formatCurrency } from '@/utils/money';
import type Decimal from 'decimal.js';

interface ExpenseStatsProps {
  expenses: Expense[];
  totalAmount: Decimal;
}

export function ExpenseStats({ expenses, totalAmount }: ExpenseStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Total Count Card */}
      <Card className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h6 className="text-lg font-semibold mb-1">Počet nákladov</h6>
              <h4 className="text-3xl font-bold">{expenses.length}</h4>
            </div>
            <ReceiptIcon className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Total Amount Card */}
      <Card className="bg-gradient-to-br from-pink-400 via-purple-500 to-red-500 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h6 className="text-lg font-semibold mb-1">Suma</h6>
              <h4 className="text-3xl font-bold">
                {formatCurrency(totalAmount)}
              </h4>
            </div>
            <EuroIcon className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
