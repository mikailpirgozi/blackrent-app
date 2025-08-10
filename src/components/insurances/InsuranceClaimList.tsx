import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Grid,
  Tooltip,
  CircularProgress,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DirectionsCar as CarIcon,
  Event as EventIcon,
  Euro as EuroIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  ReportProblem as ClaimIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { InsuranceClaim } from '../../types';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import InsuranceClaimForm from './InsuranceClaimForm';
import { useInfiniteInsuranceClaims } from '../../hooks/useInfiniteInsuranceClaims';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

const getIncidentTypeInfo = (type: string) => {
  switch (type) {
    case 'accident':
      return { label: 'Nehoda', color: '#d32f2f', bgColor: '#ffebee' };
    case 'theft':
      return { label: 'Krádež', color: '#7b1fa2', bgColor: '#f3e5f5' };
    case 'vandalism':
      return { label: 'Vandalizmus', color: '#f57c00', bgColor: '#fff3e0' };
    case 'weather':
      return { label: 'Počasie', color: '#1976d2', bgColor: '#e3f2fd' };
    default:
      return { label: 'Iné', color: '#616161', bgColor: '#f5f5f5' };
  }
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'reported':
      return { label: 'Nahlásené', color: '#f57c00', bgColor: '#fff3e0', icon: <ScheduleIcon sx={{ fontSize: 14 }} /> };
    case 'investigating':
      return { label: 'Vyšetruje sa', color: '#1976d2', bgColor: '#e3f2fd', icon: <SearchIcon sx={{ fontSize: 14 }} /> };
    case 'approved':
      return { label: 'Schválené', color: '#388e3c', bgColor: '#e8f5e8', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> };
    case 'rejected':
      return { label: 'Zamietnuté', color: '#d32f2f', bgColor: '#ffebee', icon: <ErrorIcon sx={{ fontSize: 14 }} /> };
    case 'closed':
      return { label: 'Uzavreté', color: '#616161', bgColor: '#f5f5f5', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> };
    default:
      return { label: 'Neznáme', color: '#616161', bgColor: '#f5f5f5', icon: <WarningIcon sx={{ fontSize: 14 }} /> };
  }
};

export default function InsuranceClaimList() {
  const { 
    state, 
    createInsuranceClaim,
    updateInsuranceClaim,
    deleteInsuranceClaim
  } = useApp();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClaim, setEditingClaim] = useState<InsuranceClaim | null>(null);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // 🚀 INFINITE SCROLL - použitie nového hooku
  const {
    claims,
    loading,
    hasMore,
    searchTerm,
    setSearchTerm,
    loadMore,
    refresh,
    updateFilters
  } = useInfiniteInsuranceClaims();

  // 🚀 Infinite scroll detection
  useInfiniteScroll(scrollContainerRef, loadMore, hasMore && !loading, 0.7);

  // 🚀 Update filters when they change
  useEffect(() => {
    const filters: any = {};
    
    if (filterStatus) filters.status = filterStatus;
    if (filterType) filters.incidentType = filterType;
    // Note: vehicleId filter would need to be added to the hook
    
    updateFilters(filters);
  }, [filterStatus, filterType, updateFilters]);

  // Use claims from hook
  const filteredClaims = claims;
  const paginatedClaims = claims;

  const handleAdd = () => {
    setEditingClaim(null);
    setOpenDialog(true);
  };

  const handleEdit = (claim: InsuranceClaim) => {
    setEditingClaim(claim);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať túto poistnú udalosť?')) {
      try {
        await deleteInsuranceClaim(id);
        refresh(); // Refresh data after delete
      } catch (error) {
        alert('Chyba pri mazaní poistnej udalosti');
      }
    }
  };

  const handleSave = async (claimData: InsuranceClaim) => {
    try {
      if (editingClaim && editingClaim.id) {
        await updateInsuranceClaim(claimData);
      } else {
        await createInsuranceClaim(claimData);
      }
      setOpenDialog(false);
      setEditingClaim(null);
      refresh(); // Refresh data after save
    } catch (error) {
      console.error('Chyba pri ukladaní poistnej udalosti:', error);
      alert('Chyba pri ukladaní poistnej udalosti: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterVehicle('');
    setFilterStatus('');
    setFilterType('');
  };

  const hasActiveFilters = searchTerm || filterVehicle || filterStatus || filterType;

  if (!state.insuranceClaims) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ClaimIcon sx={{ color: '#d32f2f' }} />
          Poistné udalosti
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ borderRadius: 2 }}
        >
          Pridať udalosť
        </Button>
      </Box>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    CELKOM
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {claims.length}
                  </Typography>
                </Box>
                <ClaimIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    VYŠETRUJE SA
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {claims.filter(c => c.status === 'investigating').length}
                  </Typography>
                </Box>
                <SearchIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    SCHVÁLENÉ
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {claims.filter(c => c.status === 'approved').length}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ZAMIETNUTÉ
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {claims.filter(c => c.status === 'rejected').length}
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
          <Box sx={{ display: 'flex', gap: 2, mb: showFilters ? 2 : 0, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Vyhľadať udalosť..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ flex: 1, minWidth: '250px' }}
            />
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Filtre {hasActiveFilters && `(${[searchTerm, filterVehicle, filterStatus, filterType].filter(Boolean).length})`}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={clearFilters}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Vyčistiť
              </Button>
            )}
          </Box>

          {showFilters && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Vozidlo</InputLabel>
                  <Select
                    value={filterVehicle}
                    onChange={(e) => setFilterVehicle(e.target.value)}
                    label="Vozidlo"
                  >
                    <MenuItem value="">Všetky</MenuItem>
                    {state.vehicles?.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Stav</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Stav"
                  >
                    <MenuItem value="">Všetky</MenuItem>
                    <MenuItem value="reported">Nahlásené</MenuItem>
                    <MenuItem value="investigating">Vyšetruje sa</MenuItem>
                    <MenuItem value="approved">Schválené</MenuItem>
                    <MenuItem value="rejected">Zamietnuté</MenuItem>
                    <MenuItem value="closed">Uzavreté</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Typ udalosti</InputLabel>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    label="Typ udalosti"
                  >
                    <MenuItem value="">Všetky</MenuItem>
                    <MenuItem value="accident">Nehoda</MenuItem>
                    <MenuItem value="theft">Krádež</MenuItem>
                    <MenuItem value="vandalism">Vandalizmus</MenuItem>
                    <MenuItem value="weather">Počasie</MenuItem>
                    <MenuItem value="other">Iné</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Claims Table */}
      {filteredClaims.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <ClaimIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {hasActiveFilters ? 'Žiadne výsledky' : 'Žiadne poistné udalosti'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {hasActiveFilters 
                ? 'Skúste zmeniť filter alebo vyhľadávací výraz'
                : 'Zatiaľ neboli vytvorené žiadne poistné udalosti'
              }
            </Typography>
            {!hasActiveFilters && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                Pridať prvú udalosť
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <TableContainer 
            ref={scrollContainerRef}
            component={Paper} 
            sx={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Dátum udalosti</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vozidlo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Typ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Popis</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Stav</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Škoda</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Akcie</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedClaims.map((claim) => {
                  const vehicle = state.vehicles?.find(v => v.id === claim.vehicleId);
                  const typeInfo = getIncidentTypeInfo(claim.incidentType);
                  const statusInfo = getStatusInfo(claim.status);
                  
                  return (
                    <TableRow key={claim.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          {format(new Date(claim.incidentDate), 'dd.MM.yyyy', { locale: sk })}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CarIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Neznáme vozidlo'}
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {vehicle?.licensePlate}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={typeInfo.label}
                          size="small"
                          sx={{
                            backgroundColor: typeInfo.bgColor,
                            color: typeInfo.color,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {claim.description.length > 50 
                            ? `${claim.description.substring(0, 50)}...` 
                            : claim.description
                          }
                        </Typography>
                        {claim.location && (
                          <Typography variant="caption" color="text.secondary">
                            📍 {claim.location}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          size="small"
                          sx={{
                            backgroundColor: statusInfo.bgColor,
                            color: statusInfo.color,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {claim.estimatedDamage ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EuroIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            {claim.estimatedDamage.toLocaleString()} €
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Upraviť">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(claim)}
                              sx={{ color: '#1976d2' }}
                            >
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Vymazať">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(claim.id)}
                              sx={{ color: '#d32f2f' }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Load More Button */}
          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Button
                variant="outlined"
                onClick={loadMore}
                disabled={loading}
                sx={{ minWidth: 200 }}
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
          {!hasMore && claims.length > 0 && (
            <Box sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
              <Typography variant="body2">Koniec zoznamu</Typography>
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleAdd}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Insurance Claim Form Dialog */}
      {openDialog && (
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="lg"
          fullWidth
          disableRestoreFocus
          keepMounted={false}
        >
          <InsuranceClaimForm
            claim={editingClaim}
            onSave={handleSave}
            onCancel={() => setOpenDialog(false)}
          />
        </Dialog>
      )}
    </Box>
  );
} 