import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import {
  Close as CloseIcon,
  DirectionsCar as CarIcon,
  Event as EventIcon,
  Euro as EuroIcon,
  LocationOn as LocationIcon,
  Assignment as DocumentIcon,
  Security as InsuranceIcon,
  ReportProblem as ClaimIcon
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { InsuranceClaim } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import R2FileUpload from '../common/R2FileUpload';

interface InsuranceClaimFormProps {
  claim?: InsuranceClaim | null;
  onSave: (claim: InsuranceClaim) => void;
  onCancel: () => void;
}

const getIncidentTypeInfo = (type: string) => {
  switch (type) {
    case 'accident':
      return { label: 'Nehoda', color: '#d32f2f', icon: '🚗' };
    case 'theft':
      return { label: 'Krádež', color: '#7b1fa2', icon: '🔒' };
    case 'vandalism':
      return { label: 'Vandalizmus', color: '#f57c00', icon: '🔨' };
    case 'weather':
      return { label: 'Počasie', color: '#1976d2', icon: '⛈️' };
    default:
      return { label: 'Iné', color: '#616161', icon: '❓' };
  }
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'reported':
      return { label: 'Nahlásené', color: '#f57c00' };
    case 'investigating':
      return { label: 'Vyšetruje sa', color: '#1976d2' };
    case 'approved':
      return { label: 'Schválené', color: '#388e3c' };
    case 'rejected':
      return { label: 'Zamietnuté', color: '#d32f2f' };
    case 'closed':
      return { label: 'Uzavreté', color: '#616161' };
    default:
      return { label: 'Neznáme', color: '#616161' };
  }
};

export default function InsuranceClaimForm({ claim, onSave, onCancel }: InsuranceClaimFormProps) {
  const { state } = useApp();
  
  const [formData, setFormData] = useState<Partial<InsuranceClaim>>({
    vehicleId: claim?.vehicleId || '',
    insuranceId: claim?.insuranceId || '',
    incidentDate: claim?.incidentDate || new Date(),
    description: claim?.description || '',
    location: claim?.location || '',
    incidentType: claim?.incidentType || 'accident',
    estimatedDamage: claim?.estimatedDamage || 0,
    deductible: claim?.deductible || 0,
    payoutAmount: claim?.payoutAmount || 0,
    status: claim?.status || 'reported',
    claimNumber: claim?.claimNumber || '',
    filePaths: claim?.filePaths || [],
    policeReportNumber: claim?.policeReportNumber || '',
    otherPartyInfo: claim?.otherPartyInfo || '',
    notes: claim?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (claim) {
      setFormData({
        ...claim,
        incidentDate: claim.incidentDate ? new Date(claim.incidentDate) : new Date()
      });
      setUploadedFiles(claim.filePaths || []);
    }
  }, [claim]);

  // Get available vehicles and their insurances
  const availableVehicles = state.vehicles || [];
  const vehicleInsurances = (state.insurances || []).filter(ins => ins.vehicleId === formData.vehicleId);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Vozidlo je povinné';
    }
    if (!formData.incidentDate) {
      newErrors.incidentDate = 'Dátum udalosti je povinný';
    }
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Popis udalosti je povinný';
    }
    if (!formData.incidentType) {
      newErrors.incidentType = 'Typ udalosti je povinný';
    }
    if (formData.estimatedDamage && formData.estimatedDamage < 0) {
      newErrors.estimatedDamage = 'Odhad škody nemôže byť záporný';
    }
    if (formData.deductible && formData.deductible < 0) {
      newErrors.deductible = 'Spoluúčasť nemôže byť záporná';
    }
    if (formData.payoutAmount && formData.payoutAmount < 0) {
      newErrors.payoutAmount = 'Výplata nemôže byť záporná';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const claimData: InsuranceClaim = {
      id: claim?.id || uuidv4(),
      vehicleId: formData.vehicleId!,
      insuranceId: formData.insuranceId,
      incidentDate: formData.incidentDate!,
      reportedDate: claim?.reportedDate || new Date(),
      description: formData.description!,
      location: formData.location,
      incidentType: formData.incidentType! as any,
      estimatedDamage: formData.estimatedDamage,
      deductible: formData.deductible,
      payoutAmount: formData.payoutAmount,
      status: formData.status! as any,
      claimNumber: formData.claimNumber,
      filePaths: uploadedFiles,
      policeReportNumber: formData.policeReportNumber,
      otherPartyInfo: formData.otherPartyInfo,
      notes: formData.notes,
      createdAt: claim?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onSave(claimData);
  };

  const handleFileUploadSuccess = (fileData: { url: string; key: string; filename: string } | { url: string; key: string; filename: string }[]) => {
    if (Array.isArray(fileData)) {
      setUploadedFiles(prev => [...prev, ...fileData.map(f => f.url)]);
    } else {
      setUploadedFiles(prev => [...prev, fileData.url]);
    }
  };

  const handleRemoveFile = (fileUrl: string) => {
    setUploadedFiles(prev => prev.filter(url => url !== fileUrl));
  };

  const statusInfo = getStatusInfo(formData.status || 'reported');

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ClaimIcon sx={{ color: '#d32f2f' }} />
            <Typography variant="h6">
              {claim ? 'Upraviť poistnú udalosť' : 'Pridať poistnú udalosť'}
            </Typography>
          </Box>
          <IconButton onClick={onCancel} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {/* Basic Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon sx={{ color: '#1976d2' }} />
                Základné informácie
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.vehicleId}>
                    <InputLabel>Vozidlo *</InputLabel>
                    <Select
                      value={formData.vehicleId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value, insuranceId: '' }))}
                      label="Vozidlo *"
                    >
                      <MenuItem value="">Vyberte vozidlo</MenuItem>
                      {availableVehicles.map((vehicle) => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CarIcon sx={{ fontSize: 16, color: '#1976d2' }} />
                            {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.vehicleId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.vehicleId}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Súvisiaca poistka</InputLabel>
                    <Select
                      value={formData.insuranceId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceId: e.target.value }))}
                      label="Súvisiaca poistka"
                      disabled={!formData.vehicleId}
                    >
                      <MenuItem value="">Žiadna</MenuItem>
                      {vehicleInsurances.map((insurance) => (
                        <MenuItem key={insurance.id} value={insurance.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InsuranceIcon sx={{ fontSize: 16, color: '#1976d2' }} />
                            {insurance.company} - {insurance.policyNumber}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Dátum a čas udalosti *"
                    value={formData.incidentDate ? new Date(formData.incidentDate) : null}
                    onChange={(newValue) => setFormData(prev => ({ 
                      ...prev, 
                      incidentDate: newValue || new Date() 
                    }))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.incidentDate,
                        helperText: errors.incidentDate
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.incidentType}>
                    <InputLabel>Typ udalosti *</InputLabel>
                    <Select
                      value={formData.incidentType || 'accident'}
                      onChange={(e) => setFormData(prev => ({ ...prev, incidentType: e.target.value as any }))}
                      label="Typ udalosti *"
                    >
                      <MenuItem value="accident">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          🚗 Nehoda
                        </Box>
                      </MenuItem>
                      <MenuItem value="theft">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          🔒 Krádež
                        </Box>
                      </MenuItem>
                      <MenuItem value="vandalism">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          🔨 Vandalizmus
                        </Box>
                      </MenuItem>
                      <MenuItem value="weather">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          ⛈️ Poveternostná udalosť
                        </Box>
                      </MenuItem>
                      <MenuItem value="other">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          ❓ Iné
                        </Box>
                      </MenuItem>
                    </Select>
                    {errors.incidentType && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.incidentType}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Popis udalosti *"
                    multiline
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    error={!!errors.description}
                    helperText={errors.description}
                    placeholder="Opíšte detailne čo sa stalo..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Miesto udalosti"
                    value={formData.location || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ulica, mesto, GPS súradnice..."
                    InputProps={{
                      startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EuroIcon sx={{ color: '#388e3c' }} />
                Finančné údaje
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Odhad škody (€)"
                    type="number"
                    value={formData.estimatedDamage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDamage: parseFloat(e.target.value) || 0 }))}
                    error={!!errors.estimatedDamage}
                    helperText={errors.estimatedDamage}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Spoluúčasť (€)"
                    type="number"
                    value={formData.deductible || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, deductible: parseFloat(e.target.value) || 0 }))}
                    error={!!errors.deductible}
                    helperText={errors.deductible}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Výplata poisťovne (€)"
                    type="number"
                    value={formData.payoutAmount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, payoutAmount: parseFloat(e.target.value) || 0 }))}
                    error={!!errors.payoutAmount}
                    helperText={errors.payoutAmount}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Status and Additional Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentIcon sx={{ color: '#f57c00' }} />
                Stav a dodatočné informácie
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Stav</InputLabel>
                    <Select
                      value={formData.status || 'reported'}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      label="Stav"
                    >
                      <MenuItem value="reported">Nahlásené</MenuItem>
                      <MenuItem value="investigating">Vyšetruje sa</MenuItem>
                      <MenuItem value="approved">Schválené</MenuItem>
                      <MenuItem value="rejected">Zamietnuté</MenuItem>
                      <MenuItem value="closed">Uzavreté</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Číslo škodovej udalosti"
                    value={formData.claimNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, claimNumber: e.target.value }))}
                    placeholder="Číslo z poisťovne..."
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Číslo policajného protokolu"
                    value={formData.policeReportNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, policeReportNumber: e.target.value }))}
                    placeholder="Ak bol privolaný..."
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Aktuálny stav:
                    </Typography>
                    <Chip
                      label={statusInfo.label}
                      size="small"
                      sx={{
                        backgroundColor: `${statusInfo.color}20`,
                        color: statusInfo.color,
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Informácie o druhej strane"
                    multiline
                    rows={2}
                    value={formData.otherPartyInfo || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherPartyInfo: e.target.value }))}
                    placeholder="Údaje o druhom účastníkovi nehody (meno, telefón, poistka...)..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Poznámky"
                    multiline
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ďalšie poznámky..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentIcon sx={{ color: '#7b1fa2' }} />
                Súbory a dokumenty
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <R2FileUpload
                  type="document"
                  entityId={formData.vehicleId || 'temp'}
                  onUploadSuccess={handleFileUploadSuccess}
                  onUploadError={(error) => console.error('Upload error:', error)}
                  acceptedTypes={['image/jpeg', 'image/png', 'image/webp', 'application/pdf']}
                  maxSize={10}
                  multiple={true}
                  label="Nahrať súbory (fotky, dokumenty)"
                />
              </Box>

              {uploadedFiles.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Nahrané súbory ({uploadedFiles.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {uploadedFiles.map((fileUrl, index) => (
                      <Chip
                        key={index}
                        label={`Súbor ${index + 1}`}
                        onDelete={() => handleRemoveFile(fileUrl)}
                        onClick={() => window.open(fileUrl, '_blank')}
                        size="small"
                        variant="outlined"
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onCancel} color="inherit">
            Zrušiť
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              }
            }}
          >
            {claim ? 'Uložiť zmeny' : 'Vytvoriť udalosť'}
          </Button>
        </DialogActions>
      </form>
    </LocalizationProvider>
  );
} 