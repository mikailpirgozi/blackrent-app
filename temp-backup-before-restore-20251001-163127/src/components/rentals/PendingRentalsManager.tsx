import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  CheckCircle as ApproveIcon,
  CalendarToday as CalendarIcon,
  DirectionsCar as CarIcon,
  CheckCircle,
  Edit as EditIcon,
  Email as EmailIcon,
  Euro as EuroIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  Schedule as PendingIcon,
  Person as PersonIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

// import { useApp } from '../../context/AppContext'; // Migrated to React Query
import { useAuth } from '../../context/AuthContext';
import { useCustomers } from '../../lib/react-query/hooks/useCustomers';
import { useVehicles } from '../../lib/react-query/hooks/useVehicles';
import { apiService } from '../../services/api';
import type { Rental } from '../../types';
// import { Vehicle, Customer } from '../../types'; // TODO: Implement type usage

import EditRentalDialog from './EditRentalDialog';

interface PendingRentalsManagerProps {
  onRentalApproved?: (rentalId: string) => void;
  onRentalRejected?: (rentalId: string) => void;
}

interface RentalCardProps {
  rental: Rental;
  onApprove: (rentalId: string) => void;
  onReject: (rentalId: string, reason: string) => void;
  onEdit: (rental: Rental) => void;
}

const RentalCard: React.FC<RentalCardProps> = ({
  rental,
  onApprove,
  onReject,
  onEdit,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await onApprove(rental.id);
    } catch (error) {
      console.error('Error approving rental:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      return;
    }
    setProcessing(true);
    try {
      await onReject(rental.id, rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting rental:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: string | number) => {
    return `${amount}€`;
  };

  return (
    <>
      <Card sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
        <CardContent>
          {/* Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Badge
                badgeContent={<EmailIcon sx={{ fontSize: 12 }} />}
                color="primary"
              >
                <UnifiedIcon name="pending" color="warning" />
              </Badge>
              <Typography variant="h6" component="div">
                {rental.orderNumber || 'N/A'}
              </Typography>
              <Chip
                label="Email Auto"
                size="small"
                color="info"
                icon={<EmailIcon />}
              />
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="Upraviť prenájom">
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<UnifiedIcon name="edit" />}
                  onClick={() => onEdit(rental)}
                  disabled={processing}
                >
                  Upraviť
                </Button>
              </Tooltip>
              <Tooltip title="Schváliť prenájom">
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={handleApprove}
                  disabled={processing}
                >
                  Schváliť
                </Button>
              </Tooltip>
              <Tooltip title="Zamietnuť prenájom">
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => setShowRejectDialog(true)}
                  disabled={processing}
                >
                  Zamietnuť
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {/* Main Info */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <UnifiedIcon name="user" color="primary" fontSize="small" />
                <Typography variant="body1" fontWeight="bold">
                  {rental.customerName}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CarIcon color="primary" fontSize="small" />
                <Typography variant="body2">
                  {rental.vehicleName || 'Vozidlo nenájdené'}
                  {rental.vehicleCode && ` (${rental.vehicleCode})`}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EuroIcon color="primary" fontSize="small" />
                <Typography variant="body1">
                  <strong>{formatCurrency(rental.totalPrice)}</strong>
                  {rental.deposit && (
                    <span style={{ marginLeft: '8px', color: '#666' }}>
                      (Depozit: {formatCurrency(rental.deposit)})
                    </span>
                  )}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarIcon color="primary" fontSize="small" />
                <Typography variant="body2">
                  {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Expand/Collapse */}
          <Box display="flex" justifyContent="center">
            <IconButton onClick={() => setExpanded(!expanded)} size="small">
              {expanded ? <UnifiedIcon name="chevronUp" /> : <UnifiedIcon name="chevronDown" />}
              <Typography variant="caption" sx={{ ml: 1 }}>
                {expanded ? 'Skryť detaily' : 'Zobraziť detaily'}
              </Typography>
            </IconButton>
          </Box>

          {/* Expanded Details */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Detaily prenájmu
                </Typography>
                {rental.handoverPlace && (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LocationIcon fontSize="small" />
                    <Typography variant="body2">
                      Miesto: {rental.handoverPlace}
                    </Typography>
                  </Box>
                )}
                {rental.dailyKilometers && (
                  <Typography variant="body2" color="textSecondary">
                    Denný limit km: {rental.dailyKilometers}
                  </Typography>
                )}
                <Typography variant="body2" color="textSecondary">
                  Vytvorené:{' '}
                  {formatDate(rental.autoProcessedAt || rental.createdAt)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Obsah emailu
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    maxHeight: 200,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8em',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {rental.emailContent || 'Email obsah nedostupný'}
                </Paper>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Zamietnuť automatický prenájom</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Prečo zamietate tento prenájom? Dôvod bude uložený pre budúcu
            referenciu.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Dôvod zamietnutia"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Napr.: Neplatné dátumy, chýbajúce informácie, duplicitná objednávka..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)}>Zrušiť</Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={!rejectReason.trim() || processing}
          >
            Zamietnuť
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const PendingRentalsManager: React.FC<PendingRentalsManagerProps> = ({
  onRentalApproved,
  onRentalRejected,
}) => {
  const [pendingRentals, setPendingRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const { state } = useAuth();
  // const { state: appState } = useApp(); // Migrated to React Query
  const { data: vehicles = [] } = useVehicles();
  const { data: customers = [] } = useCustomers();

  const fetchPendingRentals = async () => {
    try {
      setLoading(true);
      setError(null);
      const rentals = await apiService.getPendingAutomaticRentals();
      console.log('✅ Loaded pending rentals:', rentals?.length || 0);
      setPendingRentals(rentals);
    } catch (error: unknown) {
      console.error('❌ Error fetching pending rentals:', error);
      setError('Nepodarilo sa načítať čakajúce prenájmy');
      setPendingRentals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRental = async (rentalId: string) => {
    try {
      await apiService.approveAutomaticRental(rentalId);
      // Remove from pending list
      setPendingRentals(prev => prev.filter(r => r.id !== rentalId));
      onRentalApproved?.(rentalId);
    } catch (error: unknown) {
      console.error('Error approving rental:', error);
      setError('Nepodarilo sa schváliť prenájom');
    }
  };

  const handleRejectRental = async (rentalId: string, reason: string) => {
    try {
      await apiService.rejectAutomaticRental(rentalId, reason);
      // Remove from pending list
      setPendingRentals(prev => prev.filter(r => r.id !== rentalId));
      onRentalRejected?.(rentalId);
    } catch (error: unknown) {
      console.error('Error rejecting rental:', error);
      setError('Nepodarilo sa zamietnuť prenájom');
    }
  };

  const handleEditRental = (rental: Rental) => {
    setEditingRental(rental);
    setEditDialogOpen(true);
  };

  const handleSaveEditedRental = (updatedData: Partial<Rental>) => {
    if (!editingRental) return;

    // Update rental in the list
    setPendingRentals(prev =>
      prev.map(rental =>
        rental.id === editingRental.id ? { ...rental, ...updatedData } : rental
      )
    );

    setEditDialogOpen(false);
    setEditingRental(null);
  };

  useEffect(() => {
    if (state.user && state.isAuthenticated) {
      fetchPendingRentals();
    }
  }, [state.user, state.isAuthenticated]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Načítavam čakajúce prenájmy...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Čakajúce automatické prenájmy
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Badge badgeContent={pendingRentals?.length || 0} color="warning">
            <UnifiedIcon name="pending" />
          </Badge>
          <Button
            variant="outlined"
            onClick={fetchPendingRentals}
            disabled={loading}
          >
            Obnoviť
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {pendingRentals?.length === 0 && !loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <UnifiedIcon name="success" fontSize="large" color="success" sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Žiadne čakajúce prenájmy
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Všetky automatické prenájmy boli spracované alebo žiadne ešte
              nepriišli.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Pending Rentals List */}
      {pendingRentals?.map(rental => (
        <RentalCard
          key={rental.id}
          rental={rental}
          onApprove={handleApproveRental}
          onReject={handleRejectRental}
          onEdit={handleEditRental}
        />
      ))}

      {/* Edit Rental Dialog */}
      <EditRentalDialog
        open={editDialogOpen}
        rental={editingRental}
        vehicles={vehicles}
        customers={customers}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingRental(null);
        }}
        onSave={handleSaveEditedRental}
      />
    </Box>
  );
};

export default PendingRentalsManager;
