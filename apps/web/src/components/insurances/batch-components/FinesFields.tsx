import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useCustomers } from '@/lib/react-query/hooks/useCustomers';
import { CustomerCombobox } from './CustomerCombobox';
import { format, parse, isValid } from 'date-fns';

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
          <div className="flex gap-2">
            <Input
              type="text"
              value={
                data.fineDate
                  ? format(new Date(data.fineDate), 'dd.MM.yyyy')
                  : ''
              }
              onChange={e => {
                const value = e.target.value;
                const formats = [
                  'dd.MM.yyyy',
                  'd.M.yyyy',
                  'dd/MM/yyyy',
                  'd/M/yyyy',
                  'yyyy-MM-dd',
                ];

                for (const formatStr of formats) {
                  try {
                    const parsedDate = parse(value, formatStr, new Date());
                    if (isValid(parsedDate)) {
                      onChange('fineDate', parsedDate);
                      return;
                    }
                  } catch {
                    // Continue to next format
                  }
                }
              }}
              placeholder="dd.mm.rrrr"
              className="flex-1 border-2"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.fineDate}
                  onSelect={date => onChange('fineDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
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
            <div className="flex gap-2">
              <Input
                type="text"
                value={
                  data.ownerPaidDate
                    ? format(new Date(data.ownerPaidDate), 'dd.MM.yyyy')
                    : ''
                }
                onChange={e => {
                  const value = e.target.value;
                  const formats = [
                    'dd.MM.yyyy',
                    'd.M.yyyy',
                    'dd/MM/yyyy',
                    'd/M/yyyy',
                    'yyyy-MM-dd',
                  ];

                  for (const formatStr of formats) {
                    try {
                      const parsedDate = parse(value, formatStr, new Date());
                      if (isValid(parsedDate)) {
                        onChange('ownerPaidDate', parsedDate);
                        return;
                      }
                    } catch {
                      // Continue to next format
                    }
                  }
                }}
                placeholder="dd.mm.rrrr"
                className="flex-1 border-2"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.ownerPaidDate}
                    onSelect={date => onChange('ownerPaidDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
            <div className="flex gap-2">
              <Input
                type="text"
                value={
                  data.customerPaidDate
                    ? format(new Date(data.customerPaidDate), 'dd.MM.yyyy')
                    : ''
                }
                onChange={e => {
                  const value = e.target.value;
                  const formats = [
                    'dd.MM.yyyy',
                    'd.M.yyyy',
                    'dd/MM/yyyy',
                    'd/M/yyyy',
                    'yyyy-MM-dd',
                  ];

                  for (const formatStr of formats) {
                    try {
                      const parsedDate = parse(value, formatStr, new Date());
                      if (isValid(parsedDate)) {
                        onChange('customerPaidDate', parsedDate);
                        return;
                      }
                    } catch {
                      // Continue to next format
                    }
                  }
                }}
                placeholder="dd.mm.rrrr"
                className="flex-1 border-2"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.customerPaidDate}
                    onSelect={date => onChange('customerPaidDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
