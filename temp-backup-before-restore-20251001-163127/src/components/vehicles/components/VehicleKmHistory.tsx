import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  DirectionsCar as CarIcon,
  TrendingDown as DecreaseIcon,
  Assignment as EKIcon,
  TrendingUp as IncreaseIcon,
  Security as InsuranceIcon,
  Build as STKIcon,
  Remove as SameIcon,
} from '@mui/icons-material';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
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
        icon: <UnifiedIcon name="insurance" sx={{ fontSize: 20 }} />,
        color: '#2196f3',
      };
    case 'stk':
      return {
        label: 'STK',
        icon: <UnifiedIcon name="stk" sx={{ fontSize: 20 }} />,
        color: '#388e3c',
      };
    case 'ek':
      return {
        label: 'EK',
        icon: <UnifiedIcon name="ek" sx={{ fontSize: 20 }} />,
        color: '#f57c00',
      };
    default:
      return {
        label: 'Dokument',
        icon: <CarIcon sx={{ fontSize: 20 }} />,
        color: '#666',
      };
  }
};

const getKmTrend = (currentKm: number, previousKm?: number) => {
  if (!previousKm)
    return { icon: <SameIcon />, color: '#666', text: 'Prvý záznam' };

  const diff = currentKm - previousKm;
  if (diff > 0) {
    return {
      icon: <IncreaseIcon />,
      color: '#4caf50',
      text: `+${diff.toLocaleString()} km`,
    };
  } else if (diff < 0) {
    return {
      icon: <DecreaseIcon />,
      color: '#f44336',
      text: `${diff.toLocaleString()} km`,
    };
  } else {
    return {
      icon: <SameIcon />,
      color: '#666',
      text: 'Bez zmeny',
    };
  }
};

export default function VehicleKmHistory({
  open,
  onClose,
  vehicle,
}: VehicleKmHistoryProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // const { state } = useApp(); // Migrated to React Query

  // React Query hooks for server state
  const { data: insurances = [] } = useInsurances();
  const { data: vehicleDocuments = [] } = useVehicleDocuments();

  const [kmHistory, setKmHistory] = useState<KmHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

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

      setKmHistory(sortedHistory);
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CarIcon />
          <Box>
            <Typography variant="h6">História stavu kilometrov</Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : kmHistory.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Žiadna história kilometrov nie je k dispozícii pre toto vozidlo.
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              História sa vytvára automaticky pri pridávaní STK, EK alebo Kasko
              poistky s uvedeným stavom kilometrov.
            </Typography>
          </Alert>
        ) : (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                📊 Nájdených {kmHistory.length} záznamov o stave kilometrov
              </Typography>
            </Alert>

            <Timeline position={isMobile ? 'right' : 'alternate'}>
              {kmHistory.map((entry, index) => {
                const typeInfo = getDocumentTypeInfo(entry.documentType);
                const previousEntry = kmHistory[index + 1];
                const trend = getKmTrend(entry.kmState, previousEntry?.kmState);
                const entryDate =
                  typeof entry.date === 'string'
                    ? parseISO(entry.date)
                    : entry.date;

                return (
                  <TimelineItem key={entry.id}>
                    {!isMobile && (
                      <TimelineOppositeContent
                        sx={{ m: 'auto 0' }}
                        align="right"
                        variant="body2"
                        color="text.secondary"
                      >
                        {format(entryDate, 'dd.MM.yyyy', { locale: sk })}
                      </TimelineOppositeContent>
                    )}

                    <TimelineSeparator>
                      <TimelineDot
                        sx={{ bgcolor: typeInfo.color, color: 'white' }}
                      >
                        {typeInfo.icon}
                      </TimelineDot>
                      {index < kmHistory.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>

                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 1,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="h6"
                                component="div"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                {typeInfo.label}
                                <Chip
                                  label={`${entry.kmState.toLocaleString()} km`}
                                  color="primary"
                                  size="small"
                                />
                              </Typography>
                              {isMobile && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {format(entryDate, 'dd.MM.yyyy', {
                                    locale: sk,
                                  })}
                                </Typography>
                              )}
                            </Box>

                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <Box
                                sx={{
                                  color: trend.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                {trend.icon}
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{ color: trend.color }}
                              >
                                {trend.text}
                              </Typography>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                            }}
                          >
                            {entry.policyNumber && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <strong>Číslo poistky:</strong>{' '}
                                {entry.policyNumber}
                              </Typography>
                            )}
                            {entry.documentNumber && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <strong>Číslo dokumentu:</strong>{' '}
                                {entry.documentNumber}
                              </Typography>
                            )}
                            {entry.company && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <strong>Spoločnosť:</strong> {entry.company}
                              </Typography>
                            )}
                            {entry.notes && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <strong>Poznámka:</strong> {entry.notes}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>

            {/* Štatistiky */}
            {kmHistory.length > 1 && (
              <Card sx={{ mt: 3, bgcolor: 'background.paper' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📈 Štatistiky
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                      gap: 2,
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {kmHistory[0].kmState.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Aktuálny stav km
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        +
                        {(
                          kmHistory[0].kmState -
                          kmHistory[kmHistory.length - 1].kmState
                        ).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Celkový nárast km
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {kmHistory.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Počet záznamov
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Zavrieť</Button>
      </DialogActions>
    </Dialog>
  );
}
