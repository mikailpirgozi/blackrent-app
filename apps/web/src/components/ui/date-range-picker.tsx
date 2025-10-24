'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { sk } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  value?: {
    from: Date | null;
    to: Date | null;
  };
  onChange?: (value: { from: Date | null; to: Date | null }) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  label,
  placeholder: _placeholder = 'Vyberte dátumový rozsah',
  required = false,
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [fromInput, setFromInput] = React.useState('');
  const [toInput, setToInput] = React.useState('');

  // Sync with external value changes ONLY when value changes from parent
  React.useEffect(() => {
    if (value?.from && value?.to) {
      setDateRange({ from: value.from, to: value.to });
      setFromInput(format(value.from, 'dd.MM.yyyy'));
      setToInput(format(value.to, 'dd.MM.yyyy'));
    } else {
      setDateRange(undefined);
      setFromInput('');
      setToInput('');
    }
  }, [value]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);

    if (range?.from) {
      setFromInput(format(range.from, 'dd.MM.yyyy'));
    }
    if (range?.to) {
      setToInput(format(range.to, 'dd.MM.yyyy'));
    }

    if (range?.from && range?.to) {
      onChange?.({ from: range.from, to: range.to });
    } else if (!range?.from && !range?.to) {
      onChange?.({ from: null, to: null });
    }
  };

  const parseDateInput = (value: string): Date | null => {
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
          return parsedDate;
        }
      } catch {
        // Continue to next format
      }
    }

    return null;
  };

  const handleFromInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromInput(value);

    const parsedDate = parseDateInput(value);
    if (parsedDate) {
      const newRange = { from: parsedDate, to: dateRange?.to };
      setDateRange(newRange);
      if (newRange.to) {
        onChange?.({ from: parsedDate, to: newRange.to });
      }
    } else if (value === '') {
      setDateRange({ from: undefined, to: dateRange?.to });
      if (!dateRange?.to) {
        onChange?.({ from: null, to: null });
      }
    }
  };

  const handleToInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToInput(value);

    const parsedDate = parseDateInput(value);
    if (parsedDate) {
      const newRange = { from: dateRange?.from, to: parsedDate };
      setDateRange(newRange);
      if (newRange.from) {
        onChange?.({ from: newRange.from, to: parsedDate });
      }
    } else if (value === '') {
      setDateRange({ from: dateRange?.from, to: undefined });
      if (!dateRange?.from) {
        onChange?.({ from: null, to: null });
      }
    }
  };

  const handleFromBlur = () => {
    if (dateRange?.from) {
      setFromInput(format(dateRange.from, 'dd.MM.yyyy'));
    }
  };

  const handleToBlur = () => {
    if (dateRange?.to) {
      setToInput(format(dateRange.to, 'dd.MM.yyyy'));
    }
  };

  const handleClear = () => {
    setDateRange(undefined);
    setFromInput('');
    setToInput('');
    onChange?.({ from: null, to: null });
    setIsOpen(false);
  };

  return (
    <div className={className}>
      {label && (
        <Label className="mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div className="flex gap-2">
        <div className="flex-1 flex gap-2 items-center">
          <Input
            type="text"
            value={fromInput}
            onChange={handleFromInputChange}
            onBlur={handleFromBlur}
            placeholder="Od: dd.mm.rrrr"
            disabled={disabled}
            className={cn(
              'flex-1',
              fromInput && !dateRange?.from && 'border-destructive'
            )}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="text"
            value={toInput}
            onChange={handleToInputChange}
            onBlur={handleToBlur}
            placeholder="Do: dd.mm.rrrr"
            disabled={disabled}
            className={cn(
              'flex-1',
              toInput && !dateRange?.to && 'border-destructive'
            )}
          />
        </div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={disabled}
              className="shrink-0"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
                initialFocus
                locale={sk}
                classNames={{
                  day_range_middle:
                    'bg-primary/20 text-primary-foreground rounded-none hover:bg-primary/30 transition-colors',
                  day_range_start:
                    'bg-primary text-primary-foreground rounded-l-md rounded-r-none hover:bg-primary/90',
                  day_range_end:
                    'bg-primary text-primary-foreground rounded-r-md rounded-l-none hover:bg-primary/90',
                }}
              />

              {/* Helper text keď je vybraný len jeden dátum */}
              {dateRange?.from && !dateRange?.to && (
                <div className="border-t mt-3 pt-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Vyberte koncový dátum
                  </p>
                </div>
              )}

              {/* Action buttons - zobrazí sa len keď sú vybrané oba dátumy */}
              {dateRange?.from && dateRange?.to && (
                <div className="border-t mt-3 pt-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClear}
                      className="flex-1"
                    >
                      Vymazať
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="flex-1"
                    >
                      Potvrdiť
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {((fromInput && !dateRange?.from) || (toInput && !dateRange?.to)) && (
        <p className="text-xs text-destructive mt-1">
          Neplatný formát dátumu. Použite dd.mm.rrrr
        </p>
      )}
    </div>
  );
}
