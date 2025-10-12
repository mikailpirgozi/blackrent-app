// Lucide icons (replacing MUI icons)
import {
  Plus as AddIcon,
  Building2 as BankIcon,
  Building as CompanyIcon,
  Trash2 as DeleteIcon,
  Euro as EuroIcon,
  Filter as FilterListIcon,
  TrendingDown as LossIcon,
  TrendingUp as ProfitIcon,
  BarChart3 as ReportIcon,
  Search as SearchIcon,
  Car as VehicleIcon,
  Eye as ViewIcon,
  Check,
  ChevronsUpDown,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import React, { useMemo, useState } from 'react';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import { useCompanies } from '@/lib/react-query/hooks/useCompanies';
import {
  useCreateSettlement,
  useDeleteSettlement,
  useSettlements,
} from '@/lib/react-query/hooks/useSettlements';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import type { Settlement, Vehicle } from '../../types';

import SettlementDetail from './SettlementDetail';
import PremiumSettlementCard from './PremiumSettlementCard';
import { logger } from '@/utils/smartLogger';

const SettlementListNew: React.FC = () => {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: settlements = [], dataUpdatedAt } = useSettlements();
  const { data: vehicles = [] } = useVehicles();
  const { data: companies = [] } = useCompanies();
  const createSettlementMutation = useCreateSettlement();
  const deleteSettlementMutation = useDeleteSettlement();

  // 🔍 DEBUG: Log when settlements change
  React.useEffect(() => {
    logger.debug('🔄 Settlements updated:', {
      count: settlements?.length,
      dataUpdatedAt: new Date(dataUpdatedAt),
      timestamp: Date.now(),
      data: settlements,
    });
  }, [settlements, dataUpdatedAt]);

  // Helper functions for compatibility
  const createSettlement = async (settlement: Settlement) => {
    return createSettlementMutation.mutateAsync(settlement);
  };
  const deleteSettlement = async (id: string) => {
    return deleteSettlementMutation.mutateAsync(id);
  };

  const isMobile = useMediaQuery('(max-width: 768px)');

  // States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] =
    useState<Settlement | null>(null);
  const [loading, setLoading] = useState(false);

  // New settlement creation states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [periodFrom, setPeriodFrom] = useState<Date | null>(null);
  const [periodTo, setPeriodTo] = useState<Date | null>(null);
  const [periodType, setPeriodType] = useState<'month' | 'range'>('month');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Combobox states
  const [openCompanyCombobox, setOpenCompanyCombobox] = useState(false);
  const [openVehicleCombobox, setOpenVehicleCombobox] = useState(false);

  // Get unique values for filters
  const uniqueCompanies = useMemo(
    () => Array.from(new Set(companies.map(c => c.name))).sort(),
    [companies]
  );

  // Vehicle options for autocomplete
  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicle: Vehicle) => ({
        id: vehicle.id,
        label: `${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}`,
        company: vehicle.company,
      })),
    [vehicles]
  );

  // Get unique companies from settlements for filtering
  const settlementsCompanies = useMemo(
    () =>
      Array.from(
        new Set(
          settlements
            .map((s: Settlement) => s.company)
            .filter((company): company is string => Boolean(company))
        )
      ).sort(),
    [settlements]
  );

  // Filtered settlements
  const filteredSettlements = useMemo(() => {
    return settlements.filter((settlement: Settlement) => {
      const matchesSearch =
        !searchQuery ||
        settlement.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        settlement.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCompany =
        !companyFilter ||
        companyFilter === 'all' ||
        settlement.company === companyFilter;
      const matchesVehicle =
        !vehicleFilter ||
        vehicleFilter === 'all' ||
        settlement.vehicleId === vehicleFilter;

      return matchesSearch && matchesCompany && matchesVehicle;
    });
  }, [settlements, searchQuery, companyFilter, vehicleFilter]);

  // Calculate totals
  const totalIncome = useMemo(
    () =>
      filteredSettlements.reduce(
        (sum: number, settlement: Settlement) => sum + settlement.totalIncome,
        0
      ),
    [filteredSettlements]
  );

  const totalExpenses = useMemo(
    () =>
      filteredSettlements.reduce(
        (sum: number, settlement: Settlement) => sum + settlement.totalExpenses,
        0
      ),
    [filteredSettlements]
  );

  const totalProfit = useMemo(
    () =>
      filteredSettlements.reduce(
        (sum: number, settlement: Settlement) => sum + settlement.profit,
        0
      ),
    [filteredSettlements]
  );

  // Handlers
  const handleCreateSettlement = () => {
    setSelectedCompanies([]);
    setSelectedVehicleIds([]);
    setPeriodFrom(null);
    setPeriodTo(null);
    setSelectedMonth('');
    setPeriodType('month');
    setCreateDialogOpen(true);
  };

  const handleViewSettlement = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setDetailOpen(true);
  };

  const handleDeleteSettlement = async (settlement: Settlement) => {
    if (
      window.confirm(
        `Naozaj chcete zmazať vyúčtovanie za obdobie ${format(new Date(settlement.period.from), 'dd.MM.yyyy')} - ${format(new Date(settlement.period.to), 'dd.MM.yyyy')}?`
      )
    ) {
      try {
        logger.debug('Delete settlement:', settlement.id);
        await deleteSettlement(settlement.id);
      } catch (error) {
        console.error('Chyba pri mazaní vyúčtovania:', error);
        window.alert('Chyba pri mazaní vyúčtovania. Skúste to znova.');
      }
    }
  };

  const handleCreateSubmit = async () => {
    let fromDate: Date;
    let toDate: Date;

    if (periodType === 'month') {
      if (!selectedMonth) {
        window.alert('Prosím vyberte mesiac');
        return;
      }
      // Parse YYYY-MM format
      const [year, month] = selectedMonth.split('-').map(Number);
      if (!year || !month) {
        window.alert('Neplatný formát mesiaca');
        return;
      }
      fromDate = new Date(year, month - 1, 1); // month is 0-indexed
      toDate = new Date(year, month, 0); // Last day of month
    } else {
      if (!periodFrom || !periodTo) {
        window.alert('Prosím vyberte obdobie');
        return;
      }
      fromDate = periodFrom;
      toDate = periodTo;
    }

    // Validácia - musí byť vybraná aspoň jedna firma alebo vozidlo
    if (selectedCompanies.length === 0 && selectedVehicleIds.length === 0) {
      window.alert('Prosím vyberte aspoň jednu firmu alebo vozidlo');
      return;
    }

    setLoading(true);
    try {
      // Ak sú vybrané firmy, vytvor settlement pre každú firmu
      if (selectedCompanies.length > 0) {
        for (const company of selectedCompanies) {
          const settlementData = {
            id: '', // Backend vygeneruje ID
            period: {
              from: fromDate,
              to: toDate,
            },
            company: company,
            // vehicleId vynechané - pri výbere firiem nevyberáme konkrétne vozidlo
            totalIncome: 0, // Backend vypočíta
            totalExpenses: 0, // Backend vypočíta
            totalCommission: 0, // Backend vypočíta
            totalToOwner: 0, // Backend vypočíta
            profit: 0, // Backend vypočíta
            rentals: [], // Backend načíta
            expenses: [], // Backend načíta
          } as Settlement;

          await createSettlement(settlementData);
        }
      }

      // Ak sú vybrané vozidlá, vytvor settlement pre každé vozidlo
      if (selectedVehicleIds.length > 0) {
        for (const vehicleId of selectedVehicleIds) {
          const vehicle = vehicles.find((v: Vehicle) => v.id === vehicleId);
          const settlementData = {
            id: '', // Backend vygeneruje ID
            period: {
              from: fromDate,
              to: toDate,
            },
            company: vehicle?.company || '',
            vehicleId: vehicleId,
            totalIncome: 0, // Backend vypočíta
            totalExpenses: 0, // Backend vypočíta
            totalCommission: 0, // Backend vypočíta
            totalToOwner: 0, // Backend vypočíta
            profit: 0, // Backend vypočíta
            rentals: [], // Backend načíta
            expenses: [], // Backend načíta
          } as Settlement;

          await createSettlement(settlementData);
        }
      }

      setCreateDialogOpen(false);
      // Clear form
      setSelectedCompanies([]);
      setSelectedVehicleIds([]);
      setPeriodFrom(null);
      setPeriodTo(null);
      setSelectedMonth('');
    } catch (error) {
      console.error('Error creating settlement:', error);
      window.alert('Chyba pri vytváraní vyúčtovania');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredSettlements.map((settlement: Settlement) => ({
      ID: settlement.id,
      'Obdobie od': format(new Date(settlement.period.from), 'dd.MM.yyyy'),
      'Obdobie do': format(new Date(settlement.period.to), 'dd.MM.yyyy'),
      Firma: settlement.company || '',
      Vozidlo: settlement.vehicleId
        ? vehicles.find(v => v.id === settlement.vehicleId)?.licensePlate ||
          settlement.vehicleId
        : '',
      Príjmy: settlement.totalIncome,
      Náklady: settlement.totalExpenses,
      Provízia: settlement.totalCommission,
      Zisk: settlement.profit,
      'Počet prenájmov': settlement.rentals?.length || 0,
      'Počet nákladov': settlement.expenses?.length || 0,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new window.Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `vyuctovanie-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCompanyFilter('');
    setVehicleFilter('');
  };

  return (
    <div className="p-1 md:p-3">
      {/* Header */}
      <Card className="mb-3 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ReportIcon className="text-blue-600 h-7 w-7" />
              <h1 className="text-2xl font-bold text-blue-600">Vyúčtovanie</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleCreateSettlement}
                className="min-w-[120px]"
              >
                <AddIcon className="mr-2 h-4 w-4" />
                Vytvoriť
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={filteredSettlements.length === 0}
              >
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="mb-3 shadow-md">
        <CardContent className="pt-6">
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Hľadať vyúčtovanie..."
                value={searchQuery}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterListIcon className="mr-2 h-4 w-4" />
              Filtre
            </Button>

            {(companyFilter || vehicleFilter) && (
              <Button variant="ghost" onClick={clearFilters}>
                Vymazať filtre
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Firma</Label>
                  <Select
                    value={companyFilter}
                    onValueChange={setCompanyFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky firmy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všetky firmy</SelectItem>
                      {settlementsCompanies.map((company: string) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Vozidlo</Label>
                  <Select
                    value={vehicleFilter}
                    onValueChange={setVehicleFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky vozidlá" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všetky vozidlá</SelectItem>
                      {vehicles.map((vehicle: Vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} -{' '}
                          {vehicle.licensePlate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold mb-1">Celkom</p>
                <p className="text-3xl font-bold">
                  {filteredSettlements.length}
                </p>
              </div>
              <ReportIcon className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold mb-1">Príjmy</p>
                <p className="text-3xl font-bold">{totalIncome.toFixed(2)}€</p>
              </div>
              <BankIcon className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-400 to-red-400 text-white shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold mb-1">Náklady</p>
                <p className="text-3xl font-bold">
                  {totalExpenses.toFixed(2)}€
                </p>
              </div>
              <EuroIcon className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'text-white shadow-lg',
            totalProfit >= 0
              ? 'bg-gradient-to-br from-emerald-400 to-green-500'
              : 'bg-gradient-to-br from-red-400 to-pink-500'
          )}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold mb-1">
                  {totalProfit >= 0 ? 'Zisk' : 'Strata'}
                </p>
                <p className="text-3xl font-bold">{totalProfit.toFixed(2)}€</p>
              </div>
              {totalProfit >= 0 ? (
                <ProfitIcon className="h-10 w-10 opacity-80" />
              ) : (
                <LossIcon className="h-10 w-10 opacity-80" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="flex justify-center my-8">
          <Spinner />
        </div>
      )}

      {/* View Mode Toggle - Desktop Only */}
      {!isMobile && (
        <div className="mb-6 flex justify-end animate-fade-in">
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/50">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>
      )}

      {/* Grid View - Premium Cards (Desktop Only) */}
      {!isMobile && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredSettlements.map(settlement => (
            <PremiumSettlementCard
              key={settlement.id}
              settlement={settlement}
              onView={settlement => {
                setSelectedSettlement(settlement);
                setDetailOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* List View & Mobile - Original Table */}
      {(isMobile || viewMode === 'list') && (
        <>
          {/* Mobile Layout */}
          {isMobile ? (
            <div className="flex flex-col gap-3">
              {filteredSettlements.length === 0 ? (
                <Card className="shadow-md">
                  <CardContent className="text-center py-12">
                    <ReportIcon className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
                    <p className="text-lg text-muted-foreground">
                      Žiadne vyúčtovania nenájdené
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredSettlements.map(
                  (settlement: Settlement, index: number) => {
                    const vehicle = settlement.vehicleId
                      ? vehicles.find(
                          (v: Vehicle) => v.id === settlement.vehicleId
                        )
                      : null;
                    const isProfit = settlement.profit >= 0;

                    return (
                      <Card
                        key={settlement.id || `settlement-mobile-${index}`}
                        className="shadow-md rounded-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 mr-2">
                              <h3 className="text-lg font-semibold mb-2 break-words">
                                {format(
                                  new Date(settlement.period.from),
                                  'dd.MM.yyyy'
                                )}{' '}
                                -{' '}
                                {format(
                                  new Date(settlement.period.to),
                                  'dd.MM.yyyy'
                                )}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant={isProfit ? 'default' : 'destructive'}
                                  className="font-semibold"
                                >
                                  {isProfit ? (
                                    <ProfitIcon className="h-3 w-3 mr-1" />
                                  ) : (
                                    <LossIcon className="h-3 w-3 mr-1" />
                                  )}
                                  {isProfit ? 'Zisk' : 'Strata'}
                                </Badge>
                                <span
                                  className={cn(
                                    'text-lg font-bold',
                                    isProfit ? 'text-green-600' : 'text-red-600'
                                  )}
                                >
                                  {settlement.profit.toFixed(2)}€
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewSettlement(settlement)}
                                className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 text-blue-600"
                              >
                                <ViewIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleDeleteSettlement(settlement)
                                }
                                className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600"
                              >
                                <DeleteIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <Separator className="my-2" />

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <BankIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Príjmy: {settlement.totalIncome.toFixed(2)}€
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <EuroIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Náklady: {settlement.totalExpenses.toFixed(2)}€
                              </span>
                            </div>
                            {settlement.company && (
                              <div className="flex items-center gap-1">
                                <CompanyIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground truncate">
                                  {settlement.company}
                                </span>
                              </div>
                            )}
                            {vehicle && (
                              <div className="flex items-center gap-1">
                                <VehicleIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground truncate">
                                  {vehicle.licensePlate}
                                </span>
                              </div>
                            )}
                            <div className="col-span-2 mt-2 p-2 bg-gray-50 rounded text-muted-foreground">
                              {settlement.rentals?.length || 0} prenájmov •{' '}
                              {settlement.expenses?.length || 0} nákladov
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                )
              )}
            </div>
          ) : (
            /* Desktop Layout */
            <Card className="shadow-lg">
              <div className="sticky top-0 bg-white z-10 border-b-2 border-gray-200">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_120px] gap-4 p-4 font-semibold text-blue-600 bg-gray-50">
                  <div>Obdobie</div>
                  <div>Firma</div>
                  <div>Vozidlo</div>
                  <div>Príjmy</div>
                  <div>Náklady</div>
                  <div>Provízia</div>
                  <div>Zisk</div>
                  <div className="text-center">Akcie</div>
                </div>
              </div>

              <div className="max-h-[600px] overflow-auto">
                {filteredSettlements.length === 0 ? (
                  <div className="text-center py-12">
                    <ReportIcon className="h-16 w-16 text-muted-foreground mb-4 mx-auto" />
                    <p className="text-lg text-muted-foreground">
                      Žiadne vyúčtovania nenájdené
                    </p>
                  </div>
                ) : (
                  filteredSettlements.map(
                    (settlement: Settlement, index: number) => {
                      const vehicle = settlement.vehicleId
                        ? vehicles.find(
                            (v: Vehicle) => v.id === settlement.vehicleId
                          )
                        : null;
                      const isProfit = settlement.profit >= 0;

                      return (
                        <div
                          key={settlement.id || `settlement-${index}`}
                          className={cn(
                            'grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_120px] gap-4 p-4 border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors',
                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          )}
                        >
                          <div>
                            <p className="font-semibold mb-1">
                              {format(
                                new Date(settlement.period.from),
                                'dd.MM.yyyy'
                              )}{' '}
                              -{' '}
                              {format(
                                new Date(settlement.period.to),
                                'dd.MM.yyyy'
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {settlement.rentals?.length || 0} prenájmov •{' '}
                              {settlement.expenses?.length || 0} nákladov
                            </p>
                          </div>

                          <div className="flex items-center truncate">
                            {settlement.company || '-'}
                          </div>

                          <div className="flex items-center truncate">
                            {vehicle
                              ? `${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}`
                              : '-'}
                          </div>

                          <div className="flex items-center font-semibold text-green-600">
                            {settlement.totalIncome.toFixed(2)}€
                          </div>

                          <div className="flex items-center font-semibold text-red-600">
                            {settlement.totalExpenses.toFixed(2)}€
                          </div>

                          <div className="flex items-center font-semibold text-orange-600">
                            {settlement.totalCommission.toFixed(2)}€
                          </div>

                          <div
                            className={cn(
                              'flex items-center font-bold',
                              isProfit ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {settlement.profit.toFixed(2)}€
                          </div>

                          <div className="flex gap-1 justify-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleViewSettlement(settlement)
                                  }
                                  className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 text-blue-600"
                                >
                                  <ViewIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Zobraziť detail</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleDeleteSettlement(settlement)
                                  }
                                  className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600"
                                >
                                  <DeleteIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Zmazať</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </Card>
          )}

          {/* Create Settlement Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent
              className={cn(
                'sm:max-w-4xl',
                isMobile && 'w-full h-full max-w-full overflow-y-auto'
              )}
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Vytvoriť vyúčtovanie
                </DialogTitle>
                <DialogDescription>
                  Formulár na vytvorenie nového vyúčtovania pre firmy alebo
                  vozidlá
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label className="mb-2 block">Typ obdobia</Label>
                  <ToggleGroup
                    type="single"
                    value={periodType}
                    onValueChange={value => {
                      if (value) {
                        setPeriodType(value as 'month' | 'range');
                        setPeriodFrom(null);
                        setPeriodTo(null);
                        setSelectedMonth('');
                      }
                    }}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="month" aria-label="mesiac">
                      Mesiac
                    </ToggleGroupItem>
                    <ToggleGroupItem value="range" aria-label="obdobie">
                      Časové obdobie
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {periodType === 'month' ? (
                  <div className="space-y-2">
                    <Label htmlFor="month">Mesiac</Label>
                    <Input
                      id="month"
                      type="month"
                      value={selectedMonth}
                      onChange={(
                        e: React.ChangeEvent<
                          HTMLInputElement | HTMLTextAreaElement
                        >
                      ) => setSelectedMonth(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Vyberte mesiac pre vyúčtovanie
                    </p>
                  </div>
                ) : (
                  <DateRangePicker
                    label="Časové obdobie vyúčtovania"
                    placeholder="Vyberte obdobie od - do"
                    value={{
                      from: periodFrom,
                      to: periodTo,
                    }}
                    onChange={value => {
                      setPeriodFrom(value.from);
                      setPeriodTo(value.to);
                    }}
                    required
                  />
                )}

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Vyberte firmy alebo vozidlá na vyúčtovanie. Môžete vybrať
                    viacero položiek naraz.
                  </p>
                  <Label>Firmy (voliteľné)</Label>
                  <Popover
                    open={openCompanyCombobox}
                    onOpenChange={setOpenCompanyCombobox}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCompanyCombobox}
                        className="w-full justify-between"
                      >
                        {selectedCompanies.length > 0
                          ? `${selectedCompanies.length} vybraných firiem`
                          : 'Vyberte firmy...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Hľadať firmu..." />
                        <CommandEmpty>Žiadne firmy nenájdené</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {uniqueCompanies.map((company, index) => (
                              <CommandItem
                                key={`${company}-${index}`}
                                onSelect={() => {
                                  setSelectedCompanies(prev =>
                                    prev.includes(company)
                                      ? prev.filter(c => c !== company)
                                      : [...prev, company]
                                  );
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedCompanies.includes(company)
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {company}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedCompanies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedCompanies.map((company, index) => (
                        <Badge
                          key={`${company}-badge-${index}`}
                          variant="secondary"
                          className="px-2 py-1"
                        >
                          {company}
                          <button
                            onClick={() =>
                              setSelectedCompanies(prev =>
                                prev.filter(c => c !== company)
                              )
                            }
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Vozidlá (voliteľné)</Label>
                  <Popover
                    open={openVehicleCombobox}
                    onOpenChange={setOpenVehicleCombobox}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openVehicleCombobox}
                        className="w-full justify-between"
                      >
                        {selectedVehicleIds.length > 0
                          ? `${selectedVehicleIds.length} vybraných vozidiel`
                          : 'Vyberte vozidlá...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Hľadať vozidlo..." />
                        <CommandEmpty>Žiadne vozidlá nenájdené</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {vehicleOptions.map(vehicle => (
                              <CommandItem
                                key={vehicle.id}
                                onSelect={() => {
                                  setSelectedVehicleIds(prev =>
                                    prev.includes(vehicle.id)
                                      ? prev.filter(id => id !== vehicle.id)
                                      : [...prev, vehicle.id]
                                  );
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedVehicleIds.includes(vehicle.id)
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {vehicle.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedVehicleIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedVehicleIds.map(id => {
                        const vehicle = vehicleOptions.find(v => v.id === id);
                        return vehicle ? (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="px-2 py-1"
                          >
                            {vehicle.label}
                            <button
                              onClick={() =>
                                setSelectedVehicleIds(prev =>
                                  prev.filter(vid => vid !== id)
                                )
                              }
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Zrušiť
                </Button>
                <Button onClick={handleCreateSubmit} disabled={loading}>
                  {loading ? <Spinner className="mr-2" /> : null}
                  Vytvoriť
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Settlement Detail Dialog */}
          <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
            <DialogContent
              className={cn(
                'max-w-[95vw] w-[95vw]',
                isMobile ? 'h-full max-h-full' : 'max-h-[90vh]'
              )}
            >
              <DialogHeader className="sr-only">
                <DialogTitle>Detail vyúčtovania</DialogTitle>
                <DialogDescription>
                  Detailný prehľad vyúčtovania s príjmami, nákladmi a zoznamom
                  prenájmov
                </DialogDescription>
              </DialogHeader>
              {selectedSettlement && (
                <SettlementDetail
                  settlement={selectedSettlement}
                  onClose={() => setDetailOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default SettlementListNew;
