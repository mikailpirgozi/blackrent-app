import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as DocumentIcon,
} from '@mui/icons-material';
import { Vehicle, PricingTier, VehicleDocument, DocumentType } from '../../types';
import { useApp } from '../../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onSave: (vehicle: Vehicle) => void;
  onCancel: () => void;
}

export default function VehicleForm({ vehicle, onSave, onCancel }: VehicleFormProps) {
  const { state, createCompany, createVehicleDocument, updateVehicleDocument, deleteVehicleDocument } = useApp();
  const defaultPricing = [
    { id: '1', minDays: 0, maxDays: 1, pricePerDay: 0 },
    { id: '2', minDays: 2, maxDays: 3, pricePerDay: 0 },
    { id: '3', minDays: 4, maxDays: 7, pricePerDay: 0 },
    { id: '4', minDays: 8, maxDays: 14, pricePerDay: 0 },
    { id: '5', minDays: 15, maxDays: 22, pricePerDay: 0 },
    { id: '6', minDays: 23, maxDays: 30, pricePerDay: 0 },
    { id: '7', minDays: 31, maxDays: 9999, pricePerDay: 0 },
  ];
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    brand: '',
    model: '',
    licensePlate: '',
    company: '',
    pricing: defaultPricing,
    commission: { type: 'percentage', value: 20 },
    status: 'available',
  });
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [vehicleDocuments, setVehicleDocuments] = useState<VehicleDocument[]>([]);
  const [editingDocument, setEditingDocument] = useState<VehicleDocument | null>(null);

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
      // Načítaj dokumenty pre existujúce vozidlo
      const vehicleDocs = state.vehicleDocuments.filter(doc => doc.vehicleId === vehicle.id);
      setVehicleDocuments(vehicleDocs);
    }
  }, [vehicle, state.vehicleDocuments]);

  const handleInputChange = (field: keyof Vehicle, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePricingChange = (index: number, field: keyof PricingTier, value: any) => {
    const newPricing = [...(formData.pricing || [])];
    newPricing[index] = { ...newPricing[index], [field]: value };
    setFormData(prev => ({ ...prev, pricing: newPricing }));
  };

  const _addPricingTier = () => {
    const newPricing = [...(formData.pricing || [])];
    const lastTier = newPricing[newPricing.length - 1];
    newPricing.push({
      id: uuidv4(),
      minDays: lastTier ? lastTier.maxDays + 1 : 1,
      maxDays: lastTier ? lastTier.maxDays + 3 : 3,
      pricePerDay: 0,
    });
    setFormData(prev => ({ ...prev, pricing: newPricing }));
  };

  const _removePricingTier = (index: number) => {
    const newPricing = [...(formData.pricing || [])];
    newPricing.splice(index, 1);
    setFormData(prev => ({ ...prev, pricing: newPricing }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const completeVehicle: Vehicle = {
      id: vehicle?.id || uuidv4(),
      brand: formData.brand || '',
      model: formData.model || '',
      licensePlate: formData.licensePlate || '',
      company: formData.company || '',
      pricing: formData.pricing || [],
      commission: formData.commission || { type: 'percentage', value: 20 },
      status: formData.status || 'available',
    };
    onSave(completeVehicle);
  };

  const allCompanies = Array.from(new Set([
    ...state.companies.map(c => c.name),
    ...state.vehicles.map(v => v.company)
  ])).filter(Boolean).sort((a, b) => a.localeCompare(b));

  // Helper funkcie pre dokumenty
  const handleAddDocument = async (docData: Partial<VehicleDocument>) => {
    if (!formData.id) return; // Môžeme pridávať dokumenty len pre existujúce vozidlá
    
    const newDocument: VehicleDocument = {
      id: uuidv4(),
      vehicleId: formData.id,
      documentType: docData.documentType as DocumentType,
      validFrom: docData.validFrom,
      validTo: docData.validTo!,
      documentNumber: docData.documentNumber,
      price: docData.price,
      notes: docData.notes
    };

    try {
      await createVehicleDocument(newDocument);
      setVehicleDocuments(prev => [...prev, newDocument]);
      setEditingDocument(null);
    } catch (error) {
      console.error('Chyba pri pridávaní dokumentu:', error);
    }
  };

  const handleUpdateDocument = async (docData: VehicleDocument) => {
    try {
      await updateVehicleDocument(docData);
      setVehicleDocuments(prev => prev.map(doc => doc.id === docData.id ? docData : doc));
      setEditingDocument(null);
    } catch (error) {
      console.error('Chyba pri aktualizácii dokumentu:', error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať tento dokument?')) {
      try {
        await deleteVehicleDocument(id);
        setVehicleDocuments(prev => prev.filter(doc => doc.id !== id));
      } catch (error) {
        console.error('Chyba pri mazaní dokumentu:', error);
      }
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'stk':
        return 'STK';
      case 'ek':
        return 'EK';
      case 'vignette':
        return 'Dialničná známka';
      default:
        return type;
    }
  };

  const getExpiryStatus = (validTo: Date) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const validToDate = new Date(validTo);

    if (validToDate < today) {
      return { status: 'expired', color: 'error', text: 'Vypršal' };
    } else if (validToDate <= thirtyDaysFromNow) {
      return { status: 'expiring', color: 'warning', text: 'Vyprší čoskoro' };
    } else {
      return { status: 'valid', color: 'success', text: 'Platný' };
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <TextField
          fullWidth
          label="Značka"
          value={formData.brand}
          onChange={(e) => handleInputChange('brand', e.target.value)}
          required
        />
        <TextField
          fullWidth
          label="Model"
          value={formData.model}
          onChange={(e) => handleInputChange('model', e.target.value)}
          required
        />
        <TextField
          fullWidth
          label="ŠPZ"
          value={formData.licensePlate}
          onChange={(e) => handleInputChange('licensePlate', e.target.value)}
          required
        />
        {/* Firma/Autopožičovňa - Select s možnosťou pridať */}
        <FormControl fullWidth required>
          <InputLabel>Firma/Autopožičovňa</InputLabel>
          <Select
            value={formData.company || ''}
            label="Firma/Autopožičovňa"
            onChange={(e) => handleInputChange('company', e.target.value)}
            renderValue={(selected) => selected || 'Vyberte firmu'}
          >
            {allCompanies.map((company) => (
              <MenuItem key={company} value={company}>
                {company}
              </MenuItem>
            ))}
            <MenuItem value="__add_new__" onClick={() => setAddingCompany(true)}>
              <em>+ Pridať novú firmu</em>
            </MenuItem>
          </Select>
          {addingCompany && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                autoFocus
                size="small"
                label="Nová firma"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
              <Button
                variant="contained"
                size="small"
                disabled={!newCompanyName.trim()}
                onClick={async () => {
                  try {
                    const id = uuidv4();
                    await createCompany({ id, name: newCompanyName.trim() });
                    setFormData((prev) => ({ ...prev, company: newCompanyName.trim() }));
                    setNewCompanyName('');
                    setAddingCompany(false);
                  } catch (error) {
                    console.error('Chyba pri vytváraní firmy:', error);
                    alert('Chyba pri vytváraní firmy');
                  }
                }}
              >Pridať</Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setAddingCompany(false);
                  setNewCompanyName('');
                }}
              >Zrušiť</Button>
            </Box>
          )}
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Stav</InputLabel>
          <Select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            label="Stav"
          >
            <MenuItem value="available">Dostupné</MenuItem>
            <MenuItem value="rented">Prenajaté</MenuItem>
            <MenuItem value="maintenance">Údržba</MenuItem>
            <MenuItem value="temporarily_removed">Dočasne vyradené</MenuItem>
            <MenuItem value="removed">Vyradené</MenuItem>
            <MenuItem value="transferred">Prepisané</MenuItem>
          </Select>
        </FormControl>
        <FormControl component="fieldset">
          <Typography variant="subtitle1" gutterBottom>
            Provízia
          </Typography>
          <RadioGroup
            row
            value={formData.commission?.type}
            onChange={(e) => handleInputChange('commission', { 
              ...formData.commission, 
              type: e.target.value as 'percentage' | 'fixed' 
            })}
          >
            <FormControlLabel value="percentage" control={<Radio />} label="Percentá" />
            <FormControlLabel value="fixed" control={<Radio />} label="Fixná suma" />
          </RadioGroup>
          <TextField
            fullWidth
            label={formData.commission?.type === 'percentage' ? 'Percentá (%)' : 'Suma (€)'}
            type="number"
            value={formData.commission?.value}
            onChange={(e) => handleInputChange('commission', { 
              ...formData.commission, 
              value: parseFloat(e.target.value) 
            })}
            sx={{ mt: 1 }}
          />
        </FormControl>

        <Box sx={{ gridColumn: '1 / -1' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Cenotvorba</Typography>
              </Box>
              {formData.pricing?.map((tier, index) => (
                <Box key={tier.id} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <TextField
                    label={(() => {
                      switch(index) {
                        case 0: return '0-1 dni';
                        case 1: return '2-3 dni';
                        case 2: return '4-7 dni';
                        case 3: return '8-14 dni';
                        case 4: return '15-22 dní';
                        case 5: return '23-30 dní';
                        case 6: return '31-9999 dní';
                        default: return '';
                      }
                    })()}
                    type="number"
                    value={tier.pricePerDay}
                    onChange={(e) => handlePricingChange(index, 'pricePerDay', parseFloat(e.target.value))}
                    sx={{ width: 150 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>

        {/* Evidencia platnosti */}
        {formData.id && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DocumentIcon />
                    <Typography variant="h6">Evidencia platnosti</Typography>
                  </Box>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    onClick={() => setEditingDocument({
                      id: '',
                      vehicleId: formData.id!,
                      documentType: 'stk',
                      validTo: new Date()
                    } as VehicleDocument)}
                  >
                    Pridať dokument
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {vehicleDocuments.map((doc) => {
                    const expiryStatus = getExpiryStatus(doc.validTo);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={doc.id}>
                        <Card sx={{ 
                          border: `1px solid ${
                            expiryStatus.status === 'expired' ? '#f44336' :
                            expiryStatus.status === 'expiring' ? '#ff9800' :
                            '#e0e0e0'
                          }`,
                          '&:hover': { boxShadow: 2 }
                        }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {getDocumentTypeLabel(doc.documentType)}
                              </Typography>
                              <Chip
                                label={expiryStatus.text}
                                color={expiryStatus.color as any}
                                size="small"
                              />
                            </Box>
                            
                            {doc.documentNumber && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Číslo: {doc.documentNumber}
                              </Typography>
                            )}
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Platné do: {new Date(doc.validTo).toLocaleDateString()}
                            </Typography>
                            
                            {doc.price && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Cena: {doc.price.toFixed(2)} €
                              </Typography>
                            )}

                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <IconButton
                                size="small"
                                onClick={() => setEditingDocument(doc)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteDocument(doc.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                  
                  {vehicleDocuments.length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Žiadne dokumenty evidované. Kliknite na "Pridať dokument" pre pridanie STK, EK alebo dialničnej známky.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}

        <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel}>
            Zrušiť
          </Button>
          <Button type="submit" variant="contained">
            {vehicle ? 'Uložiť zmeny' : 'Pridať vozidlo'}
          </Button>
        </Box>
      </Box>

      {/* Dialog pre editáciu dokumentov */}
      <DocumentDialog
        document={editingDocument}
        onSave={editingDocument?.id ? handleUpdateDocument : handleAddDocument}
        onCancel={() => setEditingDocument(null)}
      />
    </Box>
  );
}

// Dialóg pre editáciu/pridávanie dokumentov
interface DocumentDialogProps {
  document: VehicleDocument | null;
  onSave: (document: VehicleDocument | Partial<VehicleDocument>) => void;
  onCancel: () => void;
}

function DocumentDialog({ document, onSave, onCancel }: DocumentDialogProps) {
  const [formData, setFormData] = useState<Partial<VehicleDocument>>({});

  useEffect(() => {
    if (document) {
      setFormData({
        ...document,
        validFrom: document.validFrom || undefined,
        validTo: document.validTo || new Date()
      });
    } else {
      setFormData({});
    }
  }, [document]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.documentType || !formData.validTo) return;

    onSave(document?.id ? { ...document, ...formData } as VehicleDocument : formData);
  };

  return (
    <Dialog open={!!document} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        {document?.id ? 'Upraviť dokument' : 'Pridať dokument'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Typ dokumentu</InputLabel>
              <Select
                value={formData.documentType || 'stk'}
                onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value as DocumentType }))}
                label="Typ dokumentu"
                required
              >
                <MenuItem value="stk">STK</MenuItem>
                <MenuItem value="ek">EK</MenuItem>
                <MenuItem value="vignette">Dialničná známka</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Číslo dokumentu"
              value={formData.documentNumber || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
            />

            <TextField
              fullWidth
              label="Platný od"
              type="date"
              value={
                formData.validFrom && !isNaN(new Date(formData.validFrom).getTime())
                  ? new Date(formData.validFrom).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value ? new Date(e.target.value) : undefined }))}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Platný do"
              type="date"
              value={
                formData.validTo && !isNaN(new Date(formData.validTo).getTime())
                  ? new Date(formData.validTo).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => setFormData(prev => ({ ...prev, validTo: new Date(e.target.value) }))}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              fullWidth
              label="Cena (€)"
              type="number"
              value={formData.price || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value ? parseFloat(e.target.value) : undefined }))}
            />

            <TextField
              fullWidth
              label="Poznámky"
              multiline
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Zrušiť</Button>
          <Button type="submit" variant="contained">
            {document?.id ? 'Uložiť' : 'Pridať'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 