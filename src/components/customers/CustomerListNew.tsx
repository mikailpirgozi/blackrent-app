import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  FilterList as FilterListIcon,
  History as HistoryIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from '@/lib/react-query/hooks/useCustomers';
import {
  useRentals,
  useUpdateRental,
} from '@/lib/react-query/hooks/useRentals';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import type { Customer, Rental } from '../../types';
import { DefaultCard, PrimaryButton, SecondaryButton } from '../ui';

import CustomerForm from './CustomerForm';
import CustomerRentalHistory from './CustomerRentalHistory';

export default function CustomerListNew() {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: customers = [] } = useCustomers();
  const { data: rentals = [] } = useRentals();
  const { data: vehicles = [] } = useVehicles();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();
  const updateRentalMutation = useUpdateRental();

  // Helper functions for compatibility
  const createCustomer = async (customer: Customer) => {
    return createCustomerMutation.mutateAsync(customer);
  };
  const updateCustomer = async (customer: Customer) => {
    return updateCustomerMutation.mutateAsync(customer);
  };
  const deleteCustomer = async (id: string) => {
    return deleteCustomerMutation.mutateAsync(id);
  };
  const updateRental = async (rental: Rental) => {
    return updateRentalMutation.mutateAsync(rental);
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] =
    useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [showWithEmail, setShowWithEmail] = useState(true);
  const [showWithoutEmail, setShowWithoutEmail] = useState(true);
  const [showWithPhone, setShowWithPhone] = useState(true);
  const [showWithoutPhone, setShowWithoutPhone] = useState(true);

  // 🚀 INFINITE SCROLL STATES
  const [displayedCustomers, setDisplayedCustomers] = useState(20); // Start with 20 items
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Handlers
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Naozaj chcete vymazať tohto zákazníka?')) {
      try {
        setLoading(true);
        await deleteCustomer(customerId);
      } catch (error) {
        console.error('Error deleting customer:', error);
      } finally {
        setLoading(false);
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
      complete: async (results: { data: unknown[][] }) => {
        try {
          // Konvertuj parsované dáta späť na CSV string
          const csvString = Papa.unparse(results.data);

          const { apiService } = await import('../../services/api');
          const result = (await apiService.importCustomersCSV(csvString)) as {
            success: boolean;
            message?: string;
            error?: string;
          };

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
      skipEmptyLines: true,
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
      setLoading(true);
      if (editingCustomer) {
        await updateCustomer(customerData);
      } else {
        await createCustomer(customerData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportExistingCustomers = async () => {
    try {
      setLoading(true);
      // Získam všetkých unikátnych zákazníkov z prenájmov
      const existingCustomerNames = Array.from(
        new Set(rentals.map(r => r.customerName).filter(Boolean))
      );

      // Filtrujem len tie, ktoré ešte neexistujú v customers
      const newCustomerNames = existingCustomerNames.filter(
        name => !customers?.some(c => c.name === name)
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
      for (const rental of rentals) {
        if (rental.customerName && !rental.customerId) {
          const customer =
            newCustomers.find(c => c.name === rental.customerName) ||
            (customers || []).find(c => c.name === rental.customerName);
          if (customer) {
            await updateRental({
              ...rental,
              customerId: customer.id,
              customer: customer,
            });
          }
        }
      }

      alert(
        `Pridaných ${newCustomers.length} zákazníkov z existujúcich prenájmov a prepojených s prenájmi.`
      );
    } catch (error) {
      console.error('Chyba pri importe zákazníkov:', error);
      alert('Chyba pri importe zákazníkov');
    } finally {
      setLoading(false);
    }
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !(customer.name || '').toLowerCase().includes(query) &&
          !(customer.email || '').toLowerCase().includes(query) &&
          !(customer.phone || '').toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Name filter
      if (
        filterName &&
        !(customer.name || '').toLowerCase().includes(filterName.toLowerCase())
      ) {
        return false;
      }

      // Email filter
      if (
        filterEmail &&
        !(customer.email || '')
          .toLowerCase()
          .includes(filterEmail.toLowerCase())
      ) {
        return false;
      }

      // Phone filter
      if (filterPhone && !(customer.phone || '').includes(filterPhone)) {
        return false;
      }

      // Email/Phone existence filters
      const hasEmail = !!customer.email;
      const hasPhone = !!customer.phone;

      if (!showWithEmail && hasEmail) return false;
      if (!showWithoutEmail && !hasEmail) return false;
      if (!showWithPhone && hasPhone) return false;
      if (!showWithoutPhone && !hasPhone) return false;

      return true;
    });
  }, [
    customers,
    searchQuery,
    filterName,
    filterEmail,
    filterPhone,
    showWithEmail,
    showWithoutEmail,
    showWithPhone,
    showWithoutPhone,
  ]);

  // 🚀 INFINITE SCROLL LOGIC (after filteredCustomers definition)
  const loadMoreCustomers = useCallback(() => {
    if (isLoadingMore || displayedCustomers >= filteredCustomers.length) return;

    setIsLoadingMore(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedCustomers(prev =>
        Math.min(prev + 20, filteredCustomers.length)
      );
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, displayedCustomers, filteredCustomers.length]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCustomers(20);
  }, [
    searchQuery,
    filterName,
    filterEmail,
    filterPhone,
    showWithEmail,
    showWithoutEmail,
    showWithPhone,
    showWithoutPhone,
  ]);

  // Infinite scroll event handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      // Load more when user scrolls to 80% of the content
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        loadMoreCustomers();
      }
    },
    [loadMoreCustomers]
  );

  // Get customers to display (limited by infinite scroll)
  const customersToDisplay = useMemo(() => {
    return filteredCustomers.slice(0, displayedCustomers);
  }, [filteredCustomers, displayedCustomers]);

  const hasMore = displayedCustomers < filteredCustomers.length;

  // Get customer rental count
  const getCustomerRentalCount = (customerId: string) => {
    return rentals.filter(rental => rental.customerId === customerId).length;
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#1976d2',
            fontSize: { xs: '1.5rem', sm: '2rem' },
          }}
        >
          👥 Databáza zákazníkov
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <SecondaryButton
            startIcon={<UploadIcon />}
            onClick={handleImportExistingCustomers}
            size="small"
            disabled={loading}
          >
            Import z prenájmov
          </SecondaryButton>
          {/* CSV tlačidlá - len na desktope */}
          {!isMobile && (
            <>
              <SecondaryButton
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                size="small"
              >
                📊 Export CSV
              </SecondaryButton>

              <SecondaryButton
                component="label"
                startIcon={<UploadIcon />}
                size="small"
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
              </SecondaryButton>
            </>
          )}

          <PrimaryButton
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ px: 3, py: 1 }}
          >
            Nový zákazník
          </PrimaryButton>
        </Box>
      </Box>

      {/* Search and Filters */}
      <DefaultCard sx={{ mb: 3 }}>
        {/* Search Bar */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Hľadať zákazníkov..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
                bgcolor: filtersOpen ? '#1565c0' : '#e0e0e0',
              },
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
                onChange={e => setFilterName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Filter email"
                value={filterEmail}
                onChange={e => setFilterEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Filter telefón"
                value={filterPhone}
                onChange={e => setFilterPhone(e.target.value)}
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
                control={
                  <Checkbox
                    checked={showWithEmail}
                    onChange={e => setShowWithEmail(e.target.checked)}
                  />
                }
                label="S emailom"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showWithoutEmail}
                    onChange={e => setShowWithoutEmail(e.target.checked)}
                  />
                }
                label="Bez emailu"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showWithPhone}
                    onChange={e => setShowWithPhone(e.target.checked)}
                  />
                }
                label="S telefónom"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showWithoutPhone}
                    onChange={e => setShowWithoutPhone(e.target.checked)}
                  />
                }
                label="Bez telefónu"
              />
            </FormGroup>
          </Box>
        </Collapse>
      </DefaultCard>

      {/* Results Count */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Zobrazených {customersToDisplay.length} z {filteredCustomers.length}{' '}
          zákazníkov
          {filteredCustomers.length !== customers.length &&
            ` (filtrovaných z ${customers.length})`}
        </Typography>
        {isLoadingMore && (
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
        <DefaultCard
          padding="none"
          sx={{ overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
        >
          <Box
            sx={{ maxHeight: '70vh', overflowY: 'auto' }}
            onScroll={handleScroll}
          >
            {customersToDisplay.map((customer, index) => (
              <Box
                key={customer.id}
                sx={{
                  display: 'flex',
                  borderBottom:
                    index < customersToDisplay.length - 1
                      ? '1px solid #e0e0e0'
                      : 'none',
                  '&:hover': { backgroundColor: '#f8f9fa' },
                  minHeight: 80,
                  cursor: 'pointer',
                }}
                onClick={() => handleEdit(customer)}
              >
                {/* Customer Info - sticky left */}
                <Box
                  sx={{
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
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      color: '#1976d2',
                      lineHeight: 1.2,
                      wordWrap: 'break-word',
                      mb: { xs: 0.25, sm: 0.5 },
                    }}
                  >
                    {customer.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#666',
                      fontSize: { xs: '0.6rem', sm: '0.65rem' },
                      mb: { xs: 0.25, sm: 0.5 },
                      fontWeight: 600,
                    }}
                  >
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
                      overflow: 'hidden',
                    }}
                  />
                </Box>

                {/* Customer Details - scrollable right */}
                <Box
                  sx={{
                    flex: 1,
                    p: { xs: 1, sm: 1.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    minWidth: 0,
                  }}
                >
                  <Box sx={{ overflow: 'hidden' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        color: '#333',
                        mb: { xs: 0.25, sm: 0.5 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      📧 {customer.email || 'Nezadané'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#666',
                        fontSize: { xs: '0.6rem', sm: '0.65rem' },
                        display: 'block',
                        mb: { xs: 0.25, sm: 0.5 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      📱 {customer.phone || 'Nezadané'}
                    </Typography>
                  </Box>

                  {/* Mobile Action Buttons */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: { xs: 0.5, sm: 0.75 },
                      mt: { xs: 1, sm: 1.5 },
                      justifyContent: 'flex-start',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Edit Button */}
                    <IconButton
                      size="small"
                      title="Upraviť zákazníka"
                      onClick={e => {
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
                          boxShadow: '0 4px 12px rgba(33,150,243,0.4)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>

                    {/* History Button */}
                    <IconButton
                      size="small"
                      title="História prenájmov"
                      onClick={e => {
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
                          boxShadow: '0 4px 12px rgba(156,39,176,0.4)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>

                    {/* Phone Button */}
                    {customer.phone && (
                      <IconButton
                        size="small"
                        title="Zavolať"
                        onClick={e => {
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
                            boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                          },
                          transition: 'all 0.2s ease',
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
                        onClick={e => {
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
                            boxShadow: '0 4px 12px rgba(255,152,0,0.4)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    )}

                    {/* Delete Button */}
                    <IconButton
                      size="small"
                      title="Zmazať zákazníka"
                      onClick={e => {
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
                          boxShadow: '0 4px 12px rgba(244,67,54,0.4)',
                        },
                        transition: 'all 0.2s ease',
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
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 3,
                  borderTop: '1px solid #e0e0e0',
                }}
              >
                <Button
                  variant="outlined"
                  onClick={loadMoreCustomers}
                  disabled={isLoadingMore}
                  sx={{
                    minWidth: 200,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {isLoadingMore
                    ? 'Načítavam...'
                    : `Načítať ďalších (${filteredCustomers.length - displayedCustomers} zostáva)`}
                </Button>
              </Box>
            )}
          </Box>
        </DefaultCard>
      ) : (
        /* DESKTOP TABLE VIEW */
        <DefaultCard
          padding="none"
          sx={{ overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
        >
          {/* Desktop Header */}
          <Box
            sx={{
              display: 'flex',
              bgcolor: '#f8f9fa',
              borderBottom: '2px solid #e0e0e0',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              minHeight: 56,
            }}
          >
            {/* Zákazník column */}
            <Box
              sx={{
                width: 200,
                minWidth: 200,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: '#333' }}
              >
                👤 Zákazník
              </Typography>
            </Box>

            {/* Email column */}
            <Box
              sx={{
                width: 220,
                minWidth: 220,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: '#333' }}
              >
                📧 Email
              </Typography>
            </Box>

            {/* Telefón column */}
            <Box
              sx={{
                width: 140,
                minWidth: 140,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: '#333' }}
              >
                📱 Telefón
              </Typography>
            </Box>

            {/* Prenájmy column */}
            <Box
              sx={{
                width: 120,
                minWidth: 120,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: '#333' }}
              >
                🚗 Prenájmy
              </Typography>
            </Box>

            {/* Vytvorený column */}
            <Box
              sx={{
                width: 140,
                minWidth: 140,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: '#333' }}
              >
                📅 Vytvorený
              </Typography>
            </Box>

            {/* Akcie column */}
            <Box
              sx={{
                width: 180,
                minWidth: 180,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: '#333' }}
              >
                ⚡ Akcie
              </Typography>
            </Box>
          </Box>

          {/* Desktop Customer Rows */}
          <Box
            sx={{ maxHeight: '70vh', overflowY: 'auto' }}
            onScroll={handleScroll}
          >
            {customersToDisplay.map((customer, index) => (
              <Box
                key={customer.id}
                sx={{
                  display: 'flex',
                  borderBottom:
                    index < customersToDisplay.length - 1
                      ? '1px solid #e0e0e0'
                      : 'none',
                  '&:hover': { backgroundColor: '#f8f9fa' },
                  minHeight: 72,
                  cursor: 'pointer',
                }}
                onClick={() => handleEdit(customer)}
              >
                {/* Zákazník column */}
                <Box
                  sx={{
                    width: 200,
                    minWidth: 200,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: '#1976d2',
                      mb: 0.5,
                    }}
                  >
                    {customer.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#666',
                      fontSize: '0.7rem',
                    }}
                  >
                    ID: {customer.id.slice(0, 8)}...
                  </Typography>
                </Box>

                {/* Email column */}
                <Box
                  sx={{
                    width: 220,
                    minWidth: 220,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: customer.email ? '#333' : '#999',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontStyle: customer.email ? 'normal' : 'italic',
                    }}
                  >
                    {customer.email || 'Nezadané'}
                  </Typography>
                </Box>

                {/* Telefón column */}
                <Box
                  sx={{
                    width: 140,
                    minWidth: 140,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: customer.phone ? '#333' : '#999',
                      fontFamily: customer.phone ? 'monospace' : 'inherit',
                      fontStyle: customer.phone ? 'normal' : 'italic',
                    }}
                  >
                    {customer.phone || 'Nezadané'}
                  </Typography>
                </Box>

                {/* Prenájmy column */}
                <Box
                  sx={{
                    width: 120,
                    minWidth: 120,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Chip
                    size="small"
                    label={getCustomerRentalCount(customer.id)}
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      bgcolor:
                        getCustomerRentalCount(customer.id) > 0
                          ? '#4caf50'
                          : '#e0e0e0',
                      color:
                        getCustomerRentalCount(customer.id) > 0
                          ? 'white'
                          : '#666',
                      fontWeight: 700,
                      minWidth: 40,
                    }}
                  />
                </Box>

                {/* Vytvorený column */}
                <Box
                  sx={{
                    width: 140,
                    minWidth: 140,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      fontSize: '0.8rem',
                    }}
                  >
                    {format(new Date(customer.createdAt), 'dd.MM.yyyy')}
                  </Typography>
                </Box>

                {/* Akcie column */}
                <Box
                  sx={{
                    width: 180,
                    minWidth: 180,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                  }}
                >
                  {/* Edit Button */}
                  <IconButton
                    size="small"
                    title="Upraviť zákazníka"
                    onClick={e => {
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
                        boxShadow: '0 4px 12px rgba(33,150,243,0.4)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>

                  {/* History Button */}
                  <IconButton
                    size="small"
                    title="História prenájmov"
                    onClick={e => {
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
                        boxShadow: '0 4px 12px rgba(156,39,176,0.4)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <HistoryIcon fontSize="small" />
                  </IconButton>

                  {/* Phone Button */}
                  {customer.phone && (
                    <IconButton
                      size="small"
                      title="Zavolať"
                      onClick={e => {
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
                          boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                        },
                        transition: 'all 0.2s ease',
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
                      onClick={e => {
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
                          boxShadow: '0 4px 12px rgba(255,152,0,0.4)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <EmailIcon fontSize="small" />
                    </IconButton>
                  )}

                  {/* Delete Button */}
                  <IconButton
                    size="small"
                    title="Zmazať zákazníka"
                    onClick={e => {
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
                        boxShadow: '0 4px 12px rgba(244,67,54,0.4)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}

            {/* 🚀 INFINITE SCROLL: Load More Button */}
            {hasMore && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 3,
                  borderTop: '1px solid #e0e0e0',
                }}
              >
                <Button
                  variant="outlined"
                  onClick={loadMoreCustomers}
                  disabled={isLoadingMore}
                  sx={{
                    minWidth: 200,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {isLoadingMore
                    ? 'Načítavam...'
                    : `Načítať ďalších (${filteredCustomers.length - displayedCustomers} zostáva)`}
                </Button>
              </Box>
            )}
          </Box>
        </DefaultCard>
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
          rentals={rentals}
          vehicles={vehicles}
          onClose={() => setSelectedCustomerForHistory(null)}
        />
      )}
    </Box>
  );
}
