import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Collapse,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory } from '../../types';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import ExpenseForm from './ExpenseForm';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import useMediaQuery from '@mui/material/useMediaQuery';
import { v4 as uuidv4 } from 'uuid';

const getCategoryText = (category: ExpenseCategory) => {
  switch (category) {
    case 'service':
      return 'Servis';
    case 'insurance':
      return 'Poistenie';
    case 'fuel':
      return 'Palivo';
    case 'other':
      return 'Iné';
    default:
      return category;
  }
};

const getCategoryColor = (category: ExpenseCategory) => {
  switch (category) {
    case 'service':
      return 'warning';
    case 'insurance':
      return 'info';
    case 'fuel':
      return 'success';
    case 'other':
      return 'default';
    default:
      return 'default';
  }
};

export default function ExpenseList() {
  const { state, dispatch, createExpense, updateExpense, deleteExpense } = useApp();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountFrom, setFilterAmountFrom] = useState('');
  const [filterAmountTo, setFilterAmountTo] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistoryExpense, setSelectedHistoryExpense] = useState<Expense | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Hook na detekciu mobilu
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleShowHistory = (expense: Expense) => {
    setSelectedHistoryExpense(expense);
  };
  const handleCloseHistory = () => {
    setSelectedHistoryExpense(null);
  };

  const filteredExpenses = state.expenses.filter((expense) => {
    if (filterVehicle && expense.vehicleId !== filterVehicle) return false;
    if (filterCompany && expense.company !== filterCompany) return false;
    if (filterCategory && expense.category !== filterCategory) return false;
    if (filterDateFrom && new Date(expense.date) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(expense.date) > new Date(filterDateTo)) return false;
    if (filterAmountFrom && expense.amount < parseFloat(filterAmountFrom)) return false;
    if (filterAmountTo && expense.amount > parseFloat(filterAmountTo)) return false;
    if (filterDescription && !expense.description.toLowerCase().includes(filterDescription.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !expense.description.toLowerCase().includes(q) &&
        !expense.company.toLowerCase().includes(q) &&
        !(expense.note || '').toLowerCase().includes(q) &&
        !(state.vehicles.find(v => v.id === expense.vehicleId)?.licensePlate || '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleAdd = () => {
    setEditingExpense(null);
    setOpenDialog(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať tento náklad?')) {
      try {
        await deleteExpense(id);
      } catch (error) {
        console.error('Chyba pri mazaní nákladu:', error);
        alert('Chyba pri mazaní nákladu');
      }
    }
  };

  const handleSave = async (expense: Expense) => {
    try {
      if (editingExpense) {
        await updateExpense(expense);
      } else {
        await createExpense(expense);
      }
      setOpenDialog(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Chyba pri ukladaní nákladu:', error);
      alert('Chyba pri ukladaní nákladu');
    }
  };

  const totalExpenses = state.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const expensesWithPrice = state.expenses.filter(e => e.amount > 0);
  const expensesWithoutPrice = state.expenses.filter(e => !e.amount || e.amount === 0);

  // Export nákladov do CSV
  function exportExpensesToCSV(expenses: Expense[]) {
    // Stĺpce v CSV súbori:
    // - id: unikátne ID nákladu
    // - description: popis nákladu
    // - amount: suma v €
    // - date: dátum (formát MM/yyyy - napr. 01/2025, 12/2025)
    // - category: kategória (service/insurance/fuel/other)
    // - company: firma
    // - vehicleId: ID vozidla (voliteľné)
    // - vehicleLicensePlate: ŠPZ vozidla (voliteľné)
    // - note: poznámka k nákladu (voliteľné)
    const header = [
      'id','description','amount','date','category','company','vehicleId','vehicleLicensePlate','note'
    ];
    const rows = expenses.map(e => [
      e.id,
      e.description,
      e.amount,
      e.date instanceof Date ? format(e.date, 'MM/yyyy') : e.date,
      e.category,
      e.company,
      e.vehicleId || '',
      e.vehicleId ? state.vehicles.find(v => v.id === e.vehicleId)?.licensePlate || '' : '',
      e.note || '',
    ]);
    const csv = [header, ...rows].map(row => row.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'naklady.csv');
  }

  // Import nákladov z CSV
  function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ReturnType<typeof Papa.parse>) => {
        try {
          console.log('CSV data:', results.data); // Debug log
          
          // Parsuje dátumy z rôznych formátov  
          const parseDate = (dateStr: string) => {
            if (!dateStr) return new Date();
            
            // Formát dd.M. (napr. 24.1.) - pridať automaticky rok 2025
            if (dateStr.includes('.')) {
              const parts = dateStr.split('.');
              if (parts.length >= 2) {
                const day = Number(parts[0]);
                const month = Number(parts[1]) - 1; // mesiac je 0-indexovaný
                const year = parts.length > 2 && parts[2] ? Number(parts[2]) : 2025; // automaticky 2025 ak nie je uvedený
                return new Date(year, month, day);
              }
            }
            
            // Formát MM/yyyy (napr. 01/2025)
            const parts = dateStr.split('/');
            if (parts.length === 2) {
              const month = Number(parts[0]) - 1; // mesiac je 0-indexovaný
              const year = Number(parts[1]);
              return new Date(year, month, 1); // nastaví na prvý deň mesiaca
            } else if (parts.length === 3) {
              // Formát dd/MM/yyyy - ak je tam aj deň
              const day = Number(parts[0]);
              const month = Number(parts[1]) - 1;
              const year = Number(parts[2]);
              return new Date(year, month, day);
            }
            return new Date(dateStr);
          };

          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];
          
          // Spracujeme každý riadok postupne s error handlingom
          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i] as any;
            
            try {
              // Preskočíme prázdne riadky
              if (!row.description && !row.amount && !row.date) {
                console.log(`Preskakujem prázdny riadok ${i + 1}`);
                continue;
              }

              // Nájde vozidlo podľa ŠPZ ak je zadané
              let vehicleId = undefined;
              
              // Ak je zadané vehicleId, skontroluj, či je to správne UUID
              if (row.vehicleId) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(row.vehicleId)) {
                  vehicleId = row.vehicleId;
                }
              }
              
              // Ak nie je správne UUID, pokús sa nájsť vozidlo podľa ŠPZ
              if (!vehicleId && row.vehicleLicensePlate) {
                const vehicle = state.vehicles.find(v => v.licensePlate === row.vehicleLicensePlate);
                vehicleId = vehicle?.id;
              }

              // Validácia dátumu
              const parsedDate = parseDate(row.date);
              if (!parsedDate || isNaN(parsedDate.getTime())) {
                throw new Error(`Neplatný dátum: ${row.date}`);
              }

              // Validácia amount
              const parsedAmount = row.amount ? Number(row.amount) : 0;
              if (isNaN(parsedAmount)) {
                throw new Error(`Neplatná suma: ${row.amount}`);
              }

              const expense = {
                id: row.id || uuidv4(),
                description: (row.description && row.description.trim()) || 'Bez popisu',
                amount: parsedAmount,
                date: parsedDate,
                category: (row.category && row.category.trim()) || 'other',
                company: (row.company && row.company.trim()) || 'Neznáma firma',
                vehicleId: vehicleId,
                note: (row.note && row.note.trim()) || undefined,
              };

              console.log(`Spracovávam riadok ${i + 1}:`, expense);
              console.log(`Povinné polia check - description: "${expense.description}", company: "${expense.company}", category: "${expense.category}", date: ${expense.date}`);
              await createExpense(expense);
              successCount++;
              
            } catch (error: any) {
              errorCount++;
              const errorMsg = `Riadok ${i + 1}: ${error.message}`;
              errors.push(errorMsg);
              console.error(`Chyba v riadku ${i + 1}:`, error, 'Row data:', {
                description: row.description,
                amount: row.amount,
                date: row.date,
                category: row.category,
                company: row.company,
                vehicleId: row.vehicleId,
                vehicleLicensePlate: row.vehicleLicensePlate,
                note: row.note
              });
            }
          }
          
          setImportError('');
          
          let message = `Import dokončený!\n\n`;
          message += `✅ Úspešne importované: ${successCount}\n`;
          if (errorCount > 0) {
            message += `❌ Chyby: ${errorCount}\n\n`;
            message += `Problémy:\n${errors.slice(0, 5).join('\n')}`;
            if (errors.length > 5) {
              message += `\n... a ďalších ${errors.length - 5} chýb`;
            }
          }
          
          alert(message);
          
        } catch (err: any) {
          setImportError('Chyba pri importe CSV: ' + err.message);
          console.error('Import error:', err);
        }
      },
      error: (err: any) => setImportError('Chyba pri čítaní CSV: ' + err.message)
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Výber všetkých/žiadnych nákladov
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(filteredExpenses.map(e => e.id));
    } else {
      setSelected([]);
    }
  };

  // Výber jedného nákladu
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelected(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  // Hromadné mazanie
  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (window.confirm(`Naozaj chcete vymazať ${selected.length} označených nákladov?`)) {
      try {
        // Maže každý náklad postupne cez API
        for (const id of selected) {
          await deleteExpense(id);
        }
        setSelected([]);
      } catch (error) {
        console.error('Chyba pri hromadnom mazaní nákladov:', error);
        alert('Chyba pri hromadnom mazaní nákladov');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Náklady</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ 
              minWidth: isMobile ? 'auto' : 'auto',
              px: isMobile ? 2 : 3
            }}
          >
            {isMobile ? 'Pridať' : 'Pridať náklad'}
          </Button>
          
          {/* Desktop tlačidlá */}
          {!isMobile && (
            <>
              <Button
                variant="outlined"
                onClick={() => exportExpensesToCSV(state.expenses)}
              >
                Export nákladov
              </Button>
              <Button
                variant="outlined"
                component="label"
              >
                Import nákladov
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImportCSV}
                />
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteSelected}
                disabled={selected.length === 0}
              >
                Vymazať označené
              </Button>
            </>
          )}
        </Box>
      </Box>

      {importError && (
        <Box sx={{ color: 'error.main', mb: 2 }}>{importError}</Box>
      )}

      {/* Filtre */}
      {isMobile ? (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
            sx={{ mb: 1 }}
          >
            {isMobileFiltersOpen ? 'Skryť filtre' : 'Zobraziť filtre'}
          </Button>
          <Collapse in={isMobileFiltersOpen}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Vozidlo</InputLabel>
                    <Select
                      value={filterVehicle}
                      label="Vozidlo"
                      onChange={e => setFilterVehicle(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      {state.vehicles.map(vehicle => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Firma</InputLabel>
                    <Select
                      value={filterCompany}
                      label="Firma"
                      onChange={e => setFilterCompany(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      {Array.from(new Set([
                        ...state.companies.map(c => c.name),
                        ...state.vehicles.map(v => v.company),
                        ...state.expenses.map(e => e.company)
                      ])).filter(Boolean).sort((a, b) => a.localeCompare(b)).map(company => (
                        <MenuItem key={company} value={company}>{company}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Kategória</InputLabel>
                    <Select
                      value={filterCategory}
                      label="Kategória"
                      onChange={e => setFilterCategory(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      <MenuItem value="service">Servis</MenuItem>
                      <MenuItem value="insurance">Poistenie</MenuItem>
                      <MenuItem value="fuel">Palivo</MenuItem>
                      <MenuItem value="other">Iné</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Dátum od"
                    type="date"
                    value={filterDateFrom}
                    onChange={e => setFilterDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    label="Dátum do"
                    type="date"
                    value={filterDateTo}
                    onChange={e => setFilterDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    label="Suma od"
                    type="number"
                    value={filterAmountFrom}
                    onChange={e => setFilterAmountFrom(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Suma do"
                    type="number"
                    value={filterAmountTo}
                    onChange={e => setFilterAmountTo(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Popis"
                    value={filterDescription}
                    onChange={e => setFilterDescription(e.target.value)}
                  />
                </Box>
              </CardContent>
            </Card>
          </Collapse>
        </Box>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(7, 1fr)' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Vozidlo</InputLabel>
                <Select
                  value={filterVehicle}
                  label="Vozidlo"
                  onChange={e => setFilterVehicle(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  {state.vehicles.map(vehicle => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Firma</InputLabel>
                <Select
                  value={filterCompany}
                  label="Firma"
                  onChange={e => setFilterCompany(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  {Array.from(new Set([
                    ...state.companies.map(c => c.name),
                    ...state.vehicles.map(v => v.company),
                    ...state.expenses.map(e => e.company)
                  ])).filter(Boolean).sort((a, b) => a.localeCompare(b)).map(company => (
                    <MenuItem key={company} value={company}>{company}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Kategória</InputLabel>
                <Select
                  value={filterCategory}
                  label="Kategória"
                  onChange={e => setFilterCategory(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  <MenuItem value="service">Servis</MenuItem>
                  <MenuItem value="insurance">Poistenie</MenuItem>
                  <MenuItem value="fuel">Palivo</MenuItem>
                  <MenuItem value="other">Iné</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Dátum od"
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Dátum do"
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Suma od"
                type="number"
                value={filterAmountFrom}
                onChange={e => setFilterAmountFrom(e.target.value)}
              />
              <TextField
                fullWidth
                label="Suma do"
                type="number"
                value={filterAmountTo}
                onChange={e => setFilterAmountTo(e.target.value)}
              />
              <TextField
                fullWidth
                label="Popis"
                value={filterDescription}
                onChange={e => setFilterDescription(e.target.value)}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Vyhľadávacie pole */}
      <Box sx={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end', mb: 2 }}>
        <TextField
          label={isMobile ? "Vyhľadávanie..." : "Rýchle vyhľadávanie (popis, firma, ŠPZ, poznámka)"}
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{ 
            minWidth: isMobile ? '100%' : 320,
            '& .MuiOutlinedInput-root': {
              borderRadius: isMobile ? 2 : 1
            }
          }}
          placeholder={isMobile ? "Popis, firma, ŠPZ, poznámka..." : undefined}
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Celkové náklady: <strong>{totalExpenses.toFixed(2)} €</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            {expensesWithPrice.length} nákladov s cenou • {expensesWithoutPrice.length} nákladov bez ceny
          </Typography>
        </CardContent>
      </Card>

      {/* Mobilné zobrazenie - karty */}
      {isMobile ? (
        <Box>
          {filteredExpenses.map((expense) => (
            <Card 
              key={expense.id} 
              sx={{ 
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: '#fff',
                '&:hover': { 
                  boxShadow: 3,
                  transform: 'translateY(-1px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            >
              <CardContent sx={{ p: 2 }}>
                {/* Hlavička karty */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5, color: '#111' }}>
                      {expense.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#444' }}>
                      {expense.company} • {format(expense.date, 'dd.MM.yyyy', { locale: sk })}
                    </Typography>
                  </Box>
                  <Chip 
                    label={getCategoryText(expense.category)} 
                    color={getCategoryColor(expense.category) as any} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>

                {/* Finančné informácie */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#444' }}>
                      Suma
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: expense.amount > 0 ? 'error.main' : '#999' }}>
                      {expense.amount > 0 ? 
                        `${expense.amount.toFixed(2)} €` : 
                        'Bez ceny'
                      }
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ color: '#444' }}>
                      Vozidlo
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ color: '#111' }}>
                      {expense.vehicleId ? 
                        state.vehicles.find(v => v.id === expense.vehicleId)?.licensePlate || 'N/A' 
                        : 'Všetky vozidlá'
                      }
                    </Typography>
                  </Box>
                </Box>

                {/* Poznámka */}
                {expense.note && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#444' }}>
                      Poznámka
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      p: 1, 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 1,
                      fontStyle: 'italic',
                      color: '#222'
                    }}>
                      {expense.note}
                    </Typography>
                  </Box>
                )}

                {/* Akčné tlačidlá */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                  <IconButton 
                    size="medium" 
                    onClick={(e) => { e.stopPropagation(); handleShowHistory(expense); }} 
                    sx={{ 
                      color: 'white',
                      bgcolor: 'info.main',
                      border: '1px solid',
                      borderColor: 'info.main',
                      '&:hover': { 
                        bgcolor: 'info.dark', 
                        borderColor: 'info.dark',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    title="História zmien"
                  >
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="medium" 
                    onClick={(e) => { e.stopPropagation(); handleEdit(expense); }} 
                    sx={{ 
                      color: 'white',
                      bgcolor: 'primary.main',
                      border: '1px solid',
                      borderColor: 'primary.main',
                      '&:hover': { 
                        bgcolor: 'primary.dark', 
                        borderColor: 'primary.dark',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="medium" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }} 
                    sx={{ 
                      color: 'white',
                      bgcolor: 'error.main',
                      border: '1px solid',
                      borderColor: 'error.main',
                      '&:hover': { 
                        bgcolor: 'error.dark', 
                        borderColor: 'error.dark',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Card>
          <CardContent>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.length === filteredExpenses.length && filteredExpenses.length > 0}
                        indeterminate={selected.length > 0 && selected.length < filteredExpenses.length}
                        onChange={e => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Popis</TableCell>
                    <TableCell>Suma (€)</TableCell>
                    <TableCell>Dátum</TableCell>
                    <TableCell>Kategória</TableCell>
                    <TableCell>Firma</TableCell>
                    <TableCell>Vozidlo</TableCell>
                    <TableCell>Poznámka</TableCell>
                    <TableCell>Akcie</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} selected={selected.includes(expense.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.includes(expense.id)}
                          onChange={e => handleSelectOne(expense.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        {expense.amount > 0 ? 
                          `${expense.amount.toFixed(2)} €` : 
                          <span style={{ color: '#999', fontStyle: 'italic' }}>Bez ceny</span>
                        }
                      </TableCell>
                      <TableCell>
                        {format(expense.date, 'dd.MM.yyyy', { locale: sk })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getCategoryText(expense.category)}
                          color={getCategoryColor(expense.category) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{expense.company}</TableCell>
                      <TableCell>
                        {expense.vehicleId ? 
                          state.vehicles.find(v => v.id === expense.vehicleId)?.licensePlate || 'N/A' 
                          : 'Všetky vozidlá'
                        }
                      </TableCell>
                      <TableCell>
                        {expense.note ? (
                          <Box sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                            {expense.note}
                          </Box>
                        ) : (
                          <span style={{ color: '#999', fontStyle: 'italic' }}>Žiadna poznámka</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={e => { e.stopPropagation(); handleShowHistory(expense); }}
                          sx={{ color: 'info.main' }}
                          title="História zmien"
                        >
                          <HistoryIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(expense)}
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(expense.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingExpense ? 'Upraviť náklad' : 'Pridať nový náklad'}
        </DialogTitle>
        <DialogContent>
          <ExpenseForm
            expense={editingExpense}
            onSave={handleSave}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedHistoryExpense}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>História zmien nákladu</DialogTitle>
        <DialogContent>
          {(selectedHistoryExpense as any)?.history && (selectedHistoryExpense as any).history.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Dátum</TableCell>
                  <TableCell>Používateľ</TableCell>
                  <TableCell>Zmeny</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedHistoryExpense as any).history.map((entry: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{new Date(entry.date).toLocaleString()}</TableCell>
                    <TableCell>{entry.user}</TableCell>
                    <TableCell>
                      {entry.changes.map((c: any, i: number) => (
                        <div key={i}>
                          <b>{c.field}:</b> {String(c.oldValue)} → {String(c.newValue)}
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography>Žiadne zmeny.</Typography>
          )}
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <Button onClick={handleCloseHistory} variant="outlined">Zavrieť</Button>
        </Box>
      </Dialog>

      {/* Plávajúce tlačidlo pre mobil */}
      {isMobile && (
        <Fab 
          color="primary" 
          aria-label="Pridať náklad"
          onClick={handleAdd}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 1201,
            boxShadow: 4,
            width: 56,
            height: 56
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
} 