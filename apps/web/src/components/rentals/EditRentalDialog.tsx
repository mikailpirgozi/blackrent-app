import React from 'react';
import { Edit as EditIcon, Percent as PercentIcon, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogPortal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useEffect, useState } from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

import { apiService } from '../../services/api';
import type { Customer, Rental, Vehicle } from '../../types';
import { parseTimezoneFreeDateString } from '../../utils/formatters';
import { calculateRentalDays } from '../../utils/rentalDaysCalculator';

interface EditRentalDialogProps {
  open: boolean;
  rental: Rental | null;
  vehicles: Vehicle[];
  customers: Customer[];
  onClose: () => void;
  onSave: (updatedRental: Partial<Rental>) => void;
}

// Custom scrollable dialog content with proper overflow handling
const ScrollableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "max-h-[95vh] overflow-hidden flex flex-col",
        className
      )}
      style={{
        maxHeight: '95vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
ScrollableDialogContent.displayName = "ScrollableDialogContent";



const EditRentalDialog: React.FC<EditRentalDialogProps> = ({
  open,
  rental,
  vehicles,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Rental>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  const [showDiscountCommission, setShowDiscountCommission] = useState(false);

  useEffect(() => {
    if (rental && open) {
      setFormData({
        customerName: rental.customerName,
        customerEmail: rental.customerEmail,
        customerPhone: rental.customerPhone,
        vehicleId: rental.vehicleId,
        vehicleName: rental.vehicleName,
        vehicleCode: rental.vehicleCode,
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalPrice: rental.totalPrice,
        deposit: rental.deposit,
        handoverPlace: rental.handoverPlace,
        dailyKilometers: rental.dailyKilometers,
        paymentMethod: rental.paymentMethod,
        notes: rental.notes,
        discount: rental.discount,
        customCommission: rental.customCommission,
        // 🔄 OPRAVA: Pridané isFlexible pole
        isFlexible: rental.isFlexible || false,
        flexibleEndDate: rental.flexibleEndDate,
      } as Partial<Rental>);
      setCalculatedPrice(rental.totalPrice || 0);
      setCalculatedCommission(rental.commission || 0);
      setError(null);
    }
  }, [rental, open]);

  // ✅ MIGRÁCIA: Zakomentovaná stará implementácia nahradená centrálnou funkciou

  // Auto-calculate price and commission when relevant fields change
  useEffect(() => {
    // 🔄 OPRAVA: Pre flexibilné prenájmy neprepočítavaj automaticky ceny
    if (formData.isFlexible) {
      return;
    }

    if (!formData.vehicleId || !formData.startDate || !formData.endDate) {
      setCalculatedPrice(0);
      setCalculatedCommission(0);
      return;
    }

    const vehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (!vehicle) {
      setCalculatedPrice(0);
      setCalculatedCommission(0);
      return;
    }

    // Calculate rental days
    const startDate =
      formData.startDate instanceof Date
        ? formData.startDate
        : parseTimezoneFreeDateString(formData.startDate) || new Date();
    const endDate =
      formData.endDate instanceof Date
        ? formData.endDate
        : parseTimezoneFreeDateString(formData.endDate) || new Date();

    // Removed unused startDateOnly and endDateOnly variables

    // ✅ MIGRÁCIA: Používame centrálnu utility funkciu calculateRentalDays
    const days = calculateRentalDays(startDate, endDate);

    // Find pricing tier
    const pricingTier = vehicle.pricing?.find(
      p => days >= p.minDays && days <= p.maxDays
    );
    if (!pricingTier) {
      setCalculatedPrice(0);
      setCalculatedCommission(0);
      return;
    }

    // Calculate base price
    const basePrice = pricingTier.pricePerDay * days;

    // Apply discount
    let discount = 0;
    if (formData.discount?.value && formData.discount.value > 0) {
      if (formData.discount.type === 'percentage') {
        discount = (basePrice * formData.discount.value) / 100;
      } else {
        discount = formData.discount.value;
      }
    }

    const basePriceAfterDiscount = Math.max(0, basePrice - discount);
    setCalculatedPrice(basePriceAfterDiscount);

    // Calculate commission
    let commission = 0;
    if (
      formData.customCommission?.value &&
      formData.customCommission.value > 0
    ) {
      if (formData.customCommission.type === 'percentage') {
        commission =
          (basePriceAfterDiscount * formData.customCommission.value) / 100;
      } else {
        commission = formData.customCommission.value;
      }
    } else if (vehicle.commission) {
      if (vehicle.commission.type === 'percentage') {
        commission = (basePriceAfterDiscount * vehicle.commission.value) / 100;
      } else {
        commission = vehicle.commission.value;
      }
    }
    setCalculatedCommission(commission);

    // Update formData with calculated price
    setFormData(prev => ({
      ...prev,
      totalPrice: basePriceAfterDiscount,
      commission: commission,
    }));
  }, [
    formData.vehicleId,
    formData.startDate,
    formData.endDate,
    formData.discount,
    formData.customCommission,
    formData.isFlexible,
    vehicles,
  ]);

  // 🔧 OPRAVA: Prepočítaj províziu pri manuálnej zmene ceny
  useEffect(() => {
    if (!calculatedPrice || calculatedPrice <= 0) {
      setCalculatedCommission(0);
      return;
    }

    const vehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (!vehicle) {
      setCalculatedCommission(0);
      return;
    }

    // Calculate commission based on manually entered price
    let commission = 0;
    if (
      formData.customCommission?.value &&
      formData.customCommission.value > 0
    ) {
      if (formData.customCommission.type === 'percentage') {
        commission = (calculatedPrice * formData.customCommission.value) / 100;
      } else {
        commission = formData.customCommission.value;
      }
    } else if (vehicle.commission) {
      if (vehicle.commission.type === 'percentage') {
        commission = (calculatedPrice * vehicle.commission.value) / 100;
      } else {
        commission = vehicle.commission.value;
      }
    }
    setCalculatedCommission(commission);
  }, [
    calculatedPrice,
    formData.customCommission,
    formData.vehicleId,
    vehicles,
  ]);

  const handleSave = async () => {
    if (!rental) return;

    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (
        !formData.customerName ||
        !formData.startDate ||
        !formData.endDate ||
        !formData.totalPrice
      ) {
        setError('Vyplňte všetky povinné polia');
        return;
      }

      // Update rental via API with calculated values
      const updatedData = {
        ...formData,
        totalPrice: calculatedPrice,
        commission: calculatedCommission,
        discount:
          formData.discount?.value && formData.discount.value > 0
            ? formData.discount
            : undefined,
        customCommission:
          formData.customCommission?.value &&
          formData.customCommission.value > 0
            ? formData.customCommission
            : undefined,
        // 🔄 OPRAVA: Pridané isFlexible pole
        isFlexible: formData.isFlexible || false,
        flexibleEndDate: formData.flexibleEndDate,
      };

      await apiService.updateRental({ ...rental, ...updatedData } as Rental);

      onSave(updatedData as Partial<Rental>);
      onClose();
    } catch (err: unknown) {
      console.error('Error updating rental:', err);
      setError('Nepodarilo sa uložiť zmeny');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Rental, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // const selectedCustomer = customers.find(
  //   c => c.name === formData.customerName
  // );

  if (!rental) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <ScrollableDialogContent 
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b p-4 sm:p-6">
          <DialogTitle className="flex items-center gap-2">
            <EditIcon className="w-5 h-5" />
            Upraviť prenájom - {rental.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Upravte údaje prenájmu a uložte zmeny
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="mb-4 shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
  
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Customer Info */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Zákazník
            </h3>
          </div>

          <div className="">
            <Label htmlFor="customerName">Meno zákazníka *</Label>
            <Input
              id="customerName"
              value={formData.customerName || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('customerName', e.target.value)}
            />
          </div>

          <div className="">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('customerEmail', e.target.value)}
            />
          </div>

          <div className="">
            <Label htmlFor="customerPhone">Telefón</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('customerPhone', e.target.value)}
            />
          </div>

          {/* Vehicle Selection */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold text-primary mt-4 mb-2">
              Vozidlo
            </h3>
          </div>

          <div>
            <Label htmlFor="vehicle-select">Vyberte vozidlo</Label>
            <Select
              value={formData.vehicleId || ''}
              onValueChange={(value) => {
                const selectedVehicle = vehicles.find(v => v.id === value);
                handleInputChange('vehicleId', value);
                handleInputChange(
                  'vehicleName',
                  selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : ''
                );
                handleInputChange('vehicleCode', selectedVehicle?.licensePlate || '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte vozidlo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {`${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="vehicleCode">Kód vozidla</Label>
            <Input
              id="vehicleCode"
              value={formData.vehicleCode || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('vehicleCode', e.target.value)}
            />
          </div>

          {/* Rental Dates */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold text-primary mt-4 mb-2">
              Termín prenájmu
            </h3>
          </div>

          {/* 🔄 OPRAVA: Typ prenájmu */}
          <div className="">
            <Label htmlFor="rentalType">Typ prenájmu</Label>
            <Select
              value={formData.isFlexible ? 'flexible' : 'standard'}
              onValueChange={(value: string) => {
                const isFlexible = value === 'flexible';
                handleInputChange('isFlexible', isFlexible);

                // Pri zmene na štandardný prenájom prepočítaj ceny
                if (
                  !isFlexible &&
                  formData.vehicleId &&
                  formData.startDate &&
                  formData.endDate
                ) {
                  // Trigger price recalculation by updating a dependency
                  setFormData(prev => ({ ...prev, isFlexible: false }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte typ prenájmu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">🔒 Štandardný prenájom</SelectItem>
                <SelectItem value="flexible">🔄 Flexibilný prenájom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 🔄 OPRAVA: Flexibilný prenájom indikátor */}
          {formData.isFlexible && (
            <div className="">
              <div className="p-4 bg-yellow-100 border-2 border-yellow-500 rounded flex items-center gap-2">
                <p className="text-sm text-yellow-700">
                  🔄 Flexibilný prenájom - cena sa nastavuje manuálne
                </p>
              </div>
            </div>
          )}

          <div className="">
            <DateTimePicker
              label="Začiatok prenájmu *"
              value={
                formData.startDate
                  ? parseTimezoneFreeDateString(formData.startDate)
                  : null
              }
              onChange={newValue => handleInputChange('startDate', newValue)}
            />
          </div>

          <div className="">
            <DateTimePicker
              label={
                formData.isFlexible
                  ? 'Koniec prenájmu (voliteľné)'
                  : 'Koniec prenájmu *'
              }
              value={
                formData.endDate
                  ? parseTimezoneFreeDateString(formData.endDate)
                  : null
              }
              onChange={newValue => handleInputChange('endDate', newValue)}
            />
          </div>

          {/* 🔄 OPRAVA: Flexibilný dátum konca */}
          {formData.isFlexible && (
            <div className="">
              <DateTimePicker
                label="Odhadovaný dátum vrátenia"
                value={
                  formData.flexibleEndDate
                    ? parseTimezoneFreeDateString(formData.flexibleEndDate)
                    : null
                }
                onChange={newValue =>
                  handleInputChange('flexibleEndDate', newValue)
                }
              />
            </div>
          )}

          {/* Financial Info */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold text-primary mt-4 mb-2">
              Ceny a platba
            </h3>
          </div>

          <div>
            <Label htmlFor="totalPrice">Celková cena *</Label>
            <Input
              id="totalPrice"
              type="number"
              value={calculatedPrice || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCalculatedPrice(parseFloat(e.target.value) || 0)
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.isFlexible
                ? 'Manuálne nastavená cena pre flexibilný prenájom (€)'
                : 'Automaticky prepočítaná podľa zľavy (€)'}
            </p>
          </div>

          <div>
            <Label htmlFor="deposit">Depozit</Label>
            <Input
              id="deposit"
              type="number"
              value={formData.deposit || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange('deposit', parseFloat(e.target.value) || 0)
              }
            />
            <p className="text-xs text-muted-foreground mt-1">€</p>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Spôsob platby</Label>
            <Select
              value={formData.paymentMethod || 'cash'}
              onValueChange={(value: string) =>
                handleInputChange('paymentMethod', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte spôsob platby" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Hotovosť</SelectItem>
                <SelectItem value="bank_transfer">Prevod</SelectItem>
                <SelectItem value="vrp">VRP</SelectItem>
                <SelectItem value="direct_to_owner">Priamo majiteľovi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Calculation Summary */}
          <div className="col-span-full">
            <Card className="mt-4 mb-4">
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-primary">
                      Celková cena:{' '}
                      <strong>{new Intl.NumberFormat('sk-SK', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(calculatedPrice)}</strong>
                    </h4>
                    <p className="text-base">
                      Provízia:{' '}
                      <strong>{new Intl.NumberFormat('sk-SK', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(calculatedCommission)}</strong>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setShowDiscountCommission(!showDiscountCommission)
                    }
                  >
                    {showDiscountCommission ? <PercentIcon className="h-4 w-4" /> : <EditIcon className="h-4 w-4" />}
                  </Button>
                </div>

                {showDiscountCommission && (
                  <div className="mt-4">
                    <h5 className="text-base font-medium mb-2">
                      Zľava / Provízia
                    </h5>

                    {/* Discount */}
                    <div className="flex gap-2 mb-4">
                      <div className="min-w-20">
                        <Label htmlFor="discountType">Zľava</Label>
                        <Select
                          value={formData.discount?.type || ''}
                          onValueChange={(value: string) =>
                            handleInputChange('discount', {
                              ...formData.discount,
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Typ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">€</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="max-w-[100px]">
                        <Label htmlFor="discountValue">Hodnota</Label>
                        <Input
                          id="discountValue"
                          type="number"
                          value={formData.discount?.value || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleInputChange('discount', {
                              ...formData.discount,
                              value: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Commission */}
                    <div className="flex gap-2 mb-2">
                      <div className="min-w-30">
                        <Label htmlFor="commissionType">Provízia</Label>
                        <Select
                          value={formData.customCommission?.type || ''}
                          onValueChange={(value: string) =>
                            handleInputChange('customCommission', {
                              ...formData.customCommission,
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Typ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">€</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="max-w-[100px]">
                        <Label htmlFor="commissionValue">Hodnota</Label>
                        <Input
                          id="commissionValue"
                          type="number"
                          value={formData.customCommission?.value || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleInputChange('customCommission', {
                              ...formData.customCommission,
                              value: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold text-primary mt-4 mb-2">
              Dodatočné informácie
            </h3>
          </div>

          <div className="">
            <Label htmlFor="handoverPlace">Miesto odovzdania</Label>
            <Input
              id="handoverPlace"
              value={formData.handoverPlace || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('handoverPlace', e.target.value)}
            />
          </div>

          <div className="">
            <Label htmlFor="dailyKilometers">Denný km limit</Label>
            <Input
              id="dailyKilometers"
              type="number"
              value={formData.dailyKilometers || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange(
                  'dailyKilometers',
                  parseInt(e.target.value) || 0
                )
              }
            />
            <p className="text-xs text-muted-foreground mt-1">km</p>
          </div>

          <div className="col-span-full">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('notes', e.target.value)}
            />
          </div>
        </div>
        </div>

        <DialogFooter className="shrink-0 p-4 sm:p-6 border-t">
          <Button onClick={onClose} disabled={loading}>
            Zrušiť
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Ukladám...' : 'Uložiť zmeny'}
          </Button>
        </DialogFooter>
      </ScrollableDialogContent>
    </Dialog>
  );
};

export default EditRentalDialog;
