/**
 * 📋 OPTIMIZED RENTAL ROW
 *
 * Memoized rental row komponent s optimalizovaným rendering
 */

import {
  Trash2 as DeleteIcon,
  Edit as EditIcon,
  Images as GalleryIcon,
  Car as HandoverIcon,
  FileText as PDFIcon,
  RotateCcw as ReturnIcon,
  Eye as VisibilityIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { memo, useCallback } from 'react';
import { formatDate } from '../../utils/formatters';

import type { Rental } from '../../types';
import type { VehicleLookup } from '../../utils/rentalFilters';

import RentalStatusChip from './RentalStatusChip';

interface OptimizedRentalRowProps {
  rental: Rental;
  vehicleLookup: VehicleLookup;
  onEdit: (rental: Rental) => void;
  onDelete: (rental: Rental) => void;
  onView: (rental: Rental) => void;
  onHandover: (rental: Rental) => void;
  onReturn: (rental: Rental) => void;
  onViewPDF: (rental: Rental) => void;
  onViewGallery: (rental: Rental) => void;
  hasHandoverProtocol?: boolean;
  hasReturnProtocol?: boolean;
}

const OptimizedRentalRow: React.FC<OptimizedRentalRowProps> = ({
  rental,
  vehicleLookup,
  onEdit,
  onDelete,
  onView,
  onHandover,
  onReturn,
  onViewPDF,
  onViewGallery,
  hasHandoverProtocol = false,
  hasReturnProtocol = false,
}) => {
  // Memoized vehicle data
  const vehicle = vehicleLookup[rental.vehicleId || ''] || {};

  // Memoized handlers
  const handleEdit = useCallback(() => onEdit(rental), [onEdit, rental]);
  const handleDelete = useCallback(() => onDelete(rental), [onDelete, rental]);
  const handleView = useCallback(() => onView(rental), [onView, rental]);
  const handleHandover = useCallback(
    () => onHandover(rental),
    [onHandover, rental]
  );
  const handleReturn = useCallback(() => onReturn(rental), [onReturn, rental]);
  const handleViewPDF = useCallback(
    () => onViewPDF(rental),
    [onViewPDF, rental]
  );
  const handleViewGallery = useCallback(
    () => onViewGallery(rental),
    [onViewGallery, rental]
  );

  // Memoized formatted dates - ZACHOVAJ PRESNÝ ČAS BEZ TIMEZONE KONVERZIE
  const startDate = formatDate(rental.startDate);
  const endDate = formatDate(rental.endDate);

  // Customer initials for avatar
  const getCustomerInitials = (name: string) => {
    return (
      name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??'
    );
  };

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      {/* Customer */}
      <TableCell className="p-1">
        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7 text-xs font-semibold">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getCustomerInitials(rental.customerName || '')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {rental.customerName || 'Nezadané'}
            </p>
            {(rental.customerPhone || rental.customer?.phone) && (
              <p className="text-xs text-muted-foreground leading-none truncate">
                {rental.customerPhone || rental.customer?.phone}
              </p>
            )}
          </div>
        </div>
      </TableCell>

      {/* Vehicle */}
      <TableCell className="p-1">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {vehicle.licensePlate}
          </p>
        </div>
      </TableCell>

      {/* Dates */}
      <TableCell className="p-1">
        <div className="min-w-0">
          <p className="text-sm leading-tight whitespace-nowrap">
            {startDate}
          </p>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            → {endDate}
          </p>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell className="p-1">
        <RentalStatusChip status={rental.status || 'pending'} />
      </TableCell>

      {/* Company */}
      <TableCell className="p-1">
        <p className="text-sm leading-tight truncate">
          {vehicle.company || 'Nezadané'}
        </p>
      </TableCell>

      {/* Price */}
      <TableCell className="text-right p-1">
        <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
          {rental.totalPrice 
            ? new Intl.NumberFormat('sk-SK', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(rental.totalPrice)
            : '0,00 €'
          }
        </span>
      </TableCell>

      {/* Protocols */}
      <TableCell className="p-1">
        <TooltipProvider>
          <div className="flex gap-0.5">
            {hasHandoverProtocol && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleViewPDF}>
                    <PDFIcon className="h-3 w-3 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Odovzdávací protokol</p>
                </TooltipContent>
              </Tooltip>
            )}
            {hasReturnProtocol && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleViewPDF}>
                    <PDFIcon className="h-3 w-3 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Preberací protokol</p>
                </TooltipContent>
              </Tooltip>
            )}
            {!hasHandoverProtocol && !hasReturnProtocol && (
              <span className="text-xs text-muted-foreground">
                —
              </span>
            )}
          </div>
        </TooltipProvider>
      </TableCell>

      {/* Actions */}
      <TableCell className="p-1">
        <TooltipProvider>
          <div className="flex gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleView}>
                  <VisibilityIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zobraziť</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleEdit}>
                  <EditIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upraviť</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-6 w-6 p-0 ${hasHandoverProtocol ? "text-green-600" : ""}`}
                  onClick={handleHandover}
                >
                  <HandoverIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Odovzdať</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-6 w-6 p-0 ${hasReturnProtocol ? "text-blue-600" : ""}`}
                  onClick={handleReturn}
                >
                  <ReturnIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Prevziať</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleViewGallery}>
                  <GalleryIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Galéria</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600 hover:text-red-700" onClick={handleDelete}>
                  <DeleteIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zmazať</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
};

// Export with deep memo comparison
export default memo(OptimizedRentalRow, (prevProps, nextProps) => {
  // Compare rental object
  if (prevProps.rental.id !== nextProps.rental.id) return false;
  if (prevProps.rental.status !== nextProps.rental.status) return false;
  if (prevProps.rental.customerName !== nextProps.rental.customerName)
    return false;
  if (prevProps.rental.totalPrice !== nextProps.rental.totalPrice) return false;

  // Compare vehicle data (if it changed)
  const prevVehicle = prevProps.vehicleLookup[prevProps.rental.vehicleId || ''];
  const nextVehicle = nextProps.vehicleLookup[nextProps.rental.vehicleId || ''];
  if (prevVehicle !== nextVehicle) return false;

  // Compare protocol status
  if (prevProps.hasHandoverProtocol !== nextProps.hasHandoverProtocol)
    return false;
  if (prevProps.hasReturnProtocol !== nextProps.hasReturnProtocol) return false;

  // Compare callbacks (should be memoized in parent)
  if (prevProps.onEdit !== nextProps.onEdit) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;

  return true;
});
