import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  IconButton,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  useMediaQuery,
  useTheme,
  Tooltip,
  Alert,
  CircularProgress,
  Fab,
  Collapse,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Stack,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DirectionsCar as CarIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Assessment as ReportIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  LocalShipping as HighwayIcon,
  Build as BuildIcon,
  AttachFile as FileIcon,
  Refresh as RefreshIcon,
  GetApp as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Sort as SortIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Insurance, PaymentFrequency, VehicleDocument, Vehicle } from '../../types';
import { format, isAfter, addDays, parseISO, isValid } from 'date-fns';
import { sk } from 'date-fns/locale';
import UnifiedDocumentForm from '../common/UnifiedDocumentForm';
import InsuranceClaimList from './InsuranceClaimList';
import { useInfiniteInsurances } from '../../hooks/useInfiniteInsurances';
import { getApiBaseUrl } from '../../utils/apiUrl';

// Unified document type for table display
interface UnifiedDocument {
  id: string;
  vehicleId: string;
  type: 'insurance' | 'stk' | 'ek' | 'vignette' | 'technical_certificate';
  documentNumber?: string;
  policyNumber?: string;
  validFrom?: Date | string;
  validTo: Date | string;
  price?: number;
  company?: string;
  paymentFrequency?: PaymentFrequency;
  notes?: string;
  filePath?: string;
  filePaths?: string[];
  createdAt: Date | string;
  originalData: Insurance | VehicleDocument;
}

// Vehicle with documents grouped
interface VehicleWithDocuments {
  vehicle: Vehicle;
  documents: UnifiedDocument[];
  stats: {
    total: number;
    valid: number;
    expiring: number;
    expired: number;
    nextExpiry?: Date;
    hasProblems: boolean;
  };
}

type SortOption = 'name' | 'problems' | 'expiry';

const getExpiryStatus = (validTo: Date | string, documentType: string) => {
  try {
    const today = new Date();
    
    let warningDays: number;
    switch (documentType) {
      case 'insurance':
      case 'vignette':
      case 'greencard':
        warningDays = 15;
        break;
      case 'stk':
      case 'ek':
        warningDays = 30;
        break;
      default:
        warningDays = 30;
    }
    
    const warningDate = addDays(today, warningDays);
    const validToDate = typeof validTo === 'string' ? parseISO(validTo) : validTo;
    
    if (!isValid(validToDate)) {
      return { status: 'invalid', color: 'default', text: 'Neplatný dátum', bgColor: '#f5f5f5' };
    }
    
    if (isAfter(today, validToDate)) {
      return { status: 'expired', color: 'error', text: 'Vypršalo', bgColor: '#ffebee' };
    } else if (isAfter(validToDate, warningDate)) {
      return { status: 'valid', color: 'success', text: 'Platné', bgColor: '#e8f5e8' };
    } else {
      const daysLeft = Math.ceil((validToDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        status: 'expiring', 
        color: 'warning', 
        text: `Vyprší za ${daysLeft} dní`, 
        bgColor: '#fff3e0' 
      };
    }
  } catch (error) {
    return { status: 'invalid', color: 'default', text: 'Neplatný dátum', bgColor: '#f5f5f5' };
  }
};

const getDocumentTypeInfo = (type: string) => {
  switch (type) {
    case 'insurance':
      return { label: 'Poistka', icon: <SecurityIcon sx={{ fontSize: 20 }} />, color: '#1976d2' };
    case 'stk':
      return { label: 'STK', icon: <BuildIcon sx={{ fontSize: 20 }} />, color: '#388e3c' };
    case 'ek':
      return { label: 'EK', icon: <AssignmentIcon sx={{ fontSize: 20 }} />, color: '#f57c00' };
    case 'vignette':
      return { label: 'Dialničná', icon: <HighwayIcon sx={{ fontSize: 20 }} />, color: '#7b1fa2' };
    case 'technical_certificate':
      return { label: 'Technický preukaz', icon: <FileIcon sx={{ fontSize: 20 }} />, color: '#9c27b0' };
    default:
      return { label: type, icon: <ReportIcon sx={{ fontSize: 20 }} />, color: '#666' };
  }
};

export default function VehicleCentricInsuranceList() {
  const { 
    state, 
    createInsurance, 
    updateInsurance,
    deleteInsurance,
    createVehicleDocument,
    updateVehicleDocument,
    deleteVehicleDocument
  } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Infinite scroll for insurances
  const {
    insurances,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
    filters,
    setFilters,
    setSearchTerm
  } = useInfiniteInsurances();
  
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('expiry'); // Default: najbližšia expirácia
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());

  // Synchronize search and filters
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery, setSearchTerm]);

  useEffect(() => {
    setFilters({
      search: searchQuery,
      type: filterType || undefined,
      company: filterCompany || undefined,
      status: filterStatus as any || 'all',
      vehicleId: filterVehicle || undefined,
    });
  }, [searchQuery, filterType, filterCompany, filterStatus, filterVehicle, setFilters]);

  // Create unified documents
  const unifiedDocuments = useMemo(() => {
    const docs: UnifiedDocument[] = [];
    
    // Add insurances
    insurances.forEach(insurance => {
      docs.push({
        id: insurance.id,
        vehicleId: insurance.vehicleId,
        type: 'insurance',
        policyNumber: insurance.policyNumber,
        validFrom: insurance.validFrom,
        validTo: insurance.validTo,
        price: insurance.price,
        company: insurance.company,
        paymentFrequency: insurance.paymentFrequency,
        filePath: insurance.filePath,
        filePaths: insurance.filePaths,
        createdAt: insurance.validTo,
        originalData: insurance
      });
    });
    
    // Add vehicle documents (exclude technical certificates from main list)
    if (state.vehicleDocuments) {
      state.vehicleDocuments.forEach(doc => {
        docs.push({
          id: doc.id,
          vehicleId: doc.vehicleId,
          type: doc.documentType as any,
          documentNumber: doc.documentNumber,
          validFrom: doc.validFrom,
          validTo: doc.validTo,
          price: doc.price,
          notes: doc.notes,
          filePath: doc.filePath,
          createdAt: doc.validTo,
          originalData: doc
        });
      });
    }
    
    return docs;
  }, [insurances, state.vehicleDocuments]);

  // Group documents by vehicle
  const vehiclesWithDocuments = useMemo(() => {
    if (!state.vehicles) return [];
    
    const vehicleGroups: VehicleWithDocuments[] = [];
    
    state.vehicles.forEach(vehicle => {
      const vehicleDocs = unifiedDocuments.filter(doc => doc.vehicleId === vehicle.id);
      
      // Skip vehicles with no documents
      if (vehicleDocs.length === 0) return;
      
      // Apply filtering
      const filteredDocs = vehicleDocs.filter(doc => {
        const vehicleText = `${vehicle.brand} ${vehicle.model} ${vehicle.licensePlate}`;
        
        const matchesSearch = !searchQuery || 
          (doc.policyNumber && doc.policyNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.documentNumber && doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.company && doc.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
          vehicleText.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesVehicle = !filterVehicle || doc.vehicleId === filterVehicle;
        const matchesCompany = !filterCompany || doc.company === filterCompany;
        const matchesType = !filterType || doc.type === filterType;
        const matchesStatus = !filterStatus || getExpiryStatus(doc.validTo, doc.type).status === filterStatus;
        
        return matchesSearch && matchesVehicle && matchesCompany && matchesType && matchesStatus;
      });
      
      // Skip if no documents match filters
      if (filteredDocs.length === 0) return;
      
      // Calculate stats
      const stats = {
        total: filteredDocs.length,
        valid: filteredDocs.filter(doc => getExpiryStatus(doc.validTo, doc.type).status === 'valid').length,
        expiring: filteredDocs.filter(doc => getExpiryStatus(doc.validTo, doc.type).status === 'expiring').length,
        expired: filteredDocs.filter(doc => getExpiryStatus(doc.validTo, doc.type).status === 'expired').length,
        nextExpiry: filteredDocs
          .map(doc => typeof doc.validTo === 'string' ? parseISO(doc.validTo) : doc.validTo)
          .filter(date => isValid(date) && isAfter(date, new Date()))
          .sort((a, b) => a.getTime() - b.getTime())[0],
        hasProblems: false
      };
      
      stats.hasProblems = stats.expiring > 0 || stats.expired > 0;
      
      vehicleGroups.push({
        vehicle,
        documents: filteredDocs,
        stats
      });
    });
    
    return vehicleGroups;
  }, [state.vehicles, unifiedDocuments, searchQuery, filterVehicle, filterCompany, filterType, filterStatus]);

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    const sorted = [...vehiclesWithDocuments];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => 
          `${a.vehicle.brand} ${a.vehicle.model}`.localeCompare(`${b.vehicle.brand} ${b.vehicle.model}`)
        );
      case 'problems':
        return sorted.sort((a, b) => {
          // First by problems (expired + expiring), then by next expiry
          const aProblems = a.stats.expired + a.stats.expiring;
          const bProblems = b.stats.expired + b.stats.expiring;
          if (aProblems !== bProblems) return bProblems - aProblems;
          
          if (a.stats.nextExpiry && b.stats.nextExpiry) {
            return a.stats.nextExpiry.getTime() - b.stats.nextExpiry.getTime();
          }
          return a.stats.nextExpiry ? -1 : 1;
        });
      case 'expiry':
      default:
        return sorted.sort((a, b) => {
          if (a.stats.nextExpiry && b.stats.nextExpiry) {
            return a.stats.nextExpiry.getTime() - b.stats.nextExpiry.getTime();
          }
          if (a.stats.nextExpiry) return -1;
          if (b.stats.nextExpiry) return 1;
          return 0;
        });
    }
  }, [vehiclesWithDocuments, sortBy]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const allDocs = vehiclesWithDocuments.flatMap(v => v.documents);
    return {
      totalVehicles: vehiclesWithDocuments.length,
      totalDocuments: allDocs.length,
      validDocs: allDocs.filter(doc => getExpiryStatus(doc.validTo, doc.type).status === 'valid').length,
      expiringDocs: allDocs.filter(doc => getExpiryStatus(doc.validTo, doc.type).status === 'expiring').length,
      expiredDocs: allDocs.filter(doc => getExpiryStatus(doc.validTo, doc.type).status === 'expired').length,
    };
  }, [vehiclesWithDocuments]);

  const toggleVehicleExpansion = (vehicleId: string) => {
    const newExpanded = new Set(expandedVehicles);
    if (newExpanded.has(vehicleId)) {
      newExpanded.delete(vehicleId);
    } else {
      newExpanded.add(vehicleId);
    }
    setExpandedVehicles(newExpanded);
  };

  const handleAdd = () => {
    setEditingDocument(null);
    setOpenDialog(true);
  };

  const handleEdit = (doc: UnifiedDocument) => {
    const formData = {
      id: doc.id,
      vehicleId: doc.vehicleId,
      type: doc.type,
      policyNumber: doc.policyNumber,
      company: doc.company,
      paymentFrequency: doc.paymentFrequency,
      documentNumber: doc.documentNumber,
      notes: doc.notes,
      validFrom: doc.validFrom ? (typeof doc.validFrom === 'string' ? new Date(doc.validFrom) : doc.validFrom) : undefined,
      validTo: typeof doc.validTo === 'string' ? new Date(doc.validTo) : doc.validTo,
      price: doc.price,
      filePath: doc.filePath,
      filePaths: doc.filePaths || (doc.filePath ? [doc.filePath] : []),
      greenCardValidFrom: doc.originalData && 'greenCardValidFrom' in doc.originalData ? doc.originalData.greenCardValidFrom : undefined,
      greenCardValidTo: doc.originalData && 'greenCardValidTo' in doc.originalData ? doc.originalData.greenCardValidTo : undefined
    };
    setEditingDocument(formData as any);
    setOpenDialog(true);
  };

  const handleDelete = async (doc: UnifiedDocument) => {
    if (window.confirm('Naozaj chcete vymazať tento dokument?')) {
      try {
        if (doc.type === 'insurance') {
          await deleteInsurance(doc.id);
        } else {
          await deleteVehicleDocument(doc.id);
        }
      } catch (error) {
        console.error('Chyba pri mazaní dokumentu:', error);
        alert('Chyba pri mazaní dokumentu');
      }
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingDocument) {
        if (editingDocument.type === 'insurance') {
          const selectedInsurer = state.insurers.find(insurer => insurer.name === data.company);
          const insuranceData = {
            id: editingDocument.id || '',
            vehicleId: data.vehicleId,
            type: data.policyNumber ? 'Havarijné poistenie' : 'Poistenie',
            policyNumber: data.policyNumber || '',
            validFrom: data.validFrom || new Date(),
            validTo: data.validTo,
            price: data.price || 0,
            company: data.company || '',
            insurerId: selectedInsurer?.id || null,
            paymentFrequency: data.paymentFrequency || 'yearly',
            filePath: data.filePath,
            filePaths: data.filePaths,
            greenCardValidFrom: data.greenCardValidFrom,
            greenCardValidTo: data.greenCardValidTo
          };
          await updateInsurance(insuranceData);
        } else {
          const vehicleDocData = {
            id: editingDocument.id || '',
            vehicleId: data.vehicleId,
            documentType: data.type,
            validFrom: data.validFrom,
            validTo: data.validTo,
            documentNumber: data.documentNumber,
            price: data.price,
            notes: data.notes,
            filePath: data.filePath
          };
          await updateVehicleDocument(vehicleDocData);
        }
      } else {
        if (data.type === 'insurance') {
          const insuranceData = {
            id: '',
            vehicleId: data.vehicleId,
            type: data.policyNumber ? 'Havarijné poistenie' : 'Poistenie',
            policyNumber: data.policyNumber || '',
            validFrom: data.validFrom || new Date(),
            validTo: data.validTo,
            price: data.price || 0,
            company: data.company || '',
            paymentFrequency: data.paymentFrequency || 'yearly',
            filePath: data.filePath,
            filePaths: data.filePaths,
            greenCardValidFrom: data.greenCardValidFrom,
            greenCardValidTo: data.greenCardValidTo
          };
          await createInsurance(insuranceData);
        } else {
          const vehicleDocData = {
            id: '',
            vehicleId: data.vehicleId,
            documentType: data.type,
            validFrom: data.validFrom,
            validTo: data.validTo,
            documentNumber: data.documentNumber,
            price: data.price,
            notes: data.notes,
            filePath: data.filePath
          };
          await createVehicleDocument(vehicleDocData);
        }
      }
      setOpenDialog(false);
      setEditingDocument(null);
    } catch (error) {
      console.error('Chyba pri ukladaní dokumentu:', error);
      alert('Chyba pri ukladaní dokumentu: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterVehicle('');
    setFilterCompany('');
    setFilterType('');
    setFilterStatus('');
  };

  const hasActiveFilters = searchQuery || filterVehicle || filterCompany || filterType || filterStatus;

  const handleRefresh = () => {
    refresh();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Modern Header */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          p: { xs: 2, md: 3 }
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon sx={{ fontSize: { xs: 28, md: 32 } }} />
              <Box>
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 0.5 }}>
                  Poistky/STK/Dialničné
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {overallStats.totalVehicles} vozidiel • {overallStats.totalDocuments} dokumentov
                </Typography>
              </Box>
            </Box>
            
            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                Pridať dokument
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {activeTab === 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant={isMobile ? "caption" : "h6"} sx={{ fontWeight: 600, mb: 1 }}>
                      VOZIDLÁ
                    </Typography>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700 }}>
                      {overallStats.totalVehicles}
                    </Typography>
                  </Box>
                  <CarIcon sx={{ fontSize: { xs: 24, sm: 40 }, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant={isMobile ? "caption" : "h6"} sx={{ fontWeight: 600, mb: 1 }}>
                      PLATNÉ
                    </Typography>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700 }}>
                      {overallStats.validDocs}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: { xs: 24, sm: 40 }, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant={isMobile ? "caption" : "h6"} sx={{ fontWeight: 600, mb: 1 }}>
                      VYPRŠÍ
                    </Typography>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700 }}>
                      {overallStats.expiringDocs}
                    </Typography>
                  </Box>
                  <ScheduleIcon sx={{ fontSize: { xs: 24, sm: 40 }, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant={isMobile ? "caption" : "h6"} sx={{ fontWeight: 600, mb: 1 }}>
                      VYPRŠANÉ
                    </Typography>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700 }}>
                      {overallStats.expiredDocs}
                    </Typography>
                  </Box>
                  <ErrorIcon sx={{ fontSize: { xs: 24, sm: 40 }, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search, Filters and Sorting */}
      {activeTab === 0 && (
        <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            {/* Search and main controls */}
            <Box sx={{ display: 'flex', gap: 2, mb: showFilters ? 2 : 0, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Vyhľadať vozidlo alebo dokument..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
                sx={{ flex: 1, minWidth: '250px' }}
                size={isMobile ? "small" : "medium"}
              />
              
              {/* Sort dropdown */}
              <FormControl sx={{ minWidth: 180 }} size={isMobile ? "small" : "medium"}>
                <InputLabel>Triediť podľa</InputLabel>
                <Select
                  value={sortBy}
                  label="Triediť podľa"
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  startAdornment={<SortIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="expiry">Najbližšia expirácia</MenuItem>
                  <MenuItem value="problems">Počet problémov</MenuItem>
                  <MenuItem value="name">Názov vozidla</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ whiteSpace: 'nowrap' }}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? 'Filtre' : `Filtre ${hasActiveFilters ? `(${Object.values({ searchQuery, filterVehicle, filterCompany, filterType, filterStatus }).filter(Boolean).length})` : ''}`}
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={clearFilters}
                  color="secondary"
                  sx={{ whiteSpace: 'nowrap' }}
                  size={isMobile ? "small" : "medium"}
                >
                  Zrušiť
                </Button>
              )}
            </Box>

            {/* Advanced filters */}
            {showFilters && (
              <>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                      <InputLabel>Vozidlo</InputLabel>
                      <Select
                        value={filterVehicle}
                        label="Vozidlo"
                        onChange={(e) => setFilterVehicle(e.target.value)}
                      >
                        <MenuItem value="">Všetky</MenuItem>
                        {state.vehicles?.map(vehicle => (
                          <MenuItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                          </MenuItem>
                        )) || []}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                      <InputLabel>Typ dokumentu</InputLabel>
                      <Select
                        value={filterType}
                        label="Typ dokumentu"
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <MenuItem value="">Všetky</MenuItem>
                        <MenuItem value="insurance">Poistka</MenuItem>
                        <MenuItem value="stk">STK</MenuItem>
                        <MenuItem value="ek">EK</MenuItem>
                        <MenuItem value="vignette">Dialničná</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                      <InputLabel>Spoločnosť</InputLabel>
                      <Select
                        value={filterCompany}
                        label="Spoločnosť"
                        onChange={(e) => setFilterCompany(e.target.value)}
                      >
                        <MenuItem value="">Všetky</MenuItem>
                        {Array.from(new Set(unifiedDocuments.map(d => d.company).filter(Boolean))).map(company => (
                          <MenuItem key={company} value={company}>{company}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                      <InputLabel>Stav</InputLabel>
                      <Select
                        value={filterStatus}
                        label="Stav"
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <MenuItem value="">Všetky</MenuItem>
                        <MenuItem value="valid">Platné</MenuItem>
                        <MenuItem value="expiring">Vypršia čoskoro</MenuItem>
                        <MenuItem value="expired">Vypršané</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {activeTab === 0 && overallStats.expiredDocs > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          icon={<WarningIcon />}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Pozor! {overallStats.expiredDocs} dokumentov už vypršalo
          </Typography>
        </Alert>
      )}

      {activeTab === 0 && overallStats.expiringDocs > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<ScheduleIcon />}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            Upozornenie: {overallStats.expiringDocs} dokumentov vyprší čoskoro
          </Typography>
        </Alert>
      )}

      {/* Vehicle List */}
      {activeTab === 0 && (
        <Box sx={{ mb: 3 }}>
          {sortedVehicles.map((vehicleGroup) => (
            <VehicleCard
              key={vehicleGroup.vehicle.id}
              vehicleGroup={vehicleGroup}
              expanded={expandedVehicles.has(vehicleGroup.vehicle.id)}
              onToggleExpand={() => toggleVehicleExpansion(vehicleGroup.vehicle.id)}
              onEditDocument={handleEdit}
              onDeleteDocument={handleDelete}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          )}
          
          {/* Load more button */}
          {hasMore && !loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Button variant="outlined" onClick={loadMore}>
                Načítať viac ({totalCount - insurances.length} zostáva)
              </Button>
            </Box>
          )}
          
          {/* Error handling */}
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      )}

      {/* Empty State */}
      {activeTab === 0 && sortedVehicles.length === 0 && !loading && (
        <Card sx={{ textAlign: 'center', py: 6, mt: 3 }}>
          <CardContent>
            <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {hasActiveFilters ? 'Žiadne vozidlá nevyhovujú filtrom' : 'Žiadne vozidlá s dokumentmi'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {hasActiveFilters ? 'Skúste zmeniť filtre alebo vyhľadávanie' : 'Začnite pridaním prvého dokumentu'}
            </Typography>
            {!hasActiveFilters && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ mt: 2 }}
              >
                Pridať dokument
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Insurance Claims Tab */}
      {activeTab === 1 && (
        <InsuranceClaimList />
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleAdd}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Document Form Dialog */}
      {activeTab === 0 && (
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="lg"
          fullWidth
          fullScreen={isMobile}
          disableRestoreFocus
          keepMounted={false}
        >
          <UnifiedDocumentForm
            document={editingDocument}
            onSave={handleSave}
            onCancel={() => setOpenDialog(false)}
          />
        </Dialog>
      )}
    </Box>
  );
}

// Vehicle Card Component
interface VehicleCardProps {
  vehicleGroup: VehicleWithDocuments;
  expanded: boolean;
  onToggleExpand: () => void;
  onEditDocument: (doc: UnifiedDocument) => void;
  onDeleteDocument: (doc: UnifiedDocument) => void;
  isMobile: boolean;
  isTablet: boolean;
}

function VehicleCard({ 
  vehicleGroup, 
  expanded, 
  onToggleExpand, 
  onEditDocument, 
  onDeleteDocument,
  isMobile,
  isTablet 
}: VehicleCardProps) {
  const { vehicle, documents, stats } = vehicleGroup;

  return (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: stats.hasProblems ? '0 4px 20px rgba(244, 67, 54, 0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
        border: stats.hasProblems ? '1px solid rgba(244, 67, 54, 0.2)' : 'none',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      {/* Vehicle Header */}
      <CardContent 
        sx={{ 
          cursor: 'pointer',
          p: { xs: 2, md: 3 },
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.02)'
          }
        }}
        onClick={onToggleExpand}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            {/* Vehicle Avatar/Icon */}
            <Avatar 
              sx={{ 
                bgcolor: stats.hasProblems ? 'error.main' : 'primary.main',
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 }
              }}
            >
              <CarIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
            </Avatar>
            
            {/* Vehicle Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{ 
                  fontWeight: 700, 
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {vehicle.brand} {vehicle.model}
              </Typography>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {vehicle.licensePlate} • {isMobile ? '' : `VIN: ${vehicle.vin || 'N/A'} • `}{stats.total} dokumentov
                </Typography>
                {isMobile && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    VIN: {vehicle.vin || 'Neuvedené'}
                  </Typography>
                )}
              </Box>
              
              {/* Next expiry info */}
              {stats.nextExpiry && (
                <Typography variant="caption" color="text.secondary">
                  Najbližšia expirácia: {format(stats.nextExpiry, 'dd.MM.yyyy', { locale: sk })}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Status Badges */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {stats.expired > 0 && (
              <Badge badgeContent={stats.expired} color="error">
                <Chip 
                  label="Vypršané" 
                  color="error" 
                  size="small" 
                  icon={<ErrorIcon />}
                />
              </Badge>
            )}
            {stats.expiring > 0 && (
              <Badge badgeContent={stats.expiring} color="warning">
                <Chip 
                  label="Vyprší" 
                  color="warning" 
                  size="small" 
                  icon={<ScheduleIcon />}
                />
              </Badge>
            )}
            {!stats.hasProblems && (
              <Chip 
                label="V poriadku" 
                color="success" 
                size="small" 
                icon={<CheckCircleIcon />}
              />
            )}
            
            {/* Expand/Collapse Icon */}
            <IconButton size="small" sx={{ ml: 1 }}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
      </CardContent>
      
      {/* Expandable Documents List */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <List sx={{ pt: 0 }}>
          {documents.map((doc, index) => (
            <DocumentListItem
              key={`${doc.type}-${doc.id || index}`}
              document={doc}
              onEdit={() => onEditDocument(doc)}
              onDelete={() => onDeleteDocument(doc)}
              isMobile={isMobile}
              isLast={index === documents.length - 1}
            />
          ))}
        </List>
      </Collapse>
    </Card>
  );
}

// Document List Item Component
interface DocumentListItemProps {
  document: UnifiedDocument;
  onEdit: () => void;
  onDelete: () => void;
  isMobile: boolean;
  isLast: boolean;
}

function DocumentListItem({ document, onEdit, onDelete, isMobile, isLast }: DocumentListItemProps) {
  const typeInfo = getDocumentTypeInfo(document.type);
  const expiryStatus = getExpiryStatus(document.validTo, document.type);
  
  return (
    <>
      <ListItem
        sx={{
          py: { xs: 1.5, md: 2 },
          px: { xs: 2, md: 3 },
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.02)'
          }
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Box sx={{ color: typeInfo.color }}>
            {typeInfo.icon}
          </Box>
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {typeInfo.label}
              </Typography>
              {(document.policyNumber || document.documentNumber) && (
                <Typography variant="body2" color="text.secondary">
                  {document.policyNumber || document.documentNumber}
                </Typography>
              )}
            </Box>
          }
          secondary={
            <Box sx={{ mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  {(() => {
                    try {
                      const date = typeof document.validTo === 'string' ? parseISO(document.validTo) : document.validTo;
                      return isValid(date) ? `Platné do ${format(date, 'dd.MM.yyyy', { locale: sk })}` : 'Neplatný dátum';
                    } catch (error) {
                      return 'Neplatný dátum';
                    }
                  })()}
                </Typography>
                
                <Chip
                  label={expiryStatus.text}
                  color={expiryStatus.color as any}
                  size="small"
                  variant="filled"
                />
                
                {document.company && (
                  <Typography variant="body2" color="text.secondary">
                    {document.company}
                  </Typography>
                )}
                
                {document.price && (
                  <Typography variant="body2" color="text.secondary">
                    €{document.price.toFixed(2)}
                  </Typography>
                )}
              </Box>
              
              {/* Green Card info for insurance */}
              {document.type === 'insurance' && document.originalData && 'greenCardValidTo' in document.originalData && document.originalData.greenCardValidTo && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    🟢 Biela karta:
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(() => {
                      try {
                        const date = typeof document.originalData.greenCardValidTo === 'string' 
                          ? parseISO(document.originalData.greenCardValidTo) 
                          : document.originalData.greenCardValidTo;
                        return isValid(date) ? format(date, 'dd.MM.yyyy', { locale: sk }) : 'Neplatný';
                      } catch (error) {
                        return 'Neplatný';
                      }
                    })()}
                  </Typography>
                  <Chip
                    label={getExpiryStatus(document.originalData.greenCardValidTo, 'greencard').text}
                    color={getExpiryStatus(document.originalData.greenCardValidTo, 'greencard').color as any}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              )}
              
              {/* Files */}
              {(() => {
                const filePaths = (document.originalData as Insurance)?.filePaths || 
                                (document.filePath ? [document.filePath] : []);
                
                if (filePaths.length > 0) {
                  return (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <FileIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      {filePaths.length === 1 ? (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => window.open(filePaths[0], '_blank')}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          Zobraziť súbor
                        </Button>
                      ) : (
                        <Chip
                          label={`${filePaths.length} súborov`}
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            // ZIP download logic here
                            console.log('Download ZIP for files:', filePaths);
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      )}
                    </Box>
                  );
                }
                return null;
              })()}
            </Box>
          }
        />
        
        <ListItemSecondaryAction>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Upraviť">
              <IconButton
                size="small"
                onClick={onEdit}
                sx={{ color: 'primary.main' }}
              >
                <EditIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Vymazať">
              <IconButton
                size="small"
                onClick={onDelete}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </ListItemSecondaryAction>
      </ListItem>
      {!isLast && <Divider variant="inset" component="li" />}
    </>
  );
}
