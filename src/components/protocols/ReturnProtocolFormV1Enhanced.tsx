/**
 * ReturnProtocolFormV1Enhanced - V1 UI s V2 Backend systémom
 *
 * KONCEPT:
 * - Zachováva presne pôvodný V1 UI/UX pre return protokol
 * - Pod kapotou používa V2 backend (API, photo categories, performance)
 * - Transparentne konvertuje dáta medzi V1 a V2 formátom
 * - Získava všetky výhody V2 (smart caching, email status, performance monitoring)
 */

import {
  Calculate,
  Cancel,
  Check,
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
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { featureManager } from '../../config/featureFlags';
import { useAuth } from '../../context/AuthContext';
import type {
  HandoverProtocol,
  ProtocolImage,
  ProtocolSignature,
  ProtocolVideo,
  Rental,
  ReturnProtocol,
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

interface ReturnProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  handoverProtocol: HandoverProtocol;
  onSave: (protocol: ReturnProtocol) => void;
}

/**
 * 🎯 HLAVNÝ KOMPONENT: V1 Return Protocol UI s V2 Backend
 */
const ReturnProtocolFormV1Enhanced: React.FC<ReturnProtocolFormProps> = ({
  open,
  onClose,
  rental,
  handoverProtocol,
  onSave,
}) => {
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);

  // 📊 V2 Performance Monitoring (pod kapotou)
  const { trackRender } = useV2Performance('ReturnProtocolFormV1Enhanced');

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

  // 🔧 V1 Return-specific state (zachované)
  const [isEditingKmRate, setIsEditingKmRate] = useState(false);
  const [customKmRate, setCustomKmRate] = useState<number | null>(null);
  const [originalKmRate, setOriginalKmRate] = useState<number>(0);

  // 🔄 V2 Smart Caching (pod kapotou)
  const smartDefaults = useMemo(() => {
    const companyName = rental?.vehicle?.company;
    return getV2SmartDefaults(companyName);
  }, [rental?.vehicle?.company]);

  // 🎨 V1 Form Data (zachované, ale s V2 smart defaults)
  const initialFormData = useMemo(
    () => ({
      location:
        rental?.returnLocation || smartDefaults.rental?.returnLocation || '',
      odometer: undefined as number | undefined,
      fuelLevel: smartDefaults.fuelLevel || 100,
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
      const cachedStatus = getEmailStatus(`return_${rental.id}`);
      if (cachedStatus) {
        setEmailStatus(cachedStatus);
      }
    }
  }, [rental?.id]);

  // 🔄 V2 Auto-save (pod kapotou)
  useEffect(() => {
    if (rental?.id && rental?.vehicle?.company) {
      autoSaveV2FormData(
        {
          protocolId: `return_${rental.id}`,
          ...formData,
        },
        rental.vehicle.company
      );
    }
  }, [formData, rental]);

  // 🔧 V1 Calculations (zachované)
  const drivenKilometers = useMemo(() => {
    if (!formData.odometer || !handoverProtocol?.odometer) return 0;
    return Math.max(0, formData.odometer - handoverProtocol.odometer);
  }, [formData.odometer, handoverProtocol?.odometer]);

  const extraKilometers = useMemo(() => {
    if (!rental?.allowedKilometers) return 0;
    return Math.max(0, drivenKilometers - rental.allowedKilometers);
  }, [drivenKilometers, rental?.allowedKilometers]);

  const effectiveKmRate =
    customKmRate !== null ? customKmRate : rental?.extraKilometerRate || 0;
  const extraKilometerCost = extraKilometers * effectiveKmRate;

  /**
   * 🎯 V1 UI Handler s V2 Backend Submit
   */
  const handleSubmit = useCallback(async () => {
    if (!rental || !handoverProtocol) return;

    setLoading(true);

    try {
      // 📧 V2 Email Status: Set pending
      setEmailStatus({ status: 'pending', message: 'Odosielam protokol...' });
      if (rental.id) {
        cacheEmailStatus(
          `return_${rental.id}`,
          'pending',
          'Odosielam protokol...'
        );
      }

      // 🚀 V1 Compatible Return Protocol
      const protocol: ReturnProtocol = {
        id: uuidv4(),
        rentalId: rental.id,
        handoverProtocolId: handoverProtocol.id,
        vehicleId: rental.vehicleId,
        customerId: rental.customerId,
        employeeId: state.user?.id || '',

        // V1 compatible fields
        location: formData.location,
        odometer: formData.odometer,
        fuelLevel: formData.fuelLevel,
        notes: formData.notes,

        // Calculations
        drivenKilometers,
        extraKilometers,
        extraKilometerRate: effectiveKmRate,
        extraKilometerCost,

        // Photos
        vehicleImages: formData.vehicleImages,
        documentImages: formData.documentImages,
        damageImages: formData.damageImages,
        odometerImages: formData.odometerImages,
        fuelImages: formData.fuelImages,

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
        cacheEmailStatus(
          `return_${rental.id}`,
          'success',
          'Protokol úspešne uložený!'
        );

        // 🔄 V2 Cache successful form data
        cacheV2FormDefaults(
          {
            rental: {
              returnLocation: formData.location,
              extraKilometerRate: effectiveKmRate,
            },
            fuelLevel: formData.fuelLevel,
            notes: formData.notes,
          },
          rental.vehicle?.company
        );
      }

      // Auto-clear email status
      setTimeout(() => {
        setEmailStatus(null);
        if (rental.id) clearEmailStatus(`return_${rental.id}`);
      }, 5000);
    } catch (error) {
      console.error('Return protocol submission failed:', error);
      setEmailStatus({
        status: 'error',
        message: 'Chyba pri ukladaní protokolu',
      });
      if (rental.id) {
        cacheEmailStatus(
          `return_${rental.id}`,
          'error',
          'Chyba pri ukladaní protokolu'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    rental,
    handoverProtocol,
    onSave,
    state.user,
    drivenKilometers,
    extraKilometers,
    effectiveKmRate,
    extraKilometerCost,
  ]);

  // 🎨 V1 Photo Handlers (zachované)
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
              <DirectionsCar sx={{ mr: 1 }} />
              Preberací protokol
            </Typography>
            <Button onClick={onClose} variant="outlined">
              Zavrieť
            </Button>
          </Box>

          {/* 🎨 V1 Vehicle & Handover Info (zachované) */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informácie z odovzdávacieho protokolu
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Vozidlo:</strong> {rental?.vehicle?.licensePlate}
                  </Typography>
                  <Typography>
                    <strong>Odovzdané km:</strong>{' '}
                    {handoverProtocol?.odometer?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>
                    <strong>Povolené km:</strong>{' '}
                    {rental?.allowedKilometers?.toLocaleString()}
                  </Typography>
                  <Typography>
                    <strong>Cena za extra km:</strong> {effectiveKmRate}€
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
                label="Miesto vrátenia"
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
                required
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
              <Box display="flex" alignItems="center" gap={1}>
                <TextField
                  fullWidth
                  label="Cena za extra km (€)"
                  type="number"
                  value={isEditingKmRate ? customKmRate || '' : effectiveKmRate}
                  onChange={e =>
                    setCustomKmRate(parseFloat(e.target.value) || null)
                  }
                  disabled={!isEditingKmRate}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                {!isEditingKmRate ? (
                  <IconButton onClick={() => setIsEditingKmRate(true)}>
                    <Edit />
                  </IconButton>
                ) : (
                  <Box display="flex">
                    <IconButton
                      onClick={() => {
                        setIsEditingKmRate(false);
                        setCustomKmRate(null);
                      }}
                    >
                      <Cancel />
                    </IconButton>
                    <IconButton onClick={() => setIsEditingKmRate(false)}>
                      <Check />
                    </IconButton>
                  </Box>
                )}
              </Box>
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

          {/* 🔧 V1 Calculations Display (zachované) */}
          {formData.odometer && (
            <Card
              variant="outlined"
              sx={{ my: 3, bgcolor: 'background.default' }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  display="flex"
                  alignItems="center"
                >
                  <Calculate sx={{ mr: 1 }} />
                  Výpočet extra kilometrov
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Typography>
                      <strong>Najazdené km:</strong>{' '}
                      {drivenKilometers.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography>
                      <strong>Extra km:</strong>{' '}
                      {extraKilometers.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography>
                      <strong>Cena za km:</strong> {effectiveKmRate}€
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography
                      color={extraKilometerCost > 0 ? 'error' : 'success'}
                    >
                      <strong>Poplatok:</strong> {extraKilometerCost.toFixed(2)}
                      €
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

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
              disabled={loading || !formData.odometer}
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

export default ReturnProtocolFormV1Enhanced;
