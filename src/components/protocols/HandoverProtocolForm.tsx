import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Assignment,
  CarRental,
  LocationOn,
  AccessTime,
  CheckCircle,
  RadioButtonUnchecked,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Photo as PhotoIcon,
  Description as DescriptionIcon,
  PhotoCamera,
  Draw as DrawIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Rental, HandoverProtocol, VehicleCondition, ProtocolDamage, ProtocolSignature, ProtocolImage, ProtocolVideo } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import SerialPhotoCapture from '../common/SerialPhotoCapture';

interface HandoverProtocolFormProps {
  open: boolean;
  rental: Rental;
  onSave: (protocolData: any) => Promise<void>;
  onClose: () => void;
}

const HandoverProtocolForm: React.FC<HandoverProtocolFormProps> = ({ open, rental, onSave, onClose }) => {
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  // Generuj UUID len raz pri vytvorení komponentu
  const [protocolId] = useState(() => uuidv4());
  
  const [protocol, setProtocol] = useState<Partial<HandoverProtocol>>({
    id: protocolId,
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
      deposit: rental.deposit || 0,
      currency: 'EUR',
      allowedKilometers: rental.allowedKilometers || 0,
      extraKilometerRate: rental.extraKilometerRate || 0.50,
    },
    emailSent: false,
    createdBy: state.user?.username || '',
  });

  const steps = [
    { label: 'Základné informácie', description: 'Automaticky načítané údaje o prenájme' },
    { label: 'Stav vozidla', description: 'Zadajte kilometre a stav paliva' },
    { label: 'Fotodokumentácia', description: 'Nafotite vozidlo a doklady' },
    { label: 'Škody a poznámky', description: 'Zdokumentujte poškodenia' },
    { label: 'Podpisy', description: 'Elektronický podpis s časovou pečiatkou' },
  ];

  // Načítanie údajov o prenájme
  useEffect(() => {
    setProtocol(prev => ({ 
      ...prev, 
      location: rental.handoverPlace || rental.pickupLocation || 'Miesto prevzatia', // Automatické miesto
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
        extraKilometerRate: rental.extraKilometerRate || 0.50,
      }
    }));
  }, [rental]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Mapovanie na backend format - vždy posielaj všetky polia
      const protocolData = {
        id: protocol.id || protocolId, // Fallback na protocolId ak sa stratil
        rentalId: protocol.rentalId,
        location: protocol.location || '',
        vehicleCondition: protocol.vehicleCondition || {
          odometer: 0,
          fuelLevel: 100,
          fuelType: 'Benzín',
          exteriorCondition: 'Dobrý',
          interiorCondition: 'Dobrý',
          notes: ''
        },
        vehicleImages: protocol.vehicleImages || [],
        vehicleVideos: protocol.vehicleVideos || [],
        documentImages: protocol.documentImages || [],
        damageImages: protocol.damageImages || [],
        damages: protocol.damages || [],
        signatures: protocol.signatures || [],
        rentalData: protocol.rentalData || {},
        notes: protocol.notes || '',
        createdBy: protocol.createdBy || '',
        status: 'completed',
        completedAt: new Date(),
      };
      
      // Debug log
      console.log('ProtocolData:', protocolData);
      
      await onSave(protocolData);
      onClose();
    } catch (error) {
      console.error('Error saving protocol:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDamage = () => {
    const newDamage: ProtocolDamage = {
      id: uuidv4(),
      description: '',
      severity: 'low',
      location: '',
      images: [],
      timestamp: new Date(),
    };
    setProtocol(prev => ({
      ...prev,
      damages: [...(prev.damages || []), newDamage],
    }));
  };

  const removeDamage = (id: string) => {
    setProtocol(prev => ({
      ...prev,
      damages: (prev.damages || []).filter(damage => damage.id !== id),
    }));
  };

  const updateDamage = (id: string, field: keyof ProtocolDamage, value: any) => {
    setProtocol(prev => ({
      ...prev,
      damages: (prev.damages || []).map(damage =>
        damage.id === id ? { ...damage, [field]: value } : damage
      ),
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

  // Funkcie pre fotky
  const handleMediaSave = (type: 'vehicle' | 'document' | 'damage', images: ProtocolImage[], videos: ProtocolVideo[]) => {
    setProtocol(prev => ({
      ...prev,
      [`${type}Images`]: images,
      [`${type}Videos`]: videos,
    }));
    setActivePhotoCapture(null);
  };

  // Funkcia pre elektronický podpis
  const handleSignatureSave = (signature: string, signerName: string) => {
    const newSignature: ProtocolSignature = {
      id: uuidv4(),
      signature,
      signerName,
      signerRole: 'employee',
      timestamp: new Date(),
      location: protocol.location || 'Miesto prevzatia',
      ipAddress: 'N/A', // V browseri nemôžeme získať IP
    };

    setProtocol(prev => ({
      ...prev,
      signatures: [...(prev.signatures || []), newSignature],
    }));
    setShowSignaturePad(false);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box flex="1" minWidth="300px">
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Informácie o prenájme
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Číslo objednávky"
                      value={protocol.rentalData?.orderNumber || ''}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                    />
                    <TextField
                      label="Miesto prevzatia"
                      value={protocol.location || ''}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                      helperText="Automaticky načítané z prenájmu"
                    />
                    <TextField
                      label="Čas prevzatia"
                      value={new Date().toLocaleString('sk-SK')}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            <Box flex="1" minWidth="300px">
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <CarRental sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Informácie o vozidle
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Značka a model"
                      value={`${protocol.rentalData?.vehicle?.brand || ''} ${protocol.rentalData?.vehicle?.model || ''}`}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                    />
                    <TextField
                      label="ŠPZ"
                      value={protocol.rentalData?.vehicle?.licensePlate || ''}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box display="flex" gap={3} flexWrap="wrap">
            <Box flex="1" minWidth="300px">
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Stav vozidla
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Kilometre"
                      type="number"
                      value={protocol.vehicleCondition?.odometer || 0}
                      onChange={(e) => handleVehicleConditionChange('odometer', parseInt(e.target.value) || 0)}
                      variant="outlined"
                      fullWidth
                    />
                    <TextField
                      label="Stav paliva (%)"
                      type="number"
                      value={protocol.vehicleCondition?.fuelLevel || 100}
                      onChange={(e) => handleVehicleConditionChange('fuelLevel', parseInt(e.target.value) || 0)}
                      variant="outlined"
                      fullWidth
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Fotodokumentácia
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
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
                </Box>
                
                {/* Media summary */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${(protocol.vehicleImages?.length || 0) + (protocol.documentImages?.length || 0)} fotiek`}
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
          </Box>
        );



      case 3:
        return (
          <Box>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Škody a poškodenia
                  </Typography>
                  <Button startIcon={<AddIcon />} onClick={addDamage}>
                    Pridať škodu
                  </Button>
                </Box>
                
                {(protocol.damages || []).length === 0 ? (
                  <Alert severity="info">Žiadne škody neboli zaznamenané</Alert>
                ) : (
                  <List>
                    {(protocol.damages || []).map((damage, index) => (
                      <ListItem key={damage.id} divider>
                        <ListItemAvatar>
                          <Avatar>
                            <DescriptionIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <TextField
                              label="Popis škody"
                              value={damage.description}
                              onChange={(e) => updateDamage(damage.id, 'description', e.target.value)}
                              variant="outlined"
                              fullWidth
                              size="small"
                            />
                          }
                          secondary={
                            <Box display="flex" gap={1} mt={1}>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Závažnosť</InputLabel>
                                <Select
                                  value={damage.severity}
                                  label="Závažnosť"
                                  onChange={(e) => updateDamage(damage.id, 'severity', e.target.value)}
                                >
                                  <MenuItem value="low">Nízka</MenuItem>
                                  <MenuItem value="medium">Stredná</MenuItem>
                                  <MenuItem value="high">Vysoká</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                label="Lokalizácia"
                                value={damage.location}
                                onChange={(e) => updateDamage(damage.id, 'location', e.target.value)}
                                variant="outlined"
                                size="small"
                                sx={{ flex: 1 }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeDamage(damage.id)}
                                color="error"
                              >
                                <RemoveIcon />
                              </IconButton>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <DrawIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Elektronický podpis
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Poznámky"
                    multiline
                    rows={3}
                    value={protocol.notes || ''}
                    onChange={(e) => setProtocol(prev => ({ ...prev, notes: e.target.value }))}
                    variant="outlined"
                    fullWidth
                  />
                  
                  {(protocol.signatures || []).length === 0 ? (
                    <Alert severity="info">
                      Kliknite na tlačidlo nižšie pre pridanie elektronického podpisu s časovou pečiatkou.
                    </Alert>
                  ) : (
                    <Alert severity="success">
                      Podpis bol úspešne pridaný: {protocol.signatures?.[0]?.signerName} - {protocol.signatures?.[0]?.timestamp.toLocaleString('sk-SK')}
                    </Alert>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<DrawIcon />}
                    onClick={() => setShowSignaturePad(true)}
                    disabled={(protocol.signatures || []).length > 0}
                  >
                    Pridať elektronický podpis
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Protokol o prevzatí vozidla
      </Typography>
      
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {step.description}
              </Typography>
              {renderStepContent(index)}
              <Box sx={{ mb: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={index === steps.length - 1 ? handleSave : handleNext}
                  sx={{ mr: 1 }}
                >
                  {index === steps.length - 1 ? 'Uložiť protokol' : 'Ďalej'}
                </Button>
                <Button
                  disabled={index === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Späť
                </Button>
                <Button onClick={onClose}>
                  Zrušiť
                </Button>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

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

      {/* Signature pad dialog */}
      {showSignaturePad && (
        <Dialog
          open={showSignaturePad}
          onClose={() => setShowSignaturePad(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <DrawIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Elektronický podpis
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Podpíšte sa nižšie. Podpis bude uložený s časovou pečiatkou: {new Date().toLocaleString('sk-SK')}
            </Typography>
            <TextField
              label="Meno podpisujúceho"
              value={state.user?.username || ''}
              InputProps={{ readOnly: true }}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 1,
                p: 2,
                textAlign: 'center',
                minHeight: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9f9f9'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Tu bude canvas pre podpis (implementácia v ďalšom kroku)
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSignaturePad(false)}>
              Zrušiť
            </Button>
            <Button
              variant="contained"
              onClick={() => handleSignatureSave('base64_signature_data', state.user?.username || 'admin')}
            >
              Uložiť podpis
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default HandoverProtocolForm; 