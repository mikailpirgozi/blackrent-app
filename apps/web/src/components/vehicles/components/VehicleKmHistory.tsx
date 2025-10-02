import {
  Car as CarIcon,
  TrendingDown as DecreaseIcon,
  FileText as EKIcon,
  TrendingUp as IncreaseIcon,
  Shield as InsuranceIcon,
  Wrench as STKIcon,
  Minus as SameIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { UnifiedTypography } from '@/components/ui/UnifiedTypography';
import { format, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useCallback, useEffect, useState } from 'react';

// import { useApp } from '../../../context/AppContext'; // Migrated to React Query
import { useInsurances } from '../../../lib/react-query/hooks/useInsurances';
import { useVehicleDocuments } from '../../../lib/react-query/hooks/useVehicleDocuments';
import type { Vehicle } from '../../../types';

interface KmHistoryEntry {
  id: string;
  date: Date | string;
  kmState: number;
  documentType: 'insurance_kasko' | 'stk' | 'ek';
  documentId: string;
  documentNumber?: string;
  policyNumber?: string;
  company?: string;
  notes?: string;
}

interface VehicleKmHistoryProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

const getDocumentTypeInfo = (type: string) => {
  switch (type) {
    case 'insurance_kasko':
      return {
        label: 'Kasko poistka',
        icon: <InsuranceIcon className="h-5 w-5" />,
        color: 'bg-blue-500',
      };
    case 'stk':
      return {
        label: 'STK',
        icon: <STKIcon className="h-5 w-5" />,
        color: 'bg-green-500',
      };
    case 'ek':
      return {
        label: 'EK',
        icon: <EKIcon className="h-5 w-5" />,
        color: 'bg-orange-500',
      };
    default:
      return {
        label: 'Dokument',
        icon: <CarIcon className="h-5 w-5" />,
        color: 'bg-gray-500',
      };
  }
};

const getKmTrend = (currentKm: number, previousKm?: number) => {
  if (!previousKm)
    return { icon: <SameIcon className="h-4 w-4" />, color: 'text-gray-500', text: 'Prvý záznam' };

  const diff = currentKm - previousKm;
  if (diff > 0) {
    return {
      icon: <IncreaseIcon className="h-4 w-4" />,
      color: 'text-green-500',
      text: `+${diff.toLocaleString()} km`,
    };
  } else if (diff < 0) {
    return {
      icon: <DecreaseIcon className="h-4 w-4" />,
      color: 'text-red-500',
      text: `${diff.toLocaleString()} km`,
    };
  } else {
    return {
      icon: <SameIcon className="h-4 w-4" />,
      color: 'text-gray-500',
      text: 'Bez zmeny',
    };
  }
};

export default function VehicleKmHistory({
  open,
  onClose,
  vehicle,
}: VehicleKmHistoryProps) {
  const [isMobile, setIsMobile] = useState(false);
  // const { state } = useApp(); // Migrated to React Query

  // React Query hooks for server state
  const { data: insurances = [] } = useInsurances();
  const { data: vehicleDocuments = [] } = useVehicleDocuments();

  const [kmHistory, setKmHistory] = useState<KmHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadKmHistory = useCallback(async () => {
    if (!vehicle) return;

    setLoading(true);
    try {
      // Načítaj Kasko poistky s kmState
      const kaskoInsurances = (insurances || [])
        .filter(
          insurance =>
            insurance.vehicleId === vehicle.id &&
            insurance.type?.toLowerCase().includes('kasko') &&
            (insurance as unknown as Record<string, unknown>).kmState
        )
        .map(insurance => ({
          id: insurance.id,
          date: insurance.validFrom || insurance.validTo,
          kmState: (insurance as unknown as Record<string, unknown>)
            .kmState as number,
          documentType: 'insurance_kasko' as const,
          documentId: insurance.id,
          policyNumber: insurance.policyNumber,
          company: insurance.company,
          notes: `Kasko poistka ${insurance.policyNumber}`,
        }));

      // Načítaj STK dokumenty s kmState
      const stkDocuments = (vehicleDocuments || [])
        .filter(
          doc =>
            doc.vehicleId === vehicle.id &&
            doc.documentType === 'stk' &&
            (doc as unknown as Record<string, unknown>).kmState
        )
        .map(doc => ({
          id: doc.id,
          date: doc.validTo,
          kmState: (doc as unknown as Record<string, unknown>)
            .kmState as number,
          documentType: 'stk' as const,
          documentId: doc.id,
          documentNumber: doc.documentNumber,
          notes: doc.notes || `STK kontrola`,
        }));

      // Načítaj EK dokumenty s kmState
      const ekDocuments = (vehicleDocuments || [])
        .filter(
          doc =>
            doc.vehicleId === vehicle.id &&
            doc.documentType === 'ek' &&
            (doc as unknown as Record<string, unknown>).kmState
        )
        .map(doc => ({
          id: doc.id,
          date: doc.validTo,
          kmState: (doc as unknown as Record<string, unknown>)
            .kmState as number,
          documentType: 'ek' as const,
          documentId: doc.id,
          documentNumber: doc.documentNumber,
          notes: doc.notes || `EK kontrola`,
        }));

      // Spoj všetky záznamy a zoraď podľa dátumu
      const allEntries = [...kaskoInsurances, ...stkDocuments, ...ekDocuments];
      const sortedHistory = allEntries.sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date;
        return dateB.getTime() - dateA.getTime(); // Najnovšie prvé
      });

      setKmHistory(sortedHistory as KmHistoryEntry[]);
    } catch (error) {
      console.error('Chyba pri načítavaní histórie km:', error);
    } finally {
      setLoading(false);
    }
  }, [vehicle, insurances, vehicleDocuments]);

  useEffect(() => {
    if (open && vehicle) {
      loadKmHistory();
    }
  }, [open, vehicle, loadKmHistory]);

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={isMobile ? "w-full h-full max-w-none rounded-none overflow-y-auto" : "max-w-4xl w-full"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CarIcon className="h-6 w-6" />
            História stavu kilometrov
          </DialogTitle>
          <DialogDescription>
            {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : kmHistory.length === 0 ? (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p>Žiadna história kilometrov nie je k dispozícii pre toto vozidlo.</p>
                  <p className="text-sm text-muted-foreground">
                    História sa vytvára automaticky pri pridávaní STK, EK alebo Kasko
                    poistky s uvedeným stavom kilometrov.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="mb-4">
                <AlertDescription>
                  📊 Nájdených {kmHistory.length} záznamov o stave kilometrov
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {kmHistory.map((entry, index) => {
                  const typeInfo = getDocumentTypeInfo(entry.documentType);
                  const previousEntry = kmHistory[index + 1];
                  const trend = getKmTrend(entry.kmState, previousEntry?.kmState);
                  const entryDate =
                    typeof entry.date === 'string'
                      ? parseISO(entry.date)
                      : entry.date;

                  return (
                    <div key={entry.id} className="flex gap-4">
                      {/* Date column for desktop */}
                      {!isMobile && (
                        <div className="w-32 text-right text-sm text-muted-foreground pt-3">
                          {format(entryDate, 'dd.MM.yyyy', { locale: sk })}
                        </div>
                      )}

                      {/* Timeline dot and connector */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full ${typeInfo.color} text-white flex items-center justify-center`}>
                          {typeInfo.icon}
                        </div>
                        {index < kmHistory.length - 1 && (
                          <div className="w-0.5 h-8 bg-border mt-2"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <UnifiedTypography variant="h6">
                                    {typeInfo.label}
                                  </UnifiedTypography>
                                  <Badge variant="default">
                                    {entry.kmState.toLocaleString()} km
                                  </Badge>
                                </div>
                                {isMobile && (
                                  <UnifiedTypography variant="caption" className="text-muted-foreground">
                                    {format(entryDate, 'dd.MM.yyyy', {
                                      locale: sk,
                                    })}
                                  </UnifiedTypography>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <div className={trend.color}>
                                  {trend.icon}
                                </div>
                                <UnifiedTypography variant="caption" className={trend.color}>
                                  {trend.text}
                                </UnifiedTypography>
                              </div>
                            </div>

                            <Separator className="my-2" />

                            <div className="space-y-1">
                              {entry.policyNumber && (
                                <UnifiedTypography variant="body2" className="text-muted-foreground">
                                  <strong>Číslo poistky:</strong> {entry.policyNumber}
                                </UnifiedTypography>
                              )}
                              {entry.documentNumber && (
                                <UnifiedTypography variant="body2" className="text-muted-foreground">
                                  <strong>Číslo dokumentu:</strong> {entry.documentNumber}
                                </UnifiedTypography>
                              )}
                              {entry.company && (
                                <UnifiedTypography variant="body2" className="text-muted-foreground">
                                  <strong>Spoločnosť:</strong> {entry.company}
                                </UnifiedTypography>
                              )}
                              {entry.notes && (
                                <UnifiedTypography variant="body2" className="text-muted-foreground">
                                  <strong>Poznámka:</strong> {entry.notes}
                                </UnifiedTypography>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Štatistiky */}
              {kmHistory.length > 1 && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <UnifiedTypography variant="h6" className="mb-4">
                      📈 Štatistiky
                    </UnifiedTypography>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center">
                        <UnifiedTypography variant="h4" className="text-primary">
                          {kmHistory[0]?.kmState.toLocaleString() ?? '0'}
                        </UnifiedTypography>
                        <UnifiedTypography variant="caption" className="text-muted-foreground">
                          Aktuálny stav km
                        </UnifiedTypography>
                      </div>
                      <div className="text-center">
                        <UnifiedTypography variant="h4" className="text-green-600">
                          +
                          {(
                            (kmHistory[0]?.kmState ?? 0) -
                            (kmHistory[kmHistory.length - 1]?.kmState ?? 0)
                          ).toLocaleString()}
                        </UnifiedTypography>
                        <UnifiedTypography variant="caption" className="text-muted-foreground">
                          Celkový nárast km
                        </UnifiedTypography>
                      </div>
                      <div className="text-center">
                        <UnifiedTypography variant="h4" className="text-blue-600">
                          {kmHistory.length}
                        </UnifiedTypography>
                        <UnifiedTypography variant="caption" className="text-muted-foreground">
                          Počet záznamov
                        </UnifiedTypography>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Zavrieť</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
