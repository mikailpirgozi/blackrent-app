import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  IconButton,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Grid,
  useMediaQuery,
  useTheme,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Receipt as ReceiptIcon,
  LocalGasStation as FuelIcon,
  Build as ServiceIcon,
  Security as InsuranceIcon,
  Category as OtherIcon,
  DateRange as DateIcon,
  Euro as EuroIcon,
  Business as CompanyIcon,
  DirectionsCar as VehicleIcon
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory } from '../../types';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import ExpenseForm from './ExpenseForm';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Vehicle } from '../../types';

const getCategoryIcon = (category: ExpenseCategory) => {
  switch (category) {
    case 'fuel': return <FuelIcon fontSize="small" />;
    case 'service': return <ServiceIcon fontSize="small" />;
    case 'insurance': return <InsuranceIcon fontSize="small" />;
    case 'other': return <OtherIcon fontSize="small" />;
    default: return <ReceiptIcon fontSize="small" />;
  }
};

const getCategoryText = (category: ExpenseCategory) => {
  switch (category) {
    case 'fuel': return 'Palivo';
    case 'service': return 'Servis';
    case 'insurance': return 'Poistenie';
    case 'other': return 'Ostatné';
    default: return category;
  }
};

const getCategoryColor = (category: ExpenseCategory): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
  switch (category) {
    case 'fuel': return 'warning';
    case 'service': return 'error';
    case 'insurance': return 'info';
    case 'other': return 'secondary';
    default: return 'primary';
  }
};

const ExpenseListNew: React.FC = () => {
  const { 
    getFilteredExpenses, 
    getFilteredVehicles, 
    deleteExpense, 
    createExpense, 
    updateExpense 
  } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  // Get data from context
  const expenses = getFilteredExpenses();
  const vehicles = getFilteredVehicles();

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);

  // Get unique values for filters
  const uniqueCompanies = useMemo(() => 
    Array.from(new Set(expenses.map((e: Expense) => e.company).filter(Boolean))).sort(),
    [expenses]
  );

  const uniqueCategories: ExpenseCategory[] = ['fuel', 'service', 'insurance', 'other'];

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense: Expense) => {
      const matchesSearch = !searchQuery || 
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      const matchesCompany = !companyFilter || expense.company === companyFilter;
      const matchesVehicle = !vehicleFilter || expense.vehicleId === vehicleFilter;
      
      return matchesSearch && matchesCategory && matchesCompany && matchesVehicle;
    });
  }, [expenses, searchQuery, categoryFilter, companyFilter, vehicleFilter]);

  // Calculate totals
  const totalAmount = useMemo(() => 
    filteredExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0),
    [filteredExpenses]
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      fuel: 0,
      service: 0,
      insurance: 0,
      other: 0
    };
    
    filteredExpenses.forEach((expense: Expense) => {
      totals[expense.category] += expense.amount;
    });
    
    return totals;
  }, [filteredExpenses]);

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
    if (window.confirm(`Naozaj chcete zmazať náklad "${expense.description}"?`)) {
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

  const handleExportCSV = () => {
    const csvData = filteredExpenses.map((expense: Expense) => ({
      'Dátum': format(new Date(expense.date), 'dd.MM.yyyy'),
      'Popis': expense.description,
      'Kategória': getCategoryText(expense.category),
      'Suma': expense.amount,
      'Firma': expense.company,
      'Vozidlo': expense.vehicleId ? vehicles.find((v: Vehicle) => v.id === expense.vehicleId)?.licensePlate || expense.vehicleId : '',
      'Poznámka': expense.note || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `naklady-${format(new Date(), 'yyyy-MM-dd')}.csv`);
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
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon sx={{ color: '#1976d2', fontSize: 28 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
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
                onClick={handleExportCSV}
                disabled={filteredExpenses.length === 0}
              >
                Export CSV
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Hľadať náklady..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
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
                      onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
                      label="Kategória"
                    >
                      <MenuItem value="all">Všetky kategórie</MenuItem>
                      {uniqueCategories.map(category => (
                        <MenuItem key={category} value={category}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getCategoryIcon(category)}
                            {getCategoryText(category)}
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
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      label="Firma"
                    >
                      <MenuItem value="">Všetky firmy</MenuItem>
                      {uniqueCompanies.map((company: string) => (
                        <MenuItem key={company} value={company}>{company}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Vozidlo</InputLabel>
                    <Select
                      value={vehicleFilter}
                      onChange={(e) => setVehicleFilter(e.target.value)}
                      label="Vozidlo"
                    >
                      <MenuItem value="">Všetky vozidlá</MenuItem>
                      {vehicles.map((vehicle: Vehicle) => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
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
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Celkom
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {filteredExpenses.length}
                  </Typography>
                </Box>
                <ReceiptIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Palivo
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {categoryTotals.fuel.toFixed(2)}€
                  </Typography>
                </Box>
                <FuelIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Servis
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {categoryTotals.service.toFixed(2)}€
                  </Typography>
                </Box>
                <ServiceIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Mobile Layout */}
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredExpenses.length === 0 ? (
            <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Žiadne náklady nenájdené
                </Typography>
              </CardContent>
            </Card>
          ) : (
            filteredExpenses.map((expense: Expense) => {
              const vehicle = expense.vehicleId ? vehicles.find((v: Vehicle) => v.id === expense.vehicleId) : null;
              
              return (
                <Card key={expense.id} sx={{ 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease'
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600, 
                          mb: 0.5,
                          wordWrap: 'break-word'
                        }}>
                          {expense.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            icon={getCategoryIcon(expense.category)}
                            label={getCategoryText(expense.category)}
                            color={getCategoryColor(expense.category)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: '#1976d2' 
                          }}>
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
                            '&:hover': { backgroundColor: '#e0e0e0' }
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
                            '&:hover': { backgroundColor: '#ffcdd2' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DateIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(expense.date), 'dd.MM.yyyy')}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CompanyIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {expense.company}
                          </Typography>
                        </Box>
                      </Grid>
                      {vehicle && (
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <VehicleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {expense.note && (
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ 
                            fontStyle: 'italic',
                            color: 'text.secondary',
                            mt: 1,
                            p: 1,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1
                          }}>
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
          <Box sx={{ 
            position: 'sticky', 
            top: 0, 
            backgroundColor: 'white', 
            zIndex: 1,
            borderBottom: '2px solid #f0f0f0'
          }}>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 120px',
              gap: 2,
              p: 2,
              fontWeight: 600,
              color: '#1976d2',
              backgroundColor: '#f8f9fa'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Popis</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Kategória</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Suma</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Dátum</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Firma</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Vozidlo</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'center' }}>Akcie</Typography>
            </Box>
          </Box>
          
          <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
            {filteredExpenses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Žiadne náklady nenájdené
                </Typography>
              </Box>
            ) : (
              filteredExpenses.map((expense: Expense, index: number) => {
                const vehicle = expense.vehicleId ? vehicles.find((v: Vehicle) => v.id === expense.vehicleId) : null;
                
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
                        cursor: 'pointer'
                      },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {expense.description}
                      </Typography>
                      {expense.note && (
                        <Typography variant="body2" sx={{ 
                          color: 'text.secondary',
                          fontStyle: 'italic'
                        }}>
                          {expense.note}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip
                        icon={getCategoryIcon(expense.category)}
                        label={getCategoryText(expense.category)}
                        color={getCategoryColor(expense.category)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    
                    <Typography variant="body1" sx={{ 
                      fontWeight: 700, 
                      color: '#1976d2',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {expense.amount.toFixed(2)}€
                    </Typography>
                    
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      {format(new Date(expense.date), 'dd.MM.yyyy')}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }} noWrap>
                      {expense.company}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }} noWrap>
                      {vehicle ? `${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}` : '-'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Upraviť">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditExpense(expense)}
                          sx={{ 
                            backgroundColor: '#f5f5f5',
                            '&:hover': { backgroundColor: '#e0e0e0' }
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
                            '&:hover': { backgroundColor: '#ffcdd2' }
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
        />
      </Dialog>
    </Box>
  );
};

export default ExpenseListNew; 