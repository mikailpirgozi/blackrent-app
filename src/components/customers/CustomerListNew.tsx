import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Card,
  CardContent,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Divider,
  FormGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import CustomerForm from './CustomerForm';
import CustomerRentalHistory from './CustomerRentalHistory';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { useInfiniteCustomers } from '../../hooks/useInfiniteCustomers';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

export default function CustomerListNew() {
  const { state, createCustomer, updateCustomer, deleteCustomer, updateRental } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // States
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Filters
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [showWithEmail, setShowWithEmail] = useState(true);
  const [showWithoutEmail, setShowWithoutEmail] = useState(true);
  const [showWithPhone, setShowWithPhone] = useState(true);
  const [showWithoutPhone, setShowWithoutPhone] = useState(true);
  
  // 🚀 INFINITE SCROLL - použitie nového hooku
  const {
    customers,
    loading,
    hasMore,
    searchTerm,
    setSearchTerm,
    loadMore,
    refresh,
    updateFilters
  } = useInfiniteCustomers();

  // 🚀 Infinite scroll detection
  useInfiniteScroll(scrollContainerRef, loadMore, hasMore && !loading, 0.7);

  // Handlers
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Naozaj chcete vymazať tohto zákazníka?')) {
      try {
        await deleteCustomer(customerId);
        refresh(); // Refresh data after delete
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const handleShowHistory = (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
  };

  const handleCall = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      window.open(`mailto:${email}`, '_self');
    }
  };

  // CSV funkcionalita
  const handleExportCSV = async () => {
    try {
      const { apiService } = await import('../../services/api');
      const blob = await apiService.exportCustomersCSV();
      const filename = `zakaznici-${new Date().toISOString().split('T')[0]}.csv`;
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
      complete: async (results: any) => {
        try {
          // Konvertuj parsované dáta späť na CSV string
          const csvString = Papa.unparse(results.data);
          
          const { apiService } = await import('../../services/api');
          const result = await apiService.importCustomersCSV(csvString);
          
          if (result.success) {
            alert(result.message);
            // Refresh customer list - force reload
            window.location.reload();
          } else {
            alert(result.error || 'Chyba pri importe');
          }
        } catch (error) {
          console.error('CSV import error:', error);
          alert('Chyba pri CSV importe');
        }
      },
      header: false,
      skipEmptyLines: true
    });
    
    // Reset input
    event.target.value = '';
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
  };

  const handleSubmit = async (customerData: Customer) => {
    try {
      if (editingCustomer) {
        await updateCustomer(customerData);
      } else {
        await createCustomer(customerData);
      }
      handleCloseDialog();
      refresh(); // Refresh data after save
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleImportExistingCustomers = async () => {
    try {
      setLocalLoading(true);
      // Získam všetkých unikátnych zákazníkov z prenájmov
      const existingCustomerNames = Array.from(new Set(state.rentals.map(r => r.customerName).filter(Boolean)));
      
      // Filtrujem len tie, ktoré ešte neexistujú v customers
      const newCustomerNames = existingCustomerNames.filter(name => 
        !state.customers?.some(c => c.name === name)
      );
      
      if (newCustomerNames.length === 0) {
        alert('Všetci zákazníci z prenájmov už existujú v zozname zákazníkov.');
        return;
      }
      
      // Vytvorím nových zákazníkov
      const newCustomers = newCustomerNames.map(name => ({
        id: uuidv4(),
        name: name,
        email: '',
        phone: '',
        createdAt: new Date(),
      }));
      
      // Uložím ich do databázy pomocou API
      for (const customer of newCustomers) {
        await createCustomer(customer);
      }
      
      // Prepojím existujúce prenájmy so zákazníkmi
      for (const rental of state.rentals) {
        if (rental.customerName && !rental.customerId) {
          const customer = newCustomers.find(c => c.name === rental.customerName) || 
                          (state.customers || []).find(c => c.name === rental.customerName);
          if (customer) {
            await updateRental({ 
              ...rental, 
              customerId: customer.id,
              customer: customer
            });
          }
        }
      }
      
      alert(`Pridaných ${newCustomers.length} zákazníkov z existujúcich prenájmov a prepojených s prenájmi.`);
    } catch (error) {
      console.error('Chyba pri importe zákazníkov:', error);
      alert('Chyba pri importe zákazníkov');
    } finally {
      setLocalLoading(false);
    }
  };

  // 🚀 Update filters when they change
  useEffect(() => {
    const filters: any = {};
    
    // Email/Phone existence filters
    if (!showWithEmail && !showWithoutEmail) {
      // Show nothing if both are unchecked
      filters.hasEmail = 'none';
    } else if (!showWithEmail) {
      filters.hasEmail = false;
    } else if (!showWithoutEmail) {
      filters.hasEmail = true;
    }
    
    if (!showWithPhone && !showWithoutPhone) {
      // Show nothing if both are unchecked
      filters.hasPhone = 'none';
    } else if (!showWithPhone) {
      filters.hasPhone = false;
    } else if (!showWithoutPhone) {
      filters.hasPhone = true;
    }
    
    updateFilters(filters);
  }, [
    showWithEmail,
    showWithoutEmail,
    showWithPhone,
    showWithoutPhone,
    updateFilters
  ]);

  // Use customers from hook instead of filteredCustomers
  const filteredCustomers = customers;
  const customersToDisplay = customers;

  // Get customer rental count
  const getCustomerRentalCount = (customerId: string) => {
    return state.rentals.filter(rental => rental.customerId === customerId).length;
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          color: '#1976d2',
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}>
          👥 Databáza zákazníkov
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportExistingCustomers}
            size="small"
            disabled={loading}
          >
            Import z prenájmov
          </Button>
          {/* CSV tlačidlá - len na desktope */}
          {!isMobile && (
            <>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                size="small"
              >
                📊 Export CSV
              </Button>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                size="small"
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': { borderColor: '#1565c0', bgcolor: 'rgba(25, 118, 210, 0.04)' }
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
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' },
              borderRadius: 2,
              px: 3,
              py: 1
            }}
          >
            Nový zákazník
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          {/* Search Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Hľadať zákazníkov..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
              }}
              sx={{ flex: 1 }}
            />
            <IconButton
              onClick={() => setFiltersOpen(!filtersOpen)}
              sx={{ 
                bgcolor: filtersOpen ? '#1976d2' : '#f5f5f5',
                color: filtersOpen ? 'white' : '#666',
                '&:hover': { 
                  bgcolor: filtersOpen ? '#1565c0' : '#e0e0e0' 
                }
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Box>

          {/* Filters */}
          <Collapse in={filtersOpen}>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Filter meno"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Filter email"
                  value={filterEmail}
                  onChange={(e) => setFilterEmail(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Filter telefón"
                  value={filterPhone}
                  onChange={(e) => setFilterPhone(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Contact Info Checkboxes */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                Zobraziť zákazníkov:
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={<Checkbox checked={showWithEmail} onChange={(e) => setShowWithEmail(e.target.checked)} />}
                  label="S emailom"
                />
                <FormControlLabel
                  control={<Checkbox checked={showWithoutEmail} onChange={(e) => setShowWithoutEmail(e.target.checked)} />}
                  label="Bez emailu"
                />
                <FormControlLabel
                  control={<Checkbox checked={showWithPhone} onChange={(e) => setShowWithPhone(e.target.checked)} />}
                  label="S telefónom"
                />
                <FormControlLabel
                  control={<Checkbox checked={showWithoutPhone} onChange={(e) => setShowWithoutPhone(e.target.checked)} />}
                  label="Bez telefónu"
                />
              </FormGroup>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Results Count */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Zobrazených {customersToDisplay.length} z {filteredCustomers.length} zákazníkov
          {filteredCustomers.length !== state.customers.length && ` (filtrovaných z ${state.customers.length})`}
        </Typography>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Načítavam ďalších...
            </Typography>
          </Box>
        )}
        {loading && <CircularProgress size={16} />}
      </Box>

      {/* Customer List */}
      {isMobile ? (
        /* MOBILE CARDS VIEW */
        <Card sx={{ overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box 
              ref={scrollContainerRef}
              sx={{ maxHeight: '70vh', overflowY: 'auto' }}
            >
              {customersToDisplay.map((customer, index) => (
                <Box 
                  key={customer.id}
                  sx={{ 
                    display: 'flex',
                    borderBottom: index < customersToDisplay.length - 1 ? '1px solid #e0e0e0' : 'none',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    minHeight: 80,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEdit(customer)}
                >
                  {/* Customer Info - sticky left */}
                  <Box sx={{ 
                    width: { xs: 140, sm: 160 },
                    maxWidth: { xs: 140, sm: 160 },
                    p: { xs: 1, sm: 1.5 },
                    borderRight: '2px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    overflow: 'hidden'
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      color: '#1976d2',
                      lineHeight: 1.2,
                      wordWrap: 'break-word',
                      mb: { xs: 0.25, sm: 0.5 }
                    }}>
                      {customer.name}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      fontSize: { xs: '0.6rem', sm: '0.65rem' },
                      mb: { xs: 0.25, sm: 0.5 },
                      fontWeight: 600
                    }}>
                      {getCustomerRentalCount(customer.id)} prenájmov
                    </Typography>
                    <Chip
                      size="small"
                      label={format(new Date(customer.createdAt), 'dd.MM.yyyy')}
                      sx={{
                        height: { xs: 18, sm: 20 },
                        fontSize: { xs: '0.55rem', sm: '0.6rem' },
                        bgcolor: '#e3f2fd',
                        color: '#1976d2',
                        fontWeight: 700,
                        minWidth: 'auto',
                        maxWidth: '100%',
                        overflow: 'hidden'
                      }}
                    />
                  </Box>
                  
                  {/* Customer Details - scrollable right */}
                  <Box sx={{ 
                    flex: 1,
                    p: { xs: 1, sm: 1.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    minWidth: 0
                  }}>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        color: '#333',
                        mb: { xs: 0.25, sm: 0.5 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        📧 {customer.email || 'Nezadané'}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: { xs: '0.6rem', sm: '0.65rem' },
                        display: 'block',
                        mb: { xs: 0.25, sm: 0.5 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        📱 {customer.phone || 'Nezadané'}
                      </Typography>
                    </Box>
                    
                    {/* Mobile Action Buttons */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 0.5, sm: 0.75 }, 
                      mt: { xs: 1, sm: 1.5 }, 
                      justifyContent: 'flex-start',
                      flexWrap: 'wrap'
                    }}>
                      {/* Edit Button */}
                      <IconButton
                        size="small"
                        title="Upraviť zákazníka"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(customer);
                        }}
                        sx={{ 
                          bgcolor: '#2196f3', 
                          color: 'white',
                          width: { xs: 36, sm: 32 },
                          height: { xs: 36, sm: 32 },
                          '&:hover': { 
                            bgcolor: '#1976d2',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(33,150,243,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      {/* History Button */}
                      <IconButton
                        size="small"
                        title="História prenájmov"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowHistory(customer);
                        }}
                        sx={{ 
                          bgcolor: '#9c27b0', 
                          color: 'white',
                          width: { xs: 36, sm: 32 },
                          height: { xs: 36, sm: 32 },
                          '&:hover': { 
                            bgcolor: '#7b1fa2',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(156,39,176,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                      
                      {/* Phone Button */}
                      {customer.phone && (
                        <IconButton
                          size="small"
                          title="Zavolať"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(customer.phone);
                          }}
                          sx={{ 
                            bgcolor: '#4caf50', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: '#388e3c',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(76,175,80,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      )}
                      
                      {/* Email Button */}
                      {customer.email && (
                        <IconButton
                          size="small"
                          title="Poslať email"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmail(customer.email);
                          }}
                          sx={{ 
                            bgcolor: '#ff9800', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: '#f57c00',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(255,152,0,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      )}
                      
                      {/* Delete Button */}
                      <IconButton
                        size="small"
                        title="Zmazať zákazníka"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(customer.id);
                        }}
                        sx={{ 
                          bgcolor: '#f44336', 
                          color: 'white',
                          width: { xs: 36, sm: 32 },
                          height: { xs: 36, sm: 32 },
                          '&:hover': { 
                            bgcolor: '#d32f2f',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(244,67,54,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}
              
              {/* 🚀 INFINITE SCROLL: Load More Button */}
              {hasMore && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  p: 3,
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <Button
                    variant="outlined"
                    onClick={loadMore}
                    disabled={loading}
                    sx={{
                      minWidth: 200,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    {loading ? 'Načítavam...' : 'Načítať ďalšie'}
                  </Button>
                </Box>
              )}
              
              {/* Loading indicator */}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              
              {/* End of list message */}
              {!hasMore && customers.length > 0 && (
                <Box sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
                  <Typography variant="body2">Koniec zoznamu</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        /* DESKTOP TABLE VIEW */
        <Card sx={{ overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Desktop Header */}
            <Box sx={{ 
              display: 'flex',
              bgcolor: '#f8f9fa',
              borderBottom: '2px solid #e0e0e0',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              minHeight: 56
            }}>
              {/* Zákazník column */}
              <Box sx={{ 
                width: 200,
                minWidth: 200,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  👤 Zákazník
                </Typography>
              </Box>
              
              {/* Email column */}
              <Box sx={{ 
                width: 220,
                minWidth: 220,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  📧 Email
                </Typography>
              </Box>
              
              {/* Telefón column */}
              <Box sx={{ 
                width: 140,
                minWidth: 140,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  📱 Telefón
                </Typography>
              </Box>
              
              {/* Prenájmy column */}
              <Box sx={{ 
                width: 120,
                minWidth: 120,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  🚗 Prenájmy
                </Typography>
              </Box>
              
              {/* Vytvorený column */}
              <Box sx={{ 
                width: 140,
                minWidth: 140,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  📅 Vytvorený
                </Typography>
              </Box>
              
              {/* Akcie column */}
              <Box sx={{ 
                width: 180,
                minWidth: 180,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  ⚡ Akcie
                </Typography>
              </Box>
            </Box>

            {/* Desktop Customer Rows */}
            <Box 
              ref={scrollContainerRef}
              sx={{ maxHeight: '70vh', overflowY: 'auto' }}
            >
              {customersToDisplay.map((customer, index) => (
                <Box 
                  key={customer.id}
                  sx={{ 
                    display: 'flex',
                    borderBottom: index < customersToDisplay.length - 1 ? '1px solid #e0e0e0' : 'none',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    minHeight: 72,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEdit(customer)}
                >
                  {/* Zákazník column */}
                  <Box sx={{ 
                    width: 200,
                    minWidth: 200,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      color: '#1976d2',
                      mb: 0.5
                    }}>
                      {customer.name}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      fontSize: '0.7rem'
                    }}>
                      ID: {customer.id.slice(0, 8)}...
                    </Typography>
                  </Box>
                  
                  {/* Email column */}
                  <Box sx={{ 
                    width: 220,
                    minWidth: 220,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: customer.email ? '#333' : '#999',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontStyle: customer.email ? 'normal' : 'italic'
                    }}>
                      {customer.email || 'Nezadané'}
                    </Typography>
                  </Box>
                  
                  {/* Telefón column */}
                  <Box sx={{ 
                    width: 140,
                    minWidth: 140,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: customer.phone ? '#333' : '#999',
                      fontFamily: customer.phone ? 'monospace' : 'inherit',
                      fontStyle: customer.phone ? 'normal' : 'italic'
                    }}>
                      {customer.phone || 'Nezadané'}
                    </Typography>
                  </Box>
                  
                  {/* Prenájmy column */}
                  <Box sx={{ 
                    width: 120,
                    minWidth: 120,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Chip
                      size="small"
                      label={getCustomerRentalCount(customer.id)}
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        bgcolor: getCustomerRentalCount(customer.id) > 0 ? '#4caf50' : '#e0e0e0',
                        color: getCustomerRentalCount(customer.id) > 0 ? 'white' : '#666',
                        fontWeight: 700,
                        minWidth: 40
                      }}
                    />
                  </Box>
                  
                  {/* Vytvorený column */}
                  <Box sx={{ 
                    width: 140,
                    minWidth: 140,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: '#666',
                      fontSize: '0.8rem'
                    }}>
                      {format(new Date(customer.createdAt), 'dd.MM.yyyy')}
                    </Typography>
                  </Box>
                  
                  {/* Akcie column */}
                  <Box sx={{ 
                    width: 180,
                    minWidth: 180,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5
                  }}>
                    {/* Edit Button */}
                    <IconButton
                      size="small"
                      title="Upraviť zákazníka"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(customer);
                      }}
                      sx={{ 
                        bgcolor: '#2196f3', 
                        color: 'white',
                        width: 28,
                        height: 28,
                        '&:hover': { 
                          bgcolor: '#1976d2',
                          transform: 'scale(1.1)',
                          boxShadow: '0 4px 12px rgba(33,150,243,0.4)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    {/* History Button */}
                    <IconButton
                      size="small"
                      title="História prenájmov"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowHistory(customer);
                      }}
                      sx={{ 
                        bgcolor: '#9c27b0', 
                        color: 'white',
                        width: 28,
                        height: 28,
                        '&:hover': { 
                          bgcolor: '#7b1fa2',
                          transform: 'scale(1.1)',
                          boxShadow: '0 4px 12px rgba(156,39,176,0.4)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                    
                    {/* Phone Button */}
                    {customer.phone && (
                      <IconButton
                        size="small"
                        title="Zavolať"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(customer.phone);
                        }}
                        sx={{ 
                          bgcolor: '#4caf50', 
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': { 
                            bgcolor: '#388e3c',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(76,175,80,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    )}
                    
                    {/* Email Button */}
                    {customer.email && (
                      <IconButton
                        size="small"
                        title="Poslať email"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmail(customer.email);
                        }}
                        sx={{ 
                          bgcolor: '#ff9800', 
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': { 
                            bgcolor: '#f57c00',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(255,152,0,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    )}
                    
                    {/* Delete Button */}
                    <IconButton
                      size="small"
                      title="Zmazať zákazníka"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(customer.id);
                      }}
                      sx={{ 
                        bgcolor: '#f44336', 
                        color: 'white',
                        width: 28,
                        height: 28,
                        '&:hover': { 
                          bgcolor: '#d32f2f',
                          transform: 'scale(1.1)',
                          boxShadow: '0 4px 12px rgba(244,67,54,0.4)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              
              {/* 🚀 INFINITE SCROLL: Load More Button */}
              {hasMore && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  p: 3,
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <Button
                    variant="outlined"
                    onClick={loadMore}
                    disabled={loading}
                    sx={{
                      minWidth: 200,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    {loading ? 'Načítavam...' : 'Načítať ďalšie'}
                  </Button>
                </Box>
              )}
              
              {/* Loading indicator */}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              
              {/* End of list message */}
              {!hasMore && customers.length > 0 && (
                <Box sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
                  <Typography variant="body2">Koniec zoznamu</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Customer Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingCustomer ? 'Upraviť zákazníka' : 'Nový zákazník'}
        </DialogTitle>
        <DialogContent>
          <CustomerForm
            customer={editingCustomer}
            onSave={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

            {/* Customer History Dialog */}
      {selectedCustomerForHistory && (
        <CustomerRentalHistory
          open={!!selectedCustomerForHistory}
          customer={selectedCustomerForHistory}
          rentals={state.rentals}
          vehicles={state.vehicles}
          onClose={() => setSelectedCustomerForHistory(null)}
        />
      )}
    </Box>
  );
} 