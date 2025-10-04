import {
  Plus as AddIcon,
  Building as CompanyIcon,
  Calendar as DateIcon,
  Trash2 as DeleteIcon,
  Edit2 as EditIcon,
  Euro as EuroIcon,
  Filter as FilterListIcon,
  Fuel as FuelIcon,
  Shield as InsuranceIcon,
  Tag as OtherIcon,
  Receipt as ReceiptIcon,
  Repeat as RepeatIcon,
  Search as SearchIcon,
  Wrench as ServiceIcon,
  Settings as SettingsIcon,
  Car as VehicleIcon,
  LayoutGrid,
  List,
} from 'lucide-react';
import { ExpenseListItem } from './components/ExpenseListItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import * as Papa from 'papaparse';
import React, { useEffect, useMemo, useState } from 'react';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
} from '@/lib/react-query/hooks/useExpenses';
// ✅ FÁZA 2.2: Používame shared hook pre categories
import { useExpenseCategories } from '@/lib/react-query/hooks/useExpenseCategories';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import { apiService } from '../../services/api';
import type { Expense, ExpenseCategory, Vehicle } from '../../types';
import { textContains } from '../../utils/textNormalization';
// ✅ FÁZA 2.4: Decimal.js pre presné kalkulácie
import { addAmounts, formatCurrency } from '@/utils/money';
// ✅ FÁZA 1.1: Timezone-safe date handling
import { parseDate } from '@/utils/dateUtils';
// ✅ FÁZA 1.4: Toast notifications namiesto window.alert()
import { useExpenseToast } from '@/hooks/useExpenseToast';

import ExpenseCategoryManager from './ExpenseCategoryManager';
import ExpenseForm from './ExpenseForm';
import RecurringExpenseManager from './RecurringExpenseManager';
import PremiumExpenseCard from './PremiumExpenseCard';
import { logger } from '@/utils/smartLogger';

// Helper funkcie pre dynamické kategórie
const getCategoryIcon = (
  categoryName: string,
  categories: ExpenseCategory[]
) => {
  const category = categories.find(c => c.name === categoryName);
  if (!category) return <ReceiptIcon className="h-4 w-4" />;

  // Mapovanie ikon na Lucide komponenty
  const iconMap: Record<string, React.ReactElement> = {
    local_gas_station: <FuelIcon className="h-4 w-4" />,
    build: <ServiceIcon className="h-4 w-4" />,
    security: <InsuranceIcon className="h-4 w-4" />,
    category: <OtherIcon className="h-4 w-4" />,
    receipt: <ReceiptIcon className="h-4 w-4" />,
  };

  return iconMap[category.icon] || <ReceiptIcon className="h-4 w-4" />;
};

const getCategoryText = (
  categoryName: string,
  categories: ExpenseCategory[]
) => {
  const category = categories.find(c => c.name === categoryName);
  return category?.displayName || categoryName;
};

const ExpenseListNew: React.FC = () => {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: expenses = [] } = useExpenses();
  const { data: vehiclesData = [] } = useVehicles();
  // ✅ FÁZA 2.2: Shared categories hook
  const { data: expenseCategories = [] } = useExpenseCategories();
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  // ✅ FÁZA 1.4: Toast notifications
  const toast = useExpenseToast();

  // Helper functions for compatibility
  const getFilteredExpenses = () => expenses; // Simple implementation for now
  const getFilteredVehicles = () => vehiclesData; // Simple implementation for now
  const createExpense = async (expense: Expense) => {
    return createExpenseMutation.mutateAsync(expense);
  };
  const updateExpense = async (expense: Expense) => {
    return updateExpenseMutation.mutateAsync(expense);
  };
  const deleteExpense = async (id: string) => {
    return deleteExpenseMutation.mutateAsync(id);
  };
  // Custom hook for mobile detection using Tailwind breakpoints
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get data from React Query hooks
  const filteredExpenses = getFilteredExpenses();
  const vehicles = getFilteredVehicles();

  // States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoriesManagerOpen, setCategoriesManagerOpen] = useState(false);
  const [recurringManagerOpen, setRecurringManagerOpen] = useState(false);

  // ✅ FÁZA 2.2: Kategórie už načítavame cez useExpenseCategories() hook
  // Vymazaná duplicitná useState + loadCategories()

  // Get unique values for filters
  const uniqueCompanies = useMemo(
    () =>
      Array.from(
        new Set(filteredExpenses.map((e: Expense) => e.company).filter(Boolean))
      ).sort(),
    [filteredExpenses]
  );

  // ✅ FÁZA 2.2: Vymazané - loadCategories() už nie je potrebný
  // Kategórie sa načítavajú automaticky cez useExpenseCategories() hook

  // Filtered expenses
  const finalFilteredExpenses = useMemo(() => {
    return filteredExpenses.filter((expense: Expense) => {
      const matchesSearch =
        !searchQuery ||
        textContains(expense.description, searchQuery) ||
        textContains(expense.note, searchQuery) ||
        textContains(expense.company, searchQuery);

      const matchesCategory =
        categoryFilter === 'all' || expense.category === categoryFilter;
      const matchesCompany =
        !companyFilter ||
        companyFilter === 'all-companies' ||
        expense.company === companyFilter;
      const matchesVehicle =
        !vehicleFilter ||
        vehicleFilter === 'all-vehicles' ||
        expense.vehicleId === vehicleFilter;

      return (
        matchesSearch && matchesCategory && matchesCompany && matchesVehicle
      );
    });
  }, [
    filteredExpenses,
    searchQuery,
    categoryFilter,
    companyFilter,
    vehicleFilter,
  ]);

  // ✅ FÁZA 2.4: Calculate totals s Decimal.js (presné kalkulácie)
  const totalAmount = useMemo(
    () => addAmounts(...finalFilteredExpenses.map(e => e.amount)),
    [finalFilteredExpenses]
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    // Inicializuj všetky kategórie na 0
    expenseCategories.forEach(category => {
      totals[category.name] = 0;
    });

    // ✅ FÁZA 2.4: Spočítaj sumy pre každú kategóriu s Decimal.js
    finalFilteredExpenses.forEach((expense: Expense) => {
      if (totals[expense.category] !== undefined) {
        totals[expense.category] = addAmounts(
          totals[expense.category]!,
          expense.amount
        ).toNumber();
      }
    });

    return totals;
  }, [finalFilteredExpenses, expenseCategories]);

  // Handlers
  const handleAddExpense = () => {
    setEditingExpense(null);
    setFormOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (
      window.confirm(`Naozaj chcete zmazať náklad "${expense.description}"?`)
    ) {
      setLoading(true);
      try {
        await deleteExpense(expense.id);
      } catch (error) {
        logger.error('Failed to delete expense', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = async (expenseData: Partial<Expense>) => {
    setLoading(true);
    try {
      if (editingExpense && expenseData.id) {
        await updateExpense({ ...editingExpense, ...expenseData } as Expense);
      } else {
        await createExpense(expenseData as Expense);
      }
      setFormOpen(false);
      setEditingExpense(null);
    } catch (error) {
      logger.error('Failed to save expense', error);
    } finally {
      setLoading(false);
    }
  };

  // CSV funkcionalita
  const handleExportCSV = async () => {
    try {
      const { apiService } = await import('../../services/api');
      const blob = await apiService.exportExpensesCSV();
      const filename = `naklady-${new Date().toISOString().split('T')[0]}.csv`;
      saveAs(blob, filename);

      toast.success('CSV export úspešný');
    } catch (error) {
      logger.error('CSV export failed', error);
      toast.error('Chyba pri CSV exporte');
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      worker: true, // ✅ FIX: Parsuje v Web Worker pre lepší výkon
      complete: async (results: {
        data: unknown[][];
        errors: unknown[];
        meta: unknown;
      }) => {
        try {
          logger.debug('📥 Parsing CSV file for batch expense import...');

          if (!results.data || results.data.length < 2) {
            toast.error(
              'CSV súbor musí obsahovať aspoň hlavičku a jeden riadok dát'
            );
            return;
          }

          // Získaj hlavičku pre inteligentné mapovanie
          const headers = results.data[0] as string[];
          const dataRows = results.data.slice(1) as unknown[][];
          const batchExpenses = [];

          logger.debug('📋 CSV Headers:', headers);
          logger.debug(`📦 Processing ${dataRows.length} expense rows...`);

          // Inteligentné mapovanie stĺpcov
          const getColumnIndex = (possibleNames: string[]) => {
            for (const name of possibleNames) {
              const index = headers.findIndex(
                (h: string) =>
                  h && h.toString().toLowerCase().trim() === name.toLowerCase()
              );
              if (index !== -1) return index;
            }
            return -1;
          };

          const columnMap = {
            id: getColumnIndex(['id', 'ID']),
            description: getColumnIndex([
              'description',
              'popis',
              'Description',
              'Popis',
            ]),
            amount: getColumnIndex([
              'amount',
              'suma',
              'Amount',
              'Suma',
              'cena',
              'Cena',
            ]),
            date: getColumnIndex(['date', 'datum', 'Date', 'Dátum']),
            category: getColumnIndex([
              'category',
              'kategoria',
              'Category',
              'Kategória',
            ]),
            company: getColumnIndex(['company', 'firma', 'Company', 'Firma']),
            vehicleId: getColumnIndex([
              'vehicleId',
              'vehicle_id',
              'vozidlo_id',
            ]),
            vehicleLicensePlate: getColumnIndex([
              'vehicleLicensePlate',
              'spz',
              'SPZ',
              'license_plate',
            ]),
            note: getColumnIndex(['note', 'poznamka', 'Note', 'Poznámka']),
          };

          logger.debug('🗺️ Column mapping:', columnMap);

          for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];

            // Preskočíme prázdne riadky
            if (
              !row ||
              row.length === 0 ||
              !row.some((cell: unknown) => cell && cell.toString().trim())
            ) {
              continue;
            }

            // Mapovanie polí pomocou inteligentného mapovania
            const description =
              columnMap.description >= 0
                ? row[columnMap.description]
                : undefined;
            const amount =
              columnMap.amount >= 0 ? row[columnMap.amount] : undefined;
            const date = columnMap.date >= 0 ? row[columnMap.date] : undefined;
            const category =
              columnMap.category >= 0 ? row[columnMap.category] : undefined;
            const company =
              columnMap.company >= 0 ? row[columnMap.company] : undefined;
            const vehicleId =
              columnMap.vehicleId >= 0 ? row[columnMap.vehicleId] : undefined;
            const note = columnMap.note >= 0 ? row[columnMap.note] : undefined;

            // Kontrola povinných polí
            if (!description || description.toString().trim() === '') {
              logger.warn(
                `CSV import - Riadok ${i + 2}: Preskakujem - chýba popis`
              );
              continue;
            }

            // Parsuj sumu
            let parsedAmount = 0;
            if (amount && amount.toString().trim() !== '') {
              parsedAmount = parseFloat(amount.toString().replace(',', '.'));
              if (isNaN(parsedAmount)) {
                logger.warn(
                  `CSV import - Riadok ${i + 2}: Neplatná suma "${amount}", nastavujem na 0`
                );
                parsedAmount = 0;
              }
            }

            // ✅ FÁZA 1.1: Timezone-safe date parsing
            let parsedDate = new Date();
            if (date && date.toString().trim()) {
              const dateStr = date.toString().trim();

              // Formát MM/YYYY sa zmení na 01.MM.YYYY
              if (/^\d{1,2}\/\d{4}$/.test(dateStr)) {
                const [month, year] = dateStr.split('/');
                parsedDate = new Date(parseInt(year!), parseInt(month!) - 1, 1);
              } else {
                // ✅ Použiť parseDate pre timezone-safe parsing
                const tempDate = parseDate(dateStr);
                if (tempDate && !isNaN(tempDate.getTime())) {
                  parsedDate = tempDate;
                }
              }
            }

            // Mapovanie kategórií
            let mappedCategory = 'other';
            if (category && category.toString().trim()) {
              const categoryStr = category.toString().toLowerCase().trim();
              const categoryMap: { [key: string]: string } = {
                fuel: 'fuel',
                palivo: 'fuel',
                benzín: 'fuel',
                nafta: 'fuel',
                service: 'service',
                servis: 'service',
                oprava: 'service',
                údržba: 'service',
                insurance: 'insurance',
                poistenie: 'insurance',
                other: 'other',
                ostatné: 'other',
                iné: 'other',
              };
              mappedCategory = categoryMap[categoryStr] || 'other';
            }

            // Vytvor expense objekt
            const expenseData = {
              description: description.toString().trim(),
              amount: parsedAmount,
              date: parsedDate,
              category: mappedCategory,
              vehicleId:
                vehicleId && vehicleId.toString().trim() !== ''
                  ? vehicleId.toString().trim()
                  : undefined,
              company:
                company && company.toString().trim() !== ''
                  ? company.toString().trim()
                  : 'Black Holding',
              note:
                note && note.toString().trim() !== ''
                  ? note.toString().trim()
                  : undefined,
            };

            logger.debug(
              `💰 Expense ${i + 2}: ${expenseData.description} - ${expenseData.amount}€ - Company: "${expenseData.company}"`
            );

            batchExpenses.push(expenseData);
          }

          logger.debug(
            `📦 Pripravených ${batchExpenses.length} nákladov pre batch import`
          );

          // Použij batch import namiesto CSV importu
          const result = await apiService.batchImportExpenses(batchExpenses);

          logger.debug('📥 CSV Import result:', result);

          // Result už obsahuje priamo dáta, nie je wrapped v success/data
          const {
            created,
            updated,
            errorsCount,
            successRate,
            processed,
            total,
          } = result;

          if (created > 0 || updated > 0) {
            toast.success(
              `✅ Import úspešný! Vytvorených: ${created}, Aktualizovaných: ${updated}, Spracovaných: ${processed}/${total}. ${errorsCount > 0 ? `Chýb: ${errorsCount}` : ''}`
            );
            // ✅ React Query automaticky refetchuje - žiadny reload!
          } else if (errorsCount > 0) {
            toast.warning(
              `Import dokončený, ale žiadne náklady neboli pridané. Vytvorených: ${created}, Aktualizovaných: ${updated}, Chýb: ${errorsCount}, Úspešnosť: ${successRate}. Skontrolujte formát CSV súboru.`
            );
          } else {
            toast.warning(
              'Import dokončený, ale žiadne náklady neboli pridané. Skontrolujte formát CSV súboru.'
            );
          }
        } catch (error) {
          logger.error('CSV import failed', error);
          toast.error(
            `❌ Import zlyhal: ${error instanceof Error ? error.message : 'Sieťová chyba'}`
          );
          // ✅ React Query automaticky refetchuje - žiadny reload!
        }
      },
      header: false,
      skipEmptyLines: true,
    });

    // Reset input
    event.target.value = '';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setCompanyFilter('');
    setVehicleFilter('');
  };

  return (
    <div className="p-2 md:p-6">
      {/* Header */}
      <Card className="mb-6 shadow-lg">
        <CardContent>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <ReceiptIcon className="h-7 w-7 text-blue-600" />
              <h4 className="text-3xl font-bold text-blue-600">Náklady</h4>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleAddExpense} className="min-w-[120px]">
                <AddIcon className="h-4 w-4 mr-2" />
                Pridať
              </Button>
              <Button
                variant="outline"
                onClick={() => setRecurringManagerOpen(true)}
                className="border-green-500 text-green-500 hover:border-green-700 hover:bg-green-50"
              >
                <RepeatIcon className="h-4 w-4 mr-2" />
                Pravidelné náklady
              </Button>
              <Button
                variant="outline"
                onClick={() => setCategoriesManagerOpen(true)}
                className="border-blue-600 text-blue-600 hover:border-blue-700 hover:bg-blue-50"
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Spravovať kategórie
              </Button>
              {/* CSV tlačidlá - len na desktope */}
              {!isMobile && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    disabled={finalFilteredExpenses.length === 0}
                  >
                    📊 Export CSV
                  </Button>

                  <div className="relative">
                    <Button
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:border-blue-700 hover:bg-blue-50"
                      onClick={() =>
                        document.getElementById('csv-import')?.click()
                      }
                    >
                      📥 Import CSV
                    </Button>
                    <input
                      id="csv-import"
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="hidden"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="mb-6 shadow-md">
        <CardContent>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative min-w-[250px] flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Hľadať náklady..."
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
              <FilterListIcon className="h-4 w-4 mr-2" />
              Filtre
            </Button>

            {(categoryFilter !== 'all' ||
              (companyFilter && companyFilter !== 'all-companies') ||
              (vehicleFilter && vehicleFilter !== 'all-vehicles')) && (
              <Button variant="ghost" onClick={clearFilters}>
                Vymazať filtre
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="category-select">Kategória</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky kategórie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všetky kategórie</SelectItem>
                      {expenseCategories.map(category => (
                        <SelectItem key={category.name} value={category.name}>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category.name, expenseCategories)}
                            {getCategoryText(category.name, expenseCategories)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="company-select">Firma</Label>
                  <Select
                    value={companyFilter}
                    onValueChange={setCompanyFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky firmy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-companies">
                        Všetky firmy
                      </SelectItem>
                      {uniqueCompanies.map((company: string) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicle-select">Vozidlo</Label>
                  <Select
                    value={vehicleFilter}
                    onValueChange={setVehicleFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Všetky vozidlá" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-vehicles">
                        Všetky vozidlá
                      </SelectItem>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Count Card */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-lg font-semibold mb-1">Celkom</h6>
                <h4 className="text-3xl font-bold">
                  {finalFilteredExpenses.length}
                </h4>
              </div>
              <ReceiptIcon className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Total Amount Card */}
        <Card className="bg-gradient-to-br from-pink-400 via-purple-500 to-red-500 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="text-lg font-semibold mb-1">Suma</h6>
                <h4 className="text-3xl font-bold">
                  {formatCurrency(totalAmount)}
                </h4>
              </div>
              <EuroIcon className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Category Cards */}
        {expenseCategories.slice(0, 2).map((category, index) => (
          <Card
            key={category.name}
            className={`text-white shadow-lg ${
              index === 0
                ? 'bg-gradient-to-br from-blue-400 to-cyan-400'
                : 'bg-gradient-to-br from-pink-400 to-yellow-400'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h6 className="text-lg font-semibold mb-1">
                    {category.displayName}
                  </h6>
                  <h4 className="text-3xl font-bold">
                    {(categoryTotals[category.name] || 0).toFixed(2)}€
                  </h4>
                </div>
                <div className="opacity-80">
                  {getCategoryIcon(category.name, expenseCategories)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center my-6">
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
          {finalFilteredExpenses.map(expense => (
            <PremiumExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={handleEditExpense}
              onDelete={id => {
                const exp = finalFilteredExpenses.find(e => e.id === id);
                if (exp) handleDeleteExpense(exp);
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
            <div className="flex flex-col gap-2">
              {finalFilteredExpenses.length === 0 ? (
                <Card className="shadow-md">
                  <CardContent className="text-center py-8">
                    <ReceiptIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h6 className="text-lg text-gray-500">
                      Žiadne náklady nenájdené
                    </h6>
                  </CardContent>
                </Card>
              ) : (
                finalFilteredExpenses.map((expense: Expense) => {
                  const vehicle = expense.vehicleId
                    ? vehicles.find((v: Vehicle) => v.id === expense.vehicleId)
                    : null;

                  return (
                    <Card
                      key={expense.id}
                      className="shadow-md rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-grow mr-4">
                            <h6 className="text-lg font-semibold mb-2 break-words">
                              {expense.description}
                            </h6>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="secondary"
                                className="flex items-center gap-1 font-semibold"
                              >
                                {getCategoryIcon(
                                  expense.category,
                                  expenseCategories
                                )}
                                {getCategoryText(
                                  expense.category,
                                  expenseCategories
                                )}
                              </Badge>
                              <span className="text-lg font-bold text-blue-600">
                                {expense.amount.toFixed(2)}€
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditExpense(expense)}
                                    className="h-8 w-8 p-0 bg-gray-50 hover:bg-gray-100"
                                  >
                                    <EditIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Upraviť</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteExpense(expense)}
                                    className="h-8 w-8 p-0 bg-red-50 text-red-600 hover:bg-red-100"
                                  >
                                    <DeleteIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Zmazať</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <DateIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">
                              {format(
                                parseDate(expense.date) || new Date(),
                                'dd.MM.yyyy'
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CompanyIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600 truncate">
                              {expense.company}
                            </span>
                          </div>
                          {vehicle && (
                            <div className="col-span-2 flex items-center gap-1">
                              <VehicleIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">
                                {vehicle.brand} {vehicle.model} -{' '}
                                {vehicle.licensePlate}
                              </span>
                            </div>
                          )}
                          {expense.note && (
                            <div className="col-span-2">
                              <p className="text-sm italic text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                                {expense.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            /* Desktop List View - Modern Design */
            <div className="space-y-3 animate-fade-in">
              {finalFilteredExpenses.length === 0 ? (
                <Card className="shadow-md">
                  <CardContent className="text-center py-16">
                    <ReceiptIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h6 className="text-xl font-semibold text-gray-600 mb-2">
                      Žiadne náklady nenájdené
                    </h6>
                    <p className="text-sm text-gray-500">
                      Pridajte prvý náklad kliknutím na tlačidlo vyššie
                    </p>
                  </CardContent>
                </Card>
              ) : (
                finalFilteredExpenses.map((expense: Expense) => {
                  const vehicle = expense.vehicleId
                    ? vehicles.find((v: Vehicle) => v.id === expense.vehicleId)
                    : undefined;

                  return (
                    <ExpenseListItem
                      key={expense.id}
                      expense={expense}
                      vehicle={vehicle}
                      categories={expenseCategories}
                      onEdit={handleEditExpense}
                      onDelete={handleDeleteExpense}
                    />
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent
          className={`${isMobile ? 'h-full max-w-full overflow-y-auto' : 'max-w-4xl'} w-full`}
        >
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Upraviť výdavok' : 'Nový výdavok'}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? 'Upravte údaje o výdavku'
                : 'Pridajte nový výdavok do systému'}
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            expense={editingExpense}
            onSave={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
            categories={expenseCategories}
          />
        </DialogContent>
      </Dialog>

      {/* Categories Manager Dialog */}
      <ExpenseCategoryManager
        open={categoriesManagerOpen}
        onClose={() => setCategoriesManagerOpen(false)}
        onCategoriesChanged={() => {
          // ✅ FÁZA 2.2: Kategórie sa auto-refetchujú cez useExpenseCategories
          // Po zmene kategórie React Query automaticky invaliduje cache
        }}
      />

      {/* Recurring Expenses Manager Dialog */}
      <RecurringExpenseManager
        open={recurringManagerOpen}
        onClose={() => setRecurringManagerOpen(false)}
        onExpensesChanged={() => {
          // ✅ React Query automaticky refetchuje - žiadny reload!
        }}
      />
    </div>
  );
};

export default ExpenseListNew;
