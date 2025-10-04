// ✅ FÁZA 3.1: Extracted filters component z ExpenseListNew
import { Search as SearchIcon, Filter as FilterIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExpenseCategory, Vehicle } from '@/types';

interface ExpenseFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string | 'all';
  onCategoryChange: (value: string) => void;
  companyFilter: string;
  onCompanyChange: (value: string) => void;
  vehicleFilter: string;
  onVehicleChange: (value: string) => void;
  categories: ExpenseCategory[];
  companies: string[];
  vehicles: Vehicle[];
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function ExpenseFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  companyFilter,
  onCompanyChange,
  vehicleFilter,
  onVehicleChange,
  categories,
  companies,
  vehicles,
  showFilters,
  onToggleFilters,
}: ExpenseFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Hľadať podľa popisu, poznámky alebo firmy..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={onToggleFilters}
        >
          <FilterIcon className="h-4 w-4 mr-2" />
          Filtre
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="category-filter">Kategória</Label>
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="Všetky kategórie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky kategórie</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Filter */}
          <div className="space-y-2">
            <Label htmlFor="company-filter">Firma</Label>
            <Select value={companyFilter} onValueChange={onCompanyChange}>
              <SelectTrigger id="company-filter">
                <SelectValue placeholder="Všetky firmy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-companies">Všetky firmy</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Filter */}
          <div className="space-y-2">
            <Label htmlFor="vehicle-filter">Vozidlo</Label>
            <Select value={vehicleFilter} onValueChange={onVehicleChange}>
              <SelectTrigger id="vehicle-filter">
                <SelectValue placeholder="Všetky vozidlá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-vehicles">Všetky vozidlá</SelectItem>
                {vehicles.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(categoryFilter !== 'all' || companyFilter || vehicleFilter) && (
            <div className="md:col-span-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onCategoryChange('all');
                  onCompanyChange('');
                  onVehicleChange('');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Vymazať filtre
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
