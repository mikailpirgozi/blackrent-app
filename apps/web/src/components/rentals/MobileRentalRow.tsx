/**
 * 📱 MOBILE RENTAL ROW COMPONENT - ENHANCED VERSION
 *
 * Optimalizovaný pre mobilné zariadenia s kartovým dizajnom:
 * - Zachováva všetky existujúce funkcie
 * - Väčšie fonty a tlačidlá (touch-friendly)
 * - Lepšie rozloženie informácií
 * - Kartový dizajn namiesto tabuľkového riadku
 * - React.memo pre performance
 */

// Lucide icons (replacing MUI icons)
import {
  Building2 as BusinessIcon,
  Car as CarIcon,
  Check as CheckIcon,
  Copy as ContentCopyIcon,
  Trash2 as DeleteIcon,
  Mail as EmailIcon,
  Phone as PhoneIcon,
  Clock as ScheduleIcon,
} from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import React, { memo } from 'react';
import { formatDateTime } from '../../utils/formatters';
import PriceDisplay from './components/PriceDisplay';

import type { Rental, Vehicle } from '../../types';

interface MobileRentalRowProps {
  rental: Rental;
  vehicle: Vehicle | undefined;
  index: number;
  totalRentals: number;
  hasHandover: boolean;
  hasReturn: boolean;
  isLoadingProtocolStatus: boolean;
  protocolStatusLoaded: boolean;
  onEdit: (rental: Rental) => void;
  onOpenProtocolMenu: (rental: Rental, type: 'handover' | 'return') => void;
  onCheckProtocols: (rental: Rental) => void;
  onDelete?: (id: string) => void;
  onClone?: (rental: Rental) => void; // 🔄 NOVÉ: Clone funkcionalita
}

export const MobileRentalRow = memo<MobileRentalRowProps>(
  ({
    rental,
    vehicle,
    index,
    // totalRentals, // TODO: Implement total rentals display
    hasHandover,
    hasReturn,
    isLoadingProtocolStatus,
    protocolStatusLoaded,
    onEdit,
    onOpenProtocolMenu,
    onCheckProtocols,
    onDelete,
    onClone, // 🔄 NOVÉ: Clone funkcionalita
  }) => {
    // 🎯 Memoized handlers to prevent recreation
    const handleCardClick = React.useCallback(() => {
      onEdit(rental);
    }, [rental, onEdit]);

    const handleHandoverClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenProtocolMenu(rental, 'handover');
      },
      [rental, onOpenProtocolMenu]
    );

    const handleReturnClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenProtocolMenu(rental, 'return');
      },
      [rental, onOpenProtocolMenu]
    );

    const handleProtocolCheck = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onCheckProtocols(rental);
      },
      [rental, onCheckProtocols]
    );

    const handleDeleteClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete(rental.id);
      },
      [rental.id, onDelete]
    );

    // 🔄 CLONE HANDLER
    const handleCloneClick = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClone) onClone(rental);
      },
      [rental, onClone]
    );

    // 🎨 Status helpers
    const getStatusColor = () => {
      switch (rental.status) {
        case 'active':
          return '#4caf50';
        case 'finished':
          return '#2196f3';
        case 'pending':
          return '#ff9800';
        default:
          return '#757575';
      }
    };

    const getStatusLabel = () => {
      switch (rental.status) {
        case 'active':
          return 'AKTÍVNY';
        case 'finished':
          return 'UKONČENÝ';
        case 'pending':
          return 'ČAKAJÚCI';
        default:
          return 'NOVÝ';
      }
    };

    // 🔄 Detekcia flexibilného prenájmu
    const isFlexible = rental.isFlexible || false;

    return (
      <Card
        className={`mb-3 rounded-lg shadow-sm ${
          isFlexible ? 'border-2 border-orange-300' : 'border'
        }`}
        style={{
          animationDelay: `${300 + index * 50}ms`,
          animation: 'fadeIn 0.3s ease-in-out',
        }}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
            {/* 🚗 HLAVIČKA S VOZIDLOM A STATUSOM */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-base font-bold text-blue-600 mb-1">
                  <CarIcon className="h-4 w-4" />
                  {vehicle?.licensePlate || 'N/A'}
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  {vehicle?.brand} {vehicle?.model}
                </div>
                {/* 🏢 FIRMA - VŽDY VIDITEĽNÁ */}
                {vehicle?.company && (
                  <div className="flex items-center gap-1 text-orange-500 text-xs font-semibold mb-1">
                    <BusinessIcon className="h-3 w-3" />
                    {vehicle?.company}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge
                  className="text-white font-semibold text-sm h-8 px-3"
                  style={{ backgroundColor: getStatusColor() }}
                >
                  {getStatusLabel()}
                </Badge>
                {isFlexible && (
                  <Badge
                    className="text-white font-semibold text-xs h-7 px-2"
                    style={{ backgroundColor: '#ff9800' }}
                  >
                    FLEXIBILNÝ
                  </Badge>
                )}
              </div>
            </div>

            {/* 👤 ZÁKAZNÍK - KOMPAKTNEJŠIE */}
            <div className="mb-3">
              <div className="font-semibold text-base text-gray-800 mb-1 flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: '#4caf50',
                  }}
                />
                {rental.customerName}
              </div>

              {/* 📞 TELEFÓN A EMAIL - V JEDNOM RIADKU */}
              <div className="flex flex-wrap gap-2 items-center">
                {(rental.customerPhone || rental.customer?.phone) && (
                  <div className="text-gray-600 text-xs flex items-center gap-1">
                    <PhoneIcon className="h-3 w-3" />
                    {rental.customerPhone || rental.customer?.phone}
                  </div>
                )}

                {(rental.customerEmail || rental.customer?.email) && (
                  <div className="text-gray-600 text-xs flex items-center gap-1">
                    <EmailIcon className="h-3 w-3" />
                    {rental.customerEmail || rental.customer?.email}
                  </div>
                )}
              </div>
            </div>

            {/* 📅 DÁTUMY A CENA - KOMPAKTNEJŠIE */}
            <div className="flex justify-between items-center mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <div className="text-gray-600 text-xs mb-1">
                  Obdobie prenájmu
                </div>
                <div className="font-bold text-sm text-blue-600 leading-tight mb-1">
                  📅 {formatDateTime(rental.startDate)}
                </div>
                <div className="font-bold text-sm text-orange-600 leading-tight">
                  🏁 {formatDateTime(rental.endDate)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-gray-600 text-xs mb-1">
                  Celková cena
                </div>
                <PriceDisplay
                  rental={rental}
                  variant="mobile"
                  showExtraKm={true}
                />
              </div>
            </div>

            {/* 🔧 PROTOKOLY - KOMPAKTNEJŠIE TLAČIDLÁ */}
            <div className="flex gap-3 mb-3">
              <Button
                variant={hasHandover ? "default" : "outline"}
                size="lg"
                className={`flex-1 h-11 text-sm font-semibold transition-all duration-200 ${
                  hasHandover 
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/30 hover:scale-[1.02]' 
                    : 'border-orange-500 text-orange-500 hover:bg-orange-50 hover:shadow-orange-500/20 hover:scale-[1.02]'
                }`}
                onClick={handleHandoverClick}
              >
                {hasHandover ? <CheckIcon className="w-4 h-4 mr-2" /> : <ScheduleIcon className="w-4 h-4 mr-2" />}
                {hasHandover ? 'Odovzdané' : 'Odovzdať'}
              </Button>

              <Button
                variant={hasReturn ? "default" : "outline"}
                size="lg"
                className={`flex-1 h-11 text-sm font-semibold transition-all duration-200 ${
                  hasReturn 
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/30 hover:scale-[1.02]' 
                    : 'border-orange-500 text-orange-500 hover:bg-orange-50 hover:shadow-orange-500/20 hover:scale-[1.02]'
                }`}
                onClick={handleReturnClick}
              >
                {hasReturn ? <CheckIcon className="w-4 h-4 mr-2" /> : <ScheduleIcon className="w-4 h-4 mr-2" />}
                {hasReturn ? 'Prevzaté' : 'Prevziať'}
              </Button>
            </div>

            {/* 📝 POZNÁMKY - AK EXISTUJÚ */}
            {rental.notes && (
              <div className="mb-3">
                <div className="text-gray-800 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 p-3 rounded-md text-xs border border-gray-200 dark:border-gray-600">
                  📝 {rental.notes}
                </div>
              </div>
            )}

            {/* 🔍 PROTOKOL CHECK & PLATBA STATUS & DELETE - KOMPAKTNE V JEDNOM RIADKU */}
            <div className="flex justify-between items-center">
              {/* Protokol check */}
              {isLoadingProtocolStatus ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="border-orange-500 text-orange-500 text-xs h-8"
                >
                  Načítavam...
                </Button>
              ) : !protocolStatusLoaded ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProtocolCheck}
                  className="border-blue-500 text-blue-500 hover:bg-blue-50 text-xs h-8"
                >
                  Skontrolovať
                </Button>
              ) : (
                <div /> // Prázdny div pre spacing
              )}

              {/* Platba status + Delete tlačidlo v jednom riadku */}
              <div className="flex items-center gap-2">
                <Badge
                  className={`h-6 text-xs font-medium ${
                    rental.paid 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {rental.paid ? 'Uhradené' : 'Neuhradené'}
                </Badge>

                {/* 🔄 CLONE TLAČIDLO - VEDĽA PLATBY */}
                {onClone && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloneClick}
                    title="Kopírovať prenájom na ďalšie obdobie"
                    className="w-8 h-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50 hover:scale-110 transition-all duration-200"
                  >
                    <ContentCopyIcon className="w-4 h-4" />
                  </Button>
                )}

                {/* 🗑️ DELETE TLAČIDLO - VEDĽA PLATBY */}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    className="w-8 h-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 hover:scale-110 transition-all duration-200"
                  >
                    <DeleteIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
    );
  }
);

MobileRentalRow.displayName = 'MobileRentalRow';
