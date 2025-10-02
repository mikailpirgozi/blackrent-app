// Lucide icons (replacing MUI icons)
import {
  CheckCircle as ApproveIcon,
  Calendar as CalendarIcon,
  Car as CarIcon,
  Edit as EditIcon,
  Mail as EmailIcon,
  Euro as EuroIcon,
  ChevronUp as ExpandLessIcon,
  ChevronDown as ExpandMoreIcon,
  MapPin as LocationIcon,
  Clock as PendingIcon,
  User as PersonIcon,
  X as RejectIcon,
} from 'lucide-react';

// shadcn/ui components
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
      <Card className="mb-4 border">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <PendingIcon className="w-6 h-6 text-orange-500" />
                <EmailIcon className="absolute -top-1 -right-1 w-3 h-3 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold">
                {rental.orderNumber || 'N/A'}
              </h3>
              <Badge variant="secondary" className="flex items-center gap-1">
                <EmailIcon className="w-3 h-3" />
                Email Auto
              </Badge>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(rental)}
                      disabled={processing}
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      Upraviť
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upraviť prenájom</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ApproveIcon className="w-4 h-4 mr-1" />
                      Schváliť
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Schváliť prenájom</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={processing}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <RejectIcon className="w-4 h-4 mr-1" />
                      Zamietnuť
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zamietnuť prenájom</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PersonIcon className="w-4 h-4 text-primary" />
                <span className="font-semibold">{rental.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CarIcon className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  {rental.vehicleName || 'Vozidlo nenájdené'}
                  {rental.vehicleCode && ` (${rental.vehicleCode})`}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <EuroIcon className="w-4 h-4 text-primary" />
                <span>
                  <strong>{formatCurrency(rental.totalPrice)}</strong>
                  {rental.deposit && (
                    <span className="ml-2 text-muted-foreground">
                      (Depozit: {formatCurrency(rental.deposit)})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Expand/Collapse */}
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger asChild>
              <div className="flex justify-center">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  {expanded ? <ExpandLessIcon className="w-4 h-4" /> : <ExpandMoreIcon className="w-4 h-4" />}
                  <span className="text-xs">
                    {expanded ? 'Skryť detaily' : 'Zobraziť detaily'}
                  </span>
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">
                    Detaily prenájmu
                  </h4>
                  {rental.handoverPlace && (
                    <div className="flex items-center gap-2 mb-2">
                      <LocationIcon className="w-4 h-4" />
                      <span className="text-sm">
                        Miesto: {rental.handoverPlace}
                      </span>
                    </div>
                  )}
                  {rental.dailyKilometers && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Denný limit km: {rental.dailyKilometers}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Vytvorené:{' '}
                    {formatDate(rental.autoProcessedAt || rental.createdAt)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-2">
                    Obsah emailu
                  </h4>
                  <div className="p-3 bg-muted rounded-md max-h-48 overflow-auto font-mono text-xs whitespace-pre-wrap">
                    {rental.emailContent || 'Email obsah nedostupný'}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zamietnuť automatický prenájom</DialogTitle>
            <DialogDescription>
              Prečo zamietate tento prenájom? Dôvod bude uložený pre budúcu
              referenciu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Dôvod zamietnutia</Label>
              <Textarea
                id="reject-reason"
                rows={3}
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                placeholder="Napr.: Neplatné dátumy, chýbajúce informácie, duplicitná objednávka..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Zrušiť
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectReason.trim() || processing}
              className="bg-red-600 hover:bg-red-700"
            >
              Zamietnuť
            </Button>
          </DialogFooter>
        </DialogContent>
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
      <div className="flex justify-center p-8">
        <p>Načítavam čakajúce prenájmy...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Čakajúce automatické prenájmy
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <PendingIcon className="w-6 h-6" />
            <Badge className="absolute -top-2 -right-2" variant="secondary">
              {pendingRentals?.length || 0}
            </Badge>
          </div>
          <Button
            variant="outline"
            onClick={fetchPendingRentals}
            disabled={loading}
          >
            Obnoviť
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {pendingRentals?.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <ApproveIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Žiadne čakajúce prenájmy
            </h3>
            <p className="text-muted-foreground">
              Všetky automatické prenájmy boli spracované alebo žiadne ešte
              nepriišli.
            </p>
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
    </div>
  );
};

export default PendingRentalsManager;
