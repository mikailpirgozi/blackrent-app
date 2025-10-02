import {
  Search as SearchIcon,
  Filter as FilterListIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';  
import React from 'react';

import type { VehicleCategory } from '../../../types';

interface VehicleFiltersProps {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Filter toggle
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;

  // Filter states
  filterBrand: string;
  setFilterBrand: (brand: string) => void;
  filterModel: string;
  setFilterModel: (model: string) => void;
  filterCompany: string;
  setFilterCompany: (company: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterCategory: VehicleCategory | 'all';
  setFilterCategory: (category: VehicleCategory | 'all') => void;

  // Status checkboxes
  showAvailable: boolean;
  setShowAvailable: (show: boolean) => void;
  showRented: boolean;
  setShowRented: (show: boolean) => void;
  showMaintenance: boolean;
  setShowMaintenance: (show: boolean) => void;
  showOther: boolean;
  setShowOther: (show: boolean) => void;
  showPrivate: boolean;
  setShowPrivate: (show: boolean) => void;
  showRemoved: boolean;
  setShowRemoved: (show: boolean) => void;
  showTempRemoved: boolean;
  setShowTempRemoved: (show: boolean) => void;

  // Data for dropdowns
  uniqueBrands: string[];
  uniqueModels: string[];
  uniqueCompanies: string[];
}

const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  filtersOpen,
  setFiltersOpen,
  filterBrand,
  setFilterBrand,
  filterModel,
  setFilterModel,
  filterCompany,
  setFilterCompany,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  showAvailable,
  setShowAvailable,
  showRented,
  setShowRented,
  showMaintenance,
  setShowMaintenance,
  showOther,
  setShowOther,
  showPrivate,
  setShowPrivate,
  showRemoved,
  setShowRemoved,
  showTempRemoved,
  setShowTempRemoved,
  uniqueBrands,
  uniqueModels,
  uniqueCompanies,
}) => {
  return (
    <Card className="mb-6 shadow-lg">
      <CardContent>
        {/* Search Bar */}
        <div className="flex gap-4 mb-4 items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Hľadať vozidlá..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={filtersOpen ? 'default' : 'outline'}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <FilterListIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <Collapsible open={filtersOpen}>
          <CollapsibleContent>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Značka</Label>
                <Select
                  value={filterBrand}
                  onValueChange={setFilterBrand}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky značky" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky značky</SelectItem>
                    {uniqueBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Select
                  value={filterModel}
                  onValueChange={setFilterModel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky modely" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky modely</SelectItem>
                    {uniqueModels.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Firma</Label>
                <Select
                  value={filterCompany}
                  onValueChange={setFilterCompany}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky firmy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky firmy</SelectItem>
                    {uniqueCompanies.map(company => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={filterStatus}
                  onValueChange={setFilterStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky statusy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky statusy</SelectItem>
                    <SelectItem value="available">Dostupné</SelectItem>
                    <SelectItem value="rented">Prenajaté</SelectItem>
                    <SelectItem value="maintenance">Údržba</SelectItem>
                    <SelectItem value="temporarily_removed">
                      Dočasne vyradené
                    </SelectItem>
                    <SelectItem value="removed">Vyradené</SelectItem>
                    <SelectItem value="transferred">Prepisané</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kategória</Label>
                <Select
                  value={filterCategory}
                  onValueChange={(value) => setFilterCategory(value as VehicleCategory | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky kategórie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky kategórie</SelectItem>
                    <SelectItem value="nizka-trieda">🚗 Nízka trieda</SelectItem>
                    <SelectItem value="stredna-trieda">🚙 Stredná trieda</SelectItem>
                    <SelectItem value="vyssia-stredna">🚘 Vyššia stredná</SelectItem>
                    <SelectItem value="luxusne">💎 Luxusné</SelectItem>
                    <SelectItem value="sportove">🏎️ Športové</SelectItem>
                    <SelectItem value="suv">🚜 SUV</SelectItem>
                    <SelectItem value="viacmiestne">👨‍👩‍👧‍👦 Viacmiestne</SelectItem>
                    <SelectItem value="dodavky">📦 Dodávky</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          {/* Status Checkboxes */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Zobraziť statusy:
            </h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-available"
                  checked={showAvailable}
                  onCheckedChange={setShowAvailable}
                />
                <Label htmlFor="show-available">Dostupné</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-rented"
                  checked={showRented}
                  onCheckedChange={setShowRented}
                />
                <Label htmlFor="show-rented">Prenajaté</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-maintenance"
                  checked={showMaintenance}
                  onCheckedChange={setShowMaintenance}
                />
                <Label htmlFor="show-maintenance">Údržba</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-other"
                  checked={showOther}
                  onCheckedChange={setShowOther}
                />
                <Label htmlFor="show-other">Ostatné</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-private"
                  checked={showPrivate}
                  onCheckedChange={setShowPrivate}
                />
                <Label htmlFor="show-private">🏠 Súkromné</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-removed"
                  checked={showRemoved}
                  onCheckedChange={setShowRemoved}
                />
                <Label htmlFor="show-removed">🗑️ Vyradené</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-temp-removed"
                  checked={showTempRemoved}
                  onCheckedChange={setShowTempRemoved}
                />
                <Label htmlFor="show-temp-removed">⏸️ Dočasne vyradené</Label>
              </div>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default VehicleFilters;
