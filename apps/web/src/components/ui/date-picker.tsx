'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { sk } from 'date-fns/locale';
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

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder: _placeholder = 'Vyberte dátum',
  required = false,
  disabled = false,
  className,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value || undefined);
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (value) {
      setDate(value);
      setInputValue(format(value, 'dd.MM.yyyy'));
    } else {
      setDate(undefined);
      setInputValue('');
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setInputValue(format(selectedDate, 'dd.MM.yyyy'));
    } else {
      setInputValue('');
    }
    onChange?.(selectedDate || null);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Try to parse the date in multiple formats
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
          setDate(parsedDate);
          onChange?.(parsedDate);
          return;
        }
      } catch {
        // Continue to next format
      }
    }

    // If no format matched and input is empty, clear the date
    if (value === '') {
      setDate(undefined);
      onChange?.(null);
    }
  };

  const handleInputBlur = () => {
    // Format the input value on blur if date is valid
    if (date) {
      setInputValue(format(date, 'dd.MM.yyyy'));
    }
  };

  const handleClear = () => {
    setDate(undefined);
    setInputValue('');
    onChange?.(null);
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
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="dd.mm.rrrr"
          disabled={disabled}
          className={cn('flex-1', !date && inputValue && 'border-destructive')}
        />
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
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                locale={sk}
              />
              {date && (
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
                      OK
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {inputValue && !date && (
        <p className="text-xs text-destructive mt-1">
          Neplatný formát dátumu. Použite dd.mm.rrrr
        </p>
      )}
    </div>
  );
}
