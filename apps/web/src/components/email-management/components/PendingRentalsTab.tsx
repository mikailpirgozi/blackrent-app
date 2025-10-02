/**
 * Pending Rentals Tab Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import {
  CheckCircle as ApproveIcon,
  Calendar as CalendarIcon,
  Car as CarIcon,
  CheckCircle,
  Euro as EuroIcon,
  ChevronDown as ExpandLessIcon,
  ChevronUp as ExpandMoreIcon,
  MapPin as LocationIcon,
  User as PersonIcon,
  RefreshCw as RefreshIcon,
  X as RejectIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';

// import { Rental } from '../../../types';
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
    // error,
    // success,
    // setError,
    // setSuccess,
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
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              ⏳ Čakajúce automatické prenájmy ({pendingRentals.length})
            </CardTitle>
            <Button
              variant="outline"
              onClick={fetchPendingRentals}
              disabled={pendingLoading}
              className="flex items-center gap-2"
            >
              <RefreshIcon className="h-4 w-4" />
              Obnoviť
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingLoading ? (
            <div className="flex justify-center p-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : pendingRentals.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Žiadne čakajúce prenájmy
              </h3>
              <p className="text-sm text-muted-foreground">
                Všetky automatické prenájmy boli spracované alebo žiadne ešte
                nepriišli.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRentals.map(rental => (
                <Card key={rental.id} className="border">
                  <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* Rental Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <CarIcon className="h-5 w-5 text-primary" />
                                {rental.vehicleName || 'Neznáme vozidlo'}
                                <Badge variant="outline" className="text-xs">
                                  {rental.vehicleCode}
                                </Badge>
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <PersonIcon className="h-4 w-4" />
                                {rental.customerName}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveRental(rental.id)}
                                    disabled={actionLoading === rental.id}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    {actionLoading === rental.id ? (
                                      <Spinner className="h-4 w-4" />
                                    ) : (
                                      <ApproveIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Schváliť</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setRejectDialog({
                                        open: true,
                                        rentalId: rental.id,
                                      })
                                    }
                                    disabled={actionLoading === rental.id}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <RejectIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Zamietnuť</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      toggleRentalExpansion(rental.id)
                                    }
                                  >
                                    {expandedRentals.has(rental.id) ? (
                                      <ExpandLessIcon className="h-4 w-4" />
                                    ) : (
                                      <ExpandMoreIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Rozbaliť detaily</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>

                          {/* Basic Info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  <strong>Od:</strong>{' '}
                                  {formatDate(rental.startDate)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  <strong>Do:</strong>{' '}
                                  {formatDate(rental.endDate)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <EuroIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  <strong>Cena:</strong>{' '}
                                  {formatCurrency(rental.totalPrice)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <LocationIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  <strong>Miesto:</strong>{' '}
                                  {rental.handoverPlace}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <Collapsible open={expandedRentals.has(rental.id)}>
                            <CollapsibleContent>
                              <Separator className="my-4" />
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-sm">
                                    <strong>Objednávka:</strong>{' '}
                                    {rental.orderNumber}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Email:</strong> {rental.customerEmail}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Telefón:</strong>{' '}
                                    {rental.customerPhone}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm">
                                    <strong>Denné km:</strong>{' '}
                                    {rental.dailyKilometers}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Záloha:</strong>{' '}
                                    {formatCurrency(rental.deposit || 0)}
                                  </p>
                                  <p className="text-sm">
                                    <strong>Platba:</strong>{' '}
                                    {rental.paymentMethod}
                                  </p>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
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
    </TooltipProvider>
  );
};
