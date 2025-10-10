/**
 * HandoverProtocolFormV2 - Vylepšená verzia odovzdávacieho protokolu
 * Používa V2 photo capture a queue systém
 */

import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  DirectionsCar,
  LocationOn,
  Person,
  PhotoCamera,
  Receipt,
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
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import * as uuid from 'uuid';
import { featureManager } from '../../../config/featureFlags';
import SignaturePad from '../../common/SignaturePad';
import {
  SerialPhotoCaptureV2,
  type QueueItem,
} from '../../common/v2/SerialPhotoCaptureV2';

export interface HandoverProtocolDataV2 {
  protocolId: string;
  vehicleId: string;
  customerId: string;
  rentalId: string;

  // Vehicle info
  vehicle: {
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    vin?: string;
    status?: string;
  };

  // Customer info
  customer: {
    firstName: string;
    lastName: string;
    name?: string; // Unified name field for V1 compatibility
    email: string;
    phone?: string;
    address?: string;
  };

  // Rental details - rozšírené pre V1 kompatibilitu
  rental: {
    orderNumber?: string;
    startDate: Date;
    endDate: Date;
    startKm: number;
    location: string;
    pricePerDay: number;
    totalPrice: number;
    deposit?: number;
    allowedKilometers?: number;
    extraKilometerRate?: number;
    pickupLocation?: string;
    returnLocation?: string;
  };

  // Protocol specific
  fuelLevel: number;
  odometer?: number; // V1 compatibility - stav tachometra
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  depositPaymentMethod?: 'cash' | 'bank_transfer' | 'card'; // V1 compatibility
  damages: Array<{
    id: string;
    description: string;
    severity: 'minor' | 'moderate' | 'major';
    location: string;
  }>;
  notes?: string;

  // Signatures - rozšírené pre V1 kompatibilitu
  signatures: Array<{
    id: string;
    signerName: string;
    signerRole: 'customer' | 'employee';
    signatureData: string;
    timestamp: Date;
    location?: string;
  }>;

  // Photos - rozšírené pre V1 kompatibilitu (5 kategórií)
  vehicleImages: Array<{
    id: string;
    url: string;
    type: string;
    mediaType: string;
    description?: string;
    timestamp: Date;
  }>;
  documentImages: Array<{
    id: string;
    url: string;
    type: string;
    mediaType: string;
    description?: string;
    timestamp: Date;
  }>;
  damageImages: Array<{
    id: string;
    url: string;
    type: string;
    mediaType: string;
    description?: string;
    timestamp: Date;
  }>;
  odometerImages: Array<{
    id: string;
    url: string;
    type: string;
    mediaType: string;
    description?: string;
    timestamp: Date;
  }>;
  fuelImages: Array<{
    id: string;
    url: string;
    type: string;
    mediaType: string;
    description?: string;
    timestamp: Date;
  }>;

  // V2 specific photos (zachované pre spätnosť)
  photos: Array<{
    photoId: string;
    description: string;
    category: 'exterior' | 'interior' | 'damage' | 'fuel' | 'other';
    urls?: {
      original?: string;
      thumb?: string;
      gallery?: string;
      pdf?: string;
    };
  }>;
}

interface Props {
  initialData?: Partial<HandoverProtocolDataV2>;
  onSubmit: (data: HandoverProtocolDataV2) => Promise<void>;
  onCancel?: () => void;
  userId?: string;
  disabled?: boolean;
}

export const HandoverProtocolFormV2: React.FC<Props> = ({
  initialData,
  onSubmit,
  onCancel,
  userId,
  disabled = false,
}) => {
  const [protocolData, setProtocolData] = useState<HandoverProtocolDataV2>(
    () => ({
      protocolId: initialData?.protocolId || uuid.v4(),
      vehicleId: initialData?.vehicleId || '',
      customerId: initialData?.customerId || '',
      rentalId: initialData?.rentalId || '',
      vehicle: initialData?.vehicle || {
        licensePlate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        status: 'available',
      },
      customer: initialData?.customer || {
        firstName: '',
        lastName: '',
        name: '',
        email: '',
        phone: '',
        address: '',
      },
      rental: initialData?.rental || {
        orderNumber: '',
        startDate: new Date(),
        endDate: new Date(),
        startKm: 0,
        location: '',
        pricePerDay: 0,
        totalPrice: 0,
        deposit: 0,
        allowedKilometers: 0,
        extraKilometerRate: 0.5,
        pickupLocation: '',
        returnLocation: '',
      },
      fuelLevel: initialData?.fuelLevel || 100,
      odometer: initialData?.odometer || 0,
      condition: initialData?.condition || 'excellent',
      depositPaymentMethod: initialData?.depositPaymentMethod || 'cash',
      damages: initialData?.damages || [],
      notes: initialData?.notes || '',
      signatures: initialData?.signatures || [],
      vehicleImages: initialData?.vehicleImages || [],
      documentImages: initialData?.documentImages || [],
      damageImages: initialData?.damageImages || [],
      odometerImages: initialData?.odometerImages || [],
      fuelImages: initialData?.fuelImages || [],
      photos: initialData?.photos || [],
    })
  );

  const [isV2Enabled, setIsV2Enabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<QueueItem[]>([]);

  // V1 compatibility states
  const [loading] = useState(false);
  const [emailStatus] = useState<{
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

  // Check feature flag
  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        const enabled = await featureManager.isEnabled(
          'PROTOCOL_V2_ENABLED',
          userId
        );
        setIsV2Enabled(enabled);
      } catch (error) {
        console.error('Failed to check V2 feature flag:', error);
        setIsV2Enabled(false);
      }
    };

    checkFeatureFlag();
  }, [userId]);

  /**
   * Handle photo upload completion
   */
  const handlePhotoUploadComplete = useCallback(
    (photoId: string, urls: QueueItem['urls']) => {
      setProtocolData(prev => ({
        ...prev,
        photos: prev.photos.map(photo =>
          photo.photoId === photoId ? { ...photo, urls } : photo
        ),
      }));
    },
    []
  );

  /**
   * Handle photos change from capture component
   */
  const handlePhotosChange = useCallback((photos: QueueItem[]) => {
    setUploadedPhotos(photos);

    // Sync with protocol data
    const photoEntries = photos
      .filter(p => p.photoId)
      .map(p => ({
        photoId: p.photoId!,
        description: `Fotografia ${p.file.name}`,
        category: 'other' as const,
        urls: p.urls,
      }));

    setProtocolData(prev => ({
      ...prev,
      photos: photoEntries,
    }));
  }, []);

  /**
   * V1 compatibility - Handle photo capture
   */
  const handlePhotoCapture = useCallback((mediaType: string) => {
    setActivePhotoCapture(mediaType);
  }, []);

  /**
   * V1 compatibility - Handle photo capture success
   */
  // const handlePhotoCaptureSuccess = useCallback(
  //   (mediaType: string, images: unknown[], videos: unknown[]) => {
  //     setProtocolData(prev => ({
  //       ...prev,
  //       [`${mediaType}Images`]: images,
  //       [`${mediaType}Videos`]: videos || [],
  //     }));
  //     setActivePhotoCapture(null);
  //   },
  //   []
  // );

  /**
   * V1 compatibility - Handle signature addition
   */
  const handleAddSignature = useCallback(
    (signerName: string, signerRole: 'customer' | 'employee') => {
      setCurrentSigner({ name: signerName, role: signerRole });
      setShowSignaturePad(true);
    },
    []
  );

  /**
   * V1 compatibility - Handle signature save
   */
  const handleSignatureSave = useCallback(
    (signatureData: {
      signerName: string;
      signerRole: 'customer' | 'employee';
      signature: string;
    }) => {
      const newSignature = {
        id: uuid.v4(),
        signerName: signatureData.signerName,
        signerRole: signatureData.signerRole,
        signatureData: signatureData.signature,
        timestamp: new Date(),
        location: protocolData.rental.location,
      };

      setProtocolData(prev => ({
        ...prev,
        signatures: [...prev.signatures, newSignature],
      }));
      setShowSignaturePad(false);
      setCurrentSigner(null);
    },
    [protocolData.rental.location]
  );

  /**
   * V1 compatibility - Handle signature removal
   */
  const handleRemoveSignature = useCallback((signatureId: string) => {
    setProtocolData(prev => ({
      ...prev,
      signatures: prev.signatures.filter(sig => sig.id !== signatureId),
    }));
  }, []);

  /**
   * Add damage record
   */
  const addDamage = useCallback(() => {
    const newDamage = {
      id: uuid.v4(),
      description: '',
      severity: 'minor' as const,
      location: '',
    };

    setProtocolData(prev => ({
      ...prev,
      damages: [...prev.damages, newDamage],
    }));
  }, []);

  /**
   * Remove damage record
   */
  const removeDamage = useCallback((damageId: string) => {
    setProtocolData(prev => ({
      ...prev,
      damages: prev.damages.filter(d => d.id !== damageId),
    }));
  }, []);

  /**
   * Update damage record
   */
  const updateDamage = useCallback(
    (
      damageId: string,
      updates: Partial<HandoverProtocolDataV2['damages'][0]>
    ) => {
      setProtocolData(prev => ({
        ...prev,
        damages: prev.damages.map(damage =>
          damage.id === damageId ? { ...damage, ...updates } : damage
        ),
      }));
    },
    []
  );

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // V1 kompatibilná validácia
      const errors: string[] = [];

      if (
        !protocolData.rental.location ||
        protocolData.rental.location.trim() === ''
      ) {
        errors.push('Zadajte miesto prevzatia');
      }

      if (
        protocolData.odometer === undefined ||
        protocolData.odometer === null ||
        protocolData.odometer < 0
      ) {
        errors.push('Zadajte stav tachometra');
      }

      if (
        protocolData.fuelLevel === undefined ||
        protocolData.fuelLevel === null ||
        protocolData.fuelLevel < 0 ||
        protocolData.fuelLevel > 100
      ) {
        errors.push('Zadajte stav paliva (0-100%)');
      }

      // Kontrola podpisov
      const customerSignature = protocolData.signatures.find(
        sig => sig.signerRole === 'customer'
      );
      const employeeSignature = protocolData.signatures.find(
        sig => sig.signerRole === 'employee'
      );

      if (!customerSignature) {
        errors.push('Povinný je podpis zákazníka');
      }

      if (!employeeSignature) {
        errors.push('Povinný je podpis zamestnanca');
      }

      if (!protocolData.depositPaymentMethod) {
        errors.push('Vyberte spôsob úhrady depozitu');
      }

      if (
        !protocolData.vehicle.licensePlate ||
        !protocolData.customer.firstName
      ) {
        errors.push('Vyplňte všetky povinné polia');
      }

      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }

      // Check že všetky fotografie sú spracované
      const pendingPhotos = uploadedPhotos.filter(
        p =>
          p.status === 'pending' ||
          p.status === 'uploading' ||
          p.status === 'processing'
      );

      if (pendingPhotos.length > 0) {
        throw new Error(
          `Čaká sa na spracovanie ${pendingPhotos.length} fotografií`
        );
      }

      // Submit protocol
      await onSubmit(protocolData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Neznáma chyba';
      setSubmitError(errorMessage);
      console.error('Protocol submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isV2Enabled) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Protocol V2 nie je povolený. Používa sa štandardný formulár.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Email Status */}
      {(loading || emailStatus?.status === 'pending') && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            {loading ? '⚡ Ukladám protokol...' : emailStatus?.message}
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

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" color="text.primary" sx={{ mb: 1 }}>
          Odovzdávací Protokol
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip
            label="V2 Queue Enabled"
            color="primary"
            size="small"
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            ID: {protocolData.protocolId}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        {/* Informácie o objednávke */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <UnifiedIcon name="receipt" sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informácie o objednávke
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Číslo objednávky"
                  value={protocolData.rental.orderNumber || ''}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      rental: { ...prev.rental, orderNumber: e.target.value },
                    }))
                  }
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Celková cena (€)"
                  type="number"
                  value={protocolData.rental.totalPrice}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental,
                        totalPrice: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Depozit (€)"
                  type="number"
                  value={protocolData.rental.deposit || 0}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental,
                        deposit: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Povolené kilometry"
                  type="number"
                  value={protocolData.rental.allowedKilometers || 0}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental,
                        allowedKilometers: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Cena za extra km (€)"
                  type="number"
                  inputProps={{ step: '0.1' }}
                  value={protocolData.rental.extraKilometerRate || 0.5}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental,
                        extraKilometerRate: parseFloat(e.target.value) || 0.5,
                      },
                    }))
                  }
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Miesto prevzatia"
                  value={protocolData.rental.pickupLocation || ''}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental,
                        pickupLocation: e.target.value,
                      },
                    }))
                  }
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Miesto vrátenia"
                  value={protocolData.rental.returnLocation || ''}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental,
                        returnLocation: e.target.value,
                      },
                    }))
                  }
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Informácie o zákazníkovi */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <UnifiedIcon name="user" sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informácie o zákazníkovi
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Meno *"
                  value={protocolData.customer.firstName}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        firstName: e.target.value,
                        name: `${e.target.value} ${prev.customer.lastName}`.trim(),
                      },
                    }))
                  }
                  fullWidth
                  required
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Priezvisko *"
                  value={protocolData.customer.lastName}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      customer: {
                        ...prev.customer,
                        lastName: e.target.value,
                        name: `${prev.customer.firstName} ${e.target.value}`.trim(),
                      },
                    }))
                  }
                  fullWidth
                  required
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Email *"
                  type="email"
                  value={protocolData.customer.email}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      customer: { ...prev.customer, email: e.target.value },
                    }))
                  }
                  fullWidth
                  required
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Telefón"
                  type="tel"
                  value={protocolData.customer.phone || ''}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      customer: { ...prev.customer, phone: e.target.value },
                    }))
                  }
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Adresa"
                  value={protocolData.customer.address || ''}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      customer: { ...prev.customer, address: e.target.value },
                    }))
                  }
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Informácie o vozidle */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <UnifiedIcon name="car" sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informácie o vozidle
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="ŠPZ *"
                  value={protocolData.vehicle.licensePlate}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      vehicle: {
                        ...prev.vehicle,
                        licensePlate: e.target.value,
                      },
                    }))
                  }
                  fullWidth
                  required
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Značka *"
                  value={protocolData.vehicle.brand}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      vehicle: { ...prev.vehicle, brand: e.target.value },
                    }))
                  }
                  fullWidth
                  required
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Model *"
                  value={protocolData.vehicle.model}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      vehicle: { ...prev.vehicle, model: e.target.value },
                    }))
                  }
                  fullWidth
                  required
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Rok výroby"
                  type="number"
                  value={protocolData.vehicle.year}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      vehicle: {
                        ...prev.vehicle,
                        year:
                          parseInt(e.target.value) || new Date().getFullYear(),
                      },
                    }))
                  }
                  inputProps={{
                    min: 1900,
                    max: new Date().getFullYear() + 1,
                  }}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  label="VIN číslo"
                  value={protocolData.vehicle.vin || ''}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      vehicle: { ...prev.vehicle, vin: e.target.value },
                    }))
                  }
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <FormControl fullWidth disabled={disabled}>
                  <InputLabel>Stav vozidla</InputLabel>
                  <Select
                    value={protocolData.vehicle.status || 'available'}
                    onChange={e =>
                      setProtocolData(prev => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, status: e.target.value },
                      }))
                    }
                    label="Stav vozidla"
                  >
                    <MenuItem value="available">Dostupné</MenuItem>
                    <MenuItem value="rented">Prenajatý</MenuItem>
                    <MenuItem value="maintenance">Údržba</MenuItem>
                    <MenuItem value="unavailable">Nedostupné</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Divider sx={{ my: 3 }} />

        {/* Údaje protokolu */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
              Údaje protokolu
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Miesto prevzatia *"
                  value={protocolData.rental.location}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      rental: { ...prev.rental, location: e.target.value },
                    }))
                  }
                  fullWidth
                  required
                  placeholder="Zadajte presné miesto prevzatia vozidla"
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Poznámky k protokolu"
                  value={protocolData.notes || ''}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Dodatočné poznámky k odovzdávaniu vozidla"
                  disabled={disabled}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Detaily prenájmu */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              Detaily prenájmu
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Začiatok prenájmu *"
                  type="datetime-local"
                  value={protocolData.rental.startDate
                    .toISOString()
                    .slice(0, 16)}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental,
                        startDate: new Date(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                  required
                  disabled={disabled}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Koniec prenájmu *"
                  type="datetime-local"
                  value={protocolData.rental.endDate.toISOString().slice(0, 16)}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      rental: {
                        ...prev.rental,
                        endDate: new Date(e.target.value),
                      },
                    }))
                  }
                  fullWidth
                  required
                  disabled={disabled}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Stav vozidla pri odovzdaní */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <UnifiedIcon name="speedOutlined" sx={{ mr: 1, verticalAlign: 'middle' }} />
              Stav vozidla pri odovzdaní
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Stav tachometra (km) *"
                  type="number"
                  value={protocolData.odometer || ''}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      odometer: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    }))
                  }
                  fullWidth
                  required
                  helperText="Aktuálny stav kilometrov na vozidle"
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Úroveň paliva (%)"
                  type="number"
                  value={protocolData.fuelLevel}
                  onChange={e =>
                    setProtocolData(prev => ({
                      ...prev,
                      fuelLevel: parseInt(e.target.value) || 100,
                    }))
                  }
                  inputProps={{ min: 0, max: 100 }}
                  fullWidth
                  required
                  helperText="Percentuálna úroveň paliva v nádrži"
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth required disabled={disabled}>
                  <InputLabel>Spôsob úhrady depozitu *</InputLabel>
                  <Select
                    value={protocolData.depositPaymentMethod || 'cash'}
                    onChange={e =>
                      setProtocolData(prev => ({
                        ...prev,
                        depositPaymentMethod: e.target.value as
                          | 'cash'
                          | 'bank_transfer'
                          | 'card',
                      }))
                    }
                    label="Spôsob úhrady depozitu *"
                  >
                    <MenuItem value="cash">Hotovosť</MenuItem>
                    <MenuItem value="bank_transfer">Bankový prevod</MenuItem>
                    <MenuItem value="card">Kartová zábezpeka</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={disabled}>
                  <InputLabel>Celkový stav</InputLabel>
                  <Select
                    value={protocolData.condition}
                    onChange={e =>
                      setProtocolData(prev => ({
                        ...prev,
                        condition: e.target
                          .value as HandoverProtocolDataV2['condition'],
                      }))
                    }
                    label="Celkový stav"
                  >
                    <MenuItem value="excellent">Výborný</MenuItem>
                    <MenuItem value="good">Dobrý</MenuItem>
                    <MenuItem value="fair">Priemerný</MenuItem>
                    <MenuItem value="poor">Zlý</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Poškodenia */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">Poškodenia</Typography>
              <Button
                variant="outlined"
                onClick={addDamage}
                disabled={disabled}
                size="small"
              >
                Pridať poškodenie
              </Button>
            </Box>

            {protocolData.damages.map(damage => (
              <Card key={damage.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Popis"
                        value={damage.description}
                        onChange={e =>
                          updateDamage(damage.id, {
                            description: e.target.value,
                          })
                        }
                        fullWidth
                        disabled={disabled}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth disabled={disabled}>
                        <InputLabel>Závažnosť</InputLabel>
                        <Select
                          value={damage.severity}
                          onChange={e =>
                            updateDamage(damage.id, {
                              severity: e.target
                                .value as typeof damage.severity,
                            })
                          }
                          label="Závažnosť"
                        >
                          <MenuItem value="minor">Malé</MenuItem>
                          <MenuItem value="moderate">Stredné</MenuItem>
                          <MenuItem value="major">Veľké</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Lokácia"
                        value={damage.location}
                        onChange={e =>
                          updateDamage(damage.id, { location: e.target.value })
                        }
                        fullWidth
                        disabled={disabled}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => removeDamage(damage.id)}
                        disabled={disabled}
                        size="small"
                        sx={{ minWidth: 'auto', p: 1 }}
                      >
                        ×
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            {protocolData.damages.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Žiadne poškodenia nezaznamenané
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Fotodokumentácia - V1 štýl s 5 kategóriami */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
              Fotodokumentácia
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => handlePhotoCapture('vehicle')}
                  fullWidth
                  size="large"
                  disabled={disabled}
                >
                  Fotky vozidla ({protocolData.vehicleImages.length})
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => handlePhotoCapture('document')}
                  fullWidth
                  size="large"
                  disabled={disabled}
                >
                  Dokumenty ({protocolData.documentImages.length})
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => handlePhotoCapture('damage')}
                  fullWidth
                  size="large"
                  disabled={disabled}
                >
                  Poškodenia ({protocolData.damageImages.length})
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => handlePhotoCapture('odometer')}
                  fullWidth
                  size="large"
                  disabled={disabled}
                >
                  Fotka km ({protocolData.odometerImages.length})
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => handlePhotoCapture('fuel')}
                  fullWidth
                  size="large"
                  disabled={disabled}
                >
                  Fotka paliva ({protocolData.fuelImages.length})
                </Button>
              </Grid>
            </Grid>

            {/* V2 Queue Info */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ✨ V2 Queue: Fotografie sa spracúvajú na pozadí pre lepší výkon
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Elektronické podpisy s časovou pečiatkou - V1 štýl */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              ✍️ Elektronické podpisy s časovou pečiatkou
            </Typography>

            {/* Existujúce podpisy */}
            {protocolData.signatures.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {protocolData.signatures.map(signature => (
                  <Chip
                    key={signature.id}
                    label={`${signature.signerName} (${signature.signerRole === 'customer' ? 'Zákazník' : 'Zamestnanec'})`}
                    onDelete={() => handleRemoveSignature(signature.id)}
                    color={
                      signature.signerRole === 'customer'
                        ? 'primary'
                        : 'secondary'
                    }
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}

            {/* Tlačidlá pre pridanie podpisov */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleAddSignature(
                      `${protocolData.customer.firstName} ${protocolData.customer.lastName}`.trim() ||
                        'Zákazník',
                      'customer'
                    )
                  }
                  startIcon={<UnifiedIcon name="user" />}
                  color={
                    protocolData.signatures.find(
                      sig => sig.signerRole === 'customer'
                    )
                      ? 'success'
                      : 'primary'
                  }
                  fullWidth
                  disabled={disabled}
                >
                  Podpis zákazníka *
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleAddSignature('Zamestnanec BlackRent', 'employee')
                  }
                  startIcon={<UnifiedIcon name="user" />}
                  color={
                    protocolData.signatures.find(
                      sig => sig.signerRole === 'employee'
                    )
                      ? 'success'
                      : 'primary'
                  }
                  fullWidth
                  disabled={disabled}
                >
                  Podpis zamestnanca *
                </Button>
              </Grid>
            </Grid>

            {/* Indikátor povinných podpisov */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                * Povinné polia - musia byť vyplnené pred uložením protokolu
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Submit Error */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              Chyba pri ukladaní protokolu
            </Typography>
            <Typography variant="body2">{submitError}</Typography>
          </Alert>
        )}

        {/* Submit Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            mt: 3,
            mb: 2,
            pt: 3,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting || loading}
            >
              Zrušiť
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            startIcon={<UnifiedIcon name="save" />}
            disabled={isSubmitting || disabled || loading}
            sx={{
              minWidth: 200,
            }}
          >
            {isSubmitting || loading ? 'Ukladám...' : 'Uložiť a generovať PDF'}
          </Button>
        </Box>

        {/* Upload Progress Info */}
        {uploadedPhotos.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Fotografie:{' '}
              {uploadedPhotos.filter(p => p.status === 'completed').length}/
              {uploadedPhotos.length}
              {uploadedPhotos.some(p => p.status === 'processing') && (
                <Chip
                  label="⏳ Spracovávam..."
                  color="info"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
              {uploadedPhotos.some(p => p.status === 'failed') && (
                <Chip
                  label={`❌ ${uploadedPhotos.filter(p => p.status === 'failed').length} chýb`}
                  color="error"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </Box>
        )}
      </form>

      {/* Photo capture modal - V1 compatibility */}
      {activePhotoCapture && (
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
              maxWidth: 800,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <SerialPhotoCaptureV2
              protocolId={protocolData.protocolId}
              onPhotosChange={handlePhotosChange}
              onUploadComplete={handlePhotoUploadComplete}
              maxPhotos={20}
              userId={userId}
              disabled={disabled}
            />
            <Box sx={{ p: 2, textAlign: 'right' }}>
              <Button
                variant="outlined"
                onClick={() => setActivePhotoCapture(null)}
              >
                Zavrieť
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* SignaturePad modal - V1 compatibility */}
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
              location={protocolData.rental.location}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
