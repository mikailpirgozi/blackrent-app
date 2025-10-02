import { FileText, Paperclip, Wrench, Truck, Shield } from 'lucide-react';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Separator,
} from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Textarea,
} from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

// Unified design system imports
import {
  UnifiedButton,
} from '@/components/ui';

// import { useApp } from '../../context/AppContext'; // Migrated to React Query
import { useInsurers } from '../../lib/react-query/hooks/useInsurers';
import { useVehicles } from '../../lib/react-query/hooks/useVehicles';
import type { PaymentFrequency } from '../../types';

import R2FileUpload from './R2FileUpload';

export interface UnifiedDocumentData {
  id?: string | undefined;
  vehicleId: string;
  type:
    | 'insurance_pzp'
    | 'insurance_kasko'
    | 'insurance_pzp_kasko'
    | 'insurance'
    | 'stk'
    | 'ek'
    | 'vignette'
    | 'technical_certificate';

  // Insurance specific
  policyNumber?: string | undefined;
  company?: string | undefined;
  paymentFrequency?: PaymentFrequency | undefined;

  // Vehicle document specific
  documentNumber?: string | undefined;
  notes?: string | undefined;

  // Common fields
  validFrom?: Date | undefined;
  validTo: Date;
  price?: number | undefined;
  filePath?: string | undefined; // Zachováme pre backward compatibility
  filePaths?: string[] | undefined; // Nové pole pre viacero súborov

  // 🟢 BIELA KARTA: Platnosť zelenej karty (len pre PZP poistky)
  greenCardValidFrom?: Date | undefined;
  greenCardValidTo?: Date | undefined;

  // 🚗 STAV KM: Pre Kasko poistky, STK a EK
  kmState?: number | undefined;
}

interface UnifiedDocumentFormProps {
  document?: UnifiedDocumentData | null;
  onSave: (_data: UnifiedDocumentData) => void;
  onCancel: () => void;
}

const getDocumentTypeInfo = (type: string) => {
  switch (type) {
    case 'insurance_pzp':
      return {
        label: 'Poistka - PZP',
        icon: <Shield className="h-4 w-4" />,
        color: '#1976d2',
      };
    case 'insurance_kasko':
      return {
        label: 'Poistka - Kasko',
        icon: <Shield className="h-4 w-4" />,
        color: '#2196f3',
      };
    case 'insurance_pzp_kasko':
      return {
        label: 'Poistka - PZP + Kasko',
        icon: <Shield className="h-4 w-4" />,
        color: '#9c27b0',
      };
    case 'stk':
      return { label: 'STK', icon: <Wrench className="h-4 w-4" />, color: '#388e3c' };
    case 'ek':
      return { label: 'EK', icon: <FileText className="h-4 w-4" />, color: '#f57c00' };
    case 'vignette':
      return {
        label: 'Dialničná známka',
        icon: <Truck className="h-4 w-4" />,
        color: '#7b1fa2',
      };
    // Backward compatibility
    case 'insurance':
      return {
        label: 'Poistka - PZP',
        icon: <Shield className="h-4 w-4" />,
        color: '#1976d2',
      };
    default:
      return { label: 'Dokument', icon: <Paperclip className="h-4 w-4" />, color: '#666' };
  }
};

export default function UnifiedDocumentForm({
  document,
  onSave,
  onCancel,
}: UnifiedDocumentFormProps) {
  // const { state } = useApp(); // Migrated to React Query
  const { data: vehicles = [] } = useVehicles();
  const { data: insurers = [] } = useInsurers();
  const [greenCardManuallyEdited, setGreenCardManuallyEdited] = useState(false);

  const [formData, setFormData] = useState<UnifiedDocumentData>(() => {
    const initialData = {
      vehicleId: document?.vehicleId || '',
      type: document?.type || 'insurance_pzp',
      policyNumber: document?.policyNumber || '',
      company: document?.company || '',
      paymentFrequency: document?.paymentFrequency || 'yearly',
      documentNumber: document?.documentNumber || '',
      notes: document?.notes || '',
      validFrom: document?.validFrom || new Date(), // 🔄 Pre nové poistky nastav dnes
      validTo: document?.validTo || new Date(),
      price: document?.price || 0,
      filePath: document?.filePath || '', // Zachováme pre backward compatibility
      filePaths: document?.filePaths || [], // Nové pole pre viacero súborov
      greenCardValidFrom: document?.greenCardValidFrom || undefined, // 🟢 Biela karta
      greenCardValidTo: document?.greenCardValidTo || undefined, // 🟢 Biela karta
      kmState: document?.kmState || undefined, // 🚗 Stav Km
    };

    // 🔄 Pre nové poistky automaticky vypočítaj validTo
    if (
      !document &&
      (initialData.type === 'insurance_pzp' ||
        initialData.type === 'insurance_kasko' ||
        initialData.type === 'insurance_pzp_kasko') &&
      initialData.validFrom
    ) {
      const calculatedValidTo = (() => {
        const fromDate = new Date(initialData.validFrom);
        const toDate = new Date(fromDate);
        toDate.setFullYear(toDate.getFullYear() + 1); // Default yearly
        toDate.setDate(toDate.getDate() - 1);
        return toDate;
      })();
      initialData.validTo = calculatedValidTo;
    }

    return initialData;
  });

  const [addingInsurer, setAddingInsurer] = useState(false);
  const [newInsurerName, setNewInsurerName] = useState('');

  const [errors] = useState<Record<string, string>>({});

  // 🔄 Automatické dopĺňanie validTo dátumu pre poistky
  const calculateValidToDate = (
    validFrom: Date | undefined,
    frequency: PaymentFrequency
  ): Date => {
    if (!validFrom) return new Date();

    const fromDate = new Date(validFrom);
    const toDate = new Date(fromDate);

    switch (frequency) {
      case 'monthly':
        toDate.setMonth(toDate.getMonth() + 1);
        break;
      case 'quarterly':
        toDate.setMonth(toDate.getMonth() + 3);
        break;
      case 'biannual':
        toDate.setMonth(toDate.getMonth() + 6);
        break;
      case 'yearly':
        toDate.setFullYear(toDate.getFullYear() + 1);
        break;
      default:
        toDate.setFullYear(toDate.getFullYear() + 1);
    }

    // Odčítame jeden deň aby platnosť bola do predchádzajúceho dňa
    toDate.setDate(toDate.getDate() - 1);
    return toDate;
  };

  // 🔄 Automatické prepočítanie validTo pri zmene validFrom alebo paymentFrequency
  useEffect(() => {
    if (
      (formData.type === 'insurance_pzp' ||
        formData.type === 'insurance_kasko' ||
        formData.type === 'insurance_pzp_kasko') &&
      formData.validFrom &&
      formData.paymentFrequency
    ) {
      const newValidTo = calculateValidToDate(
        formData.validFrom,
        formData.paymentFrequency
      );
      setFormData(prev => ({ ...prev, validTo: newValidTo }));
    }
  }, [formData.validFrom, formData.paymentFrequency, formData.type]);

  // 🟢 Automatické prepočítanie platnosti zelenej karty pre PZP a PZP+Kasko
  useEffect(() => {
    if (
      (formData.type === 'insurance_pzp' ||
        formData.type === 'insurance_pzp_kasko') &&
      formData.validFrom &&
      formData.validTo &&
      !greenCardManuallyEdited && // Len ak nebola manuálne editovaná
      !document
    ) {
      // Len pre nové dokumenty, nie pri editácii

      // Automaticky nastav platnosť zelenej karty rovnako ako poistky
      setFormData(prev => ({
        ...prev,
        greenCardValidFrom: formData.validFrom,
        greenCardValidTo: formData.validTo,
      }));
    }
  }, [
    formData.validFrom,
    formData.validTo,
    formData.type,
    document,
    greenCardManuallyEdited,
  ]);

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
        filePath: document.filePath || '',
        greenCardValidFrom: document.greenCardValidFrom, // 🟢 Biela karta
        greenCardValidTo: document.greenCardValidTo, // 🟢 Biela karta
      });
    }
  }, [document]);

  // const _validateForm = (): boolean => {
  //   const newErrors: Record<string, string> = {};

  //   if (!formData.vehicleId) {
  //     newErrors.vehicleId = 'Vozidlo je povinné';
  //   }

  //   if (!formData.validTo) {
  //     newErrors.validTo = 'Dátum platnosti do je povinný';
  //   }

  //   if (
  //     formData.type === 'insurance_pzp' ||
  //     formData.type === 'insurance_kasko' ||
  //     formData.type === 'insurance_pzp_kasko'
  //   ) {
  //     if (!formData.policyNumber) {
  //       newErrors.policyNumber = 'Číslo poistky je povinné';
  //     }
  //     if (!formData.company) {
  //       newErrors.company = 'Poisťovňa je povinná';
  //     }
  //   }

  //   if (formData.price && formData.price < 0) {
  //     newErrors.price = 'Cena nemôže byť záporná';
  //   }

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const handleFileUploadSuccess = (
    fileData:
      | { url: string; key: string; filename: string }
      | { url: string; key: string; filename: string }[]
  ) => {
    if (Array.isArray(fileData)) {
      // Viacero súborov - pridaj do filePaths array
      const newUrls = fileData.map(file => file.url);
      setFormData(prev => {
        const existingPaths = prev.filePaths || [];
        const updatedPaths = [...existingPaths, ...newUrls];
        const newData = {
          ...prev,
          filePaths: updatedPaths,
          filePath: existingPaths.length > 0 ? prev.filePath : updatedPaths[0], // Zachovaj pôvodný filePath ak existuje
        };
        return newData;
      });
    } else {
      // Jeden súbor - pridaj do filePaths array (NEPREPISUJ existujúce)
      setFormData(prev => {
        const existingPaths = prev.filePaths || [];
        const updatedPaths = [...existingPaths, fileData.url];
        const newData = {
          ...prev,
          filePaths: updatedPaths,
          filePath: existingPaths.length > 0 ? prev.filePath : fileData.url, // Zachovaj pôvodný filePath ak existuje
        };
        return newData;
      });
    }
  };

  // Form submission handler (currently unused but kept for future use)
  // const _handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!validateForm()) return;
  //   onSave(formData);
  // };

  const typeInfo = getDocumentTypeInfo(formData.type);
  const isInsurance =
    formData.type === 'insurance_pzp' ||
    formData.type === 'insurance_kasko' ||
    formData.type === 'insurance_pzp_kasko';
  const isPZP =
    formData.type === 'insurance_pzp' ||
    formData.type === 'insurance_pzp_kasko'; // PZP alebo PZP+Kasko
  const isKasko =
    formData.type === 'insurance_kasko' ||
    formData.type === 'insurance_pzp_kasko'; // Kasko alebo PZP+Kasko
  const hasKmField =
    formData.type === 'insurance_kasko' ||
    formData.type === 'insurance_pzp_kasko' ||
    formData.type === 'stk' ||
    formData.type === 'ek';

  return (
    <>
      <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            {typeInfo.icon}
            <h2 className="text-xl font-semibold" style={{ color: typeInfo.color }}>
              {document?.id ? 'Upraviť' : 'Pridať'} {typeInfo.label}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Základné informácie */}
            <div className="col-span-1">
              <Card>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-4">
                    Základné informácie
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-1">
                      <div className="space-y-2">
                        <Label htmlFor="vehicle-select">Vozidlo *</Label>
                        <Select
                          value={formData.vehicleId}
                          onValueChange={(value) =>
                            setFormData(prev => ({
                              ...prev,
                              vehicleId: value,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Vyberte vozidlo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.slice().sort((a, b) => {
                              const aText = `${a.brand} ${a.model} (${a.licensePlate})`;
                              const bText = `${b.brand} ${b.model} (${b.licensePlate})`;
                              return aText.localeCompare(bText, 'sk', {
                                sensitivity: 'base',
                              });
                            }).map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {`${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.vehicleId && (
                          <p className="text-sm text-red-500">
                            {errors.vehicleId}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-1">
                      <div className="space-y-2">
                        <Label htmlFor="document-type">Typ dokumentu *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            setFormData(prev => ({
                              ...prev,
                              type: value as UnifiedDocumentData['type'],
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Vyberte typ dokumentu..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="insurance_pzp">
                              Poistka - PZP
                            </SelectItem>
                            <SelectItem value="insurance_kasko">
                              Poistka - Kasko
                            </SelectItem>
                            <SelectItem value="insurance_pzp_kasko">
                              Poistka - PZP + Kasko
                            </SelectItem>
                            <SelectItem value="stk">STK</SelectItem>
                            <SelectItem value="ek">EK</SelectItem>
                            <SelectItem value="vignette">Dialničná známka</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Insurance specific fields */}
                    {isInsurance && (
                      <>
                        <div className="col-span-1 md:col-span-1">
                          <div className="space-y-2">
                            <Label htmlFor="policy-number">Číslo poistky *</Label>
                            <Input
                              id="policy-number"
                              value={formData.policyNumber}
                              onChange={(e) =>
                                setFormData(prev => ({
                                  ...prev,
                                  policyNumber: e.target.value,
                                }))
                              }
                              className={cn(errors.policyNumber && "border-red-500")}
                            />
                            {errors.policyNumber && (
                              <p className="text-sm text-red-500">
                                {errors.policyNumber}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-1">
                          <div className="space-y-2">
                            <Label htmlFor="company">Poisťovňa *</Label>
                            <Select
                              value={formData.company || ''}
                              onValueChange={(value) => {
                                if (value === '__add_new__') {
                                  setAddingInsurer(true);
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    company: value,
                                  }));
                                }
                              }}
                            >
                              <SelectTrigger className={cn("w-full", errors.company && "border-red-500")}>
                                <SelectValue placeholder="Vyberte poisťovňu..." />
                              </SelectTrigger>
                              <SelectContent>
                                {insurers.map(insurer => (
                                  <SelectItem key={insurer.id} value={insurer.name}>
                                    {insurer.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="__add_new__">
                                  <em>+ Pridať novú poisťovňu</em>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.company && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors.company}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-1">
                          <div className="space-y-2">
                            <Label htmlFor="payment-frequency">Frekvencia platenia</Label>
                            <Select
                              value={formData.paymentFrequency || 'yearly'}
                              onValueChange={(value) =>
                                setFormData(prev => ({
                                  ...prev,
                                  paymentFrequency: value as PaymentFrequency,
                                }))
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Vyberte frekvenciu..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">
                                  Mesačne (platnosť +1 mesiac)
                                </SelectItem>
                                <SelectItem value="quarterly">
                                  Štvrťročne (platnosť +3 mesiace)
                                </SelectItem>
                                <SelectItem value="biannual">
                                  Polročne (platnosť +6 mesiacov)
                                </SelectItem>
                                <SelectItem value="yearly">
                                  Ročne (platnosť +1 rok)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 🟢 BIELA KARTA: Samostatná sekcia len pre PZP poistky */}
            {isPZP && (
              <div className="col-span-1">
                <Card>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold">
                        🟢 Platnosť bielej karty
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        Automatické
                      </Badge>
                    </div>

                    <Alert className="mb-4">
                      <AlertDescription>
                        💡 Platnosť zelenej karty sa automaticky nastaví podľa
                        platnosti poistky. Môžete ju však upraviť podľa potreby.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-1">
                        <div className="space-y-2">
                          <Label htmlFor="green-card-from">Biela karta platná od</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !formData.greenCardValidFrom && "text-muted-foreground"
                                )}
                              >
                                {formData.greenCardValidFrom ? (
                                  new Date(formData.greenCardValidFrom).toLocaleDateString('sk-SK')
                                ) : (
                                  "Vyberte dátum"
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.greenCardValidFrom ? new Date(formData.greenCardValidFrom) : undefined}
                                onSelect={(date) =>
                                  setFormData(prev => ({
                                    ...prev,
                                    greenCardValidFrom: date || undefined,
                                  }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-1">
                        <div className="space-y-2">
                          <Label htmlFor="green-card-to">Biela karta platná do</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !formData.greenCardValidTo && "text-muted-foreground"
                                )}
                              >
                                {formData.greenCardValidTo ? (
                                  new Date(formData.greenCardValidTo).toLocaleDateString('sk-SK')
                                ) : (
                                  "Vyberte dátum"
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.greenCardValidTo ? new Date(formData.greenCardValidTo) : undefined}
                                onSelect={(date) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    greenCardValidTo: date || undefined,
                                  }));
                                  setGreenCardManuallyEdited(true);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Platnosť a cena */}
            <div className="col-span-1">
              <Card>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-4">
                    Platnosť a cena
                  </h3>

                  {/* 💡 Informačný alert pre automatické dopĺňanie */}
                  {isInsurance && (
                    <Alert className="mb-4">
                      <AlertDescription>
                        💡 <strong>Automatické dopĺňanie:</strong> Dátum "Platné
                        do" sa automaticky vypočíta na základě dátumu "Platné
                        od" a frekvencie platenia.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-1">
                      <div className="space-y-2">
                        <Label htmlFor="valid-from">Platné od</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.validFrom && "text-muted-foreground"
                              )}
                            >
                              {formData.validFrom ? (
                                new Date(formData.validFrom).toLocaleDateString('sk-SK')
                              ) : (
                                "Vyberte dátum"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.validFrom ? new Date(formData.validFrom) : undefined}
                              onSelect={(date) =>
                                setFormData(prev => ({
                                  ...prev,
                                  validFrom: date || undefined,
                                }))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-1">
                      <div className="space-y-2">
                        <Label htmlFor="valid-to">
                          {isInsurance ? 'Platné do (automaticky)' : 'Platné do'}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.validTo && "text-muted-foreground",
                                isInsurance && "bg-gray-100 text-gray-600"
                              )}
                              disabled={isInsurance}
                            >
                              {formData.validTo ? (
                                new Date(formData.validTo).toLocaleDateString('sk-SK')
                              ) : (
                                "Vyberte dátum"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.validTo ? new Date(formData.validTo) : undefined}
                              onSelect={(date) =>
                                setFormData(prev => ({
                                  ...prev,
                                  validTo: date || new Date(),
                                }))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {isInsurance && (
                          <p className="text-sm text-gray-500">
                            Automaticky vypočítané podľa frekvencie platenia
                          </p>
                        )}
                        {errors.validTo && !isInsurance && (
                          <p className="text-sm text-red-500">
                            {errors.validTo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-1">
                      <div className="space-y-2">
                        <Label htmlFor="price">Cena (€)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price || ''}
                          onChange={(e) =>
                            setFormData(prev => ({
                              ...prev,
                              price: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className={cn(errors.price && "border-red-500")}
                        />
                        {errors.price && (
                          <p className="text-sm text-red-500">
                            {errors.price}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 🚗 STAV KM: Pre Kasko poistky, STK a EK */}
            {hasKmField && (
              <div className="col-span-1">
                <Card>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold">
                        🚗 Stav kilometrov
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {isKasko ? 'Kasko' : 'Kontrola'}
                      </Badge>
                    </div>

                    <Alert className="mb-4">
                      <AlertDescription>
                        💡{' '}
                        {isKasko
                          ? 'Zadajte stav kilometrov pri uzatváraní Kasko poistky pre evidenciu.'
                          : 'Zadajte stav kilometrov pri STK/EK kontrole.'}
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-1">
                        <div className="space-y-2">
                          <Label htmlFor="km-state">Stav kilometrov</Label>
                          <Input
                            id="km-state"
                            type="number"
                            min="0"
                            step="1"
                            value={formData.kmState || ''}
                            onChange={(e) =>
                              setFormData(prev => ({
                                ...prev,
                                kmState: parseInt(e.target.value) || undefined,
                              }))
                            }
                            placeholder="Napríklad: 125000"
                          />
                          <p className="text-sm text-gray-500">
                            Zadajte aktuálny stav kilometrov
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Vehicle document specific fields */}
            {!isInsurance && (
              <div className="col-span-1">
                <Card>
                  <CardContent>
                    <h3 className="text-lg font-semibold mb-4">
                      Dodatočné informácie
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-1">
                        <div className="space-y-2">
                          <Label htmlFor="document-number">Číslo dokumentu</Label>
                          <Input
                            id="document-number"
                            value={formData.documentNumber}
                            onChange={(e) =>
                              setFormData(prev => ({
                                ...prev,
                                documentNumber: e.target.value,
                              }))
                            }
                            placeholder="Napríklad: ABC123456"
                          />
                          <p className="text-sm text-gray-500">
                            Zadajte číslo dokumentu alebo poistky
                          </p>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <div className="space-y-2">
                          <Label htmlFor="notes">Poznámky</Label>
                          <Textarea
                            id="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) =>
                              setFormData(prev => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="Zadajte poznámky..."
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* File Upload */}
            <div className="col-span-1">
              <Card>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-4">
                    Priložený súbor
                  </h3>

                  {formData.filePaths && formData.filePaths.length > 0 && (
                    <Alert className="mb-4">
                      <AlertDescription>
                        {formData.filePaths.length === 1
                          ? 'Súbor už je priložený. Môžete pridať viac súborov.'
                          : `${formData.filePaths.length} súborov je už priložených. Môžete pridať viac súborov.`}
                      </AlertDescription>
                    </Alert>
                  )}

                  <R2FileUpload
                    type="document"
                    entityId={formData.vehicleId || 'temp'}
                    onUploadSuccess={handleFileUploadSuccess}
                    onUploadError={error =>
                      console.error('Upload error:', error)
                    }
                    acceptedTypes={[
                      'image/jpeg',
                      'image/png',
                      'image/webp',
                      'application/pdf',
                    ]}
                    maxSize={10}
                    multiple={true}
                    label="Nahrať súbory (PDF, JPG, PNG) - môžete vybrať viacero"
                  />

                  {formData.filePaths && formData.filePaths.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Priložené súbory ({formData.filePaths.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.filePaths.map((filePath, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-gray-100 px-3 py-1"
                            onClick={() => window.open(filePath, '_blank')}
                          >
                            {`${index + 1}. ${filePath.split('/').pop()}`}
                            <button
                              className="ml-2 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Odstráň súbor z filePaths
                                setFormData(prev => {
                                  const updatedPaths =
                                    prev.filePaths?.filter(
                                      (_, i) => i !== index
                                    ) || [];
                                  return {
                                    ...prev,
                                    filePaths: updatedPaths,
                                    filePath: updatedPaths[0] || '', // Zachováme pre backward compatibility
                                  };
                                });
                              }}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Action buttons */}
          <div className="flex gap-4 justify-end">
            <UnifiedButton variant="outline" onClick={onCancel}>
              Zrušiť
            </UnifiedButton>
            <UnifiedButton
              variant="default"
              onClick={() => onSave(formData)}
            >
              {document?.id ? 'Uložiť zmeny' : 'Pridať dokument'}
            </UnifiedButton>
          </div>
        </div>

      {/* Dialóg pre pridanie novej poistovne */}
      {addingInsurer && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setAddingInsurer(false)}
        >
          <Card className="min-w-[400px] m-2" onClick={e => e.stopPropagation()}>
            <CardContent>
              <h3 className="text-lg font-semibold mb-4">
                Pridať novú poisťovňu
              </h3>
              <div className="space-y-2">
                <Label htmlFor="new-insurer-name">Názov poisťovne</Label>
                <Input
                  id="new-insurer-name"
                  value={newInsurerName}
                  onChange={(e) => setNewInsurerName(e.target.value)}
                  autoFocus
                  placeholder="Zadajte názov poisťovne..."
                />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddingInsurer(false);
                    setNewInsurerName('');
                  }}
                >
                  Zrušiť
                </Button>
                <Button
                  onClick={async () => {
                    if (newInsurerName.trim()) {
                      try {
                        // Volám API pre vytvorenie poistovne
                        // Použijem správnu API URL
                        const apiUrl =
                          process.env.NODE_ENV === 'production'
                            ? 'https://blackrent-app-production-4d6f.up.railway.app/api/insurers'
                            : `${window.location.protocol}//${window.location.hostname}:3001/api/insurers`;

                        const response = await fetch(apiUrl, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token')}`,
                          },
                          body: JSON.stringify({ name: newInsurerName.trim() }),
                        });

                        if (response.ok) {
                          await response.json();

                          // Po úspešnom pridaní nastavím novú poistovňu ako vybranú
                          setFormData(prev => ({
                            ...prev,
                            company: newInsurerName.trim(),
                          }));
                          setAddingInsurer(false);
                          setNewInsurerName('');

                          // Refresh poistovní v AppContext (ak by bolo potrebné)
                          window.location.reload();
                        } else {
                          // Handle error silently or show user-friendly message
                        }
                      } catch (error) {
                        // Handle error silently or show user-friendly message
                      }
                    }
                  }}
                  disabled={!newInsurerName.trim()}
                >
                  Pridať
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
