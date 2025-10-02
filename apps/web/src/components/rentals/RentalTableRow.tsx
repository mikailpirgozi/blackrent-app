import { memo } from 'react';
// Lucide icons (replacing MUI icons)
import {
  Trash2 as DeleteIcon,
  Edit as EditIcon,
  FileText as HandoverProtocolIcon,
  Phone as PhoneIcon,
  RotateCcw as ReturnProtocolIcon,
  Eye as VisibilityIcon,
} from 'lucide-react';

// shadcn/ui components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatTime } from '../../utils/formatters';
import PriceDisplay from './components/PriceDisplay';

import type { Rental } from '../../types';

interface RentalTableRowProps {
  rental: Rental;
  onEdit: (rental: Rental) => void;
  onDelete: (id: string) => void;
  onShowDetail: (rental: Rental) => void;
  onProtocol: (rental: Rental, type: 'handover' | 'return') => void;
  formatPrice: (price: number | string | undefined) => string;
  formatDate: (date: Date | string) => string;
  getRentalPriority: (rental: Rental) => number;
  getRentalBackgroundColor: (rental: Rental) => string;
}

const RentalTableRow = memo<RentalTableRowProps>(
  ({
    rental,
    onEdit,
    onDelete,
    onShowDetail,
    onProtocol,
    formatPrice,
    formatDate,
    getRentalPriority,
    getRentalBackgroundColor,
  }) => {
    const priority = getRentalPriority(rental);

    return (
      <TableRow
        className="hover:bg-muted/50"
        style={{ backgroundColor: getRentalBackgroundColor(rental) }}
      >
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge
              variant={priority <= 3 ? "destructive" : priority <= 5 ? "secondary" : "outline"}
              className="min-w-[30px] justify-center"
            >
              {priority}
            </Badge>
            {rental.vehicle ? (
              <div>
                <div className="text-sm font-medium">
                  {rental.vehicle.licensePlate}
                </div>
                <div className="text-xs text-muted-foreground">
                  {rental.vehicle.brand} {rental.vehicle.model}
                </div>
                {(rental.vehicleVin || rental.vehicle.vin) && (
                  <div className="text-[10px] text-gray-500 font-mono">
                    VIN: {(rental.vehicleVin || rental.vehicle.vin)?.slice(-8)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-destructive">
                Bez vozidla
              </div>
            )}
          </div>
        </TableCell>

        <TableCell>
          <div className="text-sm">
            {rental.vehicle?.company || 'N/A'}
          </div>
        </TableCell>

        <TableCell>
          <div>
            <div className="text-sm font-medium">
              {rental.customerName}
            </div>
            {(rental.customerPhone || rental.customer?.phone) && (
              <div className="flex items-center gap-1 mt-1">
                <PhoneIcon className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {rental.customerPhone || rental.customer?.phone}
                </span>
              </div>
            )}
          </div>
        </TableCell>

        <TableCell>
          <div className="text-sm">
            {formatDate(rental.startDate)}
          </div>
          <div className="text-[10px] text-muted-foreground block">
            {formatTime(rental.startDate)}
          </div>
        </TableCell>

        <TableCell>
          <div className="text-sm">{formatDate(rental.endDate)}</div>
          <div className="text-[10px] text-muted-foreground block">
            {formatTime(rental.endDate)}
          </div>
        </TableCell>

        <TableCell>
          <PriceDisplay rental={rental} variant="compact" showExtraKm={false} />
        </TableCell>

        <TableCell>
          <div className="text-sm">
            €{formatPrice(rental.commission)}
          </div>
        </TableCell>

        <TableCell>
          <Badge
            variant={rental.paid ? "default" : "destructive"}
            className="text-xs"
          >
            {rental.paid ? 'Zaplatené' : 'Nezaplatené'}
          </Badge>
        </TableCell>

        <TableCell>
          <Badge
            variant={rental.confirmed ? "default" : "secondary"}
            className="text-xs"
          >
            {rental.confirmed ? 'Potvrdené' : 'Nepotvrdené'}
          </Badge>
        </TableCell>

        <TableCell>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onShowDetail(rental)}
                    className="h-8 w-8 p-0"
                  >
                    <VisibilityIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Detail</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(rental)}
                    className="h-8 w-8 p-0"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upraviť</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(rental.id)}
                    className="h-8 w-8 p-0"
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vymazať</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onProtocol(rental, 'handover')}
                    className="h-8 w-8 p-0"
                  >
                    <HandoverProtocolIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Protokol prevzatia</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onProtocol(rental, 'return')}
                    className="h-8 w-8 p-0"
                  >
                    <ReturnProtocolIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Protokol vrátenia</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

RentalTableRow.displayName = 'RentalTableRow';

export default RentalTableRow;
