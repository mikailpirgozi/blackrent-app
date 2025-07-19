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
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { Rental, HandoverProtocol, VehicleCondition, ProtocolDamage, ProtocolSignature } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

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
    { label: 'Základné informácie', description: 'Zadajte miesto a čas prevzatia' },
    { label: 'Stav vozidla', description: 'Zadajte kilometre a stav paliva' },
    { label: 'Škody a poznámky', description: 'Zdokumentujte poškodenia' },
    { label: 'Dokončenie', description: 'Podpisy a finalizácia' },
  ];

  // Načítanie údajov o prenájme
  useEffect(() => {
    setProtocol(prev => ({ 
      ...prev, 
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
      
      // Mapovanie na backend format
      const protocolData = {
        id: protocol.id,
        rentalId: protocol.rentalId,
        location: protocol.location,
        vehicleCondition: protocol.vehicleCondition,
        vehicleImages: protocol.vehicleImages || [],
        vehicleVideos: protocol.vehicleVideos || [],
        documentImages: protocol.documentImages || [],
        damageImages: protocol.damageImages || [],
        damages: protocol.damages || [],
        signatures: protocol.signatures || [],
        rentalData: protocol.rentalData,
        notes: protocol.notes,
        createdBy: protocol.createdBy,
        status: 'completed',
        completedAt: new Date(),
      };
      
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
                      onChange={(e) => setProtocol(prev => ({ ...prev, location: e.target.value }))}
                      variant="outlined"
                      fullWidth
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

      case 3:
        return (
          <Box>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Dokončenie protokolu
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Poznámky"
                    multiline
                    rows={4}
                    value={protocol.notes || ''}
                    onChange={(e) => setProtocol(prev => ({ ...prev, notes: e.target.value }))}
                    variant="outlined"
                    fullWidth
                  />
                  <Alert severity="info">
                    Protokol bude označený ako dokončený a uložený do systému.
                  </Alert>
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
    </Box>
  );
};

export default HandoverProtocolForm; 