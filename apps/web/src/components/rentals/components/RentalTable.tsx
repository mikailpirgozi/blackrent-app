import {
  Building2 as BusinessIcon,
  Car as CarIcon,
  Check as CheckIcon,
  Copy as ContentCopyIcon,
  Trash2 as DeleteIcon,
  Edit2 as EditIcon,
  Mail as EmailIcon,
  Phone as PhoneIcon,
  Clock as ScheduleIcon,
  LayoutGrid,
  List,
  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import PriceDisplay from './PriceDisplay';

import type { Rental, Vehicle } from '../../../types';
import { MobileRentalRow } from '../MobileRentalRow';
import PremiumRentalCard from './PremiumRentalCard';

interface RentalTableProps {
  paginatedRentals: Rental[];
  isMobile: boolean;
  handleEdit: (rental: Rental) => void;
  handleDelete: (id: string) => void;
  handleCloneRental: (rental: Rental) => void; // 🔄 NOVÉ: Clone funkcionalita
  handleOpenProtocolMenu: (rental: Rental, type: 'handover' | 'return') => void;
  handleViewRental: (rental: Rental) => void;
  onScroll?: (event: { scrollOffset: number }) => void;
  // Helper functions now imported directly in child components
  // Desktop view props
  getVehicleByRental: (rental: Rental) => Vehicle | undefined;
  protocolStatusMap: Record<
    string,
    { hasHandoverProtocol: boolean; hasReturnProtocol: boolean }
  >;
  protocols: Record<string, { handover?: unknown; return?: unknown }>;
  filteredRentals: Rental[];
  desktopScrollRef: React.RefObject<HTMLDivElement>;
  mobileScrollRef: React.RefObject<HTMLDivElement>;
  isLoadingProtocolStatus: boolean;
  protocolStatusLoaded: boolean;
  handleCheckProtocols: (rental: Rental) => void;
  loadingProtocols: string[];
  VirtualizedRentalRow: React.ComponentType<unknown>;
}

export const RentalTable: React.FC<RentalTableProps> = ({
  paginatedRentals,
  isMobile,
  handleEdit,
  handleDelete,
  handleCloneRental, // 🔄 NOVÉ: Clone funkcionalita
  handleOpenProtocolMenu,
  // handleViewRental,
  // onScroll,
  // Desktop view props
  getVehicleByRental,
  protocolStatusMap,
  protocols,
  filteredRentals,
  desktopScrollRef,
  mobileScrollRef,
  isLoadingProtocolStatus,
  protocolStatusLoaded,
  handleCheckProtocols,
  loadingProtocols,
  // VirtualizedRentalRow,
}) => {
  // const theme = useTheme();

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      {/* View Mode Toggle - Desktop Only */}
      {!isMobile && (
        <div className="mb-6 flex justify-end animate-fade-in">
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/50">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>
      )}

      {/* Grid View - Premium Cards (Desktop Only) */}
      {!isMobile && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredRentals.map((rental) => (
            <PremiumRentalCard
              key={rental.id}
              rental={rental}
              onEdit={handleEdit}
              onViewProtocols={(rental) => handleOpenProtocolMenu(rental, 'handover')}
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
                isLoadingProtocolStatus={loadingProtocols.includes(rental.id)}
                protocolStatusLoaded={
                  protocolStatusMap[rental.id] !== undefined
                }
                onEdit={handleEdit}
                onOpenProtocolMenu={handleOpenProtocolMenu}
                onCheckProtocols={handleCheckProtocols}
                onClone={handleCloneRental} // 🔄 NOVÉ: Clone funkcionalita
                onDelete={id => {
                  const rental = filteredRentals.find(r => r.id === id);
                  if (rental) handleDeleteClick(rental);
                }}
              />
            );
          })}
        </div>
      ) : (
        /* DESKTOP BOOKING.COM STYLE PRENÁJMY */
        <Card className="overflow-hidden shadow-xl rounded-xl">
          <CardContent className="p-0">
            {/* Desktop sticky header */}
            <div className="flex border-b-[3px] border-gray-200 bg-gray-50 sticky top-0 z-40">
              <div className="w-[280px] max-w-[280px] p-4 border-r-2 border-gray-200 bg-white flex items-center shadow-md overflow-hidden">
                <span className="font-bold text-blue-600 text-base">
                  🚗 Vozidlo & Status
                </span>
              </div>
              <div className="w-[200px] max-w-[200px] p-2 border-r border-gray-200 text-center bg-gray-50 overflow-hidden">
                <span className="font-bold text-gray-600 text-sm">
                  👤 Zákazník
                </span>
              </div>
              <div className="w-[180px] max-w-[180px] p-2 border-r border-gray-200 text-center bg-gray-50 overflow-hidden">
                <span className="font-bold text-gray-600 text-sm">
                  📅 Obdobie
                </span>
              </div>
              <div className="w-[160px] max-w-[160px] p-2 border-r border-gray-200 text-center bg-gray-50 overflow-hidden">
                <span className="font-bold text-gray-600 text-sm">
                  💰 Cena
                </span>
              </div>
              <div className="w-[220px] max-w-[220px] p-2 border-r border-gray-200 text-center bg-gray-50 overflow-hidden">
                <span className="font-bold text-gray-600 text-sm">
                  📋 Protokoly
                </span>
              </div>
              <div className="w-20 max-w-[80px] p-2 text-center bg-gray-50">
                <span className="font-bold text-gray-600 text-sm">
                  ⚡ Akcie
                </span>
              </div>
            </div>

            {/* 🎯 UNIFIED: Desktop scrollable container */}
            <div
              ref={desktopScrollRef}
              className="min-h-[60vh] max-h-[75vh] overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-600"
            >
              {(paginatedRentals || []).map((rental, index) => {
                const vehicle = getVehicleByRental(rental);

                // 🔄 NOVÉ: Detekcia flexibilného prenájmu
                const isFlexible = rental.isFlexible || false;

                // ⚡ BACKGROUND PROTOCOL STATUS - použije background loaded data alebo fallback na starý systém
                const backgroundStatus = protocolStatusMap[rental.id];
                const fallbackProtocols = protocols[rental.id];

                const hasHandover = backgroundStatus
                  ? backgroundStatus.hasHandoverProtocol
                  : !!fallbackProtocols?.handover;
                const hasReturn = backgroundStatus
                  ? backgroundStatus.hasReturnProtocol
                  : !!fallbackProtocols?.return;

                return (
                  <div
                    key={rental.id}
                    data-rental-item={`rental-${index}`} // 🎯 For item-based infinite scroll
                    className={`flex min-h-[65px] transition-all duration-200 cursor-pointer relative hover:scale-[1.002] hover:shadow-lg ${
                      isFlexible ? 'bg-orange-50 border-l-4 border-orange-500 hover:bg-orange-100' : 'hover:bg-gray-50'
                    } ${
                      index < filteredRentals.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                    onClick={() => {
                      // console.log('🔥 CARD CLICKED FOR EDIT:', rental.id);
                      handleEdit(rental);
                    }}
                  >
                    {/* Vozidlo & Status - sticky left - FIXED WIDTH */}
                    <div className="w-[280px] max-w-[280px] p-1.5 border-r-2 border-gray-200 flex flex-col justify-center bg-white sticky left-0 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)] overflow-hidden">
                      {/* 🚗 NÁZOV VOZIDLA HORE - VÝRAZNEJŠÍ */}
                      <span className="font-bold text-[1.1rem] text-blue-600 mb-1 overflow-hidden text-ellipsis whitespace-nowrap leading-tight">
                        {vehicle?.brand} {vehicle?.model}
                      </span>
                      {/* 🏷️ ŠPZ POD TÝM - MENŠIE */}
                      <span className="text-gray-600 text-xs mb-1 flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        <CarIcon className="h-4 w-4" />
                        {vehicle?.licensePlate || 'N/A'}
                      </span>
                      {/* 🏢 FIRMA - VŽDY VIDITEĽNÁ */}
                      {vehicle?.company && (
                        <span className="text-orange-500 text-xs font-semibold flex items-center gap-1 mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          <BusinessIcon className="h-4 w-4" />
                          {vehicle.company}
                        </span>
                      )}
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          className={`h-[22px] text-[0.65rem] font-medium text-white opacity-90 ${
                            rental.status === 'active'
                              ? 'bg-green-500'
                              : rental.status === 'finished'
                                ? 'bg-blue-500'
                                : rental.status === 'pending'
                                  ? 'bg-orange-500'
                                  : 'bg-gray-600'
                          }`}
                        >
                          {
                            rental.status === 'active'
                              ? 'AKTÍVNY'
                              : rental.status === 'finished'
                                ? 'UKONČENÝ'
                                : rental.status === 'pending'
                                  ? 'ČAKAJÚCI'
                                  : 'NOVÝ'
                          }
                        </Badge>
                        {/* 🔄 FLEXIBILNÝ PRENÁJOM INDIKÁTOR */}
                        {isFlexible && (
                          <Badge className="h-5 text-[0.6rem] bg-orange-500 text-white font-medium opacity-90">
                            FLEXIBILNÝ
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 👤 ZÁKAZNÍK - INŠPIROVANÉ MOBILNÝM DIZAJNOM */}
                    <div className="w-[200px] max-w-[200px] p-1.5 border-r border-gray-200 flex flex-col justify-center text-left overflow-hidden">
                      <span className="font-semibold text-sm text-gray-800 mb-1 flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        {rental.customerName}
                      </span>

                      {/* 📞 TELEFÓN A EMAIL - KOMPAKTNE */}
                      <div className="flex flex-col gap-0.5">
                        {(rental.customerPhone || rental.customer?.phone) && (
                          <span className="text-xs text-gray-600 flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            <PhoneIcon className="h-3 w-3" />
                            {rental.customerPhone || rental.customer?.phone}
                          </span>
                        )}

                        {(rental.customerEmail || rental.customer?.email) && (
                          <span className="text-xs text-gray-600 flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            <EmailIcon className="h-3 w-3" />
                            {rental.customerEmail ||
                              rental.customer?.email ||
                              'N/A'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Obdobie - FIXED WIDTH */}
                    <div className="w-[180px] max-w-[180px] p-1.5 border-r border-gray-200 flex flex-col justify-center text-center overflow-hidden">
                      <span className="font-semibold text-xs text-gray-800 mb-0.5">
                        📅 {formatDateTime(rental.startDate)}
                      </span>
                      <span className="text-gray-600 text-[0.7rem] mb-0.5">
                        ↓
                      </span>
                      <span className="font-semibold text-xs text-gray-800">
                        📅 {formatDateTime(rental.endDate)}
                      </span>
                    </div>

                    {/* Cena - FIXED WIDTH */}
                    <div className="w-[160px] max-w-[160px] p-1 border-r border-gray-200 flex flex-col justify-center text-center overflow-hidden">
                      <PriceDisplay
                        rental={rental}
                        variant="compact"
                        showExtraKm={true}
                      />
                      <Badge
                        className={`h-[16px] text-[0.6rem] text-white font-medium mt-1 ${
                          rental.paid ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {rental.paid ? 'Uhradené' : 'Neuhradené'}
                      </Badge>
                    </div>

                    {/* 📋 PROTOKOLY - INŠPIROVANÉ MOBILNÝM DIZAJNOM */}
                    <div className="w-[220px] max-w-[220px] p-1.5 border-r border-gray-200 flex justify-center items-center flex-col gap-2 overflow-hidden">
                      {/* 🔧 PROTOKOL TLAČIDLÁ - ŠTÝL AKO V MOBILE */}
                      <div className="flex gap-1.5 w-full">
                        <Button
                          variant={hasHandover ? 'default' : 'outline'}
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenProtocolMenu(rental, 'handover');
                          }}
                          className={`flex-1 h-8 text-[0.7rem] font-semibold min-w-0 px-1.5 transition-all duration-200 hover:scale-[1.02] ${
                            hasHandover
                              ? 'bg-green-500 border-green-500 text-white hover:bg-green-600 hover:shadow-[0_4px_12px_rgba(76,175,80,0.3)]'
                              : 'bg-transparent border-orange-500 text-orange-500 hover:bg-orange-50 hover:shadow-[0_4px_12px_rgba(255,152,0,0.2)]'
                          }`}
                        >
                          {hasHandover ? <CheckIcon className="h-3 w-3 mr-1" /> : <ScheduleIcon className="h-3 w-3 mr-1" />}
                          {hasHandover ? 'Odovz.' : 'Odovzdať'}
                        </Button>

                        <Button
                          variant={hasReturn ? 'default' : 'outline'}
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenProtocolMenu(rental, 'return');
                          }}
                          className={`flex-1 h-8 text-[0.7rem] font-semibold min-w-0 px-1.5 transition-all duration-200 hover:scale-[1.02] ${
                            hasReturn
                              ? 'bg-green-500 border-green-500 text-white hover:bg-green-600 hover:shadow-[0_4px_12px_rgba(76,175,80,0.3)]'
                              : 'bg-transparent border-orange-500 text-orange-500 hover:bg-orange-50 hover:shadow-[0_4px_12px_rgba(255,152,0,0.2)]'
                          }`}
                        >
                          {hasReturn ? <CheckIcon className="h-3 w-3 mr-1" /> : <ScheduleIcon className="h-3 w-3 mr-1" />}
                          {hasReturn ? 'Prevz.' : 'Prevziať'}
                        </Button>
                      </div>

                      {/* STATUS TEXT */}
                      <span className="text-gray-600 text-[0.7rem] text-center leading-tight">
                        {hasHandover && hasReturn
                          ? '✅ Kompletné'
                          : hasHandover
                            ? '🚗→ Odovzdané'
                            : hasReturn
                              ? '←🚗 Vrátené'
                              : '⏳ Čaká'}
                      </span>

                      {/* PROTOCOL CHECK BUTTON */}
                      {isLoadingProtocolStatus ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="border-orange-500 text-orange-500 text-[0.65rem] h-[26px] min-w-0 px-2"
                        >
                          Načítavam...
                        </Button>
                      ) : !protocolStatusLoaded ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleCheckProtocols(rental);
                          }}
                          className="border-blue-500 text-blue-500 text-[0.65rem] h-[26px] min-w-0 px-2 hover:bg-blue-50"
                        >
                          Skontrolovať
                        </Button>
                      ) : null}
                    </div>

                    {/* Akcie */}
                    <div className="w-[120px] max-w-[120px] p-1 flex justify-center items-center gap-1 flex-row flex-wrap">
                      <Button
                        size="sm"
                        title="Upraviť prenájom"
                        onClick={e => {
                          e.stopPropagation();
                          handleEdit(rental);
                        }}
                        className="bg-blue-500 text-white hover:bg-blue-600 hover:scale-110 hover:shadow-[0_4px_12px_rgba(33,150,243,0.4)] active:scale-95 transition-all duration-200"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>

                      {/* 🔄 CLONE TLAČIDLO */}
                      <Button
                        size="sm"
                        title="Kopírovať prenájom na ďalšie obdobie"
                        onClick={e => {
                          e.stopPropagation();
                          handleCloneRental(rental);
                        }}
                        className="bg-green-500 text-white hover:bg-green-600 hover:scale-110 hover:shadow-[0_4px_12px_rgba(76,175,80,0.4)] active:scale-95 transition-all duration-200"
                      >
                        <ContentCopyIcon className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        title="Zmazať prenájom"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteClick(rental);
                        }}
                        className="bg-red-500 text-white hover:bg-red-600 hover:scale-110 hover:shadow-[0_4px_12px_rgba(244,67,54,0.4)] transition-all duration-200"
                      >
                        <DeleteIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      </>
      )}

      {/* 🗑️ DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => !open && handleDeleteCancel()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ⚠️ Potvrdenie zmazania
            </DialogTitle>
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
