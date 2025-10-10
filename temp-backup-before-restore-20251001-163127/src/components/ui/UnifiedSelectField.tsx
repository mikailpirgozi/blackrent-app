/**
 * 🎯 UNIFIED SELECT FIELD COMPONENT
 * 
 * Konzistentný select pre celú BlackRent aplikáciu
 * Nahradí všetky MUI Select implementácie
 * 
 * Features:
 * - Single a multi-select
 * - Search/filter v options
 * - Grouped options
 * - MUI Select API kompatibilita
 */

import React, { forwardRef, useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from './select';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, X } from 'lucide-react';
import { Badge } from './badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
}

export interface UnifiedSelectFieldProps {
  // Basic props
  label?: string;
  value?: string | number | string[] | number[];
  onChange?: (value: any) => void;
  onValueChange?: (value: string) => void; // shadcn compatibility
  
  // Options
  options?: SelectOption[];
  children?: React.ReactNode; // For MenuItem children
  
  // Configuration
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  placeholder?: string;
  
  // States
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  
  // Sizing
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  
  // MUI compatibility
  variant?: 'outlined' | 'filled' | 'standard';
  margin?: 'none' | 'dense' | 'normal';
  renderValue?: (value: any) => React.ReactNode;
  displayEmpty?: boolean;
  MenuProps?: any;
  native?: boolean;
  sx?: Record<string, unknown>;
  
  // Event handlers (MUI compatibility)
  onOpen?: () => void;
  onClose?: () => void;
  
  // Styling
  className?: string;
  selectClassName?: string;
}

export const UnifiedSelectField = forwardRef<
  HTMLButtonElement,
  UnifiedSelectFieldProps
>(({
  label,
  value,
  onChange,
  onValueChange,
  options = [],
  children,
  multiple = false,
  searchable = false,
  clearable = false,
  placeholder = 'Vyberte možnosť',
  error = false,
  helperText,
  required = false,
  disabled = false,
  size = 'medium',
  fullWidth = true,
  variant = 'outlined',
  margin = 'none',
  renderValue,
  displayEmpty = false,
  MenuProps,
  native = false,
  sx,
  onOpen,
  onClose,
  className,
  selectClassName,
  ...props
}, ref) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Parse children to options if using MenuItem pattern
  const parsedOptions = useMemo(() => {
    if (children && React.Children.count(children) > 0) {
      const childOptions: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props.value !== undefined) {
          childOptions.push({
            value: child.props.value,
            label: child.props.children || child.props.value,
            disabled: child.props.disabled,
          });
        }
      });
      return childOptions.length > 0 ? childOptions : options;
    }
    return options;
  }, [children, options]);
  
  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchable || !search) return parsedOptions;
    
    return parsedOptions.filter(option =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [parsedOptions, search, searchable]);
  
  // Group options
  const groupedOptions = useMemo(() => {
    const groups: Record<string, SelectOption[]> = { '': [] };
    
    filteredOptions.forEach(option => {
      const group = option.group || '';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(option);
    });
    
    return groups;
  }, [filteredOptions]);
  
  // Handle value change
  const handleValueChange = (newValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.some(v => String(v) === newValue);
      
      const newValues = isSelected
        ? currentValues.filter(v => v !== newValue)
        : [...currentValues, newValue];
      
      onChange?.(newValues);
    } else {
      onChange?.(newValue);
      onValueChange?.(newValue);
      setOpen(false);
    }
  };
  
  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : '');
    onValueChange?.('');
  };
  
  // Get display value
  const getDisplayValue = () => {
    if (renderValue) {
      return renderValue(value);
    }
    
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      
      const selectedLabels = value
        .map(v => parsedOptions.find(opt => opt.value === v)?.label)
        .filter(Boolean);
      
      return (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map((label, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {label}
            </Badge>
          ))}
        </div>
      );
    }
    
    const selectedOption = parsedOptions.find(opt => opt.value === value);
    return selectedOption?.label || (displayEmpty ? placeholder : '');
  };
  
  // Margin classes
  const marginClasses = {
    none: '',
    dense: 'my-1',
    normal: 'my-2',
  };
  
  // Size classes
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-9',
    large: 'h-11',
  };
  
  // Handle open/close events
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      onOpen?.();
    } else {
      onClose?.();
      setSearch('');
    }
  };
  
  // Multi-select with search
  if (multiple || searchable) {
    return (
      <div className={cn(
        fullWidth && 'w-full',
        marginClasses[margin],
        className
      )}>
        {label && (
          <Label className={cn(
            'mb-1.5 block text-sm font-medium',
            error && 'text-destructive'
          )}>
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}
        
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                'justify-between font-normal',
                fullWidth && 'w-full',
                sizeClasses[size],
                error && 'border-destructive',
                selectClassName
              )}
            >
              <span className="truncate">{getDisplayValue()}</span>
              <div className="flex items-center gap-1">
                {clearable && value && !disabled && (
                  <X 
                    className="h-3 w-3 opacity-50 hover:opacity-100" 
                    onClick={handleClear}
                  />
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          
          <PopoverContent 
            className="w-full p-0" 
            align="start"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
            <Command>
              {searchable && (
                <CommandInput 
                  placeholder="Hľadať..." 
                  value={search}
                  onValueChange={setSearch}
                />
              )}
              
              <CommandList>
                {filteredOptions.length === 0 && (
                  <CommandEmpty>Žiadne možnosti</CommandEmpty>
                )}
                
                {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                  <CommandGroup key={group} heading={group}>
                    {groupOptions.map((option) => {
                      const isSelected = multiple
                        ? Array.isArray(value) && value.some(v => String(v) === String(option.value))
                        : String(value) === String(option.value);
                      
                      return (
                        <CommandItem
                          key={option.value}
                          value={String(option.value)}
                          disabled={option.disabled}
                          onSelect={() => handleValueChange(String(option.value))}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {multiple && (
                              <div className={cn(
                                "h-4 w-4 border rounded flex items-center justify-center",
                                isSelected ? "bg-primary border-primary" : "border-input"
                              )}>
                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                            )}
                            {option.icon}
                            <span>{option.label}</span>
                          </div>
                          {!multiple && isSelected && (
                            <Check className="h-4 w-4" />
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
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
  }
  
  // Simple single select
  return (
    <div className={cn(
      fullWidth && 'w-full',
      marginClasses[margin],
      className
    )}>
      {label && (
        <Label className={cn(
          'mb-1.5 block text-sm font-medium',
          error && 'text-destructive'
        )}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      
      <Select
        value={String(value || '')}
        onValueChange={handleValueChange}
        disabled={disabled}
        onOpenChange={handleOpenChange}
      >
        <SelectTrigger 
          ref={ref}
          className={cn(
            sizeClasses[size],
            error && 'border-destructive',
            selectClassName
          )}
        >
          <SelectValue placeholder={placeholder}>
            {getDisplayValue()}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          {Object.entries(groupedOptions).map(([group, groupOptions]) => (
            <SelectGroup key={group}>
              {group && <SelectLabel>{group}</SelectLabel>}
              {groupOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={String(option.value)}
                  disabled={option.disabled}
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
              {group && <SelectSeparator />}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      
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

UnifiedSelectField.displayName = 'UnifiedSelectField';

// Export convenience alias
export const SelectField = UnifiedSelectField;

export default UnifiedSelectField;
