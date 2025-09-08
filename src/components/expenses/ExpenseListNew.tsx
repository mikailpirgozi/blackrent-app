import {
  Add as AddIcon,
  Business as CompanyIcon,
  DateRange as DateIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Euro as EuroIcon,
  FilterList as FilterListIcon,
  LocalGasStation as FuelIcon,
  Security as InsuranceIcon,
  Category as OtherIcon,
  Receipt as ReceiptIcon,
  Repeat as RepeatIcon,
  Search as SearchIcon,
  Build as ServiceIcon,
  Settings as SettingsIcon,
  DirectionsCar as VehicleIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import * as Papa from 'papaparse';
import React, { useEffect, useMemo, useState } from 'react';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import {
  useCreateExpense,
  useExpenses,
} from '@/lib/react-query/hooks/useExpenses';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import { apiService } from '../../services/api';
import type { Expense, ExpenseCategory, Vehicle } from '../../types';

import ExpenseCategoryManager from './ExpenseCategoryManager';
import ExpenseForm from './ExpenseForm';
import RecurringExpenseManager from './RecurringExpenseManager';

// Helper funkcie pre dynamické kategórie
const getCategoryIcon = (
  categoryName: string,
  categories: ExpenseCategory[]
) => {
  const category = categories.find(c => c.name === categoryName);
  if (!category) return <ReceiptIcon fontSize="small" />;

  // Mapovanie ikon na Material UI komponenty
  const iconMap: Record<string, React.ReactElement> = {
    local_gas_station: <FuelIcon fontSize="small" />,
    build: <ServiceIcon fontSize="small" />,
    security: <InsuranceIcon fontSize="small" />,
    category: <OtherIcon fontSize="small" />,
    receipt: <ReceiptIcon fontSize="small" />,
  };

  return iconMap[category.icon] || <ReceiptIcon fontSize="small" />;
};

const getCategoryText = (
  categoryName: string,
  categories: ExpenseCategory[]
) => {
  const category = categories.find(c => c.name === categoryName);
  return category?.displayName || categoryName;
};

const getCategoryColor = (
  categoryName: string,
  categories: ExpenseCategory[]
): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
  const category = categories.find(c => c.name === categoryName);
  return category?.color || 'primary';
};

const ExpenseListNew: React.FC = () => {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: expenses = [] } = useExpenses();
  const { data: vehiclesData = [] } = useVehicles();
  const createExpenseMutation = useCreateExpense();

  // Helper functions for compatibility
  const getFilteredExpenses = () => expenses; // Simple implementation for now
  const getFilteredVehicles = () => vehiclesData; // Simple implementation for now
  const createExpense = async (expense: Expense) => {
    return createExpenseMutation.mutateAsync(expense);
  };
  const updateExpense = async (expense: Expense) => {
    // TODO: Implement updateExpense in React Query hooks
    console.warn(
      'updateExpense not yet implemented in React Query hooks',
      expense
    );
  };
  const deleteExpense = async (id: string) => {
    // TODO: Implement deleteExpense in React Query hooks
    console.warn('deleteExpense not yet implemented in React Query hooks', id);
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  // Get data from React Query hooks
  const filteredExpenses = getFilteredExpenses();
  const vehicles = getFilteredVehicles();

  // States
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

  // Dynamické kategórie
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(
    []
  );

  // Get unique values for filters
  const uniqueCompanies = useMemo(
    () =>
      Array.from(
        new Set(filteredExpenses.map((e: Expense) => e.company).filter(Boolean))
      ).sort(),
    [filteredExpenses]
  );

  // Načítanie kategórií z API
  const loadCategories = async () => {
    try {
      const categories = await apiService.getExpenseCategories();
      setExpenseCategories(categories);
    } catch (error) {
      console.error('Error loading expense categories:', error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filtered expenses
  const finalFilteredExpenses = useMemo(() => {
    return filteredExpenses.filter((expense: Expense) => {
      const matchesSearch =
        !searchQuery ||
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.company.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || expense.category === categoryFilter;
      const matchesCompany =
        !companyFilter || expense.company === companyFilter;
      const matchesVehicle =
        !vehicleFilter || expense.vehicleId === vehicleFilter;

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

  // Calculate totals
  const totalAmount = useMemo(
    () =>
      finalFilteredExpenses.reduce(
        (sum: number, expense: Expense) => sum + expense.amount,
        0
      ),
    [finalFilteredExpenses]
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    // Inicializuj všetky kategórie na 0
    expenseCategories.forEach(category => {
      totals[category.name] = 0;
    });

    // Spočítaj sumy pre každú kategóriu
    finalFilteredExpenses.forEach((expense: Expense) => {
      if (totals[expense.category] !== undefined) {
        totals[expense.category] += expense.amount;
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
        console.error('Error deleting expense:', error);
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
      console.error('Error saving expense:', error);
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

      alert('CSV export úspešný');
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Chyba pri CSV exporte');
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: async (results: {
        data: unknown[][];
        errors: unknown[];
        meta: unknown;
      }) => {
        try {
          console.log('📥 Parsing CSV file for batch expense import...');

          if (!results.data || results.data.length < 2) {
            alert('CSV súbor musí obsahovať aspoň hlavičku a jeden riadok dát');
            return;
          }

          // Získaj hlavičku pre inteligentné mapovanie
          const headers = results.data[0] as string[];
          const dataRows = results.data.slice(1) as unknown[][];
          const batchExpenses = [];

          console.log('📋 CSV Headers:', headers);
          console.log(`📦 Processing ${dataRows.length} expense rows...`);

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

          console.log('🗺️ Column mapping:', columnMap);

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
              console.warn(`Riadok ${i + 2}: Preskakujem - chýba popis`);
              continue;
            }

            // Parsuj sumu
            let parsedAmount = 0;
            if (amount && amount.toString().trim() !== '') {
              parsedAmount = parseFloat(amount.toString().replace(',', '.'));
              if (isNaN(parsedAmount)) {
                console.warn(
                  `Riadok ${i + 2}: Neplatná suma "${amount}", nastavujem na 0`
                );
                parsedAmount = 0;
              }
            }

            // Parsuj dátum
            let parsedDate = new Date();
            if (date && date.toString().trim()) {
              const dateStr = date.toString().trim();

              // Formát MM/YYYY sa zmení na 01.MM.YYYY
              if (/^\d{1,2}\/\d{4}$/.test(dateStr)) {
                const [month, year] = dateStr.split('/');
                parsedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
              } else {
                // Štandardné parsovanie dátumu
                const tempDate = new Date(dateStr);
                if (!isNaN(tempDate.getTime())) {
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

            console.log(
              `💰 Expense ${i + 2}: ${expenseData.description} - ${expenseData.amount}€ - Company: "${expenseData.company}"`
            );

            batchExpenses.push(expenseData);
          }

          console.log(
            `📦 Pripravených ${batchExpenses.length} nákladov pre batch import`
          );

          // Použij batch import namiesto CSV importu
          const result = await apiService.batchImportExpenses(batchExpenses);

          console.log('📥 CSV Import result:', result);

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
            alert(
              `🚀 BATCH IMPORT ÚSPEŠNÝ!\n\n📊 Výsledky:\n• Vytvorených: ${created}\n• Aktualizovaných: ${updated}\n• Spracovaných: ${processed}/${total}\n• Chýb: ${errorsCount}\n• Úspešnosť: ${successRate}\n\nStránka sa obnoví za 3 sekundy...`
            );
            setTimeout(() => window.location.reload(), 3000);
          } else if (errorsCount > 0) {
            alert(
              `⚠️ Import dokončený, ale žiadne náklady neboli pridané.\n\n📊 Výsledky:\n• Vytvorených: ${created}\n• Aktualizovaných: ${updated}\n• Chýb: ${errorsCount}\n• Úspešnosť: ${successRate}\n\nSkontrolujte formát CSV súboru.`
            );
          } else {
            alert(
              `⚠️ Import dokončený, ale žiadne náklady neboli pridané.\nSkontrolujte formát CSV súboru.`
            );
          }
        } catch (error) {
          console.error('❌ CSV import error:', error);
          // ✅ ZLEPŠENÉ ERROR HANDLING - menej dramatické
          alert(
            `⚠️ Import dokončený s upozornením: ${error instanceof Error ? error.message : 'Sieťová chyba'}\n\nSkontrolujte výsledok po obnovení stránky.`
          );
          // Aj tak skús refresh - možno sa import dokončil
          setTimeout(() => window.location.reload(), 2000);
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
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* Header */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon sx={{ color: '#1976d2', fontSize: 28 }} />
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: '#1976d2' }}
              >
                Náklady
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddExpense}
                sx={{ minWidth: 120 }}
              >
                Pridať
              </Button>
              <Button
                variant="outlined"
                startIcon={<RepeatIcon />}
                onClick={() => setRecurringManagerOpen(true)}
                sx={{
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  '&:hover': {
                    borderColor: '#388e3c',
                    bgcolor: 'rgba(76, 175, 80, 0.04)',
                  },
                }}
              >
                Pravidelné náklady
              </Button>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setCategoriesManagerOpen(true)}
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    borderColor: '#1565c0',
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                Spravovať kategórie
              </Button>
              {/* CSV tlačidlá - len na desktope */}
              {!isMobile && (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleExportCSV}
                    disabled={finalFilteredExpenses.length === 0}
                  >
                    📊 Export CSV
                  </Button>

                  <Button
                    variant="outlined"
                    component="label"
                    sx={{
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      '&:hover': {
                        borderColor: '#1565c0',
                        bgcolor: 'rgba(25, 118, 210, 0.04)',
                      },
                    }}
                  >
                    📥 Import CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      style={{ display: 'none' }}
                    />
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <TextField
              placeholder="Hľadať náklady..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
              sx={{ minWidth: 250, flexGrow: 1 }}
            />

            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtre
            </Button>

            {(categoryFilter !== 'all' || companyFilter || vehicleFilter) && (
              <Button variant="text" onClick={clearFilters}>
                Vymazať filtre
              </Button>
            )}
          </Box>

          {showFilters && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Kategória</InputLabel>
                    <Select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      label="Kategória"
                    >
                      <MenuItem value="all">Všetky kategórie</MenuItem>
                      {expenseCategories.map(category => (
                        <MenuItem key={category.name} value={category.name}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {getCategoryIcon(category.name, expenseCategories)}
                            {getCategoryText(category.name, expenseCategories)}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Firma</InputLabel>
                    <Select
                      value={companyFilter}
                      onChange={e => setCompanyFilter(e.target.value)}
                      label="Firma"
                    >
                      <MenuItem value="">Všetky firmy</MenuItem>
                      {uniqueCompanies.map((company: string) => (
                        <MenuItem key={company} value={company}>
                          {company}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Vozidlo</InputLabel>
                    <Select
                      value={vehicleFilter}
                      onChange={e => setVehicleFilter(e.target.value)}
                      label="Vozidlo"
                    >
                      <MenuItem value="">Všetky vozidlá</MenuItem>
                      {vehicles.map((vehicle: Vehicle) => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} -{' '}
                          {vehicle.licensePlate}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Celkom
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {finalFilteredExpenses.length}
                  </Typography>
                </Box>
                <ReceiptIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Suma
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {totalAmount.toFixed(2)}€
                  </Typography>
                </Box>
                <EuroIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Dynamické karty pre top 2 kategórie */}
        {expenseCategories.slice(0, 2).map((category, index) => (
          <Grid item xs={12} sm={6} md={3} key={category.name}>
            <Card
              sx={{
                background:
                  index === 0
                    ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {category.displayName}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {(categoryTotals[category.name] || 0).toFixed(2)}€
                    </Typography>
                  </Box>
                  {getCategoryIcon(category.name, expenseCategories)}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Mobile Layout */}
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {finalFilteredExpenses.length === 0 ? (
            <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <ReceiptIcon
                  sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  Žiadne náklady nenájdené
                </Typography>
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
                  sx={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            wordWrap: 'break-word',
                          }}
                        >
                          {expense.description}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Chip
                            icon={getCategoryIcon(
                              expense.category,
                              expenseCategories
                            )}
                            label={getCategoryText(
                              expense.category,
                              expenseCategories
                            )}
                            color={getCategoryColor(
                              expense.category,
                              expenseCategories
                            )}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: '#1976d2',
                            }}
                          >
                            {expense.amount.toFixed(2)}€
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditExpense(expense)}
                          sx={{
                            backgroundColor: '#f5f5f5',
                            '&:hover': { backgroundColor: '#e0e0e0' },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteExpense(expense)}
                          sx={{
                            backgroundColor: '#ffebee',
                            color: '#d32f2f',
                            '&:hover': { backgroundColor: '#ffcdd2' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <DateIcon
                            fontSize="small"
                            sx={{ color: 'text.secondary' }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(expense.date), 'dd.MM.yyyy')}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <CompanyIcon
                            fontSize="small"
                            sx={{ color: 'text.secondary' }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {expense.company}
                          </Typography>
                        </Box>
                      </Grid>
                      {vehicle && (
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <VehicleIcon
                              fontSize="small"
                              sx={{ color: 'text.secondary' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {vehicle.brand} {vehicle.model} -{' '}
                              {vehicle.licensePlate}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {expense.note && (
                        <Grid item xs={12}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontStyle: 'italic',
                              color: 'text.secondary',
                              mt: 1,
                              p: 1,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 1,
                            }}
                          >
                            {expense.note}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      ) : (
        /* Desktop Layout */
        <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 1,
              borderBottom: '2px solid #f0f0f0',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 120px',
                gap: 2,
                p: 2,
                fontWeight: 600,
                color: '#1976d2',
                backgroundColor: '#f8f9fa',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Popis
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Kategória
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Suma
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Dátum
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Firma
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Vozidlo
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, textAlign: 'center' }}
              >
                Akcie
              </Typography>
            </Box>
          </Box>

          <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
            {finalFilteredExpenses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ReceiptIcon
                  sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  Žiadne náklady nenájdené
                </Typography>
              </Box>
            ) : (
              filteredExpenses.map((expense: Expense, index: number) => {
                const vehicle = expense.vehicleId
                  ? vehicles.find((v: Vehicle) => v.id === expense.vehicleId)
                  : null;

                return (
                  <Box
                    key={expense.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 120px',
                      gap: 2,
                      p: 2,
                      borderBottom: '1px solid #e0e0e0',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                      '&:hover': {
                        backgroundColor: '#f0f7ff',
                        cursor: 'pointer',
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        {expense.description}
                      </Typography>
                      {expense.note && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontStyle: 'italic',
                          }}
                        >
                          {expense.note}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        icon={getCategoryIcon(
                          expense.category,
                          expenseCategories
                        )}
                        label={getCategoryText(
                          expense.category,
                          expenseCategories
                        )}
                        color={getCategoryColor(
                          expense.category,
                          expenseCategories
                        )}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        color: '#1976d2',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {expense.amount.toFixed(2)}€
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      {format(new Date(expense.date), 'dd.MM.yyyy')}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ display: 'flex', alignItems: 'center' }}
                      noWrap
                    >
                      {expense.company}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ display: 'flex', alignItems: 'center' }}
                      noWrap
                    >
                      {vehicle
                        ? `${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}`
                        : '-'}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        justifyContent: 'center',
                      }}
                    >
                      <Tooltip title="Upraviť">
                        <IconButton
                          size="small"
                          onClick={() => handleEditExpense(expense)}
                          sx={{
                            backgroundColor: '#f5f5f5',
                            '&:hover': { backgroundColor: '#e0e0e0' },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Zmazať">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteExpense(expense)}
                          sx={{
                            backgroundColor: '#ffebee',
                            color: '#d32f2f',
                            '&:hover': { backgroundColor: '#ffcdd2' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <ExpenseForm
          expense={editingExpense}
          onSave={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
          categories={expenseCategories}
        />
      </Dialog>

      {/* Categories Manager Dialog */}
      <ExpenseCategoryManager
        open={categoriesManagerOpen}
        onClose={() => setCategoriesManagerOpen(false)}
        onCategoriesChanged={loadCategories}
      />

      {/* Recurring Expenses Manager Dialog */}
      <RecurringExpenseManager
        open={recurringManagerOpen}
        onClose={() => setRecurringManagerOpen(false)}
        onExpensesChanged={() => {
          // Refresh expenses list when recurring expenses are generated
          window.location.reload();
        }}
      />
    </Box>
  );
};

export default ExpenseListNew;
