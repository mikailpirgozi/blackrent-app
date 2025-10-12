import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { MaskedDateInput } from '@/components/ui/MaskedDateInput';

interface ServiceBookData {
  serviceDate?: Date;
  serviceDescription?: string;
  serviceKm?: number;
  serviceProvider?: string;
  notes?: string;
}

interface ServiceBookFieldsProps {
  data: ServiceBookData;
  onChange: (
    field: keyof ServiceBookData,
    value: Date | string | number | undefined
  ) => void;
}

export function ServiceBookFields({ data, onChange }: ServiceBookFieldsProps) {
  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-blue-900">
          💡 Servisná knižka zaznamenáva informácie o vykonaných servisoch a
          opravách vozidla.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Service Date */}
        <div className="space-y-2">
          <Label>Dátum servisu *</Label>
          <MaskedDateInput
            value={data.serviceDate}
            onChange={date => onChange('serviceDate', date)}
          />
        </div>

        {/* Service KM */}
        <div className="space-y-2">
          <Label>Stav kilometrov *</Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={data.serviceKm || ''}
            onChange={e =>
              onChange('serviceKm', parseInt(e.target.value) || undefined)
            }
            placeholder="Napríklad: 125000"
            className="border-2"
          />
          <p className="text-sm text-slate-500">Stav km pri vykonaní servisu</p>
        </div>

        {/* Service Provider */}
        <div className="space-y-2 md:col-span-2">
          <Label>Servis / Autoservis *</Label>
          <Input
            value={data.serviceProvider || ''}
            onChange={e => onChange('serviceProvider', e.target.value)}
            placeholder="Napríklad: AutoServis Bratislava s.r.o."
            className="border-2"
          />
        </div>

        {/* Service Description */}
        <div className="space-y-2 md:col-span-2">
          <Label>Popis vykonaných prác *</Label>
          <Textarea
            rows={4}
            value={data.serviceDescription || ''}
            onChange={e => onChange('serviceDescription', e.target.value)}
            placeholder="Napríklad: Výmena oleja a olejového filtra, kontrola brzd, výmena brzdových kotúčov..."
            className="border-2"
          />
          <p className="text-sm text-slate-500">
            Podrobný popis čo sa na aute opravovalo alebo servisovalo
          </p>
        </div>
      </div>

      <Separator />

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label>Doplňujúca poznámka</Label>
        <Textarea
          rows={2}
          value={data.notes || ''}
          onChange={e => onChange('notes', e.target.value)}
          placeholder="Voliteľná poznámka alebo dodatočné informácie..."
          className="border-2"
        />
      </div>
    </div>
  );
}
