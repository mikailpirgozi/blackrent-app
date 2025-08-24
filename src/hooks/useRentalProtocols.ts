import { useState, useCallback, useRef } from 'react';
import { Rental, ProtocolImage, ProtocolVideo } from '../types';
import { logger } from '../utils/logger';
import { apiService } from '../services/api';

interface UseRentalProtocolsProps {
  onProtocolUpdate?: (rentalId: string, protocolType: 'handover' | 'return', data: any) => void;
}

interface UseRentalProtocolsReturn {
  // Protocol state
  protocols: Record<string, { handover?: any; return?: any }>;
  setProtocols: (protocols: Record<string, { handover?: any; return?: any }>) => void;
  loadingProtocols: string[];
  setLoadingProtocols: (loading: string[]) => void;
  
  // Protocol status state
  protocolStatusMap: Record<string, {
    hasHandoverProtocol: boolean;
    hasReturnProtocol: boolean;
    handoverProtocolId?: string;
    returnProtocolId?: string;
  }>;
  setProtocolStatusMap: (statusMap: Record<string, {
    hasHandoverProtocol: boolean;
    hasReturnProtocol: boolean;
    handoverProtocolId?: string;
    returnProtocolId?: string;
  }>) => void;
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
  selectedPdf: { url: string; title: string; type: 'handover' | 'return' } | null;
  setSelectedPdf: (pdf: { url: string; title: string; type: 'handover' | 'return' } | null) => void;
  
  // Gallery state
  galleryOpenRef: React.MutableRefObject<boolean>;
  galleryImages: ProtocolImage[];
  setGalleryImages: (images: ProtocolImage[]) => void;
  galleryVideos: ProtocolVideo[];
  setGalleryVideos: (videos: ProtocolVideo[]) => void;
  galleryTitle: string;
  setGalleryTitle: (title: string) => void;
  
  // Image parsing cache
  imageParsingCache: Map<string, { images: any[]; videos: any[]; timestamp: number }>;
  
  // Protocol handlers
  loadProtocolsForRental: (rentalId: string) => Promise<any>;
  loadProtocolStatusInBackground: () => Promise<void>;
  handleCreateHandover: (rental: Rental) => Promise<void>;
  handleCreateReturn: (rental: Rental) => Promise<void>;
  handleCloseHandoverDialog: () => void;
  handleCloseReturnDialog: () => void;
  handleClosePDF: () => void;
  handleCloseGallery: () => void;
  handleCloseProtocolMenu: () => void;
  handleDownloadPDF: () => void;
  handleViewGallery: () => void;
}

export const useRentalProtocols = ({
  onProtocolUpdate
}: UseRentalProtocolsProps = {}): UseRentalProtocolsReturn => {
  
  // Protocol state
  const [protocols, setProtocols] = useState<Record<string, { handover?: any; return?: any }>>({});
  const [loadingProtocols, setLoadingProtocols] = useState<string[]>([]);
  
  // ⚡ BACKGROUND PROTOCOL LOADING STATE
  const [protocolStatusMap, setProtocolStatusMap] = useState<Record<string, {
    hasHandoverProtocol: boolean;
    hasReturnProtocol: boolean;
    handoverProtocolId?: string;
    returnProtocolId?: string;
  }>>({});
  const [isLoadingProtocolStatus, setIsLoadingProtocolStatus] = useState(false);
  const [protocolStatusLoaded, setProtocolStatusLoaded] = useState(false);
  
  // Protocol dialog states
  const [openHandoverDialog, setOpenHandoverDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedRentalForProtocol, setSelectedRentalForProtocol] = useState<Rental | null>(null);
  const [openProtocolMenu, setOpenProtocolMenu] = useState(false);
  const [selectedProtocolType, setSelectedProtocolType] = useState<'handover' | 'return' | null>(null);
  
  // PDF viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string; type: 'handover' | 'return' } | null>(null);
  
  // Image gallery - using useRef to survive re-renders
  const galleryOpenRef = useRef(false);
  const [galleryImages, setGalleryImages] = useState<ProtocolImage[]>([]);
  const [galleryVideos, setGalleryVideos] = useState<ProtocolVideo[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');

  // 💾 IMAGE PARSING CACHE - cache pre parsed images aby sa neparovali zakaždým
  const [imageParsingCache] = useState(new Map<string, {
    images: any[];
    videos: any[];
    timestamp: number;
  }>());

  // Optimalizovaná funkcia pre načítanie protokolov na požiadanie
  const loadProtocolsForRental = useCallback(async (rentalId: string) => {
    // Ak už sa načítavajú protokoly pre tento rental, počkaj
    if (loadingProtocols.includes(rentalId)) {
      return null;
    }
    
    logger.debug('Loading protocols for rental', { rentalId });
    setLoadingProtocols(prev => [...prev, rentalId]);
    
    try {
      const data = await apiService.getProtocolsByRental(rentalId);
      
      // ✅ NAJNOVŠÍ PROTOKOL: Zoradiť podľa createdAt a vziať najnovší
      const latestHandover = data?.handoverProtocols?.length > 0 
        ? data.handoverProtocols.sort((a: any, b: any) => 
            new Date(b.createdAt || b.completedAt || 0).getTime() - 
            new Date(a.createdAt || a.completedAt || 0).getTime()
          )[0] 
        : undefined;
        
      const latestReturn = data?.returnProtocols?.length > 0 
        ? data.returnProtocols.sort((a: any, b: any) => 
            new Date(b.createdAt || b.completedAt || 0).getTime() - 
            new Date(a.createdAt || a.completedAt || 0).getTime()
          )[0] 
        : undefined;
      
      logger.debug('Protocols API response', { 
        hasData: !!data, 
        handoverCount: data?.handoverProtocols?.length || 0,
        returnCount: data?.returnProtocols?.length || 0,
        rentalId 
      });
      
      const protocolData = {
        handover: latestHandover,
        return: latestReturn,
      };
      
      setProtocols(prev => ({
        ...prev,
        [rentalId]: protocolData
      }));
      
      // ⚡ RETURN načítané dáta pre okamžité použitie
      return protocolData;
    } catch (error) {
      logger.error('Failed to load protocols', { rentalId, error });
      return null;
    } finally {
      setLoadingProtocols(prev => prev.filter(id => id !== rentalId));
    }
  }, [loadingProtocols]);

  // ⚡ BACKGROUND PROTOCOL LOADING - načíta protocol status na pozadí bez spomalenia
  const loadProtocolStatusInBackground = useCallback(async () => {
    if (isLoadingProtocolStatus || protocolStatusLoaded) {
      return; // Už sa načítava alebo je načítané
    }

    console.log('🚀 BACKGROUND: Starting protocol status loading...');
    setIsLoadingProtocolStatus(true);
    
    try {
      const startTime = Date.now();
      const bulkProtocolStatus = await apiService.getBulkProtocolStatus();
      const loadTime = Date.now() - startTime;
      
      // Optimalized: Consolidated protocol status loading log
      console.log(`✅ Protocol status loaded: ${bulkProtocolStatus.length} rentals (${loadTime}ms)`);
      
      // Konvertuj array na map pre rýchly lookup
      const statusMap: Record<string, {
        hasHandoverProtocol: boolean;
        hasReturnProtocol: boolean;
        handoverProtocolId?: string;
        returnProtocolId?: string;
      }> = {};
      
      bulkProtocolStatus.forEach((item: any) => {
        statusMap[item.rentalId] = {
          hasHandoverProtocol: item.hasHandoverProtocol,
          hasReturnProtocol: item.hasReturnProtocol,
          handoverProtocolId: item.handoverProtocolId,
          returnProtocolId: item.returnProtocolId,
        };
      });
      
      setProtocolStatusMap(statusMap);
      setProtocolStatusLoaded(true);
      
    } catch (error) {
      console.error('❌ BACKGROUND: Failed to load protocol status:', error);
    } finally {
      setIsLoadingProtocolStatus(false);
    }
  }, [isLoadingProtocolStatus, protocolStatusLoaded]);

  // Handover Protocol handlers
  const handleCreateHandover = useCallback(async (rental: Rental) => {
    console.log('📝 Creating handover protocol for rental:', rental.id);
    
    try {
      // Načítaj protokoly ak nie sú načítané
      await loadProtocolsForRental(rental.id);
      
      setSelectedRentalForProtocol(rental);
      setSelectedProtocolType('handover');
      setOpenHandoverDialog(true);
      
      logger.info('Opening handover protocol dialog', { rentalId: rental.id });
      
    } catch (error) {
      logger.error('Failed to prepare handover protocol', { rentalId: rental.id, error });
    }
  }, [loadProtocolsForRental]);

  // Return Protocol handlers
  const handleCreateReturn = useCallback(async (rental: Rental) => {
    console.log('📝 Creating return protocol for rental:', rental.id);
    
    try {
      // Načítaj protokoly ak nie sú načítané
      await loadProtocolsForRental(rental.id);
      
      setSelectedRentalForProtocol(rental);
      setSelectedProtocolType('return');
      setOpenReturnDialog(true);
      
      logger.info('Opening return protocol dialog', { rentalId: rental.id });
      
    } catch (error) {
      logger.error('Failed to prepare return protocol', { rentalId: rental.id, error });
    }
  }, [loadProtocolsForRental]);

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
    console.log('📄 Downloading PDF...');
  }, []);

  const handleViewGallery = useCallback(() => {
    // Implementation would depend on the specific gallery logic
    console.log('🖼️ Opening gallery...');
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
    handleCreateHandover,
    handleCreateReturn,
    handleCloseHandoverDialog,
    handleCloseReturnDialog,
    handleClosePDF,
    handleCloseGallery,
    handleCloseProtocolMenu,
    handleDownloadPDF,
    handleViewGallery,
  };
};
