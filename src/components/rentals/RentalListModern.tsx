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
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Collapse,
  Fab,
  Badge,
  Avatar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  InputAdornment
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
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Sort as SortIcon,
  CalendarToday as CalendarIcon,
  LocalShipping as VehicleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Euro as EuroIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { format, isToday, isTomorrow, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Rental, Vehicle, PaymentMethod } from '../../types';
import { apiService } from '../../services/api';
import RentalForm from './RentalForm';
import HandoverProtocolForm from '../protocols/HandoverProtocolForm';
import ReturnProtocolForm from '../protocols/ReturnProtocolForm';
import PDFViewer from '../common/PDFViewer';
import ImageGalleryModal from '../common/ImageGalleryModal';

type ViewMode = 'cards' | 'list';
type SortBy = 'priority' | 'startDate' | 'endDate' | 'totalPrice' | 'customerName';

export default function RentalListModern() {
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
  
  // View and sort
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'cards' : 'cards');
  const [sortBy, setSortBy] = useState<SortBy>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaid, setFilterPaid] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  
  // Priority filters
  const [showActive, setShowActive] = useState(false);
  const [showTodayReturns, setShowTodayReturns] = useState(false);
  const [showTomorrowReturns, setShowTomorrowReturns] = useState(false);
  const [showUnconfirmed, setShowUnconfirmed] = useState(false);
  const [showFuture, setShowFuture] = useState(false);
  const [showOldConfirmed, setShowOldConfirmed] = useState(false);
  const [showConfirmed, setShowConfirmed] = useState(false);
  const [showAll, setShowAll] = useState(true);
  
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
    if (loadingProtocols.includes(rentalId)) return;
    
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

  // Helper functions
  const formatPrice = (price: number | string | undefined): string => {
    if (typeof price === 'number') return price.toFixed(2);
    if (typeof price === 'string') return parseFloat(price).toFixed(2);
    return '0.00';
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, 'dd.MM.yyyy', { locale: sk });
  };

  const getRentalPriority = (rental: Rental): number => {
    const today = startOfDay(new Date());
    const startDate = startOfDay(new Date(rental.startDate));
    const endDate = startOfDay(new Date(rental.endDate));
    
    // Aktívne prenájmy (dnes)
    if (isToday(startDate) || (isBefore(startDate, today) && isAfter(endDate, today))) {
      return 1;
    }
    
    // Zajtrajšie vrátenia
    if (isTomorrow(endDate)) {
      return 2;
    }
    
    // Dnešné vrátenia
    if (isToday(endDate)) {
      return 3;
    }
    
    // Nepotvrdené prenájmy
    if (!rental.confirmed) {
      return 4;
    }
    
    // Budúce prenájmy (do 7 dní)
    if (isAfter(startDate, today) && isBefore(startDate, addDays(today, 7))) {
      return 5;
    }
    
    return 10;
  };

  const getRentalBackgroundColor = (rental: Rental): string => {
    const priority = getRentalPriority(rental);
    
    if (priority <= 3) return theme.palette.error.light + '20';
    if (priority <= 5) return theme.palette.warning.light + '20';
    if (!rental.confirmed) return theme.palette.info.light + '20';
    
    return theme.palette.background.paper;
  };

  const getRentalStatusColor = (rental: Rental): 'success' | 'warning' | 'error' | 'info' => {
    const priority = getRentalPriority(rental);
    
    if (priority <= 3) return 'error';
    if (priority <= 5) return 'warning';
    if (!rental.confirmed) return 'info';
    
    return 'success';
  };

  // Filter and sort rentals
  const filteredAndSortedRentals = useMemo(() => {
    let filtered = state.rentals || [];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rental => 
        rental.customerName?.toLowerCase().includes(query) ||
        rental.vehicle?.licensePlate?.toLowerCase().includes(query) ||
        rental.vehicle?.brand?.toLowerCase().includes(query) ||
        rental.vehicle?.model?.toLowerCase().includes(query) ||
        rental.orderNumber?.toLowerCase().includes(query) ||
        rental.handoverPlace?.toLowerCase().includes(query)
      );
    }

    // Vehicle filter
    if (filterVehicle) {
      filtered = filtered.filter(rental => 
        rental.vehicle?.id === filterVehicle
      );
    }

    // Company filter
    if (filterCompany) {
      filtered = filtered.filter(rental => 
        rental.vehicle?.company === filterCompany
      );
    }

    // Customer filter
    if (filterCustomer) {
      filtered = filtered.filter(rental => 
        rental.customerName?.toLowerCase().includes(filterCustomer.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(rental => {
        switch (filterStatus) {
          case 'confirmed': return rental.confirmed;
          case 'unconfirmed': return !rental.confirmed;
          case 'paid': return rental.paid;
          case 'unpaid': return !rental.paid;
          default: return true;
        }
      });
    }

    // Date filters
    if (filterDateFrom) {
      const fromDate = startOfDay(new Date(filterDateFrom));
      filtered = filtered.filter(rental => 
        isAfter(new Date(rental.startDate), fromDate) || isToday(new Date(rental.startDate))
      );
    }

    if (filterDateTo) {
      const toDate = startOfDay(new Date(filterDateTo));
      filtered = filtered.filter(rental => 
        isBefore(new Date(rental.endDate), toDate) || isToday(new Date(rental.endDate))
      );
    }

    // Priority filters
    if (showActive) {
      const today = startOfDay(new Date());
      filtered = filtered.filter(rental => {
        const startDate = startOfDay(new Date(rental.startDate));
        const endDate = startOfDay(new Date(rental.endDate));
        return isToday(startDate) || (isBefore(startDate, today) && isAfter(endDate, today));
      });
    }

    if (showTodayReturns) {
      filtered = filtered.filter(rental => 
        isToday(new Date(rental.endDate))
      );
    }

    if (showTomorrowReturns) {
      filtered = filtered.filter(rental => 
        isTomorrow(new Date(rental.endDate))
      );
    }

    if (showUnconfirmed) {
      filtered = filtered.filter(rental => !rental.confirmed);
    }

    if (showFuture) {
      const today = startOfDay(new Date());
      filtered = filtered.filter(rental => 
        isAfter(new Date(rental.startDate), today)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'priority':
          aValue = getRentalPriority(a);
          bValue = getRentalPriority(b);
          break;
        case 'startDate':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case 'endDate':
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        case 'totalPrice':
          aValue = a.totalPrice || 0;
          bValue = b.totalPrice || 0;
          break;
        case 'customerName':
          aValue = a.customerName || '';
          bValue = b.customerName || '';
          break;
        default:
          aValue = getRentalPriority(a);
          bValue = getRentalPriority(b);
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    state.rentals, searchQuery, filterVehicle, filterCompany, filterCustomer, 
    filterStatus, filterDateFrom, filterDateTo, showActive, showTodayReturns, 
    showTomorrowReturns, showUnconfirmed, showFuture, sortBy, sortDirection
  ]);

  // Event handlers
  const handleAdd = () => {
    setEditingRental(null);
    setOpenDialog(true);
  };

  const handleEdit = (rental: Rental) => {
    setEditingRental(rental);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete zmazať tento prenájom?')) {
      try {
        await deleteRental(id);
      } catch (error) {
        console.error('Chyba pri mazaní prenájmu:', error);
      }
    }
  };

  const handleSave = async (rental: Rental) => {
    try {
      if (editingRental) {
        await updateRental(rental);
      } else {
        await createRental(rental);
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Chyba pri ukladaní prenájmu:', error);
    }
  };

  const handleCreateHandover = (rental: Rental) => {
    setSelectedRentalForProtocol(rental);
    setOpenHandoverDialog(true);
  };

  const handleSaveHandover = async (protocolData: any) => {
    try {
      await apiService.createHandoverProtocol(protocolData);
      setOpenHandoverDialog(false);
      
      // Refresh protocols for this rental
      if (selectedRentalForProtocol) {
        setProtocols(prev => ({
          ...prev,
          [selectedRentalForProtocol.id]: {
            ...prev[selectedRentalForProtocol.id],
            handover: protocolData
          }
        }));
      }
    } catch (error) {
      console.error('Chyba pri vytváraní protokolu prevzatia:', error);
    }
  };

  const handleCreateReturn = (rental: Rental) => {
    setSelectedRentalForProtocol(rental);
    setOpenReturnDialog(true);
  };

  const handleSaveReturn = async (protocolData: any) => {
    try {
      await apiService.createReturnProtocol(protocolData);
      setOpenReturnDialog(false);
      
      // Refresh protocols for this rental
      if (selectedRentalForProtocol) {
        setProtocols(prev => ({
          ...prev,
          [selectedRentalForProtocol.id]: {
            ...prev[selectedRentalForProtocol.id],
            return: protocolData
          }
        }));
      }
    } catch (error) {
      console.error('Chyba pri vytváraní protokolu vrátenia:', error);
    }
  };

  const handleOpenGallery = (rental: Rental, protocolType: 'handover' | 'return') => {
    const protocol = protocols[rental.id]?.[protocolType];
    if (protocol) {
      setSelectedProtocolImages(protocol.images || []);
      setSelectedProtocolVideos(protocol.videos || []);
      setGalleryTitle(`${protocolType === 'handover' ? 'Prevzatie' : 'Vrátenie'} - ${rental.customerName}`);
      setGalleryOpen(true);
    }
  };

  const handleCloseGallery = () => {
    setGalleryOpen(false);
    setSelectedProtocolImages([]);
    setSelectedProtocolVideos([]);
  };

  const handleDeleteProtocol = async (rentalId: string, type: 'handover' | 'return') => {
    if (window.confirm(`Naozaj chcete zmazať protokol ${type === 'handover' ? 'prevzatia' : 'vrátenia'}?`)) {
      try {
        await apiService.deleteProtocol(protocols[rentalId]?.[type]?.id, type);
        
        setProtocols(prev => ({
          ...prev,
          [rentalId]: {
            ...prev[rentalId],
            [type]: undefined
          }
        }));
      } catch (error) {
        console.error('Chyba pri mazaní protokolu:', error);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterVehicle('');
    setFilterCompany('');
    setFilterCustomer('');
    setFilterStatus('');
    setFilterPaid('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterPaymentMethod('');
    setShowActive(false);
    setShowTodayReturns(false);
    setShowTomorrowReturns(false);
    setShowUnconfirmed(false);
    setShowFuture(false);
    setShowOldConfirmed(false);
    setShowConfirmed(false);
    setShowAll(true);
  };

  // Get unique companies and vehicles for filters
  const companies = useMemo(() => {
    const companySet = new Set<string>();
    state.rentals?.forEach(rental => {
      if (rental.vehicle?.company) {
        companySet.add(rental.vehicle.company);
      }
    });
    return Array.from(companySet).sort();
  }, [state.rentals]);

  const vehicles = useMemo(() => {
    const vehicleSet = new Map<string, Vehicle>();
    state.rentals?.forEach(rental => {
      if (rental.vehicle) {
        vehicleSet.set(rental.vehicle.id, rental.vehicle);
      }
    });
    return Array.from(vehicleSet.values()).sort((a, b) => 
      `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`)
    );
  }, [state.rentals]);

  // Render rental card
  const renderRentalCard = (rental: Rental) => {
    const priority = getRentalPriority(rental);
    const statusColor = getRentalStatusColor(rental);
    
    return (
      <Card 
        key={rental.id}
        sx={{ 
          height: '100%',
          background: getRentalBackgroundColor(rental),
          border: '1px solid',
          borderColor: priority <= 3 ? 'warning.main' : 'divider',
          '&:hover': { 
            boxShadow: 3,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`P${priority}`}
                size="small"
                color={priority <= 3 ? 'error' : priority <= 5 ? 'warning' : 'default'}
                sx={{ fontWeight: 'bold' }}
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {rental.customerName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {rental.orderNumber && `Obj. č.: ${rental.orderNumber}`}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Zobraziť detail">
                <IconButton size="small" onClick={() => handleEdit(rental)}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Upraviť">
                <IconButton size="small" onClick={() => handleEdit(rental)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Vehicle info */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <VehicleIcon fontSize="small" color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
              </Typography>
            </Box>
            {rental.vehicle && (
              <Typography variant="body2" color="text.secondary">
                {rental.vehicle.licensePlate}
                {rental.vehicle.company && ` • ${rental.vehicle.company}`}
              </Typography>
            )}
          </Box>

          {/* Date range */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Od:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(rental.startDate)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Do:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(rental.endDate)}
                </Typography>
              </Box>
            </Box>
            {rental.handoverPlace && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {rental.handoverPlace}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Price and status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" color="primary" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                €{formatPrice(rental.totalPrice)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Provízia: €{formatPrice(rental.commission)}
              </Typography>
            </Box>
            <Stack direction="column" spacing={0.5}>
              <Chip
                label={rental.paid ? 'Zaplatené' : 'Nezaplatené'}
                size="small"
                color={rental.paid ? 'success' : 'error'}
                variant={rental.paid ? 'filled' : 'outlined'}
              />
              <Chip
                label={rental.confirmed ? 'Potvrdené' : 'Nepotvrdené'}
                size="small"
                color={rental.confirmed ? 'success' : 'warning'}
                variant={rental.confirmed ? 'filled' : 'outlined'}
              />
            </Stack>
          </Box>

          {/* Protocols */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Protokoly:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {protocols[rental.id]?.handover ? (
                <Chip
                  label="Prevzatie"
                  size="small"
                  color="success"
                  icon={<CheckCircleIcon />}
                  onClick={() => handleOpenGallery(rental, 'handover')}
                  sx={{ cursor: 'pointer' }}
                />
              ) : (
                <Chip
                  label="Bez prevzatia"
                  size="small"
                  color="error"
                  variant="outlined"
                  icon={<ErrorIcon />}
                />
              )}
              {protocols[rental.id]?.return ? (
                <Chip
                  label="Vrátenie"
                  size="small"
                  color="success"
                  icon={<CheckCircleIcon />}
                  onClick={() => handleOpenGallery(rental, 'return')}
                  sx={{ cursor: 'pointer' }}
                />
              ) : (
                <Chip
                  label="Bez vrátenia"
                  size="small"
                  color="warning"
                  variant="outlined"
                  icon={<PendingIcon />}
                />
              )}
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<HandoverIcon />}
              onClick={() => handleCreateHandover(rental)}
              sx={{ flex: 1 }}
            >
              Prevzatie
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ReturnIcon />}
              onClick={() => handleCreateReturn(rental)}
              sx={{ flex: 1 }}
            >
              Vrátenie
            </Button>
            <Tooltip title="Zmazať prenájom">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(rental.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Prenájmy
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="cards">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ 
              minWidth: isMobile ? 'auto' : 'auto',
              px: isMobile ? 2 : 3
            }}
          >
            {isMobile ? 'Pridať' : 'Nový prenájom'}
          </Button>
        </Box>
      </Box>

      {/* Search and filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder="Hľadať prenájmy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            Filtre
          </Button>
          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </Button>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Zoradiť podľa</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              label="Zoradiť podľa"
            >
              <MenuItem value="priority">Priorita</MenuItem>
              <MenuItem value="startDate">Dátum začiatku</MenuItem>
              <MenuItem value="endDate">Dátum konca</MenuItem>
              <MenuItem value="totalPrice">Cena</MenuItem>
              <MenuItem value="customerName">Zákazník</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Quick filters */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            label="Aktívne"
            color={showActive ? 'primary' : 'default'}
            variant={showActive ? 'filled' : 'outlined'}
            onClick={() => setShowActive(!showActive)}
            size="small"
          />
          <Chip
            label="Dnešné vrátenia"
            color={showTodayReturns ? 'error' : 'default'}
            variant={showTodayReturns ? 'filled' : 'outlined'}
            onClick={() => setShowTodayReturns(!showTodayReturns)}
            size="small"
          />
          <Chip
            label="Zajtrajšie vrátenia"
            color={showTomorrowReturns ? 'warning' : 'default'}
            variant={showTomorrowReturns ? 'filled' : 'outlined'}
            onClick={() => setShowTomorrowReturns(!showTomorrowReturns)}
            size="small"
          />
          <Chip
            label="Nepotvrdené"
            color={showUnconfirmed ? 'info' : 'default'}
            variant={showUnconfirmed ? 'filled' : 'outlined'}
            onClick={() => setShowUnconfirmed(!showUnconfirmed)}
            size="small"
          />
          <Chip
            label="Budúce"
            color={showFuture ? 'success' : 'default'}
            variant={showFuture ? 'filled' : 'outlined'}
            onClick={() => setShowFuture(!showFuture)}
            size="small"
          />
          <Chip
            label="Vymazať filtre"
            color="default"
            variant="outlined"
            onClick={clearFilters}
            size="small"
          />
        </Box>

        {/* Advanced filters */}
        <Collapse in={showFilters}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Vozidlo</InputLabel>
                <Select
                  value={filterVehicle}
                  onChange={(e) => setFilterVehicle(e.target.value)}
                  label="Vozidlo"
                >
                  <MenuItem value="">Všetky vozidlá</MenuItem>
                  {vehicles.map(vehicle => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Spoločnosť</InputLabel>
                <Select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  label="Spoločnosť"
                >
                  <MenuItem value="">Všetky spoločnosti</MenuItem>
                  {companies.map(company => (
                    <MenuItem key={company} value={company}>
                      {company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Zákazník"
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Stav</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Stav"
                >
                  <MenuItem value="">Všetky</MenuItem>
                  <MenuItem value="confirmed">Potvrdené</MenuItem>
                  <MenuItem value="unconfirmed">Nepotvrdené</MenuItem>
                  <MenuItem value="paid">Zaplatené</MenuItem>
                  <MenuItem value="unpaid">Nezaplatené</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Od dátumu"
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Do dátumu"
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label={`Celkom: ${filteredAndSortedRentals.length}`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`Aktívne: ${filteredAndSortedRentals.filter(r => getRentalPriority(r) <= 3).length}`}
          color="error"
          variant="outlined"
        />
        <Chip
          label={`Nepotvrdené: ${filteredAndSortedRentals.filter(r => !r.confirmed).length}`}
          color="warning"
          variant="outlined"
        />
        <Chip
          label={`Nezaplatené: ${filteredAndSortedRentals.filter(r => !r.paid).length}`}
          color="info"
          variant="outlined"
        />
      </Box>

      {/* Rental cards/list */}
      {viewMode === 'cards' ? (
        <Grid container spacing={2}>
          {filteredAndSortedRentals.map(rental => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={rental.id}>
              {renderRentalCard(rental)}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box>
          {filteredAndSortedRentals.map(rental => (
            <Paper key={rental.id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={`P${getRentalPriority(rental)}`}
                    size="small"
                    color={getRentalPriority(rental) <= 3 ? 'error' : 'default'}
                  />
                  <Typography variant="h6">{rental.customerName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="h6" color="primary">
                    €{formatPrice(rental.totalPrice)}
                  </Typography>
                  <Button size="small" onClick={() => handleEdit(rental)}>
                    <EditIcon />
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Empty state */}
      {filteredAndSortedRentals.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Žiadne prenájmy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || filterVehicle || filterCompany || filterCustomer || filterStatus || filterDateFrom || filterDateTo || showActive || showTodayReturns || showTomorrowReturns || showUnconfirmed || showFuture
              ? 'Skúste zmeniť filtre'
              : 'Vytvorte prvý prenájom'}
          </Typography>
        </Box>
      )}

      {/* Floating action button for mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="Pridať prenájom"
          onClick={handleAdd}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialogs */}
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