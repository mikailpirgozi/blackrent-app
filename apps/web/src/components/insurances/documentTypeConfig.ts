import {
  Shield,
  Wrench,
  FileText,
  Truck,
  DollarSign,
  AlertCircle,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';

export interface DocumentTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

export const DOCUMENT_TYPE_CONFIG: Record<string, DocumentTypeConfig> = {
  insurance_pzp: {
    label: 'Poistenie PZP',
    icon: Shield,
    color: '#667eea',
    gradientFrom: '#667eea',
    gradientTo: '#764ba2',
  },
  insurance_kasko: {
    label: 'Poistenie Kasko',
    icon: Shield,
    color: '#667eea',
    gradientFrom: '#667eea',
    gradientTo: '#a78bfa',
  },
  insurance_pzp_kasko: {
    label: 'Poistenie PZP + Kasko',
    icon: Shield,
    color: '#764ba2',
    gradientFrom: '#764ba2',
    gradientTo: '#f093fb',
  },
  insurance_leasing: {
    label: 'Leasingová Poistka',
    icon: DollarSign,
    color: '#8b5cf6',
    gradientFrom: '#8b5cf6',
    gradientTo: '#ec4899',
  },
  stk: {
    label: 'STK',
    icon: Wrench,
    color: '#10b981',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
  },
  ek: {
    label: 'Emisná kontrola (EK)',
    icon: FileText,
    color: '#f59e0b',
    gradientFrom: '#f59e0b',
    gradientTo: '#d97706',
  },
  vignette: {
    label: 'Dialničná známka',
    icon: Truck,
    color: '#06b6d4',
    gradientFrom: '#06b6d4',
    gradientTo: '#0891b2',
  },
  technical_certificate: {
    label: 'Technický preukaz',
    icon: FileText,
    color: '#6366f1',
    gradientFrom: '#6366f1',
    gradientTo: '#4f46e5',
  },
  service_book: {
    label: 'Servisná knižka',
    icon: BookOpen,
    color: '#8b5cf6',
    gradientFrom: '#8b5cf6',
    gradientTo: '#7c3aed',
  },
  fines_record: {
    label: 'Evidencia pokút',
    icon: AlertCircle,
    color: '#ef4444',
    gradientFrom: '#ef4444',
    gradientTo: '#dc2626',
  },
};

export function getDocumentTypeConfig(type: string): DocumentTypeConfig {
  return (
    DOCUMENT_TYPE_CONFIG[type] || {
      label: type,
      icon: FileText,
      color: '#64748b',
      gradientFrom: '#64748b',
      gradientTo: '#475569',
    }
  );
}
