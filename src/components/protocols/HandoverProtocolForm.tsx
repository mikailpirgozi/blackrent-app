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
import { Rental } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

interface HandoverProtocolFormProps {
  open: boolean;
  rental: Rental;
  onSave: (protocolData: any) => Promise<void>;
  onClose: () => void;
}

interface DamageItem {
  id: string;
  description: string;
  photos: string[];
  severity: 'minor' | 'major' | 'critical';
  location: string;
}

interface ProtocolData {
  id?: string;
  rentalId: string;
  type: 'handover' | 'return';
  location: string;
  timestamp: Date;
  mileage: number;
  fuelLevel: number;
  damages: DamageItem[];
  notes: string;
  customerSignature?: string;
  agentSignature?: string;
  isCompleted: boolean;
  rentalData?: Rental;
}

const HandoverProtocolForm: React.FC<HandoverProtocolFormProps> = ({ open, rental, onSave, onClose }) => {
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [protocol, setProtocol] = useState<ProtocolData>({
    rentalId: rental.id,
    type: 'handover',
    location: '',
    timestamp: new Date(),
    mileage: 0,
    fuelLevel: 100,
    damages: [],
    notes: '',
    isCompleted: false,
    rentalData: rental,
  });

  const steps = [
    { label: 'Základné informácie', description: 'Zadajte miesto a čas prevzatia' },
    { label: 'Stav vozidla', description: 'Zadajte kilometre a stav paliva' },
    { label: 'Škody a poznámky', description: 'Zdokumentujte poškodenia' },
    { label: 'Dokončenie', description: 'Podpisy a finalizácia' },
  ];

  // Načítanie údajov o prenájme
  useEffect(() => {
    // Rental data už máme cez props
    setProtocol(prev => ({ ...prev, rentalData: rental }));
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
      await onSave(protocol);
      onClose();
    } catch (error) {
      console.error('Error saving protocol:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDamage = () => {
    const newDamage: DamageItem = {
      id: Date.now().toString(),
      description: '',
      photos: [],
      severity: 'minor',
      location: '',
    };
    setProtocol(prev => ({
      ...prev,
      damages: [...prev.damages, newDamage],
    }));
  };

  const removeDamage = (id: string) => {
    setProtocol(prev => ({
      ...prev,
      damages: prev.damages.filter(damage => damage.id !== id),
    }));
  };

  const updateDamage = (id: string, field: keyof DamageItem, value: any) => {
    setProtocol(prev => ({
      ...prev,
      damages: prev.damages.map(damage =>
        damage.id === id ? { ...damage, [field]: value } : damage
      ),
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
                      value={protocol.rentalData?.id || ''}
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
                    <DateTimePicker
                      label="Čas prevzatia"
                      value={protocol.timestamp}
                      onChange={(newValue) => setProtocol(prev => ({ ...prev, timestamp: newValue || new Date() }))}
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
                      value={protocol.mileage}
                      onChange={(e) => setProtocol(prev => ({ ...prev, mileage: parseInt(e.target.value) || 0 }))}
                      variant="outlined"
                      fullWidth
                    />
                    <TextField
                      label="Stav paliva (%)"
                      type="number"
                      value={protocol.fuelLevel}
                      onChange={(e) => setProtocol(prev => ({ ...prev, fuelLevel: parseInt(e.target.value) || 0 }))}
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
                
                {protocol.damages.length === 0 ? (
                  <Alert severity="info">Žiadne škody neboli zaznamenané</Alert>
                ) : (
                  <List>
                    {protocol.damages.map((damage, index) => (
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
                                  onChange={(e) => updateDamage(damage.id, 'severity', e.target.value)}
                                >
                                  <MenuItem value="minor">Drobná</MenuItem>
                                  <MenuItem value="major">Závažná</MenuItem>
                                  <MenuItem value="critical">Kritická</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                label="Miesto"
                                value={damage.location}
                                onChange={(e) => updateDamage(damage.id, 'location', e.target.value)}
                                variant="outlined"
                                size="small"
                              />
                            </Box>
                          }
                        />
                        <IconButton onClick={() => removeDamage(damage.id)} color="error">
                          <RemoveIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <TextField
                  label="Poznámky"
                  value={protocol.notes}
                  onChange={(e) => setProtocol(prev => ({ ...prev, notes: e.target.value }))}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                />
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
                <Alert severity="info" sx={{ mb: 2 }}>
                  Skontrolujte všetky údaje pred dokončením protokolu.
                </Alert>
                
                <Stack spacing={2}>
                  <Typography variant="body2">
                    <strong>Miesto:</strong> {protocol.location}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Čas:</strong> {protocol.timestamp.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Kilometre:</strong> {protocol.mileage} km
                  </Typography>
                  <Typography variant="body2">
                    <strong>Palivo:</strong> {protocol.fuelLevel}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Škody:</strong> {protocol.damages.length}
                  </Typography>
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