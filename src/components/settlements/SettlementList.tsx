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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  useMediaQuery,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Settlement } from '../../types';
import { format, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale/sk';
import SettlementDetail from './SettlementDetail';
import { v4 as uuidv4 } from 'uuid';

export default function SettlementList() {
  const { state, dispatch, createSettlement } = useApp();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  
  // Hook na detekciu mobilu
  const isMobile = useMediaQuery('(max-width:600px)');
  
  // Nové stavy pre generovanie vyúčtovania
  const [selectedCompany, setSelectedCompany] = useState('');
  const [fromDate, setFromDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleView = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Naozaj chcete vymazať toto vyúčtovanie?')) {
      dispatch({ type: 'DELETE_SETTLEMENT', payload: id });
    }
  };

  const generateSettlement = async () => {
    if (!selectedCompany) {
      alert('Vyberte firmu pre vyúčtovanie');
      return;
    }

    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      // Filtrujeme prenájmy podľa firmy a dátumu
      const filteredRentals = state.rentals.filter(rental => {
        const rentalDate = new Date(rental.startDate);
        return rentalDate >= from && 
               rentalDate <= to && 
               rental.vehicle?.company === selectedCompany;
      });

      // Filtrujeme náklady pre vybranú firmu
      const filteredExpenses = state.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= from && 
               expenseDate <= to && 
               expense.company === selectedCompany;
      });

      // Počítame podľa spôsobov platby
      const rentalsByPaymentMethod = {
        cash: filteredRentals.filter(r => r.paymentMethod === 'cash'),
        bank_transfer: filteredRentals.filter(r => r.paymentMethod === 'bank_transfer'),
        vrp: filteredRentals.filter(r => r.paymentMethod === 'vrp'),
        direct_to_owner: filteredRentals.filter(r => r.paymentMethod === 'direct_to_owner'),
      };

      const totalIncome = filteredRentals.reduce((sum, rental) => sum + rental.totalPrice, 0);
      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalCommission = filteredRentals.reduce((sum, rental) => sum + rental.commission, 0);
      const profit = totalIncome - totalExpenses - totalCommission;

      const newSettlement: Settlement = {
        id: uuidv4(),
        period: { from, to },
        rentals: filteredRentals,
        expenses: filteredExpenses,
        totalIncome,
        totalExpenses,
        totalCommission,
        profit,
        company: selectedCompany,
      };

      // Volaj API pre vytvorenie vyúčtovania
      await createSettlement(newSettlement);
      
      // Reset formulára po úspešnom vytvorení
      setSelectedCompany('');
      setFromDate(format(new Date().setDate(1), 'yyyy-MM-dd'));
      setToDate(format(new Date(), 'yyyy-MM-dd'));
      
    } catch (error) {
      console.error('Chyba pri generovaní vyúčtovania:', error);
      alert('Chyba pri generovaní vyúčtovania: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };

  const filteredSettlements = state.settlements.filter(settlement => {
    if (filterCompany && settlement.company && settlement.company !== filterCompany) return false;
    if (filterVehicle && settlement.vehicleId && settlement.vehicleId !== filterVehicle) return false;
    return true;
  });

  const companies = Array.from(new Set(state.vehicles.map(v => v.company)));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Vyúčtovanie</Typography>
      </Box>

      {/* Formulár pre generovanie vyúčtovania */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Generovať nové vyúčtovanie
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Firma</InputLabel>
              <Select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                label="Firma"
              >
                <MenuItem value="">Vyberte firmu</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Dátum od"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Dátum do"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={generateSettlement}
            disabled={!selectedCompany}
          >
            Generovať vyúčtovanie
          </Button>
        </CardContent>
      </Card>

      {/* Filtre pre zobrazenie */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtre pre zobrazenie
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Filtrovať podľa firmy</InputLabel>
              <Select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                label="Filtrovať podľa firmy"
              >
                <MenuItem value="">Všetky firmy</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Filtrovať podľa vozidla</InputLabel>
              <Select
                value={filterVehicle}
                onChange={(e) => setFilterVehicle(e.target.value)}
                label="Filtrovať podľa vozidla"
              >
                <MenuItem value="">Všetky vozidlá</MenuItem>
                {state.vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Mobilné zobrazenie - karty */}
      {isMobile ? (
        <Box>
          {filteredSettlements.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Žiadne vyúčtovania
              </Typography>
            </Card>
          ) : (
            filteredSettlements.map((settlement) => (
              <Card 
                key={settlement.id} 
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
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5, color: '#111' }}>
                        {settlement.company || 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#666' }}>
                        {format(settlement.period.from, 'dd.MM.yyyy', { locale: sk })} - {format(settlement.period.to, 'dd.MM.yyyy', { locale: sk })}
                      </Typography>
                    </Box>
                    <Chip
                      label={settlement.profit >= 0 ? `+${settlement.profit.toFixed(2)}€` : `${settlement.profit.toFixed(2)}€`}
                      color={settlement.profit >= 0 ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>

                  {/* Finančné údaje */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        Príjmy
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {settlement.totalIncome.toFixed(2)}€
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="error.main" fontWeight="bold">
                        Náklady
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {settlement.totalExpenses.toFixed(2)}€
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1, mb: 1.5 }}>
                    <Typography variant="body2" color="warning.main" fontWeight="bold">
                      Provízie
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {settlement.totalCommission.toFixed(2)}€
                    </Typography>
                  </Box>

                  {/* Akčné tlačidlá */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleView(settlement)}
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
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(settlement.id)}
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
        <Card>
          <CardContent>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Firma</TableCell>
                  <TableCell>Obdobie</TableCell>
                  <TableCell>Príjmy (€)</TableCell>
                  <TableCell>Náklady (€)</TableCell>
                  <TableCell>Provízie (€)</TableCell>
                  <TableCell>Zisk (€)</TableCell>
                  <TableCell>Akcie</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSettlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell>{settlement.company || 'N/A'}</TableCell>
                    <TableCell>
                      {format(typeof settlement.period.from === 'string' ? parseISO(settlement.period.from) : settlement.period.from, 'dd.MM.yyyy', { locale: sk })} - 
                      {format(typeof settlement.period.to === 'string' ? parseISO(settlement.period.to) : settlement.period.to, 'dd.MM.yyyy', { locale: sk })}
                    </TableCell>
                    <TableCell>{settlement.totalIncome.toFixed(2)}</TableCell>
                    <TableCell>{settlement.totalExpenses.toFixed(2)}</TableCell>
                    <TableCell>{settlement.totalCommission.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={settlement.profit.toFixed(2)}
                        color={settlement.profit >= 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleView(settlement)}
                        sx={{ color: 'primary.main' }}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(settlement.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                          </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
      )}

    <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Detail vyúčtovania
        </DialogTitle>
        <DialogContent>
          {selectedSettlement && (
            <SettlementDetail
              settlement={selectedSettlement}
              onClose={() => setOpenDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 