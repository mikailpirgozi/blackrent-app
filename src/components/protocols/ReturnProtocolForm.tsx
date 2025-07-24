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
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  Save,
  Close,
  PhotoCamera,
  LocationOn,
  SpeedOutlined,
  Calculate,
} from '@mui/icons-material';
import { ReturnProtocol, Rental, HandoverProtocol, ProtocolImage, ProtocolVideo } from '../../types';
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
  const [loading, setLoading] = useState(false);
  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  
  // Zjednodušený state s bezpečným prístupom k handoverProtocol
  const [formData, setFormData] = useState({
    location: '',
    odometer: handoverProtocol?.vehicleCondition?.odometer || 0,
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

  // Prepočítaj poplatky pri zmene
  useEffect(() => {
    calculateFees();
  }, [formData.odometer, formData.fuelLevel]);

  const calculateFees = () => {
    const currentOdometer = formData.odometer;
    const startingOdometer = handoverProtocol?.vehicleCondition?.odometer || 0;
    const allowedKm = rental.allowedKilometers || 0;
    const extraKmRate = rental.extraKilometerRate || 0.50;
    const depositAmount = rental.deposit || 0;
    
    // Výpočet najazdených km
    const kilometersUsed = Math.max(0, currentOdometer - startingOdometer);
    
    // Výpočet prekročenia km
    const kilometerOverage = allowedKm > 0 ? Math.max(0, kilometersUsed - allowedKm) : 0;
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
  };

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
      alert('Zadajte miesto vrátenia');
      return;
    }

    // Kontrola handoverProtocol
    if (!handoverProtocol) {
      alert('Chyba: Odovzdávací protokol nie je k dispozícii. Najprv vytvorte odovzdávací protokol.');
      console.error('❌ handoverProtocol is undefined');
      return;
    }

    try {
      setLoading(true);
      
      console.log('📝 Creating return protocol with handoverProtocol:', handoverProtocol.id);
      console.log('📝 Current formData:', JSON.stringify(formData, null, 2));
      
      // Vytvorenie protokolu s pôvodnou štruktúrou
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
          odometer: formData.odometer,
          fuelLevel: formData.fuelLevel,
          fuelType: formData.fuelType,
          exteriorCondition: formData.exteriorCondition,
          interiorCondition: formData.interiorCondition,
          notes: formData.notes || ''
        },
        vehicleImages: formData.vehicleImages || [],
        vehicleVideos: formData.vehicleVideos || [],
        documentImages: formData.documentImages || [],
        documentVideos: formData.documentVideos || [],
        damageImages: formData.damageImages || [],
        damageVideos: formData.damageVideos || [],
        damages: [],
        newDamages: [],
        signatures: [],
        kilometersUsed: fees.kilometersUsed,
        kilometerOverage: fees.kilometerOverage,
        kilometerFee: fees.kilometerFee,
        fuelUsed: fees.fuelUsed,
        fuelFee: fees.fuelFee,
        totalExtraFees: fees.totalExtraFees,
        depositRefund: fees.depositRefund,
        additionalCharges: fees.additionalCharges,
        finalRefund: fees.finalRefund,
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

      console.log('📝 Protocol object created:', protocol);

      // API call
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api';
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      console.log('🚀 Sending return protocol to API...');
      
      const response = await fetch(`${apiBaseUrl}/protocols/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(protocol)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Return protocol saved successfully:', result);
      
      onSave(result.protocol);
      onClose();
      
    } catch (error) {
      console.error('❌ Error saving return protocol:', error);
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
          Preberací protokol - {rental.vehicle?.licensePlate || 'Vozidlo'}
        </Typography>
        <IconButton onClick={onClose} size="large">
          <Close />
        </IconButton>
      </Box>

      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Ukladám protokol...
          </Typography>
        </Box>
      )}

      {/* Info o preberacom protokole */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Navzäuje na odovzdávací protokol #{handoverProtocol.id.slice(-8)} z {new Date(handoverProtocol.createdAt).toLocaleString('sk-SK')}
      </Alert>

      {/* Základné informácie */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
            Základné informácie
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            <TextField
              label="Miesto vrátenia *"
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
            Stav vozidla pri vrátení
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Pri preberaní: {handoverProtocol.vehicleCondition.odometer} km, {handoverProtocol.vehicleCondition.fuelLevel}% paliva
          </Alert>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <TextField
              label="Aktuálny stav tachometra (km)"
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

      {/* Prepočet poplatkov */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <Calculate sx={{ mr: 1, verticalAlign: 'middle' }} />
            Prepočet poplatkov (automaticky)
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <TextField
              label="Najazdené km"
              value={fees.kilometersUsed}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Prekročenie km"
              value={fees.kilometerOverage}
              InputProps={{ readOnly: true }}
              color={fees.kilometerOverage > 0 ? 'warning' : 'primary'}
              fullWidth
            />
            <TextField
              label="Poplatok za km"
              value={`${fees.kilometerFee.toFixed(2)} EUR`}
              InputProps={{ readOnly: true }}
              color={fees.kilometerFee > 0 ? 'warning' : 'primary'}
              fullWidth
            />
            <TextField
              label="Spotrebované palivo (%)"
              value={fees.fuelUsed}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Poplatok za palivo"
              value={`${fees.fuelFee.toFixed(2)} EUR`}
              InputProps={{ readOnly: true }}
              color={fees.fuelFee > 0 ? 'warning' : 'primary'}
              fullWidth
            />
            <TextField
              label="Celkové poplatky"
              value={`${fees.totalExtraFees.toFixed(2)} EUR`}
              InputProps={{ readOnly: true }}
              color={fees.totalExtraFees > 0 ? 'warning' : 'primary'}
              fullWidth
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <TextField
              label="Vratenie z depozitu"
              value={`${fees.depositRefund.toFixed(2)} EUR`}
              InputProps={{ readOnly: true }}
              color="success"
              fullWidth
            />
            <TextField
              label="Doplatok"
              value={`${fees.additionalCharges.toFixed(2)} EUR`}
              InputProps={{ readOnly: true }}
              color={fees.additionalCharges > 0 ? 'error' : 'primary'}
              fullWidth
            />
            <TextField
              label="Finálny refund"
              value={`${fees.finalRefund.toFixed(2)} EUR`}
              InputProps={{ readOnly: true }}
              color="success"
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
          {loading ? 'Ukladám...' : 'Uložiť protokol'}
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
          protocolType="return"
          mediaType={activePhotoCapture as 'vehicle' | 'document' | 'damage'}
        />
      )}
    </Box>
  );
} 