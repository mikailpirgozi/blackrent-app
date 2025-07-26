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
  FormGroup
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
import { Vehicle, VehicleStatus } from '../../types';
import { Can } from '../common/PermissionGuard';
import VehicleForm from './VehicleForm';

const getStatusColor = (status: VehicleStatus) => {
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
  const { state, createVehicle, updateVehicle, deleteVehicle } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAvailable, setShowAvailable] = useState(true);
  const [showRented, setShowRented] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [showOther, setShowOther] = useState(true);

  // Handlers
  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setOpenDialog(true);
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

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return state.vehicles.filter(vehicle => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !vehicle.brand.toLowerCase().includes(query) &&
          !vehicle.model.toLowerCase().includes(query) &&
          !vehicle.licensePlate.toLowerCase().includes(query) &&
          !vehicle.company.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Brand filter
      if (filterBrand && !vehicle.brand.toLowerCase().includes(filterBrand.toLowerCase())) {
        return false;
      }

      // Model filter
      if (filterModel && !vehicle.model.toLowerCase().includes(filterModel.toLowerCase())) {
        return false;
      }

      // Company filter
      if (filterCompany && vehicle.company !== filterCompany) {
        return false;
      }

      // Status filter
      if (filterStatus && vehicle.status !== filterStatus) {
        return false;
      }

      // Status group filters
      if (!showAvailable && vehicle.status === 'available') return false;
      if (!showRented && vehicle.status === 'rented') return false;
      if (!showMaintenance && vehicle.status === 'maintenance') return false;
      if (!showOther && !['available', 'rented', 'maintenance'].includes(vehicle.status)) return false;

      return true;
    });
  }, [
    state.vehicles,
    searchQuery,
    filterBrand,
    filterModel,
    filterCompany,
    filterStatus,
    showAvailable,
    showRented,
    showMaintenance,
    showOther
  ]);

  // Get unique values for filters
  const uniqueBrands = [...new Set(state.vehicles.map(v => v.brand))].sort();
  const uniqueModels = [...new Set(state.vehicles.map(v => v.model))].sort();
  const uniqueCompanies = [...new Set(state.vehicles.map(v => v.company))].sort();

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
                    borderBottom: index < filteredVehicles.length - 1 ? '1px solid #e0e0e0' : 'none',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    minHeight: 80,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEdit(vehicle)}
                >
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
                        bgcolor: getStatusColor(vehicle.status),
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
                        bgcolor: getStatusColor(vehicle.status),
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
    </Box>
  );
} 