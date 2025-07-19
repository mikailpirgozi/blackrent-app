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
  Collapse,
  Fab,
  useMediaQuery,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  DirectionsCar as CarIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Event as EventIcon,
  Euro as EuroIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Insurance } from '../../types';
import { format, isAfter, addDays, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import InsuranceForm from './InsuranceForm';

const getExpiryStatus = (validTo: Date | string) => {
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);
  
  // Konvertuj string na Date ak je potrebné
  const validToDate = typeof validTo === 'string' ? parseISO(validTo) : validTo;
  
  if (isAfter(today, validToDate)) {
    return { status: 'expired', color: 'error', text: 'Vypršala' };
  } else if (isAfter(validToDate, thirtyDaysFromNow)) {
    return { status: 'valid', color: 'success', text: 'Platná' };
  } else {
    return { status: 'expiring', color: 'warning', text: 'Vyprší čoskoro' };
  }
};

export default function InsuranceList() {
  const { state, dispatch, createInsurance } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterValidFrom, setFilterValidFrom] = useState('');
  const [filterValidTo, setFilterValidTo] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

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
        // TODO: Implementovať updateInsurance API
        dispatch({ type: 'UPDATE_INSURANCE', payload: insurance });
      } else {
        // Volaj API pre vytvorenie poistky
        await createInsurance(insurance);
      }
      setOpenDialog(false);
      setEditingInsurance(null);
    } catch (error) {
      console.error('Chyba pri ukladaní poistky:', error);
      alert('Chyba pri ukladaní poistky: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };

  const expiringInsurances = state.insurances.filter(insurance => {
    const status = getExpiryStatus(insurance.validTo);
    return status.status === 'expiring' || status.status === 'expired';
  });

  const filteredInsurances = state.insurances.filter((insurance) => {
    if (filterVehicle && insurance.vehicleId !== filterVehicle) return false;
    if (filterCompany && insurance.company !== filterCompany) return false;
    if (filterType && insurance.type !== filterType) return false;
    if (filterValidFrom && new Date(insurance.validFrom) < new Date(filterValidFrom)) return false;
    if (filterValidTo && new Date(insurance.validTo) > new Date(filterValidTo)) return false;
    return true;
  });

  const clearFilters = () => {
    setFilterVehicle('');
    setFilterCompany('');
    setFilterType('');
    setFilterValidFrom('');
    setFilterValidTo('');
  };

  const hasActiveFilters = filterVehicle || filterCompany || filterType || filterValidFrom || filterValidTo;

  return (
    <Box sx={{ pb: isMobile ? 8 : 0 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <Typography variant="h4" color="text.primary" sx={{ fontWeight: 'bold' }}>
          Poistky
        </Typography>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            }}
          >
            Pridať poistku
          </Button>
        )}
      </Box>

      {/* Mobilné filtre */}
      {isMobile && (
        <Accordion 
          expanded={filtersExpanded} 
          onChange={() => setFiltersExpanded(!filtersExpanded)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon />
              <Typography>Filtre</Typography>
              {hasActiveFilters && (
                <Chip 
                  label="Aktívne" 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                <InputLabel>Poisťovňa</InputLabel>
                <Select
                  value={filterCompany}
                  label="Poisťovňa"
                  onChange={e => setFilterCompany(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  {Array.from(new Set(state.insurances.map(i => i.company))).map(company => (
                    <MenuItem key={company} value={company}>{company}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Typ poistky</InputLabel>
                <Select
                  value={filterType}
                  label="Typ poistky"
                  onChange={e => setFilterType(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  {Array.from(new Set(state.insurances.map(i => i.type))).map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Platná od"
                type="date"
                value={filterValidFrom}
                onChange={e => setFilterValidFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Platná do"
                type="date"
                value={filterValidTo}
                onChange={e => setFilterValidTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              {hasActiveFilters && (
                <Button 
                  variant="outlined" 
                  onClick={clearFilters}
                  sx={{ mt: 1 }}
                >
                  Vymazať filtre
                </Button>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Desktop filtre */}
      {!isMobile && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2 }}>
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
                <InputLabel>Poisťovňa</InputLabel>
                <Select
                  value={filterCompany}
                  label="Poisťovňa"
                  onChange={e => setFilterCompany(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  {Array.from(new Set(state.insurances.map(i => i.company))).map(company => (
                    <MenuItem key={company} value={company}>{company}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Typ poistky</InputLabel>
                <Select
                  value={filterType}
                  label="Typ poistky"
                  onChange={e => setFilterType(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  {Array.from(new Set(state.insurances.map(i => i.type))).map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Platná od"
                type="date"
                value={filterValidFrom}
                onChange={e => setFilterValidFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Platná do"
                type="date"
                value={filterValidTo}
                onChange={e => setFilterValidTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {expiringInsurances.length > 0 && (
        <Card sx={{ mb: 3, backgroundColor: 'warning.dark' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⚠️ Upozornenie: {expiringInsurances.length} poistiek vyprší čoskoro alebo už vypršala
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Mobilné karty */}
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredInsurances.map((insurance) => {
            const vehicle = state.vehicles.find(v => v.id === insurance.vehicleId);
            const expiryStatus = getExpiryStatus(insurance.validTo);
            
            return (
              <Card key={insurance.id} sx={{ 
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: '#222',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" color="text.primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {vehicle?.licensePlate}
                      </Typography>
                    </Box>
                    <Chip
                      label={expiryStatus.text}
                      color={expiryStatus.color as any}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
                        {insurance.type}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
                        {insurance.company}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        📄 Číslo: {insurance.policyNumber}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" color="text.secondary">
                        {format(typeof insurance.validFrom === 'string' ? parseISO(insurance.validFrom) : insurance.validFrom, 'dd.MM.yyyy', { locale: sk })} - {format(typeof insurance.validTo === 'string' ? parseISO(insurance.validTo) : insurance.validTo, 'dd.MM.yyyy', { locale: sk })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EuroIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
                        {insurance.price.toFixed(2)} €
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(insurance)}
                      sx={{
                        borderColor: '#90caf9',
                        color: '#90caf9',
                        '&:hover': {
                          borderColor: '#64b5f6',
                          backgroundColor: 'rgba(144,202,249,0.08)',
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
                        borderColor: '#ef9a9a',
                        color: '#ef9a9a',
                        '&:hover': {
                          borderColor: '#e57373',
                          backgroundColor: 'rgba(239,154,154,0.08)',
                        },
                      }}
                    >
                      Vymazať
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        /* Desktop tabuľka */
        <Card>
          <CardContent>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vozidlo</TableCell>
                    <TableCell>Typ poistky</TableCell>
                    <TableCell>Číslo poistky</TableCell>
                    <TableCell>Poistovňa</TableCell>
                    <TableCell>Platná od</TableCell>
                    <TableCell>Platná do</TableCell>
                    <TableCell>Cena (€)</TableCell>
                    <TableCell>Stav</TableCell>
                    <TableCell>Akcie</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInsurances.map((insurance) => {
                    const vehicle = state.vehicles.find(v => v.id === insurance.vehicleId);
                    const expiryStatus = getExpiryStatus(insurance.validTo);
                    
                    return (
                      <TableRow key={insurance.id}>
                        <TableCell>
                          {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'N/A'}
                        </TableCell>
                        <TableCell>{insurance.type}</TableCell>
                        <TableCell>{insurance.policyNumber}</TableCell>
                        <TableCell>{insurance.company}</TableCell>
                        <TableCell>
                          {format(typeof insurance.validFrom === 'string' ? parseISO(insurance.validFrom) : insurance.validFrom, 'dd.MM.yyyy', { locale: sk })}
                        </TableCell>
                        <TableCell>
                          {format(typeof insurance.validTo === 'string' ? parseISO(insurance.validTo) : insurance.validTo, 'dd.MM.yyyy', { locale: sk })}
                        </TableCell>
                        <TableCell>{insurance.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Chip
                            label={expiryStatus.text}
                            color={expiryStatus.color as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(insurance)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(insurance.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Plávajúce tlačidlo pre mobilné zariadenia */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleAdd}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="insurance-dialog-title"
        disableRestoreFocus
        keepMounted={false}
      >
        <DialogTitle id="insurance-dialog-title">
          {editingInsurance ? 'Upraviť poistku' : 'Pridať novú poistku'}
        </DialogTitle>
        <DialogContent>
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