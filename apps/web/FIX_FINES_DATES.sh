#!/bin/bash
# Quick script to replace all date inputs in FinesFields with DateInput component

FILE="src/components/insurances/batch-components/FinesFields.tsx"

cat > "$FILE" << 'EOF'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useCustomers } from '@/lib/react-query/hooks/useCustomers';
import { CustomerCombobox } from './CustomerCombobox';
import { DateInput } from '@/components/ui/DateInput';

interface FinesData {
  fineDate?: Date;
  customerId?: string;
  isPaid?: boolean;
  ownerPaidDate?: Date;
  customerPaidDate?: Date;
  country?: string;
  enforcementCompany?: string;
  fineAmount?: number;
  fineAmountLate?: number;
  notes?: string;
}

interface FinesFieldsProps {
  data: FinesData;
  onChange: (
    field: keyof FinesData,
    value: Date | string | number | boolean | undefined
  ) => void;
}

export function FinesFields({ data, onChange }: FinesFieldsProps) {
  const { data: customers = [] } = useCustomers();

  const isFullyPaid = data.ownerPaidDate && data.customerPaidDate;
  const hasWarning = !data.ownerPaidDate || !data.customerPaidDate;

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      {hasWarning && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>Upozornenie:</strong> Pokuta nie je úplne uhradená.
            {!data.ownerPaidDate && ' Majiteľ ešte nezaplatil.'}
            {!data.customerPaidDate && ' Zákazník ešte nezaplatil.'}
          </AlertDescription>
        </Alert>
      )}

      {isFullyPaid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-900">
            ✅ Pokuta je úplne uhradená (majiteľ aj zákazník zaplatili).
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fine Date */}
        <div className="space-y-2">
          <Label>Dátum pokuty *</Label>
          <DateInput
            value={data.fineDate}
            onChange={date => onChange('fineDate', date)}
          />
        </div>

        {/* Customer */}
        <CustomerCombobox
          customers={customers}
          value={data.customerId || ''}
          onChange={value => onChange('customerId', value)}
        />

        {/* Country */}
        <div className="space-y-2">
          <Label>Krajina pokuty</Label>
          <Input
            value={data.country || ''}
            onChange={e => onChange('country', e.target.value)}
            placeholder="Napríklad: Slovensko, Česko, Rakúsko..."
            className="border-2"
          />
        </div>

        {/* Enforcement Company */}
        <div className="space-y-2">
          <Label>Vymáhajúca spoločnosť</Label>
          <Input
            value={data.enforcementCompany || ''}
            onChange={e => onChange('enforcementCompany', e.target.value)}
            placeholder="Napríklad: EuroParking, ANOD..."
            className="border-2"
          />
        </div>
      </div>

      <Separator />

      {/* Fine Amounts */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          💰 Sumy pokút
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Suma pri včasnej platbe (€) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={data.fineAmount || ''}
              onChange={e =>
                onChange('fineAmount', parseFloat(e.target.value) || undefined)
              }
              placeholder="50.00"
              className="border-2"
            />
            <p className="text-sm text-slate-500">
              Suma ak sa zaplatí do stanovenej lehoty
            </p>
          </div>

          <div className="space-y-2">
            <Label>Suma po splatnosti (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={data.fineAmountLate || ''}
              onChange={e =>
                onChange(
                  'fineAmountLate',
                  parseFloat(e.target.value) || undefined
                )
              }
              placeholder="100.00"
              className="border-2"
            />
            <p className="text-sm text-slate-500">
              Zvýšená suma pri oneskorení platby
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Payment Status */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          💳 Stav úhrad
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Owner Payment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Majiteľ zaplatil</Label>
              {data.ownerPaidDate ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Zaplatené
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Nezaplatené
                </Badge>
              )}
            </div>
            <DateInput
              value={data.ownerPaidDate}
              onChange={date => onChange('ownerPaidDate', date)}
            />
            {data.ownerPaidDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-red-600 hover:text-red-700"
                onClick={() => onChange('ownerPaidDate', undefined)}
              >
                Zrušiť úhradu
              </Button>
            )}
          </div>

          {/* Customer Payment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Zákazník zaplatil</Label>
              {data.customerPaidDate ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Zaplatené
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Nezaplatené
                </Badge>
              )}
            </div>
            <DateInput
              value={data.customerPaidDate}
              onChange={date => onChange('customerPaidDate', date)}
            />
            {data.customerPaidDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-red-600 hover:text-red-700"
                onClick={() => onChange('customerPaidDate', undefined)}
              >
                Zrušiť úhradu
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div className="space-y-2">
        <Label>Poznámka</Label>
        <Textarea
          rows={3}
          value={data.notes || ''}
          onChange={e => onChange('notes', e.target.value)}
          placeholder="Zadajte poznámku alebo doplňujúce informácie..."
          className="border-2"
        />
      </div>
    </div>
  );
}
EOF

echo "FinesFields.tsx fixed!"

