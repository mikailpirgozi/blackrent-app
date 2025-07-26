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
  Divider,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { 
  Security as SecurityIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  LocalShipping as HighwayIcon,
  AttachFile as FileIcon
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Insurance, VehicleDocument, PaymentFrequency } from '../../types';
import R2FileUpload from './R2FileUpload';

interface UnifiedDocumentData {
  id?: string;
  vehicleId: string;
  type: 'insurance' | 'stk' | 'ek' | 'vignette';
  
  // Insurance specific
  policyNumber?: string;
  company?: string;
  paymentFrequency?: PaymentFrequency;
  
  // Vehicle document specific
  documentNumber?: string;
  notes?: string;
  
  // Common fields
  validFrom?: Date;
  validTo: Date;
  price?: number;
  filePath?: string;
}

interface UnifiedDocumentFormProps {
  document?: UnifiedDocumentData | null;
  onSave: (document: UnifiedDocumentData) => void;
  onCancel: () => void;
}

const getDocumentTypeInfo = (type: string) => {
  switch (type) {
    case 'insurance':
      return { label: 'Poistka', icon: <SecurityIcon />, color: '#1976d2' };
    case 'stk':
      return { label: 'STK', icon: <BuildIcon />, color: '#388e3c' };
    case 'ek':
      return { label: 'EK', icon: <AssignmentIcon />, color: '#f57c00' };
    case 'vignette':
      return { label: 'Dialničná známka', icon: <HighwayIcon />, color: '#7b1fa2' };
    default:
      return { label: 'Dokument', icon: <FileIcon />, color: '#666' };
  }
};

export default function UnifiedDocumentForm({ document, onSave, onCancel }: UnifiedDocumentFormProps) {
  const { state } = useApp();
  
  const [formData, setFormData] = useState<UnifiedDocumentData>({
    vehicleId: document?.vehicleId || '',
    type: document?.type || 'insurance',
    policyNumber: document?.policyNumber || '',
    company: document?.company || '',
    paymentFrequency: document?.paymentFrequency || 'yearly',
    documentNumber: document?.documentNumber || '',
    notes: document?.notes || '',
    validFrom: document?.validFrom || undefined,
    validTo: document?.validTo || new Date(),
    price: document?.price || 0,
    filePath: document?.filePath || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (document) {
      setFormData({
        id: document.id,
        vehicleId: document.vehicleId,
        type: document.type,
        policyNumber: document.policyNumber || '',
        company: document.company || '',
        paymentFrequency: document.paymentFrequency || 'yearly',
        documentNumber: document.documentNumber || '',
        notes: document.notes || '',
        validFrom: document.validFrom,
        validTo: document.validTo,
        price: document.price || 0,
        filePath: document.filePath || ''
      });
    }
  }, [document]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Vozidlo je povinné';
    }

    if (!formData.validTo) {
      newErrors.validTo = 'Dátum platnosti do je povinný';
    }

    if (formData.type === 'insurance') {
      if (!formData.policyNumber) {
        newErrors.policyNumber = 'Číslo poistky je povinné';
      }
      if (!formData.company) {
        newErrors.company = 'Poisťovňa je povinná';
      }
    }

    if (formData.price && formData.price < 0) {
      newErrors.price = 'Cena nemôže byť záporná';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleFileUploadSuccess = (fileData: { url: string; key: string; filename: string }) => {
    setFormData(prev => ({
      ...prev,
      filePath: fileData.url
    }));
  };

  const typeInfo = getDocumentTypeInfo(formData.type);
  const isInsurance = formData.type === 'insurance';

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <form onSubmit={handleSubmit}>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            {typeInfo.icon}
            <Typography variant="h6" sx={{ color: typeInfo.color }}>
              {document?.id ? 'Upraviť' : 'Pridať'} {typeInfo.label}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Základné informácie */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Základné informácie
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required error={!!errors.vehicleId}>
                        <InputLabel>Vozidlo</InputLabel>
                        <Select
                          value={formData.vehicleId}
                          label="Vozidlo"
                          onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
                        >
                          {state.vehicles?.map(vehicle => (
                            <MenuItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                            </MenuItem>
                          )) || []}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Typ dokumentu</InputLabel>
                        <Select
                          value={formData.type}
                          label="Typ dokumentu"
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                        >
                          <MenuItem value="insurance">Poistka</MenuItem>
                          <MenuItem value="stk">STK</MenuItem>
                          <MenuItem value="ek">EK</MenuItem>
                          <MenuItem value="vignette">Dialničná známka</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Insurance specific fields */}
                    {isInsurance && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            required
                            label="Číslo poistky"
                            value={formData.policyNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
                            error={!!errors.policyNumber}
                            helperText={errors.policyNumber}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            required
                            label="Poisťovňa"
                            value={formData.company}
                            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                            error={!!errors.company}
                            helperText={errors.company}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Frekvencia platenia</InputLabel>
                            <Select
                              value={formData.paymentFrequency}
                              label="Frekvencia platenia"
                              onChange={(e) => setFormData(prev => ({ ...prev, paymentFrequency: e.target.value as PaymentFrequency }))}
                            >
                              <MenuItem value="monthly">Mesačne</MenuItem>
                              <MenuItem value="quarterly">Štvrťročne</MenuItem>
                              <MenuItem value="biannual">Polročne</MenuItem>
                              <MenuItem value="yearly">Ročne</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </>
                    )}

                    {/* Vehicle document specific fields */}
                    {!isInsurance && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Číslo dokumentu"
                            value={formData.documentNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Poznámky"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Platnosť a cena */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Platnosť a cena
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Platné od"
                        value={formData.validFrom ? dayjs(formData.validFrom) : null}
                        onChange={(date) => setFormData(prev => ({ ...prev, validFrom: date ? date.toDate() : undefined }))}
                        slotProps={{
                          textField: {
                            fullWidth: true
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Platné do"
                        value={formData.validTo ? dayjs(formData.validTo) : dayjs()}
                        onChange={(date) => setFormData(prev => ({ ...prev, validTo: date ? date.toDate() : new Date() }))}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: !!errors.validTo,
                            helperText: errors.validTo
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Cena (€)"
                        value={formData.price || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        error={!!errors.price}
                        helperText={errors.price}
                        inputProps={{ step: 0.01, min: 0 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* File Upload */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Priložený súbor
                  </Typography>
                  
                  {formData.filePath && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Súbor už je priložený. Nahratím nového súboru nahradíte existujúci.
                    </Alert>
                  )}

                  <R2FileUpload
                    type="document"
                    entityId={formData.vehicleId || 'temp'}
                    onUploadSuccess={handleFileUploadSuccess}
                    onUploadError={(error) => console.error('Upload error:', error)}
                    acceptedTypes={['image/jpeg', 'image/png', 'image/webp', 'application/pdf']}
                    maxSize={10}
                    label="Nahrať dokument (PDF, JPG, PNG)"
                  />

                  {formData.filePath && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aktuálny súbor: {formData.filePath.split('/').pop()}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => window.open(formData.filePath, '_blank')}
                        sx={{ mt: 1 }}
                      >
                        Zobraziť súbor
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onCancel}
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: `linear-gradient(135deg, ${typeInfo.color} 0%, ${typeInfo.color}dd 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${typeInfo.color}dd 0%, ${typeInfo.color}bb 100%)`,
                }
              }}
            >
              {document?.id ? 'Uložiť zmeny' : 'Pridať dokument'}
            </Button>
          </Box>
        </Box>
      </form>
    </LocalizationProvider>
  );
} 