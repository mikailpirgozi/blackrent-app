/**
 * 🎯 UNIFIED SELECT COMPONENT
 *
 * Konzistentný select komponent pre celú BlackRent aplikáciu
 * Nahradí komplexnú MUI Select štruktúru (FormControl + InputLabel + Select + MenuItem)
 * 
 * Features:
 * - Jednoduchá API namiesto MUI chaos
 * - Searchable options pre veľké zoznamy
 * - Loading states
 * - Error states
 * - Multiple selection
 * - Custom option rendering
 * - MUI kompatibilita
 */

import React, { useState, useMemo } from 'react';
import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import { Check, ChevronDown, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Label } from './label';
import { Badge } from './badge';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Separator } from './separator';

// 🎨 Select option interface
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
  group?: string;
  metadata?: Record<string, unknown>;
}

// 🎨 Props interface s MUI kompatibilitou
export interface UnifiedSelectProps {
  // Basic props
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onValueChange?: (value: string | string[]) => void; // shadcn compatibility
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  required?: boolean;
  
  // Multiple selection
  multiple?: boolean;
  maxSelections?: number;
  
  // Search functionality
  searchable?: boolean;
  searchPlaceholder?: string;
  noOptionsText?: string;
  
  // UI customization
  label?: string;
  helperText?: string;
  errorText?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  fullWidth?: boolean;
  
  // Custom rendering
  renderOption?: (option: SelectOption) => React.ReactNode;
  renderValue?: (value: string | string[], options: SelectOption[]) => React.ReactNode;
  getOptionLabel?: (option: SelectOption) => string;
  getOptionValue?: (option: SelectOption) => string;
  
  // MUI compatibility props (kept for future use)
  
  // Event handlers
  onOpen?: () => void;
  onClose?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  
  // Styling
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

// 🎨 Helper functions
const getOptionLabel = (option: SelectOption, customGetLabel?: (option: SelectOption) => string): string => {
  return customGetLabel ? customGetLabel(option) : option.label;
};

const getOptionValue = (option: SelectOption, customGetValue?: (option: SelectOption) => string): string => {
  return customGetValue ? customGetValue(option) : option.value;
};

const findOptionByValue = (options: SelectOption[], value: string, customGetValue?: (option: SelectOption) => string): SelectOption | undefined => {
  return options.find(option => getOptionValue(option, customGetValue) === value);
};

// 🎨 Main UnifiedSelect component
export const UnifiedSelect = React.forwardRef<
  HTMLButtonElement,
  UnifiedSelectProps
>(({
  value,
  onChange,
  onValueChange,
  options = [],
  placeholder = 'Vyberte možnosť...',
  disabled = false,
  loading = false,
  error = false,
  required = false,
  multiple = false,
  maxSelections,
  searchable = false,
  searchPlaceholder = 'Hľadať...',
  noOptionsText = 'Žiadne možnosti nenájdené',
  label,
  helperText,
  errorText,
  size = 'default',
  variant = 'outline',
  fullWidth = true,
  renderOption,
  renderValue,
  getOptionLabel: customGetLabel,
  getOptionValue: customGetValue,
  onOpen,
  onClose,
  onFocus,
  onBlur,
  className,
  triggerClassName,
  contentClassName,
  ...props
}, ref) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize value to array for easier handling
  const normalizedValue = useMemo(() => {
    if (value === undefined || value === null || value === '') return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    
    const query = searchQuery.toLowerCase();
    return options.filter(option => {
      const label = getOptionLabel(option, customGetLabel).toLowerCase();
      const value = getOptionValue(option, customGetValue).toLowerCase();
      const description = option.description?.toLowerCase() || '';
      
      return label.includes(query) || value.includes(query) || description.includes(query);
    });
  }, [options, searchQuery, customGetLabel, customGetValue]);

  // Group options by group property
  const groupedOptions = useMemo(() => {
    const groups: Record<string, SelectOption[]> = {};
    const ungrouped: SelectOption[] = [];
    
    filteredOptions.forEach(option => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = [];
        }
        groups[option.group]!.push(option);
      } else {
        ungrouped.push(option);
      }
    });
    
    return { groups, ungrouped };
  }, [filteredOptions]);

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    const option = findOptionByValue(options, optionValue, customGetValue);
    if (!option || option.disabled) return;

    let newValue: string | string[];
    
    if (multiple) {
      const currentValues = normalizedValue;
      const isSelected = currentValues.includes(optionValue);
      
      if (isSelected) {
        // Remove from selection
        newValue = currentValues.filter(v => v !== optionValue);
      } else {
        // Add to selection (check max limit)
        if (maxSelections && currentValues.length >= maxSelections) {
          return; // Don't add if max reached
        }
        newValue = [...currentValues, optionValue];
      }
    } else {
      newValue = optionValue;
      setOpen(false); // Close dropdown for single select
    }

    // Call both handlers for compatibility
    onChange?.(newValue);
    onValueChange?.(newValue);
  };

  // Handle open/close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    setSearchQuery(''); // Reset search when closing
    
    if (newOpen) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  // Get selected options for display
  const selectedOptions = normalizedValue
    .map(val => findOptionByValue(options, val, customGetValue))
    .filter(Boolean) as SelectOption[];

  // Render selected value(s)
  const renderSelectedValue = () => {
    if (renderValue) {
      return renderValue(multiple ? normalizedValue : normalizedValue[0] || '', options);
    }

    if (selectedOptions.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    if (multiple) {
      if (selectedOptions.length === 1) {
        return getOptionLabel(selectedOptions[0]!, customGetLabel);
      }
      return `${selectedOptions.length} vybraných`;
    }

    return selectedOptions[0] ? getOptionLabel(selectedOptions[0], customGetLabel) : '';
  };

  // Render option item
  const renderOptionItem = (option: SelectOption) => {
    if (renderOption) {
      return renderOption(option);
    }

    const optionValue = getOptionValue(option, customGetValue);
    const isSelected = normalizedValue.includes(optionValue);

    return (
      <div className="flex items-center gap-2">
        {option.icon}
        <div className="flex-1">
          <div className="font-medium">{getOptionLabel(option, customGetLabel)}</div>
          {option.description && (
            <div className="text-xs text-muted-foreground">{option.description}</div>
          )}
        </div>
        {multiple && isSelected && (
          <Check className="h-4 w-4 text-primary" />
        )}
      </div>
    );
  };

  // Size variants
  const sizeClasses = {
    sm: 'h-8 text-xs px-2',
    default: 'h-9 text-sm px-3',
    lg: 'h-11 text-base px-4',
  };

  return (
    <div className={cn('relative', fullWidth && 'w-full', className)}>
      {label && (
        <Label className={cn('mb-2 block text-sm font-medium', required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
          {label}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant={variant}
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            onFocus={onFocus}
            onBlur={onBlur}
            className={cn(
              'justify-between font-normal',
              sizeClasses[size],
              fullWidth && 'w-full',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              triggerClassName
            )}
            {...props}
          >
            <div className="flex-1 text-left">
              {renderSelectedValue()}
            </div>
            <div className="flex items-center gap-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className={cn('p-0', contentClassName)}
          style={{ width: 'var(--radix-popover-trigger-width)' }}
          align="start"
        >
          <Command>
            {searchable && (
              <>
                <div className="flex items-center border-b px-3">
                  <UnifiedIcon name="search" className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <CommandInput
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </>
            )}
            
            <CommandList>
              {/* Multiple selection: Show selected items */}
              {multiple && selectedOptions.length > 0 && (
                <>
                  <CommandGroup heading="Vybrané">
                    <div className="flex flex-wrap gap-1 p-2">
                      {selectedOptions.map((option) => (
                        <Badge
                          key={getOptionValue(option, customGetValue)}
                          variant="secondary"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleSelect(getOptionValue(option, customGetValue))}
                        >
                          {getOptionLabel(option, customGetLabel)}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  </CommandGroup>
                  <Separator />
                </>
              )}
              
              {/* Ungrouped options */}
              {groupedOptions.ungrouped.length > 0 && (
                <CommandGroup>
                  {groupedOptions.ungrouped.map((option) => {
                    const optionValue = getOptionValue(option, customGetValue);
                    return (
                      <CommandItem
                        key={optionValue}
                        value={optionValue}
                        disabled={option.disabled ?? false}
                        onSelect={() => handleSelect(optionValue)}
                        className="cursor-pointer"
                      >
                        {renderOptionItem(option)}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              
              {/* Grouped options */}
              {Object.entries(groupedOptions.groups).map(([groupName, groupOptions]) => (
                <CommandGroup key={groupName} heading={groupName}>
                  {groupOptions.map((option) => {
                    const optionValue = getOptionValue(option, customGetValue);
                    return (
                      <CommandItem
                        key={optionValue}
                        value={optionValue}
                        disabled={option.disabled ?? false}
                        onSelect={() => handleSelect(optionValue)}
                        className="cursor-pointer"
                      >
                        {renderOptionItem(option)}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
              
              {/* Empty state */}
              {filteredOptions.length === 0 && (
                <CommandEmpty>{noOptionsText}</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Helper text or error text */}
      {(helperText || errorText) && (
        <div className={cn(
          'mt-1 text-xs',
          error || errorText ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {errorText || helperText}
        </div>
      )}
    </div>
  );
});

UnifiedSelect.displayName = 'UnifiedSelect';

// 🎨 Export convenience components
export const Select = UnifiedSelect;
export const UnifiedSelectField = UnifiedSelect;

// 🎨 Export types
// Export types are already exported above with interface declarations
