/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Plus as AddIcon,
  Trash2 as DeleteIcon,
  FileText as DocumentIcon,
  Edit2 as EditIcon,
} from 'lucide-react';
import { UnifiedButton as Button } from '@/components/ui/UnifiedButton';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedBadge as Badge } from '@/components/ui/UnifiedBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/SearchableSelect';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import { useCompanies, useCreateCompany } from '@/lib/react-query/hooks/useCompanies';
import {
  useCreateVehicleDocument,
  useDeleteVehicleDocument,
  useUpdateVehicleDocument,
  useVehicleDocuments,
} from '@/lib/react-query/hooks/useVehicleDocuments';
// import { useCreateVehicle, useUpdateVehicle } from '@/lib/react-query/hooks/useVehicles'; // Not used in this component
import type {
  DocumentType,
  PricingTier,
  Vehicle,
  VehicleCategory,
  VehicleDocument,
} from '../../types';
import UnifiedDocumentForm, {
  type UnifiedDocumentData,
} from '../common/UnifiedDocumentForm';

// 🗑️ REMOVED: Unused ExpiryStatusData interface
// interface ExpiryStatusData { ... }

import TechnicalCertificateUpload from './TechnicalCertificateUpload';

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  onSave: (..._args: any[]) => void;
  onCancel: () => void;
}

export default function VehicleForm({
  vehicle,
  onSave,
  onCancel,
}: VehicleFormProps) {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: companies = [] } = useCompanies();
  const { data: vehicleDocumentsData = [] } = useVehicleDocuments();
  const createVehicleDocumentMutation = useCreateVehicleDocument();
  const updateVehicleDocumentMutation = useUpdateVehicleDocument();
  const deleteVehicleDocumentMutation = useDeleteVehicleDocument();

  // ✅ FIX: Use proper mutation hook for companies
  const createCompanyMutation = useCreateCompany();
  
  const createCompany = async (companyData: { id: string; name: string; commissionRate: number; isActive: boolean; createdAt: Date }) => {
    return createCompanyMutation.mutateAsync(companyData);
  };

  const createVehicleDocument = async (document: VehicleDocument) => {
    return createVehicleDocumentMutation.mutateAsync(document);
  };

  const updateVehicleDocument = async (document: VehicleDocument) => {
    return updateVehicleDocumentMutation.mutateAsync(document);
  };

  const deleteVehicleDocument = async (id: string) => {
    return deleteVehicleDocumentMutation.mutateAsync(id);
  };
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
  const [showUnifiedDocumentForm, setShowUnifiedDocumentForm] = useState(false);
  const [unifiedDocumentData, setUnifiedDocumentData] =
    useState<UnifiedDocumentData | null>(null);

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
      // Načítaj dokumenty pre existujúce vozidlo
      const vehicleDocs = vehicleDocumentsData.filter(
        doc => doc.vehicleId === vehicle.id
      );
      setVehicleDocuments(vehicleDocs);
    }
  }, [vehicle, vehicleDocumentsData]);

  const handleInputChange = (field: keyof Vehicle, value: unknown) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // 💰 SMART COMMISSION: Pri zmene firmy nastav default províziu
      if (field === 'ownerCompanyId' && value) {
        const selectedCompany = companies?.find(c => c.id === value);
        if (selectedCompany && selectedCompany.defaultCommissionRate) {
          // Nastav default províziu len ak aktuálna je 20% (default)
          if (!prev.commission || prev.commission.value === 20) {
            updated.commission = {
              type: 'percentage',
              value: selectedCompany.defaultCommissionRate || 20,
            };
            // console.log(
            //   `💰 Auto-set commission to ${selectedCompany.defaultCommissionRate}% for company ${selectedCompany.name}`
            // );
          }
        }
      }

      return updated;
    });
  };

  const handlePricingChange = (
    index: number,
    field: keyof PricingTier,
    value: string | number
  ) => {
    const newPricing = [...(formData.pricing || [])];
    newPricing[index] = { 
      id: newPricing[index]?.id || uuidv4(),
      minDays: newPricing[index]?.minDays || 1,
      maxDays: newPricing[index]?.maxDays || 30,
      pricePerDay: newPricing[index]?.pricePerDay || 0,
      [field]: value 
    };
    setFormData(prev => ({ ...prev, pricing: newPricing }));
  };

  // 🗑️ REMOVED: Unused pricing tier functions
  // const _addPricingTier = () => { ... }
  // const _removePricingTier = (index: number) => { ... }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const completeVehicle: Vehicle = {
      id: vehicle?.id || uuidv4(),
      brand: formData.brand || '',
      model: formData.model || '',
      licensePlate: formData.licensePlate || '',
      vin: formData.vin || '', // 🆔 VIN číslo
      company: formData.company || '',
      pricing: formData.pricing || [],
      commission: formData.commission || { type: 'percentage', value: 20 },
      status: formData.status || 'available',
      category: formData.category || 'stredna-trieda',
      extraKilometerRate: formData.extraKilometerRate || 0.3, // 🚗 NOVÉ: Extra kilometer rate
    };
    onSave(completeVehicle);
  };

  // 🗑️ REMOVED: Unused allCompanies variable
  // const allCompanies = Array.from(...).sort();

  // 🏢 AKTÍVNE FIRMY PRE DROPDOWN
  const activeCompanies = companies?.filter(c => c.isActive !== false) || [];

  // Helper funkcie pre dokumenty - prepojené s UnifiedDocumentForm
  const handleAddDocument = () => {
    if (!formData.id) {
      // alert('Najprv uložte vozidlo, potom môžete pridávať dokumenty.');
      return;
    }

    setUnifiedDocumentData({
      vehicleId: formData.id,
      type: 'stk' as const, // Default typ
      validFrom: new Date(),
      validTo: new Date(),
    } as UnifiedDocumentData);
    setShowUnifiedDocumentForm(true);
  };

  const handleEditDocument = (doc: VehicleDocument) => {
    setUnifiedDocumentData({
      id: doc.id,
      vehicleId: doc.vehicleId,
      type: doc.documentType as UnifiedDocumentData['type'],
      documentNumber: doc.documentNumber,
      validFrom: doc.validFrom,
      validTo: doc.validTo,
      price: doc.price,
      notes: doc.notes,
      kmState: (doc as VehicleDocument & { kmState?: number }).kmState, // Pre STK/EK s km stavom
    });
    setShowUnifiedDocumentForm(true);
  };

  const handleDeleteDocument = async (id: string) => {
    // if (window.confirm('Naozaj chcete vymazať tento dokument?')) {
      try {
        await deleteVehicleDocument(id);
        setVehicleDocuments(prev => prev.filter(doc => doc.id !== id));
      } catch (error) {
        console.error('Chyba pri mazaní dokumentu:', error);
      }
    // }
  };

  const handleUnifiedDocumentSave = async (data: UnifiedDocumentData) => {
    try {
      if (data.id) {
        // Aktualizácia existujúceho dokumentu
        const vehicleDocData: VehicleDocument = {
          id: data.id,
          vehicleId: data.vehicleId,
          documentType: data.type as DocumentType,
          validFrom: data.validFrom || new Date(),
          validTo: data.validTo || new Date(),
          documentNumber: data.documentNumber,
          price: data.price,
          notes: data.notes,
          ...(data.kmState && { kmState: data.kmState }), // Pre STK/EK s km stavom
        } as VehicleDocument;
        await updateVehicleDocument(vehicleDocData);
      } else {
        // Vytvorenie nového dokumentu
        const vehicleDocData: VehicleDocument = {
          id: uuidv4(),
          vehicleId: data.vehicleId,
          documentType: data.type as DocumentType,
          validFrom: data.validFrom || new Date(),
          validTo: data.validTo || new Date(),
          documentNumber: data.documentNumber,
          price: data.price,
          notes: data.notes,
          ...(data.kmState && { kmState: data.kmState }), // Pre STK/EK s km stavom
        } as VehicleDocument;
        await createVehicleDocument(vehicleDocData);
      }

      // Obnovenie zoznamu dokumentov
      const vehicleDocs = vehicleDocumentsData.filter(
        doc => doc.vehicleId === formData.id
      );
      setVehicleDocuments(vehicleDocs);
      setShowUnifiedDocumentForm(false);
      setUnifiedDocumentData(null);
    } catch (error) {
      console.error('Chyba pri ukladaní dokumentu:', error);
      // alert('Chyba pri ukladaní dokumentu');
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
      // alert('Chyba pri vytváraní firmy');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="brand">Značka *</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('brand', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('model', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="licensePlate">ŠPZ *</Label>
          <Input
            id="licensePlate"
            value={formData.licensePlate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('licensePlate', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="vin">VIN číslo</Label>
          <Input
            id="vin"
            value={formData.vin || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('vin', e.target.value)}
            placeholder="Zadajte VIN číslo vozidla"
          />
          <p className="text-sm text-muted-foreground mt-1">
            17-miestny identifikačný kód vozidla
          </p>
        </div>
        {/* Firma/Autopožičovňa - SearchableSelect s rozšírenými informáciami */}
        <div>
          <SearchableSelect
            label="Firma/Autopožičovňa"
            required
            value={formData.ownerCompanyId || ''}
            onValueChange={(value) => {
              const selectedCompany = activeCompanies.find(c => c.id === value);
              if (selectedCompany) {
                handleInputChange('company', selectedCompany.name);
                handleInputChange('ownerCompanyId', value);
              }
            }}
            options={activeCompanies.map(company => ({
              value: company.id,
              label: company.name,
              subtitle: `${company.ownerName ? `👤 ${company.ownerName} • ` : ''}💰 Default provízia: ${company.defaultCommissionRate || 20}%${!company.isActive ? ' • NEAKTÍVNA' : ''}`,
              searchText: `${company.name} ${company.ownerName || ''}`,
              data: company,
            }))}
            placeholder="Vyberte firmu..."
            searchPlaceholder="Hľadať firmu podľa názvu alebo majiteľa..."
            emptyMessage="Žiadna firma nenájdená."
            showAddNew
            onAddNew={() => setAddingCompany(true)}
            addNewLabel="+ Pridať novú firmu"
          />
          {addingCompany && (
            <div className="flex gap-2 mt-2">
              <Input
                autoFocus
                value={newCompanyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCompanyName(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleAddCompany();
                  }
                }}
                placeholder="Názov novej firmy"
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddCompany}>
                <AddIcon className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddingCompany(false)}>
                Zrušiť
              </Button>
            </div>
          )}
        </div>

        {/* 🚗 CATEGORY SELECT - Kategória vozidla */}
        <div>
          <Label htmlFor="category">Kategória vozidla</Label>
          <Select
            value={formData.category || 'stredna-trieda'}
            onValueChange={(value: string) =>
              handleInputChange('category', value as VehicleCategory)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Vyberte kategóriu..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nizka-trieda">🚗 Nízka trieda</SelectItem>
              <SelectItem value="stredna-trieda">🚙 Stredná trieda</SelectItem>
              <SelectItem value="vyssia-stredna">🚘 Vyššia stredná trieda</SelectItem>
              <SelectItem value="luxusne">💎 Luxusné vozidlá</SelectItem>
              <SelectItem value="sportove">🏎️ Športové vozidlá</SelectItem>
              <SelectItem value="suv">🚜 SUV</SelectItem>
              <SelectItem value="viacmiestne">👨‍👩‍👧‍👦 Viacmiestne vozidlá</SelectItem>
              <SelectItem value="dodavky">📦 Dodávky</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Stav</Label>
          <Select
            value={formData.status ?? 'available'}
            onValueChange={(value: string) => handleInputChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Vyberte status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Dostupné</SelectItem>
              <SelectItem value="rented">Prenajaté</SelectItem>
              <SelectItem value="maintenance">Údržba</SelectItem>
              <SelectItem value="temporarily_removed">Dočasne vyradené</SelectItem>
              <SelectItem value="removed">Vyradené</SelectItem>
              <SelectItem value="transferred">Prepisané</SelectItem>
              <SelectItem value="private">🏠 Súkromné</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="flex items-center gap-2">
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
                  <Badge
                    variant={isUsingDefault ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {
                      isUsingDefault
                        ? `Default (${selectedCompany.defaultCommissionRate}%)`
                        : 'Vlastná hodnota'
                    }
                  </Badge>
                );
              })()}
          </Label>
          <RadioGroup
            value={formData.commission?.type ?? 'percentage'}
            onValueChange={(value: string) =>
              handleInputChange('commission', {
                ...formData.commission,
                type: value as 'percentage' | 'fixed',
              })
            }
            className="flex flex-row gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage">Percentá</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fixed" id="fixed" />
              <Label htmlFor="fixed">Fixná suma</Label>
            </div>
          </RadioGroup>
          <div className="mt-4">
            <Label htmlFor="commission-value">
              {
                formData.commission?.type === 'percentage'
                  ? 'Percentá (%)'
                  : 'Suma (€)'
              }
            </Label>
            <Input
              id="commission-value"
              type="number"
              value={formData.commission?.value || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange('commission', {
                  ...formData.commission,
                  value: parseFloat(e.target.value),
                })
              }
            />
            {formData.ownerCompanyId &&
              (() => {
                const selectedCompany = activeCompanies.find(
                  c => c.id === formData.ownerCompanyId
                );
                return selectedCompany ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Default provízia firmy: {selectedCompany.defaultCommissionRate || 20}%
                  </p>
                ) : null;
              })()}
          </div>
        </div>

        <div className="col-span-full">
          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Cenotvorba</h3>
              </div>
              {formData.pricing?.map((tier, index) => (
                <div
                  key={tier.id}
                  className="flex gap-4 mb-4 items-center"
                >
                  <Label className="w-24 text-sm">
                    {(() => {
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
                  </Label>
                  <Input
                    type="number"
                    value={tier.pricePerDay}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handlePricingChange(
                        index,
                        'pricePerDay',
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-[150px]"
                  />
                </div>
              ))}

              {/* 🚗 NOVÉ: Extra kilometer rate */}
              <Separator className="my-4" />
              <div className="flex gap-4 items-center">
                <div>
                  <Label htmlFor="extra-km">Cena za extra km (€/km)</Label>
                  <Input
                    id="extra-km"
                    type="number"
                    value={formData.extraKilometerRate || 0.3}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange(
                        'extraKilometerRate',
                        parseFloat(e.target.value) || 0.3
                      )
                    }
                    className="w-[200px]"
                    step="0.01"
                    min="0"
                    max="10"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Cena za každý kilometer nad povolený limit
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evidencia platnosti */}
        {formData.id && (
          <div className="col-span-full">
            <Card>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <DocumentIcon className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Evidencia platnosti</h3>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleAddDocument}
                  >
                    <AddIcon className="h-4 w-4 mr-2" />
                    Pridať dokument
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {vehicleDocuments.map(doc => {
                    const expiryStatus = getExpiryStatus(doc.validTo);
                    return (
                      <div key={doc.id}>
                        <Card
                          className={`border hover:shadow-md ${
                            expiryStatus.status === 'expired'
                              ? 'border-red-500'
                              : expiryStatus.status === 'expiring'
                                ? 'border-orange-500'
                                : 'border-gray-200'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-semibold">
                                {getDocumentTypeLabel(doc.documentType)}
                              </p>
                              <Badge
                                variant={
                                  expiryStatus.status === 'expired'
                                    ? 'destructive'
                                    : expiryStatus.status === 'expiring'
                                      ? 'secondary'
                                      : 'default'
                                }
                                className="text-xs"
                              >
                                {expiryStatus.text}
                              </Badge>
                            </div>

                            {doc.documentNumber && (
                              <p className="text-sm text-muted-foreground mb-2">
                                Číslo: {doc.documentNumber}
                              </p>
                            )}

                            <p className="text-sm text-muted-foreground mb-2">
                              Platné do:{' '}
                              {new Date(doc.validTo).toLocaleDateString()}
                            </p>

                            {doc.price && (
                              <p className="text-sm text-muted-foreground mb-2">
                                Cena: {doc.price.toFixed(2)} €
                              </p>
                            )}

                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditDocument(doc)}
                                className="h-8 w-8 p-0"
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <DeleteIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}

                  {vehicleDocuments.length === 0 && (
                    <div className="col-span-12">
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Žiadne dokumenty evidované. Kliknite na "Pridať
                        dokument" pre pridanie STK, EK alebo dialničnej známky.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="col-span-full flex gap-4 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Zrušiť
          </Button>
          <Button type="submit">
            {vehicle ? 'Uložiť zmeny' : 'Pridať vozidlo'}
          </Button>
        </div>
      </div>

      {/* UnifiedDocumentForm pre STK/EK/Dialničné dokumenty */}
      <Dialog
        open={showUnifiedDocumentForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowUnifiedDocumentForm(false);
            setUnifiedDocumentData(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {unifiedDocumentData?.id ? 'Upraviť' : 'Pridať'} dokument
            </DialogTitle>
            <DialogDescription>
              Pridajte alebo upravte dokument pre vozidlo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (unifiedDocumentData) {
              handleUnifiedDocumentSave(unifiedDocumentData as UnifiedDocumentData);
            }
          }}>
            <UnifiedDocumentForm
              document={unifiedDocumentData}
              onSave={document =>
                handleUnifiedDocumentSave(document as UnifiedDocumentData)
              }
              onCancel={() => {
                setShowUnifiedDocumentForm(false);
                setUnifiedDocumentData(null);
              }}
            />
          </form>
        </DialogContent>
      </Dialog>

      {/* 📄 NOVÉ: Technický preukaz vozidla */}
      {vehicle?.id && (
        <TechnicalCertificateUpload
          vehicleId={vehicle.id}
          vehicleName={`${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
        />
      )}
    </form>
  );
}
