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
  IconButton,
  Alert,
} from '@mui/material';
import {
  Save,
  Close,
  PhotoCamera,
  LocationOn,
  SpeedOutlined,
} from '@mui/icons-material';
import { HandoverProtocol, Rental, ProtocolImage, ProtocolVideo } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import SerialPhotoCapture from '../common/SerialPhotoCapture';

interface HandoverProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  onSave: (protocol: HandoverProtocol) => void;
}

export default function HandoverProtocolForm({ open, onClose, rental, onSave }: HandoverProtocolFormProps) {
  const [loading, setLoading] = useState(false);
  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  
  // Zjednodušený state - iba základné polia
  const [formData, setFormData] = useState({
    location: '',
    odometer: 0,
    fuelLevel: 100,
    fuelType: 'gasoline' as const,
    exteriorCondition: 'Dobrý',
    interiorCondition: 'Dobrý',
    notes: '',
    vehicleImages: [] as ProtocolImage[],
    documentImages: [] as ProtocolImage[],
    damageImages: [] as ProtocolImage[],
    vehicleVideos: [] as ProtocolVideo[],
    documentVideos: [] as ProtocolVideo[],
    damageVideos: [] as ProtocolVideo[],
  });

  if (!open) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoCaptureSuccess = (mediaType: string, images: ProtocolImage[], videos: ProtocolVideo[]) => {
    setFormData(prev => ({
      ...prev,
      [`${mediaType}Images`]: images,
      [`${mediaType}Videos`]: videos,
    }));
    setActivePhotoCapture(null);
  };

  const handleSave = async () => {
    if (!formData.location) {
      alert('Zadajte miesto prevzatia');
      return;
    }

    try {
      setLoading(true);
      
      // Vytvorenie protokolu s pôvodnou štruktúrou
      const protocol: HandoverProtocol = {
        id: uuidv4(),
        rentalId: rental.id,
        rental: rental,
        type: 'handover',
        status: 'completed',
        createdAt: new Date(),
        completedAt: new Date(),
        location: formData.location,
        vehicleCondition: {
          odometer: formData.odometer,
          fuelLevel: formData.fuelLevel,
          fuelType: formData.fuelType,
          exteriorCondition: formData.exteriorCondition,
          interiorCondition: formData.interiorCondition,
        },
        vehicleImages: formData.vehicleImages,
        vehicleVideos: formData.vehicleVideos,
        documentImages: formData.documentImages,
        documentVideos: formData.documentVideos,
        damageImages: formData.damageImages,
        damageVideos: formData.damageVideos,
        damages: [],
        signatures: [],
        rentalData: {
          orderNumber: rental.orderNumber || '',
          vehicle: rental.vehicle || {} as any,
          customer: rental.customer || {} as any,
          startDate: rental.startDate,
          endDate: rental.endDate,
          totalPrice: rental.totalPrice,
          deposit: rental.deposit || 0,
          currency: 'EUR',
          allowedKilometers: rental.allowedKilometers || 0,
          extraKilometerRate: rental.extraKilometerRate || 0.5,
        },
        pdfUrl: '',
        emailSent: false,
        notes: formData.notes,
        createdBy: 'admin',
      };

      // API call
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
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Stiahnutie PDF ak je dostupné
      if (result.protocol?.pdfProxyUrl) {
        try {
          const pdfResponse = await fetch(`${apiBaseUrl}${result.protocol.pdfProxyUrl}`);
          if (pdfResponse.ok) {
            const pdfBlob = await pdfResponse.blob();
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `protokol_prevzatie_${rental.vehicle?.licensePlate || 'vozidlo'}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        } catch (pdfError) {
          console.warn('PDF download failed:', pdfError);
        }
      }
      
      onSave(result.protocol);
      onClose();
      
    } catch (error) {
      console.error('Error saving protocol:', error);
      alert('Chyba pri ukladaní protokolu: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    } finally {
      setLoading(false);
    }
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
        <Typography variant="h5" color="text.primary">
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
            Ukladám protokol a generujem PDF...
          </Typography>
        </Box>
      )}

      {/* Základné informácie */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
            Základné informácie
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            <TextField
              label="Miesto prevzatia *"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Poznámky"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
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
            <SpeedOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
            Stav vozidla
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <TextField
              label="Stav tachometra (km)"
              type="number"
              value={formData.odometer}
              onChange={(e) => handleInputChange('odometer', parseInt(e.target.value) || 0)}
              fullWidth
            />
            <TextField
              label="Úroveň paliva (%)"
              type="number"
              value={formData.fuelLevel}
              onChange={(e) => handleInputChange('fuelLevel', parseInt(e.target.value) || 100)}
              inputProps={{ min: 0, max: 100 }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Typ paliva</InputLabel>
              <Select
                value={formData.fuelType}
                onChange={(e) => handleInputChange('fuelType', e.target.value)}
                label="Typ paliva"
              >
                <MenuItem value="gasoline">Benzín</MenuItem>
                <MenuItem value="diesel">Diesel</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
                <MenuItem value="electric">Elektrické</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Stav exteriéru"
              value={formData.exteriorCondition}
              onChange={(e) => handleInputChange('exteriorCondition', e.target.value)}
              fullWidth
            />
            <TextField
              label="Stav interiéru"
              value={formData.interiorCondition}
              onChange={(e) => handleInputChange('interiorCondition', e.target.value)}
              fullWidth
            />
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
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
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

      {/* Tlačidlá */}
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

      {/* Photo capture modal */}
      {activePhotoCapture && (
        <SerialPhotoCapture
          open={true}
          onClose={() => setActivePhotoCapture(null)}
          onSave={(images, videos) => handlePhotoCaptureSuccess(activePhotoCapture, images, videos)}
          title={`Fotky - ${activePhotoCapture}`}
          allowedTypes={['vehicle', 'document', 'damage']}
          entityId={uuidv4()}
          protocolType="handover"
          mediaType={activePhotoCapture as 'vehicle' | 'document' | 'damage'}
        />
      )}
    </Box>
  );
} 