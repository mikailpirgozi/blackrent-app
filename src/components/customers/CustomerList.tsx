import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  InputAdornment,
  Fab,
  Collapse,
  useMediaQuery,
} from '@mui/material';
import ResponsiveTable, { ResponsiveTableColumn } from '../common/ResponsiveTable';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Customer, Rental } from '../../types';
import CustomerForm from './CustomerForm';
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { useDebounce, usePagination, useMemoizedFilter } from '../../utils/performance';

export default function CustomerList() {
  const { state, dispatch, createCustomer, updateCustomer, deleteCustomer, updateRental } = useApp();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Hook na detekciu mobilu
  const isMobile = useMediaQuery('(max-width:600px)');

  // 🚀 PERFORMANCE OPTIMIZATION: Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 🚀 PERFORMANCE OPTIMIZATION: Memoized filtering
  const filteredCustomers = useMemoizedFilter(
    state.customers || [],
    (customer) => {
      if (!debouncedSearchQuery) return true;
      
      const q = debouncedSearchQuery.toLowerCase();
      return !!(
        (customer.name && customer.name.toLowerCase().includes(q)) ||
        (customer.email && customer.email.toLowerCase().includes(q)) ||
        (customer.phone && customer.phone.includes(q))
      );
    },
    [debouncedSearchQuery]
  );

  // 🚀 PERFORMANCE OPTIMIZATION: Pagination
  const {
    currentData: paginatedCustomers,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    pageInfo
  } = usePagination(filteredCustomers, 20);

  const handleAdd = () => {
    setEditingCustomer(null);
    setOpenDialog(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať tohto zákazníka?')) {
      try {
        await deleteCustomer(id);
      } catch (error) {
        console.error('Chyba pri mazaní zákazníka:', error);
        alert('Chyba pri mazaní zákazníka');
      }
    }
  };

  const handleSave = async (customer: Customer) => {
    try {
      if (editingCustomer) {
        await updateCustomer(customer);
      } else {
        await createCustomer(customer);
      }
      setOpenDialog(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Chyba pri ukladaní zákazníka:', error);
      alert('Chyba pri ukladaní zákazníka');
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
  };

  const handleImportExistingCustomers = async () => {
    try {
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
      
      alert(`Pridaných ${newCustomers.length} zákazníkov z existujúcich prenájmov a prepojených s prenájmi. Môžete im doplniť kontaktné údaje.`);
    } catch (error) {
      console.error('Chyba pri importe zákazníkov:', error);
      alert('Chyba pri importe zákazníkov');
    }
  };

  const handleResetImport = async () => {
    if (window.confirm('Naozaj chcete vymazať všetkých zákazníkov a znovu importovať z prenájmov?')) {
      try {
        // Vymazem všetkých zákazníkov pomocou API
        for (const customer of state.customers) {
          await deleteCustomer(customer.id);
        }
        
        // Import flag sa resetuje automaticky
        
        // Znovu spustím import
        setTimeout(() => {
          handleImportExistingCustomers();
        }, 100);
      } catch (error) {
        console.error('Chyba pri resetovaní zákazníkov:', error);
        alert('Chyba pri resetovaní zákazníkov');
      }
    }
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

  // Column definitions for ResponsiveTable
  const columns: ResponsiveTableColumn[] = useMemo(() => [
    {
      id: 'name',
      label: 'Meno',
      width: { xs: '120px', md: '150px' },
      render: (value, customer: Customer) => (
        <Typography variant="body1" fontWeight="bold">
          {customer.name}
        </Typography>
      )
    },
    {
      id: 'email',
      label: 'Email',
      width: { xs: '120px', md: '180px' },
      render: (value, customer: Customer) => (
        customer.email ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{customer.email}</Typography>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleEmail(customer.email); }}
              color="primary"
            >
              <EmailIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )
      )
    },
    {
      id: 'phone',
      label: 'Telefón',
      width: { xs: '120px', md: '140px' },
      render: (value, customer: Customer) => (
        customer.phone ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{customer.phone}</Typography>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleCall(customer.phone); }}
              color="primary"
            >
              <PhoneIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )
      )
    },
    {
      id: 'createdAt',
      label: 'Vytvorený',
      width: { xs: '100px', md: '120px' },
      render: (value) => (
        <Typography variant="body2">
          {new Date(value).toLocaleDateString('sk-SK')}
        </Typography>
      )
    },
    {
      id: 'actions',
      label: 'Akcie',
      width: { xs: '100px', md: '120px' },
      render: (value, customer: Customer) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ], []);

  // Export zákazníkov do CSV
  const exportCustomersToCSV = (customers: Customer[]) => {
    const header = ['id', 'name', 'email', 'phone', 'createdAt'];
    const rows = customers.map(c => [
      c.id,
      c.name,
      c.email || '',
      c.phone || '',
      c.createdAt instanceof Date ? c.createdAt.toISOString().split('T')[0] : c.createdAt
    ]);
    const csv = [header, ...rows].map(row => row.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'zakaznici.csv');
  };

  // Import zákazníkov z CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ReturnType<typeof Papa.parse>) => {
        try {
          console.log('CSV data:', results.data);
          
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];
          
          // Spracujeme každý riadok postupne s error handlingom
          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i] as any;
            
            try {
              // Preskočíme prázdne riadky
              if (!row.name) {
                console.log(`Preskakujem prázdny riadok ${i + 1}`);
                continue;
              }

              // KONTROLA DUPLICÍT ZÁKAZNÍKA
              // Skontroluj, či už existuje zákazník s týmto menom alebo emailom
              const duplicateCustomer = state.customers.find(existingCustomer => {
                const nameMatch = existingCustomer.name?.toLowerCase() === row.name?.toLowerCase();
                const emailMatch = row.email && existingCustomer.email && 
                  existingCustomer.email.toLowerCase() === row.email.toLowerCase();
                
                return nameMatch || emailMatch;
              });
              
              if (duplicateCustomer) {
                console.log(`🔄 Preskakujem duplicitného zákazníka: ${row.name} (${row.email || 'bez emailu'})`);
                continue;
              }

              const customer: Customer = {
                id: row.id || uuidv4(),
                name: row.name || '',
                email: row.email || '',
                phone: row.phone || '',
                createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
              };

              console.log(`Spracovávam riadok ${i + 1}:`, customer);
              await createCustomer(customer);
              successCount++;
              
            } catch (error: any) {
              errorCount++;
              const errorMsg = `Riadok ${i + 1}: ${error.message}`;
              errors.push(errorMsg);
              console.error(`Chyba v riadku ${i + 1}:`, error, 'Row data:', row);
            }
          }
          
          setImportError('');
          
          const totalProcessed = results.data.length;
          const skippedDuplicates = totalProcessed - successCount - errorCount;
          
          let message = `Import zákazníkov dokončený!\n\n`;
          message += `📊 Spracované riadky: ${totalProcessed}\n`;
          message += `✅ Úspešne importované: ${successCount}\n`;
          if (skippedDuplicates > 0) {
            message += `🔄 Preskočené duplicity: ${skippedDuplicates}\n`;
          }
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
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Zákazníci
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {state.customers.length} zákazníkov • {state.rentals.filter(r => r.customerName).length} prenájmov s zákazníkmi
          </Typography>
        </Box>
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={handleImportExistingCustomers}
              disabled={state.customers.length > 0}
            >
              Import z prenájmov ({state.rentals.filter(r => r.customerName).length} prenájmov)
            </Button>
            {state.customers.length > 0 && (
              <Button
                variant="outlined"
                color="warning"
                onClick={handleResetImport}
              >
                Reset import
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => exportCustomersToCSV(state.customers)}
            >
              Export zákazníkov
            </Button>
            <Button
              variant="outlined"
              component="label"
            >
              Import zákazníkov
              <input
                type="file"
                accept=".csv"
                hidden
                ref={fileInputRef}
                onChange={handleImportCSV}
              />
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Pridať zákazníka
            </Button>
          </Box>
        )}
        {isMobile && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => exportCustomersToCSV(state.customers)}
              size="small"
            >
              Export
            </Button>
            <Button
              variant="outlined"
              component="label"
              size="small"
            >
              Import
              <input
                type="file"
                accept=".csv"
                hidden
                ref={fileInputRef}
                onChange={handleImportCSV}
              />
            </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            size="small"
          >
            Pridať
          </Button>
          </Box>
        )}
      </Box>

      {importError && (
        <Box sx={{ color: 'error.main', mb: 2 }}>{importError}</Box>
      )}

      <TextField
        fullWidth
        label={isMobile ? "Vyhľadávanie..." : "Vyhľadať zákazníkov"}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ 
          mb: 3,
          '& .MuiOutlinedInput-root': {
            borderRadius: isMobile ? 2 : 1
          }
        }}
        placeholder={isMobile ? "Meno, email, telefón..." : undefined}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Mobilné zobrazenie - karty */}
      {isMobile ? (
        <Box>
          {paginatedCustomers.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchQuery ? 'Žiadni zákazníci nevyhovujú vyhľadávaniu' : 'Žiadni zákazníci'}
              </Typography>
              {!searchQuery && state.customers.length === 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={handleImportExistingCustomers}
                    disabled={state.customers.length > 0}
                    size="small"
                  >
                    Import z prenájmov
                  </Button>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                  >
                    Import CSV
                    <input
                      type="file"
                      accept=".csv"
                      hidden
                      ref={fileInputRef}
                      onChange={handleImportCSV}
                    />
                  </Button>
                </Box>
              )}
            </Card>
          ) : (
            paginatedCustomers.map((customer) => (
              <Card 
                key={customer.id} 
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
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                                          <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mb: 0.5 }}>
                      {customer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Vytvorený: {new Date(customer.createdAt).toLocaleDateString('sk-SK')}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Kontaktné informácie */}
                  <Box sx={{ mb: 1.5 }}>
                    {customer.email ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                              <EmailIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      <Typography variant="body2" color="text.primary">
                        {customer.email}
                      </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleEmail(customer.email)}
                          sx={{ p: 0.5, color: 'primary.main' }}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : null}
                    
                    {customer.phone ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <PhoneIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      <Typography variant="body2" color="text.primary">
                        {customer.phone}
                      </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleCall(customer.phone)}
                          sx={{ p: 0.5, color: 'primary.main' }}
                        >
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : null}
                    
                    {!customer.email && !customer.phone && (
                                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Žiadne kontaktné údaje
                    </Typography>
                    )}
                  </Box>

                  {/* Akčné tlačidlá */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(customer)}
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
                      size="small"
                      onClick={() => handleDelete(customer.id)}
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
            ))
          )}
        </Box>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={paginatedCustomers}
          emptyMessage={searchQuery ? 'Žiadni zákazníci nevyhovujú vyhľadávaniu' : 'Žiadni zákazníci'}
        />
      )}

      {/* 🚀 OPTIMIZED: Pagination controls */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={prevPage}
            disabled={!hasPrevPage}
            size="small"
          >
            Predchádzajúca
          </Button>
          
          <Typography variant="body2" sx={{ alignSelf: 'center', mx: 2 }}>
            {pageInfo.showing}
          </Typography>
          
          <Button
            variant="outlined"
            onClick={nextPage}
            disabled={!hasNextPage}
            size="small"
          >
            Ďalšia
          </Button>
        </Box>
      )}

      {/* FAB tlačidlo pre mobilné zariadenia */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="Pridať zákazníka"
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

      <Dialog
        open={openDialog}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCustomer ? 'Upraviť zákazníka' : 'Nový zákazník'}
        </DialogTitle>
        <DialogContent>
          <CustomerForm
            customer={editingCustomer}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
} 