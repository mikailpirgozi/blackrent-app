import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption<T = unknown> {
  value: string;
  label: string;
  searchText?: string; // Extra text pre vyhľadávanie (nie je zobrazený)
  data?: T; // Pôvodné dáta
  disabled?: boolean;
  subtitle?: string; // Podnadpis zobrazený pod hlavným textom
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface SearchableSelectProps<T = unknown> {
  value?: string;
  onValueChange: (value: string, option?: SearchableSelectOption<T>) => void;
  options: SearchableSelectOption<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  showAddNew?: boolean;
  onAddNew?: () => void;
  addNewLabel?: string;
  renderOption?: (option: SearchableSelectOption<T>) => React.ReactNode;
  renderValue?: (option: SearchableSelectOption<T>) => React.ReactNode;
  filterFunction?: (option: SearchableSelectOption<T>, searchValue: string) => boolean;
}

export function SearchableSelect<T = unknown>({
  value,
  onValueChange,
  options,
  placeholder = 'Vyberte možnosť...',
  searchPlaceholder = 'Hľadať...',
  emptyMessage = 'Žiadne možnosti nenájdené.',
  label,
  required = false,
  disabled = false,
  error,
  helperText,
  className,
  triggerClassName,
  contentClassName,
  showAddNew = false,
  onAddNew,
  addNewLabel = '+ Pridať nový',
  renderOption,
  renderValue,
  filterFunction,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [filteredOptions, setFilteredOptions] = React.useState<SearchableSelectOption<T>[]>(options);

  const selectedOption = options.find(opt => opt.value === value);

  // Default filter function
  const defaultFilterFunction = (option: SearchableSelectOption<T>, search: string) => {
    const searchLower = search.toLowerCase();
    const searchableText = `${option.label} ${option.searchText || ''} ${option.subtitle || ''}`.toLowerCase();
    return searchableText.includes(searchLower);
  };

  // Filter options when search value changes
  React.useEffect(() => {
    if (!searchValue) {
      setFilteredOptions(options);
      return;
    }

    const filterFn = filterFunction || defaultFilterFunction;
    const filtered = options.filter(opt => filterFn(opt, searchValue));
    setFilteredOptions(filtered);
  }, [searchValue, options, filterFunction]);

  // Reset search when closed
  React.useEffect(() => {
    if (!open) {
      setSearchValue('');
    }
  }, [open]);

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === '__add_new__') {
      onAddNew?.();
      setOpen(false);
      return;
    }

    const option = options.find(opt => opt.value === selectedValue);
    onValueChange(selectedValue, option);
    setOpen(false);
  };

  const renderDefaultOption = (option: SearchableSelectOption<T>) => (
    <div className="flex items-center gap-2 w-full">
      {option.icon}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-medium truncate">{option.label}</span>
        {option.subtitle && (
          <span className="text-xs text-muted-foreground truncate">
            {option.subtitle}
          </span>
        )}
      </div>
      {option.badge}
      {value === option.value && (
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
      )}
    </div>
  );

  const renderDefaultValue = (option: SearchableSelectOption<T>) => (
    <span className="truncate">{option.label}</span>
  );

  return (
    <div className={cn('flex flex-col space-y-2', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive',
              triggerClassName
            )}
          >
            {selectedOption
              ? renderValue?.(selectedOption) || renderDefaultValue(selectedOption)
              : placeholder}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent
          className={cn('w-[500px] p-0', contentClassName)}
          align="start"
          side="bottom"
          onWheel={(e) => e.stopPropagation()}
        >
          <Command shouldFilter={false} className="overflow-visible">
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-10"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            
            <CommandList
              className="max-h-[300px] overflow-y-auto scrollbar-thin"
              style={{
                overflowY: 'auto',
                maxHeight: '300px',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              
              <CommandGroup>
                {showAddNew && onAddNew && (
                  <CommandItem
                    value="__add_new__"
                    onSelect={handleSelect}
                    className="cursor-pointer border-b"
                  >
                    <div className="flex items-center gap-2 w-full py-1">
                      <span className="text-primary font-medium">{addNewLabel}</span>
                    </div>
                  </CommandItem>
                )}
                
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                    disabled={option.disabled}
                    className="cursor-pointer"
                  >
                    {renderOption?.(option) || renderDefaultOption(option)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {(helperText || error) && (
        <p className={cn(
          'text-sm',
          error ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default SearchableSelect;
