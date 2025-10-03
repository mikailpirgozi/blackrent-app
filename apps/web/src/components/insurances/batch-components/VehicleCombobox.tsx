import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
import { ChevronDown, Truck } from 'lucide-react';
import { useState } from 'react';
import type { Vehicle } from '@/types';

interface VehicleComboboxProps {
  vehicles: Vehicle[];
  value: string;
  onChange: (vehicleId: string) => void;
}

export function VehicleCombobox({
  vehicles,
  value,
  onChange,
}: VehicleComboboxProps) {
  const [open, setOpen] = useState(false);
  const [filteredVehicles, setFilteredVehicles] = useState(vehicles);

  const selectedVehicle = vehicles.find(v => v.id === value);

  return (
    <Card className="border-2 border-blue-200 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <Label className="text-lg font-semibold text-slate-900">
              Vozidlo *
            </Label>
            <p className="text-sm text-slate-500">
              Vyber vozidlo pre ktoré chceš pridať dokumenty
            </p>
          </div>
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-12 w-full justify-between font-normal text-base border-2 border-slate-200 hover:border-blue-500"
            >
              {selectedVehicle
                ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.licensePlate})`
                : 'Vyberte vozidlo...'}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-0" align="start" side="bottom">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Hľadať vozidlo podľa značky, modelu alebo ŠPZ..."
                className="h-10"
                onValueChange={searchValue => {
                  const filtered = vehicles.filter(v => {
                    const searchLower = searchValue.toLowerCase();
                    const vehicleText =
                      `${v.brand} ${v.model} ${v.licensePlate} ${v.vin || ''}`.toLowerCase();
                    return vehicleText.includes(searchLower);
                  });
                  setFilteredVehicles(filtered);
                }}
              />
              <CommandList className="max-h-[300px] overflow-y-auto">
                <CommandEmpty>Žiadne vozidlo nenájdené.</CommandEmpty>
                <CommandGroup>
                  {(filteredVehicles.length > 0 ? filteredVehicles : vehicles)
                    .slice()
                    .sort((a, b) => {
                      const aText = `${a.brand} ${a.model} (${a.licensePlate})`;
                      const bText = `${b.brand} ${b.model} (${b.licensePlate})`;
                      return aText.localeCompare(bText, 'sk', {
                        sensitivity: 'base',
                      });
                    })
                    .map(vehicle => (
                      <CommandItem
                        key={vehicle.id}
                        value={vehicle.id}
                        onSelect={() => {
                          onChange(vehicle.id);
                          setOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col w-full">
                          <span className="font-medium">
                            {vehicle.brand} {vehicle.model}
                          </span>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              ŠPZ: {vehicle.licensePlate}
                            </span>
                            {vehicle.vin && (
                              <span className="text-xs text-muted-foreground">
                                VIN: ...{vehicle.vin.slice(-8)}
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
      </CardContent>
    </Card>
  );
}
