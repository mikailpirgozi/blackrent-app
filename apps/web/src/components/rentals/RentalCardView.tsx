// Lucide icons (replacing MUI icons)
import {
  Building2 as BusinessIcon,
  Car as CarIcon,
  CheckCircle as CheckCircleIcon,
  Trash2 as DeleteIcon,
  Edit as EditIcon,
  AlertCircle as ErrorIcon,
  Images as GalleryIcon,
  FileText as HandoverIcon,
  FileText as PDFIcon,
  CreditCard as PaymentIcon,
  Clock as PendingIcon,
  User as PersonIcon,
  RotateCcw as ReturnIcon,
  Calendar as ScheduleIcon,
  Eye as VisibilityIcon,
} from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { memo } from 'react';
import { formatDateTime } from '../../utils/formatters';
import PriceDisplay from './components/PriceDisplay';

import type { HandoverProtocol, Rental, ReturnProtocol } from '../../types';

export type CardViewMode = 'grid' | 'list' | 'compact' | 'detailed';

interface RentalCardViewProps {
  rentals: Rental[];
  viewMode: CardViewMode;
  onEdit: (rental: Rental) => void;
  onDelete: (rentalId: string) => void;
  onCreateHandover: (rental: Rental) => void;
  onCreateReturn: (rental: Rental) => void;
  onViewPDF: (
    protocolId: string,
    type: 'handover' | 'return',
    title: string
  ) => void;
  onOpenGallery: (rental: Rental, protocolType: 'handover' | 'return') => void;
  onViewProtocols: (rental: Rental) => void;
  protocols: Record<
    string,
    { handover?: HandoverProtocol; return?: ReturnProtocol }
  >;
  loadingProtocols: string[];
}

const RentalCardView: React.FC<RentalCardViewProps> = ({
  rentals,
  viewMode,
  onEdit,
  onDelete,
  onCreateHandover,
  onCreateReturn,
  onViewPDF,
  onOpenGallery,
  onViewProtocols,
  protocols,
  loadingProtocols,
}) => {
  // const theme = useTheme();
  // const _isMobile = useMediaQuery(theme.breakpoints.down('md')); // TODO: Implement mobile-specific layout

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'aktívny':
      case 'active':
        return 'success';
      case 'dokončený':
      case 'completed':
        return 'default';
      case 'zrušený':
      case 'cancelled':
        return 'error';
      case 'po termíne':
      case 'overdue':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'aktívny':
      case 'active':
        return <CheckCircleIcon fontSize="small" />;
      case 'dokončený':
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'zrušený':
      case 'cancelled':
        return <ErrorIcon fontSize="small" />;
      case 'po termíne':
      case 'overdue':
        return <PendingIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  const renderCompactCard = (rental: Rental) => {
    const hasHandover = protocols[rental.id]?.handover;
    const hasReturn = protocols[rental.id]?.return;
    const isActive =
      rental.status?.toLowerCase() === 'aktívny' ||
      rental.status?.toLowerCase() === 'active';
    // const _isFinished =
    //   rental.status?.toLowerCase() === 'dokončený' ||
    //   rental.status?.toLowerCase() === 'completed'; // TODO: Implement finished status logic

    return (
      <Card
        key={rental.id}
        className={cn(
          "h-full cursor-pointer transition-all duration-300 border relative overflow-visible",
          "hover:-translate-y-1 hover:shadow-xl",
          isActive 
            ? "border-green-500 hover:border-green-500" 
            : "border-border hover:border-primary"
        )}
        onClick={() => onEdit(rental)}
      >
        {/* Status indicator */}
        <div className="absolute -top-2 right-4 z-10">
          <Badge
            variant={getStatusColor(rental.status) === 'success' ? 'default' : 
                    getStatusColor(rental.status) === 'error' ? 'destructive' : 
                    getStatusColor(rental.status) === 'warning' ? 'secondary' : 'outline'}
            className="font-bold shadow-md"
          >
            <span className="mr-1">{getStatusIcon(rental.status)}</span>
            {rental.status}
          </Badge>
        </div>

        {/* Protocol status indicator */}
        <div className="absolute top-2 left-2 z-10">
          <div className="flex gap-1">
            {hasHandover && (
              <Badge
                variant="default"
                className="min-w-8 h-6 p-1 bg-green-500 hover:bg-green-600"
              >
                <HandoverIcon className="w-4 h-4" />
              </Badge>
            )}
            {hasReturn && (
              <Badge
                variant="default"
                className="min-w-8 h-6 p-1 bg-blue-500 hover:bg-blue-600"
              >
                <ReturnIcon className="w-4 h-4" />
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 pt-8">
          {/* Vehicle info */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CarIcon className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-primary">
                {rental.vehicle
                  ? `${rental.vehicle.brand} ${rental.vehicle.model}`
                  : 'Bez vozidla'}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {rental.vehicle?.licensePlate || 'N/A'}
            </p>
          </div>

          {/* Customer */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <PersonIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {rental.customerName}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ScheduleIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {formatDateTime(rental.startDate)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              do {formatDateTime(rental.endDate)}
            </p>
          </div>

          {/* Price */}
          <PriceDisplay rental={rental} variant="compact" showExtraKm={false} />

          {/* Protocol actions - vždy zobrazené */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={e => {
                e.stopPropagation();
                onViewProtocols(rental);
              }}
              disabled={loadingProtocols.includes(rental.id)}
              className="flex-1 min-w-fit"
            >
              <VisibilityIcon className="w-4 h-4 mr-2" />
              {loadingProtocols.includes(rental.id)
                ? 'Načítavam...'
                : 'Zobraziť protokoly'}
            </Button>
            {hasHandover && (
              <Button
                size="sm"
                variant="outline"
                onClick={e => {
                  e.stopPropagation();
                  onViewPDF(hasHandover.id, 'handover', 'Preberací protokol');
                }}
                className="min-w-fit"
              >
                <PDFIcon className="w-4 h-4 mr-2" />
                PDF
              </Button>
            )}
            {hasReturn && (
              <Button
                size="sm"
                variant="outline"
                onClick={e => {
                  e.stopPropagation();
                  onViewPDF(hasReturn.id, 'return', 'Preberací protokol');
                }}
                className="min-w-fit"
              >
                <PDFIcon className="w-4 h-4 mr-2" />
                PDF
              </Button>
            )}
          </div>

          {/* Protocol details when loaded */}
          {protocols[rental.id] && (
            <div className="mb-4 p-2 bg-gray-50 rounded">
              <span className="text-xs font-semibold">
                Detaily protokolov:
              </span>
              {hasHandover && (
                <div className="mt-2 p-2 bg-green-100 rounded">
                  <span className="text-[0.6rem] font-medium text-green-800">
                    ✅ Preberací protokol
                  </span>
                  <span className="block text-[0.55rem] text-muted-foreground">
                    {format(
                      new Date(hasHandover.createdAt),
                      'dd.MM.yyyy HH:mm',
                      { locale: sk }
                    )}
                  </span>
                </div>
              )}
              {hasReturn && (
                <div className="mt-2 p-2 bg-green-100 rounded">
                  <span className="text-[0.6rem] font-medium text-green-800">
                    ✅ Preberací protokol
                  </span>
                  <span className="block text-[0.55rem] text-muted-foreground">
                    {format(new Date(hasReturn.createdAt), 'dd.MM.yyyy HH:mm', {
                      locale: sk,
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  onEdit(rental);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-8 h-8 p-0"
              >
                <EditIcon className="w-4 h-4" />
              </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vymazať</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  onDelete(rental.id);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-8 h-8 p-0"
              >
                <DeleteIcon className="w-4 h-4" />
              </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vymazať</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDetailedCard = (rental: Rental) => {
    const hasHandover = protocols[rental.id]?.handover;
    const hasReturn = protocols[rental.id]?.return;
    const isActive =
      rental.status?.toLowerCase() === 'aktívny' ||
      rental.status?.toLowerCase() === 'active';

    return (
      <Card
        key={rental.id}
        className={cn(
          "h-full cursor-pointer transition-all duration-300 border relative overflow-visible",
          "hover:-translate-y-1 hover:shadow-xl",
          isActive 
            ? "border-green-500 hover:border-green-500" 
            : "border-border hover:border-primary"
        )}
        onClick={() => onEdit(rental)}
      >
        {/* Status indicator */}
        <div className="absolute -top-2 right-4 z-10">
          <Badge
            variant={getStatusColor(rental.status) === 'success' ? 'default' : 
                    getStatusColor(rental.status) === 'error' ? 'destructive' : 
                    getStatusColor(rental.status) === 'warning' ? 'secondary' : 'outline'}
            className="font-bold shadow-md"
          >
            <span className="mr-1">{getStatusIcon(rental.status)}</span>
            {rental.status}
          </Badge>
        </div>

        {/* Protocol status indicator */}
        <div className="absolute top-2 left-2 z-10">
          <div className="flex gap-1">
            {hasHandover && (
              <Badge
                variant="default"
                className="min-w-8 h-6 p-1 bg-green-500 hover:bg-green-600"
              >
                <HandoverIcon className="w-4 h-4" />
              </Badge>
            )}
            {hasReturn && (
              <Badge
                variant="default"
                className="min-w-8 h-6 p-1 bg-blue-500 hover:bg-blue-600"
              >
                <ReturnIcon className="w-4 h-4" />
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 pt-8">
          {/* Vehicle info */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CarIcon className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-primary">
                {rental.vehicle
                  ? `${rental.vehicle.brand} ${rental.vehicle.model}`
                  : 'Bez vozidla'}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {rental.vehicle?.licensePlate || 'N/A'}
            </p>
          </div>

          {/* Customer and company */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <PersonIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {rental.customerName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <BusinessIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {rental.vehicle?.company || 'N/A'}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ScheduleIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                Obdobie prenájmu
              </p>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {formatDateTime(rental.startDate)} -{' '}
              {formatDateTime(rental.endDate)}
            </p>
          </div>

          {/* Price and commission */}
          <PriceDisplay rental={rental} variant="detailed" showExtraKm={true} />

          {/* Payment info */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <PaymentIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {rental.paymentMethod} -{' '}
                {rental.paid ? 'Uhradené' : 'Neuhradené'}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Protocol actions */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {!hasHandover && (
              <Button
              size="sm"
              variant="outline"
                onClick={e => {
                  e.stopPropagation();
                  onCreateHandover(rental);
                }}
                className="flex-1"
              >
                Preberací protokol
              </Button>
            )}
            {hasHandover && !hasReturn && (
              <Button
              size="sm"
              variant="outline"
                onClick={e => {
                  e.stopPropagation();
                  onCreateReturn(rental);
                }}
                className="flex-1"
              >
                <ReturnIcon className="w-4 h-4 mr-2" />
                Protokol vrátenia
              </Button>
            )}
          </div>

          {/* Protocol actions for existing protocols */}
          {/* Debug info */}
          <div className="mb-2 p-2 bg-blue-100 rounded">
            <span className="text-xs text-blue-800">
              Debug: hasHandover={!!hasHandover}, hasReturn={!!hasReturn},
              protocols={Object.keys(protocols).length}
            </span>
          </div>

          {(hasHandover || hasReturn) && (
            <div className="flex gap-2 mb-4">
              <Button
              size="sm"
              variant="outline"
                onClick={e => {
                  e.stopPropagation();
                  onViewProtocols(rental);
                }}
                disabled={loadingProtocols.includes(rental.id)}
                className="flex-1"
              >
                <VisibilityIcon className="w-4 h-4 mr-2" />
                Zobraziť protokoly
              </Button>
              {hasHandover && (
                <Button
              size="sm"
              variant="outline"
                  onClick={e => {
                    e.stopPropagation();
                    onViewPDF(hasHandover.id, 'handover', 'Preberací protokol');
                  }}
                  className="flex-1"
                >
                  <PDFIcon className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              )}
              {hasReturn && (
                <Button
              size="sm"
              variant="outline"
                  onClick={e => {
                    e.stopPropagation();
                    onViewPDF(hasReturn.id, 'return', 'Preberací protokol');
                  }}
                  className="flex-1"
                >
                  <PDFIcon className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              )}
              {((hasHandover?.vehicleImages?.length ?? 0) > 0 ||
                (hasReturn?.vehicleImages?.length ?? 0) > 0) && (
                <Button
              size="sm"
              variant="outline"
                  onClick={e => {
                    e.stopPropagation();
                    onOpenGallery(rental, hasHandover ? 'handover' : 'return');
                  }}
                  className="flex-1"
                >
                  <GalleryIcon className="w-4 h-4 mr-2" />
                  Galéria
                </Button>
              )}
            </div>
          )}

          {/* Protocol details when loaded */}
          {protocols[rental.id] && (
            <div className="mb-4 p-2 bg-gray-50 rounded">
              <h6 className="mb-2 font-semibold text-sm">
                Detaily protokolov:
              </h6>
              {hasHandover && (
                <div className="mb-2 p-2 bg-green-100 rounded">
                  <span className="text-sm font-medium text-green-800">
                    ✅ Preberací protokol
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Vytvorený:{' '}
                    {format(
                      new Date(hasHandover.createdAt),
                      'dd.MM.yyyy HH:mm',
                      { locale: sk }
                    )}
                  </span>
                </div>
              )}
              {hasReturn && (
                <div className="mb-2 p-2 bg-green-100 rounded">
                  <span className="text-sm font-medium text-green-800">
                    ✅ Preberací protokol
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Vytvorený:{' '}
                    {format(new Date(hasReturn.createdAt), 'dd.MM.yyyy HH:mm', {
                      locale: sk,
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Protocol details when loaded */}
          {protocols[rental.id] && (
            <div className="mb-4 p-2 bg-gray-50 rounded">
              <h6 className="mb-2 font-semibold text-xs">
                Detaily protokolov:
              </h6>
              {hasHandover && (
                <div className="mb-2 p-2 bg-green-100 rounded">
                  <span className="text-xs font-medium text-green-800">
                    ✅ Preberací protokol
                  </span>
                  <span className="block text-[0.65rem] text-muted-foreground">
                    {format(
                      new Date(hasHandover.createdAt),
                      'dd.MM.yyyy HH:mm',
                      { locale: sk }
                    )}
                  </span>
                </div>
              )}
              {hasReturn && (
                <div className="mb-2 p-2 bg-green-100 rounded">
                  <span className="text-xs font-medium text-green-800">
                    ✅ Preberací protokol
                  </span>
                  <span className="block text-[0.65rem] text-muted-foreground">
                    {format(new Date(hasReturn.createdAt), 'dd.MM.yyyy HH:mm', {
                      locale: sk,
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  onEdit(rental);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-8 h-8 p-0"
              >
                <EditIcon className="w-4 h-4" />
              </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vymazať</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  onDelete(rental.id);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-8 h-8 p-0"
              >
                <DeleteIcon className="w-4 h-4" />
              </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vymazať</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCard = (rental: Rental) => {
    switch (viewMode) {
      case 'compact':
        return renderCompactCard(rental);
      case 'detailed':
        return renderDetailedCard(rental);
      default:
        return renderCompactCard(rental);
    }
  };


  return (
    <TooltipProvider>
      <div className="grid gap-2 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {rentals.map(rental => (
          <div key={rental.id}>
            {renderCard(rental)}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default memo(RentalCardView);
