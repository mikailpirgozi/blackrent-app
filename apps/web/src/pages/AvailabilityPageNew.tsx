import {
  X as ClearIcon,
  Filter as FilterListIcon,
  RefreshCw as RefreshIcon,
  Search as SearchIcon,
  Calendar as TodayIcon,
} from 'lucide-react';
import { UnifiedButton as Button } from '@/components/ui/UnifiedButton';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { UnifiedBadge as Badge } from '@/components/ui/UnifiedBadge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { UnifiedTypography } from '@/components/ui/UnifiedTypography';
import React, { useState } from 'react';

import AddUnavailabilityModal from '../components/availability/AddUnavailabilityModal';
import AvailabilityCalendar from '../components/availability/AvailabilityCalendar';
// import { useApp } from '../context/AppContext'; // Migrated to React Query
import { useVehicles } from '../lib/react-query/hooks/useVehicles';
import type { Vehicle, VehicleCategory } from '../types';
// 🔄 PHASE 4: Migrated to React Query

const AvailabilityPageNew: React.FC = () => {
  const { data: vehicles = [] } = useVehicles();
  
  // Custom responsive logic
  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [availableFromDate, setAvailableFromDate] = useState('');
  const [availableToDate, setAvailableToDate] = useState('');
  // 🚗 MULTI-SELECT CATEGORY FILTER: Array of selected categories
  const [selectedCategories, setSelectedCategories] = useState<
    VehicleCategory[]
  >([]);

  // 🚫 UNAVAILABILITY MODAL STATE
  const [unavailabilityModalOpen, setUnavailabilityModalOpen] = useState(false);

  // Use React Query vehicles
  const allVehicles = vehicles;

  // Get unique companies for filter
  const uniqueCompanies = [
    ...new Set(allVehicles.map((v: Vehicle) => v.company)),
  ].sort();

  // 🚗 VEHICLE CATEGORIES with emoji icons
  const vehicleCategories: {
    value: VehicleCategory;
    label: string;
    emoji: string;
  }[] = [
    { value: 'nizka-trieda', label: 'Nízka trieda', emoji: '🚗' },
    { value: 'stredna-trieda', label: 'Stredná trieda', emoji: '🚙' },
    { value: 'vyssia-stredna', label: 'Vyššia stredná trieda', emoji: '🚘' },
    { value: 'luxusne', label: 'Luxusné vozidlá', emoji: '💎' },
    { value: 'sportove', label: 'Športové vozidlá', emoji: '🏎️' },
    { value: 'suv', label: 'SUV', emoji: '🚜' },
    { value: 'viacmiestne', label: 'Viacmiestne vozidlá', emoji: '👨‍👩‍👧‍👦' },
    { value: 'dodavky', label: 'Dodávky', emoji: '📦' },
  ];

  // Handle category selection - adapted for shadcn Select
  const handleCategoryChange = (value: string) => {
    const category = value as VehicleCategory;
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Clear all category filters
  const clearCategoryFilters = () => {
    setSelectedCategories([]);
  };

  const handleRefresh = () => {
    // Trigger calendar refresh
    window.location.reload();
  };

  const handleUnavailabilitySuccess = () => {
    // 🔄 PHASE 2: Cache invalidation removed - React Query handles cache automatically

    // Force calendar refresh by triggering a re-render
    // Use a small delay to ensure cache invalidation is processed
    window.setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  const handleTodayClick = () => {
    // Scroll to today in calendar
    const todayElement = document.querySelector('[data-today="true"]');
    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className={`p-${isMobile ? '2' : '6'}`}>
      {/* Header */}
      <div
        className={`flex justify-between items-center mb-6 ${
          isMobile ? 'flex-col gap-4' : 'flex-row'
        }`}
      >
        <div>
          <UnifiedTypography
            variant="h4"
            className={`font-bold text-blue-600 ${
              isMobile ? 'text-2xl' : 'text-4xl'
            } mb-1`}
          >
            📅 Dostupnosť vozidiel
          </UnifiedTypography>
          <UnifiedTypography variant="body2" className="text-gray-600">
            Kalendárny prehľad dostupnosti všetkých vozidiel v systéme
          </UnifiedTypography>
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button
            variant="destructive"
            onClick={() => setUnavailabilityModalOpen(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <ClearIcon className="h-4 w-4" />
            Pridať nedostupnosť
          </Button>
          <Button
            variant="outline"
            onClick={handleTodayClick}
            size="sm"
            className="flex items-center gap-2"
          >
            <TodayIcon className="h-4 w-4" />
            Dnes
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshIcon className="h-4 w-4" />
            Obnoviť
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-3 shadow-lg">
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="flex gap-2 mb-2 items-center">
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
              onClick={() => setFiltersOpen(!filtersOpen)}
              variant={filtersOpen ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <FilterListIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          <Collapsible open={filtersOpen}>
            <CollapsibleContent>
              <Separator className="mb-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-select">Firma</Label>
                  <Select
                    value={selectedCompany}
                    onValueChange={setSelectedCompany}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky firmy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-companies">Všetky firmy</SelectItem>
                      {uniqueCompanies.map((company: string | undefined) => (
                        <SelectItem key={company} value={company || "no-company"}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-select">Kategória vozidla</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {selectedCategories.map(category => {
                        const categoryInfo = vehicleCategories.find(
                          cat => cat.value === category
                        );
                        return (
                          <Badge
                            key={category}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {categoryInfo?.emoji} {categoryInfo?.label}
                          </Badge>
                        );
                      })}
                    </div>
                    <Select
                      value=""
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vybrať kategórie..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleCategories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedCategories.includes(category.value)}
                              />
                              <span>{category.emoji} {category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCategories.length > 0 && (
                      <Button
                        size="sm"
                        onClick={clearCategoryFilters}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ClearIcon className="h-4 w-4" />
                        Vymazať všetky
                      </Button>
                    )}
                  </div>
                </div>

              {/* Date Range Filtre */}
              <div className="col-span-full">
                <Separator className="my-4" />
                <UnifiedTypography
                  variant="h6"
                  className="mb-4 font-semibold text-blue-600"
                >
                  📅 Filtrovanie podľa dátumu dostupnosti
                </UnifiedTypography>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-date">Dostupné od dátumu</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={availableFromDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAvailableFromDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-date">Dostupné do dátumu</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={availableToDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAvailableToDate(e.target.value)}
                />
              </div>
              {availableFromDate && availableToDate && (
                <div className="col-span-full">
                  <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg flex justify-between items-start">
                    <div className="flex-1">
                      <UnifiedTypography
                        variant="body2"
                        className="text-blue-700 font-medium"
                      >
                        ℹ️ Zobrazujú sa len vozidlá dostupné v období{' '}
                        {availableFromDate} - {availableToDate}
                        <br />
                        <span className="text-sm">
                          Zahŕňa: dostupné vozidlá + flexibilné prenájmy (ktoré
                          možno prepísať)
                        </span>
                      </UnifiedTypography>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setAvailableFromDate('');
                        setAvailableToDate('');
                      }}
                      variant="outline"
                      className="ml-2 min-w-0"
                    >
                      ✕ Zrušiť
                    </Button>
                  </div>
                </div>
              )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
          <CardContent className="text-center py-4">
            <UnifiedTypography
              variant="h4"
              className="font-bold mb-1"
            >
              {
                allVehicles.filter((v: Vehicle) => v.status === 'available')
                  .length
              }
            </UnifiedTypography>
            <UnifiedTypography variant="body2" className="opacity-90">
              Dostupné vozidlá
            </UnifiedTypography>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
          <CardContent className="text-center py-4">
            <UnifiedTypography
              variant="h4"
              className="font-bold mb-1"
            >
              {
                allVehicles.filter((v: Vehicle) => v.status === 'rented')
                  .length
              }
            </UnifiedTypography>
            <UnifiedTypography variant="body2" className="opacity-90">
              Klasicky prenajaté
            </UnifiedTypography>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
          <CardContent className="text-center py-4">
            <UnifiedTypography
              variant="h4"
              className="font-bold mb-1"
            >
              {
                allVehicles.filter((v: Vehicle) => v.status === 'maintenance')
                  .length
              }
            </UnifiedTypography>
            <UnifiedTypography variant="body2" className="opacity-90">
              Údržba
            </UnifiedTypography>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
          <CardContent className="text-center py-4">
            <UnifiedTypography
              variant="h4"
              className="font-bold mb-1"
            >
              {allVehicles.length}
            </UnifiedTypography>
            <UnifiedTypography variant="body2" className="opacity-90">
              Celkom
            </UnifiedTypography>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="overflow-hidden shadow-xl rounded-xl">
        <CardContent className="p-0">
          <AvailabilityCalendar
            searchQuery={searchQuery}
            isMobile={isMobile}
            selectedCompany={selectedCompany}
            categoryFilter={selectedCategories}
            availableFromDate={availableFromDate}
            availableToDate={availableToDate}
          />
        </CardContent>
      </Card>

      {/* 🚫 ADD UNAVAILABILITY MODAL */}
      <AddUnavailabilityModal
        open={unavailabilityModalOpen}
        onClose={() => setUnavailabilityModalOpen(false)}
        onSuccess={handleUnavailabilitySuccess}
      />
    </div>
  );
};

export default AvailabilityPageNew;
