'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface UnifiedDateRangePickerProps {
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
  defaultTime?: string; // default "08:00"
}

export function UnifiedDateRangePicker({
  value,
  onChange,
  label,
  placeholder = 'Vyberte dátumový rozsah',
  required = false,
  disabled = false,
  className,
  defaultTime = '08:00',
}: UnifiedDateRangePickerProps) {
  // IMPORTANT: Nepoužívať defaultValue - kalendár musí byť úplne prázdny kým neklikneš
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  );
  const [timeFrom, setTimeFrom] = React.useState<string>(defaultTime);
  const [timeTo, setTimeTo] = React.useState<string>(defaultTime);
  const [isOpen, setIsOpen] = React.useState(false);

  // Sync with external value changes ONLY when value changes from parent
  React.useEffect(() => {
    // Ak máme value z parenta (napr. pri editácii), nasetuj ho
    if (value?.from && value?.to) {
      setDateRange({ from: value.from, to: value.to });

      // Extract time from dates
      const hoursFrom = value.from.getHours().toString().padStart(2, '0');
      const minutesFrom = value.from.getMinutes().toString().padStart(2, '0');
      setTimeFrom(`${hoursFrom}:${minutesFrom}`);

      const hoursTo = value.to.getHours().toString().padStart(2, '0');
      const minutesTo = value.to.getMinutes().toString().padStart(2, '0');
      setTimeTo(`${hoursTo}:${minutesTo}`);
    }
    // AK value je undefined/null, NESET nič - nechaj prázdny kalendár
  }, [value]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);

    if (range?.from && range?.to) {
      // Apply times to the selected dates
      const fromDate = new Date(range.from);
      const toDate = new Date(range.to);

      // Parse time values
      const [fromHours, fromMinutes] = timeFrom.split(':').map(Number);
      const [toHours, toMinutes] = timeTo.split(':').map(Number);

      fromDate.setHours(fromHours || 0, fromMinutes || 0, 0, 0);
      toDate.setHours(toHours || 0, toMinutes || 0, 0, 0);

      onChange?.({ from: fromDate, to: toDate });
    } else if (!range?.from && !range?.to) {
      onChange?.({ from: null, to: null });
    }
  };

  const handleTimeChange = (
    type: 'from' | 'to',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const time = e.target.value;

    if (type === 'from') {
      setTimeFrom(time);
    } else {
      setTimeTo(time);
    }

    // Update the date range with new time
    if (dateRange?.from && dateRange?.to && time) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);

      const [hours, minutes] = time.split(':').map(Number);

      if (type === 'from') {
        fromDate.setHours(hours || 0, minutes || 0, 0, 0);
      } else {
        toDate.setHours(hours || 0, minutes || 0, 0, 0);
      }

      onChange?.({ from: fromDate, to: toDate });
    }
  };

  const handleClear = () => {
    setDateRange(undefined);
    setTimeFrom(defaultTime);
    setTimeTo(defaultTime);
    onChange?.({ from: null, to: null });
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return null;

    if (dateRange.to) {
      return (
        <>
          {format(dateRange.from, 'd. MMM yyyy', { locale: sk })}
          {' - '}
          {format(dateRange.to, 'd. MMM yyyy', { locale: sk })}
        </>
      );
    }

    return format(dateRange.from, 'd. MMM yyyy', { locale: sk });
  };

  return (
    <div className={className}>
      {label && (
        <Label className="mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !dateRange?.from && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              <div className="flex items-center gap-2">
                <span>{formatDateRange()}</span>
                {timeFrom && timeTo && (
                  <>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {timeFrom} - {timeTo}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
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
              classNames={{
                day_range_middle:
                  'bg-primary/20 text-primary-foreground rounded-none hover:bg-primary/30 transition-colors',
                day_range_start:
                  'bg-primary text-primary-foreground rounded-l-md rounded-r-none hover:bg-primary/90',
                day_range_end:
                  'bg-primary text-primary-foreground rounded-r-md rounded-l-none hover:bg-primary/90',
              }}
            />

            {/* Time inputs - zobrazí sa len keď sú vybrané oba dátumy */}
            {dateRange?.from && dateRange?.to && (
              <div className="border-t mt-3 pt-3 space-y-3">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Nastavenie času
                </div>

                {/* Time FROM */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="time-from" className="text-sm min-w-[60px]">
                    Čas od:
                  </Label>
                  <Input
                    id="time-from"
                    type="time"
                    value={timeFrom}
                    onChange={e => handleTimeChange('from', e)}
                    className="flex-1"
                  />
                </div>

                {/* Time TO */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="time-to" className="text-sm min-w-[60px]">
                    Čas do:
                  </Label>
                  <Input
                    id="time-to"
                    type="time"
                    value={timeTo}
                    onChange={e => handleTimeChange('to', e)}
                    className="flex-1"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
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

            {/* Helper text keď je vybraný len jeden dátum */}
            {dateRange?.from && !dateRange?.to && (
              <div className="border-t mt-3 pt-3">
                <p className="text-sm text-muted-foreground text-center">
                  Vyberte koncový dátum
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
