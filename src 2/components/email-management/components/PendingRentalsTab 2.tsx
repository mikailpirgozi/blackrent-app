/**
 * Pending Rentals Tab Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  CheckCircle,
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { Rental } from '../../../types';
import { usePendingRentals } from '../hooks/usePendingRentals';
import { formatCurrency, formatDate } from '../utils/email-formatters';

import { RejectDialog } from './dialogs/RejectDialog';

export const PendingRentalsTab: React.FC = () => {
  // State
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    rentalId: string | null;
  }>({
    open: false,
    rentalId: null,
  });
  const [rejectReason, setRejectReason] = useState('');

  // Hook
  const {
    pendingRentals,
    pendingLoading,
    expandedRentals,
    actionLoading,
    error,
    success,
    setError,
    setSuccess,
    fetchPendingRentals,
    handleApproveRental,
    handleRejectRental,
    toggleRentalExpansion,
  } = usePendingRentals();

  // Load pending rentals on mount
  useEffect(() => {
    fetchPendingRentals();
  }, [fetchPendingRentals]);

  const handleRejectRentalClick = async () => {
    if (!rejectDialog.rentalId) return;

    const success = await handleRejectRental(
      rejectDialog.rentalId,
      rejectReason
    );
    if (success) {
      setRejectDialog({ open: false, rentalId: null });
      setRejectReason('');
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h6" gutterBottom>
              ⏳ Čakajúce automatické prenájmy ({pendingRentals.length})
            </Typography>
            <Button
              variant="outlined"
              onClick={fetchPendingRentals}
              disabled={pendingLoading}
              startIcon={<RefreshIcon />}
            >
              Obnoviť
            </Button>
          </Box>

          {pendingLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : pendingRentals.length === 0 ? (
            <Box textAlign="center" py={6}>
              <CheckCircle fontSize="large" color="success" sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Žiadne čakajúce prenájmy
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Všetky automatické prenájmy boli spracované alebo žiadne ešte
                nepriišli.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {pendingRentals.map(rental => (
                <Grid item xs={12} key={rental.id}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="between"
                        alignItems="start"
                      >
                        <Box flex={1}>
                          {/* Rental Header */}
                          <Box
                            display="flex"
                            justifyContent="between"
                            alignItems="start"
                            mb={2}
                          >
                            <Box>
                              <Typography
                                variant="h6"
                                display="flex"
                                alignItems="center"
                                gap={1}
                              >
                                <CarIcon color="primary" />
                                {rental.vehicleName || 'Neznáme vozidlo'}
                                <Chip
                                  label={rental.vehicleCode}
                                  size="small"
                                  variant="outlined"
                                />
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                display="flex"
                                alignItems="center"
                                gap={1}
                              >
                                <PersonIcon fontSize="small" />
                                {rental.customerName}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1}>
                              <Tooltip title="Schváliť">
                                <IconButton
                                  color="success"
                                  onClick={() => handleApproveRental(rental.id)}
                                  disabled={actionLoading === rental.id}
                                >
                                  {actionLoading === rental.id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <ApproveIcon />
                                  )}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Zamietnuť">
                                <IconButton
                                  color="error"
                                  onClick={() =>
                                    setRejectDialog({
                                      open: true,
                                      rentalId: rental.id,
                                    })
                                  }
                                  disabled={actionLoading === rental.id}
                                >
                                  <RejectIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rozbaliť detaily">
                                <IconButton
                                  onClick={() =>
                                    toggleRentalExpansion(rental.id)
                                  }
                                >
                                  {expandedRentals.has(rental.id) ? (
                                    <ExpandLessIcon />
                                  ) : (
                                    <ExpandMoreIcon />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>

                          {/* Basic Info */}
                          <Grid container spacing={2} mb={2}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <CalendarIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  <strong>Od:</strong>{' '}
                                  {formatDate(rental.startDate)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <CalendarIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  <strong>Do:</strong>{' '}
                                  {formatDate(rental.endDate)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <EuroIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  <strong>Cena:</strong>{' '}
                                  {formatCurrency(rental.totalPrice)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <LocationIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  <strong>Miesto:</strong>{' '}
                                  {rental.handoverPlace}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>

                          {/* Expanded Details */}
                          <Collapse in={expandedRentals.has(rental.id)}>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2">
                                  <strong>Objednávka:</strong>{' '}
                                  {rental.orderNumber}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Email:</strong> {rental.customerEmail}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Telefón:</strong>{' '}
                                  {rental.customerPhone}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2">
                                  <strong>Denné km:</strong>{' '}
                                  {rental.dailyKilometers}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Záloha:</strong>{' '}
                                  {formatCurrency(rental.deposit || 0)}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Platba:</strong>{' '}
                                  {rental.paymentMethod}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Collapse>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <RejectDialog
        open={rejectDialog.open}
        isRental={true}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleRejectRentalClick}
        onCancel={() => {
          setRejectDialog({ open: false, rentalId: null });
          setRejectReason('');
        }}
      />
    </>
  );
};
