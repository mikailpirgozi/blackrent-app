// Lucide icons (replacing MUI icons)
import {
  Calendar as CalendarIcon,
  Car as CarIcon,
  X as ClearIcon,
  Euro as EuroIcon,
  Filter as FilterListIcon,
  CreditCard as PaymentIcon,
  User as PersonIcon,
  FileText as ProtocolIcon,
  Save as SaveIcon,
} from 'lucide-react';

// shadcn/ui components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react';

export interface FilterState {
  // Základné filtre
  status: string;
  paymentMethod: string;
  company: string;
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
  protocolStatus: string;

  // Rozšírené filtre
  customerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  licensePlate: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  insuranceCompany: string;
  insuranceType: string;

  // Časové filtre
  timeFilter: string; // 'all', 'today', 'week', 'month', 'quarter', 'year', 'custom'

  // Cenové filtre
  priceRange: string; // 'all', 'low', 'medium', 'high', 'custom'

  // Stav platby
  paymentStatus: string; // 'all', 'paid', 'unpaid', 'partial'

  // Zobrazenie
  showOnlyActive: boolean;
  showOnlyOverdue: boolean;
  showOnlyCompleted: boolean;
}

interface RentalAdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset?: () => void;
  onSavePreset?: () => void;
  availableStatuses?: string[];
  availableCompanies?: string[];
  availablePaymentMethods?: string[];
  availableVehicleBrands?: string[];
  availableInsuranceCompanies?: string[];
  availableInsuranceTypes?: string[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const RentalAdvancedFilters: React.FC<RentalAdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset = () => {},
  onSavePreset = () => {},
  availableStatuses = [],
  availableCompanies = [],
  availablePaymentMethods = [],
  availableVehicleBrands = [],
  availableInsuranceCompanies = [],
  availableInsuranceTypes = [],
}) => {
  const handleFilterChange = (key: keyof FilterState, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleQuickFilter = (type: string) => {
    switch (type) {
      case 'today': {
        const today = new Date().toISOString().split('T')[0];
        handleFilterChange('timeFilter', 'today');
        handleFilterChange('dateFrom', today);
        handleFilterChange('dateTo', today);
        break;
      }
      case 'week': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        handleFilterChange('timeFilter', 'week');
        handleFilterChange('dateFrom', weekAgo.toISOString().split('T')[0]);
        handleFilterChange('dateTo', new Date().toISOString().split('T')[0]);
        break;
      }
      case 'month': {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        handleFilterChange('timeFilter', 'month');
        handleFilterChange('dateFrom', monthAgo.toISOString().split('T')[0]);
        handleFilterChange('dateTo', new Date().toISOString().split('T')[0]);
        break;
      }
      case 'active':
        handleFilterChange('showOnlyActive', true);
        handleFilterChange('showOnlyOverdue', false);
        handleFilterChange('showOnlyCompleted', false);
        break;
      case 'overdue':
        handleFilterChange('showOnlyActive', false);
        handleFilterChange('showOnlyOverdue', true);
        handleFilterChange('showOnlyCompleted', false);
        break;
      case 'completed':
        handleFilterChange('showOnlyActive', false);
        handleFilterChange('showOnlyOverdue', false);
        handleFilterChange('showOnlyCompleted', true);
        break;
    }
  };

  return (
    <div className="bg-background border rounded-lg p-4 md:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4 sm:gap-0">
        <h3 className="flex items-center gap-2 text-lg md:text-xl font-semibold">
          <FilterListIcon className="w-5 h-5 text-primary" />
          Rozšírené filtre
        </h3>
        <div className="flex gap-2 justify-center sm:justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={onSavePreset}>
                  <SaveIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Uložiť preset</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={onReset}>
                  <ClearIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vymazať všetky filtre</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Rýchle filtre */}
      <div className="mb-6">
        <h4 className="text-sm md:text-base font-semibold mb-4">
          Rýchle filtre
        </h4>
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <Badge
            variant={filters.timeFilter === 'today' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/10"
            onClick={() => handleQuickFilter('today')}
          >
            Dnes
          </Badge>
          <Badge
            variant={filters.timeFilter === 'week' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/10"
            onClick={() => handleQuickFilter('week')}
          >
            Posledný týždeň
          </Badge>
          <Badge
            variant={filters.timeFilter === 'month' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/10"
            onClick={() => handleQuickFilter('month')}
          >
            Posledný mesiac
          </Badge>
          <Badge
            variant={filters.showOnlyActive ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/10"
            onClick={() => handleQuickFilter('active')}
          >
            Aktívne
          </Badge>
          <Badge
            variant={filters.showOnlyOverdue ? 'destructive' : 'outline'}
            className="cursor-pointer hover:bg-destructive/10"
            onClick={() => handleQuickFilter('overdue')}
          >
            Po termíne
          </Badge>
          <Badge
            variant={filters.showOnlyCompleted ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/10"
            onClick={() => handleQuickFilter('completed')}
          >
            Dokončené
          </Badge>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Rozšírené filtre v accordionoch */}
      <Accordion type="single" collapsible defaultValue="basic-info" className="space-y-4">
        {/* Základné informácie */}
        <AccordionItem value="basic-info">
          <AccordionTrigger className="text-base font-medium">
            <div className="flex items-center gap-2">
              <PersonIcon className="w-4 h-4" />
              Základné informácie
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filter-status">Stav prenájmu</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky stavy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky stavy</SelectItem>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-payment-method">Spôsob platby</Label>
                <Select value={filters.paymentMethod} onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky spôsoby" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky spôsoby</SelectItem>
                    {availablePaymentMethods.map(method => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-company">Firma/požičovňa</Label>
                <Select value={filters.company} onValueChange={(value) => handleFilterChange('company', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky firmy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky firmy</SelectItem>
                    {availableCompanies.map(company => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-protocol-status">Stav protokolov</Label>
                <Select value={filters.protocolStatus} onValueChange={(value) => handleFilterChange('protocolStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky</SelectItem>
                    <SelectItem value="handover">Len preberací</SelectItem>
                    <SelectItem value="return">Len vrátenie</SelectItem>
                    <SelectItem value="both">Oba protokoly</SelectItem>
                    <SelectItem value="none">Bez protokolov</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

          {/* Časové filtre */}
          <AccordionItem value="time-filters">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Časové filtre
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter-date-from">Dátum od</Label>
                  <Input
                    id="filter-date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filter-date-to">Dátum do</Label>
                  <Input
                    id="filter-date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Cenové filtre */}
          <AccordionItem value="price-filters">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <EuroIcon className="w-4 h-4" />
                Cenové filtre
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter-price-min">Minimálna cena (€)</Label>
                  <div className="relative">
                    <EuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="filter-price-min"
                      type="number"
                      className="pl-10"
                      value={filters.priceMin}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('priceMin', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="filter-price-max">Maximálna cena (€)</Label>
                  <div className="relative">
                    <EuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="filter-price-max"
                      type="number"
                      className="pl-10"
                      value={filters.priceMax}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('priceMax', e.target.value)}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="filter-price-range">Cenový rozsah</Label>
                  <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange('priceRange', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky ceny" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všetky ceny</SelectItem>
                      <SelectItem value="low">Nízke (0-50€)</SelectItem>
                      <SelectItem value="medium">Stredné (50-200€)</SelectItem>
                      <SelectItem value="high">Vysoké (200€+)</SelectItem>
                      <SelectItem value="custom">Vlastný rozsah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Informácie o zákazníkovi */}
          <AccordionItem value="customer-info">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <PersonIcon className="w-4 h-4" />
                Zákazník
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter-customer-name">Meno zákazníka</Label>
                  <Input
                    id="filter-customer-name"
                    value={filters.customerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('customerName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filter-customer-email">Email zákazníka</Label>
                  <Input
                    id="filter-customer-email"
                    type="email"
                    value={filters.customerEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('customerEmail', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filter-customer-phone">Telefón zákazníka</Label>
                  <Input
                    id="filter-customer-phone"
                    type="tel"
                    value={filters.customerPhone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('customerPhone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filter-customer-company">Firma zákazníka</Label>
                  <Input
                    id="filter-customer-company"
                    value={filters.customerCompany}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('customerCompany', e.target.value)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Informácie o vozidle */}
          <AccordionItem value="vehicle-info">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <CarIcon className="w-4 h-4" />
                Vozidlo
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter-vehicle-brand">Značka vozidla</Label>
                  <Select value={filters.vehicleBrand} onValueChange={(value) => handleFilterChange('vehicleBrand', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky značky" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všetky značky</SelectItem>
                      {availableVehicleBrands.map(brand => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-vehicle-model">Model vozidla</Label>
                  <Input
                    id="filter-vehicle-model"
                    value={filters.vehicleModel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('vehicleModel', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="filter-license-plate">ŠPZ</Label>
                  <Input
                    id="filter-license-plate"
                    value={filters.licensePlate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFilterChange('licensePlate', e.target.value)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Poistka */}
          <AccordionItem value="insurance-info">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <ProtocolIcon className="w-4 h-4" />
                Poistka
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter-insurance-company">Poisťovňa</Label>
                  <Select value={filters.insuranceCompany} onValueChange={(value) => handleFilterChange('insuranceCompany', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky poisťovne" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všetky poisťovne</SelectItem>
                      {availableInsuranceCompanies.map(company => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-insurance-type">Typ poistky</Label>
                  <Select value={filters.insuranceType} onValueChange={(value) => handleFilterChange('insuranceType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky typy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všetky typy</SelectItem>
                      {availableInsuranceTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Stav platby */}
          <AccordionItem value="payment-status">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2">
                <PaymentIcon className="w-4 h-4" />
                Stav platby
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div>
                <Label htmlFor="filter-payment-status">Stav platby</Label>
                <Select value={filters.paymentStatus} onValueChange={(value) => handleFilterChange('paymentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky stavy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všetky stavy</SelectItem>
                    <SelectItem value="paid">Uhradené</SelectItem>
                    <SelectItem value="unpaid">Neuhradené</SelectItem>
                    <SelectItem value="partial">Čiastočne uhradené</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>
      </Accordion>
    </div>
  );
};

export default RentalAdvancedFilters;
