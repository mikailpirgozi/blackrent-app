import {
  Car,
  AlertTriangle,
  X,
  FileText,
  Euro,
  Calendar,
  Shield,
  MapPin,
  CalendarIcon,
} from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import { useInsurances } from '@/lib/react-query/hooks/useInsurances';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import type { InsuranceClaim } from '../../types';
import R2FileUpload from '../common/R2FileUpload';

// TODO: Implement incident type info
// const getIncidentTypeInfo = (type: string) => {
//   switch (type) {
//     case 'accident':
//       return { label: 'Nehoda', color: '#d32f2f', icon: '🚗' };
//     case 'theft':
//       return { label: 'Krádež', color: '#7b1fa2', icon: '🔒' };
//     case 'vandalism':
//       return { label: 'Vandalizmus', color: '#f57c00', icon: '🔨' };
//     case 'weather':
//       return { label: 'Počasie', color: '#1976d2', icon: '⛈️' };
//     default:
//       return { label: 'Iné', color: '#616161', icon: '❓' };
//   }
// };

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

export default function InsuranceClaimForm({
  claim,
  onSave,
  onCancel,
}: {
  claim?: InsuranceClaim | null;
  onSave: (_claimData: InsuranceClaim) => void;
  onCancel: () => void;
}) {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: insurances = [] } = useInsurances();
  const { data: vehicles = [] } = useVehicles();

  // Helper functions for compatibility
  const getEnhancedFilteredVehicles = () => vehicles;

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
    notes: claim?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (claim) {
      setFormData({
        ...claim,
        incidentDate: claim.incidentDate
          ? new Date(claim.incidentDate)
          : new Date(),
      });
      setUploadedFiles(claim.filePaths || []);
    }
  }, [claim]);

  // Get available vehicles and their insurances (including private)
  const availableVehicles = getEnhancedFilteredVehicles() || [];
  const vehicleInsurances = (insurances || []).filter(
    ins => ins.vehicleId === formData.vehicleId
  );

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

    const claimData = {
      id: claim?.id || uuidv4(),
      vehicleId: formData.vehicleId!,
      insuranceId: formData.insuranceId || undefined,
      incidentDate: formData.incidentDate!,
      reportedDate: claim?.reportedDate || new Date(),
      description: formData.description!,
      location: formData.location || undefined,
      incidentType: formData.incidentType! as
        | 'accident'
        | 'theft'
        | 'vandalism'
        | 'weather'
        | 'other',
      estimatedDamage: formData.estimatedDamage || undefined,
      deductible: formData.deductible || undefined,
      payoutAmount: formData.payoutAmount || undefined,
      status: formData.status! as
        | 'reported'
        | 'investigating'
        | 'approved'
        | 'rejected'
        | 'closed',
      claimNumber: formData.claimNumber || undefined,
      filePaths: uploadedFiles || undefined,
      policeReportNumber: formData.policeReportNumber || undefined,
      otherPartyInfo: formData.otherPartyInfo || undefined,
      notes: formData.notes || undefined,
      createdAt: claim?.createdAt || new Date(),
    };

    onSave(claimData as InsuranceClaim);
  };

  const handleFileUploadSuccess = (
    fileData:
      | { url: string; key: string; filename: string }
      | { url: string; key: string; filename: string }[]
  ) => {
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold">
              {claim ? 'Upraviť poistnú udalosť' : 'Pridať poistnú udalosť'}
            </h2>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Základné informácie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vozidlo *</Label>
                <Select
                  value={formData.vehicleId || ''}
                  onValueChange={value => {
                    setFormData(prev => ({
                      ...prev,
                      vehicleId: value,
                      insuranceId: '',
                    }));
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte vozidlo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles
                      .slice()
                      .sort((a, b) => {
                        const aText = `${a.brand} ${a.model} (${a.licensePlate})`;
                        const bText = `${b.brand} ${b.model} (${b.licensePlate})`;
                        return aText.localeCompare(bText, 'sk', {
                          sensitivity: 'base',
                        });
                      })
                      .map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-blue-600" />
                            {vehicle.brand} {vehicle.model} (
                            {vehicle.licensePlate})
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.vehicleId && (
                  <p className="text-sm text-red-600">{errors.vehicleId}</p>
                )}
              </div>

              {/* Related Insurance */}
              <div className="space-y-2">
                <Label htmlFor="insurance">Súvisiaca poistka</Label>
                <Select
                  value={formData.insuranceId || ''}
                  onValueChange={value => {
                    setFormData(prev => ({
                      ...prev,
                      insuranceId: value,
                    }));
                  }}
                  disabled={!formData.vehicleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte poistku..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-insurance">Žiadna</SelectItem>
                    {vehicleInsurances.map(insurance => (
                      <SelectItem key={insurance.id} value={insurance.id}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          {insurance.company} - {insurance.policyNumber}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Incident Date */}
              <div className="space-y-2">
                <Label>Dátum a čas udalosti *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.incidentDate ? (
                        format(
                          new Date(formData.incidentDate),
                          'dd.MM.yyyy HH:mm',
                          { locale: sk }
                        )
                      ) : (
                        <span>Vyberte dátum a čas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        formData.incidentDate
                          ? new Date(formData.incidentDate)
                          : undefined
                      }
                      onSelect={date => {
                        if (date) {
                          const time = formData.incidentDate
                            ? new Date(formData.incidentDate)
                                .toTimeString()
                                .slice(0, 5)
                            : '00:00';
                          const [hours, minutes] = time.split(':');
                          const newDate = new Date(date);
                          newDate.setHours(
                            parseInt(hours || '0'),
                            parseInt(minutes || '0')
                          );
                          setFormData(prev => ({
                            ...prev,
                            incidentDate: newDate,
                          }));
                        }
                      }}
                      initialFocus
                      locale={sk}
                    />
                    <div className="p-3 border-t">
                      <Input
                        type="time"
                        value={
                          formData.incidentDate
                            ? new Date(formData.incidentDate)
                                .toTimeString()
                                .slice(0, 5)
                            : '00:00'
                        }
                        onChange={e => {
                          if (formData.incidentDate) {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = new Date(formData.incidentDate);
                            newDate.setHours(
                              parseInt(hours || '0'),
                              parseInt(minutes || '0')
                            );
                            setFormData(prev => ({
                              ...prev,
                              incidentDate: newDate,
                            }));
                          }
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                {errors.incidentDate && (
                  <p className="text-sm text-red-600">{errors.incidentDate}</p>
                )}
              </div>

              {/* Incident Type */}
              <div className="space-y-2">
                <Label htmlFor="incidentType">Typ udalosti *</Label>
                <Select
                  value={formData.incidentType || 'accident'}
                  onValueChange={value => {
                    setFormData(prev => ({
                      ...prev,
                      incidentType: value as
                        | 'accident'
                        | 'theft'
                        | 'vandalism'
                        | 'weather'
                        | 'other',
                    }));
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte typ udalosti..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accident">
                      <div className="flex items-center gap-2">
                        <span>🚗</span>
                        Nehoda
                      </div>
                    </SelectItem>
                    <SelectItem value="theft">
                      <div className="flex items-center gap-2">
                        <span>🔒</span>
                        Krádež
                      </div>
                    </SelectItem>
                    <SelectItem value="vandalism">
                      <div className="flex items-center gap-2">
                        <span>🔨</span>
                        Vandalizmus
                      </div>
                    </SelectItem>
                    <SelectItem value="weather">
                      <div className="flex items-center gap-2">
                        <span>⛈️</span>
                        Poveternostná udalosť
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <span>❓</span>
                        Iné
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.incidentType && (
                  <p className="text-sm text-red-600">{errors.incidentType}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Popis udalosti *</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Opíšte detailne čo sa stalo..."
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Miesto udalosti</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Ulica, mesto, GPS súradnice..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-green-600" />
              Finančné údaje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedDamage">Odhad škody (€)</Label>
                <Input
                  id="estimatedDamage"
                  type="number"
                  value={formData.estimatedDamage || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      estimatedDamage: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  step={0.01}
                  className={errors.estimatedDamage ? 'border-red-500' : ''}
                />
                {errors.estimatedDamage && (
                  <p className="text-sm text-red-600">
                    {errors.estimatedDamage}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deductible">Spoluúčasť (€)</Label>
                <Input
                  id="deductible"
                  type="number"
                  value={formData.deductible || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      deductible: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  step={0.01}
                  className={errors.deductible ? 'border-red-500' : ''}
                />
                {errors.deductible && (
                  <p className="text-sm text-red-600">{errors.deductible}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payoutAmount">Výplata poisťovne (€)</Label>
                <Input
                  id="payoutAmount"
                  type="number"
                  value={formData.payoutAmount || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      payoutAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  step={0.01}
                  className={errors.payoutAmount ? 'border-red-500' : ''}
                />
                {errors.payoutAmount && (
                  <p className="text-sm text-red-600">{errors.payoutAmount}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status and Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Stav a dodatočné informácie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Stav</Label>
                <Select
                  value={formData.status || 'reported'}
                  onValueChange={value => {
                    setFormData(prev => ({
                      ...prev,
                      status: value as
                        | 'reported'
                        | 'investigating'
                        | 'approved'
                        | 'rejected'
                        | 'closed',
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte stav..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reported">Nahlásené</SelectItem>
                    <SelectItem value="investigating">Vyšetruje sa</SelectItem>
                    <SelectItem value="approved">Schválené</SelectItem>
                    <SelectItem value="rejected">Zamietnuté</SelectItem>
                    <SelectItem value="closed">Uzavreté</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimNumber">Číslo škodovej udalosti</Label>
                <Input
                  id="claimNumber"
                  value={formData.claimNumber || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      claimNumber: e.target.value,
                    }))
                  }
                  placeholder="Číslo z poisťovne..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policeReportNumber">
                  Číslo policajného protokolu
                </Label>
                <Input
                  id="policeReportNumber"
                  value={formData.policeReportNumber || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      policeReportNumber: e.target.value,
                    }))
                  }
                  placeholder="Ak bol privolaný..."
                />
              </div>

              <div className="space-y-2">
                <Label>Aktuálny stav</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Aktuálny stav:</span>
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold"
                    style={{
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color,
                      borderColor: statusInfo.color,
                    }}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherPartyInfo">Informácie o druhej strane</Label>
              <Textarea
                id="otherPartyInfo"
                value={formData.otherPartyInfo || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    otherPartyInfo: e.target.value,
                  }))
                }
                placeholder="Údaje o druhom účastníkovi nehody (meno, telefón, poistka...)..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ďalšie poznámky..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Súbory a dokumenty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <R2FileUpload
              type="document"
              entityId={formData.vehicleId || 'temp'}
              onUploadSuccess={handleFileUploadSuccess}
              onUploadError={error => console.error('Upload error:', error)}
              acceptedTypes={[
                'image/jpeg',
                'image/png',
                'image/webp',
                'application/pdf',
              ]}
              maxSize={10}
              multiple={true}
              label="Nahrať súbory (fotky, dokumenty)"
            />

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Nahrané súbory ({uploadedFiles.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((fileUrl, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => window.open(fileUrl, '_blank')}
                    >
                      <span className="mr-2">Súbor {index + 1}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveFile(fileUrl);
                        }}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušiť
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {claim ? 'Uložiť zmeny' : 'Vytvoriť udalosť'}
          </Button>
        </div>
      </form>
    </div>
  );
}
