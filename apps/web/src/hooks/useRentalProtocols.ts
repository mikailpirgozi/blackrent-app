import type React from 'react';
import { useCallback, useRef, useState } from 'react';

import { apiService } from '../services/api';
import type { ProtocolImage, ProtocolVideo, Rental } from '../types';
import { logger } from '../utils/logger';

// Protocol data interfaces
interface ProtocolData {
  id: string;
  rentalId: string;
  createdAt: string;
  completedAt?: string;
  status: string;
  images?: ProtocolImage[];
  videos?: ProtocolVideo[];
  signatures?: Record<string, unknown>;
  notes?: string;
  [key: string]: unknown;
}

interface ProtocolsData {
  handover?: ProtocolData;
  return?: ProtocolData;
}

// interface BulkProtocolStatusItem {
//   rentalId: string;
//   hasHandoverProtocol: boolean;
//   hasReturnProtocol: boolean;
//   handoverProtocolId?: string;
//   returnProtocolId?: string;
// }

interface ImageParsingCacheItem {
  images: ProtocolImage[];
  videos: ProtocolVideo[];
  timestamp: number;
}

// API response interfaces
interface ApiProtocolsResponse {
  handoverProtocols?: ProtocolData[];
  returnProtocols?: ProtocolData[];
}

interface UseRentalProtocolsProps {
  onProtocolUpdate?: (
    rentalId: string,
    protocolType: 'handover' | 'return',
    data: ProtocolData
  ) => void;
}

interface UseRentalProtocolsReturn {
  // Protocol state
  protocols: Record<string, ProtocolsData>;
  setProtocols: React.Dispatch<
    React.SetStateAction<Record<string, ProtocolsData>>
  >;
  loadingProtocols: string[];
  setLoadingProtocols: (loading: string[]) => void;

  // Protocol status state
  protocolStatusMap: Record<
    string,
    {
      hasHandoverProtocol: boolean;
      hasReturnProtocol: boolean;
      handoverProtocolId?: string;
      returnProtocolId?: string;
    }
  >;
  setProtocolStatusMap: React.Dispatch<
    React.SetStateAction<
      Record<
        string,
        {
          hasHandoverProtocol: boolean;
          hasReturnProtocol: boolean;
          handoverProtocolId?: string;
          returnProtocolId?: string;
        }
      >
    >
  >;
  isLoadingProtocolStatus: boolean;
  setIsLoadingProtocolStatus: (loading: boolean) => void;
  protocolStatusLoaded: boolean;
  setProtocolStatusLoaded: (loaded: boolean) => void;

  // Dialog states
  openHandoverDialog: boolean;
  setOpenHandoverDialog: (open: boolean) => void;
  openReturnDialog: boolean;
  setOpenReturnDialog: (open: boolean) => void;
  selectedRentalForProtocol: Rental | null;
  setSelectedRentalForProtocol: (rental: Rental | null) => void;
  openProtocolMenu: boolean;
  setOpenProtocolMenu: (open: boolean) => void;
  selectedProtocolType: 'handover' | 'return' | null;
  setSelectedProtocolType: (type: 'handover' | 'return' | null) => void;

  // PDF viewer state
  pdfViewerOpen: boolean;
  setPdfViewerOpen: (open: boolean) => void;
  selectedPdf: {
    url: string;
    title: string;
    type: 'handover' | 'return';
  } | null;
  setSelectedPdf: (
    pdf: { url: string; title: string; type: 'handover' | 'return' } | null
  ) => void;

  // Gallery state
  galleryOpenRef: React.MutableRefObject<boolean>;
  galleryImages: ProtocolImage[];
  setGalleryImages: (images: ProtocolImage[]) => void;
  galleryVideos: ProtocolVideo[];
  setGalleryVideos: (videos: ProtocolVideo[]) => void;
  galleryTitle: string;
  setGalleryTitle: (title: string) => void;

  // Image parsing cache
  imageParsingCache: Map<string, ImageParsingCacheItem>;

  // Protocol handlers
  loadProtocolsForRental: (rentalId: string) => Promise<ProtocolsData | null>;
  loadProtocolStatusInBackground: () => Promise<void>;
  preloadTopProtocols: (rentals: Rental[]) => Promise<void>;
  handleCreateHandover: (rental: Rental) => Promise<void>;
  handleCreateReturn: (rental: Rental) => Promise<void>;
  handleCloseHandoverDialog: () => void;
  handleCloseReturnDialog: () => void;
  handleClosePDF: () => void;
  handleCloseGallery: () => void;
  handleCloseProtocolMenu: () => void;
  handleDownloadPDF: () => void;
  handleViewGallery: () => void;

  // Callback
  onProtocolUpdate?: (
    rentalId: string,
    protocolType: 'handover' | 'return',
    data: ProtocolData
  ) => void;
}

export const useRentalProtocols = ({
  onProtocolUpdate,
}: UseRentalProtocolsProps = {}): UseRentalProtocolsReturn => {
  // Protocol state
  const [protocols, setProtocols] = useState<Record<string, ProtocolsData>>({});
  const [loadingProtocols, setLoadingProtocols] = useState<string[]>([]);

  // ⚡ BACKGROUND PROTOCOL LOADING STATE
  const [protocolStatusMap, setProtocolStatusMap] = useState<
    Record<
      string,
      {
        hasHandoverProtocol: boolean;
        hasReturnProtocol: boolean;
        handoverProtocolId?: string;
        returnProtocolId?: string;
      }
    >
  >({});
  const [isLoadingProtocolStatus, setIsLoadingProtocolStatus] = useState(false);
  const [protocolStatusLoaded, setProtocolStatusLoaded] = useState(false);

  // Protocol dialog states
  const [openHandoverDialog, setOpenHandoverDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedRentalForProtocol, setSelectedRentalForProtocol] =
    useState<Rental | null>(null);
  const [openProtocolMenu, setOpenProtocolMenu] = useState(false);
  const [selectedProtocolType, setSelectedProtocolType] = useState<
    'handover' | 'return' | null
  >(null);

  // PDF viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{
    url: string;
    title: string;
    type: 'handover' | 'return';
  } | null>(null);

  // Image gallery - using useRef to survive re-renders
  const galleryOpenRef = useRef(false);
  const [galleryImages, setGalleryImages] = useState<ProtocolImage[]>([]);
  const [galleryVideos, setGalleryVideos] = useState<ProtocolVideo[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');

  // 💾 IMAGE PARSING CACHE - cache pre parsed images aby sa neparovali zakaždým
  const [imageParsingCache] = useState(
    new Map<string, ImageParsingCacheItem>()
  );

  // Optimalizovaná funkcia pre načítanie protokolov na požiadanie
  const loadProtocolsForRental = useCallback(
    async (rentalId: string) => {
      // Ak už sa načítavajú protokoly pre tento rental, vráť existujúce dáta ak sú dostupné
      if (loadingProtocols.includes(rentalId)) {
        logger.debug('Protocols already loading for rental', { rentalId });
        // Vráť existujúce protokoly ak sú dostupné
        return protocols[rentalId] || null;
      }

      logger.debug('Loading protocols for rental', { rentalId });
      setLoadingProtocols(prev => [...prev, rentalId]);

      try {
        logger.debug('🔄 API call starting for rental', { rentalId });
        const data = await apiService.getProtocolsByRental(rentalId);
        logger.debug('✅ API call completed for rental', {
          rentalId,
          hasData: !!data,
        });

        // Type assertion pre API response - API vracia HandoverProtocol[] a ReturnProtocol[]
        const apiData = {
          handoverProtocols: data.handoverProtocols.map(protocol => ({
            ...protocol,
            createdAt:
              protocol.createdAt instanceof Date
                ? protocol.createdAt.toISOString()
                : protocol.createdAt,
            completedAt:
              protocol.completedAt instanceof Date
                ? protocol.completedAt.toISOString()
                : protocol.completedAt,
            signatures: protocol.signatures as unknown as Record<
              string,
              unknown
            >,
          })) as unknown as ProtocolData[],
          returnProtocols: data.returnProtocols.map(protocol => ({
            ...protocol,
            createdAt:
              protocol.createdAt instanceof Date
                ? protocol.createdAt.toISOString()
                : protocol.createdAt,
            completedAt:
              protocol.completedAt instanceof Date
                ? protocol.completedAt.toISOString()
                : protocol.completedAt,
            signatures: protocol.signatures as unknown as Record<
              string,
              unknown
            >,
          })) as unknown as ProtocolData[],
        } as ApiProtocolsResponse;

        // ✅ NAJNOVŠÍ PROTOKOL: Zoradiť podľa createdAt a vziať najnovší
        const latestHandover =
          apiData?.handoverProtocols && apiData.handoverProtocols.length > 0
            ? apiData.handoverProtocols.sort(
                (a: ProtocolData, b: ProtocolData) =>
                  new Date(b.createdAt || b.completedAt || 0).getTime() -
                  new Date(a.createdAt || a.completedAt || 0).getTime()
              )[0]
            : undefined;

        const latestReturn =
          apiData?.returnProtocols && apiData.returnProtocols.length > 0
            ? apiData.returnProtocols.sort(
                (a: ProtocolData, b: ProtocolData) =>
                  new Date(b.createdAt || b.completedAt || 0).getTime() -
                  new Date(a.createdAt || a.completedAt || 0).getTime()
              )[0]
            : undefined;

        logger.debug('Protocols API response', {
          hasData: !!apiData,
          handoverCount: apiData?.handoverProtocols?.length || 0,
          returnCount: apiData?.returnProtocols?.length || 0,
          rentalId,
        });

        const protocolData: ProtocolsData = {
          handover: latestHandover!,
          return: latestReturn!,
        };

        logger.debug('🔄 Setting protocols state for rental', {
          rentalId,
          protocolData,
        });
        setProtocols(prev => ({
          ...prev,
          [rentalId]: protocolData,
        }));

        logger.debug('✅ Protocols loaded successfully for rental', {
          rentalId,
        });
        // ⚡ RETURN načítané dáta pre okamžité použitie
        return protocolData;
      } catch (error) {
        logger.error('❌ Failed to load protocols', { rentalId, error });
        return null;
      } finally {
        logger.debug('🧹 Cleaning up loading state for rental', { rentalId });
        setLoadingProtocols(prev => {
          const newState = prev.filter(id => id !== rentalId);
          logger.debug('🧹 Loading protocols updated', {
            before: prev,
            after: newState,
          });
          return newState;
        });
      }
    },
    [loadingProtocols, protocols]
  );

  // 🚀 AGGRESSIVE PRELOADING - preloaduje protokoly pre prvých 10 prenájmov
  const preloadTopProtocols = useCallback(
    async (rentals: Rental[]) => {
      if (!rentals || rentals.length === 0) return;

      // Vezmi prvých 10 prenájmov (najnovšie/najčastejšie používané)
      const topRentals = rentals.slice(0, 10);

      logger.debug(
        `🚀 PRELOADING: Starting aggressive preload for ${topRentals.length} top rentals...`
      );

      // Preloaduj protokoly paralelne (bez await)
      topRentals.forEach(rental => {
        if (
          protocolStatusMap[rental.id]?.hasHandoverProtocol ||
          protocolStatusMap[rental.id]?.hasReturnProtocol
        ) {
          // Spusti preloading na pozadí bez čakania
          loadProtocolsForRental(rental.id).catch(error => {
            logger.debug(`⚠️ Preload failed for rental ${rental.id}:`, error);
          });
        }
      });
    },
    [protocolStatusMap, loadProtocolsForRental]
  );

  // ⚡ BACKGROUND PROTOCOL LOADING - načíta protocol status na pozadí bez spomalenia
  const loadProtocolStatusInBackground = useCallback(async () => {
    if (isLoadingProtocolStatus || protocolStatusLoaded) {
      return; // Už sa načítava alebo je načítané
    }

    logger.debug('🚀 BACKGROUND: Starting protocol status loading...');
    setIsLoadingProtocolStatus(true);

    try {
      const startTime = Date.now();
      const bulkProtocolStatus = await apiService.getBulkProtocolStatus();
      const loadTime = Date.now() - startTime;

      // Optimalized: Consolidated protocol status loading log
      const rentalCount = Object.keys(bulkProtocolStatus).length;
      logger.debug(
        `✅ Protocol status loaded: ${rentalCount} rentals (${loadTime}ms)`
      );

      // bulkProtocolStatus je už objekt, nie array - použijeme ho priamo
      const statusMap: Record<
        string,
        {
          hasHandoverProtocol: boolean;
          hasReturnProtocol: boolean;
          handoverProtocolId?: string;
          returnProtocolId?: string;
        }
      > = bulkProtocolStatus;

      setProtocolStatusMap(statusMap);
      setProtocolStatusLoaded(true);
    } catch (error) {
      console.error('❌ BACKGROUND: Failed to load protocol status:', error);
    } finally {
      setIsLoadingProtocolStatus(false);
    }
  }, [isLoadingProtocolStatus, protocolStatusLoaded]);

  // Handover Protocol handlers
  const handleCreateHandover = useCallback(
    async (rental: Rental) => {
      logger.debug('📝 Creating handover protocol for rental:', rental.id);

      try {
        // ✅ OKAMŽITÉ OTVORENIE: Najprv otvor dialog, potom načítaj protokoly na pozadí
        setSelectedRentalForProtocol(rental);
        setSelectedProtocolType('handover');
        setOpenHandoverDialog(true);

        logger.info('Opening handover protocol dialog', {
          rentalId: rental.id,
        });

        // Načítaj protokoly na pozadí (bez await)
        loadProtocolsForRental(rental.id).catch(error => {
          logger.error('Failed to load protocols in background', {
            rentalId: rental.id,
            error,
          });
        });
      } catch (error) {
        logger.error('Failed to prepare handover protocol', {
          rentalId: rental.id,
          error,
        });
      }
    },
    [loadProtocolsForRental]
  );

  // Return Protocol handlers
  const handleCreateReturn = useCallback(
    async (rental: Rental) => {
      logger.debug('📝 Creating return protocol for rental:', rental.id);

      try {
        // ✅ PRE RETURN PROTOCOL: Najprv otvor dialog, potom načítaj protokoly
        setSelectedRentalForProtocol(rental);
        setSelectedProtocolType('return');
        setOpenReturnDialog(true);

        logger.info('Opening return protocol dialog', { rentalId: rental.id });

        // ✅ NAČÍTAJ PROTOKOLY: Pre return protocol potrebujeme handover protocol
        loadProtocolsForRental(rental.id).catch(error => {
          logger.error('Failed to load protocols for return dialog', {
            rentalId: rental.id,
            error,
          });
          // Ak sa nepodarí načítať protokoly, zatvor dialog a zobraz chybu
          setOpenReturnDialog(false);
          setSelectedRentalForProtocol(null);
          setSelectedProtocolType(null);
          alert('Chyba pri načítavaní protokolov. Skúste to znovu.');
        });
      } catch (error) {
        logger.error('Failed to prepare return protocol', {
          rentalId: rental.id,
          error,
        });
      }
    },
    [loadProtocolsForRental]
  );

  // Dialog close handlers
  const handleCloseHandoverDialog = useCallback(() => {
    setOpenHandoverDialog(false);
    setSelectedRentalForProtocol(null);
    setSelectedProtocolType(null);

    // Refresh protocols after closing
    if (selectedRentalForProtocol) {
      loadProtocolsForRental(selectedRentalForProtocol.id);
    }
  }, [selectedRentalForProtocol, loadProtocolsForRental]);

  const handleCloseReturnDialog = useCallback(() => {
    setOpenReturnDialog(false);
    setSelectedRentalForProtocol(null);
    setSelectedProtocolType(null);

    // Refresh protocols after closing
    if (selectedRentalForProtocol) {
      loadProtocolsForRental(selectedRentalForProtocol.id);
    }
  }, [selectedRentalForProtocol, loadProtocolsForRental]);

  const handleClosePDF = useCallback(() => {
    setPdfViewerOpen(false);
    setSelectedPdf(null);
  }, []);

  const handleCloseGallery = useCallback(() => {
    galleryOpenRef.current = false;
    setGalleryImages([]);
    setGalleryVideos([]);
    setGalleryTitle('');
  }, []);

  const handleCloseProtocolMenu = useCallback(() => {
    setOpenProtocolMenu(false);
    setSelectedRentalForProtocol(null);
    setSelectedProtocolType(null);
  }, []);

  // PDF and Gallery handlers (placeholders)
  const handleDownloadPDF = useCallback(() => {
    // Implementation would depend on the specific PDF handling logic
    logger.debug('📄 Downloading PDF...');
  }, []);

  const handleViewGallery = useCallback(() => {
    // Implementation would depend on the specific gallery logic
    logger.debug('🖼️ Opening gallery...');
    galleryOpenRef.current = true;
  }, []);

  return {
    // Protocol state
    protocols,
    setProtocols,
    loadingProtocols,
    setLoadingProtocols,

    // Protocol status state
    protocolStatusMap,
    setProtocolStatusMap,
    isLoadingProtocolStatus,
    setIsLoadingProtocolStatus,
    protocolStatusLoaded,
    setProtocolStatusLoaded,

    // Dialog states
    openHandoverDialog,
    setOpenHandoverDialog,
    openReturnDialog,
    setOpenReturnDialog,
    selectedRentalForProtocol,
    setSelectedRentalForProtocol,
    openProtocolMenu,
    setOpenProtocolMenu,
    selectedProtocolType,
    setSelectedProtocolType,

    // PDF viewer state
    pdfViewerOpen,
    setPdfViewerOpen,
    selectedPdf,
    setSelectedPdf,

    // Gallery state
    galleryOpenRef,
    galleryImages,
    setGalleryImages,
    galleryVideos,
    setGalleryVideos,
    galleryTitle,
    setGalleryTitle,

    // Image parsing cache
    imageParsingCache,

    // Protocol handlers
    loadProtocolsForRental,
    loadProtocolStatusInBackground,
    preloadTopProtocols,
    handleCreateHandover,
    handleCreateReturn,
    handleCloseHandoverDialog,
    handleCloseReturnDialog,
    handleClosePDF,
    handleCloseGallery,
    handleCloseProtocolMenu,
    handleDownloadPDF,
    handleViewGallery,

    // Callback
    onProtocolUpdate: onProtocolUpdate ?? (() => {}),
  };
};
