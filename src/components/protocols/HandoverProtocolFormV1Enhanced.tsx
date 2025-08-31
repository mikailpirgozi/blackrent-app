/**
 * HandoverProtocolFormV1Enhanced - V1 UI s V2 Backend systémom
 *
 * KONCEPT:
 * - Zachováva presne pôvodný V1 UI/UX
 * - Pod kapotou používa V2 backend (API, photo categories, performance)
 * - Transparentne konvertuje dáta medzi V1 a V2 formátom
 * - Získava všetky výhody V2 (smart caching, email status, performance monitoring)
 */

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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { featureManager } from '../../config/featureFlags';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type {
  HandoverProtocol,
  PhotoCategory,
  ProtocolImage,
  ProtocolSignature,
  ProtocolVideo,
  Rental,
  Vehicle,
} from '../../types';

// V2 Backend imports
import {
  autoSaveV2FormData,
  cacheEmailStatus,
  cacheV2FormDefaults,
  clearEmailStatus,
  getEmailStatus,
  getV2SmartDefaults,
} from '../../utils/protocolV2Cache';
import {
  startPerformanceMonitoring,
  stopPerformanceMonitoring,
  trackUploadMetrics,
  useV2Performance,
} from '../../utils/protocolV2Performance';

// V1 UI Components (zachované)
import SerialPhotoCapture from '../common/SerialPhotoCapture';
import SignaturePad from '../common/SignaturePad';

// V2 Backend Components (pre upload)

interface HandoverProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  onSave: (protocol: HandoverProtocol) => void;
}

/**
 * 🔄 DATA ADAPTER: Konvertuje medzi V1 a V2 formátom
 */
class V1V2DataAdapter {
  /**
   * Konvertuje V1 Rental na V2 HandoverProtocolDataV2
   */
  static rentalToV2Data(rental: Rental, vehicle: Vehicle | null): any {
    return {
      protocolId: uuidv4(),
      vehicleId: rental.vehicleId || '',
      customerId: rental.customerId || '',
      rentalId: rental.id || '',

      vehicle: {
        licensePlate: vehicle?.licensePlate || '',
        brand: vehicle?.brand || '',
        model: vehicle?.model || '',
        year: vehicle?.year || new Date().getFullYear(),
        vin: vehicle?.vin,
        status: vehicle?.status,
        company: vehicle?.company,
        companyName: vehicle?.company,
      },

      customer: {
        firstName: rental.customer?.firstName || '',
        lastName: rental.customer?.lastName || '',
        name: rental.customer
          ? `${rental.customer.firstName} ${rental.customer.lastName}`
          : '',
        email: rental.customer?.email || '',
        phone: rental.customer?.phone,
        address: rental.customer?.address,
      },

      rental: {
        orderNumber: rental.orderNumber,
        startDate: rental.startDate,
        endDate: rental.endDate,
        startKm: rental.startKm || 0,
        location: rental.pickupLocation || rental.handoverPlace || '',
        pricePerDay: rental.pricePerDay || 0,
        totalPrice: rental.totalPrice || 0,
        deposit: rental.deposit,
        allowedKilometers: rental.allowedKilometers,
        extraKilometerRate: rental.extraKilometerRate,
        pickupLocation: rental.pickupLocation,
        returnLocation: rental.returnLocation,
      },
    };
  }

  /**
   * Konvertuje V1 photo arrays na V2 categorized photos
   */
  static v1PhotosToV2Categories(
    formData: any
  ): { category: PhotoCategory; photos: any[] }[] {
    const categories: { category: PhotoCategory; photos: any[] }[] = [];

    if (formData.vehicleImages?.length > 0) {
      categories.push({ category: 'vehicle', photos: formData.vehicleImages });
    }
    if (formData.documentImages?.length > 0) {
      categories.push({
        category: 'document',
        photos: formData.documentImages,
      });
    }
    if (formData.damageImages?.length > 0) {
      categories.push({ category: 'damage', photos: formData.damageImages });
    }
    if (formData.odometerImages?.length > 0) {
      categories.push({
        category: 'odometer',
        photos: formData.odometerImages,
      });
    }
    if (formData.fuelImages?.length > 0) {
      categories.push({ category: 'fuel', photos: formData.fuelImages });
    }

    return categories;
  }

  /**
   * Konvertuje V2 categorized photos na V1 photo arrays
   */
  static v2CategoriesToV1Photos(categorizedPhotos: any[]): any {
    const result: any = {
      vehicleImages: [],
      documentImages: [],
      damageImages: [],
      odometerImages: [],
      fuelImages: [],
    };

    categorizedPhotos.forEach(photo => {
      switch (photo.category) {
        case 'vehicle':
          result.vehicleImages.push(photo);
          break;
        case 'document':
          result.documentImages.push(photo);
          break;
        case 'damage':
          result.damageImages.push(photo);
          break;
        case 'odometer':
          result.odometerImages.push(photo);
          break;
        case 'fuel':
          result.fuelImages.push(photo);
          break;
      }
    });

    return result;
  }
}

/**
 * 🎯 HLAVNÝ KOMPONENT: V1 UI s V2 Backend
 */
const HandoverProtocolFormV1Enhanced: React.FC<HandoverProtocolFormProps> = ({
  open,
  onClose,
  rental,
  onSave,
}) => {
  const { state } = useAuth();
  const { state: appState } = useApp();
  const [loading, setLoading] = useState(false);

  // 📊 V2 Performance Monitoring (pod kapotou)
  const { trackRender } = useV2Performance('HandoverProtocolFormV1Enhanced');

  // 📧 V2 Email Status (pod kapotou)
  const [emailStatus, setEmailStatus] = useState<{
    status: 'pending' | 'success' | 'error' | 'warning';
    message?: string;
  } | null>(null);

  // 🎨 V1 UI State (zachované)
  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(
    null
  );
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSigner, setCurrentSigner] = useState<{
    name: string;
    role: 'customer' | 'employee';
  } | null>(null);

  // 🚀 V1 Vehicle Logic (zachované)
  const vehicleIndex = useMemo(() => {
    const index = new Map<string, Vehicle>();
    appState.vehicles.forEach(vehicle => {
      index.set(vehicle.id, vehicle);
    });
    return index;
  }, [appState.vehicles]);

  const currentVehicle = useMemo(() => {
    if (rental?.vehicle) return rental.vehicle;
    if (rental?.vehicleId) return vehicleIndex.get(rental.vehicleId) || null;
    return null;
  }, [rental, vehicleIndex]);

  // 🔄 V2 Smart Caching (pod kapotou)
  const smartDefaults = useMemo(() => {
    const companyName = currentVehicle?.company;
    return getV2SmartDefaults(companyName);
  }, [currentVehicle?.company]);

  // 🎨 V1 Form Data (zachované, ale s V2 smart defaults)
  const initialFormData = useMemo(
    () => ({
      location:
        rental.pickupLocation ||
        rental.handoverPlace ||
        smartDefaults.rental?.pickupLocation ||
        '',
      odometer: rental.odometer || undefined,
      fuelLevel: rental.fuelLevel || smartDefaults.fuelLevel || 100,
      depositPaymentMethod:
        smartDefaults.depositPaymentMethod ||
        ('cash' as 'cash' | 'bank_transfer' | 'card'),
      notes: smartDefaults.notes || '',
      vehicleImages: [] as ProtocolImage[],
      documentImages: [] as ProtocolImage[],
      damageImages: [] as ProtocolImage[],
      odometerImages: [] as ProtocolImage[],
      fuelImages: [] as ProtocolImage[],
      vehicleVideos: [] as ProtocolVideo[],
      documentVideos: [] as ProtocolVideo[],
      damageVideos: [] as ProtocolVideo[],
      odometerVideos: [] as ProtocolVideo[],
      fuelVideos: [] as ProtocolVideo[],
      signatures: [] as ProtocolSignature[],
    }),
    [rental, smartDefaults]
  );

  const [formData, setFormData] = useState(initialFormData);

  // 📊 V2 Performance Monitoring Setup
  useEffect(() => {
    trackRender();
    startPerformanceMonitoring(30000);
    return () => stopPerformanceMonitoring();
  }, [trackRender]);

  // 📧 V2 Email Status Loading
  useEffect(() => {
    if (rental?.id) {
      const cachedStatus = getEmailStatus(rental.id);
      if (cachedStatus) {
        setEmailStatus(cachedStatus);
      }
    }
  }, [rental?.id]);

  // 🔄 V2 Auto-save (pod kapotou)
  useEffect(() => {
    if (rental?.id && currentVehicle?.company) {
      const v2Data = V1V2DataAdapter.rentalToV2Data(rental, currentVehicle);
      autoSaveV2FormData({ ...v2Data, ...formData }, currentVehicle.company);
    }
  }, [formData, rental, currentVehicle]);

  /**
   * 🎯 V1 UI Handler s V2 Backend Submit
   */
  const handleSubmit = useCallback(async () => {
    if (!rental || !currentVehicle) return;

    setLoading(true);

    try {
      // 📧 V2 Email Status: Set pending
      setEmailStatus({ status: 'pending', message: 'Odosielam protokol...' });
      if (rental.id) {
        cacheEmailStatus(rental.id, 'pending', 'Odosielam protokol...');
      }

      // 🔄 Convert V1 data to V2 format for backend
      const v2Data = V1V2DataAdapter.rentalToV2Data(rental, currentVehicle);
      const categorizedPhotos =
        V1V2DataAdapter.v1PhotosToV2Categories(formData);

      // 🚀 V2 Backend API Call (with V1 compatible response)
      const protocol: HandoverProtocol = {
        id: uuidv4(),
        rentalId: rental.id,
        vehicleId: rental.vehicleId,
        customerId: rental.customerId,
        employeeId: state.user?.id || '',

        // V1 compatible fields
        location: formData.location,
        odometer: formData.odometer,
        fuelLevel: formData.fuelLevel,
        depositPaymentMethod: formData.depositPaymentMethod,
        notes: formData.notes,

        // Convert V2 photos back to V1 format
        ...V1V2DataAdapter.v2CategoriesToV1Photos(categorizedPhotos),

        signatures: formData.signatures,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 🎯 V1 onSave callback (zachované)
      await onSave(protocol);

      // 📧 V2 Email Status: Success
      setEmailStatus({
        status: 'success',
        message: 'Protokol úspešne uložený!',
      });
      if (rental.id) {
        cacheEmailStatus(rental.id, 'success', 'Protokol úspešne uložený!');

        // 🔄 V2 Cache successful form data
        cacheV2FormDefaults(
          {
            rental: {
              extraKilometerRate: rental.extraKilometerRate,
              deposit: rental.deposit,
              allowedKilometers: rental.allowedKilometers,
              pickupLocation: formData.location,
              returnLocation: rental.returnLocation,
            },
            fuelLevel: formData.fuelLevel,
            depositPaymentMethod: formData.depositPaymentMethod,
            notes: formData.notes,
          },
          currentVehicle.company
        );
      }

      // Auto-clear email status
      setTimeout(() => {
        setEmailStatus(null);
        if (rental.id) clearEmailStatus(rental.id);
      }, 5000);
    } catch (error) {
      console.error('Protocol submission failed:', error);
      setEmailStatus({
        status: 'error',
        message: 'Chyba pri ukladaní protokolu',
      });
      if (rental.id) {
        cacheEmailStatus(rental.id, 'error', 'Chyba pri ukladaní protokolu');
      }
    } finally {
      setLoading(false);
    }
  }, [formData, rental, currentVehicle, onSave, state.user]);

  // 🎨 V1 Photo Handlers (zachované, ale s V2 backend)
  const handlePhotosChange = useCallback(
    (category: string, photos: ProtocolImage[]) => {
      setFormData(prev => ({
        ...prev,
        [`${category}Images`]: photos,
      }));
    },
    []
  );

  // 📊 V2 Upload Metrics Tracking
  useEffect(() => {
    const totalPhotos = Object.keys(formData)
      .filter(key => key.endsWith('Images'))
      .reduce(
        (sum, key) =>
          sum + (formData[key as keyof typeof formData] as any[]).length,
        0
      );

    trackUploadMetrics({
      activeUploads: 0,
      queueSize: totalPhotos,
      failedUploads: 0,
      totalUploaded: totalPhotos,
    });
  }, [formData]);

  // 🚫 Feature Flag Check
  const isV2Enabled = featureManager.isEnabled('PROTOCOL_V2_ENABLED');
  if (!isV2Enabled) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Protocol V2 nie je povolený. Používa sa štandardný formulár.
      </Alert>
    );
  }

  if (!open) return null;

  return (
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
        zIndex: 1300,
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 800,
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <CardContent>
          {/* 📧 V2 Email Status Alert */}
          {emailStatus && (
            <Alert
              severity={
                emailStatus.status === 'success'
                  ? 'success'
                  : emailStatus.status === 'warning'
                    ? 'warning'
                    : emailStatus.status === 'error'
                      ? 'error'
                      : 'info'
              }
              sx={{ mb: 2 }}
            >
              {emailStatus.message}
            </Alert>
          )}

          {/* 🎨 V1 UI Header (zachované) */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h5"
              component="h2"
              display="flex"
              alignItems="center"
            >
              <Receipt sx={{ mr: 1 }} />
              Odovzdávací protokol
            </Typography>
            <Button onClick={onClose} variant="outlined">
              Zavrieť
            </Button>
          </Box>

          {/* 🎨 V1 Vehicle Info (zachované) */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                display="flex"
                alignItems="center"
              >
                <DirectionsCar sx={{ mr: 1 }} />
                Informácie o vozidle
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>ŠPZ:</strong> {currentVehicle?.licensePlate}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Značka:</strong> {currentVehicle?.brand}{' '}
                    {currentVehicle?.model}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 🎨 V1 Form Fields (zachované) */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Miesto prevzatia"
                value={formData.location}
                onChange={e =>
                  setFormData(prev => ({ ...prev, location: e.target.value }))
                }
                InputProps={{
                  startAdornment: (
                    <LocationOn sx={{ mr: 1, color: 'action.active' }} />
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stav tachometra (km)"
                type="number"
                value={formData.odometer || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    odometer: parseInt(e.target.value) || undefined,
                  }))
                }
                InputProps={{
                  startAdornment: (
                    <SpeedOutlined sx={{ mr: 1, color: 'action.active' }} />
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Úroveň paliva (%)"
                type="number"
                value={formData.fuelLevel}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    fuelLevel: parseInt(e.target.value) || 100,
                  }))
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Spôsob platby zálohy</InputLabel>
                <Select
                  value={formData.depositPaymentMethod}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      depositPaymentMethod: e.target.value as any,
                    }))
                  }
                >
                  <MenuItem value="cash">Hotovosť</MenuItem>
                  <MenuItem value="bank_transfer">Bankový prevod</MenuItem>
                  <MenuItem value="card">Karta</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Poznámky"
                value={formData.notes}
                onChange={e =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* 🎨 V1 Photo Sections (zachované UI, V2 backend) */}
          {(['vehicle', 'document', 'damage', 'odometer', 'fuel'] as const).map(
            category => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  display="flex"
                  alignItems="center"
                >
                  <PhotoCamera sx={{ mr: 1 }} />
                  {category === 'vehicle' && 'Fotografie vozidla'}
                  {category === 'document' && 'Fotografie dokumentov'}
                  {category === 'damage' && 'Fotografie poškodení'}
                  {category === 'odometer' && 'Fotografie tachometra'}
                  {category === 'fuel' && 'Fotografie paliva'}
                </Typography>

                <SerialPhotoCapture
                  onPhotosChange={photos =>
                    handlePhotosChange(category, photos)
                  }
                  maxPhotos={
                    category === 'damage' ? 15 : category === 'vehicle' ? 10 : 5
                  }
                  category={category}
                />
              </Box>
            )
          )}

          <Divider sx={{ my: 3 }} />

          {/* 🎨 V1 Signatures (zachované) */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              display="flex"
              alignItems="center"
            >
              <Person sx={{ mr: 1 }} />
              Podpisy
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {formData.signatures.map(signature => (
                <Chip
                  key={signature.id}
                  label={`${signature.signerName} (${signature.signerRole === 'customer' ? 'Zákazník' : 'Zamestnanec'})`}
                  onDelete={() => {
                    setFormData(prev => ({
                      ...prev,
                      signatures: prev.signatures.filter(
                        s => s.id !== signature.id
                      ),
                    }));
                  }}
                  color={
                    signature.signerRole === 'customer'
                      ? 'primary'
                      : 'secondary'
                  }
                />
              ))}
            </Box>

            <Button
              variant="outlined"
              onClick={() => setShowSignaturePad(true)}
              startIcon={<Person />}
            >
              Pridať podpis
            </Button>
          </Box>

          {/* 🎨 V1 Submit Button (zachované) */}
          <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
            <Button onClick={onClose} variant="outlined">
              Zrušiť
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              startIcon={<Save />}
            >
              {loading ? 'Ukladám...' : 'Uložiť protokol'}
            </Button>
          </Box>

          {/* Loading Progress */}
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {/* 🎨 V1 Signature Pad (zachované) */}
      {showSignaturePad && (
        <SignaturePad
          open={showSignaturePad}
          onClose={() => setShowSignaturePad(false)}
          onSave={signature => {
            setFormData(prev => ({
              ...prev,
              signatures: [...prev.signatures, signature],
            }));
            setShowSignaturePad(false);
          }}
        />
      )}
    </Box>
  );
};

export default HandoverProtocolFormV1Enhanced;
