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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  useMediaQuery,
  useTheme,
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
  CheckCircle,
  Error,
  Info,
  CarRental,
  Person,
  Assignment,
  Description,
  Build,
  Create,
  Send,
  Delete,
  Edit,
} from '@mui/icons-material';
import { HandoverProtocol, Rental, ProtocolImage, ProtocolVideo, VehicleCondition, ProtocolDamage } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import SerialPhotoCapture from '../common/SerialPhotoCapture';

interface HandoverProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  onSave: (protocol: HandoverProtocol) => void;
}

const steps = [
  {
    label: 'Základné informácie',
    description: 'Overenie dát prenájmu a vozidla',
    icon: <Info />,
  },
  {
    label: 'Stav vozidla',
    description: 'Zápis stavu vozidla, tachometer, palivo',
    icon: <CarRental />,
  },
  {
    label: 'Fotodokumentácia',
    description: 'Fotografie vozidla a dokumentov',
    icon: <PhotoCamera />,
  },
  {
    label: 'Poškodenia',
    description: 'Zápis existujúcich poškodení',
    icon: <Build />,
  },
  {
    label: 'Podpisy',
    description: 'Podpisy zákazníka a zamestnanca',
    icon: <Create />,
  },
  {
    label: 'Dokončenie',
    description: 'Generovanie PDF a odoslanie emailu',
    icon: <Send />,
  },
];

export default function HandoverProtocolForm({ open, onClose, rental, onSave }: HandoverProtocolFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [protocol, setProtocol] = useState<Partial<HandoverProtocol>>({
    id: uuidv4(),
    rentalId: rental.id,
    rental,
    type: 'handover',
    status: 'draft',
    createdAt: new Date(),
    location: rental.pickupLocation || '',
    vehicleCondition: {
      odometer: rental.odometer || 0,
      fuelLevel: rental.fuelLevel || 100,
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
      extraKilometerRate: rental.extraKilometerRate || 0,
      pickupLocation: rental.pickupLocation || '',
      returnLocation: rental.returnLocation || '',
      returnConditions: rental.returnConditions || '',
    },
    emailSent: false,
    createdBy: 'current_user', // TODO: získať z auth
    notes: rental.notes || '',
  });

  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(protocol.location && protocol.rentalData?.orderNumber);
      case 1:
        return !!(protocol.vehicleCondition?.odometer && protocol.vehicleCondition?.fuelLevel);
      case 2:
        return (protocol.vehicleImages?.length || 0) > 0;
      case 3:
        return true; // Poškodenia sú voliteľné
      case 4:
        return (protocol.signatures?.length || 0) >= 2;
      case 5:
        return protocol.status === 'completed';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(activeStep)) {
      setActiveStep((prev) => prev + 1);
      setErrors([]);
    } else {
      setErrors(['Prosím vyplňte všetky povinné polia pre tento krok.']);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setErrors([]);
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

  const addDamage = (damage: ProtocolDamage) => {
    setProtocol(prev => ({
      ...prev,
      damages: [...(prev.damages || []), damage],
    }));
  };

  const removeDamage = (damageId: string) => {
    setProtocol(prev => ({
      ...prev,
      damages: prev.damages?.filter(d => d.id !== damageId) || [],
    }));
  };

  const handleSave = async () => {
    setProcessing(true);
    
    try {
      const completeProtocol: HandoverProtocol = {
        ...protocol,
        status: 'completed',
        completedAt: new Date(),
      } as HandoverProtocol;

      await onSave(completeProtocol);
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladaní protokolu:', error);
      setErrors(['Chyba pri ukladaní protokolu. Skúste znovu.']);
    } finally {
      setProcessing(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Informácie o prenájme
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                      onChange={(e) => setProtocol(prev => ({ ...prev, location: e.target.value }))}
                      variant="outlined"
                      fullWidth
                      required
                    />
                    <TextField
                      label="Dátum a čas prevzatia"
                      type="datetime-local"
                      value={protocol.createdAt?.toISOString().slice(0, 16) || ''}
                      onChange={(e) => setProtocol(prev => ({ ...prev, createdAt: new Date(e.target.value) }))}
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Informácie o zákazníkovi
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Meno zákazníka"
                      value={protocol.rentalData?.customer?.name || ''}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                    />
                    <TextField
                      label="Telefón"
                      value={protocol.rentalData?.customer?.phone || ''}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                    />
                    <TextField
                      label="Email"
                      value={protocol.rentalData?.customer?.email || ''}
                      InputProps={{ readOnly: true }}
                      variant="outlined"
                      fullWidth
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <SpeedOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Stav vozidla
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Stav tachometra (km)"
                      type="number"
                      value={protocol.vehicleCondition?.odometer || ''}
                      onChange={(e) => handleVehicleConditionChange('odometer', parseInt(e.target.value))}
                      variant="outlined"
                      fullWidth
                      required
                    />
                    <TextField
                      label="Úroveň paliva (%)"
                      type="number"
                      value={protocol.vehicleCondition?.fuelLevel || ''}
                      onChange={(e) => handleVehicleConditionChange('fuelLevel', parseInt(e.target.value))}
                      variant="outlined"
                      fullWidth
                      required
                      inputProps={{ min: 0, max: 100 }}
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
                        <MenuItem value="electric">Elektrina</MenuItem>
                        <MenuItem value="hybrid">Hybrid</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Stav vozidla
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Stav exteriéru"
                      value={protocol.vehicleCondition?.exteriorCondition || ''}
                      onChange={(e) => handleVehicleConditionChange('exteriorCondition', e.target.value)}
                      variant="outlined"
                      fullWidth
                      multiline
                      rows={2}
                    />
                    <TextField
                      label="Stav interiéru"
                      value={protocol.vehicleCondition?.interiorCondition || ''}
                      onChange={(e) => handleVehicleConditionChange('interiorCondition', e.target.value)}
                      variant="outlined"
                      fullWidth
                      multiline
                      rows={2}
                    />
                    <TextField
                      label="Poznámky"
                      value={protocol.vehicleCondition?.notes || ''}
                      onChange={(e) => handleVehicleConditionChange('notes', e.target.value)}
                      variant="outlined"
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Fotodokumentácia vozidla
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Fotografie vozidla
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      onClick={() => setActivePhotoCapture('vehicle')}
                      fullWidth
                    >
                      Pridať fotografie
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Snímky: {protocol.vehicleImages?.length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Dokumenty
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      onClick={() => setActivePhotoCapture('document')}
                      fullWidth
                    >
                      Pridať dokumenty
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Snímky: {protocol.documentImages?.length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Poškodenia
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      onClick={() => setActivePhotoCapture('damage')}
                      fullWidth
                    >
                      Pridať poškodenia
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Snímky: {protocol.damageImages?.length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Evidencia poškodení
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Zaznamenajte všetky viditeľné poškodenia na vozidle pred prevzatím.
            </Alert>
            <Button
              variant="contained"
              startIcon={<Build />}
              onClick={() => {
                const newDamage: ProtocolDamage = {
                  id: uuidv4(),
                  description: '',
                  severity: 'low',
                  images: [],
                  location: '',
                  timestamp: new Date(),
                  fromPreviousProtocol: false,
                };
                addDamage(newDamage);
              }}
              sx={{ mb: 2 }}
            >
              Pridať poškodenie
            </Button>
            <List>
              {protocol.damages?.map((damage, index) => (
                <ListItem key={damage.id} divider>
                  <ListItemText
                    primary={`Poškodenie ${index + 1}`}
                    secondary={damage.description || 'Bez popisu'}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeDamage(damage.id)}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Podpisy
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Pred dokončením je potrebný podpis zákazníka a zamestnanca.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Podpisy: {protocol.signatures?.length || 0} / 2
            </Typography>
            {/* TODO: Implementovať podpisový komponent */}
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Dokončenie protokolu
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Protokol je pripravený na uloženie a odoslanie.
            </Alert>
            <List>
              <ListItem>
                <ListItemText
                  primary="Generovanie PDF"
                  secondary="Automaticky po uložení"
                />
                <Chip
                  icon={<PictureAsPdf />}
                  label="Pripravené"
                  color="success"
                  variant="outlined"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Odoslanie emailu"
                  secondary="Odoslanie kópie zákazníkovi"
                />
                <Chip
                  icon={<Email />}
                  label="Pripravené"
                  color="success"
                  variant="outlined"
                />
              </ListItem>
            </List>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.default',
        zIndex: 1300,
        overflow: 'auto',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Preberací protokol
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {processing && <LinearProgress sx={{ mb: 2 }} />}

        <Stepper
          activeStep={activeStep}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ mb: 3 }}
        >
          {steps.map((step, index) => (
            <Step key={step.label} completed={isStepValid(index)}>
              <StepLabel
                StepIconComponent={({ active, completed }) => (
                  <Avatar
                    sx={{
                      bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                      color: 'white',
                      width: 32,
                      height: 32,
                    }}
                  >
                    {completed ? <CheckCircle /> : step.icon}
                  </Avatar>
                )}
              >
                {step.label}
              </StepLabel>
              {isMobile && (
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepContent>
              )}
            </Step>
          ))}
        </Stepper>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            {renderStepContent(activeStep)}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Späť
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="success"
              onClick={handleSave}
              disabled={processing}
              startIcon={<Save />}
            >
              Uložiť protokol
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid(activeStep)}
            >
              Ďalej
            </Button>
          )}
        </Box>
      </Box>

      {/* Photo capture modal */}
      {activePhotoCapture && (
                 <SerialPhotoCapture
           open={true}
           onClose={() => setActivePhotoCapture(null)}
           onSave={(images, videos) => handleMediaSave(activePhotoCapture as any, images, videos)}
           title={`Fotografie - ${
             activePhotoCapture === 'vehicle' ? 'Vozidlo' :
             activePhotoCapture === 'document' ? 'Dokumenty' : 'Poškodenia'
           }`}
           allowedTypes={[activePhotoCapture as any]}
         />
      )}
    </Box>
  );
} 