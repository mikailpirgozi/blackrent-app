import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as DocumentIcon,
} from '@mui/icons-material';
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
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useApp } from '../../context/AppContext';
import {
  Vehicle,
  PricingTier,
  VehicleDocument,
  DocumentType,
  VehicleCategory,
} from '../../types';
import UnifiedDocumentForm from '../common/UnifiedDocumentForm';

import TechnicalCertificateUpload from './TechnicalCertificateUpload';

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onSave: (vehicle: Vehicle) => void;
  onCancel: () => void;
}

export default function VehicleForm({
  vehicle,
  onSave,
  onCancel,
}: VehicleFormProps) {
  const {
    state,
    createCompany,
    createVehicleDocument,
    updateVehicleDocument,
    deleteVehicleDocument,
  } = useApp();
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
    category: 'stredna-trieda' as VehicleCategory, // Default kategória
    extraKilometerRate: 0.3, // 🚗 Default cena za extra km
  });
  const [addingCompany, setAddingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [vehicleDocuments, setVehicleDocuments] = useState<VehicleDocument[]>(
    []
  );
  const [editingDocument, setEditingDocument] =
    useState<VehicleDocument | null>(null);
  const [showUnifiedDocumentForm, setShowUnifiedDocumentForm] = useState(false);
  const [unifiedDocumentData, setUnifiedDocumentData] = useState<any>(null);

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
      // Načítaj dokumenty pre existujúce vozidlo
      const vehicleDocs = state.vehicleDocuments.filter(
        doc => doc.vehicleId === vehicle.id
      );
      setVehicleDocuments(vehicleDocs);
    }
  }, [vehicle, state.vehicleDocuments]);

  const handleInputChange = (field: keyof Vehicle, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // 💰 SMART COMMISSION: Pri zmene firmy nastav default províziu
      if (field === 'ownerCompanyId' && value) {
        const selectedCompany = state.companies?.find(c => c.id === value);
        if (selectedCompany && selectedCompany.defaultCommissionRate) {
          // Nastav default províziu len ak aktuálna je 20% (default)
          if (!prev.commission || prev.commission.value === 20) {
            updated.commission = {
              type: 'percentage',
              value: selectedCompany.defaultCommissionRate || 20,
            };
            console.log(
              `💰 Auto-set commission to ${selectedCompany.defaultCommissionRate}% for company ${selectedCompany.name}`
            );
          }
        }
      }

      return updated;
    });
  };

  const handlePricingChange = (
    index: number,
    field: keyof PricingTier,
    value: any
  ) => {
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
      vin: formData.vin || undefined, // 🆔 VIN číslo
      company: formData.company || '',
      pricing: formData.pricing || [],
      commission: formData.commission || { type: 'percentage', value: 20 },
      status: formData.status || 'available',
      category: formData.category || 'stredna-trieda',
      extraKilometerRate: formData.extraKilometerRate || 0.3, // 🚗 NOVÉ: Extra kilometer rate
    };
    onSave(completeVehicle);
  };

  // 🔍 FILTROVANIE AKTÍVNYCH FIRIEM + company names
  const allCompanies = Array.from(
    new Set([
      ...state.companies
        .filter(c => c.isActive !== false) // Len aktívne firmy
        .map(c => c.name),
      ...state.vehicles
        .map(v => v.company)
        .filter((c): c is string => Boolean(c)),
    ])
  ).sort();

  // 🏢 AKTÍVNE FIRMY PRE DROPDOWN
  const activeCompanies =
    state.companies?.filter(c => c.isActive !== false) || [];

  // Helper funkcie pre dokumenty - prepojené s UnifiedDocumentForm
  const handleAddDocument = () => {
    if (!formData.id) {
      alert('Najprv uložte vozidlo, potom môžete pridávať dokumenty.');
      return;
    }

    setUnifiedDocumentData({
      vehicleId: formData.id,
      type: 'stk', // Default typ
    });
    setShowUnifiedDocumentForm(true);
  };

  const handleEditDocument = (doc: VehicleDocument) => {
    setUnifiedDocumentData({
      id: doc.id,
      vehicleId: doc.vehicleId,
      type: doc.documentType,
      documentNumber: doc.documentNumber,
      validFrom: doc.validFrom,
      validTo: doc.validTo,
      price: doc.price,
      notes: doc.notes,
      kmState: (doc as any).kmState, // Pre STK/EK s km stavom
    });
    setShowUnifiedDocumentForm(true);
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

  const handleUnifiedDocumentSave = async (data: any) => {
    try {
      if (data.id) {
        // Aktualizácia existujúceho dokumentu
        const vehicleDocData = {
          id: data.id,
          vehicleId: data.vehicleId,
          documentType: data.type,
          validFrom: data.validFrom,
          validTo: data.validTo,
          documentNumber: data.documentNumber,
          price: data.price,
          notes: data.notes,
          kmState: data.kmState, // Pre STK/EK s km stavom
        };
        await updateVehicleDocument(vehicleDocData);
      } else {
        // Vytvorenie nového dokumentu
        const vehicleDocData = {
          id: uuidv4(),
          vehicleId: data.vehicleId,
          documentType: data.type,
          validFrom: data.validFrom,
          validTo: data.validTo,
          documentNumber: data.documentNumber,
          price: data.price,
          notes: data.notes,
          kmState: data.kmState, // Pre STK/EK s km stavom
        };
        await createVehicleDocument(vehicleDocData);
      }

      // Obnovenie zoznamu dokumentov
      const vehicleDocs = state.vehicleDocuments.filter(
        doc => doc.vehicleId === formData.id
      );
      setVehicleDocuments(vehicleDocs);
      setShowUnifiedDocumentForm(false);
      setUnifiedDocumentData(null);
    } catch (error) {
      console.error('Chyba pri ukladaní dokumentu:', error);
      alert('Chyba pri ukladaní dokumentu');
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
    const thirtyDaysFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    const validToDate = new Date(validTo);

    if (validToDate < today) {
      return { status: 'expired', color: 'error', text: 'Vypršal' };
    } else if (validToDate <= thirtyDaysFromNow) {
      return { status: 'expiring', color: 'warning', text: 'Vyprší čoskoro' };
    } else {
      return { status: 'valid', color: 'success', text: 'Platný' };
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    try {
      const id = uuidv4();
      await createCompany({
        id,
        name: newCompanyName.trim(),
        commissionRate: 20.0,
        isActive: true,
        createdAt: new Date(),
      });
      setFormData(prev => ({ ...prev, company: newCompanyName.trim() }));
      setNewCompanyName('');
      setAddingCompany(false);
    } catch (error) {
      console.error('Chyba pri vytváraní firmy:', error);
      alert('Chyba pri vytváraní firmy');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        <TextField
          fullWidth
          label="Značka"
          value={formData.brand}
          onChange={e => handleInputChange('brand', e.target.value)}
          required
        />
        <TextField
          fullWidth
          label="Model"
          value={formData.model}
          onChange={e => handleInputChange('model', e.target.value)}
          required
        />
        <TextField
          fullWidth
          label="ŠPZ"
          value={formData.licensePlate}
          onChange={e => handleInputChange('licensePlate', e.target.value)}
          required
        />
        <TextField
          fullWidth
          label="VIN číslo"
          value={formData.vin || ''}
          onChange={e => handleInputChange('vin', e.target.value)}
          placeholder="Zadajte VIN číslo vozidla"
          helperText="17-miestny identifikačný kód vozidla"
        />
        {/* Firma/Autopožičovňa - Select s rozšírenými informáciami */}
        <FormControl fullWidth required>
          <InputLabel>Firma/Autopožičovňa</InputLabel>
          <Select
            value={formData.ownerCompanyId || ''}
            label="Firma/Autopožičovňa"
            onChange={e => {
              const companyId = e.target.value;
              const selectedCompany = activeCompanies.find(
                c => c.id === companyId
              );
              if (selectedCompany) {
                handleInputChange('company', selectedCompany.name);
                handleInputChange('ownerCompanyId', companyId);
              }
            }}
            renderValue={selected => {
              const company = activeCompanies.find(c => c.id === selected);
              return company ? company.name : 'Vyberte firmu';
            }}
          >
            <MenuItem value="">
              <em>Vyberte firmu...</em>
            </MenuItem>
            {activeCompanies.map(company => (
              <MenuItem key={company.id} value={company.id}>
                <Box>
                  <Typography variant="body2">{company.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {company.ownerName && `👤 ${company.ownerName} • `}
                    💰 Default provízia: {company.defaultCommissionRate || 20}%
                    {!company.isActive && ' • NEAKTÍVNA'}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            <MenuItem
              value="__add_new__"
              onClick={() => setAddingCompany(true)}
            >
              <em>+ Pridať novú firmu</em>
            </MenuItem>
          </Select>
          {addingCompany && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                autoFocus
                fullWidth
                size="small"
                label="Názov novej firmy"
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleAddCompany();
                  }
                }}
              />
              <Button size="small" onClick={handleAddCompany}>
                <AddIcon />
              </Button>
              <Button size="small" onClick={() => setAddingCompany(false)}>
                Zrušiť
              </Button>
            </Box>
          )}
        </FormControl>

        {/* 🚗 CATEGORY SELECT - Kategória vozidla */}
        <FormControl fullWidth>
          <InputLabel>Kategória vozidla</InputLabel>
          <Select
            value={formData.category || 'stredna-trieda'}
            onChange={e =>
              handleInputChange('category', e.target.value as VehicleCategory)
            }
            label="Kategória vozidla"
          >
            <MenuItem value="nizka-trieda">🚗 Nízka trieda</MenuItem>
            <MenuItem value="stredna-trieda">🚙 Stredná trieda</MenuItem>
            <MenuItem value="vyssia-stredna">🚘 Vyššia stredná trieda</MenuItem>
            <MenuItem value="luxusne">💎 Luxusné vozidlá</MenuItem>
            <MenuItem value="sportove">🏎️ Športové vozidlá</MenuItem>
            <MenuItem value="suv">🚜 SUV</MenuItem>
            <MenuItem value="viacmiestne">👨‍👩‍👧‍👦 Viacmiestne vozidlá</MenuItem>
            <MenuItem value="dodavky">📦 Dodávky</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Stav</InputLabel>
          <Select
            value={formData.status}
            onChange={e => handleInputChange('status', e.target.value)}
            label="Stav"
          >
            <MenuItem value="available">Dostupné</MenuItem>
            <MenuItem value="rented">Prenajaté</MenuItem>
            <MenuItem value="maintenance">Údržba</MenuItem>
            <MenuItem value="temporarily_removed">Dočasne vyradené</MenuItem>
            <MenuItem value="removed">Vyradené</MenuItem>
            <MenuItem value="transferred">Prepisané</MenuItem>
            <MenuItem value="private">🏠 Súkromné</MenuItem>
          </Select>
        </FormControl>
        <FormControl component="fieldset">
          <Typography variant="subtitle1" gutterBottom>
            Provízia
            {formData.ownerCompanyId &&
              (() => {
                const selectedCompany = activeCompanies.find(
                  c => c.id === formData.ownerCompanyId
                );
                const isUsingDefault =
                  selectedCompany &&
                  formData.commission?.value ===
                    selectedCompany.defaultCommissionRate;
                return (
                  <Chip
                    label={
                      isUsingDefault
                        ? `Default (${selectedCompany.defaultCommissionRate}%)`
                        : 'Vlastná hodnota'
                    }
                    size="small"
                    color={isUsingDefault ? 'primary' : 'secondary'}
                    sx={{ ml: 1 }}
                  />
                );
              })()}
          </Typography>
          <RadioGroup
            row
            value={formData.commission?.type}
            onChange={e =>
              handleInputChange('commission', {
                ...formData.commission,
                type: e.target.value as 'percentage' | 'fixed',
              })
            }
          >
            <FormControlLabel
              value="percentage"
              control={<Radio />}
              label="Percentá"
            />
            <FormControlLabel
              value="fixed"
              control={<Radio />}
              label="Fixná suma"
            />
          </RadioGroup>
          <TextField
            fullWidth
            label={
              formData.commission?.type === 'percentage'
                ? 'Percentá (%)'
                : 'Suma (€)'
            }
            type="number"
            value={formData.commission?.value}
            onChange={e =>
              handleInputChange('commission', {
                ...formData.commission,
                value: parseFloat(e.target.value),
              })
            }
            sx={{ mt: 1 }}
            helperText={
              formData.ownerCompanyId &&
              (() => {
                const selectedCompany = activeCompanies.find(
                  c => c.id === formData.ownerCompanyId
                );
                return selectedCompany
                  ? `Default provízia firmy: ${selectedCompany.defaultCommissionRate || 20}%`
                  : '';
              })()
            }
          />
        </FormControl>

        <Box sx={{ gridColumn: '1 / -1' }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Cenotvorba</Typography>
              </Box>
              {formData.pricing?.map((tier, index) => (
                <Box
                  key={tier.id}
                  sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}
                >
                  <TextField
                    label={(() => {
                      switch (index) {
                        case 0:
                          return '0-1 dni';
                        case 1:
                          return '2-3 dni';
                        case 2:
                          return '4-7 dni';
                        case 3:
                          return '8-14 dni';
                        case 4:
                          return '15-22 dní';
                        case 5:
                          return '23-30 dní';
                        case 6:
                          return '31-9999 dní';
                        default:
                          return '';
                      }
                    })()}
                    type="number"
                    value={tier.pricePerDay}
                    onChange={e =>
                      handlePricingChange(
                        index,
                        'pricePerDay',
                        parseFloat(e.target.value)
                      )
                    }
                    sx={{ width: 150 }}
                  />
                </Box>
              ))}

              {/* 🚗 NOVÉ: Extra kilometer rate */}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Cena za extra km (€/km)"
                  type="number"
                  value={formData.extraKilometerRate || 0.3}
                  onChange={e =>
                    handleInputChange(
                      'extraKilometerRate',
                      parseFloat(e.target.value) || 0.3
                    )
                  }
                  sx={{ width: 200 }}
                  inputProps={{
                    step: 0.01,
                    min: 0,
                    max: 10,
                  }}
                  helperText="Cena za každý kilometer nad povolený limit"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Evidencia platnosti */}
        {formData.id && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DocumentIcon />
                    <Typography variant="h6">Evidencia platnosti</Typography>
                  </Box>
                  <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    onClick={handleAddDocument}
                  >
                    Pridať dokument
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {vehicleDocuments.map(doc => {
                    const expiryStatus = getExpiryStatus(doc.validTo);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={doc.id}>
                        <Card
                          sx={{
                            border: `1px solid ${
                              expiryStatus.status === 'expired'
                                ? '#f44336'
                                : expiryStatus.status === 'expiring'
                                  ? '#ff9800'
                                  : '#e0e0e0'
                            }`,
                            '&:hover': { boxShadow: 2 },
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 600 }}
                              >
                                {getDocumentTypeLabel(doc.documentType)}
                              </Typography>
                              <Chip
                                label={expiryStatus.text}
                                color={expiryStatus.color as any}
                                size="small"
                              />
                            </Box>

                            {doc.documentNumber && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                Číslo: {doc.documentNumber}
                              </Typography>
                            )}

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              Platné do:{' '}
                              {new Date(doc.validTo).toLocaleDateString()}
                            </Typography>

                            {doc.price && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                Cena: {doc.price.toFixed(2)} €
                              </Typography>
                            )}

                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditDocument(doc)}
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
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: 'center', py: 2 }}
                      >
                        Žiadne dokumenty evidované. Kliknite na "Pridať
                        dokument" pre pridanie STK, EK alebo dialničnej známky.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}

        <Box
          sx={{
            gridColumn: '1 / -1',
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="outlined" onClick={onCancel}>
            Zrušiť
          </Button>
          <Button type="submit" variant="contained">
            {vehicle ? 'Uložiť zmeny' : 'Pridať vozidlo'}
          </Button>
        </Box>
      </Box>

      {/* UnifiedDocumentForm pre STK/EK/Dialničné dokumenty */}
      <Dialog
        open={showUnifiedDocumentForm}
        onClose={() => {
          setShowUnifiedDocumentForm(false);
          setUnifiedDocumentData(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <UnifiedDocumentForm
          document={unifiedDocumentData}
          onSave={handleUnifiedDocumentSave}
          onCancel={() => {
            setShowUnifiedDocumentForm(false);
            setUnifiedDocumentData(null);
          }}
        />
      </Dialog>

      {/* 📄 NOVÉ: Technický preukaz vozidla */}
      {vehicle?.id && (
        <TechnicalCertificateUpload
          vehicleId={vehicle.id}
          vehicleName={`${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
        />
      )}
    </Box>
  );
}
