import { useMemo, useState } from 'react';
// Lucide icons (replacing MUI icons)
import {
  Calendar as CalendarIcon,
  Car as CarIcon,
  CheckCircle as CheckCircleIcon,
  X as CloseIcon,
  Eye as VisibilityIcon,
} from 'lucide-react';

// shadcn/ui components
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
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Tailwind CSS utility for responsive design
import { cn } from '@/lib/utils';

// shadcn/ui components (additional imports)
import { ScrollArea } from '@/components/ui/scroll-area';

// Custom hook for responsive design
import { useMediaQuery } from '../../hooks/use-media-query';

import { format, isAfter, isBefore } from 'date-fns';
import { sk } from 'date-fns/locale';

import type { Customer, Rental, Vehicle } from '../../types';
import { calculateRentalDays } from '../../utils/rentalDaysCalculator';

interface CustomerRentalHistoryProps {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  rentals: Rental[];
  vehicles: Vehicle[];
}

const getRentalStatus = (rental: Rental) => {
  const now = new Date();
  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);

  if (rental.status === 'finished')
    return { status: 'finished', label: 'Ukončený', color: 'default' as const };

  if (isBefore(now, startDate)) {
    return { status: 'pending', label: 'Čaká', color: 'warning' as const };
  } else if (isAfter(now, endDate)) {
    return { status: 'overdue', label: 'Po termíne', color: 'error' as const };
  } else {
    return { status: 'active', label: 'Aktívny', color: 'success' as const };
  }
};

const getPaymentMethodText = (method: string) => {
  const methods: Record<string, string> = {
    cash: 'Hotovosť',
    bank_transfer: 'Bankový prevod',
    vrp: 'VRP',
    direct_to_owner: 'Priamo majiteľovi',
  };
  return methods[method] || method;
};

export default function CustomerRentalHistory({
  open,
  onClose,
  customer,
  rentals,
  vehicles,
}: CustomerRentalHistoryProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isSmallScreen = useMediaQuery('(max-width: 640px)');
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  // Filtrujeme prenájmy pre tohto zákazníka
  const customerRentals = useMemo(() => {
    return rentals
      .filter(
        rental =>
          rental.customerId === customer.id ||
          rental.customerName === customer.name
      )
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
  }, [rentals, customer]);

  const handleViewRentalDetail = (rental: Rental) => {
    setSelectedRental(rental);
  };

  const handleCloseRentalDetail = () => {
    setSelectedRental(null);
  };

  const getVehicleInfo = (rental: Rental) => {
    if (rental.vehicle) {
      return `${rental.vehicle.brand} ${rental.vehicle.model} (${rental.vehicle.licensePlate})`;
    }
    if (rental.vehicleId) {
      const vehicle = vehicles.find(v => v.id === rental.vehicleId);
      if (vehicle) {
        return `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
      }
    }
    return rental.vehicleName || 'Neznáme vozidlo';
  };

  // ✅ MIGRÁCIA: Používame centrálnu utility funkciu calculateRentalDays
  // Stará implementácia pridávala +1 čo bolo nekonzistentné

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={`${isMobile ? 'h-screen max-h-screen' : 'max-w-4xl max-h-[90vh]'} overflow-hidden`}>
        <DialogHeader className="bg-primary text-primary-foreground p-4 -m-6 mb-4">
          <DialogTitle className="flex justify-between items-center text-white">
            <div>
              <h2 className={`text-white font-bold ${isSmallScreen ? 'text-lg' : isMobile ? 'text-xl' : 'text-2xl'}`}>
                História prenájmov - {customer.name}
              </h2>
              <DialogDescription className="text-white/80 text-sm">
                {customerRentals.length} prenájmov celkovo
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <CloseIcon className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-0 bg-background">
          {customerRentals.length === 0 ? (
            <div className="p-6 text-center bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Žiadne prenájmy
              </h3>
              <p className="text-sm text-muted-foreground">
                Tento zákazník zatiaľ nemá žiadne prenájmy.
              </p>
            </div>
          ) : (
            <div>
              {/* Mobilné zobrazenie - karty */}
              {isMobile ? (
                <div className={cn("p-4", isSmallScreen && "p-2")}>
                  {customerRentals.map(rental => {
                    const status = getRentalStatus(rental);
                    // Safe date conversion
                    const startDate =
                      rental.startDate instanceof Date
                        ? rental.startDate
                        : new Date(rental.startDate);
                    const endDate =
                      rental.endDate instanceof Date
                        ? rental.endDate
                        : new Date(rental.endDate);
                    const days = calculateRentalDays(startDate, endDate);

                    return (
                      <Card
                        key={rental.id}
                        className="mb-4 border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-in-out"
                      >
                        <CardContent className="p-4">
                          {/* Hlavička karty */}
                          <div
                            className="flex justify-between items-start mb-3"
                          >
                            <div className="flex-1">
                              <h3
                                className="text-lg font-bold text-foreground mb-1"
                              >
                                {getVehicleInfo(rental)}
                              </h3>
                              <Badge
                                variant={status.color === 'success' ? 'default' : status.color === 'warning' ? 'secondary' : 'destructive'}
                                className="mb-2"
                              >
                                {status.label}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewRentalDetail(rental)}
                              className="text-white bg-primary hover:bg-primary/90 p-2"
                            >
                              <VisibilityIcon className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Dátumy */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarIcon
                                className="text-muted-foreground w-4 h-4"
                              />
                              <p className="text-sm text-foreground">
                                {format(
                                  new Date(rental.startDate),
                                  'dd.MM.yyyy',
                                  { locale: sk }
                                )}{' '}
                                -{' '}
                                {format(
                                  new Date(rental.endDate),
                                  'dd.MM.yyyy',
                                  { locale: sk }
                                )}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {days} dní •{' '}
                              {format(
                                new Date(rental.createdAt),
                                'dd.MM.yyyy',
                                { locale: sk }
                              )}
                            </p>
                          </div>

                          {/* Cena a platba */}
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="text-lg font-bold text-foreground">
                                {rental.totalPrice.toFixed(2)} €
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {getPaymentMethodText(rental.paymentMethod)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Provízia: {rental.commission.toFixed(2)} €
                              </p>
                              {rental.paid ? (
                                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                                  Zaplatené
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                  Nezaplatené
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* Desktop zobrazenie - tabuľka */
                <ScrollArea className={cn(
                  "border rounded-lg bg-card",
                  isTablet ? "max-h-[500px]" : "max-h-[600px]"
                )}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary hover:bg-primary">
                        <TableHead
                          className="font-bold text-white border-b-2 border-primary-foreground"
                        >
                          Vozidlo
                        </TableHead>
                        <TableHead
                          className="font-bold text-white border-b-2 border-primary-foreground"
                        >
                          Dátumy
                        </TableHead>
                        <TableHead
                          className="font-bold text-white border-b-2 border-primary-foreground"
                        >
                          Dní
                        </TableHead>
                        <TableHead
                          className="font-bold text-white border-b-2 border-primary-foreground"
                        >
                          Cena
                        </TableHead>
                        <TableHead
                          className="font-bold text-white border-b-2 border-primary-foreground"
                        >
                          Provízia
                        </TableHead>
                        <TableHead
                          className="font-bold text-white border-b-2 border-primary-foreground"
                        >
                          Platba
                        </TableHead>
                        <TableHead
                          className="font-bold text-white border-b-2 border-primary-foreground"
                        >
                          Stav
                        </TableHead>
                        <TableHead
                          className="font-bold text-white border-b-2 border-primary-foreground"
                        >
                          Akcie
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerRentals.map(rental => {
                        const status = getRentalStatus(rental);
                        // Safe date conversion
                        const startDate =
                          rental.startDate instanceof Date
                            ? rental.startDate
                            : new Date(rental.startDate);
                        const endDate =
                          rental.endDate instanceof Date
                            ? rental.endDate
                            : new Date(rental.endDate);
                        const days = calculateRentalDays(startDate, endDate);

                        return (
                          <TableRow
                            key={rental.id}
                            className="bg-card hover:bg-muted cursor-pointer even:bg-muted/50"
                          >
                            <TableCell
                              className="border-b border-border"
                            >
                              <div className="flex items-center gap-2">
                                <CarIcon
                                  className="text-muted-foreground w-5 h-5"
                                />
                                <p className="text-sm font-medium text-foreground">
                                  {getVehicleInfo(rental)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell
                              className="border-b border-border"
                            >
                              <p className="text-sm text-foreground">
                                {format(
                                  new Date(rental.startDate),
                                  'dd.MM.yyyy',
                                  { locale: sk }
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(
                                  new Date(rental.endDate),
                                  'dd.MM.yyyy',
                                  { locale: sk }
                                )}
                              </p>
                            </TableCell>
                            <TableCell
                              className="border-b border-border"
                            >
                              <p className="text-sm text-foreground">
                                {days}
                              </p>
                            </TableCell>
                            <TableCell
                              className="border-b border-border"
                            >
                              <p className="text-sm font-bold text-foreground">
                                {rental.totalPrice.toFixed(2)} €
                              </p>
                            </TableCell>
                            <TableCell
                              className="border-b border-border"
                            >
                              <p className="text-sm text-muted-foreground">
                                {rental.commission.toFixed(2)} €
                              </p>
                            </TableCell>
                            <TableCell
                              className="border-b border-border"
                            >
                              <div>
                                <p className="text-sm text-foreground">
                                  {getPaymentMethodText(rental.paymentMethod)}
                                </p>
                                {rental.paid ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                                    Zaplatené
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    Nezaplatené
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell
                              className="border-b border-border"
                            >
                              <Badge 
                                variant={status.color === 'success' ? 'default' : status.color === 'warning' ? 'secondary' : 'destructive'}
                                className={cn(
                                  status.color === 'success' && "bg-green-100 text-green-800 hover:bg-green-100",
                                  status.color === 'warning' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                                  status.color === 'error' && "bg-red-100 text-red-800 hover:bg-red-100"
                                )}
                              >
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell
                              className="border-b border-border"
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewRentalDetail(rental)}
                                className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                              >
                                <VisibilityIcon className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
        </DialogContent>

        <DialogFooter className="p-4 bg-card border-t border-border">
          <Button onClick={onClose} variant="outline" className="min-w-[100px]">
            Zavrieť
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Detail prenájmu */}
      {selectedRental && (
        <Dialog
          open={!!selectedRental}
          onOpenChange={(open) => !open && handleCloseRentalDetail()}
        >
          <DialogHeader className="bg-primary text-primary-foreground p-4 -m-6 mb-4">
            <DialogTitle className="flex justify-between items-center text-white">
              <span>Detail prenájmu</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCloseRentalDetail}
                className="text-white hover:bg-white/20"
              >
                <CloseIcon className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="bg-background">
            <DialogHeader>
              <DialogTitle>Detail prenájmu</DialogTitle>
              <DialogDescription>
                Zobrazenie detailných informácií o vybranom prenájme
              </DialogDescription>
            </DialogHeader>
            <div className="mb-6 p-4 bg-card rounded-lg">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {getVehicleInfo(selectedRental)}
              </h3>
              <Badge 
                variant={getRentalStatus(selectedRental).color === 'success' ? 'default' : getRentalStatus(selectedRental).color === 'warning' ? 'secondary' : 'destructive'}
                className={cn(
                  "mb-4",
                  getRentalStatus(selectedRental).color === 'success' && "bg-green-100 text-green-800 hover:bg-green-100",
                  getRentalStatus(selectedRental).color === 'warning' && "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                  getRentalStatus(selectedRental).color === 'error' && "bg-red-100 text-red-800 hover:bg-red-100"
                )}
              >
                {getRentalStatus(selectedRental).label}
              </Badge>
            </div>

            <div className={cn(
              "grid grid-cols-1 md:grid-cols-2",
              isSmallScreen ? "gap-2" : "gap-4"
            )}>
              <div>
                <Card
                  className="bg-card h-full"
                >
                  <CardContent>
                    <h4 className="text-base font-bold text-foreground mb-4">
                      Základné informácie
                    </h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground font-medium">
                          Začiatok:
                        </p>
                        <p className="text-sm text-foreground">
                          {format(
                            new Date(selectedRental.startDate),
                            'dd.MM.yyyy HH:mm',
                            { locale: sk }
                          )}
                        </p>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground font-medium">
                          Koniec:
                        </p>
                        <p className="text-sm text-foreground">
                          {format(
                            new Date(selectedRental.endDate),
                            'dd.MM.yyyy HH:mm',
                            { locale: sk }
                          )}
                        </p>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground font-medium">
                          Dní:
                        </p>
                        <p className="text-sm text-foreground font-bold">
                          {(() => {
                            // Safe date conversion
                            const startDate =
                              selectedRental.startDate instanceof Date
                                ? selectedRental.startDate
                                : new Date(selectedRental.startDate);
                            const endDate =
                              selectedRental.endDate instanceof Date
                                ? selectedRental.endDate
                                : new Date(selectedRental.endDate);
                            return calculateRentalDays(startDate, endDate);
                          })()}
                        </p>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground font-medium">
                          Vytvorený:
                        </p>
                        <p className="text-sm text-foreground">
                          {format(
                            new Date(selectedRental.createdAt),
                            'dd.MM.yyyy HH:mm',
                            { locale: sk }
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card
                  className="bg-card h-full"
                >
                  <CardContent>
                    <h4 className="text-base font-bold text-foreground mb-4">
                      Finančné informácie
                    </h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground font-medium">
                          Celková cena:
                        </p>
                        <p className="text-base font-bold text-foreground">
                          {selectedRental.totalPrice.toFixed(2)} €
                        </p>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground font-medium">
                          Provízia:
                        </p>
                        <p className="text-sm text-foreground">
                          {selectedRental.commission.toFixed(2)} €
                        </p>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground font-medium">
                          Spôsob platby:
                        </p>
                        <p className="text-sm text-foreground">
                          {getPaymentMethodText(selectedRental.paymentMethod)}
                        </p>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground font-medium">
                          Stav platby:
                        </p>
                        <p className="text-sm text-foreground">
                          {selectedRental.paid ? 'Zaplatené' : 'Nezaplatené'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {selectedRental.notes && (
              <Card className="bg-card mt-4">
                <CardContent>
                  <h4 className="text-base font-bold text-foreground mb-4">
                    Poznámky
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedRental.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {selectedRental.discount && (
              <Card className="bg-card mt-4">
                <CardContent>
                  <h4 className="text-base font-bold text-foreground mb-4">
                    Zľava
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedRental.discount.type === 'percentage'
                      ? `${selectedRental.discount.value}%`
                      : `${selectedRental.discount.value} €`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="p-4 bg-card border-t border-border">
            <Button
              onClick={handleCloseRentalDetail}
              variant="outline"
              className="min-w-[100px]"
            >
              Zavrieť
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </>
  );
}
