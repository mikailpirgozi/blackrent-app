import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ChevronDown, User } from 'lucide-react';
import { useState } from 'react';
import type { Customer } from '@/types';

interface CustomerComboboxProps {
  customers: Customer[];
  value: string;
  onChange: (customerId: string) => void;
  label?: string;
}

export function CustomerCombobox({
  customers,
  value,
  onChange,
  label = 'Zákazník *',
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState(customers);

  const selectedCustomer = customers.find(c => c.id === value);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <User className="h-4 w-4" />
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal border-2 hover:border-blue-500"
          >
            {selectedCustomer
              ? selectedCustomer.name || selectedCustomer.email
              : 'Vyberte zákazníka...'}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Hľadať zákazníka podľa mena alebo emailu..."
              className="h-10"
              onValueChange={searchValue => {
                const filtered = customers.filter(c => {
                  const searchLower = searchValue.toLowerCase();
                  const customerText =
                    `${c.name} ${c.email} ${c.phone || ''}`.toLowerCase();
                  return customerText.includes(searchLower);
                });
                setFilteredCustomers(filtered);
              }}
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>Žiadny zákazník nenájdený.</CommandEmpty>
              <CommandGroup>
                {(filteredCustomers.length > 0 ? filteredCustomers : customers)
                  .slice()
                  .sort((a, b) => {
                    const aName = a.name || a.email;
                    const bName = b.name || b.email;
                    return aName.localeCompare(bName, 'sk');
                  })
                  .map(customer => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      onSelect={() => {
                        onChange(customer.id);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col w-full">
                        <span className="font-medium">
                          {customer.name || 'Bez mena'}
                        </span>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            📧 {customer.email}
                          </span>
                          {customer.phone && (
                            <span className="text-xs text-muted-foreground">
                              📱 {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
