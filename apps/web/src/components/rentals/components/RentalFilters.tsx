import {
  Filter,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';

// Types - PRESNE TIE ISTÉ ako v RentalListNew.tsx
interface FilterState {
  // Základné filtre - arrays pre multi-select
  status: string[];
  paymentMethod: string[];
  company: string[];
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
  protocolStatus: string[];

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
  timeFilter: string;

  // Cenové filtre
  priceRange: string;

  // Stav platby
  paymentStatus: string;

  // Zobrazenie
  showOnlyActive: boolean;
  showOnlyOverdue: boolean;
  showOnlyCompleted: boolean;

  // Zoradenie
  sortBy: 'created_at' | 'start_date' | 'end_date';
  sortOrder: 'asc' | 'desc';
}

interface RentalFiltersProps {
  // Search state
  searchQuery: string;
  setSearchQuery: (value: string) => void;

  // Filter visibility
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;

  // Advanced filters
  advancedFilters: FilterState;
  handleAdvancedFiltersChange: (filters: FilterState) => void;

  // Helper functions
  toggleFilterValue: (filterKey: keyof FilterState, value: string) => void;
  isFilterValueSelected: (
    filterKey: keyof FilterState,
    value: string
  ) => boolean;
  resetAllFilters: () => void;

  // Unique values for dropdowns
  uniquePaymentMethods: string[];
  uniqueCompanies: string[];
  uniqueStatuses: string[];
  uniqueVehicleBrands: string[];
  uniqueInsuranceCompanies: string[];
  uniqueInsuranceTypes: string[];

  // Filtered rentals count
  filteredRentalsCount: number;
  totalRentalsCount: number;

  // Mobile filters
  showFiltersMobile: boolean;
  setShowFiltersMobile: () => void;
}

export const RentalFilters: React.FC<RentalFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  advancedFilters,
  handleAdvancedFiltersChange,
  toggleFilterValue,
  isFilterValueSelected,
  resetAllFilters,
  uniquePaymentMethods,
  uniqueCompanies,
  uniqueStatuses,
  // uniqueVehicleBrands, // TODO: Implement vehicle brand filtering
  filteredRentalsCount,
  totalRentalsCount,
}) => {
  return (
    <Card className="mb-6 mx-1 md:mx-0 bg-background shadow-lg border">
      <CardContent className="p-4 md:p-6">
        {/* Hlavný riadok s vyhľadávaním a tlačidlami */}
        <div className="space-y-3">
          {/* Prvý riadok: Search a tlačidlá Filtre/Reset */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hľadať prenájmy..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 hover:bg-muted/70 focus:bg-background transition-all duration-300 hover:-translate-y-0.5 focus:-translate-y-1 hover:shadow-md focus:shadow-lg"
                />
              </div>
            </div>

            {/* Tlačidlá Filtre a Reset */}
            <div className="flex gap-2 shrink-0">
              {/* 🚀 FILTRE TLAČIDLO - viditeľné s textom */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
                variant={showFilters ? 'default' : 'outline'}
                className="h-10 px-4 rounded-lg border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="font-medium">Filtre</span>
              </Button>

              {/* Reset Button */}
              <Button
                variant="outline"
                onClick={resetAllFilters}
                size="sm"
                className="h-10 px-4 rounded-lg font-medium transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive hover:-translate-y-0.5 hover:shadow-md"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Druhý riadok: Sorting controls */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="min-w-[160px] flex-1 sm:flex-initial">
              <Label className="text-xs text-muted-foreground mb-1 block">Zoradiť podľa</Label>
              <Select
                value={advancedFilters.sortBy}
                onValueChange={(value) =>
                  handleAdvancedFiltersChange({
                    ...advancedFilters,
                    sortBy: value as 'created_at' | 'start_date' | 'end_date',
                  })
                }
              >
                <SelectTrigger className="h-10 rounded-lg bg-muted/50 hover:bg-muted/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Dátumu vytvorenia</SelectItem>
                  <SelectItem value="start_date">Dátumu začiatku</SelectItem>
                  <SelectItem value="end_date">Dátumu konca</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[120px] flex-1 sm:flex-initial">
              <Label className="text-xs text-muted-foreground mb-1 block">Poradie</Label>
              <Select
                value={advancedFilters.sortOrder}
                onValueChange={(value) =>
                  handleAdvancedFiltersChange({
                    ...advancedFilters,
                    sortOrder: value as 'asc' | 'desc',
                  })
                }
              >
                <SelectTrigger className="h-10 rounded-lg bg-muted/50 hover:bg-muted/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">
                    {advancedFilters.sortBy === 'created_at'
                      ? 'Najnovšie'
                      : 'Zostupne'}
                  </SelectItem>
                  <SelectItem value="asc">
                    {advancedFilters.sortBy === 'created_at'
                      ? 'Najstaršie'
                      : 'Vzostupne'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Search results info */}
        {(searchQuery ||
          (Array.isArray(advancedFilters.status) &&
            advancedFilters.status.length > 0) ||
          (Array.isArray(advancedFilters.paymentMethod) &&
            advancedFilters.paymentMethod.length > 0) ||
          (Array.isArray(advancedFilters.company) &&
            advancedFilters.company.length > 0) ||
          advancedFilters.dateFrom ||
          advancedFilters.dateTo ||
          advancedFilters.priceMin ||
          advancedFilters.priceMax ||
          (Array.isArray(advancedFilters.protocolStatus) &&
            advancedFilters.protocolStatus.length > 0)) && (
          <p className="text-sm text-muted-foreground mb-4">
            Zobrazených: {filteredRentalsCount} z {totalRentalsCount} prenájmov
          </p>
        )}

        {/* 🚀 RÝCHLE FILTRE - len tie najdôležitejšie */}
        <div className="flex gap-2 flex-wrap mb-4 items-center">
          <span className="text-xs text-muted-foreground mr-2">
            Rýchle filtre:
            {/* Počet označených filtrov */}
            {(() => {
              const totalSelected =
                (Array.isArray(advancedFilters.paymentMethod)
                  ? advancedFilters.paymentMethod.length
                  : 0) +
                (Array.isArray(advancedFilters.status)
                  ? advancedFilters.status.length
                  : 0) +
                (Array.isArray(advancedFilters.protocolStatus)
                  ? advancedFilters.protocolStatus.length
                  : 0);
              return totalSelected > 0 ? (
                <Badge
                  variant="default"
                  className="ml-2 h-5 text-xs font-bold"
                >
                  {totalSelected}
                </Badge>
              ) : null;
            })()}
          </span>

          {/* Spôsob platby */}
          {uniquePaymentMethods.slice(0, 3).map(method => {
            const getPaymentMethodLabel = (method: string) => {
              switch (method) {
                case 'cash':
                  return 'Hotovosť';
                case 'bank_transfer':
                  return 'Bankový prevod';
                case 'direct_to_owner':
                  return 'Priamo majiteľovi';
                case 'card':
                  return 'Kartou';
                case 'crypto':
                  return 'Kryptomeny';
                default:
                  return method;
              }
            };

            return (
              <Badge
                key={method}
                variant={
                  isFilterValueSelected('paymentMethod', method)
                    ? 'default'
                    : 'outline'
                }
                className={`cursor-pointer rounded-lg hover:-translate-y-0.5 transition-all duration-200 ${
                  isFilterValueSelected('paymentMethod', method)
                    ? 'font-bold shadow-md border-2 border-primary'
                    : ''
                }`}
                onClick={() => toggleFilterValue('paymentMethod', method)}
              >
                {getPaymentMethodLabel(method)}
              </Badge>
            );
          })}

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Stav prenájmu */}
          <Badge
            variant={
              isFilterValueSelected('status', 'active') ? 'default' : 'outline'
            }
            className={`cursor-pointer rounded-lg hover:-translate-y-0.5 transition-all duration-200 ${
              isFilterValueSelected('status', 'active')
                ? 'font-bold shadow-md border-2 border-green-500 bg-green-500 text-white'
                : ''
            }`}
            onClick={() => toggleFilterValue('status', 'active')}
          >
            Aktívne
          </Badge>
          <Badge
            variant={
              isFilterValueSelected('status', 'pending') ? 'default' : 'outline'
            }
            className={`cursor-pointer rounded-lg hover:-translate-y-0.5 transition-all duration-200 ${
              isFilterValueSelected('status', 'pending')
                ? 'font-bold shadow-md border-2 border-yellow-500 bg-yellow-500 text-white'
                : ''
            }`}
            onClick={() => toggleFilterValue('status', 'pending')}
          >
            Čakajúci
          </Badge>
          <Badge
            variant={
              isFilterValueSelected('status', 'completed') ? 'default' : 'outline'
            }
            className={`cursor-pointer rounded-lg hover:-translate-y-0.5 transition-all duration-200 ${
              isFilterValueSelected('status', 'completed')
                ? 'font-bold shadow-md border-2 border-blue-500 bg-blue-500 text-white'
                : ''
            }`}
            onClick={() => toggleFilterValue('status', 'completed')}
          >
            Ukončené
          </Badge>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Platobné filtre */}
          <Badge
            variant={
              isFilterValueSelected('paymentStatus', 'paid') ? 'default' : 'outline'
            }
            className={`cursor-pointer rounded-lg hover:-translate-y-0.5 transition-all duration-200 ${
              isFilterValueSelected('paymentStatus', 'paid')
                ? 'font-bold shadow-md border-2 border-green-500 bg-green-500 text-white'
                : ''
            }`}
            onClick={() => toggleFilterValue('paymentStatus', 'paid')}
          >
            Zaplatené
          </Badge>
          <Badge
            variant={
              isFilterValueSelected('paymentStatus', 'unpaid') ? 'default' : 'outline'
            }
            className={`cursor-pointer rounded-lg hover:-translate-y-0.5 transition-all duration-200 ${
              isFilterValueSelected('paymentStatus', 'unpaid')
                ? 'font-bold shadow-md border-2 border-red-500 bg-red-500 text-white'
                : ''
            }`}
            onClick={() => toggleFilterValue('paymentStatus', 'unpaid')}
          >
            Nezaplatené
          </Badge>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Stavy protokolov */}
          <Badge
            variant={
              isFilterValueSelected('protocolStatus', 'none') ? 'default' : 'outline'
            }
            className={`cursor-pointer rounded-lg hover:-translate-y-0.5 transition-all duration-200 ${
              isFilterValueSelected('protocolStatus', 'none')
                ? 'font-bold shadow-md border-2 border-yellow-500 bg-yellow-500 text-white'
                : ''
            }`}
            onClick={() => toggleFilterValue('protocolStatus', 'none')}
          >
            Bez protokolu
          </Badge>
          <Badge
            variant={
              isFilterValueSelected('protocolStatus', 'with_handover') ? 'default' : 'outline'
            }
            className={`cursor-pointer rounded-lg hover:-translate-y-0.5 transition-all duration-200 ${
              isFilterValueSelected('protocolStatus', 'with_handover')
                ? 'font-bold shadow-md border-2 border-green-500 bg-green-500 text-white'
                : ''
            }`}
            onClick={() => toggleFilterValue('protocolStatus', 'with_handover')}
          >
            S protokolom
          </Badge>
        </div>

        {/* Pokročilé filtre */}
        <Collapsible open={showFilters}>
          <CollapsibleContent>
            <Separator className="my-4" />
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtre
              </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Spôsob platby */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Spôsob platby</Label>
                <div className="space-y-2">
                  {/* Selected payment methods display */}
                  {Array.isArray(advancedFilters.paymentMethod) && advancedFilters.paymentMethod.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {advancedFilters.paymentMethod.map(value => {
                        const getPaymentMethodLabel = (method: string) => {
                          switch (method) {
                            case 'cash':
                              return 'Hotovosť';
                            case 'bank_transfer':
                              return 'Bankový prevod';
                            case 'direct_to_owner':
                              return 'Priamo majiteľovi';
                            case 'card':
                              return 'Kartou';
                            case 'crypto':
                              return 'Kryptomeny';
                            default:
                              return method;
                          }
                        };
                        return (
                          <Badge
                            key={value}
                            variant="secondary"
                            className="text-xs"
                          >
                            {getPaymentMethodLabel(value)}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Multi-select checkboxes */}
                  <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                    {uniquePaymentMethods.map(method => {
                      const getPaymentMethodLabel = (method: string) => {
                        switch (method) {
                          case 'cash':
                            return 'Hotovosť';
                          case 'bank_transfer':
                            return 'Bankový prevod';
                          case 'direct_to_owner':
                            return 'Priamo majiteľovi';
                          case 'card':
                            return 'Kartou';
                          case 'crypto':
                            return 'Kryptomeny';
                          default:
                            return method;
                        }
                      };
                      
                      const isSelected = Array.isArray(advancedFilters.paymentMethod) && 
                        advancedFilters.paymentMethod.includes(method);
                      
                      return (
                        <div key={method} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`payment-${method}`}
                            checked={isSelected}
                            onChange={() => {
                              const currentMethods = Array.isArray(advancedFilters.paymentMethod) 
                                ? advancedFilters.paymentMethod 
                                : [];
                              
                              const newMethods = isSelected
                                ? currentMethods.filter(m => m !== method)
                                : [...currentMethods, method];
                              
                              handleAdvancedFiltersChange({
                                ...advancedFilters,
                                paymentMethod: newMethods,
                              });
                            }}
                            className="rounded border-gray-300"
                          />
                          <Label 
                            htmlFor={`payment-${method}`}
                            className="text-sm cursor-pointer"
                          >
                            {getPaymentMethodLabel(method)}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Firma */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Firma</Label>
                <div className="space-y-2">
                  {/* Selected companies display */}
                  {Array.isArray(advancedFilters.company) && advancedFilters.company.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {advancedFilters.company.map(value => (
                        <Badge
                          key={value}
                          variant="secondary"
                          className="text-xs"
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Multi-select checkboxes */}
                  <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                    {uniqueCompanies.map(company => {
                      const isSelected = Array.isArray(advancedFilters.company) && 
                        advancedFilters.company.includes(company);
                      
                      return (
                        <div key={company} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`company-${company}`}
                            checked={isSelected}
                            onChange={() => {
                              const currentCompanies = Array.isArray(advancedFilters.company) 
                                ? advancedFilters.company 
                                : [];
                              
                              const newCompanies = isSelected
                                ? currentCompanies.filter(c => c !== company)
                                : [...currentCompanies, company];
                              
                              handleAdvancedFiltersChange({
                                ...advancedFilters,
                                company: newCompanies,
                              });
                            }}
                            className="rounded border-gray-300"
                          />
                          <Label 
                            htmlFor={`company-${company}`}
                            className="text-sm cursor-pointer"
                          >
                            {company}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stav prenájmu */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Stav prenájmu</Label>
                <div className="space-y-2">
                  {/* Selected statuses display */}
                  {Array.isArray(advancedFilters.status) && advancedFilters.status.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {advancedFilters.status.map(value => (
                        <Badge
                          key={value}
                          variant="secondary"
                          className="text-xs"
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Multi-select checkboxes */}
                  <div className="space-y-1 max-h-32 overflow-y-auto border rounded-md p-2">
                    {uniqueStatuses.map(status => {
                      const isSelected = Array.isArray(advancedFilters.status) && 
                        advancedFilters.status.includes(status);
                      
                      return (
                        <div key={status} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`status-${status}`}
                            checked={isSelected}
                            onChange={() => {
                              const currentStatuses = Array.isArray(advancedFilters.status) 
                                ? advancedFilters.status 
                                : [];
                              
                              const newStatuses = isSelected
                                ? currentStatuses.filter(s => s !== status)
                                : [...currentStatuses, status];
                              
                              handleAdvancedFiltersChange({
                                ...advancedFilters,
                                status: newStatuses,
                              });
                            }}
                            className="rounded border-gray-300"
                          />
                          <Label 
                            htmlFor={`status-${status}`}
                            className="text-sm cursor-pointer"
                          >
                            {status}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dátum od */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Dátum od</Label>
                <Input
                  type="date"
                  value={advancedFilters.dateFrom || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleAdvancedFiltersChange({
                      ...advancedFilters,
                      dateFrom: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Dátum do */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Dátum do</Label>
                <Input
                  type="date"
                  value={advancedFilters.dateTo || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleAdvancedFiltersChange({
                      ...advancedFilters,
                      dateTo: e.target.value,
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
