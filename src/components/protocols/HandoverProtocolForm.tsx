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
  PhotoLibrary,
} from '@mui/icons-material';
import { HandoverProtocol, Rental, ProtocolImage, ProtocolVideo, VehicleCondition } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import SerialPhotoCapture from '../common/SerialPhotoCapture';
import ProtocolGallery from '../common/ProtocolGallery';

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
    documentVideos: [],
    damageImages: [],
    damageVideos: [],
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
      extraKilometerRate: 0.50,
    },
    emailSent: false,
    createdBy: 'admin',
    notes: '',
  });

  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  if (!open) return null;

  const handleInputChange = (field: string, value: any) => {
    setProtocol(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVehicleConditionChange = (field: string, value: any) => {
    setProtocol(prev => ({
      ...prev,
      vehicleCondition: {
        ...prev.vehicleCondition!,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setProgressMessage('Ukladám protokol a generujem PDF...');
      
      console.log('🚀 Začínam ukladanie protokolu...');
      console.log('📋 Protocol data:', protocol);
      
      // 🎭 BACKEND API CALL - Uloženie protokolu + PDF generovanie
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api';
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      const response = await fetch(`${apiBaseUrl}/protocols/handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(protocol)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend API failed:', errorText);
        throw new Error(`Backend API failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Backend response:', result);
      
      // 🎯 STIAHNUTIE PDF cez proxy endpoint (CORS fix)
      if (result.protocol?.pdfProxyUrl) {
        console.log('🎭 Downloading PDF via proxy:', result.protocol.pdfProxyUrl);
        
        const pdfResponse = await fetch(`${apiBaseUrl}${result.protocol.pdfProxyUrl}`);
        
        if (pdfResponse.ok) {
          const pdfBlob = await pdfResponse.blob();
          
          // Stiahnutie PDF
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `protokol_prevzatie_${protocol.id}_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          console.log('✅ PDF downloaded successfully');
        } else {
          console.warn('⚠️ PDF download failed, but protocol saved');
        }
      }
      
      // Úspešný callback
      onSave(result.protocol);
      onClose();
      
      console.log('✅ Handover protocol created successfully:', result.protocol.id);
      
    } catch (error) {
      console.error('❌ Error saving protocol:', error);
      alert('Nepodarilo sa uložiť protokol: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    } finally {
      setLoading(false);
      setProgressMessage('');
    }
  };

  const handlePhotoCaptureClose = (mediaType: string) => {
    setActivePhotoCapture(null);
  };

  const handlePhotoCaptureSuccess = (mediaType: string, images: ProtocolImage[], videos: ProtocolVideo[]) => {
    console.log(`📸 Captured ${mediaType}:`, { images: images.length, videos: videos.length });
    
    setProtocol(prev => ({
      ...prev,
      [`${mediaType}Images`]: images,
      [`${mediaType}Videos`]: videos,
    }));
    
    setActivePhotoCapture(null);
  };

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      bgcolor: 'background.default', 
      zIndex: 1300,
      overflowY: 'auto',
      p: 2
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="text.primary">
          Protokol prevzatia - {rental.vehicle?.licensePlate || 'Vozidlo'}
        </Typography>
        <IconButton onClick={onClose} size="large">
          <Close />
        </IconButton>
      </Box>

      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {progressMessage}
          </Typography>
        </Box>
      )}

      {/* Základné informácie */}
      <Card sx={{ mb: 3, backgroundColor: 'background.default' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
            Základné informácie
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            <TextField
              label="Miesto prevzatia"
              value={protocol.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Poznámky"
              value={protocol.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Stav vozidla */}
      <Card sx={{ mb: 3, backgroundColor: 'background.default' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <SpeedOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
            Stav vozidla
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <TextField
              label="Stav tachometra (km)"
              type="number"
              value={protocol.vehicleCondition?.odometer || 0}
              onChange={(e) => handleVehicleConditionChange('odometer', parseInt(e.target.value) || 0)}
              fullWidth
            />
            <TextField
              label="Úroveň paliva (%)"
              type="number"
              value={protocol.vehicleCondition?.fuelLevel || 100}
              onChange={(e) => handleVehicleConditionChange('fuelLevel', parseInt(e.target.value) || 100)}
              inputProps={{ min: 0, max: 100 }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Typ paliva</InputLabel>
              <Select
                value={protocol.vehicleCondition?.fuelType || 'gasoline'}
                onChange={(e) => handleVehicleConditionChange('fuelType', e.target.value)}
                label="Typ paliva"
              >
                <MenuItem value="gasoline">Benzín</MenuItem>
                <MenuItem value="diesel">Diesel</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
                <MenuItem value="electric">Elektrické</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Fotodokumentácia */}
      <Card sx={{ mb: 3, backgroundColor: 'background.default' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
            Fotodokumentácia
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => setActivePhotoCapture('vehicle')}
            >
              Fotky vozidla ({protocol.vehicleImages?.length || 0})
            </Button>
            <Button
              variant="outlined"
              startIcon={<Receipt />}
              onClick={() => setActivePhotoCapture('document')}
            >
              Dokumenty ({protocol.documentImages?.length || 0})
            </Button>
            <Button
              variant="outlined"
              startIcon={<MoneyOff />}
              onClick={() => setActivePhotoCapture('damage')}
            >
              Poškodenia ({protocol.damageImages?.length || 0})
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Akcie */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
        >
          Zrušiť
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Ukladám...' : 'Uložiť a generovať PDF'}
        </Button>
      </Box>

      {/* Photo capture modals */}
      {activePhotoCapture && (
        <SerialPhotoCapture
          open={true}
          onClose={() => handlePhotoCaptureClose(activePhotoCapture)}
          onSave={(images, videos) => handlePhotoCaptureSuccess(activePhotoCapture, images, videos)}
          title={`Fotky - ${activePhotoCapture}`}
          allowedTypes={['vehicle', 'document', 'damage']}
          entityId={protocol.id}
          protocolType="handover"
          mediaType={activePhotoCapture as 'vehicle' | 'document' | 'damage'}
        />
      )}

      {/* Protocol Gallery */}
      <ProtocolGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={[
          ...(protocol.vehicleImages || []),
          ...(protocol.documentImages || []),
          ...(protocol.damageImages || [])
        ]}
        videos={[
          ...(protocol.vehicleVideos || []),
          ...(protocol.documentVideos || []),
          ...(protocol.damageVideos || [])
        ]}
        title={`Galéria protokolu prevzatia - ${rental.vehicle?.licensePlate || 'Vozidlo'}`}
      />
    </Box>
  );
} 