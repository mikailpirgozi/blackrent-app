/**
 * 📅 UNIFIED DATE PICKER COMPONENT
 * 
 * Konzistentný date picker pre celú BlackRent aplikáciu
 * Nahradí všetky MUI DatePicker implementácie
 * 
 * Features:
 * - Date a DateTime picking
 * - Range selection
 * - Time picker integration
 * - MUI DatePicker API kompatibilita
 */

import React, { forwardRef, useState } from 'react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export interface UnifiedDatePickerProps {
  // Basic props
  label?: string;
  value?: Date | string | null;
  onChange?: (date: Date | null) => void;
  
  // Configuration
  mode?: 'date' | 'datetime' | 'time';
  format?: string;
  locale?: any;
  placeholder?: string;
  
  // Range selection
  range?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  onRangeChange?: (start: Date | null, end: Date | null) => void;
  
  // Restrictions
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  disabledDaysOfWeek?: number[];
  
  // States
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  clearable?: boolean;
  
  // Time picker
  showTime?: boolean;
  timeFormat?: '12' | '24';
  minuteStep?: number;
  
  // Sizing
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  
  // MUI compatibility
  renderInput?: (params: any) => React.ReactNode;
  views?: Array<'year' | 'month' | 'day'>;
  openTo?: 'year' | 'month' | 'day';
  inputFormat?: string;
  mask?: string;
  sx?: Record<string, unknown>;
  
  // Styling
  className?: string;
  inputClassName?: string;
}

export const UnifiedDatePicker = forwardRef<
  HTMLButtonElement,
  UnifiedDatePickerProps
>(({
  label,
  value,
  onChange,
  mode = 'date',
  format: customFormat,
  locale = sk,
  placeholder = 'Vyberte dátum',
  range = false,
  startDate,
  endDate,
  onRangeChange,
  minDate,
  maxDate,
  disabledDates = [],
  disabledDaysOfWeek = [],
  disabled = false,
  readOnly = false,
  required = false,
  error = false,
  helperText,
  clearable = true,
  showTime = false,
  timeFormat = '24',
  minuteStep = 5,
  size = 'medium',
  fullWidth = true,
  renderInput,
  views,
  openTo,
  inputFormat,
  mask,
  sx,
  className,
  inputClassName,
  ...props
}, ref) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [selectedTime, setSelectedTime] = useState({
    hours: selectedDate?.getHours() || 0,
    minutes: selectedDate?.getMinutes() || 0,
  });
  const [rangeStart, setRangeStart] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  );
  
  // Determine format
  const dateFormat = customFormat || inputFormat || (
    mode === 'datetime' ? 'dd.MM.yyyy HH:mm' :
    mode === 'time' ? 'HH:mm' :
    'dd.MM.yyyy'
  );
  
  // Size classes
  const sizeClasses = {
    small: 'h-8 text-xs',
    medium: 'h-9 text-sm',
    large: 'h-11 text-base',
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      onChange?.(null);
      return;
    }
    
    if (mode === 'datetime' || showTime) {
      // Combine date with time
      date.setHours(selectedTime.hours);
      date.setMinutes(selectedTime.minutes);
    }
    
    setSelectedDate(date);
    onChange?.(date);
    
    if (mode === 'date' && !showTime) {
      setOpen(false);
    }
  };
  
  // Handle range selection
  const handleRangeSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (!rangeStart || (rangeStart && rangeEnd)) {
      // Start new range
      setRangeStart(date);
      setRangeEnd(undefined);
      onRangeChange?.(date, null);
    } else {
      // Complete range
      if (date < rangeStart) {
        setRangeStart(date);
        setRangeEnd(rangeStart);
        onRangeChange?.(date, rangeStart);
      } else {
        setRangeEnd(date);
        onRangeChange?.(rangeStart, date);
      }
      setOpen(false);
    }
  };
  
  // Handle time change
  const handleTimeChange = (type: 'hours' | 'minutes', value: string) => {
    const numValue = parseInt(value);
    const newTime = {
      ...selectedTime,
      [type]: numValue,
    };
    setSelectedTime(newTime);
    
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(newTime.hours);
      newDate.setMinutes(newTime.minutes);
      setSelectedDate(newDate);
      onChange?.(newDate);
    }
  };
  
  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(undefined);
    setRangeStart(undefined);
    setRangeEnd(undefined);
    onChange?.(null);
    onRangeChange?.(null, null);
  };
  
  // Get display value
  const getDisplayValue = () => {
    if (range && rangeStart) {
      if (rangeEnd) {
        return `${format(rangeStart, 'dd.MM.yyyy', { locale })} - ${format(rangeEnd, 'dd.MM.yyyy', { locale })}`;
      }
      return format(rangeStart, 'dd.MM.yyyy', { locale });
    }
    
    if (selectedDate) {
      return format(selectedDate, dateFormat, { locale });
    }
    
    return '';
  };
  
  // Check if date is disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.some(d => d.toDateString() === date.toDateString())) return true;
    if (disabledDaysOfWeek.includes(date.getDay())) return true;
    return false;
  };
  
  // Generate time options
  const generateTimeOptions = (type: 'hours' | 'minutes') => {
    const max = type === 'hours' ? 24 : 60;
    const step = type === 'minutes' ? minuteStep : 1;
    const options = [];
    
    for (let i = 0; i < max; i += step) {
      options.push(i);
    }
    
    return options;
  };
  
  // Custom render input (MUI compatibility)
  if (renderInput) {
    return renderInput({
      value: getDisplayValue(),
      onClick: () => setOpen(true),
      disabled,
      error,
      fullWidth,
      size,
    });
  }
  
  return (
    <div className={cn(fullWidth && 'w-full', className)}>
      {label && (
        <Label className={cn(
          'mb-1.5 block text-sm font-medium',
          error && 'text-destructive'
        )}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled || readOnly}
            className={cn(
              'justify-start text-left font-normal',
              fullWidth && 'w-full',
              sizeClasses[size],
              !getDisplayValue() && 'text-muted-foreground',
              error && 'border-destructive',
              inputClassName
            )}
            {...props}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDisplayValue() || placeholder}
            {clearable && getDisplayValue() && !disabled && !readOnly && (
              <button
                type="button"
                className="ml-auto hover:text-destructive"
                onClick={handleClear}
              >
                ×
              </button>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            {mode === 'time' ? (
              // Time only picker
              <div className="flex gap-2">
                <Select
                  value={String(selectedTime.hours)}
                  onValueChange={(v) => handleTimeChange('hours', v)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeOptions('hours').map(hour => (
                      <SelectItem key={hour} value={String(hour)}>
                        {String(hour).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <span className="flex items-center">:</span>
                
                <Select
                  value={String(selectedTime.minutes)}
                  onValueChange={(v) => handleTimeChange('minutes', v)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeOptions('minutes').map(minute => (
                      <SelectItem key={minute} value={String(minute)}>
                        {String(minute).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                {range ? (
                  <Calendar
                    mode="range"
                    selected={{ from: rangeStart, to: rangeEnd }}
                    onSelect={handleRangeSelect as any}
                    disabled={isDateDisabled}
                    initialFocus
                    locale={locale}
                  />
                ) : (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect as any}
                    disabled={isDateDisabled}
                    initialFocus
                    locale={locale}
                  />
                )}
                
                {(mode === 'datetime' || showTime) && (
                  <div className="border-t p-3">
                    <Label className="mb-2 block text-sm">Čas</Label>
                    <div className="flex gap-2">
                      <Select
                        value={String(selectedTime.hours)}
                        onValueChange={(v) => handleTimeChange('hours', v)}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeOptions('hours').map(hour => (
                            <SelectItem key={hour} value={String(hour)}>
                              {String(hour).padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <span className="flex items-center">:</span>
                      
                      <Select
                        value={String(selectedTime.minutes)}
                        onValueChange={(v) => handleTimeChange('minutes', v)}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeOptions('minutes').map(minute => (
                            <SelectItem key={minute} value={String(minute)}>
                              {String(minute).padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {timeFormat === '12' && (
                        <Select
                          value={selectedTime.hours < 12 ? 'AM' : 'PM'}
                          onValueChange={(v) => {
                            const hours = selectedTime.hours % 12;
                            handleTimeChange('hours', String(v === 'AM' ? hours : hours + 12));
                          }}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {helperText && (
        <p className={cn(
          'mt-1.5 text-xs',
          error ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
});

UnifiedDatePicker.displayName = 'UnifiedDatePicker';

// Export convenience aliases
export const DatePicker = UnifiedDatePicker;
export const DateTimePicker = forwardRef<HTMLButtonElement, UnifiedDatePickerProps>(
  (props, ref) => <UnifiedDatePicker ref={ref} mode="datetime" {...props} />
);
export const TimePicker = forwardRef<HTMLButtonElement, UnifiedDatePickerProps>(
  (props, ref) => <UnifiedDatePicker ref={ref} mode="time" {...props} />
);

DateTimePicker.displayName = 'DateTimePicker';
TimePicker.displayName = 'TimePicker';

export default UnifiedDatePicker;
