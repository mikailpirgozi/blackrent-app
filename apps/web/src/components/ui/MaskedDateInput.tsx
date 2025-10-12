/**
 * MaskedDateInput - Date input with automatic formatting mask (dd.mm.yyyy)
 * User types only numbers, dots are added automatically
 * Cursor automatically jumps to next section after completing a section
 */
import { useState, useEffect, useRef } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';

interface MaskedDateInputProps {
  value?: Date | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MaskedDateInput({
  value,
  onChange,
  placeholder = 'dd.mm.rrrr',
  disabled = false,
  className,
}: MaskedDateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external value
  useEffect(() => {
    if (value) {
      setInputValue(format(new Date(value), 'dd.MM.yyyy'));
    } else {
      setInputValue('');
    }
  }, [value]);

  const formatDateInput = (input: string): string => {
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '');

    // Build formatted string
    let formatted = '';

    // Day (first 2 digits)
    if (digitsOnly.length > 0) {
      formatted += digitsOnly.substring(0, 2);
    }

    // Add dot after day
    if (digitsOnly.length >= 2) {
      formatted += '.';
    }

    // Month (next 2 digits)
    if (digitsOnly.length >= 3) {
      formatted += digitsOnly.substring(2, 4);
    }

    // Add dot after month
    if (digitsOnly.length >= 4) {
      formatted += '.';
    }

    // Year (next 4 digits)
    if (digitsOnly.length >= 5) {
      formatted += digitsOnly.substring(4, 8);
    }

    return formatted;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Format the input
    const formatted = formatDateInput(newValue);
    setInputValue(formatted);

    // Try to parse if we have enough digits (at least dd.mm.yyyy = 10 chars including dots)
    if (formatted.length === 10) {
      const formats = ['dd.MM.yyyy', 'd.M.yyyy'];

      for (const formatStr of formats) {
        try {
          const parsedDate = parse(formatted, formatStr, new Date());
          if (isValid(parsedDate)) {
            onChange?.(parsedDate);
            return;
          }
        } catch {
          // Continue to next format
        }
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight'
    ) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Only allow numbers and dots
    if (!/[0-9.]/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={10}
        className="flex-1 border-2 font-mono"
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
