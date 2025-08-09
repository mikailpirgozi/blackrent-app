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
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import SecurityIcon from '@mui/icons-material/Security';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HighwayIcon from '@mui/icons-material/LocalShipping';
import FileIcon from '@mui/icons-material/AttachFile';
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
  
  const [addingInsurer, setAddingInsurer] = useState(false);
  const [newInsurerName, setNewInsurerName] = useState('');

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

  const handleFileUploadSuccess = (fileData: { url: string; key: string; filename: string }) => {
    console.log('🔍 FILE UPLOAD SUCCESS:', fileData);
    setFormData(prev => {
      const newData = {
        ...prev,
        filePath: fileData.url
      };
      console.log('🔍 UPDATED FORM DATA:', newData);
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('🔍 FORM SUBMIT - Form data being saved:', formData);
    console.log('🔍 FORM SUBMIT - FilePath value:', formData.filePath);
    
    onSave(formData);
  };

  const typeInfo = getDocumentTypeInfo(formData.type);
  const isInsurance = formData.type === 'insurance';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                          <FormControl fullWidth required error={!!errors.company}>
                            <InputLabel>Poisťovňa</InputLabel>
                            <Select
                              value={formData.company}
                              label="Poisťovňa"
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '__add_new__') {
                                  setAddingInsurer(true);
                                } else {
                                  setFormData(prev => ({ ...prev, company: value }));
                                }
                              }}
                            >
                              {state.insurers.map((insurer) => (
                                <MenuItem key={insurer.id} value={insurer.name}>
                                  {insurer.name}
                                </MenuItem>
                              ))}
                              <MenuItem value="__add_new__">
                                <em>+ Pridať novú poisťovňu</em>
                              </MenuItem>
                            </Select>
                            {errors.company && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                                {errors.company}
                              </Typography>
                            )}
                          </FormControl>
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
                        value={formData.validFrom ? new Date(formData.validFrom) : null}
                        onChange={(date) => setFormData(prev => ({ ...prev, validFrom: date || undefined }))}
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
                        value={formData.validTo ? new Date(formData.validTo) : new Date()}
                        onChange={(date) => setFormData(prev => ({ ...prev, validTo: date || new Date() }))}
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

      {/* Dialóg pre pridanie novej poistovne */}
      {addingInsurer && (
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
            zIndex: 9999
          }}
          onClick={() => setAddingInsurer(false)}
        >
          <Card sx={{ minWidth: 400, m: 2 }} onClick={(e) => e.stopPropagation()}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pridať novú poisťovňu
              </Typography>
              <TextField
                fullWidth
                label="Názov poisťovne"
                value={newInsurerName}
                onChange={(e) => setNewInsurerName(e.target.value)}
                margin="normal"
                autoFocus
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  setAddingInsurer(false);
                  setNewInsurerName('');
                }}>
                  Zrušiť
                </Button>
                <Button 
                  variant="contained" 
                  onClick={async () => {
                    if (newInsurerName.trim()) {
                      try {
                        // Volám API pre vytvorenie poistovne
                        // Použijem správnu API URL
                        const apiUrl = process.env.NODE_ENV === 'production' 
                          ? 'https://blackrent-app-production-4d6f.up.railway.app/api/insurers'
                          : `${window.location.protocol}//${window.location.hostname}:3001/api/insurers`;
                        
                        const response = await fetch(apiUrl, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token')}`
                          },
                          body: JSON.stringify({ name: newInsurerName.trim() })
                        });

                        if (response.ok) {
                          const result = await response.json();
                          console.log('✅ Poistovňa úspešne vytvorená:', result.data);
                          
                          // Po úspešnom pridaní nastavím novú poistovňu ako vybranú
                          setFormData(prev => ({ ...prev, company: newInsurerName.trim() }));
                          setAddingInsurer(false);
                          setNewInsurerName('');
                          
                          // Refresh poistovní v AppContext (ak by bolo potrebné)
                          window.location.reload();
                        } else {
                          console.error('❌ Chyba pri vytváraní poistovne:', response.statusText);
                        }
                      } catch (error) {
                        console.error('❌ Chyba pri pridávaní poistovne:', error);
                      }
                    }
                  }}
                  disabled={!newInsurerName.trim()}
                >
                  Pridať
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </LocalizationProvider>
  );
} 