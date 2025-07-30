import React, { useState, useContext, useEffect, useMemo, useCallback, memo } from 'react';
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
import { HandoverProtocol, Rental, ProtocolImage, ProtocolVideo, ProtocolSignature, Vehicle } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import SerialPhotoCapture from '../common/SerialPhotoCapture';
import SignaturePad from '../common/SignaturePad';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { getSmartDefaults, cacheFormDefaults, cacheCompanyDefaults } from '../../utils/protocolFormCache';

interface HandoverProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  onSave: (protocol: HandoverProtocol) => void;
}

// 🚀 OPTIMALIZÁCIA: Photo capture button component
const PhotoCaptureButton = memo<{
  mediaType: string;
  label: string;
  icon: React.ReactNode;
  onCapture: (mediaType: string) => void;
}>(({ mediaType, label, icon, onCapture }) => {
  const handleClick = useCallback(() => {
    onCapture(mediaType);
  }, [mediaType, onCapture]);

  return (
    <Button
      variant="outlined"
      startIcon={icon}
      onClick={handleClick}
      fullWidth
      sx={{ mb: 1 }}
    >
      {label}
    </Button>
  );
});

// 🚀 OPTIMALIZÁCIA: Signature display component
const SignatureDisplay = memo<{
  signature: ProtocolSignature;
  onRemove: (id: string) => void;
}>(({ signature, onRemove }) => {
  const handleRemove = useCallback(() => {
    onRemove(signature.id);
  }, [signature.id, onRemove]);

  return (
    <Chip
      key={signature.id}
      label={`${signature.signerName} (${signature.signerRole === 'customer' ? 'Zákazník' : 'Zamestnanec'})`}
      onDelete={handleRemove}
      color={signature.signerRole === 'customer' ? 'primary' : 'secondary'}
      sx={{ mr: 1, mb: 1 }}
    />
  );
});

const HandoverProtocolForm = memo<HandoverProtocolFormProps>(({ open, onClose, rental, onSave }) => {
  const { state } = useAuth();
  const { state: appState } = useApp();
  const [loading, setLoading] = useState(false);
  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSigner, setCurrentSigner] = useState<{name: string, role: 'customer' | 'employee'} | null>(null);
  
  // 🚀 OPTIMALIZÁCIA: Vehicle indexing pre rýchle vyhľadávanie
  const vehicleIndex = useMemo(() => {
    const index = new Map<string, Vehicle>();
    appState.vehicles.forEach(vehicle => {
      index.set(vehicle.id, vehicle);
    });
    return index;
  }, [appState.vehicles]);
  
  // 🚀 OPTIMALIZÁCIA: Okamžité získanie vehicle data bez useEffect
  const currentVehicle = useMemo(() => {
    // Priorita: rental.vehicle > indexované vozidlo > null
    if (rental?.vehicle) {
      return rental.vehicle;
    }
    if (rental?.vehicleId) {
      return vehicleIndex.get(rental.vehicleId) || null;
    }
    return null;
  }, [rental, vehicleIndex]);

  // 🔄 SMART CACHING: Načítanie cached hodnôt pre rýchlejšie vyplnenie
  const smartDefaults = useMemo(() => {
    const companyName = currentVehicle?.company;
    return getSmartDefaults(companyName);
  }, [currentVehicle?.company]);

  // 🚀 OPTIMALIZÁCIA: Memoized form data initialization s smart defaults
  const initialFormData = useMemo(() => ({
    location: rental.pickupLocation || rental.handoverPlace || smartDefaults.location || '',
    odometer: rental.odometer || undefined,
    fuelLevel: rental.fuelLevel || smartDefaults.fuelLevel || 100,
    depositPaymentMethod: smartDefaults.depositPaymentMethod || 'cash' as 'cash' | 'bank_transfer' | 'card',
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
  }), [rental, smartDefaults]);
  
  // Zjednodušený state - iba základné polia
  const [formData, setFormData] = useState(initialFormData);

  // 🚀 OPTIMALIZÁCIA: Memoized input change handler
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 🚀 OPTIMALIZÁCIA: Memoized photo capture handler  
  const handlePhotoCapture = useCallback((mediaType: string) => {
    setActivePhotoCapture(mediaType);
  }, []);

  // 🚀 OPTIMALIZÁCIA: Memoized photo capture success handler
  const handlePhotoCaptureSuccess = useCallback((mediaType: string, images: ProtocolImage[], videos: ProtocolVideo[]) => {
    setFormData(prev => ({
      ...prev,
      [`${mediaType}Images`]: images,
      [`${mediaType}Videos`]: videos,
    }));
    setActivePhotoCapture(null);
  }, []);

  // 🚀 OPTIMALIZÁCIA: Memoized signature handlers
  const handleAddSignature = useCallback((signerName: string, signerRole: 'customer' | 'employee') => {
    console.log('🖊️ Adding signature:', { signerName, signerRole, rentalCustomer: rental.customer?.name, rentalCustomerName: rental.customerName });
    setCurrentSigner({ name: signerName, role: signerRole });
    setShowSignaturePad(true);
  }, [rental.customer?.name, rental.customerName]);

  const handleSignatureSave = useCallback((signatureData: ProtocolSignature) => {
    setFormData(prev => ({
      ...prev,
      signatures: [...prev.signatures, signatureData]
    }));
    setShowSignaturePad(false);
    setCurrentSigner(null);
  }, []);

  const handleRemoveSignature = useCallback((signatureId: string) => {
    setFormData(prev => ({
      ...prev,
      signatures: prev.signatures.filter(sig => sig.id !== signatureId)
    }));
  }, []);

  // 🚀 OPTIMALIZÁCIA: Memoized format functions
  const formatDate = useCallback((date: Date | string) => {
    if (!date) return 'Neuvedené';
    const d = new Date(date);
    return d.toLocaleDateString('sk-SK') + ' ' + d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return amount ? `${amount.toFixed(2)} €` : '0,00 €';
  }, []);

  // 🚀 OPTIMALIZÁCIA: Quick Save - najprv uloží protokol, PDF na pozadí
  const handleSave = useCallback(async () => {
    // Validácia povinných polí
    const errors: string[] = [];
    
    if (!formData.location || formData.location.trim() === '') {
      errors.push('Zadajte miesto prevzatia');
    }
    
    if (formData.odometer === undefined || formData.odometer === null || formData.odometer < 0) {
      errors.push('Zadajte stav tachometra');
    }
    
    if (formData.fuelLevel === undefined || formData.fuelLevel === null || formData.fuelLevel < 0 || formData.fuelLevel > 100) {
      errors.push('Zadajte stav paliva (0-100%)');
    }
    
    // Kontrola podpisov
    const customerSignature = formData.signatures.find(sig => sig.signerRole === 'customer');
    const employeeSignature = formData.signatures.find(sig => sig.signerRole === 'employee');
    
    if (!customerSignature) {
      errors.push('Povinný je podpis zákazníka');
    }
    
    if (!employeeSignature) {
      errors.push('Povinný je podpis zamestnanca');
    }
    
    if (!formData.depositPaymentMethod) {
      errors.push('Vyberte spôsob úhrady depozitu');
    }
    
    if (errors.length > 0) {
      alert(`❌ Prosím vyplňte všetky povinné polia:\n\n${errors.join('\n')}`);
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
          odometer: formData.odometer || 0,
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

      // 🚀 QUICK SAVE: Uloženie protokolu s flag-om pre background PDF
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://blackrent-app-production-4d6f.up.railway.app/api'
        : 'http://localhost:3001/api';
      const token = localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
      
      console.log('⚡ QUICK SAVE: Sending protocol data...');
      const quickSaveStart = Date.now();
      
      const response = await fetch(`${apiBaseUrl}/protocols/handover?mode=quick`, {
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
      const quickSaveTime = Date.now() - quickSaveStart;
      
      console.log(`✅ QUICK SAVE: Protocol saved in ${quickSaveTime}ms`);
      console.log('📄 PDF will be generated in background');
      
      // 🔄 SMART CACHING: Uloženie často používaných hodnôt pre budúce použitie
      const cacheData = {
        location: formData.location,
        fuelLevel: formData.fuelLevel,
        depositPaymentMethod: formData.depositPaymentMethod,
        notes: formData.notes,
      };
      
      // Global cache
      cacheFormDefaults(cacheData);
      
      // Company-specific cache ak máme company
      if (currentVehicle?.company) {
        cacheCompanyDefaults(currentVehicle.company, cacheData);
      }
      
      console.log('🔄 Form defaults cached for future use');
      
      // ⚡ OKAMŽITÉ ZATVORENIE - bez čakania na PDF
      onSave(result.protocol);
      onClose();
      
      // 🎯 BACKGROUND PDF DOWNLOAD - na pozadí (neblokuje UI)
      if (result.protocol?.pdfProxyUrl) {
        setTimeout(async () => {
          try {
            console.log('📄 Background PDF download starting...');
            const pdfResponse = await fetch(`${apiBaseUrl}${result.protocol.pdfProxyUrl}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token')}`
              }
            });
            if (pdfResponse.ok) {
              const pdfBlob = await pdfResponse.blob();
              const url = URL.createObjectURL(pdfBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `odovzdavaci_protokol_${currentVehicle?.licensePlate || 'vozidlo'}_${new Date().toISOString().split('T')[0]}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              console.log('✅ Background PDF download completed');
            }
          } catch (pdfError) {
            console.warn('PDF background download failed:', pdfError);
          }
        }, 100); // Start po 100ms pre smooth UX
      }
      
    } catch (error) {
      console.error('Error saving protocol:', error);
      alert('Chyba pri ukladaní protokolu: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    } finally {
      setLoading(false);
    }
  }, [formData, rental, currentVehicle, onSave, onClose]);

  // 🔥 EARLY RETURN - PO všetkých hooks
  if (!open) return null;

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
          Odovzdávací protokol - {currentVehicle?.licensePlate || 'Vozidlo'}
        </Typography>
        <IconButton onClick={onClose} size="large">
          <Close />
        </IconButton>
      </Box>

      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            ⚡ Rýchle ukladanie protokolu...
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
                {currentVehicle?.brand} {currentVehicle?.model}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                ŠPZ
              </Typography>
              <Chip 
                label={currentVehicle?.licensePlate || rental.vehicleCode || 'Neuvedené'} 
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
                label={currentVehicle?.status || 'available'} 
                color={currentVehicle?.status === 'available' ? 'success' : 'warning'}
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
              label="Stav tachometra (km) *"
              type="number"
              value={formData.odometer || ''}
              onChange={(e) => handleInputChange('odometer', e.target.value ? parseInt(e.target.value) : undefined)}
              fullWidth
              required
              helperText="Aktuálny stav kilometrov na vozidle"
            />
            <TextField
              label="Úroveň paliva (%) *"
              type="number"
              value={formData.fuelLevel}
              onChange={(e) => handleInputChange('fuelLevel', parseInt(e.target.value) || 100)}
              inputProps={{ min: 0, max: 100 }}
              fullWidth
              required
              helperText="Percentuálna úroveň paliva v nádrži"
            />
            <FormControl fullWidth required>
              <InputLabel>Spôsob úhrady depozitu *</InputLabel>
              <Select
                value={formData.depositPaymentMethod}
                onChange={(e) => handleInputChange('depositPaymentMethod', e.target.value)}
                label="Spôsob úhrady depozitu *"
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
              onClick={() => handlePhotoCapture('vehicle')}
              size="large"
            >
              Fotky vozidla ({formData.vehicleImages.length})
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => handlePhotoCapture('document')}
              size="large"
            >
              Dokumenty ({formData.documentImages.length})
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => handlePhotoCapture('damage')}
              size="large"
            >
              Poškodenia ({formData.damageImages.length})
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => handlePhotoCapture('odometer')}
              size="large"
            >
              Fotka km ({formData.odometerImages.length})
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => handlePhotoCapture('fuel')}
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
              {formData.signatures.map((signature) => (
                <SignatureDisplay
                  key={signature.id}
                  signature={signature}
                  onRemove={handleRemoveSignature}
                />
              ))}
            </Box>
          )}
          
          {/* Tlačidlá pre pridanie podpisov */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => handleAddSignature(
                rental.customer?.name || rental.customerName || 'Zákazník', 
                'customer'
              )}
              startIcon={<Person />}
              color={formData.signatures.find(sig => sig.signerRole === 'customer') ? 'success' : 'primary'}
            >
              Podpis zákazníka *
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleAddSignature(
                `${state.user?.firstName || ''} ${state.user?.lastName || ''}`.trim() || 'Zamestnanec', 
                'employee'
              )}
              startIcon={<Person />}
              color={formData.signatures.find(sig => sig.signerRole === 'employee') ? 'success' : 'primary'}
            >
              Podpis zamestnanca *
            </Button>
          </Box>
          
          {/* Indikátor povinných podpisov */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              * Povinné polia - musia byť vyplnené pred uložením protokolu
            </Typography>
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
          entityId={rental.id}
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
});

// Set display name for debugging
HandoverProtocolForm.displayName = 'HandoverProtocolForm';

export default HandoverProtocolForm; 