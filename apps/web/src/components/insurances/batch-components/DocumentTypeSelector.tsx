import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Shield,
  Wrench,
  FileText,
  Truck,
  DollarSign,
  Clipboard,
  AlertCircle,
} from 'lucide-react';

export type DocumentTypeKey =
  | 'insurance_pzp'
  | 'insurance_kasko'
  | 'insurance_pzp_kasko'
  | 'insurance_leasing'
  | 'stk'
  | 'ek'
  | 'vignette'
  | 'service_book'
  | 'fines_record';

export interface DocumentType {
  key: DocumentTypeKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    key: 'insurance_pzp',
    label: 'Poistenie PZP',
    icon: <Shield className="h-5 w-5" />,
    color: '#667eea',
    gradientFrom: '#667eea',
    gradientTo: '#764ba2',
  },
  {
    key: 'insurance_kasko',
    label: 'Poistenie Kasko',
    icon: <Shield className="h-5 w-5" />,
    color: '#667eea',
    gradientFrom: '#667eea',
    gradientTo: '#a78bfa',
  },
  {
    key: 'insurance_pzp_kasko',
    label: 'Poistenie PZP + Kasko',
    icon: <Shield className="h-5 w-5" />,
    color: '#764ba2',
    gradientFrom: '#764ba2',
    gradientTo: '#f093fb',
  },
  {
    key: 'insurance_leasing',
    label: 'Leasingová Poistka',
    icon: <DollarSign className="h-5 w-5" />,
    color: '#8b5cf6',
    gradientFrom: '#8b5cf6',
    gradientTo: '#ec4899',
  },
  {
    key: 'stk',
    label: 'STK',
    icon: <Wrench className="h-5 w-5" />,
    color: '#10b981',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
  },
  {
    key: 'ek',
    label: 'Emisná kontrola (EK)',
    icon: <FileText className="h-5 w-5" />,
    color: '#f59e0b',
    gradientFrom: '#f59e0b',
    gradientTo: '#d97706',
  },
  {
    key: 'vignette',
    label: 'Dialničná známka',
    icon: <Truck className="h-5 w-5" />,
    color: '#06b6d4',
    gradientFrom: '#06b6d4',
    gradientTo: '#0891b2',
  },
  {
    key: 'service_book',
    label: 'Servisná knižka',
    icon: <Clipboard className="h-5 w-5" />,
    color: '#6366f1',
    gradientFrom: '#6366f1',
    gradientTo: '#4f46e5',
  },
  {
    key: 'fines_record',
    label: 'Evidencia pokút',
    icon: <AlertCircle className="h-5 w-5" />,
    color: '#ef4444',
    gradientFrom: '#ef4444',
    gradientTo: '#dc2626',
  },
];

interface DocumentTypeSelectorProps {
  selectedTypes: Set<DocumentTypeKey>;
  onToggle: (type: DocumentTypeKey) => void;
}

export function DocumentTypeSelector({
  selectedTypes,
  onToggle,
}: DocumentTypeSelectorProps) {
  return (
    <Card className="border-2 border-purple-200 shadow-lg">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-900">
          Vyber typy dokumentov
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DOCUMENT_TYPES.map(type => {
            const isSelected = selectedTypes.has(type.key);
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => onToggle(type.key)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200',
                  isSelected
                    ? 'border-transparent shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
                style={
                  isSelected
                    ? {
                        background: `linear-gradient(135deg, ${type.gradientFrom} 0%, ${type.gradientTo} 100%)`,
                      }
                    : undefined
                }
              >
                <Checkbox
                  checked={isSelected}
                  className={cn(
                    'h-5 w-5',
                    isSelected &&
                      'border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-600'
                  )}
                />
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    isSelected ? 'bg-white/20' : 'bg-slate-100'
                  )}
                  style={!isSelected ? { color: type.color } : undefined}
                >
                  {type.icon}
                </div>
                <span
                  className={cn(
                    'font-medium text-sm',
                    isSelected ? 'text-white' : 'text-slate-700'
                  )}
                >
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
