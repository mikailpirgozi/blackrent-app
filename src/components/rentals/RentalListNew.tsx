import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Card,
  CardContent,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Divider,
  Switch,
  FormGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Assignment as HandoverIcon,
  AssignmentReturn as ReturnIcon,
  PictureAsPdf as PDFIcon,
  PhotoLibrary as GalleryIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ViewComfy as ViewComfyIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Payment as PaymentIcon,
  CheckCircleOutline as CheckIcon,
  Cancel as CancelIcon,
  Euro as EuroIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import ResponsiveTable, { ResponsiveTableColumn } from '../common/ResponsiveTable';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Rental } from '../../types';
import { apiService } from '../../services/api';
import RentalForm from './RentalForm';
import HandoverProtocolForm from '../protocols/HandoverProtocolForm';
import ReturnProtocolForm from '../protocols/ReturnProtocolForm';
import PDFViewer from '../common/PDFViewer';
import ImageGalleryModal from '../common/ImageGalleryModal';
import RentalAdvancedFilters, { FilterState } from './RentalAdvancedFilters';
import RentalViewToggle, { ViewMode } from './RentalViewToggle';
import RentalCardView, { CardViewMode } from './RentalCardView';

export default function RentalList() {
  const { state, createRental, updateRental, deleteRental } = useApp();
  const { state: authState } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [protocols, setProtocols] = useState<Record<string, { handover?: any; return?: any }>>({});
  const [loadingProtocols, setLoadingProtocols] = useState<string[]>([]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [cardViewMode, setCardViewMode] = useState<CardViewMode>('compact');
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    // Základné filtre
    status: 'all',
    paymentMethod: 'all',
    company: 'all',
    dateFrom: '',
    dateTo: '',
    priceMin: '',
    priceMax: '',
    protocolStatus: 'all',
    
    // Rozšírené filtre
    customerName: '',
    vehicleBrand: 'all',
    vehicleModel: '',
    licensePlate: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    insuranceCompany: 'all',
    insuranceType: 'all',
    
    // Časové filtre
    timeFilter: 'all',
    
    // Cenové filtre
    priceRange: 'all',
    
    // Stav platby
    paymentStatus: 'all',
    
    // Zobrazenie
    showOnlyActive: false,
    showOnlyOverdue: false,
    showOnlyCompleted: false
  });
  
  // Show advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    vehicle: true,
    company: true,
    customer: true,
    dates: true,
    price: true,
    commission: true,
    payment: true,
    paid: true,
    status: true,
    protocols: true
  });
  
  // Protocol dialogs
  const [openHandoverDialog, setOpenHandoverDialog] = useState(false);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [selectedRentalForProtocol, setSelectedRentalForProtocol] = useState<Rental | null>(null);
  
  // PDF viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string; type: 'handover' | 'return' } | null>(null);
  
  // Image gallery
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedProtocolImages, setSelectedProtocolImages] = useState<any[]>([]);
  const [selectedProtocolVideos, setSelectedProtocolVideos] = useState<any[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');

  // Optimalizovaná funkcia pre načítanie protokolov na požiadanie
  const loadProtocolsForRental = useCallback(async (rentalId: string) => {
    // Kontrola či už načítavame
    if (loadingProtocols.includes(rentalId)) return;
    
    // Kontrola či už máme dáta
    if (protocols[rentalId]) {
      console.log('✅ Protokoly už načítané pre:', rentalId);
      return;
    }
    
    console.log('🔍 Načítavam protokoly pre:', rentalId);
    setLoadingProtocols(prev => [...prev, rentalId]);
    
    try {
      const data = await apiService.getProtocolsByRental(rentalId);
      
      setProtocols(prev => ({
        ...prev,
        [rentalId]: {
          handover: data?.handoverProtocols?.[0] || undefined,
          return: data?.returnProtocols?.[0] || undefined,
        }
      }));
    } catch (error) {
      console.error('❌ Chyba pri načítaní protokolov:', error);
    } finally {
      setLoadingProtocols(prev => prev.filter(id => id !== rentalId));
    }
  }, [protocols, loadingProtocols]);

  // Funkcia pre zobrazenie protokolov na požiadanie
  const handleViewProtocols = async (rental: Rental) => {
    // Ak už sú protokoly načítané, nechaj ich zobrazené
    if (protocols[rental.id]) {
      return;
    }
    
    console.log('🔍 Načítavam protokoly pre prenájom:', rental.id);
    await loadProtocolsForRental(rental.id);
  };

  // Funkcia pre skrytie protokolov
  const handleHideProtocols = (rentalId: string) => {
    setProtocols(prev => {
      const newProtocols = { ...prev };
      delete newProtocols[rentalId];
      return newProtocols;
    });
  };

  // 🚀 PERFORMANCE OPTIMIZATION: Memoized protocol status
  const getProtocolStatus = useMemo(() => {
    return (rentalId: string) => {
      const rentalProtocols = protocols[rentalId];
      if (!rentalProtocols) return 'none';
      
      const hasHandover = !!rentalProtocols.handover;
      const hasReturn = !!rentalProtocols.return;
      
      if (hasReturn) return 'completed';
      if (hasHandover) return 'handover-only';
      return 'none';
    };
  }, [protocols]);

  // Funkcia pre zobrazenie stavu protokolov
  const renderProtocolStatus = (rentalId: string) => {
    const status = getProtocolStatus(rentalId);
    
    switch (status) {
      case 'completed':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Dokončené"
            color="success"
            size="small"
            variant="outlined"
          />
        );
      case 'handover-only':
        return (
          <Chip
            icon={<PendingIcon />}
            label="Čaká na vrátenie"
            color="warning"
            size="small"
            variant="outlined"
          />
        );
      case 'none':
        return (
          <Chip
            icon={<ErrorIcon />}
            label="Bez protokolu"
            color="error"
            size="small"
            variant="outlined"
          />
        );
      default:
        return null;
    }
  };

  const handleAdd = () => {
    setEditingRental(null);
    setOpenDialog(true);
  };

  const handleEdit = (rental: Rental) => {
    setEditingRental(rental);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať tento prenájom?')) {
      try {
        await deleteRental(id);
        console.log('Prenájom úspešne vymazaný');
      } catch (error) {
        console.error('Chyba pri mazaní prenájmu:', error);
        alert('Chyba pri mazaní prenájmu. Skúste to znovu.');
      }
    }
  };

  const handleSave = async (rental: Rental) => {
    try {
      if (editingRental) {
        await updateRental(rental);
        alert('Prenájom bol úspešne aktualizovaný!');
      } else {
        await createRental(rental);
        alert('Prenájom bol úspešne pridaný!');
      }
      setOpenDialog(false);
      setEditingRental(null);
    } catch (error) {
      console.error('Chyba pri ukladaní prenájmu:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
      alert(`Chyba pri ukladaní prenájmu: ${errorMessage}`);
    }
  };

  // Handover Protocol handlers
  const handleCreateHandover = (rental: Rental) => {
    setSelectedRentalForProtocol(rental);
    setOpenHandoverDialog(true);
  };

  const handleSaveHandover = async (protocolData: any) => {
    try {
      // Debug log
      console.log('handleSaveHandover - protocolData:', protocolData);
      const data = await apiService.createHandoverProtocol(protocolData);
      console.log('Handover protocol created:', data);
      
      // ✅ VYČISTI CACHE A ZNOVU NAČÍTAJ PROTOKOLY
      setProtocols(prev => {
        const newProtocols = { ...prev };
        delete newProtocols[protocolData.rentalId];
        return newProtocols;
      });
      await loadProtocolsForRental(protocolData.rentalId);
      
      alert('Prevzatie vozidla úspešne dokončené!');
      setOpenHandoverDialog(false);
      setSelectedRentalForProtocol(null);
    } catch (error) {
      console.error('Chyba pri ukladaní handover protokolu:', error);
      alert('Chyba pri ukladaní protokolu. Skúste to znovu.');
    }
  };

  // Return Protocol handlers
  const handleCreateReturn = (rental: Rental) => {
    const rentalProtocols = protocols[rental.id];
    if (!rentalProtocols?.handover) {
      alert('Najprv musíte vytvoriť protokol prevzatia vozidla!');
      return;
    }
    
    setSelectedRentalForProtocol(rental);
    setOpenReturnDialog(true);
  };

  const handleSaveReturn = async (protocolData: any) => {
    try {
      const data = await apiService.createReturnProtocol(protocolData);
      console.log('Return protocol created:', data);
      
      // ✅ VYČISTI CACHE A ZNOVU NAČÍTAJ PROTOKOLY
      setProtocols(prev => {
        const newProtocols = { ...prev };
        delete newProtocols[protocolData.rentalId];
        return newProtocols;
      });
      await loadProtocolsForRental(protocolData.rentalId);
      
      alert('Vrátenie vozidla úspešne dokončené!');
      setOpenReturnDialog(false);
      setSelectedRentalForProtocol(null);
    } catch (error) {
      console.error('Chyba pri ukladaní return protokolu:', error);
      alert('Chyba pri ukladaní protokolu. Skúste to znovu.');
    }
  };

  const handleViewPDF = (protocolId: string, type: 'handover' | 'return', title: string) => {
    setSelectedPdf({ url: protocolId, title, type });
    setPdfViewerOpen(true);
  };

  const handleClosePDF = () => {
    setPdfViewerOpen(false);
    setSelectedPdf(null);
  };

  // Image gallery handlers
  const handleOpenGallery = (rental: Rental, protocolType: 'handover' | 'return') => {
    const protocol = protocols[rental.id]?.[protocolType];
    if (!protocol) {
      alert('Protokol nebol nájdený!');
      return;
    }

    console.log('🔍 Opening gallery for protocol:', protocol);
    console.log('🔍 Protocol media:', {
      vehicleImages: protocol.vehicleImages?.length || 0,
      vehicleVideos: protocol.vehicleVideos?.length || 0,
      documentImages: protocol.documentImages?.length || 0,
      damageImages: protocol.damageImages?.length || 0
    });

    // Zber všetkých obrázkov z protokolu
    const allImages: any[] = [];
    const allVideos: any[] = [];
    
    // Vehicle images
    if (protocol.vehicleImages && protocol.vehicleImages.length > 0) {
      allImages.push(...protocol.vehicleImages.map((img: any) => ({
        ...img,
        type: 'vehicle'
      })));
    }
    
    // Vehicle videos
    if (protocol.vehicleVideos && protocol.vehicleVideos.length > 0) {
      allVideos.push(...protocol.vehicleVideos.map((video: any) => ({
        ...video,
        type: 'vehicle'
      })));
    }
    
    // Document images
    if (protocol.documentImages && protocol.documentImages.length > 0) {
      allImages.push(...protocol.documentImages.map((img: any) => ({
        ...img,
        type: 'document'
      })));
    }
    
    // Damage images
    if (protocol.damageImages && protocol.damageImages.length > 0) {
      allImages.push(...protocol.damageImages.map((img: any) => ({
        ...img,
        type: 'damage'
      })));
    }

    console.log('🔍 Collected media:', { allImages: allImages.length, allVideos: allVideos.length });

    if (allImages.length === 0 && allVideos.length === 0) {
      alert('Protokol neobsahuje žiadne médiá!');
      return;
    }

    setSelectedProtocolImages(allImages);
    setSelectedProtocolVideos(allVideos);
    setGalleryTitle(`${protocolType === 'handover' ? 'Prevzatie' : 'Vrátenie'} vozidla - ${rental.customerName}`);
    setGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setGalleryOpen(false);
    setSelectedProtocolImages([]);
    setSelectedProtocolVideos([]);
    setGalleryTitle('');
  };

  const handleDeleteProtocol = async (rentalId: string, type: 'handover' | 'return') => {
    if (!window.confirm(`Naozaj chcete vymazať protokol ${type === 'handover' ? 'prevzatia' : 'vrátenia'}?`)) {
      return;
    }

    try {
      const protocol = protocols[rentalId]?.[type];
      if (!protocol?.id) {
        alert('Protokol sa nenašiel!');
        return;
      }

      // Vymazanie protokolu cez API
      await apiService.deleteProtocol(protocol.id, type);
      
      console.log(`Protokol ${type} pre prenájom ${rentalId} bol vymazaný`);
      
      // ✅ VYČISTI CACHE A ZNOVU NAČÍTAJ PROTOKOLY
      setProtocols(prev => {
        const newProtocols = { ...prev };
        delete newProtocols[rentalId];
        return newProtocols;
      });
      await loadProtocolsForRental(rentalId);
    } catch (error) {
      console.error('Chyba pri mazaní protokolu:', error);
      alert('Chyba pri mazaní protokolu. Skúste to znovu.');
    }
  };

  // Column definitions for ResponsiveTable
  const columns: ResponsiveTableColumn[] = useMemo(() => [
    {
      id: 'vehicle',
      label: 'Vozidlo',
      width: { xs: '120px', md: '150px' },
      render: (value, rental: Rental) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {rental.vehicle?.licensePlate || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'customerName',
      label: 'Zákazník',
      width: { xs: '100px', md: '130px' }
    },
    {
      id: 'startDate',
      label: 'Od',
      width: { xs: '80px', md: '100px' },
      render: (value) => {
        const date = value instanceof Date ? value : new Date(value);
        return !isNaN(date.getTime()) ? format(date, 'dd.MM.yyyy', { locale: sk }) : 'N/A';
      }
    },
    {
      id: 'endDate',
      label: 'Do',
      width: { xs: '80px', md: '100px' },
      render: (value) => {
        const date = value instanceof Date ? value : new Date(value);
        return !isNaN(date.getTime()) ? format(date, 'dd.MM.yyyy', { locale: sk }) : 'N/A';
      }
    },
    {
      id: 'totalPrice',
      label: 'Cena (€)',
      width: { xs: '80px', md: '100px' },
      render: (value) => (
        <Typography variant="body2" fontWeight="bold">
          {typeof value === 'number' ? value.toFixed(2) : '0.00'} €
        </Typography>
      )
    },
    {
      id: 'protocols',
      label: 'Protokoly',
      width: { xs: '120px', md: '150px' },
      render: (value, rental: Rental) => (
        <Box>
          {/* Hlavné tlačidlá pre vytvorenie protokolov */}
          <Box sx={{ display: 'flex', gap: 0.5, mb: 1, justifyContent: 'center' }}>
            <Tooltip title="Prevzatie vozidla">
              <IconButton
                size="small"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleCreateHandover(rental); 
                }}
                color="primary"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: 32,
                  height: 32
                }}
              >
                <HandoverIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Vrátenie vozidla">
              <IconButton
                size="small"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleCreateReturn(rental); 
                }}
                color="primary"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: 32,
                  height: 32
                }}
              >
                <ReturnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Stav protokolov - kompaktný */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {/* Handover protokol */}
            {protocols[rental.id]?.handover ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                p: 0.5,
                bgcolor: 'success.light',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'success.main'
              }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                  Prevzatie
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.25, ml: 'auto' }}>
                  <Tooltip title="Stiahnuť PDF">
                    <IconButton
                      size="small"
                      component="a"
                      href={protocols[rental.id]?.handover?.pdfUrl}
                      target="_blank"
                      download
                      sx={{ 
                        width: 24, 
                        height: 24,
                        color: 'success.main',
                        '&:hover': { bgcolor: 'success.light' }
                      }}
                    >
                      <PDFIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Galerie obrázkov">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGallery(rental, 'handover');
                      }}
                      sx={{ 
                        width: 24, 
                        height: 24,
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'primary.light' }
                      }}
                    >
                      <GalleryIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Vymazať protokol">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProtocol(rental.id, 'handover');
                      }}
                      sx={{ 
                        width: 24, 
                        height: 24,
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.light' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                p: 0.5,
                bgcolor: 'grey.100',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300'
              }}>
                <ErrorIcon color="disabled" fontSize="small" />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  Bez prevzatia
                </Typography>
                <Tooltip title="Zobraziť protokoly">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProtocols(rental);
                    }}
                    disabled={loadingProtocols.includes(rental.id)}
                    sx={{ 
                      width: 24, 
                      height: 24,
                      ml: 'auto',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'primary.light' }
                    }}
                  >
                    <VisibilityIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* Return protokol */}
            {protocols[rental.id]?.return ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                p: 0.5,
                bgcolor: 'success.light',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'success.main'
              }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                  Vrátenie
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.25, ml: 'auto' }}>
                  <Tooltip title="Stiahnuť PDF">
                    <IconButton
                      size="small"
                      component="a"
                      href={protocols[rental.id]?.return?.pdfUrl}
                      target="_blank"
                      download
                      sx={{ 
                        width: 24, 
                        height: 24,
                        color: 'success.main',
                        '&:hover': { bgcolor: 'success.light' }
                      }}
                    >
                      <PDFIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Galerie obrázkov">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGallery(rental, 'return');
                      }}
                      sx={{ 
                        width: 24, 
                        height: 24,
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'primary.light' }
                      }}
                    >
                      <GalleryIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Vymazať protokol">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProtocol(rental.id, 'return');
                      }}
                      sx={{ 
                        width: 24, 
                        height: 24,
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.light' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ) : protocols[rental.id]?.handover ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                p: 0.5,
                bgcolor: 'warning.light',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'warning.main'
              }}>
                <PendingIcon color="warning" fontSize="small" />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                  Čaká na vrátenie
                </Typography>
                <Tooltip title="Zobraziť protokoly">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProtocols(rental);
                    }}
                    disabled={loadingProtocols.includes(rental.id)}
                    sx={{ 
                      width: 24, 
                      height: 24,
                      ml: 'auto',
                      color: 'warning.main',
                      '&:hover': { bgcolor: 'warning.light' }
                    }}
                  >
                    <VisibilityIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                p: 0.5,
                bgcolor: 'grey.100',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300'
              }}>
                <ErrorIcon color="disabled" fontSize="small" />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  Bez vrátenia
                </Typography>
                <Tooltip title="Zobraziť protokoly">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProtocols(rental);
                    }}
                    disabled={loadingProtocols.includes(rental.id)}
                    sx={{ 
                      width: 24, 
                      height: 24,
                      ml: 'auto',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'primary.light' }
                    }}
                  >
                    <VisibilityIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Loading indikátor */}
          {loadingProtocols.includes(rental.id) && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              mt: 0.5,
              p: 0.5,
              bgcolor: 'info.light',
              borderRadius: 1
            }}>
              <CircularProgress size={12} />
              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                Načítavam...
              </Typography>
            </Box>
          )}

          {/* Tlačidlo na skrytie protokolov ak sú zobrazené */}
          {protocols[rental.id] && (
            <Box sx={{ mt: 0.5, textAlign: 'center' }}>
              <Button
                size="small"
                variant="text"
                onClick={(e) => {
                  e.stopPropagation();
                  handleHideProtocols(rental.id);
                }}
                sx={{ 
                  fontSize: '0.65rem',
                  minWidth: 'auto',
                  p: 0.25,
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                Skryť
              </Button>
            </Box>
          )}
        </Box>
      )
    },
    {
      id: 'actions',
      label: 'Akcie',
      width: { xs: '120px', md: '150px' },
      render: (value, rental: Rental) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={e => { e.stopPropagation(); handleEdit(rental); }}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={e => { e.stopPropagation(); handleDelete(rental.id); }}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      )
    }
  ], [protocols, loadingProtocols]);

  const rentals = state.rentals || [];
  
  // Get unique values for filter dropdowns
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(rentals.map(rental => rental.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [rentals]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set(rentals.map(rental => rental.vehicle?.company).filter(Boolean));
    return Array.from(companies).sort();
  }, [rentals]);

  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set(rentals.map(rental => rental.paymentMethod).filter(Boolean));
    return Array.from(methods).sort();
  }, [rentals]);

  const uniqueVehicleBrands = useMemo(() => {
    const brands = new Set(rentals.map(rental => rental.vehicle?.brand).filter(Boolean));
    return Array.from(brands).sort();
  }, [rentals]);

  const uniqueInsuranceCompanies = useMemo(() => {
    const companies = new Set(rentals.map(rental => rental.insurance?.company).filter(Boolean));
    return Array.from(companies).sort();
  }, [rentals]);

  const uniqueInsuranceTypes = useMemo(() => {
    const types = new Set(rentals.map(rental => rental.insurance?.type).filter(Boolean));
    return Array.from(types).sort();
  }, [rentals]);
  
  // Reset all filters function
  const resetAllFilters = () => {
    setSearchQuery('');
    setAdvancedFilters({
      // Základné filtre
      status: 'all',
      paymentMethod: 'all',
      company: 'all',
      dateFrom: '',
      dateTo: '',
      priceMin: '',
      priceMax: '',
      protocolStatus: 'all',
      
      // Rozšírené filtre
      customerName: '',
      vehicleBrand: 'all',
      vehicleModel: '',
      licensePlate: '',
      customerEmail: '',
      customerPhone: '',
      customerCompany: '',
      insuranceCompany: 'all',
      insuranceType: 'all',
      
      // Časové filtre
      timeFilter: 'all',
      
      // Cenové filtre
      priceRange: 'all',
      
      // Stav platby
      paymentStatus: 'all',
      
      // Zobrazenie
      showOnlyActive: false,
      showOnlyOverdue: false,
      showOnlyCompleted: false
    });
  };

  // Handle advanced filters change
  const handleAdvancedFiltersChange = (newFilters: FilterState) => {
    setAdvancedFilters(newFilters);
  };

  // Save filter preset
  const handleSaveFilterPreset = () => {
    // TODO: Implement preset saving
    console.log('💾 Ukladám filter preset:', advancedFilters);
  };
  
  // Filter rentals based on all filters
  const filteredRentals = useMemo(() => {
    let filtered = rentals;
    
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rental => 
        rental.customerName?.toLowerCase().includes(query) ||
        rental.vehicle?.brand?.toLowerCase().includes(query) ||
        rental.vehicle?.model?.toLowerCase().includes(query) ||
        rental.vehicle?.licensePlate?.toLowerCase().includes(query) ||
        rental.vehicle?.company?.toLowerCase().includes(query)
      );
    }
    
    // Advanced filters
    const filters = advancedFilters;
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(rental => rental.status === filters.status);
    }
    
    // Payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(rental => rental.paymentMethod === filters.paymentMethod);
    }
    
    // Company filter
    if (filters.company !== 'all') {
      filtered = filtered.filter(rental => rental.vehicle?.company === filters.company);
    }
    
    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(rental => new Date(rental.startDate) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(rental => new Date(rental.endDate) <= toDate);
    }
    
    // Price range filter
    if (filters.priceMin) {
      const minPrice = parseFloat(filters.priceMin);
      filtered = filtered.filter(rental => rental.totalPrice >= minPrice);
    }
    
    if (filters.priceMax) {
      const maxPrice = parseFloat(filters.priceMax);
      filtered = filtered.filter(rental => rental.totalPrice <= maxPrice);
    }
    
    // Protocol status filter
    if (filters.protocolStatus !== 'all') {
      filtered = filtered.filter(rental => {
        const rentalProtocols = protocols[rental.id];
        if (!rentalProtocols) return filters.protocolStatus === 'none';
        
        const hasHandover = !!rentalProtocols.handover;
        const hasReturn = !!rentalProtocols.return;
        
        switch (filters.protocolStatus) {
          case 'none': return !hasHandover && !hasReturn;
          case 'handover': return hasHandover && !hasReturn;
          case 'return': return !hasHandover && hasReturn;
          case 'both': return hasHandover && hasReturn;
          default: return true;
        }
      });
    }

    // Customer name filter
    if (filters.customerName) {
      filtered = filtered.filter(rental => 
        rental.customerName?.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }

    // Vehicle brand filter
    if (filters.vehicleBrand !== 'all') {
      filtered = filtered.filter(rental => rental.vehicle?.brand === filters.vehicleBrand);
    }

    // Vehicle model filter
    if (filters.vehicleModel) {
      filtered = filtered.filter(rental => 
        rental.vehicle?.model?.toLowerCase().includes(filters.vehicleModel.toLowerCase())
      );
    }

    // License plate filter
    if (filters.licensePlate) {
      filtered = filtered.filter(rental => 
        rental.vehicle?.licensePlate?.toLowerCase().includes(filters.licensePlate.toLowerCase())
      );
    }

    // Customer email filter
    if (filters.customerEmail) {
      filtered = filtered.filter(rental => 
        rental.customerEmail?.toLowerCase().includes(filters.customerEmail.toLowerCase())
      );
    }

    // Customer phone filter
    if (filters.customerPhone) {
      filtered = filtered.filter(rental => 
        rental.customerPhone?.includes(filters.customerPhone)
      );
    }

    // Customer company filter
    if (filters.customerCompany) {
      filtered = filtered.filter(rental => 
        rental.customerCompany?.toLowerCase().includes(filters.customerCompany.toLowerCase())
      );
    }

    // Insurance company filter
    if (filters.insuranceCompany !== 'all') {
      filtered = filtered.filter(rental => rental.insurance?.company === filters.insuranceCompany);
    }

    // Insurance type filter
    if (filters.insuranceType !== 'all') {
      filtered = filtered.filter(rental => rental.insurance?.type === filters.insuranceType);
    }

    // Payment status filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(rental => {
        switch (filters.paymentStatus) {
          case 'paid': return rental.paid === true;
          case 'unpaid': return rental.paid === false;
          case 'partial': return rental.paid === null || rental.paid === undefined;
          default: return true;
        }
      });
    }

    // Show only active rentals
    if (filters.showOnlyActive) {
      filtered = filtered.filter(rental => {
        const now = new Date();
        const startDate = new Date(rental.startDate);
        const endDate = new Date(rental.endDate);
        return now >= startDate && now <= endDate;
      });
    }

    // Show only overdue rentals
    if (filters.showOnlyOverdue) {
      filtered = filtered.filter(rental => {
        const now = new Date();
        const endDate = new Date(rental.endDate);
        return now > endDate;
      });
    }

    // Show only completed rentals
    if (filters.showOnlyCompleted) {
      filtered = filtered.filter(rental => {
        const now = new Date();
        const endDate = new Date(rental.endDate);
        return now > endDate;
      });
    }
    
    return filtered;
  }, [rentals, searchQuery, advancedFilters, protocols]);
  
  // Get unique values for filters
  const uniqueCompanies = useMemo(() => {
    const companies = new Set(rentals.map(rental => rental.vehicle?.company).filter(Boolean));
    return Array.from(companies).sort();
  }, [rentals]);
  
  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set(rentals.map(rental => rental.paymentMethod).filter(Boolean));
    return Array.from(methods).sort();
  }, [rentals]);
  
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(rentals.map(rental => rental.status).filter(Boolean));
    return Array.from(statuses).sort();
  }, [rentals]);
  
  // Card renderer for mobile/card view
  const renderRentalCard = useCallback((rental: Rental, index: number) => {
    const hasHandover = !!protocols[rental.id]?.handover;
    const hasReturn = !!protocols[rental.id]?.return;
    const isActive = rental.status === 'active';
    const isFinished = rental.status === 'finished';
    
    return (
      <Card 
        key={rental.id} 
        sx={{ 
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: isActive ? '2px solid #4caf50' : '1px solid rgba(0,0,0,0.12)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            borderColor: isActive ? '#4caf50' : 'primary.main'
          },
          position: 'relative',
          overflow: 'visible'
        }} 
        onClick={() => handleEdit(rental)}
      >
        {/* Status indicator */}
        <Box sx={{
          position: 'absolute',
          top: -8,
          right: 16,
          zIndex: 1
        }}>
          <Chip 
            label={rental.status} 
            color={isActive ? 'success' : isFinished ? 'default' : 'warning'}
            size="small"
            sx={{ 
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
        </Box>

        {/* Protocol status indicator */}
        <Box sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 1
        }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {hasHandover && (
              <Chip
                icon={<HandoverIcon />}
                label=""
                color="success"
                size="small"
                sx={{ 
                  minWidth: 32,
                  height: 24,
                  '& .MuiChip-icon': { fontSize: 16 }
                }}
              />
            )}
            {hasReturn && (
              <Chip
                icon={<ReturnIcon />}
                label=""
                color="primary"
                size="small"
                sx={{ 
                  minWidth: 32,
                  height: 24,
                  '& .MuiChip-icon': { fontSize: 16 }
                }}
              />
            )}
          </Box>
        </Box>

        <CardContent sx={{ p: 3, pt: 4 }}>
          {/* Vehicle info */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CarIcon color="primary" fontSize="small" />
              <Typography variant="h6" fontWeight="bold" color="primary">
                {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
              {rental.vehicle?.licensePlate || 'N/A'}
            </Typography>
          </Box>
          
          {/* Customer and company */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="body1" fontWeight="medium">
                {rental.customerName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {rental.vehicle?.company || 'N/A'}
              </Typography>
            </Box>
          </Box>
          
          {/* Dates */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ScheduleIcon color="action" fontSize="small" />
              <Typography variant="body2" fontWeight="medium">
                Obdobie prenájmu
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, ml: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Od</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {format(new Date(rental.startDate), 'dd.MM.yyyy')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Do</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {format(new Date(rental.endDate), 'dd.MM.yyyy')}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Price and payment */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1
          }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Celková cena</Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {typeof rental.totalPrice === 'number' ? rental.totalPrice.toFixed(2) : '0.00'} €
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">Spôsob platby</Typography>
              <Typography variant="body2" fontWeight="medium">
                {rental.paymentMethod}
              </Typography>
            </Box>
          </Box>
          
          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Prevzatie vozidla">
                <IconButton
                  size="small"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleCreateHandover(rental); 
                  }}
                  color={hasHandover ? "success" : "primary"}
                  sx={{ 
                    bgcolor: hasHandover ? 'success.main' : 'primary.main',
                    color: 'white',
                    '&:hover': { 
                      bgcolor: hasHandover ? 'success.dark' : 'primary.dark',
                      transform: 'scale(1.1)'
                    },
                    width: 36,
                    height: 36,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <HandoverIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Vrátenie vozidla">
                <IconButton
                  size="small"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleCreateReturn(rental); 
                  }}
                  color={hasReturn ? "success" : "primary"}
                  sx={{ 
                    bgcolor: hasReturn ? 'success.main' : 'primary.main',
                    color: 'white',
                    '&:hover': { 
                      bgcolor: hasReturn ? 'success.dark' : 'primary.dark',
                      transform: 'scale(1.1)'
                    },
                    width: 36,
                    height: 36,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ReturnIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Upraviť prenájom">
                <IconButton
                  size="small"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleEdit(rental); 
                  }}
                  sx={{ 
                    bgcolor: 'action.hover',
                    '&:hover': { 
                      bgcolor: 'action.selected',
                      transform: 'scale(1.1)'
                    },
                    width: 36,
                    height: 36,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Vymazať prenájom">
                <IconButton
                  size="small"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleDelete(rental.id); 
                  }}
                  sx={{ 
                    bgcolor: 'error.light',
                    color: 'white',
                    '&:hover': { 
                      bgcolor: 'error.main',
                      transform: 'scale(1.1)'
                    },
                    width: 36,
                    height: 36,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }, [handleEdit, handleCreateHandover, handleCreateReturn, handleDelete, protocols]);

  return (
    <Box>
      {/* Enhanced Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                Prenájmy
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Správa a prehľad všetkých prenájmov vozidiel
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right', mr: 2 }}>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {filteredRentals.length}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      zobrazených
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="success.light">
                      {filteredRentals.filter(r => r.status === 'active').length}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      aktívnych
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="warning.light">
                      {filteredRentals.filter(r => protocols[r.id]?.handover && !protocols[r.id]?.return).length}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      čakajú na vrátenie
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.3s ease',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2
                }}
              >
                {isMobile ? 'Pridať' : 'Nový prenájom'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Moderné vyhľadávanie a filtre */}
      <Card sx={{ 
        mb: 3, 
        backgroundColor: 'background.paper',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)'
      }}>
        <CardContent sx={{ p: 3 }}>
          {/* Hlavný riadok s vyhľadávaním a tlačidlami */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            {/* Search Input */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 250 }}>
              <TextField
                placeholder="Hľadať prenájmy..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'background.default',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>
                      <SearchIcon fontSize="small" />
                    </Box>
                  )
                }}
              />
            </Box>

            {/* View Mode Toggle */}
            <RentalViewToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalCount={rentals.length}
              filteredCount={filteredRentals.length}
              showCounts={true}
            />

            {/* Filter Button */}
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                transition: 'all 0.3s ease',
                borderColor: showFilters ? 'primary.main' : 'rgba(0,0,0,0.23)',
                bgcolor: showFilters ? 'primary.main' : 'transparent',
                color: showFilters ? 'white' : 'inherit',
                '&:hover': {
                  bgcolor: showFilters ? 'primary.dark' : 'rgba(0,0,0,0.04)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              Základné filtre {showFilters ? '▼' : '▶'}
            </Button>

            {/* Advanced Filters Button */}
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                transition: 'all 0.3s ease',
                borderColor: showAdvancedFilters ? 'secondary.main' : 'rgba(0,0,0,0.23)',
                bgcolor: showAdvancedFilters ? 'secondary.main' : 'transparent',
                color: showAdvancedFilters ? 'white' : 'inherit',
                '&:hover': {
                  bgcolor: showAdvancedFilters ? 'secondary.dark' : 'rgba(0,0,0,0.04)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              Rozšírené filtre {showAdvancedFilters ? '▼' : '▶'}
            </Button>

            {/* Reset Button */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetAllFilters}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'white',
                  borderColor: 'error.main',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              Reset
            </Button>
          </Box>

          {/* Search results info */}
          {(searchQuery || advancedFilters.status !== 'all' || advancedFilters.paymentMethod !== 'all' || advancedFilters.company !== 'all' || advancedFilters.dateFrom || advancedFilters.dateTo || advancedFilters.priceMin || advancedFilters.priceMax || advancedFilters.protocolStatus !== 'all') && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Zobrazených: {filteredRentals.length} z {rentals.length} prenájmov
            </Typography>
          )}

          {/* Pokročilé filtre */}
          <Collapse in={showFilters}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              {/* Základné filtre */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterListIcon fontSize="small" />
                  Základné filtre
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Status */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Stav prenájmu</InputLabel>
                    <Select
                      value={advancedFilters.status}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, status: e.target.value })}
                      label="Stav prenájmu"
                    >
                      <MenuItem value="all">Všetky stavy</MenuItem>
                      {uniqueStatuses.map(status => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Payment Method */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Spôsob platby</InputLabel>
                    <Select
                      value={advancedFilters.paymentMethod}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, paymentMethod: e.target.value })}
                      label="Spôsob platby"
                    >
                      <MenuItem value="all">Všetky spôsoby</MenuItem>
                      {uniquePaymentMethods.map(method => (
                        <MenuItem key={method} value={method}>{method}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Company */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Firma</InputLabel>
                    <Select
                      value={advancedFilters.company}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, company: e.target.value })}
                      label="Firma"
                    >
                      <MenuItem value="all">Všetky firmy</MenuItem>
                      {uniqueCompanies.map(company => (
                        <MenuItem key={company} value={company}>{company}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Pokročilé filtre */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon fontSize="small" />
                  Pokročilé filtre
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Date Range */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="Od dátumu"
                      type="date"
                      size="small"
                      value={advancedFilters.dateFrom}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, dateFrom: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Do dátumu"
                      type="date"
                      size="small"
                      value={advancedFilters.dateTo}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, dateTo: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  {/* Price Range */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="Min. cena (€)"
                      type="number"
                      size="small"
                      value={advancedFilters.priceMin}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, priceMin: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Max. cena (€)"
                      type="number"
                      size="small"
                      value={advancedFilters.priceMax}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, priceMax: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  {/* Protocol Status */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Stav protokolov</InputLabel>
                    <Select
                      value={advancedFilters.protocolStatus}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, protocolStatus: e.target.value })}
                      label="Stav protokolov"
                    >
                      <MenuItem value="all">Všetky stavy</MenuItem>
                      <MenuItem value="none">Bez protokolov</MenuItem>
                      <MenuItem value="handover">Len preberací protokol</MenuItem>
                      <MenuItem value="return">Len vrátený protokol</MenuItem>
                      <MenuItem value="both">Kompletné protokoly</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>

              {/* Rozšírené filtre */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" />
                  Rozšírené filtre
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Customer Name */}
                  <TextField
                    label="Meno zákazníka"
                    size="small"
                    value={advancedFilters.customerName}
                    onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, customerName: e.target.value })}
                    sx={{ flex: 1 }}
                  />

                  {/* Vehicle Brand */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Značka vozidla</InputLabel>
                    <Select
                      value={advancedFilters.vehicleBrand}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, vehicleBrand: e.target.value })}
                      label="Značka vozidla"
                    >
                      <MenuItem value="all">Všetky značky</MenuItem>
                      {uniqueVehicleBrands.map(brand => (
                        <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Vehicle Model */}
                  <TextField
                    label="Model vozidla"
                    size="small"
                    value={advancedFilters.vehicleModel}
                    onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, vehicleModel: e.target.value })}
                    sx={{ flex: 1 }}
                  />

                  {/* License Plate */}
                  <TextField
                    label="Registrované číslo"
                    size="small"
                    value={advancedFilters.licensePlate}
                    onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, licensePlate: e.target.value })}
                    sx={{ flex: 1 }}
                  />

                  {/* Customer Email */}
                  <TextField
                    label="Email zákazníka"
                    size="small"
                    value={advancedFilters.customerEmail}
                    onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, customerEmail: e.target.value })}
                    sx={{ flex: 1 }}
                  />

                  {/* Customer Phone */}
                  <TextField
                    label="Telefón zákazníka"
                    size="small"
                    value={advancedFilters.customerPhone}
                    onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, customerPhone: e.target.value })}
                    sx={{ flex: 1 }}
                  />

                  {/* Customer Company */}
                  <TextField
                    label="Spoločnosť zákazníka"
                    size="small"
                    value={advancedFilters.customerCompany}
                    onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, customerCompany: e.target.value })}
                    sx={{ flex: 1 }}
                  />

                  {/* Insurance Company */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Spoločnosť poistenia</InputLabel>
                    <Select
                      value={advancedFilters.insuranceCompany}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, insuranceCompany: e.target.value })}
                      label="Spoločnosť poistenia"
                    >
                      <MenuItem value="all">Všetky spoločnosti</MenuItem>
                      {uniqueInsuranceCompanies.map(company => (
                        <MenuItem key={company} value={company}>{company}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Insurance Type */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Typ poistenia</InputLabel>
                    <Select
                      value={advancedFilters.insuranceType}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, insuranceType: e.target.value })}
                      label="Typ poistenia"
                    >
                      <MenuItem value="all">Všetky typy</MenuItem>
                      {uniqueInsuranceTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Payment Status */}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Stav platby</InputLabel>
                    <Select
                      value={advancedFilters.paymentStatus}
                      onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, paymentStatus: e.target.value })}
                      label="Stav platby"
                    >
                      <MenuItem value="all">Všetky stavy</MenuItem>
                      <MenuItem value="paid">Uhradené</MenuItem>
                      <MenuItem value="unpaid">Nezahradené</MenuItem>
                      <MenuItem value="partial">Čiastočne uhradené</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Show Only Active */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={advancedFilters.showOnlyActive}
                        onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, showOnlyActive: e.target.checked })}
                        size="small"
                      />
                    }
                    label="Použiť len aktívne prenájmy"
                  />

                  {/* Show Only Overdue */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={advancedFilters.showOnlyOverdue}
                        onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, showOnlyOverdue: e.target.checked })}
                        size="small"
                      />
                    }
                    label="Použiť len preverované prenájmy"
                  />

                  {/* Show Only Completed */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={advancedFilters.showOnlyCompleted}
                        onChange={(e) => handleAdvancedFiltersChange({ ...advancedFilters, showOnlyCompleted: e.target.checked })}
                        size="small"
                      />
                    }
                    label="Použiť len dokončené prenájmy"
                  />
                </Box>
              </Grid>

              {/* Zobrazenie stĺpcov */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewListIcon fontSize="small" />
                  Zobrazenie stĺpcov
                </Typography>
                
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visibleColumns.vehicle}
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, vehicle: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Vozidlo"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visibleColumns.company}
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, company: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Firma"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visibleColumns.customer}
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, customer: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Zákazník"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visibleColumns.dates}
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, dates: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Dátumy"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visibleColumns.price}
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, price: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Cena"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visibleColumns.commission}
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, commission: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Provízia"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visibleColumns.payment}
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, payment: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Platba"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visibleColumns.paid}
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, paid: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Uhradené"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visibleColumns.status}
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, status: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Stav"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visibleColumns.protocols}
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, protocols: e.target.checked }))}
                        size="small"
                      />
                    }
                    label="Protokoly"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </Collapse>

          {/* Rozšírené filtre */}
          <Collapse in={showAdvancedFilters}>
            <Box sx={{ mt: 2 }}>
              <RentalAdvancedFilters
                filters={advancedFilters}
                onFiltersChange={handleAdvancedFiltersChange}
                onReset={resetAllFilters}
                onSavePreset={handleSaveFilterPreset}
                availableStatuses={uniqueStatuses}
                availableCompanies={uniqueCompanies}
                availablePaymentMethods={uniquePaymentMethods}
                availableVehicleBrands={uniqueVehicleBrands}
                availableInsuranceCompanies={uniqueInsuranceCompanies}
                availableInsuranceTypes={uniqueInsuranceTypes}
              />
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Workflow Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Workflow protokolov:</strong> Najprv vytvorte protokol prevzatia vozidla (🔄), potom protokol vrátenia (↩️). Kliknite "Zobraziť protokoly" pre zobrazenie existujúcich protokolov.
        </Typography>
      </Alert>

      {/* Content based on view mode */}
      {viewMode === 'table' ? (
        <ResponsiveTable
          columns={columns}
          data={filteredRentals}
          selectable={true}
          selected={selected}
          onSelectionChange={setSelected}
          emptyMessage="Žiadne prenájmy"
          mobileCardRenderer={viewMode === 'compact' ? renderRentalCard : undefined}
        />
      ) : (
        <RentalCardView
          rentals={filteredRentals}
          viewMode={cardViewMode}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreateHandover={handleCreateHandover}
          onCreateReturn={handleCreateReturn}
          onViewPDF={handleViewPDF}
          onOpenGallery={handleOpenGallery}
          protocols={protocols}
          loadingProtocols={loadingProtocols}
        />
      )}

      {/* Rental Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRental ? 'Upraviť prenájom' : 'Nový prenájom'}
        </DialogTitle>
        <DialogContent>
          <RentalForm
            rental={editingRental}
            onSave={handleSave}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Handover Protocol Dialog */}
      <Dialog
        open={openHandoverDialog}
        onClose={() => setOpenHandoverDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Protokol prevzatia vozidla</DialogTitle>
        <DialogContent>
          {selectedRentalForProtocol && (
            <HandoverProtocolForm
              open={openHandoverDialog}
              rental={selectedRentalForProtocol}
              onSave={handleSaveHandover}
              onClose={() => setOpenHandoverDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Return Protocol Dialog */}
      <Dialog
        open={openReturnDialog}
        onClose={() => setOpenReturnDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Protokol vrátenia vozidla</DialogTitle>
        <DialogContent>
          {selectedRentalForProtocol && (
            <ReturnProtocolForm
              open={openReturnDialog}
              onClose={() => setOpenReturnDialog(false)}
              rental={selectedRentalForProtocol}
              handoverProtocol={protocols[selectedRentalForProtocol.id]?.handover}
              onSave={handleSaveReturn}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer */}
      {selectedPdf && (
        <PDFViewer
          open={pdfViewerOpen}
          onClose={handleClosePDF}
          protocolId={selectedPdf.url}
          protocolType={selectedPdf.type}
          title={selectedPdf.title}
        />
      )}

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        open={galleryOpen}
        onClose={handleCloseGallery}
        images={selectedProtocolImages}
        videos={selectedProtocolVideos}
        title={galleryTitle}
      />
    </Box>
  );
} 