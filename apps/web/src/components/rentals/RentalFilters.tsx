// Lucide icons (replacing MUI icons)
import {
  ChevronUp as ExpandLessIcon,
  ChevronDown as ExpandMoreIcon,
  Filter as FilterListIcon,
} from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { memo } from 'react';

import type { PaymentMethod, Vehicle } from '../../types';

interface RentalFiltersProps {
  // Basic filters
  filterVehicle: string;
  setFilterVehicle: (value: string) => void;
  filterCompany: string;
  setFilterCompany: (value: string) => void;
  filterCustomer: string;
  setFilterCustomer: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterPaid: string;
  setFilterPaid: (value: string) => void;
  filterDateFrom: string;
  setFilterDateFrom: (value: string) => void;
  filterDateTo: string;
  setFilterDateTo: (value: string) => void;
  filterPaymentMethod: string;
  setFilterPaymentMethod: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;

  // Priority filters
  showActive: boolean;
  setShowActive: (value: boolean) => void;
  showTodayReturns: boolean;
  setShowTodayReturns: (value: boolean) => void;
  showTomorrowReturns: boolean;
  setShowTomorrowReturns: (value: boolean) => void;
  showUnconfirmed: boolean;
  setShowUnconfirmed: (value: boolean) => void;
  showFuture: boolean;
  setShowFuture: (value: boolean) => void;
  showOldConfirmed: boolean;
  setShowOldConfirmed: (value: boolean) => void;
  showConfirmed: boolean;
  setShowConfirmed: (value: boolean) => void;
  showAll: boolean;
  setShowAll: (value: boolean) => void;

  // Data
  vehicles: Vehicle[];
  companies: string[];

  // Mobile
  isMobile: boolean;
  showFiltersMobile: boolean;
  setShowFiltersMobile: (value: boolean) => void;
}

const RentalFilters = memo<RentalFiltersProps>(
  ({
    filterVehicle,
    setFilterVehicle,
    filterCompany,
    setFilterCompany,
    filterCustomer,
    setFilterCustomer,
    filterStatus,
    // setFilterStatus, // TODO: Implement status filter functionality
    filterPaid,
    setFilterPaid,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    filterPaymentMethod,
    setFilterPaymentMethod,
    searchQuery,
    setSearchQuery,
    showActive,
    setShowActive,
    showTodayReturns,
    setShowTodayReturns,
    showTomorrowReturns,
    setShowTomorrowReturns,
    showUnconfirmed,
    setShowUnconfirmed,
    showFuture,
    setShowFuture,
    showOldConfirmed,
    setShowOldConfirmed,
    showConfirmed,
    setShowConfirmed,
    showAll,
    setShowAll,
    vehicles,
    companies,
    isMobile,
    showFiltersMobile,
    setShowFiltersMobile,
  }) => {
    const paymentMethods: { value: PaymentMethod; label: string }[] = [
      { value: 'cash', label: 'Hotovosť' },
      { value: 'bank_transfer', label: 'Bankový prevod' },
      { value: 'vrp', label: 'VRP' },
      { value: 'direct_to_owner', label: 'Priamo majiteľovi' },
    ];

    const activeFiltersCount = [
      filterVehicle,
      filterCompany,
      filterCustomer,
      filterStatus,
      filterPaid,
      filterDateFrom,
      filterDateTo,
      filterPaymentMethod,
      searchQuery,
    ].filter(filter => filter !== '').length;

    return (
      <Card className="mb-4">
        <CardContent>
          {/* Mobile filter toggle */}
          {isMobile && (
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <FilterListIcon className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Filtre</h3>
                {activeFiltersCount > 0 && (
                  <Badge variant="default">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              >
                {showFiltersMobile ? <ExpandLessIcon className="w-4 h-4" /> : <ExpandMoreIcon className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* Priority Filters */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">
              Prioritné filtre
            </h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-all"
                  checked={showAll}
                  onCheckedChange={setShowAll}
                />
                <Label htmlFor="show-all" className="text-sm">Zobraziť všetko</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-active"
                  checked={showActive}
                  onCheckedChange={setShowActive}
                />
                <Label htmlFor="show-active" className="text-sm">Aktívne</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-today-returns"
                  checked={showTodayReturns}
                  onCheckedChange={setShowTodayReturns}
                />
                <Label htmlFor="show-today-returns" className="text-sm">Dnešné vrátenia</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-tomorrow-returns"
                  checked={showTomorrowReturns}
                  onCheckedChange={setShowTomorrowReturns}
                />
                <Label htmlFor="show-tomorrow-returns" className="text-sm">Zajtrajšie vrátenia</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-unconfirmed"
                  checked={showUnconfirmed}
                  onCheckedChange={setShowUnconfirmed}
                />
                <Label htmlFor="show-unconfirmed" className="text-sm">Nepotvrdené</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-future"
                  checked={showFuture}
                  onCheckedChange={setShowFuture}
                />
                <Label htmlFor="show-future" className="text-sm">Budúce</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-old-confirmed"
                  checked={showOldConfirmed}
                  onCheckedChange={setShowOldConfirmed}
                />
                <Label htmlFor="show-old-confirmed" className="text-sm">Staré potvrdené</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-confirmed"
                  checked={showConfirmed}
                  onCheckedChange={setShowConfirmed}
                />
                <Label htmlFor="show-confirmed" className="text-sm">Potvrdené</Label>
              </div>
            </div>
          </div>

          {/* Detailed Filters */}
          <Collapsible open={!isMobile || showFiltersMobile}>
            <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <Label htmlFor="search-query">Vyhľadať</Label>
                <Input
                  id="search-query"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  placeholder="Meno zákazníka, ŠPZ, poznámka..."
                />
              </div>

              {/* Vehicle Filter */}
              <div>
                <Label htmlFor="filter-vehicle">Vozidlo</Label>
                <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky vozidlá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-vehicles">Všetky vozidlá</SelectItem>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Company Filter */}
              <div>
                <Label htmlFor="filter-company">Firma</Label>
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                  <SelectTrigger>
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

              {/* Customer Filter */}
              <div>
                <Label htmlFor="filter-customer">Zákazník</Label>
                <Input
                  id="filter-customer"
                  value={filterCustomer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterCustomer(e.target.value)}
                />
              </div>

              {/* Payment Method Filter */}
              <div>
                <Label htmlFor="filter-payment-method">Spôsob platby</Label>
                <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-payment-methods">Všetky</SelectItem>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Paid Status Filter */}
              <div>
                <Label htmlFor="filter-paid">Stav platby</Label>
                <Select value={filterPaid} onValueChange={setFilterPaid}>
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-payment-statuses">Všetky</SelectItem>
                    <SelectItem value="paid">Zaplatené</SelectItem>
                    <SelectItem value="unpaid">Nezaplatené</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <Label htmlFor="filter-date-from">Dátum od</Label>
                <Input
                  id="filter-date-from"
                  type="date"
                  value={filterDateFrom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterDateFrom(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <Label htmlFor="filter-date-to">Dátum do</Label>
                <Input
                  id="filter-date-to"
                  type="date"
                  value={filterDateTo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    );
  }
);

RentalFilters.displayName = 'RentalFilters';

export default RentalFilters;
