import {
  DirectionsCar,
  LocationOn,
  Person,
  PhotoCamera,
  Receipt,
  Save,
  SpeedOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useCreateHandoverProtocol } from '@/lib/react-query/hooks/useProtocols';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type {
  HandoverProtocol,
  ProtocolImage,
  ProtocolSignature,
  ProtocolVideo,
  Rental,
  Vehicle,
} from '../../types';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { logger } from '../../utils/logger';
import {
  cacheCompanyDefaults,
  cacheFormDefaults,
  getSmartDefaults,
} from '../../utils/protocolFormCache';
import SerialPhotoCapture from '../common/SerialPhotoCapture';
import SignaturePad from '../common/SignaturePad';

interface HandoverProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  onSave: (protocol: HandoverProtocol) => void;
}

// 🚀 OPTIMALIZÁCIA: Signature display component
const SignatureDisplay = memo<{
  signature: ProtocolSignature;
  onRemove: (id: string) => void;
}>(({ signature, onRemove }) => {
  const handleRemove = useCallback(() => {
    onRemove(signature.id);
  }, [signature.id, onRemove]);

  return (
    <Chip
      key={signature.id}
      label={`${signature.signerName} (${signature.signerRole === 'customer' ? 'Zákazník' : 'Zamestnanec'})`}
      onDelete={handleRemove}
      color={signature.signerRole === 'customer' ? 'primary' : 'secondary'}
      sx={{ mr: 1, mb: 1 }}
    />
  );
});

SignatureDisplay.displayName = 'SignatureDisplay';

const HandoverProtocolForm = memo<HandoverProtocolFormProps>(
  ({ open, onClose, rental, onSave }) => {
    const { state } = useAuth();
    const { state: appState } = useApp();
    const createHandoverProtocol = useCreateHandoverProtocol();
    const [loading, setLoading] = useState(false);
    const [emailStatus, setEmailStatus] = useState<{
      status: 'pending' | 'success' | 'error' | 'warning';
      message?: string;
    } | null>(null);
    const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(
      null
    );
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [currentSigner, setCurrentSigner] = useState<{
      name: string;
      role: 'customer' | 'employee';
    } | null>(null);

    // Retry mechanism state
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const MAX_RETRIES = 3;

    // Component mount logging (development only)
    React.useEffect(() => {
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (isDevelopment) {
        logger.debug('HandoverProtocolForm mounted for rental:', rental?.id);
      }

      return () => {
        if (isDevelopment) {
          logger.debug('HandoverProtocolForm unmounted');
        }
      };
    }, [rental?.id]);

    // Modal state logging (development only)
    React.useEffect(() => {
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (isDevelopment && open) {
        logger.debug('HandoverProtocolForm opened');
      }
    }, [open]);

    // 🚀 OPTIMALIZÁCIA: Vehicle indexing pre rýchle vyhľadávanie
    const vehicleIndex = useMemo(() => {
      const index = new Map<string, Vehicle>();
      appState.vehicles.forEach(vehicle => {
        index.set(vehicle.id, vehicle);
      });
      return index;
    }, [appState.vehicles]);

    // 🚀 OPTIMALIZÁCIA: Okamžité získanie vehicle data bez useEffect
    const currentVehicle = useMemo(() => {
      // Priorita: rental.vehicle > indexované vozidlo > null
      if (rental?.vehicle) {
        return rental.vehicle;
      }
      if (rental?.vehicleId) {
        return vehicleIndex.get(rental.vehicleId) || null;
      }
      return null;
    }, [rental, vehicleIndex]);

    // 🔄 SMART CACHING: Načítanie cached hodnôt pre rýchlejšie vyplnenie
    const smartDefaults = useMemo(() => {
      const companyName = currentVehicle?.company;
      return getSmartDefaults(companyName);
    }, [currentVehicle?.company]);

    // 🚀 OPTIMALIZÁCIA: Memoized form data initialization s smart defaults
    const initialFormData = useMemo(
      () => ({
        location:
          rental.pickupLocation ||
          rental.handoverPlace ||
          smartDefaults.location ||
          '',
        odometer: rental.odometer || undefined,
        fuelLevel: rental.fuelLevel || smartDefaults.fuelLevel || 100,
        depositPaymentMethod:
          smartDefaults.depositPaymentMethod ||
          ('cash' as 'cash' | 'bank_transfer' | 'card'),
        notes: smartDefaults.notes || '',
        vehicleImages: [] as ProtocolImage[],
        documentImages: [] as ProtocolImage[],
        damageImages: [] as ProtocolImage[],
        odometerImages: [] as ProtocolImage[],
        fuelImages: [] as ProtocolImage[],
        vehicleVideos: [] as ProtocolVideo[],
        documentVideos: [] as ProtocolVideo[],
        damageVideos: [] as ProtocolVideo[],
        odometerVideos: [] as ProtocolVideo[],
        fuelVideos: [] as ProtocolVideo[],
        signatures: [] as ProtocolSignature[],
      }),
      [rental, smartDefaults]
    );

    // Zjednodušený state - iba základné polia
    const [formData, setFormData] = useState(initialFormData);

    // 🚀 OPTIMALIZÁCIA: Memoized input change handler
    const handleInputChange = useCallback((field: string, value: unknown) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // 🚀 OPTIMALIZÁCIA: Memoized photo capture handler
    const handlePhotoCapture = useCallback((mediaType: string) => {
      setActivePhotoCapture(mediaType);
    }, []);

    // 🚀 OPTIMALIZÁCIA: Memoized photo capture success handler
    const handlePhotoCaptureSuccess = useCallback(
      (mediaType: string, images: ProtocolImage[], videos: ProtocolVideo[]) => {
        setFormData(prev => ({
          ...prev,
          [`${mediaType}Images`]: images,
          [`${mediaType}Videos`]: videos,
        }));
        setActivePhotoCapture(null);
      },
      []
    );

    // 🚀 OPTIMALIZÁCIA: Memoized signature handlers
    const handleAddSignature = useCallback(
      (signerName: string, signerRole: 'customer' | 'employee') => {
        logger.debug('🖊️ Adding signature:', {
          signerName,
          signerRole,
          rentalCustomer: rental.customer?.name,
          rentalCustomerName: rental.customerName,
        });
        setCurrentSigner({ name: signerName, role: signerRole });
        setShowSignaturePad(true);
      },
      [rental.customer?.name, rental.customerName]
    );

    const handleSignatureSave = useCallback(
      (signatureData: ProtocolSignature) => {
        setFormData(prev => ({
          ...prev,
          signatures: [...prev.signatures, signatureData],
        }));
        setShowSignaturePad(false);
        setCurrentSigner(null);
      },
      []
    );

    const handleRemoveSignature = useCallback((signatureId: string) => {
      setFormData(prev => ({
        ...prev,
        signatures: prev.signatures.filter(sig => sig.id !== signatureId),
      }));
    }, []);

    // 🚀 OPTIMALIZÁCIA: Memoized format functions
    const formatDate = useCallback((date: Date | string) => {
      if (!date) return 'Neuvedené';
      const d = new Date(date);
      return (
        d.toLocaleDateString('sk-SK') +
        ' ' +
        d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
      );
    }, []);

    const formatCurrency = useCallback((amount: number | null | undefined) => {
      return amount ? `${amount.toFixed(2)} €` : '0,00 €';
    }, []);

    // 🚀 OPTIMALIZÁCIA: Quick Save - najprv uloží protokol, PDF na pozadí
    const performSave = useCallback(async (): Promise<{
      protocol: HandoverProtocol | null;
      email?: { sent: boolean; recipient?: string; error?: string };
    }> => {
      // Validácia povinných polí
      const errors: string[] = [];

      if (!formData.location || formData.location.trim() === '') {
        errors.push('Zadajte miesto prevzatia');
      }

      if (
        formData.odometer === undefined ||
        formData.odometer === null ||
        formData.odometer < 0
      ) {
        errors.push('Zadajte stav tachometra');
      }

      if (
        formData.fuelLevel === undefined ||
        formData.fuelLevel === null ||
        formData.fuelLevel < 0 ||
        formData.fuelLevel > 100
      ) {
        errors.push('Zadajte stav paliva (0-100%)');
      }

      // Kontrola podpisov
      const customerSignature = formData.signatures.find(
        sig => sig.signerRole === 'customer'
      );
      const employeeSignature = formData.signatures.find(
        sig => sig.signerRole === 'employee'
      );

      if (!customerSignature) {
        errors.push('Povinný je podpis zákazníka');
      }

      if (!employeeSignature) {
        errors.push('Povinný je podpis zamestnanca');
      }

      if (!formData.depositPaymentMethod) {
        errors.push('Vyberte spôsob úhrady depozitu');
      }

      if (errors.length > 0) {
        console.warn('❌ Validation failed:', errors);
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }

      try {
        setLoading(true);

        // Vytvorenie protokolu s pôvodnou štruktúrou
        const protocol: HandoverProtocol = {
          id: uuidv4(),
          rentalId: rental.id,
          rental: rental,
          type: 'handover',
          status: 'completed',
          createdAt: new Date(),
          completedAt: new Date(),
          location: formData.location,
          vehicleCondition: {
            odometer: formData.odometer || 0,
            fuelLevel: formData.fuelLevel,
            fuelType: 'gasoline',
            exteriorCondition: 'Dobrý',
            interiorCondition: 'Dobrý',
          },
          vehicleImages: formData.vehicleImages,
          vehicleVideos: formData.vehicleVideos,
          documentImages: formData.documentImages,
          documentVideos: formData.documentVideos,
          damageImages: formData.damageImages,
          damageVideos: formData.damageVideos,
          damages: [],
          signatures: formData.signatures,
          rentalData: {
            orderNumber: rental.orderNumber || '',
            vehicle: rental.vehicle || ({} as Vehicle),
            vehicleVin: rental.vehicleVin || rental.vehicle?.vin || undefined, // 🆔 VIN číslo
            customer: {
              id: rental.customerId || '',
              name: rental.customerName || '',
              email:
                rental.customer?.email ||
                ((rental as unknown as Record<string, unknown>)
                  .customerEmail as string) ||
                '',
              phone:
                rental.customer?.phone ||
                ((rental as unknown as Record<string, unknown>)
                  .customerPhone as string) ||
                '',
              createdAt: rental.customer?.createdAt || new Date(),
            },
            startDate:
              typeof rental.startDate === 'string'
                ? new Date(rental.startDate)
                : rental.startDate,
            endDate:
              typeof rental.endDate === 'string'
                ? new Date(rental.endDate)
                : rental.endDate,
            totalPrice: rental.totalPrice,
            deposit: rental.deposit || 0,
            currency: 'EUR',
            allowedKilometers: rental.allowedKilometers || 0,
            extraKilometerRate: rental.extraKilometerRate || 0.5,
            pickupLocation: rental.pickupLocation || rental.handoverPlace,
            returnLocation: rental.returnLocation,
            returnConditions: rental.returnConditions,
          },
          pdfUrl: '',
          emailSent: false,
          notes: `${formData.notes}${formData.notes ? '\n' : ''}Spôsob úhrady depozitu: ${
            formData.depositPaymentMethod === 'cash'
              ? 'Hotovosť'
              : formData.depositPaymentMethod === 'bank_transfer'
                ? 'Bankový prevod'
                : 'Kartová zábezpeka'
          }`,
          createdBy: state.user
            ? `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim() ||
              state.user.username
            : 'admin',
        };

        // Vyčisti media objekty pred odoslaním - odstráni problematické properties
        const cleanedProtocol = {
          ...protocol,
          // Vyčisti nested rental objekt - odstráni problematické properties
          rental: protocol.rental
            ? {
                ...protocol.rental,
                // Ak rental obsahuje media properties, vyčisti ich
                vehicleImages: undefined,
                vehicleVideos: undefined,
                documentImages: undefined,
                damageImages: undefined,
              }
            : undefined,
          // Vyčisti main protocol media arrays
          vehicleImages: (protocol.vehicleImages || []).map(
            (img: ProtocolImage) => ({
              id: img.id,
              url: img.url,
              originalUrl: img.originalUrl, // 🌟 NOVÉ: Pre galériu (vysoká kvalita)
              compressedUrl: img.compressedUrl, // 🌟 NOVÉ: Pre PDF (nízka kvalita)
              type: img.type,
              mediaType:
                (img as unknown as { mediaType?: string }).mediaType || 'image',
              description: img.description || '',
              timestamp: img.timestamp,
            })
          ),
          vehicleVideos: (protocol.vehicleVideos || []).map(
            (vid: ProtocolVideo) => ({
              id: vid.id,
              url: vid.url,
              type: vid.type,
              mediaType:
                (vid as unknown as { mediaType?: string }).mediaType || 'video',
              description: vid.description || '',
              timestamp: vid.timestamp,
            })
          ),
          documentImages: (protocol.documentImages || []).map(
            (img: ProtocolImage) => ({
              id: img.id,
              url: img.url,
              originalUrl: img.originalUrl, // 🌟 NOVÉ: Pre galériu (vysoká kvalita)
              compressedUrl: img.compressedUrl, // 🌟 NOVÉ: Pre PDF (nízka kvalita)
              type: img.type,
              mediaType:
                (img as unknown as { mediaType?: string }).mediaType || 'image',
              description: img.description || '',
              timestamp: img.timestamp,
            })
          ),
          damageImages: (protocol.damageImages || []).map(
            (img: ProtocolImage) => ({
              id: img.id,
              url: img.url,
              originalUrl: img.originalUrl, // 🌟 NOVÉ: Pre galériu (vysoká kvalita)
              compressedUrl: img.compressedUrl, // 🌟 NOVÉ: Pre PDF (nízka kvalita)
              type: img.type,
              mediaType:
                (img as unknown as { mediaType?: string }).mediaType || 'image',
              description: img.description || '',
              timestamp: img.timestamp,
            })
          ),
        };

        logger.debug('🧹 Cleaned handover protocol for DB:', cleanedProtocol);

        // 🚀 QUICK SAVE: Uloženie protokolu s flag-om pre background PDF
        const apiBaseUrl = getApiBaseUrl(); // Still needed for PDF download

        logger.debug('⚡ QUICK SAVE: Sending protocol data...');
        const quickSaveStart = Date.now();

        // 🚀 Use React Query mutation instead of direct fetch
        const result = await createHandoverProtocol.mutateAsync({
          ...cleanedProtocol,
          rental: cleanedProtocol.rental || rental,
        });
        const quickSaveTime = Date.now() - quickSaveStart;

        logger.info(`✅ Protocol saved in ${quickSaveTime}ms`);
        logger.debug('🔍 Protocol result from React Query:', result);

        // React Query automaticky invaliduje cache a refreshuje dáta

        // 🔄 SMART CACHING: Uloženie často používaných hodnôt pre budúce použitie
        const cacheData = {
          location: formData.location,
          fuelLevel: formData.fuelLevel,
          depositPaymentMethod: formData.depositPaymentMethod,
          notes: formData.notes,
        };

        // Global cache
        cacheFormDefaults(cacheData);

        // Company-specific cache ak máme company
        if (currentVehicle?.company) {
          cacheCompanyDefaults(currentVehicle.company, cacheData);
        }

        logger.debug('🔄 Form defaults cached for future use');

        // Extrahuj dáta z response
        const responseData = result as
          | {
              success?: boolean;
              protocol?: HandoverProtocol;
              email?: { sent: boolean; recipient?: string; error?: string };
              pdfProxyUrl?: string;
            }
          | HandoverProtocol;
        const protocolData =
          'protocol' in responseData
            ? responseData.protocol
            : (responseData as HandoverProtocol);
        const emailInfo =
          'email' in responseData ? responseData.email : undefined;
        const pdfProxyUrl =
          'pdfProxyUrl' in responseData
            ? responseData.pdfProxyUrl
            : 'protocol' in responseData &&
                responseData.protocol &&
                'pdfProxyUrl' in responseData.protocol
              ? (responseData.protocol as { pdfProxyUrl?: string }).pdfProxyUrl
              : undefined;

        // 🎯 BACKGROUND PDF DOWNLOAD - na pozadí (neblokuje UI)
        if (pdfProxyUrl) {
          setTimeout(async () => {
            try {
              logger.debug('📄 Background PDF download starting...');
              const pdfResponse = await fetch(`${apiBaseUrl}${pdfProxyUrl}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token')}`,
                },
              });
              if (pdfResponse.ok) {
                const pdfBlob = await pdfResponse.blob();
                const url = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `odovzdavaci_protokol_${currentVehicle?.licensePlate || 'vozidlo'}_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                logger.debug('✅ Background PDF download completed');
              }
            } catch (pdfError) {
              console.warn('PDF background download failed:', pdfError);
            }
          }, 100); // Start po 100ms pre smooth UX
        }

        // ⚡ OKAMŽITÉ ULOŽENIE - bez zatvorenia modalu (nech sa zobrazí email status)
        // React Query vracia priamo protocol objekt, callback to očakáva
        if (protocolData && typeof onSave === 'function') {
          onSave(protocolData);
        }

        // Return result for email status handling - React Query returns protocol directly
        return {
          protocol: protocolData,
          email:
            emailInfo || (result && 'email' in result)
              ? (result.email as {
                  sent: boolean;
                  recipient?: string;
                  error?: string;
                })
              : undefined,
        };
      } catch (error) {
        console.error('Error saving protocol:', error);

        // 🔧 MOBILE FIX: Lepší error handling pre mobile zariadenia
        let errorMessage = 'Chyba pri ukladaní protokolu';

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage =
              '⏱️ Požiadavka trvala príliš dlho. Skúste to znovu s lepším internetovým pripojením.';
          } else if (error.message.includes('fetch')) {
            errorMessage =
              '🌐 Problém s internetovým pripojením. Skontrolujte pripojenie a skúste znovu.';
          } else if (error.message.includes('timeout')) {
            errorMessage =
              '⏱️ Časový limit požiadavky vypršal. Skúste to znovu.';
          } else {
            errorMessage = `Chyba: ${error.message}`;
          }
        }

        console.error('❌ Protocol save failed:', errorMessage);

        // 🚫 PREVENT REFRESH: Zabránime automatickému refreshu
        logger.warn('🛑 Error handled gracefully, preventing page refresh');

        // Return empty result in case of error
        return { protocol: null, email: { sent: false, error: errorMessage } };
      } finally {
        setLoading(false);
      }
    }, [
      formData,
      rental,
      currentVehicle,
      onSave,
      state.user,
      createHandoverProtocol,
    ]);

    // Retry mechanism for failed requests
    const performSaveWithRetry = useCallback(async (): Promise<{
      protocol: HandoverProtocol | null;
      email?: { sent: boolean; recipient?: string; error?: string };
    }> => {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          setRetryCount(attempt - 1);
          return await performSave();
        } catch (error) {
          if (attempt === MAX_RETRIES) {
            setRetryCount(0);
            throw error;
          }

          setIsRetrying(true);
          setEmailStatus({
            status: 'warning',
            message: `Pokus ${attempt}/${MAX_RETRIES} zlyhal, opakujem za 2 sekundy...`,
          });

          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }

      return {
        protocol: null,
        email: { sent: false, error: 'Max retries exceeded' },
      };
    }, [performSave, MAX_RETRIES]);

    const handleSave = useCallback(async () => {
      try {
        setEmailStatus({
          status: 'pending',
          message: 'Odosielam protokol a email...',
        });

        const result = await performSaveWithRetry();

        // Update email status based on response
        if (result && result.email) {
          if (result.email.sent) {
            setEmailStatus({
              status: 'success',
              message: `✅ Protokol bol úspešne odoslaný na email ${result.email.recipient}`,
            });
          } else if (result.email.error) {
            setEmailStatus({
              status: 'error',
              message: `❌ Protokol bol uložený, ale email sa nepodarilo odoslať: ${result.email.error}`,
            });
          } else {
            // Email sa neodoslal ale nie je error - pravdepodobne R2 problém
            setEmailStatus({
              status: 'warning',
              message: `⚠️ Protokol bol uložený, ale email sa nepodarilo odoslať (problém s PDF úložiskom)`,
            });
          }
        } else {
          setEmailStatus({
            status: 'success',
            message: `✅ Protokol bol úspešne uložený`,
          });
        }

        // Počkáme 4 sekundy pred zatvorením aby užívateľ videl email status
        setTimeout(() => {
          logger.debug('✅ Email status zobrazený, zatváram modal');
          onClose();
        }, 4000);
      } catch (error) {
        setEmailStatus({
          status: 'error',
          message: `❌ Nastala chyba po ${MAX_RETRIES} pokusoch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        console.error('❌ Protocol save failed in handleSave:', error);
      } finally {
        setIsRetrying(false);
        setRetryCount(0);
      }
    }, [performSaveWithRetry, onClose, MAX_RETRIES]);

    // 🔧 MOBILE PROTECTION: Immediate rendering - no lazy loading delays
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    // Removed mobileRenderReady as it's no longer needed

    // 🔧 MOBILE STABILIZER: Initialize mobile protection
    React.useEffect(() => {
      if (!open) return; // Guard clause

      const isMobile = window.matchMedia('(max-width: 900px)').matches;
      if (isMobile) {
        logger.debug('📱 HandoverProtocolForm: Starting to render on mobile');
        logger.debug('📊 Memory info:', {
          rental: rental?.id,
          vehicleImages: formData.vehicleImages?.length || 0,
          documentImages: formData.documentImages?.length || 0,
          damageImages: formData.damageImages?.length || 0,
          signatures: formData.signatures?.length || 0,
        });

        // Kontrola memory
        if ('memory' in performance) {
          const memInfo = (
            performance as {
              memory: {
                usedJSHeapSize: number;
                totalJSHeapSize: number;
                jsHeapSizeLimit: number;
              };
            }
          ).memory;
          logger.debug('💾 Memory usage:', {
            used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
            total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
            limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB',
          });
        }

        return () => {
          // Keep stabilizer active - don't destroy on unmount as user might return
          logger.debug('📱 Protocol form unmounted');
        };
      }
    }, [open, rental?.id, formData]);

    // 🔧 MOBILE ERROR BOUNDARY: Catch any rendering errors
    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        const isMobile = window.matchMedia('(max-width: 900px)').matches;
        if (isMobile) {
          console.error(
            '🚨 HandoverProtocolForm error on mobile:',
            event.error
          );
          logger.error('📱 Error details:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
        }
      };

      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);

    // Remove lazy rendering delay - it causes more problems than it solves
    // Removed lazy rendering effect as it's no longer needed

    // 🔥 EARLY RETURN - PO všetkých hooks
    if (!open) return null;

    // Immediate render - no loading delays
    // Removed lazy loading as it causes more problems than benefits

    // Reduced logging for better performance
    if (isMobile) {
      logger.debug('📱 HandoverProtocolForm: Mobile render');
    }

    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {/* Email Status */}
        {(loading || emailStatus?.status === 'pending') && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              {loading ? '⚡ Ukladám protokol...' : emailStatus?.message}
            </Typography>
          </Box>
        )}

        {emailStatus && emailStatus.status !== 'pending' && (
          <Alert
            severity={
              emailStatus.status === 'success'
                ? 'success'
                : emailStatus.status === 'warning'
                  ? 'warning'
                  : 'error'
            }
            sx={{
              mb: 2,
              position: 'sticky',
              top: 0,
              zIndex: 1000,
              animation: 'fadeIn 0.3s ease-in',
            }}
          >
            {emailStatus.message}
          </Alert>
        )}

        {/* Retry Status */}
        {retryCount > 0 && (
          <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Pokus {retryCount + 1}/{MAX_RETRIES}
            </Typography>
            {isRetrying && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={16} />
                <Typography variant="body2">Opakujem...</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Vehicle Info Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <DirectionsCar />
            {currentVehicle?.licensePlate || 'Vozidlo'} -{' '}
            {currentVehicle?.brand} {currentVehicle?.model}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Zákazník: {rental.customer?.name || rental.customerName}
          </Typography>
          {(rental.vehicleVin || currentVehicle?.vin) && (
            <Typography
              variant="caption"
              sx={{
                color: '#888',
                fontFamily: 'monospace',
                display: 'block',
              }}
            >
              VIN: {rental.vehicleVin || currentVehicle?.vin}
            </Typography>
          )}
        </Box>

        {loading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              ⚡ Rýchle ukladanie protokolu...
            </Typography>
          </Box>
        )}

        {/* Informácie o objednávke */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informácie o objednávke
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Číslo objednávky
                </Typography>
                <Chip
                  label={rental.orderNumber || 'Neuvedené'}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Dátum začiatku
                </Typography>
                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{ fontWeight: 'medium' }}
                >
                  {formatDate(rental.startDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Dátum konca
                </Typography>
                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{ fontWeight: 'medium' }}
                >
                  {formatDate(rental.endDate)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Celková cena
                </Typography>
                <Typography
                  variant="body1"
                  color="success.main"
                  sx={{ fontWeight: 'bold' }}
                >
                  {formatCurrency(rental.totalPrice)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Depozit
                </Typography>
                <Typography
                  variant="body1"
                  color="warning.main"
                  sx={{ fontWeight: 'medium' }}
                >
                  {formatCurrency(rental.deposit || 0)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Povolené kilometry
                </Typography>
                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{ fontWeight: 'medium' }}
                >
                  {rental.allowedKilometers
                    ? `${rental.allowedKilometers} km`
                    : 'Neobmedzené'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Cena za extra km
                </Typography>
                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{ fontWeight: 'medium' }}
                >
                  {formatCurrency(rental.extraKilometerRate || 0.5)} / km
                </Typography>
              </Grid>
              {(rental.pickupLocation || rental.handoverPlace) && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Miesto prevzatia
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{ fontWeight: 'medium' }}
                  >
                    {rental.pickupLocation || rental.handoverPlace}
                  </Typography>
                </Grid>
              )}
              {rental.returnLocation && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Miesto vrátenia
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{ fontWeight: 'medium' }}
                  >
                    {rental.returnLocation}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Informácie o zákazníkovi */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informácie o zákazníkovi
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Meno
                </Typography>
                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{ fontWeight: 'bold' }}
                >
                  {rental.customer?.name || rental.customerName || 'Neuvedené'}
                </Typography>
              </Grid>
              {(rental.customer?.email || rental.customerEmail) && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{ fontWeight: 'medium' }}
                  >
                    {rental.customer?.email || rental.customerEmail}
                  </Typography>
                </Grid>
              )}
              {(rental.customer?.phone || rental.customerPhone) && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Telefón
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{ fontWeight: 'medium' }}
                  >
                    {rental.customer?.phone || rental.customerPhone}
                  </Typography>
                </Grid>
              )}
              {rental.customerAddress && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Adresa
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{ fontWeight: 'medium' }}
                  >
                    {rental.customerAddress}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Informácie o vozidle a majiteľovi */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <DirectionsCar sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informácie o vozidle
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Značka a model
                </Typography>
                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{ fontWeight: 'bold' }}
                >
                  {currentVehicle?.brand} {currentVehicle?.model}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  ŠPZ
                </Typography>
                <Chip
                  label={
                    currentVehicle?.licensePlate ||
                    rental.vehicleCode ||
                    'Neuvedené'
                  }
                  color="secondary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              </Grid>
              {(rental.vehicleVin || currentVehicle?.vin) && (
                <Grid item xs={12} sm={6} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    VIN číslo
                  </Typography>
                  <Chip
                    label={
                      rental.vehicleVin || currentVehicle?.vin || 'Neuvedené'
                    }
                    color="default"
                    variant="outlined"
                    sx={{
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                    }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Stav vozidla
                </Typography>
                <Chip
                  label={currentVehicle?.status || 'available'}
                  color={
                    currentVehicle?.status === 'available'
                      ? 'success'
                      : 'warning'
                  }
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Divider sx={{ my: 3 }} />

        {/* Základné informácie protokolu */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
              Údaje protokolu
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 2,
              }}
            >
              <TextField
                label="Miesto prevzatia *"
                value={formData.location}
                onChange={e => handleInputChange('location', e.target.value)}
                fullWidth
                required
                placeholder="Zadajte presné miesto prevzatia vozidla"
              />
              <TextField
                label="Poznámky k protokolu"
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Dodatočné poznámky k odovzdávaniu vozidla"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Stav vozidla */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <SpeedOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
              Stav vozidla pri odovzdaní
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2,
              }}
            >
              <TextField
                label="Stav tachometra (km) *"
                type="number"
                value={formData.odometer || ''}
                onChange={e =>
                  handleInputChange(
                    'odometer',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                fullWidth
                required
                helperText="Aktuálny stav kilometrov na vozidle"
              />
              <TextField
                label="Úroveň paliva (%) *"
                type="number"
                value={formData.fuelLevel}
                onChange={e =>
                  handleInputChange(
                    'fuelLevel',
                    parseInt(e.target.value) || 100
                  )
                }
                inputProps={{ min: 0, max: 100 }}
                fullWidth
                required
                helperText="Percentuálna úroveň paliva v nádrži"
              />
              <FormControl fullWidth required>
                <InputLabel>Spôsob úhrady depozitu *</InputLabel>
                <Select
                  value={formData.depositPaymentMethod}
                  onChange={e =>
                    handleInputChange('depositPaymentMethod', e.target.value)
                  }
                  label="Spôsob úhrady depozitu *"
                >
                  <MenuItem value="cash">Hotovosť</MenuItem>
                  <MenuItem value="bank_transfer">Bankový prevod</MenuItem>
                  <MenuItem value="card">Kartová zábezpeka</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        {/* Fotky */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              <PhotoCamera sx={{ mr: 1, verticalAlign: 'middle' }} />
              Fotodokumentácia
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => handlePhotoCapture('vehicle')}
                size="large"
              >
                Fotky vozidla ({formData.vehicleImages.length})
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => handlePhotoCapture('document')}
                size="large"
              >
                Dokumenty ({formData.documentImages.length})
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => handlePhotoCapture('damage')}
                size="large"
              >
                Poškodenia ({formData.damageImages.length})
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => handlePhotoCapture('odometer')}
                size="large"
              >
                Fotka km ({formData.odometerImages.length})
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => handlePhotoCapture('fuel')}
                size="large"
              >
                Fotka paliva ({formData.fuelImages.length})
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* ✍️ ELEKTRONICKÉ PODPISY */}
        <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
              ✍️ Elektronické podpisy s časovou pečiatkou
            </Typography>

            {/* Existujúce podpisy */}
            {formData.signatures.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {formData.signatures.map(signature => (
                  <SignatureDisplay
                    key={signature.id}
                    signature={signature}
                    onRemove={handleRemoveSignature}
                  />
                ))}
              </Box>
            )}

            {/* Tlačidlá pre pridanie podpisov */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() =>
                  handleAddSignature(
                    rental.customer?.name || rental.customerName || 'Zákazník',
                    'customer'
                  )
                }
                startIcon={<Person />}
                color={
                  formData.signatures.find(sig => sig.signerRole === 'customer')
                    ? 'success'
                    : 'primary'
                }
              >
                Podpis zákazníka *
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  handleAddSignature(
                    `${state.user?.firstName || ''} ${state.user?.lastName || ''}`.trim() ||
                      'Zamestnanec',
                    'employee'
                  )
                }
                startIcon={<Person />}
                color={
                  formData.signatures.find(sig => sig.signerRole === 'employee')
                    ? 'success'
                    : 'primary'
                }
              >
                Podpis zamestnanca *
              </Button>
            </Box>

            {/* Indikátor povinných podpisov */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                * Povinné polia - musia byť vyplnené pred uložením protokolu
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Tlačidlá */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
            mt: 3,
            mb: 2,
          }}
        >
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Zrušiť
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Ukladám...' : 'Uložiť a generovať PDF'}
          </Button>
        </Box>

        {/* Photo capture modal */}
        {activePhotoCapture && (
          <SerialPhotoCapture
            open={true}
            onClose={() => setActivePhotoCapture(null)}
            onSave={(images, videos) =>
              handlePhotoCaptureSuccess(activePhotoCapture, images, videos)
            }
            title={`Fotky - ${activePhotoCapture}`}
            allowedTypes={['vehicle', 'document', 'damage', 'odometer', 'fuel']}
            entityId={rental.id}
            protocolType="handover"
            mediaType={
              activePhotoCapture as
                | 'vehicle'
                | 'document'
                | 'damage'
                | 'odometer'
                | 'fuel'
            }
            category={(() => {
              // Mapovanie mediaType na R2 kategórie
              const mediaTypeToCategory = {
                vehicle: 'vehicle_photos',
                document: 'documents',
                damage: 'damages',
                odometer: 'vehicle_photos',
                fuel: 'vehicle_photos',
              } as const;
              return (
                mediaTypeToCategory[
                  activePhotoCapture as keyof typeof mediaTypeToCategory
                ] || 'other'
              );
            })()}
          />
        )}

        {/* SignaturePad modal */}
        {showSignaturePad && currentSigner && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              p: 2,
            }}
          >
            <Box
              sx={{
                backgroundColor: 'white',
                borderRadius: 2,
                maxWidth: 600,
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
            >
              <SignaturePad
                onSave={handleSignatureSave}
                onCancel={() => setShowSignaturePad(false)}
                signerName={currentSigner.name}
                signerRole={currentSigner.role}
                location={formData.location}
              />
            </Box>
          </Box>
        )}
      </Box>
    );
  }
);

// Set display name for debugging
HandoverProtocolForm.displayName = 'HandoverProtocolForm';

export default HandoverProtocolForm;
