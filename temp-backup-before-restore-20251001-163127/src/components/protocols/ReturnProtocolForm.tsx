import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  Calculate,
  Cancel,
  Check,
  Close,
  DirectionsCar,
  Edit,
  LocationOn,
  Person,
  PhotoCamera,
  Save,
  SpeedOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  // CircularProgress, // REMOVED - not needed with React Query
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
import SignaturePad from '../common/SignaturePad';

interface ReturnProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  handoverProtocol: HandoverProtocol;
  onSave: (protocol: ReturnProtocol) => void;
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

    if (depositMatch) {
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Chyba: Odovzdávací protokol nebol nájdený. Prosím, zatvorte a skúste
          to znovu.
        </Alert>
        <Button onClick={onClose} sx={{ mt: 2 }}>
          Zatvoriť
        </Button>
      </Box>
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
      console.log('Adding signature:', { signerName, signerRole });
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
          vehicleVin: rental.vehicleVin,
          customer: rental.customer || ({} as Customer),
          startDate: rental.startDate as Date,
          endDate: rental.endDate as Date,
          totalPrice: rental.totalPrice,
          deposit: rental.deposit || 0,
          currency: 'EUR',
          allowedKilometers: rental.allowedKilometers || 0,
          extraKilometerRate: rental.extraKilometerRate || 0,
          returnConditions: rental.returnConditions,
        },
        // Creator info
        createdBy: state.user
          ? `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim() ||
            state.user.username
          : 'admin',
      };

      // Použitie React Query mutation
      await createReturnProtocol.mutateAsync(protocol);

      // Automatický refresh - NETREBA! React Query to spraví automaticky

      // Success callback
      onSave(protocol);

      setEmailStatus({
        status: 'success',
        message: '✅ Protokol bol úspešne uložený',
      });

      // Počkáme 2 sekundy pred zatvorením
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('❌ Error saving return protocol:', error);
      setEmailStatus({
        status: 'error',
        message: `❌ Chyba pri ukladaní protokolu: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Email Status */}
      {(isLoading || emailStatus?.status === 'pending') && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            {isLoading ? '⚡ Ukladám protokol...' : emailStatus?.message}
          </Typography>
        </Box>
      )}

      {emailStatus && emailStatus.status !== 'pending' && (
        <Alert
          severity={
            emailStatus.status === 'success'
              ? 'success'
              : emailStatus.status === 'warning'
                ? 'warning'
                : 'error'
          }
          sx={{
            mb: 2,
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-in',
          }}
        >
          {emailStatus.message}
        </Alert>
      )}

      {/* React Query handles retries automatically */}

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" color="text.primary">
            Preberací protokol - {rental.vehicle?.licensePlate || 'Vozidlo'}
          </Typography>
          {(rental.vehicleVin || rental.vehicle?.vin) && (
            <Typography
              variant="caption"
              sx={{
                color: '#888',
                fontFamily: 'monospace',
                display: 'block',
              }}
            >
              VIN: {rental.vehicleVin || rental.vehicle?.vin}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="large">
          <UnifiedIcon name="close" />
        </IconButton>
      </Box>

      {isLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Ukladám protokol...
          </Typography>
        </Box>
      )}

      {/* Info o preberacom protokole */}
      {handoverProtocol && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Navzäuje na odovzdávací protokol #
          {handoverProtocol.id?.slice(-8) || 'N/A'} z{' '}
          {handoverProtocol.createdAt
            ? new Date(handoverProtocol.createdAt).toLocaleString('sk-SK')
            : 'N/A'}
        </Alert>
      )}

      {/* Informácie o vozidle */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <UnifiedIcon name="car" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Informácie o vozidle
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Značka a model
              </Typography>
              <Typography
                variant="body1"
                color="text.primary"
                sx={{ fontWeight: 'bold' }}
              >
                {rental.vehicle?.brand} {rental.vehicle?.model}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                ŠPZ
              </Typography>
              <Chip
                label={rental.vehicle?.licensePlate || 'Neuvedené'}
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            </Grid>
            {(rental.vehicleVin || rental.vehicle?.vin) && (
              <Grid item xs={12} sm={6} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  VIN číslo
                </Typography>
                <Chip
                  label={
                    rental.vehicleVin || rental.vehicle?.vin || 'Neuvedené'
                  }
                  color="default"
                  variant="outlined"
                  sx={{
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Stav vozidla
              </Typography>
              <Chip
                label={rental.vehicle?.status || 'available'}
                color={
                  rental.vehicle?.status === 'available' ? 'success' : 'warning'
                }
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Základné informácie */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
            Základné informácie
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 2,
            }}
          >
            <TextField
              label="Miesto vrátenia *"
              value={formData.location}
              onChange={e => handleInputChange('location', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Poznámky"
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Stav vozidla */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <UnifiedIcon name="speedOutlined" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Stav vozidla pri vrátení
          </Typography>

          {handoverProtocol?.vehicleCondition && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Pri preberaní:{' '}
              {handoverProtocol.vehicleCondition.odometer || 'N/A'} km,{' '}
              {handoverProtocol.vehicleCondition.fuelLevel || 'N/A'}% paliva
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
            }}
          >
            <TextField
              label="Aktuálny stav tachometra (km)"
              type="number"
              value={formData.odometer || ''}
              onChange={e =>
                handleInputChange(
                  'odometer',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              fullWidth
            />
            <TextField
              label="Úroveň paliva (%)"
              type="number"
              value={formData.fuelLevel}
              onChange={e =>
                handleInputChange('fuelLevel', parseInt(e.target.value) || 100)
              }
              inputProps={{ min: 0, max: 100 }}
              fullWidth
            />
            <TextField
              label="Stav exteriéru"
              value={formData.exteriorCondition}
              onChange={e =>
                handleInputChange('exteriorCondition', e.target.value)
              }
              fullWidth
            />
            <TextField
              label="Stav interiéru"
              value={formData.interiorCondition}
              onChange={e =>
                handleInputChange('interiorCondition', e.target.value)
              }
              fullWidth
            />
          </Box>
        </CardContent>
      </Card>

      {/* 🔧 NOVÉ: Moderný prepočet poplatkov s informáciami o depozite */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 3 }}>
            <UnifiedIcon name="calculate" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Finančné vyúčtovanie
          </Typography>

          {/* Informácie o depozite */}
          <Box
            sx={{
              p: 2,
              mb: 3,
              bgcolor: 'primary.light',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'primary.main',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}
            >
              💰 Informácie o depozite
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.primary">
                    Výška depozitu:
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.primary"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {rental.deposit
                      ? `${rental.deposit.toFixed(2)} €`
                      : '0,00 €'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.primary">
                    Spôsob úhrady:
                  </Typography>
                  <Chip
                    label={formatDepositPaymentMethod(
                      getDepositPaymentMethod()
                    )}
                    color={
                      getDepositPaymentMethod() === 'cash'
                        ? 'success'
                        : getDepositPaymentMethod() === 'bank_transfer'
                          ? 'primary'
                          : 'secondary'
                    }
                    size="small"
                    sx={{
                      fontWeight: 'bold',
                      color: 'text.primary',
                      '& .MuiChip-label': {
                        color: 'text.primary',
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Kilometre a palivo */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}
            >
              🚗 Kilometre a palivo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Povolené km
                  </Typography>
                  <Typography
                    variant="h6"
                    color="info.main"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {rental.allowedKilometers || 0}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Najazdené km
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.primary"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {fees.kilometersUsed}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 1,
                    bgcolor:
                      fees.kilometerOverage > 0
                        ? 'warning.light'
                        : 'success.light',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Prekročenie km
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.primary"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {fees.kilometerOverage}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Spotrebované palivo
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.primary"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {fees.fuelUsed}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Poplatky */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}
            >
              💸 Poplatky
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Poplatok za km
                    </Typography>
                    <IconButton
                      onClick={handleStartEditKmRate}
                      size="small"
                      color="primary"
                      title="Upraviť cenu za km"
                      sx={{
                        minWidth: 24,
                        height: 24,
                        bgcolor:
                          customKmRate !== null
                            ? 'warning.light'
                            : 'transparent',
                        '&:hover': { bgcolor: 'primary.light' },
                      }}
                    >
                      <UnifiedIcon name="edit" fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography
                    variant="h6"
                    color="text.primary"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {fees.kilometerFee.toFixed(2)} €
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Poplatok za palivo
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.primary"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {fees.fuelFee.toFixed(2)} €
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Editačné pole pre cenu za km */}
            {isEditingKmRate && (
              <Box
                sx={{
                  p: 2,
                  mt: 2,
                  border: '2px solid',
                  borderColor: 'warning.main',
                  borderRadius: 2,
                  bgcolor: 'warning.light',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 'bold' }}
                >
                  ⚠️ Úprava ceny za prekročené km
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 2, color: 'text.secondary' }}
                >
                  Cenníková sadzba:{' '}
                  <strong>{originalKmRate.toFixed(2)} €/km</strong> • Prekročené
                  km: <strong>{fees.kilometerOverage} km</strong>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    label="Nová cena za km (€)"
                    type="number"
                    value={customKmRate || ''}
                    onChange={e => handleKmRateChange(e.target.value)}
                    inputProps={{
                      min: 0,
                      step: 0.01,
                      style: { textAlign: 'center' },
                    }}
                    size="small"
                    sx={{ width: 150 }}
                  />
                  <IconButton
                    onClick={handleSaveKmRate}
                    size="small"
                    color="success"
                    title="Uložiť"
                  >
                    <Check fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={handleCancelEditKmRate}
                    size="small"
                    color="error"
                    title="Zrušiť"
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Box>

          {/* Finálne vyúčtovanie */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}
            >
              🏁 Finálne vyúčtovanie
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    bgcolor: 'error.light',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'error.main',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Celkové poplatky
                  </Typography>
                  <Typography
                    variant="h5"
                    color="text.primary"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {fees.totalExtraFees.toFixed(2)} €
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    bgcolor: 'success.light',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'success.main',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Vratenie z depozitu
                  </Typography>
                  <Typography
                    variant="h5"
                    color="text.primary"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {fees.depositRefund.toFixed(2)} €
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    bgcolor:
                      fees.finalRefund > 0
                        ? 'success.light'
                        : fees.additionalCharges > 0
                          ? 'error.light'
                          : 'grey.100',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor:
                      fees.finalRefund > 0
                        ? 'success.main'
                        : fees.additionalCharges > 0
                          ? 'error.main'
                          : 'grey.300',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {fees.finalRefund > 0 ? 'Finálny refund' : 'Doplatok'}
                  </Typography>
                  <Typography
                    variant="h5"
                    color="text.primary"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {fees.finalRefund > 0
                      ? fees.finalRefund.toFixed(2)
                      : fees.additionalCharges.toFixed(2)}{' '}
                    €
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Fotky */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
            Fotodokumentácia
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => setActivePhotoCapture('vehicle')}
              size="large"
            >
              Fotky vozidla ({formData.vehicleImages.length})
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => setActivePhotoCapture('document')}
              size="large"
            >
              Dokumenty ({formData.documentImages.length})
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => setActivePhotoCapture('damage')}
              size="large"
            >
              Poškodenia ({formData.damageImages.length})
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ✍️ ELEKTRONICKÉ PODPISY */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            ✍️ Elektronické podpisy s časovou pečiatkou
          </Typography>

          {/* Existujúce podpisy */}
          {formData.signatures.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {formData.signatures.map(signature => (
                <Card
                  key={signature.id}
                  variant="outlined"
                  sx={{ mb: 1, p: 2 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        component="img"
                        src={signature.signature}
                        alt={`Podpis ${signature.signerName}`}
                        sx={{
                          width: 120,
                          height: 60,
                          border: '1px solid #ddd',
                          borderRadius: 1,
                          objectFit: 'contain',
                        }}
                      />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {signature.signerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {signature.signerRole === 'customer'
                            ? 'Zákazník'
                            : 'Zamestnanec'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📅{' '}
                          {new Date(signature.timestamp).toLocaleString(
                            'sk-SK'
                          )}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          📍 {signature.location}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      onClick={() => handleRemoveSignature(signature.id)}
                      color="error"
                      size="small"
                    >
                      <UnifiedIcon name="close" />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>
          )}

          {/* Tlačidlá pre pridanie podpisov */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() =>
                handleAddSignature(
                  rental.customer?.name || rental.customerName || 'Zákazník',
                  'customer'
                )
              }
              startIcon={<UnifiedIcon name="user" />}
            >
              Podpis zákazníka
            </Button>
            <Button
              variant="outlined"
              onClick={() =>
                handleAddSignature(
                  `${state.user?.firstName || ''} ${state.user?.lastName || ''}`.trim() ||
                    'Zamestnanec',
                  'employee'
                )
              }
              startIcon={<UnifiedIcon name="user" />}
            >
              Podpis zamestnanca
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tlačidlá */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="outlined" onClick={onClose} disabled={isLoading}>
          Zrušiť
        </Button>
        <Button
          variant="contained"
          startIcon={<UnifiedIcon name="save" />}
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'Ukladám...' : 'Uložiť protokol'}
        </Button>
      </Box>

      {/* Photo capture modal */}
      {activePhotoCapture && (
        <SerialPhotoCapture
          open={true}
          onClose={() => setActivePhotoCapture(null)}
          onSave={(images, videos) =>
            handlePhotoCaptureSuccess(activePhotoCapture, images, videos)
          }
          title={`Fotky - ${activePhotoCapture}`}
          allowedTypes={['vehicle', 'document', 'damage']}
          entityId={rental.id}
          protocolType="return"
          mediaType={activePhotoCapture as 'vehicle' | 'document' | 'damage'}
          category={(() => {
            // Mapovanie mediaType na R2 kategórie
            const mediaTypeToCategory = {
              vehicle: 'vehicle_photos',
              document: 'documents',
              damage: 'damages',
            } as const;
            return (
              mediaTypeToCategory[
                activePhotoCapture as keyof typeof mediaTypeToCategory
              ] || 'other'
            );
          })()}
        />
      )}

      {/* SignaturePad modal */}
      {showSignaturePad && currentSigner && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            p: 2,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setShowSignaturePad(false)}
              signerName={currentSigner.name}
              signerRole={currentSigner.role}
              location={formData.location}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
