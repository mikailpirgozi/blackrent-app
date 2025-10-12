import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Upload,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useInsurers, useVehicles } from '@/lib/react-query/hooks';
import type { PaymentFrequency, VignetteCountry } from '@/types';
import R2FileUpload from '../common/R2FileUpload';
import { format, parse, isValid } from 'date-fns';

// Import modular components
import { VehicleCombobox } from './batch-components/VehicleCombobox';
import { InsurerManagement } from './batch-components/InsurerManagement';
import { ServiceBookFields } from './batch-components/ServiceBookFields';
import { FinesFields } from './batch-components/FinesFields';
import {
  DocumentTypeSelector,
  DOCUMENT_TYPES,
  type DocumentTypeKey,
} from './batch-components/DocumentTypeSelector';

interface DocumentFormData {
  // Common fields
  validFrom?: Date;
  validTo?: Date;
  price?: number;
  documentNumber?: string;
  notes?: string;
  filePaths?: string[];

  // Insurance specific
  policyNumber?: string;
  company?: string;
  brokerCompany?: string; // 🆕 Maklerská spoločnosť
  paymentFrequency?: PaymentFrequency;
  greenCardValidFrom?: Date;
  greenCardValidTo?: Date;
  kmState?: number;
  // 💰 SPOLUÚČASŤ
  deductibleAmount?: number; // Spoluúčasť v EUR
  deductiblePercentage?: number; // Spoluúčasť v %

  // Service book specific
  serviceDate?: Date;
  serviceDescription?: string;
  serviceKm?: number;
  serviceProvider?: string;

  // Fines specific
  fineDate?: Date;
  customerId?: string;
  isPaid?: boolean;
  ownerPaidDate?: Date;
  customerPaidDate?: Date;
  country?: string;
  enforcementCompany?: string;
  fineAmount?: number;
  fineAmountLate?: number;

  // Vignette specific
  vignetteCountry?: VignetteCountry;
  isRequired?: boolean;
}

interface DocumentSection {
  key: DocumentTypeKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  enabled: boolean;
  data: DocumentFormData;
}

interface BatchDocumentFormProps {
  vehicleId?: string;
  onSave: (
    documents: Array<{
      type: DocumentTypeKey;
      data: DocumentFormData;
    }>
  ) => void;
  onCancel: () => void;
}

export default function BatchDocumentForm({
  vehicleId: initialVehicleId,
  onSave,
  onCancel,
}: BatchDocumentFormProps) {
  const { data: vehicles = [] } = useVehicles();
  const { data: insurers = [] } = useInsurers();

  const [vehicleId, setVehicleId] = useState<string>(initialVehicleId || '');
  const [sections, setSections] = useState<DocumentSection[]>(
    DOCUMENT_TYPES.map(type => ({
      ...type,
      enabled: false,
      data: {
        validFrom: new Date(),
        validTo: new Date(),
        price: 0,
        filePaths: [],
        paymentFrequency:
          type.key === 'insurance_leasing' ? 'monthly' : 'yearly',
      },
    }))
  );
  const [expandedSections, setExpandedSections] = useState<
    Set<DocumentTypeKey>
  >(new Set());
  const [stkDateCopied, setStkDateCopied] = useState(false);

  // Helper functions
  const isInsurance = (key: DocumentTypeKey) => key.startsWith('insurance_');
  const isPZP = (key: DocumentTypeKey) =>
    key === 'insurance_pzp' || key === 'insurance_pzp_kasko';
  const isKasko = (key: DocumentTypeKey) =>
    key === 'insurance_kasko' || key === 'insurance_pzp_kasko';
  const hasKmField = (key: DocumentTypeKey) =>
    isKasko(key) || key === 'stk' || key === 'ek';
  const isLeasing = (key: DocumentTypeKey) => key === 'insurance_leasing';

  // Calculate validTo based on frequency (NOT for leasing)
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
    toDate.setDate(toDate.getDate() - 1);
    return toDate;
  };

  // Toggle section enabled/disabled
  const toggleSection = (key: DocumentTypeKey) => {
    setSections(prev =>
      prev.map(section =>
        section.key === key
          ? { ...section, enabled: !section.enabled }
          : section
      )
    );
    // Auto-expand when enabling
    const section = sections.find(s => s.key === key);
    if (!section?.enabled) {
      setExpandedSections(prev => new Set(prev).add(key));
    }
  };

  // Toggle section expansion
  const toggleExpansion = (key: DocumentTypeKey) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Update section data
  const updateSectionData = (
    key: DocumentTypeKey,
    field: keyof DocumentFormData,
    value: string | number | Date | PaymentFrequency | boolean | undefined
  ) => {
    setSections(prev =>
      prev.map(section => {
        if (section.key === key) {
          const updatedData = { ...section.data, [field]: value };

          // Auto-calculate validTo for insurance (but NOT leasing)
          if (
            isInsurance(key) &&
            !isLeasing(key) &&
            (field === 'validFrom' || field === 'paymentFrequency')
          ) {
            const frequency = (
              field === 'paymentFrequency'
                ? value
                : section.data.paymentFrequency || 'yearly'
            ) as PaymentFrequency;
            const validFrom = (
              field === 'validFrom' ? value : section.data.validFrom
            ) as Date | undefined;
            updatedData.validTo = calculateValidToDate(validFrom, frequency);
          }

          // Auto-set green card validity for PZP
          if (isPZP(key) && (field === 'validFrom' || field === 'validTo')) {
            if (field === 'validFrom') {
              updatedData.greenCardValidFrom = value as Date | undefined;
            }
            if (field === 'validTo') {
              updatedData.greenCardValidTo = value as Date | undefined;
            }
          }

          return { ...section, data: updatedData };
        }
        return section;
      })
    );
  };

  // Copy STK date to EK
  const copyStkDateToEk = () => {
    const stkSection = sections.find(s => s.key === 'stk');
    const ekSection = sections.find(s => s.key === 'ek');

    if (stkSection?.enabled && ekSection?.enabled && stkSection.data.validTo) {
      updateSectionData('ek', 'validTo', stkSection.data.validTo);
      setStkDateCopied(true);
      setTimeout(() => setStkDateCopied(false), 2000);
    }
  };

  // Handle file upload
  const handleFileUpload = (
    key: DocumentTypeKey,
    fileData:
      | { url: string; key: string; filename: string }
      | { url: string; key: string; filename: string }[]
  ) => {
    const newUrls = Array.isArray(fileData)
      ? fileData.map(f => f.url)
      : [fileData.url];

    setSections(prev =>
      prev.map(section => {
        if (section.key === key) {
          const existingPaths = section.data.filePaths || [];
          return {
            ...section,
            data: {
              ...section.data,
              filePaths: [...existingPaths, ...newUrls],
            },
          };
        }
        return section;
      })
    );
  };

  // Remove file
  const removeFile = (key: DocumentTypeKey, index: number) => {
    setSections(prev =>
      prev.map(section => {
        if (section.key === key) {
          const updatedPaths =
            section.data.filePaths?.filter((_, i) => i !== index) || [];
          return {
            ...section,
            data: {
              ...section.data,
              filePaths: updatedPaths,
            },
          };
        }
        return section;
      })
    );
  };

  // Handle submit
  const handleSubmit = () => {
    const enabledSections = sections.filter(s => s.enabled);

    if (enabledSections.length === 0) {
      alert('Prosím vyber aspoň jeden typ dokumentu.');
      return;
    }

    if (!vehicleId) {
      alert('Prosím vyber vozidlo.');
      return;
    }

    const documents = enabledSections.map(section => ({
      type: section.key,
      data: {
        ...section.data,
        vehicleId,
      },
    }));

    onSave(documents);
  };

  const enabledCount = sections.filter(s => s.enabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pridať dokumenty pre vozidlo
            </h1>
            <Badge
              variant="outline"
              className="text-lg px-4 py-1 border-2 border-blue-500 text-blue-600"
            >
              {enabledCount}{' '}
              {enabledCount === 1
                ? 'dokument'
                : enabledCount < 5
                  ? 'dokumenty'
                  : 'dokumentov'}
            </Badge>
          </div>
          <p className="text-slate-600">
            Vyber typy dokumentov a vyplň ich údaje v jednom formulári
          </p>
        </div>

        {/* Vehicle Selection */}
        <div className="mb-6">
          <VehicleCombobox
            vehicles={vehicles}
            value={vehicleId}
            onChange={setVehicleId}
          />
        </div>

        {/* Document Type Selection */}
        <div className="mb-6">
          <DocumentTypeSelector
            selectedTypes={
              new Set(sections.filter(s => s.enabled).map(s => s.key))
            }
            onToggle={toggleSection}
          />
        </div>

        {/* Enabled Sections Forms */}
        {enabledCount > 0 && (
          <div className="space-y-4 mb-6">
            {sections
              .filter(section => section.enabled)
              .map(section => (
                <DocumentSectionForm
                  key={section.key}
                  section={section}
                  expanded={expandedSections.has(section.key)}
                  onToggleExpand={() => toggleExpansion(section.key)}
                  onUpdateData={(field, value) =>
                    updateSectionData(section.key, field, value)
                  }
                  onFileUpload={fileData =>
                    handleFileUpload(section.key, fileData)
                  }
                  onRemoveFile={index => removeFile(section.key, index)}
                  isInsurance={isInsurance(section.key)}
                  isPZP={isPZP(section.key)}
                  isKasko={isKasko(section.key)}
                  isLeasing={isLeasing(section.key)}
                  hasKmField={hasKmField(section.key)}
                  insurers={insurers}
                  vehicleId={vehicleId}
                />
              ))}
          </div>
        )}

        {/* STK to EK Copy Button */}
        {sections.find(s => s.key === 'stk')?.enabled &&
          sections.find(s => s.key === 'ek')?.enabled && (
            <Card className="mb-6 border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Copy className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        Skopírovať platnosť STK do EK
                      </p>
                      <p className="text-sm text-green-700">
                        Obvykle majú STK a EK rovnakú platnosť
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={copyStkDateToEk}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                  >
                    {stkDateCopied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Skopírované
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopírovať
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        {/* No sections selected warning */}
        {enabledCount === 0 && (
          <Alert className="mb-6 border-2 border-amber-200 bg-amber-50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-900">
              Prosím vyber aspoň jeden typ dokumentu ktorý chceš pridať.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-12 px-8 text-base border-2"
          >
            Zrušiť
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={enabledCount === 0 || !vehicleId}
            className="h-12 px-8 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            Uložiť všetky dokumenty ({enabledCount})
          </Button>
        </div>
      </div>
    </div>
  );
}

// Individual Document Section Form Component
interface DocumentSectionFormProps {
  section: DocumentSection;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdateData: (
    field: keyof DocumentFormData,
    value: string | number | Date | PaymentFrequency | boolean | undefined
  ) => void;
  onFileUpload: (
    fileData:
      | { url: string; key: string; filename: string }
      | { url: string; key: string; filename: string }[]
  ) => void;
  onRemoveFile: (index: number) => void;
  isInsurance: boolean;
  isPZP: boolean;
  isKasko: boolean;
  isLeasing: boolean;
  hasKmField: boolean;
  insurers: Array<{ id: string; name: string }>;
  vehicleId: string;
}

function DocumentSectionForm({
  section,
  expanded,
  onToggleExpand,
  onUpdateData,
  onFileUpload,
  onRemoveFile,
  isInsurance,
  isPZP,
  isLeasing,
  hasKmField,
  insurers,
  vehicleId,
}: DocumentSectionFormProps) {
  // Special cases: service_book and fines_record have different UI
  const isServiceBook = section.key === 'service_book';
  const isFines = section.key === 'fines_record';

  return (
    <Card
      className="border-2 shadow-lg overflow-hidden"
      style={{ borderColor: section.color }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center justify-between transition-colors hover:bg-slate-50"
        style={{
          background: expanded
            ? `linear-gradient(90deg, ${section.gradientFrom} 0%, ${section.gradientTo} 100%)`
            : 'white',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              expanded ? 'bg-white/20' : 'bg-slate-100'
            )}
            style={!expanded ? { color: section.color } : { color: 'white' }}
          >
            {section.icon}
          </div>
          <span
            className={cn(
              'font-semibold text-lg',
              expanded ? 'text-white' : 'text-slate-900'
            )}
          >
            {section.label}
          </span>
        </div>
        <div className={expanded ? 'text-white' : 'text-slate-400'}>
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* Form Content */}
      {expanded && (
        <CardContent className="p-6 space-y-6">
          {/* Service Book - Special UI */}
          {isServiceBook && (
            <ServiceBookFields
              data={section.data}
              onChange={(field, value) => onUpdateData(field, value)}
            />
          )}

          {/* Fines - Special UI */}
          {isFines && (
            <FinesFields
              data={section.data}
              onChange={(field, value) => onUpdateData(field, value)}
            />
          )}

          {/* Regular documents (Insurance, STK, EK, Vignette) */}
          {!isServiceBook && !isFines && (
            <>
              {/* Insurance specific fields */}
              {isInsurance && (
                <>
                  {/* Leasing Warning */}
                  {isLeasing && (
                    <Alert className="border-purple-200 bg-purple-50">
                      <AlertDescription className="text-purple-900">
                        💡 <strong>Leasingová poistka:</strong> Štandardne má
                        mesačnú frekvenciu platenia. Platnosť poistky je do
                        ukončenia leasingu - zadaj dátum manuálne.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Číslo poistky *</Label>
                      <Input
                        value={section.data.policyNumber || ''}
                        onChange={e =>
                          onUpdateData('policyNumber', e.target.value)
                        }
                        placeholder="Zadajte číslo poistky..."
                        className="border-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <InsurerManagement
                        insurers={insurers}
                        value={section.data.company || ''}
                        onChange={value => onUpdateData('company', value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Maklerská spoločnosť</Label>
                      <Input
                        value={section.data.brokerCompany || ''}
                        onChange={e =>
                          onUpdateData('brokerCompany', e.target.value)
                        }
                        placeholder="Napr. XY Broker s.r.o."
                        className="border-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Frekvencia platenia *</Label>
                      <Select
                        value={section.data.paymentFrequency || 'yearly'}
                        onValueChange={value =>
                          onUpdateData(
                            'paymentFrequency',
                            value as PaymentFrequency
                          )
                        }
                        disabled={isLeasing}
                      >
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mesačne</SelectItem>
                          <SelectItem value="quarterly">Štvrťročne</SelectItem>
                          <SelectItem value="biannual">Polročne</SelectItem>
                          <SelectItem value="yearly">Ročne</SelectItem>
                        </SelectContent>
                      </Select>
                      {isLeasing && (
                        <p className="text-sm text-purple-600">
                          Pre leasing je frekvencia vždy mesačná
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />
                </>
              )}

              {/* 🌍 VIGNETTE: Country selection */}
              {section.key === 'vignette' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Krajina dialničnej známky *</Label>
                      <Select
                        value={section.data.vignetteCountry || ''}
                        onValueChange={value =>
                          onUpdateData(
                            'vignetteCountry',
                            value as VignetteCountry
                          )
                        }
                      >
                        <SelectTrigger className="border-2">
                          <SelectValue placeholder="Vyberte krajinu..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SK">🇸🇰 Slovensko</SelectItem>
                          <SelectItem value="CZ">🇨🇿 Česko</SelectItem>
                          <SelectItem value="AT">🇦🇹 Rakúsko</SelectItem>
                          <SelectItem value="HU">🇭🇺 Maďarsko</SelectItem>
                          <SelectItem value="SI">🇸🇮 Slovinsko</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 flex items-end">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={section.data.isRequired || false}
                          onChange={e =>
                            onUpdateData('isRequired', e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span>Povinná dialničná známka</span>
                      </Label>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {section.data.isRequired
                      ? '⚠️ Táto dialničná známka je označená ako povinná'
                      : '✓ Táto dialničná známka je dobrovoľná'}
                  </p>
                  <Separator />
                </>
              )}

              {/* Common fields: validFrom, validTo, price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platné od *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={
                        section.data.validFrom
                          ? format(
                              new Date(section.data.validFrom),
                              'dd.MM.yyyy'
                            )
                          : ''
                      }
                      onChange={e => {
                        const value = e.target.value;
                        const formats = [
                          'dd.MM.yyyy',
                          'd.M.yyyy',
                          'dd/MM/yyyy',
                          'd/M/yyyy',
                          'yyyy-MM-dd',
                        ];

                        for (const formatStr of formats) {
                          try {
                            const parsedDate = parse(
                              value,
                              formatStr,
                              new Date()
                            );
                            if (isValid(parsedDate)) {
                              onUpdateData('validFrom', parsedDate);
                              return;
                            }
                          } catch {
                            // Continue to next format
                          }
                        }
                      }}
                      placeholder="dd.mm.rrrr"
                      className="flex-1 border-2"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0 border-2"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={section.data.validFrom}
                          onSelect={date => onUpdateData('validFrom', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Platné do * {isInsurance && !isLeasing && '(automaticky)'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={
                        section.data.validTo
                          ? format(new Date(section.data.validTo), 'dd.MM.yyyy')
                          : ''
                      }
                      onChange={e => {
                        const value = e.target.value;
                        const formats = [
                          'dd.MM.yyyy',
                          'd.M.yyyy',
                          'dd/MM/yyyy',
                          'd/M/yyyy',
                          'yyyy-MM-dd',
                        ];

                        for (const formatStr of formats) {
                          try {
                            const parsedDate = parse(
                              value,
                              formatStr,
                              new Date()
                            );
                            if (isValid(parsedDate)) {
                              onUpdateData('validTo', parsedDate || new Date());
                              return;
                            }
                          } catch {
                            // Continue to next format
                          }
                        }
                      }}
                      placeholder="dd.mm.rrrr"
                      disabled={isInsurance && !isLeasing}
                      className={cn(
                        'flex-1 border-2',
                        isInsurance && !isLeasing && 'bg-slate-100'
                      )}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={isInsurance && !isLeasing}
                          className="shrink-0 border-2"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      {(!isInsurance || isLeasing) && (
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={section.data.validTo}
                            onSelect={date =>
                              onUpdateData('validTo', date || new Date())
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      )}
                    </Popover>
                  </div>
                  {isInsurance && !isLeasing && (
                    <p className="text-sm text-slate-500">
                      Automaticky vypočítané podľa frekvencie platenia
                    </p>
                  )}
                  {isLeasing && (
                    <p className="text-sm text-purple-600">
                      Zadaj manuálne dátum ukončenia leasingu
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Cena (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={section.data.price || ''}
                    onChange={e =>
                      onUpdateData('price', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className="border-2"
                  />
                </div>
              </div>

              {/* Green card for PZP */}
              {isPZP && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <h4 className="font-semibold text-slate-900">
                        Platnosť bielej karty
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        Automatické
                      </Badge>
                    </div>
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-900">
                        💡 Platnosť zelenej karty sa automaticky nastaví podľa
                        platnosti poistky.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Biela karta platná od</Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={
                              section.data.greenCardValidFrom
                                ? format(
                                    new Date(section.data.greenCardValidFrom),
                                    'dd.MM.yyyy'
                                  )
                                : ''
                            }
                            onChange={e => {
                              const value = e.target.value;
                              const formats = [
                                'dd.MM.yyyy',
                                'd.M.yyyy',
                                'dd/MM/yyyy',
                                'd/M/yyyy',
                                'yyyy-MM-dd',
                              ];

                              for (const formatStr of formats) {
                                try {
                                  const parsedDate = parse(
                                    value,
                                    formatStr,
                                    new Date()
                                  );
                                  if (isValid(parsedDate)) {
                                    onUpdateData(
                                      'greenCardValidFrom',
                                      parsedDate
                                    );
                                    return;
                                  }
                                } catch {
                                  // Continue to next format
                                }
                              }
                            }}
                            placeholder="dd.mm.rrrr"
                            className="flex-1 border-2"
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 border-2"
                              >
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={section.data.greenCardValidFrom}
                                onSelect={date =>
                                  onUpdateData('greenCardValidFrom', date)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Biela karta platná do</Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={
                              section.data.greenCardValidTo
                                ? format(
                                    new Date(section.data.greenCardValidTo),
                                    'dd.MM.yyyy'
                                  )
                                : ''
                            }
                            onChange={e => {
                              const value = e.target.value;
                              const formats = [
                                'dd.MM.yyyy',
                                'd.M.yyyy',
                                'dd/MM/yyyy',
                                'd/M/yyyy',
                                'yyyy-MM-dd',
                              ];

                              for (const formatStr of formats) {
                                try {
                                  const parsedDate = parse(
                                    value,
                                    formatStr,
                                    new Date()
                                  );
                                  if (isValid(parsedDate)) {
                                    onUpdateData(
                                      'greenCardValidTo',
                                      parsedDate
                                    );
                                    return;
                                  }
                                } catch {
                                  // Continue to next format
                                }
                              }
                            }}
                            placeholder="dd.mm.rrrr"
                            className="flex-1 border-2"
                          />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 border-2"
                              >
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={section.data.greenCardValidTo}
                                onSelect={date =>
                                  onUpdateData('greenCardValidTo', date)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* KM State */}
              {hasKmField && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">🚗</div>
                      <h4 className="font-semibold text-slate-900">
                        Stav kilometrov
                      </h4>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={section.data.kmState || ''}
                      onChange={e =>
                        onUpdateData(
                          'kmState',
                          parseInt(e.target.value) || undefined
                        )
                      }
                      placeholder="Napríklad: 125000"
                      className="border-2"
                    />
                  </div>
                </>
              )}

              {/* 💰 SPOLUÚČASŤ - Pre Kasko a PZP+Kasko */}
              {isInsurance && !isPZP && !isLeasing && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">💰</div>
                      <h4 className="font-semibold text-slate-900">
                        Spoluúčasť
                        <span className="text-sm text-slate-500 font-normal ml-2">
                          (voliteľné)
                        </span>
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Spoluúčasť (€)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={section.data.deductibleAmount ?? ''}
                          onChange={e =>
                            onUpdateData(
                              'deductibleAmount',
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                          placeholder="0.00"
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Spoluúčasť (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={section.data.deductiblePercentage ?? ''}
                          onChange={e =>
                            onUpdateData(
                              'deductiblePercentage',
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                          placeholder="0.00"
                          className="border-2"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Notes for regular documents (not service_book, not fines - they have their own) */}
              {!isServiceBook && !isFines && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Poznámka</Label>
                    <Textarea
                      rows={3}
                      value={section.data.notes || ''}
                      onChange={e => onUpdateData('notes', e.target.value)}
                      placeholder="Zadajte poznámku alebo doplňujúce informácie..."
                      className="border-2"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* File Upload - for all document types */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-slate-600" />
              <h4 className="font-semibold text-slate-900">
                Priložiť dokumenty
              </h4>
            </div>

            <R2FileUpload
              type="document"
              entityId={vehicleId || 'temp'}
              onUploadSuccess={onFileUpload}
              onUploadError={error => console.error('Upload error:', error)}
              acceptedTypes={[
                'image/jpeg',
                'image/png',
                'image/webp',
                'application/pdf',
              ]}
              maxSize={10}
              multiple={true}
              label="Klikni alebo pretiahni súbory sem (PDF, JPG, PNG)"
            />

            {section.data.filePaths && section.data.filePaths.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Priložené súbory ({section.data.filePaths.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {section.data.filePaths.map((filePath, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-slate-100 px-3 py-2 text-sm"
                    >
                      <span onClick={() => window.open(filePath, '_blank')}>
                        📎 {filePath.split('/').pop()}
                      </span>
                      <button
                        className="ml-2 hover:text-red-500"
                        onClick={e => {
                          e.stopPropagation();
                          onRemoveFile(index);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
