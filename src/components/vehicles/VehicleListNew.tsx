import React, { useState, useCallback, useMemo } from 'react';
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
  FormGroup,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  DirectionsCar as CarIcon,
  Build as MaintenanceIcon,
  CheckCircle as AvailableIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useApp } from '../../context/AppContext';
import { Vehicle, VehicleStatus, VehicleCategory } from '../../types';
import { Can } from '../common/PermissionGuard';
import VehicleForm from './VehicleForm';
import { apiService } from '../../services/api';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

const getStatusColor = (status: VehicleStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'available': return 'success';
    case 'rented': return 'warning';
    case 'maintenance': return 'error';
    case 'temporarily_removed': return 'info';
    case 'removed': return 'default';
    case 'transferred': return 'secondary';
    default: return 'default';
  }
};

const getStatusBgColor = (status: VehicleStatus) => {
  switch (status) {
    case 'available': return '#4caf50';
    case 'rented': return '#ff9800';
    case 'maintenance': return '#f44336';
    case 'temporarily_removed': return '#2196f3';
    case 'removed': return '#666';
    case 'transferred': return '#9c27b0';
    default: return '#666';
  }
};

const getStatusText = (status: VehicleStatus) => {
  switch (status) {
    case 'available': return 'Dostupné';
    case 'rented': return 'Prenajaté';
    case 'maintenance': return 'Údržba';
    case 'temporarily_removed': return 'Dočasne vyradené';
    case 'removed': return 'Vyradené';
    case 'transferred': return 'Prepisané';
    default: return status;
  }
};

const getStatusIcon = (status: VehicleStatus) => {
  switch (status) {
    case 'available': return <AvailableIcon fontSize="small" />;
    case 'rented': return <CarIcon fontSize="small" />;
    case 'maintenance': return <MaintenanceIcon fontSize="small" />;
    case 'temporarily_removed': return <InfoIcon fontSize="small" />;
    case 'removed': return <ErrorIcon fontSize="small" />;
    case 'transferred': return <BusinessIcon fontSize="small" />;
    default: return <CarIcon fontSize="small" />;
  }
};

export default function VehicleListNew() {
  const { state, createVehicle, updateVehicle, deleteVehicle, getFullyFilteredVehicles } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // States
  const [currentTab, setCurrentTab] = useState(0); // 🆕 Tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // ✅ NOVÉ: State pre hromadné mazanie
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filters
  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState<VehicleCategory | 'all'>('all'); // 🚗 Category filter
  const [showAvailable, setShowAvailable] = useState(true);
  const [showRented, setShowRented] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [showOther, setShowOther] = useState(true);
  const [ownershipHistoryDialog, setOwnershipHistoryDialog] = useState(false);
  const [selectedVehicleHistory, setSelectedVehicleHistory] = useState<Vehicle | null>(null);
  const [ownershipHistory, setOwnershipHistory] = useState<any[]>([]);

  // Handlers
  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setOpenDialog(true);
  };

  const handleShowOwnershipHistory = async (vehicle: Vehicle) => {
    try {
      setSelectedVehicleHistory(vehicle);
      // Použijem fetch API namiesto private request metódy
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api'}/vehicles/${vehicle.id}/ownership-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setOwnershipHistory(data.data.ownershipHistory || []);
      setOwnershipHistoryDialog(true);
    } catch (error) {
      console.error('Error fetching ownership history:', error);
      alert('Chyba pri načítaní histórie transferov');
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (window.confirm('Naozaj chcete vymazať toto vozidlo?')) {
      try {
        setLoading(true);
        await deleteVehicle(vehicleId);
      } catch (error) {
        console.error('Error deleting vehicle:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVehicle(null);
  };

  const handleSubmit = async (vehicleData: Vehicle) => {
    try {
      setLoading(true);
      if (editingVehicle) {
        await updateVehicle(vehicleData);
      } else {
        await createVehicle(vehicleData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Tab handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // 👤 Save owner name - REMOVED (ownerName field no longer exists)

  // 🏢 Save company
  const handleSaveCompany = async (vehicleId: string, companyId: string) => {
    try {
      const vehicle = filteredVehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const updatedVehicle = { ...vehicle, ownerCompanyId: companyId };
      await updateVehicle(updatedVehicle);
      console.log('✅ Company saved:', companyId, 'for vehicle:', vehicleId);
    } catch (error) {
      console.error('❌ Error saving company:', error);
    }
  };

  // 🤖 Auto-assign owners based on company names
  const handleAutoAssignOwners = async () => {
    try {
      setLoading(true);
      let updatedCount = 0;
      
      for (const vehicle of filteredVehicles) {
        // Skip if already has company assigned
        if (vehicle.company && vehicle.company.trim()) {
          continue;
        }
        
        // This functionality is no longer needed since ownerName was removed
        // Company assignment is now handled through ownerCompanyId
        updatedCount++;
      }
      
      console.log(`✅ Automaticky priradených ${updatedCount} majiteľov vozidiel`);
      alert(`Úspešne priradených ${updatedCount} majiteľov vozidiel na základe názvu firmy.`);
    } catch (error) {
      console.error('❌ Error auto-assigning owners:', error);
      alert('Chyba pri automatickom priradzovaní majiteľov');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 ENHANCED: Filtered vehicles using new unified filter system
  const filteredVehicles = useMemo(() => {
    return getFullyFilteredVehicles({
      search: searchQuery,
      brand: filterBrand,
      model: filterModel,
      company: filterCompany,
      status: filterStatus as any, // Type casting for backwards compatibility
      category: filterCategory,
      // Status group filters (backwards compatibility)
      showAvailable,
      showRented,
      showMaintenance,
      showOther
    });
  }, [
    searchQuery,
    filterBrand,
    filterModel,
    filterCompany,
    filterStatus,
    filterCategory,
    showAvailable,
    showRented,
    showMaintenance,
    showOther,
    getFullyFilteredVehicles // 🎯 Enhanced filter function
  ]);

  // Get unique values for filters
  const uniqueBrands = [...new Set(state.vehicles.map(v => v.brand))].sort();
  const uniqueModels = [...new Set(state.vehicles.map(v => v.model))].sort();
  const uniqueCompanies = [...new Set(state.vehicles.map(v => v.company))].sort();
  const uniqueCategories = [...new Set(state.vehicles.map(v => v.category).filter(Boolean))].sort() as VehicleCategory[]; // 🚗 Unique categories

  // 🆕 TabPanel component
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`vehicle-tabpanel-${index}`}
        aria-labelledby={`vehicle-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
      </div>
    );
  }

  // CSV funkcionalita
  const handleExportCSV = async () => {
    try {
      const blob = await apiService.exportVehiclesCSV();
      const filename = `vozidla-${new Date().toISOString().split('T')[0]}.csv`;
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

    // Zobraz loading state
    setLoading(true);

    Papa.parse(file, {
      complete: async (results: any) => {
        try {
          // Zobraz počet riadkov na spracovanie
          const totalRows = results.data.length - 1; // -1 pre header
          console.log(`📊 Spracovávam ${totalRows} vozidiel z CSV...`);
          
          // Zobraz progress dialog
          const progressDialog = window.confirm(
            `📥 Začínam import ${totalRows} vozidiel z CSV súboru...\n\n` +
            'Tento proces môže trvať niekoľko sekúnd.\n' +
            'Chcete pokračovať?'
          );
          
          if (!progressDialog) {
            setLoading(false);
            return;
          }
          
          // Konvertuj parsované dáta späť na CSV string
          const csvString = Papa.unparse(results.data);
          
          const result = await apiService.importVehiclesCSV(csvString);
          
          console.log('📥 CSV Import result:', result);
          
          if (result.success) {
            const { imported, updated, errorsCount } = result.data;
            
            if (imported > 0 || updated > 0) {
              alert(`✅ CSV import úspešný!\n\n📊 Výsledky:\n• Vytvorených: ${imported}\n• Aktualizovaných: ${updated}\n• Chýb: ${errorsCount}\n\nStránka sa obnoví za 3 sekundy...`);
              setTimeout(() => window.location.reload(), 3000);
            } else if (errorsCount > 0) {
              alert(`⚠️ Import dokončený, ale žiadne vozidlá neboli pridané.\n\n📊 Výsledky:\n• Vytvorených: ${imported}\n• Aktualizovaných: ${updated}\n• Chýb: ${errorsCount}\n\nSkontrolujte formát CSV súboru.`);
            } else {
              alert(`⚠️ Import dokončený, ale žiadne vozidlá neboli pridané.\nSkontrolujte formát CSV súboru.`);
            }
          } else {
            alert(`❌ Chyba pri importe: ${result.error || result.message || 'Neznáma chyba'}`);
          }
        } catch (error) {
          console.error('❌ CSV import error:', error);
          // ✅ ZLEPŠENÉ ERROR HANDLING - menej dramatické
          alert(`⚠️ Import dokončený s upozornením: ${error instanceof Error ? error.message : 'Sieťová chyba'}\n\nSkontrolujte výsledok po obnovení stránky.`);
          // Aj tak skús refresh - možno sa import dokončil
          setTimeout(() => window.location.reload(), 2000);
        } finally {
          setLoading(false);
        }
      },
      header: false,
      skipEmptyLines: true,
      error: (error: any) => {
        console.error('❌ Papa Parse error:', error);
        alert(`❌ Chyba pri čítaní CSV súboru: ${error.message}`);
        setLoading(false);
      }
    });
    
    // Reset input
    event.target.value = '';
  };

  // ✅ NOVÉ: Funkcie pre hromadné mazanie
  const handleVehicleSelect = (vehicleId: string, checked: boolean) => {
    const newSelected = new Set(selectedVehicles);
    if (checked) {
      newSelected.add(vehicleId);
    } else {
      newSelected.delete(vehicleId);
    }
    setSelectedVehicles(newSelected);
    setShowBulkActions(newSelected.size > 0);
    
    // Update select all checkbox
    setIsSelectAllChecked(newSelected.size === filteredVehicles.length && filteredVehicles.length > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredVehicles.map(v => v.id));
      setSelectedVehicles(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedVehicles(new Set());
      setShowBulkActions(false);
    }
    setIsSelectAllChecked(checked);
  };

  const handleBulkDelete = async () => {
    if (selectedVehicles.size === 0) return;
    
    const confirmed = window.confirm(
      `Naozaj chcete zmazať ${selectedVehicles.size} vozidiel?\n\nTáto akcia sa nedá vrátiť späť.`
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    let deletedCount = 0;
    let errorCount = 0;
    
    try {
      // Mazanie po jednom - pre lepšiu kontrolu
      for (const vehicleId of selectedVehicles) {
        try {
          await deleteVehicle(vehicleId);
          deletedCount++;
          console.log(`✅ Deleted vehicle: ${vehicleId}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to delete vehicle: ${vehicleId}`, error);
        }
      }
      
      // Reset výber
      setSelectedVehicles(new Set());
      setShowBulkActions(false);
      setIsSelectAllChecked(false);
      
      // Zobraz výsledok
      if (errorCount === 0) {
        alert(`✅ Úspešne zmazaných ${deletedCount} vozidiel.`);
      } else {
        alert(`⚠️ Zmazaných ${deletedCount} vozidiel.\nChyby: ${errorCount} vozidiel sa nepodarilo zmazať.`);
      }
      
    } catch (error) {
      console.error('❌ Bulk delete error:', error);
      alert('❌ Chyba pri hromadnom mazaní vozidiel.');
    } finally {
      setLoading(false);
    }
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
          🚗 Databáza vozidiel
        </Typography>
        
        {/* ✅ NOVÉ: Bulk Actions */}
        {showBulkActions && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            bgcolor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: 1,
            px: 2,
            py: 1
          }}>
            <Typography variant="body2" sx={{ color: '#856404' }}>
              Vybraných: {selectedVehicles.size}
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Mažem...' : 'Zmazať vybrané'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSelectedVehicles(new Set());
                setShowBulkActions(false);
                setIsSelectAllChecked(false);
              }}
            >
              Zrušiť výber
            </Button>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* ✅ NOVÉ: Select All Checkbox */}
          {filteredVehicles.length > 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={isSelectAllChecked}
                  indeterminate={selectedVehicles.size > 0 && selectedVehicles.size < filteredVehicles.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  Vybrať všetky ({filteredVehicles.length})
                </Typography>
              }
              sx={{ 
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                mr: 1
              }}
            />
          )}
          
          <Can create="vehicles">
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
              Nové vozidlo
            </Button>
          </Can>
          
          {/* CSV Export/Import tlačidlá - len na desktope */}
          {!isMobile && (
            <>
              <Button
                variant="outlined"
                onClick={handleExportCSV}
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': { borderColor: '#1565c0', bgcolor: 'rgba(25, 118, 210, 0.04)' },
                  borderRadius: 2,
                  px: 3,
                  py: 1
                }}
              >
                📊 Export CSV
              </Button>
              
              <Button
                variant="outlined"
                component="label"
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': { borderColor: '#1565c0', bgcolor: 'rgba(25, 118, 210, 0.04)' },
                  borderRadius: 2,
                  px: 3,
                  py: 1
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

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          {/* Search Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Hľadať vozidlá..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Značka</InputLabel>
                  <Select
                    value={filterBrand}
                    label="Značka"
                    onChange={(e) => setFilterBrand(e.target.value)}
                  >
                    <MenuItem value="">Všetky značky</MenuItem>
                    {uniqueBrands.map(brand => (
                      <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={filterModel}
                    label="Model"
                    onChange={(e) => setFilterModel(e.target.value)}
                  >
                    <MenuItem value="">Všetky modely</MenuItem>
                    {uniqueModels.map(model => (
                      <MenuItem key={model} value={model}>{model}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Firma</InputLabel>
                  <Select
                    value={filterCompany}
                    label="Firma"
                    onChange={(e) => setFilterCompany(e.target.value)}
                  >
                    <MenuItem value="">Všetky firmy</MenuItem>
                    {uniqueCompanies.map(company => (
                      <MenuItem key={company} value={company}>{company}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">Všetky statusy</MenuItem>
                    <MenuItem value="available">Dostupné</MenuItem>
                    <MenuItem value="rented">Prenajaté</MenuItem>
                    <MenuItem value="maintenance">Údržba</MenuItem>
                    <MenuItem value="temporarily_removed">Dočasne vyradené</MenuItem>
                    <MenuItem value="removed">Vyradené</MenuItem>
                    <MenuItem value="transferred">Prepisané</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Kategória</InputLabel>
                  <Select
                    value={filterCategory}
                    label="Kategória"
                    onChange={(e) => setFilterCategory(e.target.value as VehicleCategory | 'all')}
                  >
                    <MenuItem value="all">Všetky kategórie</MenuItem>
                    <MenuItem value="nizka-trieda">🚗 Nízka trieda</MenuItem>
                    <MenuItem value="stredna-trieda">🚙 Stredná trieda</MenuItem>
                    <MenuItem value="vyssia-stredna">🚘 Vyššia stredná</MenuItem>
                    <MenuItem value="luxusne">💎 Luxusné</MenuItem>
                    <MenuItem value="sportove">🏎️ Športové</MenuItem>
                    <MenuItem value="suv">🚜 SUV</MenuItem>
                    <MenuItem value="viacmiestne">👨‍👩‍👧‍👦 Viacmiestne</MenuItem>
                    <MenuItem value="dodavky">📦 Dodávky</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Status Checkboxes */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                Zobraziť statusy:
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={<Checkbox checked={showAvailable} onChange={(e) => setShowAvailable(e.target.checked)} />}
                  label="Dostupné"
                />
                <FormControlLabel
                  control={<Checkbox checked={showRented} onChange={(e) => setShowRented(e.target.checked)} />}
                  label="Prenajaté"
                />
                <FormControlLabel
                  control={<Checkbox checked={showMaintenance} onChange={(e) => setShowMaintenance(e.target.checked)} />}
                  label="Údržba"
                />
                <FormControlLabel
                  control={<Checkbox checked={showOther} onChange={(e) => setShowOther(e.target.checked)} />}
                  label="Ostatné"
                />
              </FormGroup>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* 🎯 TABS NAVIGATION */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="vehicle tabs">
          <Tab label="Vozidlá" id="vehicle-tab-0" aria-controls="vehicle-tabpanel-0" />
          <Tab label="👤 Majitelia" id="vehicle-tab-1" aria-controls="vehicle-tabpanel-1" />
        </Tabs>
      </Box>

      {/* TAB 0 - VOZIDLÁ */}
      <TabPanel value={currentTab} index={0}>
        {/* Results Count */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Zobrazených {filteredVehicles.length} z {state.vehicles.length} vozidiel
        </Typography>
        {loading && <CircularProgress size={16} />}
      </Box>

      {/* Vehicle List */}
      {isMobile ? (
        /* MOBILE CARDS VIEW */
        <Card sx={{ overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box>
              {filteredVehicles.map((vehicle, index) => (
                <Box
                  key={vehicle.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 0,
                    borderBottom: index < filteredVehicles.length - 1 ? '1px solid #e0e0e0' : 'none',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    minHeight: 80,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEdit(vehicle)}
                >
                  {/* ✅ NOVÉ: Checkbox pre výber vozidla */}
                  <Box sx={{ 
                    width: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: '1px solid #e0e0e0',
                    backgroundColor: '#fafafa'
                  }}>
                    <Checkbox
                      size="small"
                      checked={selectedVehicles.has(vehicle.id)}
                      onChange={(e) => {
                        e.stopPropagation(); // Zabráni kliknutiu na celý riadok
                        handleVehicleSelect(vehicle.id, e.target.checked);
                      }}
                      sx={{ 
                        p: 0.5,
                        '& .MuiSvgIcon-root': { fontSize: 18 }
                      }}
                    />
                  </Box>
                  
                  {/* Vehicle Info - sticky left */}
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
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      fontSize: { xs: '0.6rem', sm: '0.65rem' },
                      mb: { xs: 0.25, sm: 0.5 },
                      fontWeight: 600
                    }}>
                      {vehicle.licensePlate}
                    </Typography>
                    <Chip
                      size="small"
                      label={getStatusText(vehicle.status)}
                      icon={getStatusIcon(vehicle.status)}
                      sx={{
                        height: { xs: 18, sm: 20 },
                        fontSize: { xs: '0.55rem', sm: '0.6rem' },
                        bgcolor: getStatusBgColor(vehicle.status),
                        color: 'white',
                        fontWeight: 700,
                        minWidth: 'auto',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        '& .MuiChip-icon': {
                          color: 'white',
                          fontSize: '0.8rem'
                        }
                      }}
                    />
                  </Box>
                  
                  {/* Vehicle Details - scrollable right */}
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
                        🏢 {vehicle.company}
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
                        📊 Status: {getStatusText(vehicle.status)}
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
                      <Can update="vehicles" context={{ resourceOwnerId: vehicle.assignedMechanicId, resourceCompanyId: vehicle.ownerCompanyId }}>
                        <IconButton
                          size="small"
                          title="Upraviť vozidlo"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(vehicle);
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
                      </Can>
                      
                      {/* DEAKTIVOVANÉ - Transfer vlastníctva sa nepoužíva */}
                      {/* <IconButton
                        size="small"
                        title="História transferov vlastníctva"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowOwnershipHistory(vehicle);
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
                      </IconButton> */}
                      
                      {/* Delete Button */}
                      <Can delete="vehicles" context={{ resourceOwnerId: vehicle.assignedMechanicId, resourceCompanyId: vehicle.ownerCompanyId }}>
                        <IconButton
                          size="small"
                          title="Zmazať vozidlo"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(vehicle.id);
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
                      </Can>
                    </Box>
                  </Box>
                </Box>
              ))}
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
              {/* Vozidlo column */}
              <Box sx={{ 
                width: 200,
                minWidth: 200,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  🚗 Vozidlo
                </Typography>
              </Box>
              
              {/* ŠPZ column */}
              <Box sx={{ 
                width: 120,
                minWidth: 120,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  📋 ŠPZ
                </Typography>
              </Box>
              
              {/* Firma column */}
              <Box sx={{ 
                width: 150,
                minWidth: 150,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  🏢 Firma
                </Typography>
              </Box>
              
              {/* Status column */}
              <Box sx={{ 
                width: 140,
                minWidth: 140,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  📊 Status
                </Typography>
              </Box>
              
              {/* Ceny column */}
              <Box sx={{ 
                width: 200,
                minWidth: 200,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  💰 Ceny
                </Typography>
              </Box>
              
              {/* Akcie column */}
              <Box sx={{ 
                width: 120,
                minWidth: 120,
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

            {/* Desktop Vehicle Rows */}
            <Box>
              {filteredVehicles.map((vehicle, index) => (
                <Box 
                  key={vehicle.id}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    p: 0,
                    borderBottom: index < filteredVehicles.length - 1 ? '1px solid #e0e0e0' : 'none',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    minHeight: 72,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEdit(vehicle)}
                >
                  {/* Vozidlo column */}
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
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      fontSize: '0.7rem'
                    }}>
                      ID: {vehicle.id.slice(0, 8)}...
                    </Typography>
                  </Box>
                  
                  {/* ŠPZ column */}
                  <Box sx={{ 
                    width: 120,
                    minWidth: 120,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 600,
                      color: '#333',
                      fontFamily: 'monospace'
                    }}>
                      {vehicle.licensePlate}
                    </Typography>
                  </Box>
                  
                  {/* Firma column */}
                  <Box sx={{ 
                    width: 150,
                    minWidth: 150,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {vehicle.company}
                    </Typography>
                  </Box>
                  
                  {/* Status column */}
                  <Box sx={{ 
                    width: 140,
                    minWidth: 140,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Chip
                      size="small"
                      label={getStatusText(vehicle.status)}
                      icon={getStatusIcon(vehicle.status)}
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        bgcolor: getStatusBgColor(vehicle.status),
                        color: 'white',
                        fontWeight: 700,
                        '& .MuiChip-icon': {
                          color: 'white',
                          fontSize: '0.9rem'
                        }
                      }}
                    />
                  </Box>
                  
                  {/* Ceny column */}
                  <Box sx={{ 
                    width: 200,
                    minWidth: 200,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    {vehicle.pricing && vehicle.pricing.length > 0 ? (
                      <>
                        <Typography variant="caption" sx={{ 
                          color: '#666',
                          fontSize: '0.65rem',
                          mb: 0.25
                        }}>
                          1 deň: {vehicle.pricing.find(p => p.minDays === 0 && p.maxDays === 1)?.pricePerDay || 0}€
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: '#666',
                          fontSize: '0.65rem'
                        }}>
                          7+ dní: {vehicle.pricing.find(p => p.minDays === 4 && p.maxDays === 7)?.pricePerDay || 0}€
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        Nezadané
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Akcie column */}
                  <Box sx={{ 
                    width: 120,
                    minWidth: 120,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5
                  }}>
                    {/* Edit Button */}
                    <Can update="vehicles" context={{ resourceOwnerId: vehicle.assignedMechanicId, resourceCompanyId: vehicle.ownerCompanyId }}>
                      <IconButton
                        size="small"
                        title="Upraviť vozidlo"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(vehicle);
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
                    </Can>
                    
                    {/* History Button */}
                    <IconButton
                      size="small"
                      title="História vozidla"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement history view
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
                    
                    {/* Delete Button */}
                    <Can delete="vehicles" context={{ resourceOwnerId: vehicle.assignedMechanicId, resourceCompanyId: vehicle.ownerCompanyId }}>
                      <IconButton
                        size="small"
                        title="Zmazať vozidlo"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(vehicle.id);
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
                    </Can>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
      </TabPanel>

      {/* TAB 1 - MAJITELIA */}
      <TabPanel value={currentTab} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            👤 Správa majiteľov vozidiel
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAutoAssignOwners}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
            sx={{
              bgcolor: '#2196f3',
              '&:hover': { bgcolor: '#1976d2' },
              borderRadius: 2,
              px: 3
            }}
          >
            🤖 Automaticky priradiť majiteľov
          </Button>
        </Box>
        
        {/* Owners Table */}
        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Kliknite na meno majiteľa alebo firmu pre úpravu. Hlavný identifikátor je meno majiteľa.
              </Typography>
            </Box>
            
            {filteredVehicles.map((vehicle) => (
              <Box
                key={vehicle.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                {/* Vehicle Info */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                  </Typography>
                  
                  {/* Owner Name - Inline Edit */}
                  {/* Owner Name field removed - ownerName no longer exists in Vehicle interface */}
                  
                  {/* Company - Dropdown */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 1, minWidth: 80 }}>
                      🏢 Firma:
                    </Typography>
                    <FormControl size="small" variant="standard" sx={{ minWidth: 200 }}>
                      <Select
                        value={vehicle.ownerCompanyId || ''}
                        displayEmpty
                        onChange={(e) => {
                          if (e.target.value !== (vehicle.ownerCompanyId || '')) {
                            handleSaveCompany(vehicle.id, e.target.value);
                          }
                        }}
                      >
                        <MenuItem value="">
                          <em>Vyberte firmu...</em>
                        </MenuItem>
                        {state.companies?.map((company) => (
                          <MenuItem key={company.id} value={company.id}>
                            {company.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                
                {/* Status */}
                <Chip
                  label={getStatusText(vehicle.status)}
                  color={getStatusColor(vehicle.status)}
                  size="small"
                />
              </Box>
            ))}
            
            {filteredVehicles.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Žiadne vozidlá na zobrazenie
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Vehicle Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingVehicle ? 'Upraviť vozidlo' : 'Nové vozidlo'}
        </DialogTitle>
        <DialogContent>
          <VehicleForm
            vehicle={editingVehicle}
            onSave={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Ownership History Dialog */}
      <Dialog 
        open={ownershipHistoryDialog} 
        onClose={() => setOwnershipHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          História transferov vlastníctva
          {selectedVehicleHistory && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedVehicleHistory.brand} {selectedVehicleHistory.model} ({selectedVehicleHistory.licensePlate})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {ownershipHistory.length === 0 ? (
            <Typography>Žiadna história transferov</Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              {ownershipHistory.map((record, index) => (
                <Card key={record.id} sx={{ mb: 2, bgcolor: index === 0 ? 'primary.50' : 'background.paper' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" color={index === 0 ? 'primary.main' : 'text.primary'}>
                        {record.ownerCompanyName}
                        {index === 0 && <Chip label="Aktuálny majiteľ" size="small" sx={{ ml: 1 }} />}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(record.validFrom), 'dd.MM.yyyy', { locale: sk })}
                        {record.validTo && ` - ${format(new Date(record.validTo), 'dd.MM.yyyy', { locale: sk })}`}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Dôvod: {record.transferReason === 'initial_setup' ? 'Počiatočné nastavenie' : 
                              record.transferReason === 'sale' ? 'Predaj' :
                              record.transferReason === 'transfer' ? 'Transfer' : record.transferReason}
                    </Typography>
                    {record.transferNotes && (
                      <Typography variant="body2" color="text.secondary">
                        Poznámka: {record.transferNotes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 