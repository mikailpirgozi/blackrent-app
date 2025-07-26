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
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon,
  TrendingUp as ProfitIcon,
  TrendingDown as LossIcon,
  DateRange as DateIcon,
  Euro as EuroIcon,
  Business as CompanyIcon,
  DirectionsCar as VehicleIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Settlement } from '../../types';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import SettlementDetail from './SettlementDetail';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

const SettlementListNew: React.FC = () => {
  const { 
    state,
    getFilteredVehicles, 
    createSettlement 
  } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  // Get data from context
  const settlements = state.settlements;
  const vehicles = getFilteredVehicles();

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(false);

  // New settlement creation states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');

  // Get unique values for filters
  const uniqueCompanies = useMemo(() => 
    Array.from(new Set(settlements.map((s: Settlement) => s.company).filter((company): company is string => Boolean(company)))).sort(),
    [settlements]
  );

  // Filtered settlements
  const filteredSettlements = useMemo(() => {
    return settlements.filter((settlement: Settlement) => {
      const matchesSearch = !searchQuery || 
        settlement.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        settlement.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCompany = !companyFilter || settlement.company === companyFilter;
      const matchesVehicle = !vehicleFilter || settlement.vehicleId === vehicleFilter;
      
      return matchesSearch && matchesCompany && matchesVehicle;
    });
  }, [settlements, searchQuery, companyFilter, vehicleFilter]);

  // Calculate totals
  const totalIncome = useMemo(() => 
    filteredSettlements.reduce((sum: number, settlement: Settlement) => sum + settlement.totalIncome, 0),
    [filteredSettlements]
  );

  const totalExpenses = useMemo(() => 
    filteredSettlements.reduce((sum: number, settlement: Settlement) => sum + settlement.totalExpenses, 0),
    [filteredSettlements]
  );

  const totalProfit = useMemo(() => 
    filteredSettlements.reduce((sum: number, settlement: Settlement) => sum + settlement.profit, 0),
    [filteredSettlements]
  );

  const totalCommission = useMemo(() => 
    filteredSettlements.reduce((sum: number, settlement: Settlement) => sum + settlement.totalCommission, 0),
    [filteredSettlements]
  );

  // Handlers
  const handleCreateSettlement = () => {
    setSelectedCompany('');
    setSelectedVehicleId('');
    setPeriodFrom('');
    setPeriodTo('');
    setCreateDialogOpen(true);
  };

  const handleViewSettlement = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setDetailOpen(true);
  };

  const handleDeleteSettlement = async (settlement: Settlement) => {
    if (window.confirm(`Naozaj chcete zmazať vyúčtovanie za obdobie ${format(new Date(settlement.period.from), 'dd.MM.yyyy')} - ${format(new Date(settlement.period.to), 'dd.MM.yyyy')}?`)) {
      // Note: Delete functionality would need to be implemented in AppContext
      console.log('Delete settlement:', settlement.id);
    }
  };

  const handleCreateSubmit = async () => {
    if (!periodFrom || !periodTo) {
      alert('Prosím vyberte obdobie');
      return;
    }

    setLoading(true);
    try {
      const settlementData = {
        period: {
          from: new Date(periodFrom),
          to: new Date(periodTo)
        },
        company: selectedCompany || undefined,
        vehicleId: selectedVehicleId || undefined
      };
      
      await createSettlement(settlementData as any); // Type assertion since createSettlement expects full Settlement
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating settlement:', error);
      alert('Chyba pri vytváraní vyúčtovania');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredSettlements.map((settlement: Settlement) => ({
      'ID': settlement.id,
      'Obdobie od': format(new Date(settlement.period.from), 'dd.MM.yyyy'),
      'Obdobie do': format(new Date(settlement.period.to), 'dd.MM.yyyy'),
      'Firma': settlement.company || '',
      'Vozidlo': settlement.vehicleId ? vehicles.find(v => v.id === settlement.vehicleId)?.licensePlate || settlement.vehicleId : '',
      'Príjmy': settlement.totalIncome,
      'Náklady': settlement.totalExpenses,
      'Provízia': settlement.totalCommission,
      'Zisk': settlement.profit,
      'Počet prenájmov': settlement.rentals.length,
      'Počet nákladov': settlement.expenses.length
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `vyuctovanie-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const clearFilters = () => {
    setSearchQuery('');
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
              <ReportIcon sx={{ color: '#1976d2', fontSize: 28 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                Vyúčtovanie
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateSettlement}
                sx={{ minWidth: 120 }}
              >
                Vytvoriť
              </Button>
              <Button
                variant="outlined"
                onClick={handleExportCSV}
                disabled={filteredSettlements.length === 0}
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
              placeholder="Hľadať vyúčtovanie..."
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
            
            {(companyFilter || vehicleFilter) && (
              <Button variant="text" onClick={clearFilters}>
                Vymazať filtre
              </Button>
            )}
          </Box>

          {showFilters && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
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
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Vozidlo</InputLabel>
                    <Select
                      value={vehicleFilter}
                      onChange={(e) => setVehicleFilter(e.target.value)}
                      label="Vozidlo"
                    >
                      <MenuItem value="">Všetky vozidlá</MenuItem>
                      {vehicles.map((vehicle: any) => (
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
                    {filteredSettlements.length}
                  </Typography>
                </Box>
                <ReportIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                    Príjmy
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {totalIncome.toFixed(2)}€
                  </Typography>
                </Box>
                <BankIcon sx={{ fontSize: 40, opacity: 0.8 }} />
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
                    Náklady
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {totalExpenses.toFixed(2)}€
                  </Typography>
                </Box>
                <EuroIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: totalProfit >= 0 
              ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
              : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {totalProfit >= 0 ? 'Zisk' : 'Strata'}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {totalProfit.toFixed(2)}€
                  </Typography>
                </Box>
                {totalProfit >= 0 ? 
                  <ProfitIcon sx={{ fontSize: 40, opacity: 0.8 }} /> :
                  <LossIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                }
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
          {filteredSettlements.length === 0 ? (
            <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <ReportIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Žiadne vyúčtovania nenájdené
                </Typography>
              </CardContent>
            </Card>
          ) : (
            filteredSettlements.map((settlement: Settlement) => {
              const vehicle = settlement.vehicleId ? vehicles.find((v: any) => v.id === settlement.vehicleId) : null;
              const isProfit = settlement.profit >= 0;
              
              return (
                <Card key={settlement.id} sx={{ 
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
                          {format(new Date(settlement.period.from), 'dd.MM.yyyy')} - {format(new Date(settlement.period.to), 'dd.MM.yyyy')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            icon={isProfit ? <ProfitIcon fontSize="small" /> : <LossIcon fontSize="small" />}
                            label={isProfit ? 'Zisk' : 'Strata'}
                            color={isProfit ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: isProfit ? '#4caf50' : '#f44336'
                          }}>
                            {settlement.profit.toFixed(2)}€
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewSettlement(settlement)}
                          sx={{ 
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            '&:hover': { backgroundColor: '#bbdefb' }
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteSettlement(settlement)}
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
                          <BankIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Príjmy: {settlement.totalIncome.toFixed(2)}€
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EuroIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Náklady: {settlement.totalExpenses.toFixed(2)}€
                          </Typography>
                        </Box>
                      </Grid>
                      {settlement.company && (
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CompanyIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {settlement.company}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      {vehicle && (
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <VehicleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {vehicle.licensePlate}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ 
                          color: 'text.secondary',
                          mt: 1,
                          p: 1,
                          backgroundColor: '#f5f5f5',
                          borderRadius: 1
                        }}>
                          {settlement.rentals.length} prenájmov • {settlement.expenses.length} nákladov
                        </Typography>
                      </Grid>
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
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 120px',
              gap: 2,
              p: 2,
              fontWeight: 600,
              color: '#1976d2',
              backgroundColor: '#f8f9fa'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Obdobie</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Firma</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Vozidlo</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Príjmy</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Náklady</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Provízia</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Zisk</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'center' }}>Akcie</Typography>
            </Box>
          </Box>
          
          <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
            {filteredSettlements.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ReportIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Žiadne vyúčtovania nenájdené
                </Typography>
              </Box>
            ) : (
              filteredSettlements.map((settlement: Settlement, index: number) => {
                const vehicle = settlement.vehicleId ? vehicles.find((v: any) => v.id === settlement.vehicleId) : null;
                const isProfit = settlement.profit >= 0;
                
                return (
                  <Box
                    key={settlement.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 120px',
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
                        {format(new Date(settlement.period.from), 'dd.MM.yyyy')} - {format(new Date(settlement.period.to), 'dd.MM.yyyy')}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'text.secondary'
                      }}>
                        {settlement.rentals.length} prenájmov • {settlement.expenses.length} nákladov
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }} noWrap>
                      {settlement.company || '-'}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }} noWrap>
                      {vehicle ? `${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}` : '-'}
                    </Typography>
                    
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600, 
                      color: '#4caf50',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {settlement.totalIncome.toFixed(2)}€
                    </Typography>
                    
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600, 
                      color: '#f44336',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {settlement.totalExpenses.toFixed(2)}€
                    </Typography>
                    
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600, 
                      color: '#ff9800',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {settlement.totalCommission.toFixed(2)}€
                    </Typography>
                    
                    <Typography variant="body1" sx={{ 
                      fontWeight: 700, 
                      color: isProfit ? '#4caf50' : '#f44336',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {settlement.profit.toFixed(2)}€
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Zobraziť detail">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewSettlement(settlement)}
                          sx={{ 
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            '&:hover': { backgroundColor: '#bbdefb' }
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Zmazať">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteSettlement(settlement)}
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

      {/* Create Settlement Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Vytvoriť vyúčtovanie
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Od dátumu"
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Do dátumu"
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Firma (voliteľné)</InputLabel>
                <Select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  label="Firma (voliteľné)"
                >
                  <MenuItem value="">Všetky firmy</MenuItem>
                  {uniqueCompanies.map((company: string) => (
                    <MenuItem key={company} value={company}>{company}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Vozidlo (voliteľné)</InputLabel>
                <Select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  label="Vozidlo (voliteľné)"
                >
                  <MenuItem value="">Všetky vozidlá</MenuItem>
                  {vehicles.map((vehicle: any) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button 
              variant="outlined" 
              onClick={() => setCreateDialogOpen(false)}
              disabled={loading}
            >
              Zrušiť
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateSubmit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Vytvoriť'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Settlement Detail Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        {selectedSettlement && (
          <SettlementDetail
            settlement={selectedSettlement}
            onClose={() => setDetailOpen(false)}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default SettlementListNew; 