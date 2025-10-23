import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import React, { useState } from 'react';
import { formatDateTime } from '../../../utils/formatters';

import type { Rental, Vehicle } from '../../../types';
import { MobileRentalRow } from '../MobileRentalRow';
import PremiumRentalCard from './PremiumRentalCard';
import { ElegantRentalCard } from './ElegantRentalCard';

interface RentalTableProps {
  isMobile: boolean;
  handleEdit: (rental: Rental) => void;
  handleDelete: (id: string) => void;
  handleCloneRental: (rental: Rental) => void;
  handleOpenProtocolMenu: (rental: Rental, type: 'handover' | 'return') => void;
  handleCheckProtocols: (rental: Rental) => void;
  handleCreatePaymentOrder?: (
    rental: Rental,
    type: 'rental' | 'deposit'
  ) => void; // 💳 NOVÉ
  getVehicleByRental: (rental: Rental) => Vehicle | undefined;
  protocolStatusMap: Record<
    string,
    { hasHandoverProtocol: boolean; hasReturnProtocol: boolean }
  >;
  protocols: Record<string, { handover?: unknown; return?: unknown }>;
  filteredRentals: Rental[];
  desktopScrollRef: React.RefObject<HTMLDivElement>;
  mobileScrollRef: React.RefObject<HTMLDivElement>;
  loadingProtocols: string[];
}

export const RentalTable: React.FC<RentalTableProps> = ({
  isMobile,
  handleEdit,
  handleDelete,
  handleCloneRental,
  handleOpenProtocolMenu,
  handleCheckProtocols,
  handleCreatePaymentOrder, // 💳 NOVÉ
  getVehicleByRental,
  protocolStatusMap,
  protocols,
  filteredRentals,
  desktopScrollRef,
  mobileScrollRef,
  loadingProtocols,
}) => {
  // const theme = useTheme();

  // View mode state - LIST as default (Grid as secondary)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // 🗑️ DELETE CONFIRMATION DIALOG STATE
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [rentalToDelete, setRentalToDelete] = React.useState<Rental | null>(
    null
  );

  // 🗑️ DELETE HANDLERS
  const handleDeleteClick = (rental: Rental) => {
    setRentalToDelete(rental);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (rentalToDelete) {
      handleDelete(rentalToDelete.id);
      setDeleteDialogOpen(false);
      setRentalToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRentalToDelete(null);
  };

  return (
    <>
      {/* View Mode Toggle - Desktop Only - Modernizovaný shadcn štýl */}
      {!isMobile && (
        <div className="mb-6 flex justify-end animate-fade-in">
          <div className="inline-flex rounded-xl border-2 border-primary/20 p-1.5 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 shadow-lg hover:shadow-xl transition-all duration-300">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                'gap-2 rounded-lg transition-all duration-300 font-semibold',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/50 hover:bg-primary/90 hover:scale-105'
                  : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'
              )}
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={cn(
                'gap-2 rounded-lg transition-all duration-300 font-semibold',
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/50 hover:bg-primary/90 hover:scale-105'
                  : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </Button>
          </div>
        </div>
      )}

      {/* Grid View - Premium Cards (Desktop Only) */}
      {!isMobile && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredRentals.map(rental => (
            <PremiumRentalCard
              key={rental.id}
              rental={rental}
              onEdit={handleEdit}
              onViewProtocols={rental =>
                handleOpenProtocolMenu(rental, 'handover')
              }
            />
          ))}
        </div>
      )}

      {/* List View & Mobile - Original Table */}
      {(isMobile || viewMode === 'list') && (
        <>
          {isMobile ? (
            /* MOBILNÝ KARTOVÝ DIZAJN PRE PRENÁJMY */
            <div
              ref={mobileScrollRef}
              className="mx-2 py-4 min-h-[60vh] max-h-[80vh] overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
            >
              {filteredRentals.map((rental, index) => {
                // ⚡ BACKGROUND PROTOCOL STATUS - rovnaká logika ako desktop verzia
                const backgroundStatus = protocolStatusMap[rental.id];
                const fallbackProtocols = protocols[rental.id];

                const hasHandover = backgroundStatus
                  ? backgroundStatus.hasHandoverProtocol
                  : !!fallbackProtocols?.handover;
                const hasReturn = backgroundStatus
                  ? backgroundStatus.hasReturnProtocol
                  : !!fallbackProtocols?.return;

                return (
                  <MobileRentalRow
                    key={rental.id}
                    rental={rental as Rental}
                    vehicle={getVehicleByRental(rental) as Vehicle | undefined}
                    index={index}
                    totalRentals={filteredRentals.length}
                    hasHandover={hasHandover}
                    hasReturn={hasReturn}
                    isLoadingProtocolStatus={loadingProtocols.includes(
                      rental.id
                    )}
                    protocolStatusLoaded={
                      protocolStatusMap[rental.id] !== undefined
                    }
                    onEdit={handleEdit}
                    onOpenProtocolMenu={handleOpenProtocolMenu}
                    onCheckProtocols={handleCheckProtocols}
                    onClone={handleCloneRental} // 🔄 NOVÉ: Clone funkcionalita
                    onCreatePaymentOrder={handleCreatePaymentOrder} // 💳 NOVÉ: Platobné príkazy
                    onDelete={id => {
                      const rental = filteredRentals.find(r => r.id === id);
                      if (rental) handleDeleteClick(rental);
                    }}
                  />
                );
              })}
            </div>
          ) : (
            /* DESKTOP LIST VIEW - Elegantné karty ako dashboard */
            <div
              ref={desktopScrollRef}
              className="space-y-2 animate-fade-in max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-primary/10 hover:scrollbar-thumb-primary/80"
            >
              {filteredRentals.map(rental => {
                const vehicle = getVehicleByRental(rental);

                // ⚡ BACKGROUND PROTOCOL STATUS
                const backgroundStatus = protocolStatusMap[rental.id];
                const fallbackProtocols = protocols[rental.id];

                const hasHandover = backgroundStatus
                  ? backgroundStatus.hasHandoverProtocol
                  : !!fallbackProtocols?.handover;
                const hasReturn = backgroundStatus
                  ? backgroundStatus.hasReturnProtocol
                  : !!fallbackProtocols?.return;

                return (
                  <ElegantRentalCard
                    key={rental.id}
                    rental={rental}
                    vehicle={vehicle}
                    hasHandover={hasHandover}
                    hasReturn={hasReturn}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onClone={handleCloneRental}
                    onOpenProtocolMenu={handleOpenProtocolMenu}
                    onCreatePaymentOrder={handleCreatePaymentOrder}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 🗑️ DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={open => !open && handleDeleteCancel()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Potvrdenie zmazania</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Naozaj chcete zmazať prenájom pre zákazníka{' '}
            <strong>{rentalToDelete?.customerName}</strong>?
            <br />
            <br />
            Vozidlo:{' '}
            <strong>
              {rentalToDelete
                ? getVehicleByRental(rentalToDelete)?.licensePlate
                : 'N/A'}
            </strong>
            <br />
            Obdobie:{' '}
            <strong>
              {rentalToDelete && formatDateTime(rentalToDelete.startDate)} -{' '}
              {rentalToDelete && formatDateTime(rentalToDelete.endDate)}
            </strong>
            <br />
            <br />
            <span className="text-red-500 font-semibold">
              Táto akcia sa nedá vrátiť späť!
            </span>
          </DialogDescription>
          <DialogFooter>
            <Button
              onClick={handleDeleteCancel}
              variant="outline"
              className="border-gray-600 text-gray-600 hover:border-gray-800 hover:bg-gray-50"
            >
              Zrušiť
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="default"
              className="bg-red-500 hover:bg-red-600 text-white"
              autoFocus
            >
              Zmazať prenájom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
