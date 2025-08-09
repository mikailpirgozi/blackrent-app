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
  Divider,
  Grid,
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
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { sk } from 'date-fns/locale';

interface CustomerRentalHistoryProps {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  rentals: Rental[];
  vehicles: Vehicle[];
}

const getRentalStatus = (rental: Rental) => {
  const now = new Date();
  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);

  if (rental.status === 'finished') return { status: 'finished', label: 'Ukončený', color: 'default' as const };
  
  if (isBefore(now, startDate)) {
    return { status: 'pending', label: 'Čaká', color: 'warning' as const };
  } else if (isAfter(now, endDate)) {
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
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  // Filtrujeme prenájmy pre tohto zákazníka
  const customerRentals = useMemo(() => {
    return rentals.filter(rental => 
      rental.customerId === customer.id || 
      rental.customerName === customer.name
    ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
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
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            minHeight: isMobile ? '100vh' : 'auto',
            maxHeight: isMobile ? '100vh' : '90vh',
            borderRadius: isMobile ? 0 : 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1,
          backgroundColor: 'primary.main',
          color: 'white',
          '& .MuiTypography-root': {
            color: 'white'
          }
        }}>
          <Box>
            <Typography variant={isSmallScreen ? "h6" : isMobile ? "h5" : "h4"} component="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
              História prenájmov - {customer.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {customerRentals.length} prenájmov celkovo
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, backgroundColor: 'background.default' }}>
          {customerRentals.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', backgroundColor: 'background.paper' }}>
              <Typography variant="h6" sx={{ color: 'text.primary', mb: 2 }}>
                Žiadne prenájmy
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Tento zákazník zatiaľ nemá žiadne prenájmy.
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Mobilné zobrazenie - karty */}
              {isMobile ? (
                <Box sx={{ p: isSmallScreen ? 1 : 2 }}>
                  {customerRentals.map((rental) => {
                    const status = getRentalStatus(rental);
                    // Safe date conversion
                    const startDate = rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate);
                    const endDate = rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate);
                    const days = calculateRentalDays(startDate, endDate);
                    
                    return (
                      <Card 
                        key={rental.id} 
                        sx={{ 
                          mb: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: 'background.paper',
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
                              <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 0.5 }}>
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
                              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                {format(new Date(rental.startDate), 'dd.MM.yyyy', { locale: sk })} - {format(new Date(rental.endDate), 'dd.MM.yyyy', { locale: sk })}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {days} dní • {format(new Date(rental.createdAt), 'dd.MM.yyyy', { locale: sk })}
                            </Typography>
                          </Box>

                          {/* Cena a platba */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                {rental.totalPrice.toFixed(2)} €
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {getPaymentMethodText(rental.paymentMethod)}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
                <TableContainer component={Paper} sx={{ 
                  maxHeight: isTablet ? 500 : 600, 
                  backgroundColor: 'background.paper',
                  borderRadius: isTablet ? 1 : 2,
                }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'primary.main' }}>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>Vozidlo</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>Dátumy</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>Dní</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>Cena</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>Provízia</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>Platba</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>Stav</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'white', borderBottom: '2px solid', borderColor: 'primary.dark' }}>Akcie</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerRentals.map((rental) => {
                        const status = getRentalStatus(rental);
                        // Safe date conversion
                        const startDate = rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate);
                        const endDate = rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate);
                        const days = calculateRentalDays(startDate, endDate);
                        
                        return (
                          <TableRow 
                            key={rental.id}
                            sx={{ 
                              backgroundColor: 'background.paper',
                              '&:hover': { 
                                backgroundColor: 'action.hover',
                                cursor: 'pointer'
                              },
                              '&:nth-of-type(even)': {
                                backgroundColor: 'action.hover'
                              }
                            }}
                          >
                            <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
                                  {getVehicleInfo(rental)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                {format(new Date(rental.startDate), 'dd.MM.yyyy', { locale: sk })}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {format(new Date(rental.endDate), 'dd.MM.yyyy', { locale: sk })}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                {days}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                {rental.totalPrice.toFixed(2)} €
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {rental.commission.toFixed(2)} €
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Box>
                                <Typography variant="body2" sx={{ color: 'text.primary' }}>
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
                            <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Chip 
                                label={status.label}
                                color={status.color}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
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

        <DialogActions sx={{ p: 2, backgroundColor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} variant="outlined" sx={{ minWidth: 100 }}>
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
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              backgroundColor: 'background.paper',
              minHeight: isMobile ? '100vh' : 'auto',
              maxHeight: isMobile ? '100vh' : '90vh',
              borderRadius: isMobile ? 0 : 2,
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pb: 1,
            backgroundColor: 'primary.main',
            color: 'white',
            '& .MuiTypography-root': {
              color: 'white'
            }
          }}>
            <Typography variant={isSmallScreen ? "h6" : isMobile ? "h5" : "h4"} sx={{ color: 'white', fontWeight: 'bold' }}>
              Detail prenájmu
            </Typography>
            <IconButton onClick={handleCloseRentalDetail} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ backgroundColor: 'background.default' }}>
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 1 }}>
                {getVehicleInfo(selectedRental)}
              </Typography>
              <Chip 
                label={getRentalStatus(selectedRental).label}
                color={getRentalStatus(selectedRental).color}
                sx={{ mb: 2 }}
              />
            </Box>

            <Grid container spacing={isSmallScreen ? 1 : 2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: 'background.paper', height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
                      Základné informácie
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Začiatok:</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {format(new Date(selectedRental.startDate), 'dd.MM.yyyy HH:mm', { locale: sk })}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Koniec:</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {format(new Date(selectedRental.endDate), 'dd.MM.yyyy HH:mm', { locale: sk })}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Dní:</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                          {(() => {
                            // Safe date conversion
                            const startDate = selectedRental.startDate instanceof Date ? selectedRental.startDate : new Date(selectedRental.startDate);
                            const endDate = selectedRental.endDate instanceof Date ? selectedRental.endDate : new Date(selectedRental.endDate);
                            return calculateRentalDays(startDate, endDate);
                          })()}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Vytvorený:</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {format(new Date(selectedRental.createdAt), 'dd.MM.yyyy HH:mm', { locale: sk })}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ backgroundColor: 'background.paper', height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
                      Finančné informácie
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Celková cena:</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: '1.1rem' }}>
                          {selectedRental.totalPrice.toFixed(2)} €
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Provízia:</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {selectedRental.commission.toFixed(2)} €
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Spôsob platby:</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {getPaymentMethodText(selectedRental.paymentMethod)}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>Stav platby:</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {selectedRental.paid ? 'Zaplatené' : 'Nezaplatené'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {selectedRental.notes && (
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: 'background.paper', mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
                      Poznámky
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                      {selectedRental.notes}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {selectedRental.discount && (
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: 'background.paper', mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
                      Zľava
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {selectedRental.discount.type === 'percentage' 
                        ? `${selectedRental.discount.value}%` 
                        : `${selectedRental.discount.value} €`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2, backgroundColor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={handleCloseRentalDetail} variant="outlined" sx={{ minWidth: 100 }}>
              Zavrieť
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
} 