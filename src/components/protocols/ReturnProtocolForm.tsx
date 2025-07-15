import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  Save,
  Close,
  PhotoCamera,
  PictureAsPdf,
  Email,
  LocationOn,
  LocalGasStation,
  SpeedOutlined,
  Calculate,
  MoneyOff,
  Receipt,
} from '@mui/icons-material';
import { ReturnProtocol, Rental, HandoverProtocol, ProtocolImage, ProtocolVideo, VehicleCondition } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import SerialPhotoCapture from '../common/SerialPhotoCapture';

interface ReturnProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  handoverProtocol: HandoverProtocol;
  onSave: (protocol: ReturnProtocol) => void;
}

export default function ReturnProtocolForm({ open, onClose, rental, handoverProtocol, onSave }: ReturnProtocolFormProps) {
  const [protocol, setProtocol] = useState<Partial<ReturnProtocol>>({
    id: uuidv4(),
    rentalId: rental.id,
    rental,
    handoverProtocolId: handoverProtocol.id,
    handoverProtocol,
    type: 'return',
    status: 'draft',
    createdAt: new Date(),
    location: '',
    vehicleCondition: {
      odometer: handoverProtocol.vehicleCondition.odometer,
      fuelLevel: 100,
      fuelType: handoverProtocol.vehicleCondition.fuelType,
      exteriorCondition: 'Dobrý',
      interiorCondition: 'Dobrý',
      notes: '',
    },
    vehicleImages: [],
    vehicleVideos: [],
    documentImages: [],
    damageImages: [],
    damages: [],
    newDamages: [],
    signatures: [],
    kilometersUsed: 0,
    kilometerOverage: 0,
    kilometerFee: 0,
    fuelUsed: 0,
    fuelFee: 0,
    totalExtraFees: 0,
    depositRefund: 0,
    additionalCharges: 0,
    finalRefund: 0,
    rentalData: {
      orderNumber: rental.orderNumber || '',
      vehicle: rental.vehicle || {} as any,
      customer: rental.customer || {} as any,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalPrice: rental.totalPrice,
      deposit: 0,
      currency: 'EUR',
      allowedKilometers: 0,
      extraKilometerRate: 0.50, // 50 centov za km
    },
    emailSent: false,
    createdBy: '',
  });

  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);

  // Automatické prepočítanie poplatkov
  useEffect(() => {
    if (autoCalculate && protocol.vehicleCondition) {
      calculateFees();
    }
  }, [protocol.vehicleCondition?.odometer, protocol.vehicleCondition?.fuelLevel, autoCalculate]);

  const calculateFees = () => {
    const currentOdometer = protocol.vehicleCondition?.odometer || 0;
    const startingOdometer = handoverProtocol.vehicleCondition.odometer;
    const allowedKm = protocol.rentalData?.allowedKilometers || 0;
    const extraKmRate = protocol.rentalData?.extraKilometerRate || 0.50;
    const depositAmount = protocol.rentalData?.deposit || 0;
    
    // Výpočet najazdených km
    const kilometersUsed = Math.max(0, currentOdometer - startingOdometer);
    
    // Výpočet prekročenia km
    const kilometerOverage = allowedKm > 0 ? Math.max(0, kilometersUsed - allowedKm) : 0;
    const kilometerFee = kilometerOverage * extraKmRate;
    
    // Výpočet spotreby paliva
    const startingFuel = handoverProtocol.vehicleCondition.fuelLevel;
    const currentFuel = protocol.vehicleCondition?.fuelLevel || 0;
    const fuelUsed = Math.max(0, startingFuel - currentFuel);
    const fuelFee = fuelUsed * 0.02; // 2 centy za %
    
    // Celkové poplatky
    const totalExtraFees = kilometerFee + fuelFee;
    
    // Výpočet refundu
    const depositRefund = Math.max(0, depositAmount - totalExtraFees);
    const additionalCharges = Math.max(0, totalExtraFees - depositAmount);
    const finalRefund = depositRefund;
    
    setProtocol(prev => ({
      ...prev,
      kilometersUsed,
      kilometerOverage,
      kilometerFee,
      fuelUsed,
      fuelFee,
      totalExtraFees,
      depositRefund,
      additionalCharges,
      finalRefund,
    }));
  };

  const handleVehicleConditionChange = (field: keyof VehicleCondition, value: any) => {
    setProtocol(prev => ({
      ...prev,
      vehicleCondition: {
        ...prev.vehicleCondition!,
        [field]: value,
      },
    }));
  };

  const handleMediaSave = (type: 'vehicle' | 'document' | 'damage', images: ProtocolImage[], videos: ProtocolVideo[]) => {
    setProtocol(prev => ({
      ...prev,
      [`${type}Images`]: images,
      [`${type}Videos`]: videos,
    }));
    setActivePhotoCapture(null);
  };

  const handleSave = async () => {
    if (!protocol.vehicleCondition || !protocol.location) {
      alert('Vyplňte všetky povinné údaje');
      return;
    }

    setProcessing(true);
    
    try {
      const completeProtocol: ReturnProtocol = {
        ...protocol,
        completedAt: new Date(),
        status: 'completed',
      } as ReturnProtocol;

      await onSave(completeProtocol);
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladaní protokolu:', error);
      alert('Chyba pri ukladaní protokolu');
    } finally {
      setProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300,
      p: 2,
    }}>
      <Card sx={{ 
        maxWidth: 1000, 
        width: '100%', 
        maxHeight: '90vh', 
        overflow: 'auto',
        backgroundColor: '#2d2d2d',
      }}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: 'white' }}>
              Odovzdávací protokol
            </Typography>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Progress indicator */}
          {processing && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ color: 'white', mt: 1 }}>
                Ukladám protokol...
              </Typography>
            </Box>
          )}

          {/* Handover protocol reference */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Navzäuje na preberací protokol #{handoverProtocol.id.slice(-8)} z {handoverProtocol.createdAt.toLocaleString()}
            </Typography>
          </Alert>

          {/* Rental info */}
          <Card sx={{ mb: 3, backgroundColor: '#3d3d3d' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Údaje o prenájme
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                <TextField
                  label="Číslo objednávky"
                  value={protocol.rentalData?.orderNumber || ''}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Vozidlo"
                  value={rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model} (${rental.vehicle.licensePlate})` : ''}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Zákazník"
                  value={rental.customer ? `${rental.customer.name}` : ''}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Cena prenájmu"
                  value={`${rental.totalPrice} EUR`}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>

          {/* Previous damages from handover */}
          {handoverProtocol.damages && handoverProtocol.damages.length > 0 && (
            <Card sx={{ mb: 3, backgroundColor: '#3d3d3d' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Poškodenia z preberacieho protokolu
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Tieto poškodenia boli zadokumentované pri preberaní vozidla. Skontrolujte ich pri vratení.
                </Alert>
                {handoverProtocol.damages.map((damage) => (
                  <Box key={damage.id} sx={{ mb: 2, p: 2, border: '1px solid #555', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      <strong>{damage.location}:</strong> {damage.description}
                    </Typography>
                    <Chip 
                      label={damage.severity === 'low' ? 'Nízka' : damage.severity === 'medium' ? 'Stredná' : 'Vysoká'} 
                      color={damage.severity === 'low' ? 'success' : damage.severity === 'medium' ? 'warning' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Location */}
          <Card sx={{ mb: 3, backgroundColor: '#3d3d3d' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                <LocationOn sx={{ mr: 1 }} />
                Miesto vrátenia
              </Typography>
              <TextField
                fullWidth
                label="Miesto vrátenia"
                value={protocol.location}
                onChange={(e) => setProtocol(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Mesto/adresa kde sa vracia vozidlo"
                required
              />
            </CardContent>
          </Card>

          {/* Vehicle condition comparison */}
          <Card sx={{ mb: 3, backgroundColor: '#3d3d3d' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Stav vozidla pri vrátení
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
                    Tachometer pri preberaní: {handoverProtocol.vehicleCondition.odometer} km
                  </Typography>
                  <TextField
                    label="Aktuálny stav tachometra (km)"
                    type="number"
                    value={protocol.vehicleCondition?.odometer || 0}
                    onChange={(e) => handleVehicleConditionChange('odometer', parseInt(e.target.value))}
                    InputProps={{
                      startAdornment: <SpeedOutlined sx={{ color: 'white', mr: 1 }} />,
                    }}
                    fullWidth
                    required
                  />
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ color: 'gray', mb: 1 }}>
                    Palivo pri preberaní: {handoverProtocol.vehicleCondition.fuelLevel}%
                  </Typography>
                  <TextField
                    label="Aktuálny stav paliva (%)"
                    type="number"
                    value={protocol.vehicleCondition?.fuelLevel || 100}
                    onChange={(e) => handleVehicleConditionChange('fuelLevel', parseInt(e.target.value))}
                    InputProps={{
                      startAdornment: <LocalGasStation sx={{ color: 'white', mr: 1 }} />,
                    }}
                    inputProps={{ min: 0, max: 100 }}
                    fullWidth
                    required
                  />
                </Box>
                
                <TextField
                  label="Stav exteriéru"
                  value={protocol.vehicleCondition?.exteriorCondition || 'Dobrý'}
                  onChange={(e) => handleVehicleConditionChange('exteriorCondition', e.target.value)}
                  fullWidth
                />
                
                <TextField
                  label="Stav interiéru"
                  value={protocol.vehicleCondition?.interiorCondition || 'Dobrý'}
                  onChange={(e) => handleVehicleConditionChange('interiorCondition', e.target.value)}
                  fullWidth
                />
              </Box>
              
              <TextField
                label="Poznámky"
                value={protocol.vehicleCondition?.notes || ''}
                onChange={(e) => handleVehicleConditionChange('notes', e.target.value)}
                multiline
                rows={3}
                fullWidth
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>

          {/* Calculation summary */}
          <Card sx={{ mb: 3, backgroundColor: '#3d3d3d' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  <Calculate sx={{ mr: 1 }} />
                  Prepočet poplatkov
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={calculateFees}
                  startIcon={<Calculate />}
                >
                  Prepočítať
                </Button>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <TextField
                  label="Najazdené km"
                  value={protocol.kilometersUsed || 0}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                                 <TextField
                   label="Prekročenie km"
                   value={protocol.kilometerOverage ?? 0}
                   InputProps={{ readOnly: true }}
                   color={(protocol.kilometerOverage ?? 0) > 0 ? 'warning' : 'primary'}
                   fullWidth
                 />
                 <TextField
                   label="Poplatok za km"
                   value={`${(protocol.kilometerFee ?? 0).toFixed(2)} EUR`}
                   InputProps={{ readOnly: true }}
                   color={(protocol.kilometerFee ?? 0) > 0 ? 'warning' : 'primary'}
                   fullWidth
                 />
                 <TextField
                   label="Spotrebované palivo (%)"
                   value={protocol.fuelUsed ?? 0}
                   InputProps={{ readOnly: true }}
                   fullWidth
                 />
                 <TextField
                   label="Poplatok za palivo"
                   value={`${(protocol.fuelFee ?? 0).toFixed(2)} EUR`}
                   InputProps={{ readOnly: true }}
                   color={(protocol.fuelFee ?? 0) > 0 ? 'warning' : 'primary'}
                   fullWidth
                 />
                 <TextField
                   label="Celkové poplatky"
                   value={`${(protocol.totalExtraFees ?? 0).toFixed(2)} EUR`}
                   InputProps={{ readOnly: true }}
                   color={(protocol.totalExtraFees ?? 0) > 0 ? 'warning' : 'primary'}
                   fullWidth
                 />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <TextField
                  label="Vratenie z depozitu"
                  value={`${(protocol.depositRefund || 0).toFixed(2)} EUR`}
                  InputProps={{ readOnly: true }}
                  color="success"
                  fullWidth
                />
                                 <TextField
                   label="Doplatok"
                   value={`${(protocol.additionalCharges ?? 0).toFixed(2)} EUR`}
                   InputProps={{ readOnly: true }}
                   color={(protocol.additionalCharges ?? 0) > 0 ? 'error' : 'primary'}
                   fullWidth
                 />
                <TextField
                  label="Finálny refund"
                  value={`${(protocol.finalRefund || 0).toFixed(2)} EUR`}
                  InputProps={{ readOnly: true }}
                  color="success"
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>

          {/* Media capture */}
          <Card sx={{ mb: 3, backgroundColor: '#3d3d3d' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Fotodokumentácia
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => setActivePhotoCapture('vehicle')}
                >
                  Fotky vozidla ({protocol.vehicleImages?.length || 0})
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => setActivePhotoCapture('document')}
                >
                  Fotky dokladov ({protocol.documentImages?.length || 0})
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => setActivePhotoCapture('damage')}
                >
                  Fotky poškodení ({protocol.damageImages?.length || 0})
                </Button>
              </Box>
              
              {/* Media summary */}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${(protocol.vehicleImages?.length || 0) + (protocol.documentImages?.length || 0) + (protocol.damageImages?.length || 0)} fotiek`}
                  color="primary"
                  size="small"
                />
                <Chip 
                  label={`${(protocol.vehicleVideos?.length || 0)} videí`}
                  color="secondary"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => alert('PDF generovanie bude implementované')}
              disabled={processing}
            >
              Generovať PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Email />}
              onClick={() => alert('Email odosielanie bude implementované')}
              disabled={processing}
            >
              Odoslať email
            </Button>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={processing}
            >
              Zrušiť
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={processing}
            >
              Uložiť protokol
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Photo capture dialog */}
      {activePhotoCapture && (
        <SerialPhotoCapture
          open={!!activePhotoCapture}
          onClose={() => setActivePhotoCapture(null)}
          onSave={(images, videos) => handleMediaSave(activePhotoCapture as any, images, videos)}
          title={
            activePhotoCapture === 'vehicle' ? 'Fotky vozidla' :
            activePhotoCapture === 'document' ? 'Fotky dokladov' :
            'Fotky poškodení'
          }
          allowedTypes={
            activePhotoCapture === 'vehicle' ? ['vehicle'] :
            activePhotoCapture === 'document' ? ['document'] :
            ['damage']
          }
        />
      )}
    </Box>
  );
} 