/**
 * DateInput - Reusable component for manual date input with calendar button
 * Solves the controlled input issue by managing local state
 */
import { useState, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value?: Date | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateInput({
  value,
  onChange,
  placeholder = 'dd.mm.rrrr',
  disabled = false,
  className,
}: DateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Sync with external value
  useEffect(() => {
    if (value) {
      setInputValue(format(new Date(value), 'dd.MM.yyyy'));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse the date
    const formats = [
      'dd.MM.yyyy',
      'd.M.yyyy',
      'dd/MM/yyyy',
      'd/M/yyyy',
      'yyyy-MM-dd',
    ];

    for (const formatStr of formats) {
      try {
        const parsedDate = parse(newValue, formatStr, new Date());
        if (isValid(parsedDate)) {
          onChange?.(parsedDate);
          return;
        }
      } catch {
        // Continue to next format
      }
    }

    // If input is empty, clear the date
    if (newValue === '') {
      onChange?.(undefined);
    }
  };

  const handleInputBlur = () => {
    // Format on blur if valid date exists
    if (value) {
      setInputValue(format(new Date(value), 'dd.MM.yyyy'));
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setInputValue(format(date, 'dd.MM.yyyy'));
      onChange?.(date);
    }
    setCalendarOpen(false);
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 border-2"
      />
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            className="shrink-0 border-2"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={handleCalendarSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
