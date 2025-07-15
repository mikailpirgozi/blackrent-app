import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { HandoverProtocol, Rental, ProtocolImage, ProtocolVideo, VehicleCondition } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import SerialPhotoCapture from '../common/SerialPhotoCapture';

interface HandoverProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  onSave: (protocol: HandoverProtocol) => void;
}

export default function HandoverProtocolForm({ open, onClose, rental, onSave }: HandoverProtocolFormProps) {
  const [protocol, setProtocol] = useState<Partial<HandoverProtocol>>({
    id: uuidv4(),
    rentalId: rental.id,
    rental,
    type: 'handover',
    status: 'draft',
    createdAt: new Date(),
    location: '',
    vehicleCondition: {
      odometer: 0,
      fuelLevel: 100,
      fuelType: 'gasoline',
      exteriorCondition: 'Dobrý',
      interiorCondition: 'Dobrý',
      notes: '',
    },
    vehicleImages: [],
    vehicleVideos: [],
    documentImages: [],
    damageImages: [],
    damages: [],
    signatures: [],
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
      extraKilometerRate: 0,
    },
    emailSent: false,
    createdBy: '',
  });

  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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
    if (!protocol.vehicleCondition) {
      alert('Vyplňte stav vozidla');
      return;
    }

    setProcessing(true);
    
    try {
      const completeProtocol: HandoverProtocol = {
        ...protocol,
        completedAt: new Date(),
        status: 'completed',
      } as HandoverProtocol;

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
              Preberací protokol
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

          {/* Location */}
          <Card sx={{ mb: 3, backgroundColor: '#3d3d3d' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                <LocationOn sx={{ mr: 1 }} />
                Miesto odovzdania
              </Typography>
              <TextField
                fullWidth
                label="Miesto odovzdania"
                value={protocol.location}
                onChange={(e) => setProtocol(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Mesto/adresa kde sa odovzdáva vozidlo"
              />
            </CardContent>
          </Card>

          {/* Vehicle condition */}
          <Card sx={{ mb: 3, backgroundColor: '#3d3d3d' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                Stav vozidla
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <TextField
                  label="Stav tachometra (km)"
                  type="number"
                  value={protocol.vehicleCondition?.odometer || 0}
                  onChange={(e) => handleVehicleConditionChange('odometer', parseInt(e.target.value))}
                  InputProps={{
                    startAdornment: <SpeedOutlined sx={{ color: 'white', mr: 1 }} />,
                  }}
                  fullWidth
                />
                <TextField
                  label="Stav paliva (%)"
                  type="number"
                  value={protocol.vehicleCondition?.fuelLevel || 100}
                  onChange={(e) => handleVehicleConditionChange('fuelLevel', parseInt(e.target.value))}
                  InputProps={{
                    startAdornment: <LocalGasStation sx={{ color: 'white', mr: 1 }} />,
                  }}
                  inputProps={{ min: 0, max: 100 }}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Typ paliva</InputLabel>
                  <Select
                    value={protocol.vehicleCondition?.fuelType || 'gasoline'}
                    label="Typ paliva"
                    onChange={(e) => handleVehicleConditionChange('fuelType', e.target.value)}
                  >
                    <MenuItem value="gasoline">Benzín</MenuItem>
                    <MenuItem value="diesel">Diesel</MenuItem>
                    <MenuItem value="electric">Elektrika</MenuItem>
                    <MenuItem value="hybrid">Hybrid</MenuItem>
                  </Select>
                </FormControl>
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