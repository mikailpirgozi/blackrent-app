import {
  Calculator as Calculate,
  X as Cancel,
  Check as Check,
  X as Close,
  Car as DirectionsCar,
  Edit as Edit,
  MapPin as LocationOn,
  User as Person,
  Camera as PhotoCamera,
  Save as Save,
  Gauge as SpeedOutlined,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

import { useAuth } from '../../context/AuthContext';
import { useCreateReturnProtocol } from '../../lib/react-query/hooks/useProtocols';
import type {
  Customer,
  HandoverProtocol,
  ProtocolImage,
  ProtocolSignature,
  ProtocolVideo,
  Rental,
  ReturnProtocol,
  Vehicle,
} from '../../types';
// import { getApiBaseUrl } from '../../utils/apiUrl'; // REMOVED - React Query handles API calls
import SerialPhotoCapture from '../common/SerialPhotoCapture';
import { ModernPhotoCapture } from '../common/ModernPhotoCapture';
import SignaturePad from '../common/SignaturePad';
import { logger } from '@/utils/smartLogger';

interface ReturnProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  handoverProtocol: HandoverProtocol;
  onSave: (_protocol: ReturnProtocol) => void;
}

export default function ReturnProtocolForm({
  open,
  onClose,
  rental,
  handoverProtocol,
  onSave,
}: ReturnProtocolFormProps) {
  const { state } = useAuth();
  const createReturnProtocol = useCreateReturnProtocol();

  // Loading state z React Query
  const isLoading = createReturnProtocol.isPending;
  const [emailStatus, setEmailStatus] = useState<{
    status: 'pending' | 'success' | 'error' | 'warning';
    message?: string;
  } | null>(null);
  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(
    null
  );
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSigner, setCurrentSigner] = useState<{
    name: string;
    role: 'customer' | 'employee';
  } | null>(null);

  // Retry mechanism state - REMOVED (React Query handles retries automatically)

  // 🔧 NOVÉ: Editácia ceny za km
  const [isEditingKmRate, setIsEditingKmRate] = useState(false);
  const [customKmRate, setCustomKmRate] = useState<number | null>(null);
  const [originalKmRate, setOriginalKmRate] = useState<number>(0);

  // Zjednodušený state s bezpečným prístupom k handoverProtocol
  const [formData, setFormData] = useState({
    location: '',
    odometer: handoverProtocol?.vehicleCondition?.odometer || undefined,
    fuelLevel: 100,
    fuelType: handoverProtocol?.vehicleCondition?.fuelType || 'gasoline',
    exteriorCondition: 'Dobrý',
    interiorCondition: 'Dobrý',
    notes: '',
    vehicleImages: [] as ProtocolImage[],
    documentImages: [] as ProtocolImage[],
    damageImages: [] as ProtocolImage[],
    vehicleVideos: [] as ProtocolVideo[],
    documentVideos: [] as ProtocolVideo[],
    damageVideos: [] as ProtocolVideo[],
    signatures: [] as ProtocolSignature[],
  });

  // Automatické výpočty
  const [fees, setFees] = useState({
    kilometersUsed: 0,
    kilometerOverage: 0,
    kilometerFee: 0,
    fuelUsed: 0,
    fuelFee: 0,
    totalExtraFees: 0,
    depositRefund: 0,
    additionalCharges: 0,
    finalRefund: 0,
  });

  const calculateFees = useCallback(() => {
    const currentOdometer = formData.odometer || 0;
    const startingOdometer = handoverProtocol?.vehicleCondition?.odometer || 0;
    const allowedKm = rental.allowedKilometers || 0;
    const baseExtraKmRate = rental.extraKilometerRate || 0.5;
    const depositAmount = rental.deposit || 0;

    // 🔧 NOVÉ: Použiť vlastnú cenu za km ak je nastavená, inak cenníkovú
    const extraKmRate = customKmRate !== null ? customKmRate : baseExtraKmRate;

    // Uložiť pôvodnú cenníkovú sadzbu pri prvom načítaní
    if (originalKmRate === 0 && baseExtraKmRate > 0) {
      setOriginalKmRate(baseExtraKmRate);
    }

    // Výpočet najazdených km
    const kilometersUsed = Math.max(0, currentOdometer - startingOdometer);

    // Výpočet prekročenia km
    const kilometerOverage =
      allowedKm > 0 ? Math.max(0, kilometersUsed - allowedKm) : 0;
    const kilometerFee = kilometerOverage * extraKmRate;

    // Výpočet spotreby paliva
    const startingFuel = handoverProtocol?.vehicleCondition?.fuelLevel || 100;
    const currentFuel = formData.fuelLevel;
    const fuelUsed = Math.max(0, startingFuel - currentFuel);
    const fuelFee = fuelUsed * 0.02; // 2 centy za %

    // Celkové poplatky
    const totalExtraFees = kilometerFee + fuelFee;

    // Výpočet refundu
    const depositRefund = Math.max(0, depositAmount - totalExtraFees);
    const additionalCharges = Math.max(0, totalExtraFees - depositAmount);
    const finalRefund = depositRefund;

    setFees({
      kilometersUsed,
      kilometerOverage,
      kilometerFee,
      fuelUsed,
      fuelFee,
      totalExtraFees,
      depositRefund,
      additionalCharges,
      finalRefund,
    });
  }, [
    formData.odometer,
    formData.fuelLevel,
    handoverProtocol?.vehicleCondition?.odometer,
    handoverProtocol?.vehicleCondition?.fuelLevel,
    rental.allowedKilometers,
    rental.extraKilometerRate,
    rental.deposit,
    customKmRate,
    originalKmRate,
  ]);

  // Prepočítaj poplatky pri zmene
  useEffect(() => {
    calculateFees();
  }, [calculateFees]);

  // 🔧 NOVÉ: Funkcie pre editáciu ceny za km
  const handleStartEditKmRate = () => {
    setIsEditingKmRate(true);
    setCustomKmRate(
      customKmRate !== null ? customKmRate : rental.extraKilometerRate || 0.5
    );
  };

  const handleSaveKmRate = () => {
    setIsEditingKmRate(false);
    // customKmRate zostane nastavené a použije sa v calculateFees
  };

  const handleCancelEditKmRate = () => {
    setIsEditingKmRate(false);
    setCustomKmRate(null); // Vráti sa na cenníkovú sadzbu
  };

  const handleKmRateChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setCustomKmRate(numValue);
    }
  };

  // 🔧 NOVÉ: Parsovanie spôsobu úhrady depozitu z handoverProtocol notes
  const getDepositPaymentMethod = useCallback(() => {
    if (!handoverProtocol?.notes) return null;

    const notes = handoverProtocol.notes;
    const depositMatch = notes.match(/Spôsob úhrady depozitu:\s*(.+)/);

    if (depositMatch && depositMatch[1]) {
      const method = depositMatch[1].trim();
      switch (method) {
        case 'Hotovosť':
          return 'cash';
        case 'Bankový prevod':
          return 'bank_transfer';
        case 'Kartová zábezpeka':
          return 'card';
        default:
          return null;
      }
    }

    return null;
  }, [handoverProtocol?.notes]);

  // 🔧 NOVÉ: Formátovanie spôsobu úhrady depozitu pre zobrazenie
  const formatDepositPaymentMethod = useCallback((method: string | null) => {
    if (!method) return 'Neuvedené';

    switch (method) {
      case 'cash':
        return 'Hotovosť';
      case 'bank_transfer':
        return 'Bankový prevod';
      case 'card':
        return 'Kartová zábezpeka';
      default:
        return 'Neuvedené';
    }
  }, []);

  if (!open) return null;

  // Validácia handoverProtocol
  if (!handoverProtocol) {
    console.error('❌ ReturnProtocolForm: handoverProtocol is undefined');
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Chyba: Odovzdávací protokol nebol nájdený. Prosím, zatvorte a skúste
            to znovu.
          </AlertDescription>
        </Alert>
        <Button onClick={onClose} className="mt-4">
          Zatvoriť
        </Button>
      </div>
    );
  }

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoCaptureSuccess = (
    mediaType: string,
    images: ProtocolImage[],
    videos: ProtocolVideo[]
  ) => {
    setFormData(prev => ({
      ...prev,
      [`${mediaType}Images`]: images,
      [`${mediaType}Videos`]: videos,
    }));
    setActivePhotoCapture(null);
  };

  const handleAddSignature = (
    signerName: string,
    signerRole: 'customer' | 'employee'
  ) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      logger.debug('Adding signature:', { signerName, signerRole });
    }

    setCurrentSigner({ name: signerName, role: signerRole });
    setShowSignaturePad(true);
  };

  const handleSignatureSave = (signatureData: ProtocolSignature) => {
    setFormData(prev => ({
      ...prev,
      signatures: [...prev.signatures, signatureData],
    }));
    setShowSignaturePad(false);
    setCurrentSigner(null);
  };

  const handleRemoveSignature = (signatureId: string) => {
    setFormData(prev => ({
      ...prev,
      signatures: prev.signatures.filter(sig => sig.id !== signatureId),
    }));
  };

  // performSave funkcia bola nahradená React Query mutation v handleSave

  // Retry mechanism for failed requests

  const handleSave = async () => {
    // Validácia
    if (!formData.location) {
      setEmailStatus({
        status: 'error',
        message: '❌ Miesto vrátenia nie je vyplnené',
      });
      return;
    }

    try {
      setEmailStatus({
        status: 'pending',
        message: 'Odosielam protokol a email...',
      });

      // Vytvorenie protokolu podľa správnej ReturnProtocol štruktúry
      const protocol: ReturnProtocol = {
        id: uuidv4(),
        rentalId: rental.id,
        rental: rental,
        handoverProtocolId: handoverProtocol.id,
        handoverProtocol: handoverProtocol,
        type: 'return',
        status: 'completed',
        createdAt: new Date(),
        completedAt: new Date(),
        location: formData.location,
        vehicleCondition: {
          odometer: formData.odometer || 0,
          fuelLevel: formData.fuelLevel,
          fuelType: formData.fuelType,
          exteriorCondition: formData.exteriorCondition,
          interiorCondition: formData.interiorCondition,
          notes: formData.notes,
        },
        vehicleImages: formData.vehicleImages,
        documentImages: formData.documentImages,
        damageImages: formData.damageImages,
        vehicleVideos: formData.vehicleVideos,
        documentVideos: formData.documentVideos,
        damageVideos: formData.damageVideos,
        signatures: formData.signatures,
        damages: [],
        newDamages: [],
        // Kilometer calculations
        kilometersUsed: Math.max(
          0,
          (formData.odometer || 0) -
            (handoverProtocol?.vehicleCondition?.odometer || 0)
        ),
        kilometerOverage: Math.max(
          0,
          (formData.odometer || 0) -
            (handoverProtocol?.vehicleCondition?.odometer || 0) -
            (rental.allowedKilometers || 0)
        ),
        kilometerFee:
          (customKmRate || originalKmRate) *
          Math.max(
            0,
            (formData.odometer || 0) -
              (handoverProtocol?.vehicleCondition?.odometer || 0) -
              (rental.allowedKilometers || 0)
          ),
        // Fuel calculations
        fuelUsed: Math.max(
          0,
          (handoverProtocol?.vehicleCondition?.fuelLevel || 100) -
            formData.fuelLevel
        ),
        fuelFee: 0, // Bude vypočítané neskôr
        totalExtraFees:
          (customKmRate || originalKmRate) *
          Math.max(
            0,
            (formData.odometer || 0) -
              (handoverProtocol?.vehicleCondition?.odometer || 0) -
              (rental.allowedKilometers || 0)
          ),
        // Refund calculations
        depositRefund: rental.deposit || 0,
        additionalCharges: 0,
        finalRefund: rental.deposit || 0,
        // Rental data snapshot
        rentalData: {
          orderNumber: rental.orderNumber || '',
          vehicle: rental.vehicle || ({} as Vehicle),
          ...(rental.vehicleVin && { vehicleVin: rental.vehicleVin }),
          customer: rental.customer || ({} as Customer),
          startDate: rental.startDate as Date,
          endDate: rental.endDate as Date,
          totalPrice: rental.totalPrice,
          deposit: rental.deposit || 0,
          currency: 'EUR',
          allowedKilometers: rental.allowedKilometers || 0,
          extraKilometerRate: rental.extraKilometerRate || 0,
          ...(rental.returnConditions && {
            returnConditions: rental.returnConditions,
          }),
        },
        // Creator info
        createdBy: state.user
          ? `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim() ||
            state.user.username
          : 'admin',
      };

      // Použitie React Query mutation
      const result = await createReturnProtocol.mutateAsync(protocol);

      // Automatický refresh - NETREBA! React Query to spraví automaticky

      // Success callback
      onSave(protocol);

      // 📧 EMAIL STATUS: Spracovanie email response z backendu
      const responseData = result as
        | {
            success?: boolean;
            protocol?: ReturnProtocol;
            email?: { sent: boolean; recipient?: string; error?: string };
            pdfProxyUrl?: string;
          }
        | ReturnProtocol;

      const emailInfo =
        'email' in responseData ? responseData.email : undefined;

      // Update email status based on response
      if (emailInfo) {
        if (emailInfo.sent) {
          setEmailStatus({
            status: 'success',
            message: `✅ Protokol bol úspešne odoslaný na email ${emailInfo.recipient}`,
          });
        } else if (emailInfo.error) {
          setEmailStatus({
            status: 'error',
            message: `❌ Protokol bol uložený, ale email sa nepodarilo odoslať: ${emailInfo.error}`,
          });
        } else {
          setEmailStatus({
            status: 'warning',
            message: `⚠️ Protokol bol uložený, ale email sa nepodarilo odoslať`,
          });
        }
      } else {
        setEmailStatus({
          status: 'success',
          message: '✅ Protokol bol úspešne uložený',
        });
      }

      // Počkáme 4 sekundy pred zatvorením aby užívateľ videl email status
      window.setTimeout(() => {
        onClose();
      }, 4000);
    } catch (error) {
      console.error('❌ Error saving return protocol:', error);
      setEmailStatus({
        status: 'error',
        message: `❌ Chyba pri ukladaní protokolu: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  return (
    <div className="w-full max-w-full">
      {/* Email Status */}
      {(isLoading || emailStatus?.status === 'pending') && (
        <div className="mb-4">
          <Progress value={isLoading ? undefined : 100} className="h-2" />
          <p className="mt-2 text-sm text-center text-muted-foreground">
            {isLoading ? '⚡ Ukladám protokol...' : emailStatus?.message}
          </p>
        </div>
      )}

      {emailStatus && emailStatus.status !== 'pending' && (
        <Alert
          className={`mb-4 sticky top-0 z-[1000] ${
            emailStatus.status === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : emailStatus.status === 'warning'
                ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <AlertDescription>{emailStatus.message}</AlertDescription>
        </Alert>
      )}

      {/* React Query handles retries automatically */}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Preberací protokol - {rental.vehicle?.licensePlate || 'Vozidlo'}
          </h2>
          {(rental.vehicleVin || rental.vehicle?.vin) && (
            <p className="text-sm text-muted-foreground font-mono block mt-1">
              VIN: {rental.vehicleVin || rental.vehicle?.vin}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <Close className="h-5 w-5" />
        </Button>
      </div>

      {isLoading && (
        <div className="mb-4">
          <Progress value={undefined} className="h-2" />
          <p className="mt-2 text-sm text-muted-foreground">
            Ukladám protokol...
          </p>
        </div>
      )}

      {/* Info o preberacom protokole */}
      {handoverProtocol && (
        <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800">
          <AlertDescription>
            Navzäuje na odovzdávací protokol #
            {handoverProtocol.id?.slice(-8) || 'N/A'} z{' '}
            {handoverProtocol.createdAt
              ? new Date(handoverProtocol.createdAt).toLocaleString('sk-SK')
              : 'N/A'}
          </AlertDescription>
        </Alert>
      )}

      {/* Informácie o vozidle */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <DirectionsCar className="mr-2 h-5 w-5" />
            Informácie o vozidle
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">
                Značka a model
              </Label>
              <p className="font-bold text-foreground">
                {rental.vehicle?.brand} {rental.vehicle?.model}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">ŠPZ</Label>
              <Badge variant="outline" className="font-bold">
                {rental.vehicle?.licensePlate || 'Neuvedené'}
              </Badge>
            </div>
            {(rental.vehicleVin || rental.vehicle?.vin) && (
              <div>
                <Label className="text-sm text-muted-foreground">
                  VIN číslo
                </Label>
                <Badge
                  variant="outline"
                  className="font-bold font-mono text-xs"
                >
                  {rental.vehicleVin || rental.vehicle?.vin || 'Neuvedené'}
                </Badge>
              </div>
            )}
            <div>
              <Label className="text-sm text-muted-foreground">
                Stav vozidla
              </Label>
              <Badge
                variant="outline"
                className={`font-bold ${
                  rental.vehicle?.status === 'available'
                    ? 'border-green-500 text-green-700'
                    : 'border-yellow-500 text-yellow-700'
                }`}
              >
                {rental.vehicle?.status || 'available'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Základné informácie */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <LocationOn className="mr-2 h-5 w-5" />
            Základné informácie
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Miesto vrátenia *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) => handleInputChange('location', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) => handleInputChange('notes', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stav vozidla */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <SpeedOutlined className="mr-2 h-5 w-5" />
            Stav vozidla pri vrátení
          </h3>

          {handoverProtocol?.vehicleCondition && (
            <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-800">
              <AlertDescription>
                Pri preberaní:{' '}
                {handoverProtocol.vehicleCondition.odometer || 'N/A'} km,{' '}
                {handoverProtocol.vehicleCondition.fuelLevel || 'N/A'}% paliva
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="odometer">Aktuálny stav tachometra (km)</Label>
              <Input
                id="odometer"
                type="number"
                value={formData.odometer || ''}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) =>
                  handleInputChange(
                    'odometer',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelLevel">Úroveň paliva (%)</Label>
              <Input
                id="fuelLevel"
                type="number"
                value={formData.fuelLevel}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) =>
                  handleInputChange(
                    'fuelLevel',
                    parseInt(e.target.value) || 100
                  )
                }
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exteriorCondition">Stav exteriéru</Label>
              <Input
                id="exteriorCondition"
                value={formData.exteriorCondition}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) => handleInputChange('exteriorCondition', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interiorCondition">Stav interiéru</Label>
              <Input
                id="interiorCondition"
                value={formData.interiorCondition}
                onChange={(
                  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                ) => handleInputChange('interiorCondition', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🔧 NOVÉ: Moderný prepočet poplatkov s informáciami o depozite */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
            <Calculate className="mr-2 h-5 w-5" />
            Finančné vyúčtovanie
          </h3>

          {/* Informácie o depozite */}
          <div className="p-4 mb-6 bg-primary/10 rounded-lg border border-primary">
            <h4 className="text-base font-bold text-foreground mb-4">
              💰 Informácie o depozite
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Výška depozitu:</span>
                <span className="text-lg font-bold text-foreground">
                  {rental.deposit ? `${rental.deposit.toFixed(2)} €` : '0,00 €'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Spôsob úhrady:</span>
                <Badge
                  variant="outline"
                  className={`font-bold ${
                    getDepositPaymentMethod() === 'cash'
                      ? 'border-green-500 text-green-700'
                      : getDepositPaymentMethod() === 'bank_transfer'
                        ? 'border-blue-500 text-blue-700'
                        : 'border-gray-500 text-gray-700'
                  }`}
                >
                  {formatDepositPaymentMethod(getDepositPaymentMethod())}
                </Badge>
              </div>
            </div>
          </div>

          {/* Kilometre a palivo */}
          <div className="mb-6">
            <h4 className="text-base font-bold text-foreground mb-4">
              🚗 Kilometre a palivo
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Povolené km</p>
                <p className="text-lg font-bold text-blue-600">
                  {rental.allowedKilometers || 0}
                </p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Najazdené km</p>
                <p className="text-lg font-bold text-foreground">
                  {fees.kilometersUsed}
                </p>
              </div>
              <div
                className={`text-center p-2 rounded ${
                  fees.kilometerOverage > 0 ? 'bg-yellow-100' : 'bg-green-100'
                }`}
              >
                <p className="text-xs text-muted-foreground">Prekročenie km</p>
                <p className="text-lg font-bold text-foreground">
                  {fees.kilometerOverage}
                </p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">
                  Spotrebované palivo
                </p>
                <p className="text-lg font-bold text-foreground">
                  {fees.fuelUsed}%
                </p>
              </div>
            </div>
          </div>

          {/* Poplatky */}
          <div className="mb-6">
            <h4 className="text-base font-bold text-foreground mb-4">
              💸 Poplatky
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Poplatok za km
                  </span>
                  <Button
                    onClick={handleStartEditKmRate}
                    size="sm"
                    variant="ghost"
                    className={`h-6 w-6 p-0 ${
                      customKmRate !== null
                        ? 'bg-yellow-100 hover:bg-yellow-200'
                        : 'hover:bg-primary/10'
                    }`}
                    title="Upraviť cenu za km"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {fees.kilometerFee.toFixed(2)} €
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded">
                <span className="text-sm text-muted-foreground">
                  Poplatok za palivo
                </span>
                <span className="text-lg font-bold text-foreground">
                  {fees.fuelFee.toFixed(2)} €
                </span>
              </div>
            </div>

            {/* Editačné pole pre cenu za km */}
            {isEditingKmRate && (
              <div className="p-4 mt-4 border-2 border-yellow-500 rounded-lg bg-yellow-50">
                <h5 className="text-sm font-bold mb-2">
                  ⚠️ Úprava ceny za prekročené km
                </h5>
                <p className="text-sm text-muted-foreground mb-4">
                  Cenníková sadzba:{' '}
                  <strong>{originalKmRate.toFixed(2)} €/km</strong> • Prekročené
                  km: <strong>{fees.kilometerOverage} km</strong>
                </p>
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="customKmRate">Nová cena za km (€)</Label>
                    <Input
                      id="customKmRate"
                      type="number"
                      value={customKmRate || ''}
                      onChange={(
                        e: React.ChangeEvent<
                          HTMLInputElement | HTMLTextAreaElement
                        >
                      ) => handleKmRateChange(e.target.value)}
                      min={0}
                      step={0.01}
                      className="w-36 text-center"
                    />
                  </div>
                  <Button
                    onClick={handleSaveKmRate}
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    title="Uložiť"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={handleCancelEditKmRate}
                    size="sm"
                    variant="destructive"
                    title="Zrušiť"
                  >
                    <Cancel className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Finálne vyúčtovanie */}
          <div>
            <h4 className="text-base font-bold text-foreground mb-4">
              🏁 Finálne vyúčtovanie
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-100 rounded-lg border-2 border-red-500">
                <p className="text-xs text-muted-foreground">
                  Celkové poplatky
                </p>
                <p className="text-xl font-bold text-foreground">
                  {fees.totalExtraFees.toFixed(2)} €
                </p>
              </div>
              <div className="text-center p-4 bg-green-100 rounded-lg border-2 border-green-500">
                <p className="text-xs text-muted-foreground">
                  Vratenie z depozitu
                </p>
                <p className="text-xl font-bold text-foreground">
                  {fees.depositRefund.toFixed(2)} €
                </p>
              </div>
              <div
                className={`text-center p-4 rounded-lg border-2 ${
                  fees.finalRefund > 0
                    ? 'bg-green-100 border-green-500'
                    : fees.additionalCharges > 0
                      ? 'bg-red-100 border-red-500'
                      : 'bg-gray-100 border-gray-300'
                }`}
              >
                <p className="text-xs text-muted-foreground">
                  {fees.finalRefund > 0 ? 'Finálny refund' : 'Doplatok'}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {fees.finalRefund > 0
                    ? fees.finalRefund.toFixed(2)
                    : fees.additionalCharges.toFixed(2)}{' '}
                  €
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fotky */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <PhotoCamera className="mr-2 h-5 w-5" />
            Fotodokumentácia
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => setActivePhotoCapture('vehicle')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <PhotoCamera className="h-5 w-5" />
              <span>Fotky vozidla ({formData.vehicleImages.length})</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActivePhotoCapture('document')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <PhotoCamera className="h-5 w-5" />
              <span>Dokumenty ({formData.documentImages.length})</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActivePhotoCapture('damage')}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <PhotoCamera className="h-5 w-5" />
              <span>Poškodenia ({formData.damageImages.length})</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ✍️ ELEKTRONICKÉ PODPISY */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            ✍️ Elektronické podpisy s časovou pečiatkou
          </h3>

          {/* Existujúce podpisy */}
          {formData.signatures.length > 0 && (
            <div className="mb-4 space-y-2">
              {formData.signatures.map(signature => (
                <Card key={signature.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={signature.signature}
                        alt={`Podpis ${signature.signerName}`}
                        className="w-30 h-15 border border-gray-300 rounded object-contain"
                      />
                      <div>
                        <p className="font-semibold text-sm">
                          {signature.signerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {signature.signerRole === 'customer'
                            ? 'Zákazník'
                            : 'Zamestnanec'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          📅{' '}
                          {new Date(signature.timestamp).toLocaleString(
                            'sk-SK'
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground block">
                          📍 {signature.location}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRemoveSignature(signature.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Close className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Tlačidlá pre pridanie podpisov */}
          <div className="flex gap-4 flex-wrap">
            <Button
              variant="outline"
              onClick={() =>
                handleAddSignature(
                  rental.customer?.name || rental.customerName || 'Zákazník',
                  'customer'
                )
              }
              className="flex items-center gap-2"
            >
              <Person className="h-4 w-4" />
              Podpis zákazníka
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                handleAddSignature(
                  `${state.user?.firstName || ''} ${state.user?.lastName || ''}`.trim() ||
                    'Zamestnanec',
                  'employee'
                )
              }
              className="flex items-center gap-2"
            >
              <Person className="h-4 w-4" />
              Podpis zamestnanca
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tlačidlá */}
      <div className="flex gap-4 justify-end mt-6">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Zrušiť
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ukladám...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Uložiť protokol
            </>
          )}
        </Button>
      </div>

      {/* Photo capture modal - MODERN SYSTEM */}
      {activePhotoCapture && (
        <ModernPhotoCapture
          open={true}
          onClose={() => setActivePhotoCapture(null)}
          onSave={(images, videos) =>
            handlePhotoCaptureSuccess(activePhotoCapture, images, videos)
          }
          title={`Fotky - ${activePhotoCapture}`}
          entityId={rental.id}
          protocolType="return"
          mediaType={activePhotoCapture as 'vehicle' | 'document' | 'damage'}
          maxImages={50}
        />
      )}

      {/* SignaturePad modal */}
      {showSignaturePad && currentSigner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setShowSignaturePad(false)}
              signerName={currentSigner.name}
              signerRole={currentSigner.role}
              location={formData.location}
            />
          </div>
        </div>
      )}
    </div>
  );
}
