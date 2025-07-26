import React, { useState, useMemo } from 'react';
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
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Divider,
  useMediaQuery,
  useTheme,
  Tooltip,
  Alert,
  CircularProgress,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DirectionsCar as CarIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Event as EventIcon,
  Euro as EuroIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Assessment as ReportIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Insurance } from '../../types';
import { format, isAfter, addDays, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import InsuranceForm from './InsuranceForm';

const getExpiryStatus = (validTo: Date | string) => {
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);
  
  const validToDate = typeof validTo === 'string' ? parseISO(validTo) : validTo;
  
  if (isAfter(today, validToDate)) {
    return { status: 'expired', color: 'error', text: 'Vypršala', bgColor: '#ffebee' };
  } else if (isAfter(validToDate, thirtyDaysFromNow)) {
    return { status: 'valid', color: 'success', text: 'Platná', bgColor: '#e8f5e8' };
  } else {
    return { status: 'expiring', color: 'warning', text: 'Vyprší čoskoro', bgColor: '#fff3e0' };
  }
};

export default function InsuranceList() {
  const { state, dispatch, createInsurance } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Vypočítane štatistiky pomocou useMemo
  const stats = useMemo(() => {
    const total = state.insurances.length;
    const validInsurances = state.insurances.filter(insurance => {
      const status = getExpiryStatus(insurance.validTo);
      return status.status === 'valid';
    }).length;
    
    const expiringInsurances = state.insurances.filter(insurance => {
      const status = getExpiryStatus(insurance.validTo);
      return status.status === 'expiring';
    }).length;
    
    const expiredInsurances = state.insurances.filter(insurance => {
      const status = getExpiryStatus(insurance.validTo);
      return status.status === 'expired';
    }).length;
    
    const totalValue = state.insurances.reduce((sum, insurance) => sum + insurance.price, 0);
    
    return { total, validInsurances, expiringInsurances, expiredInsurances, totalValue };
  }, [state.insurances]);

  // Filtrované poistky
  const filteredInsurances = useMemo(() => {
    return state.insurances.filter((insurance) => {
      const matchesSearch = !searchQuery || 
        insurance.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insurance.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insurance.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesVehicle = !filterVehicle || insurance.vehicleId === filterVehicle;
      const matchesCompany = !filterCompany || insurance.company === filterCompany;
      const matchesType = !filterType || insurance.type === filterType;
      
      const matchesStatus = !filterStatus || getExpiryStatus(insurance.validTo).status === filterStatus;
      
      return matchesSearch && matchesVehicle && matchesCompany && matchesType && matchesStatus;
    });
  }, [state.insurances, searchQuery, filterVehicle, filterCompany, filterType, filterStatus]);

  const handleAdd = () => {
    setEditingInsurance(null);
    setOpenDialog(true);
  };

  const handleEdit = (insurance: Insurance) => {
    setEditingInsurance(insurance);
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Naozaj chcete vymazať túto poistku?')) {
      dispatch({ type: 'DELETE_INSURANCE', payload: id });
    }
  };

  const handleSave = async (insurance: Insurance) => {
    try {
      if (editingInsurance) {
        dispatch({ type: 'UPDATE_INSURANCE', payload: insurance });
      } else {
        await createInsurance(insurance);
      }
      setOpenDialog(false);
      setEditingInsurance(null);
    } catch (error) {
      console.error('Chyba pri ukladaní poistky:', error);
      alert('Chyba pri ukladaní poistky: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterVehicle('');
    setFilterCompany('');
    setFilterType('');
    setFilterStatus('');
  };

  const hasActiveFilters = searchQuery || filterVehicle || filterCompany || filterType || filterStatus;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Modern Header */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Poistky
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Správa poistných zmlúv vozidiel
                </Typography>
              </Box>
            </Box>
            
            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                Pridať poistku
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    CELKOM POISTIEK
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total}
                  </Typography>
                </Box>
                <ReportIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    PLATNÉ POISTKY
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.validInsurances}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    VYPRŠIA ČOSKORO
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.expiringInsurances}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    VYPRŠANÉ
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.expiredInsurances}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: showFilters ? 2 : 0 }}>
            <TextField
              placeholder="Hľadať poistky..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: searchQuery && (
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseIcon />
                  </IconButton>
                )
              }}
            />
            
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                minWidth: 120,
                backgroundColor: showFilters ? '#1976d2' : 'transparent',
              }}
            >
              Filtre
              {hasActiveFilters && (
                <Chip 
                  label={filteredInsurances.length} 
                  size="small" 
                  sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  color={showFilters ? 'default' : 'primary'}
                />
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="text"
                onClick={clearFilters}
                sx={{ color: 'error.main' }}
              >
                Vymazať
              </Button>
            )}
          </Box>
          
          {showFilters && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Vozidlo</InputLabel>
                    <Select
                      value={filterVehicle}
                      label="Vozidlo"
                      onChange={(e) => setFilterVehicle(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      {state.vehicles.map(vehicle => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Poisťovňa</InputLabel>
                    <Select
                      value={filterCompany}
                      label="Poisťovňa"
                      onChange={(e) => setFilterCompany(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      {Array.from(new Set(state.insurances.map(i => i.company))).map(company => (
                        <MenuItem key={company} value={company}>{company}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Typ poistky</InputLabel>
                    <Select
                      value={filterType}
                      label="Typ poistky"
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      {Array.from(new Set(state.insurances.map(i => i.type))).map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Stav</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Stav"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      <MenuItem value="valid">Platné</MenuItem>
                      <MenuItem value="expiring">Vypršia čoskoro</MenuItem>
                      <MenuItem value="expired">Vypršané</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      {/* Alert pre vypršané poistky */}
      {stats.expiredInsurances > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          icon={<WarningIcon />}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Pozor! {stats.expiredInsurances} poistiek už vypršalo
          </Typography>
        </Alert>
      )}

      {/* Alert pre čoskoro vypršané poistky */}
      {stats.expiringInsurances > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<ScheduleIcon />}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Upozornenie: {stats.expiringInsurances} poistiek vyprší do 30 dní
          </Typography>
        </Alert>
      )}

      {/* Insurance Cards */}
      <Grid container spacing={2}>
        {filteredInsurances.map((insurance) => {
          const vehicle = state.vehicles.find(v => v.id === insurance.vehicleId);
          const expiryStatus = getExpiryStatus(insurance.validTo);
          
          return (
            <Grid item xs={12} sm={6} lg={4} key={insurance.id}>
              <Card sx={{ 
                height: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                border: `1px solid ${
                  expiryStatus.status === 'expired' ? '#f44336' :
                  expiryStatus.status === 'expiring' ? '#ff9800' :
                  '#e0e0e0'
                }`,
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  transform: 'translateY(-4px)',
                }
              }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Header s vozidlom a stavom */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CarIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'N/A'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle?.licensePlate}
                      </Typography>
                    </Box>
                    <Chip
                      label={expiryStatus.text}
                      color={expiryStatus.color as any}
                      sx={{ 
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                  
                  {/* Informácie o poistke */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ 
                      backgroundColor: expiryStatus.bgColor,
                      borderRadius: 1,
                      p: 1.5,
                      border: `1px solid ${
                        expiryStatus.status === 'expired' ? '#ffcdd2' :
                        expiryStatus.status === 'expiring' ? '#ffe0b2' :
                        '#c8e6c9'
                      }`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SecurityIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          {insurance.type}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Číslo: {insurance.policyNumber}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon sx={{ fontSize: 18, color: '#666' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {insurance.company}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon sx={{ fontSize: 18, color: '#666' }} />
                      <Typography variant="body2" color="text.secondary">
                        {format(typeof insurance.validFrom === 'string' ? parseISO(insurance.validFrom) : insurance.validFrom, 'dd.MM.yyyy', { locale: sk })} - {format(typeof insurance.validTo === 'string' ? parseISO(insurance.validTo) : insurance.validTo, 'dd.MM.yyyy', { locale: sk })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      p: 1
                    }}>
                      <EuroIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#4caf50' }}>
                        {insurance.price.toFixed(2)} €
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Action Buttons */}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(insurance)}
                      sx={{
                        borderColor: '#1976d2',
                        color: '#1976d2',
                        '&:hover': {
                          borderColor: '#1565c0',
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                        },
                      }}
                    >
                      Upraviť
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(insurance.id)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.04)',
                        },
                      }}
                    >
                      Vymazať
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Empty State */}
      {filteredInsurances.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 6, mt: 3 }}>
          <CardContent>
            <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {hasActiveFilters ? 'Žiadne poistky nevyhovujú filtrom' : 'Žiadne poistky'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {hasActiveFilters ? 'Skúste zmeniť filtre alebo vyhľadávanie' : 'Začnite pridaním prvej poistky'}
            </Typography>
            {!hasActiveFilters && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ mt: 2 }}
              >
                Pridať poistku
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleAdd}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
        keepMounted={false}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <SecurityIcon />
          {editingInsurance ? 'Upraviť poistku' : 'Pridať novú poistku'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <InsuranceForm
            insurance={editingInsurance}
            onSave={handleSave}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
} 