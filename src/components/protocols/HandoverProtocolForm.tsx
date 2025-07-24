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
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  Save,
  Close,
  PhotoCamera,
  LocationOn,
  SpeedOutlined,
  Person,
  DirectionsCar,
  Receipt,
} from '@mui/icons-material';
import { HandoverProtocol, Rental, ProtocolImage, ProtocolVideo, ProtocolSignature } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import SerialPhotoCapture from '../common/SerialPhotoCapture';
import SignaturePad from '../common/SignaturePad';

interface HandoverProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  onSave: (protocol: HandoverProtocol) => void;
}

export default function HandoverProtocolForm({ open, onClose, rental, onSave }: HandoverProtocolFormProps) {
  const [loading, setLoading] = useState(false);
  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSigner, setCurrentSigner] = useState<{name: string, role: 'customer' | 'employee'} | null>(null);
  
  // Zjednodušený state - iba základné polia
  const [formData, setFormData] = useState({
    location: rental.pickupLocation || rental.handoverPlace || '',
    odometer: rental.odometer || 0,
    fuelLevel: rental.fuelLevel || 100,
    depositPaymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'card',
    notes: '',
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

  const handleAddSignature = (signerName: string, signerRole: 'customer' | 'employee') => {
    setCurrentSigner({ name: signerName, role: signerRole });
    setShowSignaturePad(true);
  };

  const handleSignatureSave = (signatureData: ProtocolSignature) => {
    setFormData(prev => ({
      ...prev,
      signatures: [...prev.signatures, signatureData]
    }));
    setShowSignaturePad(false);
    setCurrentSigner(null);
  };

  const handleRemoveSignature = (signatureId: string) => {
    setFormData(prev => ({
      ...prev,
      signatures: prev.signatures.filter(sig => sig.id !== signatureId)
    }));
  };

  // Pomocné funkcie pre formátovanie dát
  const formatDate = (date: Date | string) => {
    if (!date) return 'Neuvedené';
    const d = new Date(date);
    return d.toLocaleDateString('sk-SK') + ' ' + d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return amount ? `${amount.toFixed(2)} €` : '0,00 €';
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
          fuelType: 'gasoline',
          exteriorCondition: 'Dobrý',
          interiorCondition: 'Dobrý',
        },
        vehicleImages: formData.vehicleImages,
        vehicleVideos: formData.vehicleVideos,
        documentImages: formData.documentImages,
        documentVideos: formData.documentVideos,
        damageImages: formData.damageImages,
        damageVideos: formData.damageVideos,
        damages: [],
        signatures: formData.signatures,
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
          pickupLocation: rental.pickupLocation || rental.handoverPlace,
          returnLocation: rental.returnLocation,
          returnConditions: rental.returnConditions,
        },
        pdfUrl: '',
        emailSent: false,
        notes: `${formData.notes}${formData.notes ? '\n' : ''}Spôsob úhrady depozitu: ${
          formData.depositPaymentMethod === 'cash' ? 'Hotovosť' :
          formData.depositPaymentMethod === 'bank_transfer' ? 'Bankový prevod' :
          'Kartová zábezpeka'
        }`,
        createdBy: 'admin',
      };

      // Vyčisti media objekty pred odoslaním - odstráni problematické properties
      const cleanedProtocol = {
        ...protocol,
        // Vyčisti nested rental objekt - odstráni problematické properties
        rental: protocol.rental ? {
          ...protocol.rental,
          // Ak rental obsahuje media properties, vyčisti ich
          vehicleImages: undefined,
          vehicleVideos: undefined,
          documentImages: undefined,
          damageImages: undefined,
        } : undefined,
        // Vyčisti main protocol media arrays
        vehicleImages: (protocol.vehicleImages || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          type: img.type,
          mediaType: img.mediaType,
          description: img.description || '',
          timestamp: img.timestamp
        })),
        vehicleVideos: (protocol.vehicleVideos || []).map((vid: any) => ({
          id: vid.id,
          url: vid.url,
          type: vid.type,
          mediaType: vid.mediaType,
          description: vid.description || '',
          timestamp: vid.timestamp
        })),
        documentImages: (protocol.documentImages || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          type: img.type,
          mediaType: img.mediaType,
          description: img.description || '',
          timestamp: img.timestamp
        })),
        damageImages: (protocol.damageImages || []).map((img: any) => ({
          id: img.id,
          url: img.url,
          type: img.type,
          mediaType: img.mediaType,
          description: img.description || '',
          timestamp: img.timestamp
        }))
      };

      console.log('🧹 Cleaned handover protocol for DB:', cleanedProtocol);

      // API call
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://blackrent-app-production-4d6f.up.railway.app/api';
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      const response = await fetch(`${apiBaseUrl}/protocols/handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(cleanedProtocol)
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
            link.download = `odovzdavaci_protokol_${rental.vehicle?.licensePlate || 'vozidlo'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
          Odovzdávací protokol - {rental.vehicle?.licensePlate || 'Vozidlo'}
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

      {/* Informácie o objednávke */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
            Informácie o objednávke
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Číslo objednávky
              </Typography>
              <Chip 
                label={rental.orderNumber || 'Neuvedené'} 
                color="primary" 
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Dátum začiatku
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                {formatDate(rental.startDate)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Dátum konca
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                {formatDate(rental.endDate)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Celková cena
              </Typography>
              <Typography variant="body1" color="success.main" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(rental.totalPrice)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Depozit
              </Typography>
              <Typography variant="body1" color="warning.main" sx={{ fontWeight: 'medium' }}>
                {formatCurrency(rental.deposit || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Povolené kilometry
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                {rental.allowedKilometers ? `${rental.allowedKilometers} km` : 'Neobmedzené'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Cena za extra km
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                {formatCurrency(rental.extraKilometerRate || 0.5)} / km
              </Typography>
            </Grid>
            {(rental.pickupLocation || rental.handoverPlace) && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Miesto prevzatia
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {rental.pickupLocation || rental.handoverPlace}
                </Typography>
              </Grid>
            )}
            {rental.returnLocation && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Miesto vrátenia
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {rental.returnLocation}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Informácie o zákazníkovi */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
            Informácie o zákazníkovi
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Meno
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'bold' }}>
                {rental.customer?.name || rental.customerName || 'Neuvedené'}
              </Typography>
            </Grid>
            {(rental.customer?.email || rental.customerEmail) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {rental.customer?.email || rental.customerEmail}
                </Typography>
              </Grid>
            )}
            {(rental.customer?.phone || rental.customerPhone) && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Telefón
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {rental.customer?.phone || rental.customerPhone}
                </Typography>
              </Grid>
            )}
            {rental.customerAddress && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Adresa
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                  {rental.customerAddress}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Informácie o vozidle a majiteľovi */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <DirectionsCar sx={{ mr: 1, verticalAlign: 'middle' }} />
            Informácie o vozidle
          </Typography>
          
          <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Značka a model
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'bold' }}>
                {rental.vehicle?.brand} {rental.vehicle?.model}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                ŠPZ
              </Typography>
              <Chip 
                label={rental.vehicle?.licensePlate || rental.vehicleCode || 'Neuvedené'} 
                color="secondary" 
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Stav vozidla
              </Typography>
              <Chip 
                label={rental.vehicle?.status || 'available'} 
                color={rental.vehicle?.status === 'available' ? 'success' : 'warning'}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Základné informácie protokolu */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
            Údaje protokolu
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            <TextField
              label="Miesto prevzatia *"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              fullWidth
              required
              placeholder="Zadajte presné miesto prevzatia vozidla"
            />
            <TextField
              label="Poznámky k protokolu"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Dodatočné poznámky k odovzdávaniu vozidla"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Stav vozidla */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
            <SpeedOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
            Stav vozidla pri odovzdaní
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <TextField
              label="Stav tachometra (km)"
              type="number"
              value={formData.odometer}
              onChange={(e) => handleInputChange('odometer', parseInt(e.target.value) || 0)}
              fullWidth
              helperText="Aktuálny stav kilometrov na vozidle"
            />
            <TextField
              label="Úroveň paliva (%)"
              type="number"
              value={formData.fuelLevel}
              onChange={(e) => handleInputChange('fuelLevel', parseInt(e.target.value) || 100)}
              inputProps={{ min: 0, max: 100 }}
              fullWidth
              helperText="Percentuálna úroveň paliva v nádrži"
            />
            <FormControl fullWidth>
              <InputLabel>Spôsob úhrady depozitu</InputLabel>
              <Select
                value={formData.depositPaymentMethod}
                onChange={(e) => handleInputChange('depositPaymentMethod', e.target.value)}
                label="Spôsob úhrady depozitu"
              >
                <MenuItem value="cash">Hotovosť</MenuItem>
                <MenuItem value="bank_transfer">Bankový prevod</MenuItem>
                <MenuItem value="card">Kartová zábezpeka</MenuItem>
              </Select>
            </FormControl>
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
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => setActivePhotoCapture('odometer')}
              size="large"
            >
              Fotka km ({formData.odometerImages.length})
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => setActivePhotoCapture('fuel')}
              size="large"
            >
              Fotka paliva ({formData.fuelImages.length})
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
              {formData.signatures.map((signature, index) => (
                <Card key={signature.id} variant="outlined" sx={{ mb: 1, p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                          objectFit: 'contain'
                        }} 
                      />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {signature.signerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {signature.signerRole === 'customer' ? 'Zákazník' : 'Zamestnanec'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📅 {new Date(signature.timestamp).toLocaleString('sk-SK')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          📍 {signature.location}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton 
                      onClick={() => handleRemoveSignature(signature.id)}
                      color="error"
                      size="small"
                    >
                      <Close />
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
              onClick={() => handleAddSignature(rental.customer?.name || 'Zákazník', 'customer')}
              startIcon={<Person />}
            >
              Podpis zákazníka
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleAddSignature('Zamestnanec', 'employee')}
              startIcon={<Person />}
            >
              Podpis zamestnanca
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tlačidlá */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3, mb: 2 }}>
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
          allowedTypes={['vehicle', 'document', 'damage', 'odometer', 'fuel']}
          entityId={uuidv4()}
          protocolType="handover"
          mediaType={activePhotoCapture as 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel'}
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
            p: 2
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
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