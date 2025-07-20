import React, { useState, useMemo } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  DirectionsCar as CarIcon,
  CalendarToday as CalendarIcon,
  Euro as EuroIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Customer, Rental, Vehicle } from '../../types';
import dayjs from 'dayjs';

interface CustomerRentalHistoryProps {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  rentals: Rental[];
  vehicles: Vehicle[];
}

const getRentalStatus = (rental: Rental) => {
  const now = dayjs();
  const startDate = dayjs(rental.startDate);
  const endDate = dayjs(rental.endDate);

  if (rental.status === 'finished') return { status: 'finished', label: 'Ukončený', color: 'default' as const };
  
  if (now.isBefore(startDate)) {
    return { status: 'pending', label: 'Čaká', color: 'warning' as const };
  } else if (now.isAfter(endDate)) {
    return { status: 'overdue', label: 'Po termíne', color: 'error' as const };
  } else {
    return { status: 'active', label: 'Aktívny', color: 'success' as const };
  }
};

const getPaymentMethodText = (method: string) => {
  const methods: Record<string, string> = {
    'cash': 'Hotovosť',
    'bank_transfer': 'Bankový prevod',
    'vrp': 'VRP',
    'direct_to_owner': 'Priamo majiteľovi'
  };
  return methods[method] || method;
};

export default function CustomerRentalHistory({ 
  open, 
  onClose, 
  customer, 
  rentals, 
  vehicles 
}: CustomerRentalHistoryProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  // Filtrujeme prenájmy pre tohto zákazníka
  const customerRentals = useMemo(() => {
    return rentals.filter(rental => 
      rental.customerId === customer.id || 
      rental.customerName === customer.name
    ).sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf());
  }, [rentals, customer]);

  const handleViewRentalDetail = (rental: Rental) => {
    setSelectedRental(rental);
  };

  const handleCloseRentalDetail = () => {
    setSelectedRental(null);
  };

  const getVehicleInfo = (rental: Rental) => {
    if (rental.vehicle) {
      return `${rental.vehicle.brand} ${rental.vehicle.model} (${rental.vehicle.licensePlate})`;
    }
    if (rental.vehicleId) {
      const vehicle = vehicles.find(v => v.id === rental.vehicleId);
      if (vehicle) {
        return `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
      }
    }
    return rental.vehicleName || 'Neznáme vozidlo';
  };

  const calculateRentalDays = (startDate: Date, endDate: Date) => {
    return dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Box>
            <Typography variant="h5" component="h2" color="white">
              História prenájmov - {customer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {customerRentals.length} prenájmov celkovo
            </Typography>
          </Box>
          <IconButton onClick={onClose} color="inherit">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {customerRentals.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Žiadne prenájmy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tento zákazník zatiaľ nemá žiadne prenájmy.
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Mobilné zobrazenie - karty */}
              {isMobile ? (
                <Box sx={{ p: 2 }}>
                  {customerRentals.map((rental) => {
                    const status = getRentalStatus(rental);
                    const days = calculateRentalDays(rental.startDate, rental.endDate);
                    
                    return (
                      <Card 
                        key={rental.id} 
                        sx={{ 
                          mb: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': { 
                            boxShadow: 3,
                            transform: 'translateY(-1px)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          {/* Hlavička karty */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight="bold" color="white" sx={{ mb: 0.5 }}>
                                {getVehicleInfo(rental)}
                              </Typography>
                              <Chip 
                                label={status.label}
                                color={status.color}
                                size="small"
                                sx={{ mb: 1 }}
                              />
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleViewRentalDetail(rental)}
                              sx={{ 
                                color: 'white',
                                bgcolor: 'primary.main',
                                '&:hover': { bgcolor: 'primary.dark' }
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          {/* Dátumy */}
                          <Box sx={{ mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <CalendarIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                              <Typography variant="body2" color="white">
                                {dayjs(rental.startDate).format('DD.MM.YYYY')} - {dayjs(rental.endDate).format('DD.MM.YYYY')}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {days} dní • {dayjs(rental.createdAt).format('DD.MM.YYYY')}
                            </Typography>
                          </Box>

                          {/* Cena a platba */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="h6" color="white" fontWeight="bold">
                                {rental.totalPrice.toFixed(2)} €
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {getPaymentMethodText(rental.paymentMethod)}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" color="text.secondary">
                                Provízia: {rental.commission.toFixed(2)} €
                              </Typography>
                              {rental.paid ? (
                                <Chip 
                                  label="Zaplatené" 
                                  color="success" 
                                  size="small" 
                                  icon={<CheckCircleIcon />}
                                />
                              ) : (
                                <Chip 
                                  label="Nezaplatené" 
                                  color="warning" 
                                  size="small"
                                />
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              ) : (
                /* Desktop zobrazenie - tabuľka */
                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Vozidlo</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Dátumy</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Dní</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Cena</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Provízia</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Platba</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Stav</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Akcie</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerRentals.map((rental) => {
                        const status = getRentalStatus(rental);
                        const days = calculateRentalDays(rental.startDate, rental.endDate);
                        
                        return (
                          <TableRow 
                            key={rental.id}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                cursor: 'pointer'
                              }
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                <Typography variant="body2" color="white">
                                  {getVehicleInfo(rental)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="white">
                                {dayjs(rental.startDate).format('DD.MM.YYYY')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {dayjs(rental.endDate).format('DD.MM.YYYY')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="white">
                                {days}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="white" fontWeight="bold">
                                {rental.totalPrice.toFixed(2)} €
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {rental.commission.toFixed(2)} €
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" color="white">
                                  {getPaymentMethodText(rental.paymentMethod)}
                                </Typography>
                                {rental.paid ? (
                                  <Chip 
                                    label="Zaplatené" 
                                    color="success" 
                                    size="small" 
                                    icon={<CheckCircleIcon />}
                                  />
                                ) : (
                                  <Chip 
                                    label="Nezaplatené" 
                                    color="warning" 
                                    size="small"
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={status.label}
                                color={status.color}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleViewRentalDetail(rental)}
                                sx={{ color: 'primary.main' }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Zavrieť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail prenájmu */}
      {selectedRental && (
        <Dialog 
          open={!!selectedRental} 
          onClose={handleCloseRentalDetail}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pb: 1
          }}>
            <Typography variant="h6" color="white">
              Detail prenájmu
            </Typography>
            <IconButton onClick={handleCloseRentalDetail} color="inherit">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" color="white" gutterBottom>
                {getVehicleInfo(selectedRental)}
              </Typography>
              <Chip 
                label={getRentalStatus(selectedRental).label}
                color={getRentalStatus(selectedRental).color}
                sx={{ mb: 2 }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="subtitle1" color="white" gutterBottom>
                  Základné informácie
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Začiatok:</Typography>
                    <Typography variant="body2" color="white">
                      {dayjs(selectedRental.startDate).format('DD.MM.YYYY HH:mm')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Koniec:</Typography>
                    <Typography variant="body2" color="white">
                      {dayjs(selectedRental.endDate).format('DD.MM.YYYY HH:mm')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Dní:</Typography>
                    <Typography variant="body2" color="white">
                      {calculateRentalDays(selectedRental.startDate, selectedRental.endDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Vytvorený:</Typography>
                    <Typography variant="body2" color="white">
                      {dayjs(selectedRental.createdAt).format('DD.MM.YYYY HH:mm')}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" color="white" gutterBottom>
                  Finančné informácie
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Celková cena:</Typography>
                    <Typography variant="body2" color="white" fontWeight="bold">
                      {selectedRental.totalPrice.toFixed(2)} €
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Provízia:</Typography>
                    <Typography variant="body2" color="white">
                      {selectedRental.commission.toFixed(2)} €
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Spôsob platby:</Typography>
                    <Typography variant="body2" color="white">
                      {getPaymentMethodText(selectedRental.paymentMethod)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Stav platby:</Typography>
                    <Typography variant="body2" color="white">
                      {selectedRental.paid ? 'Zaplatené' : 'Nezaplatené'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {selectedRental.notes && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" color="white" gutterBottom>
                  Poznámky
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRental.notes}
                </Typography>
              </Box>
            )}

            {selectedRental.discount && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" color="white" gutterBottom>
                  Zľava
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRental.discount.type === 'percentage' 
                    ? `${selectedRental.discount.value}%` 
                    : `${selectedRental.discount.value} €`}
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseRentalDetail} variant="outlined">
              Zavrieť
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
} 