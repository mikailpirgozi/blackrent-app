/**
 * 📝 UNIFIED TEXT FIELD COMPONENT
 *
 * Konzistentný text input pre celú BlackRent aplikáciu
 * Nahradí všetky MUI TextField implementácie
 *
 * Features:
 * - Label, helper text, error states
 * - Multiline support
 * - Adornments (start/end)
 * - MUI TextField API kompatibilita
 */

import React, { forwardRef } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface UnifiedTextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  // Basic props
  label?: string;
  value?: string | number;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;

  // Field configuration
  type?: React.HTMLInputTypeAttribute;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;

  // States
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  // Sizing
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;

  // Adornments
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  InputProps?: {
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
  };

  // MUI compatibility
  variant?: 'outlined' | 'filled' | 'standard';
  margin?: 'none' | 'dense' | 'normal';
  sx?: Record<string, unknown>;

  // Styling
  className?: string;
  inputClassName?: string;
}

export const UnifiedTextField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  UnifiedTextFieldProps
>(
  (
    {
      label,
      value,
      onChange,
      type = 'text',
      multiline = false,
      rows = 4,
      maxRows,
      error = false,
      helperText,
      required = false,
      disabled = false,
      readOnly = false,
      size = 'medium',
      fullWidth = true,
      startAdornment,
      endAdornment,
      InputProps,
      variant: _variant = 'outlined',
      margin = 'none',
      sx,
      className,
      inputClassName,
      placeholder,
      ...props
    },
    ref
  ) => {
    // Size classes
    const sizeClasses = {
      small: 'h-8 text-xs',
      medium: 'h-9 text-sm',
      large: 'h-11 text-base',
    };

    // Margin classes
    const marginClasses = {
      none: '',
      dense: 'my-1',
      normal: 'my-2',
    };

    // Get adornments (prefer InputProps for MUI compatibility)
    const finalStartAdornment = InputProps?.startAdornment || startAdornment;
    const finalEndAdornment = InputProps?.endAdornment || endAdornment;

    const InputComponent = multiline ? Textarea : Input;

    return (
      <div
        className={cn(fullWidth && 'w-full', marginClasses[margin], className)}
      >
        {label && (
          <Label
            htmlFor={props.id}
            className={cn(
              'mb-1.5 block text-sm font-medium',
              error && 'text-destructive'
            )}
          >
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}

        <div className="relative">
          {finalStartAdornment && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
              {finalStartAdornment}
            </div>
          )}

          <InputComponent
            ref={ref as React.Ref<HTMLTextAreaElement> & React.Ref<HTMLInputElement>}
            value={value}
            onChange={onChange}
            {...(multiline ? {} : { type })}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            {...(multiline ? { rows } : {})}
            className={cn(
              !multiline && sizeClasses[size],
              finalStartAdornment && 'pl-8',
              finalEndAdornment && 'pr-8',
              error && 'border-destructive focus-visible:ring-destructive',
              inputClassName
            )}
            aria-invalid={error}
            aria-describedby={
              helperText ? `${props.id}-helper-text` : undefined
            }
            placeholder={placeholder}
          />

          {finalEndAdornment && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
              {finalEndAdornment}
            </div>
          )}

          {error && !finalEndAdornment && (
            <AlertCircle className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
          )}
        </div>

        {helperText && (
          <p
            id={`${props.id}-helper-text`}
            className={cn(
              'mt-1.5 text-xs',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

UnifiedTextField.displayName = 'UnifiedTextField';

// Export convenience alias
export const TextField = UnifiedTextField;

export default UnifiedTextField;
