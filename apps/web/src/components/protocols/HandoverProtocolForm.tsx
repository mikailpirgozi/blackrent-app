import {
  Car as DirectionsCar,
  MapPin as LocationOn,
  User as Person,
  Camera as PhotoCamera,
  Receipt as Receipt,
  Save as Save,
  Gauge as SpeedOutlined,
} from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useCreateHandoverProtocol } from '@/lib/react-query/hooks/useProtocols';
// import { useApp } from '../../context/AppContext'; // Migrated to React Query
import { useAuth } from '../../context/AuthContext';
import { useVehicles } from '../../lib/react-query/hooks/useVehicles';
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
import { EnterprisePhotoCapture } from '../common/EnterprisePhotoCapture';
import { ProtocolGallery } from '../common/ProtocolGallery';
import SignaturePad from '../common/SignaturePad';

interface HandoverProtocolFormProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  onSave: (_protocol: HandoverProtocol) => void;
}

// 🚀 OPTIMALIZÁCIA: Signature display component
const SignatureDisplay = memo<{
  signature: ProtocolSignature;
  onRemove: (_id: string) => void;
}>(({ signature, onRemove }) => {
  const handleRemove = useCallback(() => {
    onRemove(signature.id);
  }, [signature.id, onRemove]);

  return (
    <Badge
      key={signature.id}
      variant={signature.signerRole === 'customer' ? 'default' : 'secondary'}
      className="mr-2 mb-2 cursor-pointer hover:opacity-80"
      onClick={handleRemove}
    >
      {signature.signerName} (
      {signature.signerRole === 'customer' ? 'Zákazník' : 'Zamestnanec'})
    </Badge>
  );
});

SignatureDisplay.displayName = 'SignatureDisplay';

const HandoverProtocolForm = memo<HandoverProtocolFormProps>(
  ({ open, onClose, rental, onSave }) => {
    const { state } = useAuth();
    // const { state: appState } = useApp(); // Migrated to React Query
    const { data: vehicles = [] } = useVehicles();
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

    // Gallery state
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryImages, setGalleryImages] = useState<ProtocolImage[]>([]);

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
      vehicles.forEach(vehicle => {
        index.set(vehicle.id, vehicle);
      });
      return index;
    }, [vehicles]);

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
      console.log('🎥🎥🎥 handlePhotoCapture CALLED', { mediaType });
      logger.info('🎥 Photo capture button clicked', { mediaType });
      console.log('🔄 About to call setActivePhotoCapture...');
      setActivePhotoCapture(mediaType);
      console.log('✅ setActivePhotoCapture called');
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
            vehicleVin: rental.vehicleVin || rental.vehicle?.vin || '', // 🆔 VIN číslo
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
            pickupLocation: rental.pickupLocation || rental.handoverPlace || '',
            returnLocation: rental.returnLocation || '',
            returnConditions: rental.returnConditions || '',
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
              originalUrl: img.originalUrl || img.url, // 🌟 NOVÉ: Pre galériu (vysoká kvalita)
              compressedUrl: img.compressedUrl || img.url, // 🌟 NOVÉ: Pre PDF (nízka kvalita)
              pdfUrl: undefined, // ✅ Force IndexedDB lookup for PDF
              pdfData: img.pdfData, // 🎯 V1 PERFECT: Base64 compressed JPEG for ultra-fast PDF generation
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
              originalUrl: img.originalUrl || img.url, // 🌟 NOVÉ: Pre galériu (vysoká kvalita)
              compressedUrl: img.compressedUrl || img.url, // 🌟 NOVÉ: Pre PDF (nízka kvalita)
              pdfUrl: undefined, // ✅ Force IndexedDB lookup for PDF
              pdfData: img.pdfData, // 🎯 V1 PERFECT: Base64 compressed JPEG for ultra-fast PDF generation
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
              originalUrl: img.originalUrl || img.url, // 🌟 NOVÉ: Pre galériu (vysoká kvalita)
              compressedUrl: img.compressedUrl || img.url, // 🌟 NOVÉ: Pre PDF (nízka kvalita)
              pdfUrl: undefined, // ✅ Force IndexedDB lookup for PDF
              pdfData: img.pdfData, // 🎯 V1 PERFECT: Base64 compressed JPEG for ultra-fast PDF generation
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
          window.setTimeout(async () => {
            try {
              logger.debug('📄 Background PDF download starting...');
              const pdfResponse = await fetch(`${apiBaseUrl}${pdfProxyUrl}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token')}`,
                },
              });
              if (pdfResponse.ok) {
                const pdfBlob = await pdfResponse.blob();
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `odovzdavaci_protokol_${currentVehicle?.licensePlate || 'vozidlo'}_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
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
          protocol: protocolData || null,
          email: emailInfo
            ? emailInfo
            : result && 'email' in result
              ? (result.email as {
                  sent: boolean;
                  recipient?: string;
                  error?: string;
                })
              : { sent: false, error: 'Email information not available' },
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
          await new Promise(resolve =>
            window.setTimeout(resolve, 2000 * attempt)
          );
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
        window.setTimeout(() => {
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
        if ('memory' in window.performance) {
          const memInfo = (
            window.performance as {
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

      return undefined; // Explicit return for non-mobile case
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
      <div className="w-full max-w-full">
        {/* Email Status */}
        {(loading || emailStatus?.status === 'pending') && (
          <div className="mb-2">
            <Progress value={undefined} className="w-full" />
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {loading ? '⚡ Ukladám protokol...' : emailStatus?.message}
            </p>
          </div>
        )}

        {emailStatus && emailStatus.status !== 'pending' && (
          <Alert
            variant={
              emailStatus.status === 'success'
                ? 'default'
                : emailStatus.status === 'warning'
                  ? 'default'
                  : 'destructive'
            }
            className="mb-2 sticky top-0 z-[1000] animate-in fade-in duration-300"
          >
            {emailStatus.message}
          </Alert>
        )}

        {/* Retry Status */}
        {retryCount > 0 && (
          <div className="mt-2 mb-2 text-center">
            <p className="mb-1 text-sm text-muted-foreground">
              Pokus {retryCount + 1}/{MAX_RETRIES}
            </p>
            {isRetrying && (
              <div className="flex items-center justify-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm">Opakujem...</p>
              </div>
            )}
          </div>
        )}

        {/* Vehicle Info Header */}
        <div className="mb-3">
          <h3 className="flex items-center gap-1 text-lg font-semibold text-foreground">
            <DirectionsCar />
            {currentVehicle?.licensePlate || 'Vozidlo'} -{' '}
            {currentVehicle?.brand} {currentVehicle?.model}
          </h3>
          <p className="text-sm text-muted-foreground">
            Zákazník: {rental.customer?.name || rental.customerName}
          </p>
          {(rental.vehicleVin || currentVehicle?.vin) && (
            <p className="text-xs text-gray-500 font-mono block">
              VIN: {rental.vehicleVin || currentVehicle?.vin}
            </p>
          )}
        </div>

        {loading && (
          <div className="mb-2">
            <Progress value={undefined} className="w-full" />
            <p className="mt-1 text-center text-sm text-muted-foreground">
              ⚡ Rýchle ukladanie protokolu...
            </p>
          </div>
        )}

        {/* Informácie o objednávke */}
        <Card className="mb-3">
          <CardContent>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              <Receipt className="mr-1 inline-block" />
              Informácie o objednávke
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Číslo objednávky
                </p>
                <Badge variant="outline" className="font-bold">
                  {rental.orderNumber || 'Neuvedené'}
                </Badge>
              </div>
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Dátum začiatku
                </p>
                <p className="text-foreground font-medium">
                  {formatDate(rental.startDate)}
                </p>
              </div>
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Dátum konca
                </p>
                <p className="text-foreground font-medium">
                  {formatDate(rental.endDate)}
                </p>
              </div>
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Celková cena
                </p>
                <p className="text-green-600 font-bold">
                  {formatCurrency(rental.totalPrice)}
                </p>
              </div>
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Depozit
                </p>
                <p className="text-yellow-600 font-medium">
                  {formatCurrency(rental.deposit || 0)}
                </p>
              </div>
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Povolené kilometry
                </p>
                <p className="text-foreground font-medium">
                  {rental.allowedKilometers
                    ? `${rental.allowedKilometers} km`
                    : 'Neobmedzené'}
                </p>
              </div>
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Cena za extra km
                </p>
                <p className="text-foreground font-medium">
                  {formatCurrency(rental.extraKilometerRate || 0.5)} / km
                </p>
              </div>
              {(rental.pickupLocation || rental.handoverPlace) && (
                <div className="col-span-1 sm:col-span-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Miesto prevzatia
                  </p>
                  <p className="text-foreground font-medium">
                    {rental.pickupLocation || rental.handoverPlace}
                  </p>
                </div>
              )}
              {rental.returnLocation && (
                <div className="col-span-1 sm:col-span-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Miesto vrátenia
                  </p>
                  <p className="text-foreground font-medium">
                    {rental.returnLocation}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informácie o zákazníkovi */}
        <Card className="mb-3">
          <CardContent>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              <Person className="mr-1 inline-block" />
              Informácie o zákazníkovi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Meno
                </p>
                <p className="text-foreground font-bold">
                  {rental.customer?.name || rental.customerName || 'Neuvedené'}
                </p>
              </div>
              {(rental.customer?.email || rental.customerEmail) && (
                <div className="col-span-1 sm:col-span-1 md:col-span-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-foreground font-medium">
                    {rental.customer?.email || rental.customerEmail}
                  </p>
                </div>
              )}
              {(rental.customer?.phone || rental.customerPhone) && (
                <div className="col-span-1 sm:col-span-1 md:col-span-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Telefón
                  </p>
                  <p className="text-foreground font-medium">
                    {rental.customer?.phone || rental.customerPhone}
                  </p>
                </div>
              )}
              {rental.customerAddress && (
                <div className="col-span-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Adresa
                  </p>
                  <p className="text-foreground font-medium">
                    {rental.customerAddress}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informácie o vozidle a majiteľovi */}
        <Card className="mb-3">
          <CardContent>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              <DirectionsCar className="mr-1 inline-block" />
              Informácie o vozidle
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Značka a model
                </p>
                <p className="text-foreground font-bold">
                  {currentVehicle?.brand} {currentVehicle?.model}
                </p>
              </div>
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">ŠPZ</p>
                <Badge variant="outline" className="font-bold">
                  {currentVehicle?.licensePlate ||
                    rental.vehicleCode ||
                    'Neuvedené'}
                </Badge>
              </div>
              {(rental.vehicleVin || currentVehicle?.vin) && (
                <div className="col-span-1 sm:col-span-1 md:col-span-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    VIN číslo
                  </p>
                  <Badge
                    variant="outline"
                    className="font-bold font-mono text-xs"
                  >
                    {rental.vehicleVin || currentVehicle?.vin || 'Neuvedené'}
                  </Badge>
                </div>
              )}
              <div className="col-span-1 sm:col-span-1 md:col-span-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Stav vozidla
                </p>
                <Badge
                  variant="outline"
                  className={
                    currentVehicle?.status === 'available'
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }
                >
                  {currentVehicle?.status || 'available'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-3" />

        {/* Základné informácie protokolu */}
        <Card className="mb-3">
          <CardContent>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              <LocationOn className="mr-1 inline-block" />
              Údaje protokolu
            </h3>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-2">
              <div className="space-y-2">
                <Label htmlFor="location">Miesto prevzatia *</Label>
                <Select
                  value={formData.location}
                  onValueChange={value => handleInputChange('location', value)}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Vyberte miesto prevzatia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bratislava">Bratislava</SelectItem>
                    <SelectItem value="Košice">Košice</SelectItem>
                    <SelectItem value="Žilina">Žilina</SelectItem>
                    <SelectItem value="Trnava">Trnava</SelectItem>
                    <SelectItem value="Nitra">Nitra</SelectItem>
                    <SelectItem value="Banská Bystrica">
                      Banská Bystrica
                    </SelectItem>
                    <SelectItem value="Prešov">Prešov</SelectItem>
                    <SelectItem value="Trenčín">Trenčín</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Poznámky k protokolu</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  className="min-h-[60px]"
                  rows={2}
                  placeholder="Dodatočné poznámky k odovzdávaniu vozidla"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stav vozidla */}
        <Card className="mb-3">
          <CardContent>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              <SpeedOutlined className="mr-1 inline-block" />
              Stav vozidla pri odovzdaní
            </h3>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
              <div className="space-y-2">
                <Label htmlFor="odometer">Stav tachometra (km) *</Label>
                <Input
                  id="odometer"
                  type="number"
                  value={formData.odometer || ''}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === '') {
                      handleInputChange('odometer', undefined);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 0) {
                        handleInputChange('odometer', numValue);
                      }
                    }
                  }}
                  required
                  placeholder="Zadajte stav tachometra"
                />
                <p className="text-sm text-muted-foreground">
                  Aktuálny stav kilometrov na vozidle
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelLevel">Úroveň paliva (%) *</Label>
                <Input
                  id="fuelLevel"
                  type="number"
                  value={formData.fuelLevel}
                  onChange={e =>
                    handleInputChange(
                      'fuelLevel',
                      parseInt(e.target.value) || 100
                    )
                  }
                  min={0}
                  max={100}
                  required
                  placeholder="Zadajte úroveň paliva"
                />
                <p className="text-sm text-muted-foreground">
                  Percentuálna úroveň paliva v nádrži
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositPaymentMethod">
                  Spôsob úhrady depozitu *
                </Label>
                <Select
                  value={formData.depositPaymentMethod}
                  onValueChange={value =>
                    handleInputChange('depositPaymentMethod', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte spôsob úhrady" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Hotovosť</SelectItem>
                    <SelectItem value="bank_transfer">
                      Bankový prevod
                    </SelectItem>
                    <SelectItem value="card">Kartová zábezpeka</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fotky */}
        <Card className="mb-3">
          <CardContent>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              <PhotoCamera className="mr-1 inline-block" />
              Fotodokumentácia
            </h3>

            <div className="space-y-3">
              {/* Vehicle Photos */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    try {
                      console.log('🔥🔥🔥 VEHICLE BUTTON RAW CLICK EVENT', e);
                      console.log('📊 Current activePhotoCapture state:', activePhotoCapture);
                      logger.info('🔥 VEHICLE BUTTON CLICKED - Direct handler');
                      handlePhotoCapture('vehicle');
                      console.log('✅ handlePhotoCapture called successfully');
                      
                      // Check state after small delay
                      setTimeout(() => {
                        console.log('📊 activePhotoCapture after 100ms:', activePhotoCapture);
                      }, 100);
                    } catch (error) {
                      console.error('❌ ERROR in onClick handler:', error);
                      logger.error('Button click error', { error });
                    }
                  }}
                  size="lg"
                  className="flex-1"
                  type="button"
                >
                  <PhotoCamera className="mr-2 h-4 w-4" />
                  Fotky vozidla ({formData.vehicleImages.length})
                </Button>
                {formData.vehicleImages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setGalleryImages(formData.vehicleImages);
                      setGalleryOpen(true);
                    }}
                  >
                    👁️ Zobraziť
                  </Button>
                )}
              </div>

              {/* Document Photos */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePhotoCapture('document')}
                  size="lg"
                  className="flex-1"
                >
                  <PhotoCamera className="mr-2 h-4 w-4" />
                  Dokumenty ({formData.documentImages.length})
                </Button>
                {formData.documentImages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setGalleryImages(formData.documentImages);
                      setGalleryOpen(true);
                    }}
                  >
                    👁️ Zobraziť
                  </Button>
                )}
              </div>

              {/* Damage Photos */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePhotoCapture('damage')}
                  size="lg"
                  className="flex-1"
                >
                  <PhotoCamera className="mr-2 h-4 w-4" />
                  Poškodenia ({formData.damageImages.length})
                </Button>
                {formData.damageImages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setGalleryImages(formData.damageImages);
                      setGalleryOpen(true);
                    }}
                  >
                    👁️ Zobraziť
                  </Button>
                )}
              </div>

              {/* Odometer & Fuel */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePhotoCapture('odometer')}
                  size="lg"
                >
                  <PhotoCamera className="mr-2 h-4 w-4" />
                  Km ({formData.odometerImages.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePhotoCapture('fuel')}
                  size="lg"
                >
                  <PhotoCamera className="mr-2 h-4 w-4" />
                  Palivo ({formData.fuelImages.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✍️ ELEKTRONICKÉ PODPISY */}
        <Card className="mb-3">
          <CardContent>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              ✍️ Elektronické podpisy s časovou pečiatkou
            </h3>

            {/* Existujúce podpisy */}
            {formData.signatures.length > 0 && (
              <div className="mb-2">
                {formData.signatures.map(signature => (
                  <SignatureDisplay
                    key={signature.id}
                    signature={signature}
                    onRemove={handleRemoveSignature}
                  />
                ))}
              </div>
            )}

            {/* Tlačidlá pre pridanie podpisov */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() =>
                  handleAddSignature(
                    rental.customer?.name || rental.customerName || 'Zákazník',
                    'customer'
                  )
                }
                variant={
                  formData.signatures.find(sig => sig.signerRole === 'customer')
                    ? 'default'
                    : 'outline'
                }
              >
                <Person className="mr-2 h-4 w-4" />
                Podpis zákazníka *
              </Button>
              <Button
                onClick={() =>
                  handleAddSignature(
                    `${state.user?.firstName || ''} ${state.user?.lastName || ''}`.trim() ||
                      'Zamestnanec',
                    'employee'
                  )
                }
                variant={
                  formData.signatures.find(sig => sig.signerRole === 'employee')
                    ? 'default'
                    : 'outline'
                }
              >
                <Person className="mr-2 h-4 w-4" />
                Podpis zamestnanca *
              </Button>
            </div>

            {/* Indikátor povinných podpisov */}
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                * Povinné polia - musia byť vyplnené pred uložením protokolu
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tlačidlá */}
        <div className="flex gap-2 justify-end mt-3 mb-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Zrušiť
          </Button>
          <Button variant="default" onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Ukladám...' : 'Uložiť a generovať PDF'}
          </Button>
        </div>

        {/* Photo capture modal - ENTERPRISE BLIND UPLOAD */}
        {activePhotoCapture && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {activePhotoCapture === 'vehicle' && '🚗 Fotky vozidla'}
                    {activePhotoCapture === 'document' && '📄 Fotky dokladov'}
                    {activePhotoCapture === 'damage' && '⚠️ Fotky poškodenia'}
                    {activePhotoCapture === 'odometer' && '🔢 Fotky tachometra'}
                    {activePhotoCapture === 'fuel' && '⛽ Fotky paliva'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      console.log('❌ Closing photo capture modal');
                      setActivePhotoCapture(null);
                    }}
                  >
                    ✕
                  </Button>
                </div>
                <EnterprisePhotoCapture
                  protocolId={rental.id}
                  protocolType="handover"
                  mediaType={
                    activePhotoCapture as
                      | 'vehicle'
                      | 'document'
                      | 'damage'
                      | 'odometer'
                      | 'fuel'
                  }
                  onPhotosUploaded={(results) => {
                    console.log('📸 Photos uploaded successfully', { count: results.length });
                    // Convert UploadResult[] to ProtocolImage format
                    // CRITICAL: Use imageId from upload result (matches IndexedDB key!)
                    const images = results.map((result) => ({
                      id: result.imageId, // ✅ CRITICAL: Use ID from upload (IndexedDB key)
                      url: result.url,
                      originalUrl: result.url,
                      pdfUrl: undefined, // ✅ Force PDF to use IndexedDB JPEG 20% (not R2 WebP!)
                      type: activePhotoCapture,
                      description: '',
                      timestamp: new Date(),
                      compressed: true,
                      originalSize: 0,
                      compressedSize: 0,
                    }));
                    handlePhotoCaptureSuccess(activePhotoCapture, images, []);
                  }}
                  maxPhotos={100}
                />
              </div>
            </div>
          </div>
        )}

        {/* SignaturePad modal */}
        {showSignaturePad && currentSigner && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-[9999] p-2">
            <div className="bg-white rounded-lg max-w-[600px] w-full max-h-[90vh] overflow-auto">
              <SignaturePad
                onSave={handleSignatureSave}
                onCancel={() => setShowSignaturePad(false)}
                signerName={currentSigner.name}
                signerRole={currentSigner.role}
                location={formData.location}
              />
            </div>
          </div>
        )}

        {/* Protocol Gallery */}
        <ProtocolGallery
          images={galleryImages}
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
        />
      </div>
    );
  }
);

// Set display name for debugging
HandoverProtocolForm.displayName = 'HandoverProtocolForm';

export default HandoverProtocolForm;
