import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Divider,
  useMediaQuery,
  useTheme,
  Tooltip,
  Alert,
  CircularProgress,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DirectionsCar as CarIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Event as EventIcon,
  Euro as EuroIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Assessment as ReportIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  LocalShipping as HighwayIcon,
  Build as BuildIcon,
  AttachFile as FileIcon
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Insurance, PaymentFrequency, VehicleDocument, DocumentType } from '../../types';
import { format, isAfter, addDays, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import UnifiedDocumentForm from '../common/UnifiedDocumentForm';
import InsuranceClaimList from './InsuranceClaimList';

// Unified document type for table display
interface UnifiedDocument {
  id: string;
  vehicleId: string;
  type: 'insurance' | 'stk' | 'ek' | 'vignette';
  documentNumber?: string;
  policyNumber?: string;
  validFrom?: Date | string;
  validTo: Date | string;
  price?: number;
  company?: string;
  paymentFrequency?: PaymentFrequency;
  notes?: string;
  filePath?: string;
  createdAt: Date | string;
  originalData: Insurance | VehicleDocument;
}

const getExpiryStatus = (validTo: Date | string) => {
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);
  
  const validToDate = typeof validTo === 'string' ? parseISO(validTo) : validTo;
  
  if (isAfter(today, validToDate)) {
    return { status: 'expired', color: 'error', text: 'Vypršalo', bgColor: '#ffebee' };
  } else if (isAfter(validToDate, thirtyDaysFromNow)) {
    return { status: 'valid', color: 'success', text: 'Platné', bgColor: '#e8f5e8' };
  } else {
    return { status: 'expiring', color: 'warning', text: 'Vyprší čoskoro', bgColor: '#fff3e0' };
  }
};

const getPaymentFrequencyText = (frequency: PaymentFrequency) => {
  switch (frequency) {
    case 'monthly':
      return 'Mesačne';
    case 'quarterly':
      return 'Štvrťročne';
    case 'biannual':
      return 'Polročne';
    case 'yearly':
      return 'Ročne';
    default:
      return 'Ročne';
  }
};

const getDocumentTypeInfo = (type: string) => {
  switch (type) {
    case 'insurance':
      return { label: 'Poistka', icon: <SecurityIcon sx={{ fontSize: 16 }} />, color: '#1976d2' };
    case 'stk':
      return { label: 'STK', icon: <BuildIcon sx={{ fontSize: 16 }} />, color: '#388e3c' };
    case 'ek':
      return { label: 'EK', icon: <AssignmentIcon sx={{ fontSize: 16 }} />, color: '#f57c00' };
    case 'vignette':
      return { label: 'Dialničná', icon: <HighwayIcon sx={{ fontSize: 16 }} />, color: '#7b1fa2' };
    default:
      return { label: type, icon: <ReportIcon sx={{ fontSize: 16 }} />, color: '#666' };
  }
};

export default function InsuranceList() {
  const { 
    state, 
    dispatch, 
    createInsurance, 
    updateInsurance,
    createVehicleDocument,
    updateVehicleDocument,
    deleteVehicleDocument
  } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Convert data to unified format
  const unifiedDocuments = useMemo(() => {
    const docs: UnifiedDocument[] = [];
    
    // Add insurances
    if (state.insurances) {
      state.insurances.forEach(insurance => {
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
          createdAt: insurance.validTo, // Use validTo as fallback for sorting
          originalData: insurance
        });
      });
    }
    
    // Add vehicle documents
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
          createdAt: doc.validTo, // Use validTo as fallback for sorting
          originalData: doc
        });
      });
    }
    
    return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.insurances, state.vehicleDocuments]);

  // Statistics
  const stats = useMemo(() => {
    const total = unifiedDocuments.length;
    const validDocs = unifiedDocuments.filter(doc => {
      const status = getExpiryStatus(doc.validTo);
      return status.status === 'valid';
    }).length;
    
    const expiringDocs = unifiedDocuments.filter(doc => {
      const status = getExpiryStatus(doc.validTo);
      return status.status === 'expiring';
    }).length;
    
    const expiredDocs = unifiedDocuments.filter(doc => {
      const status = getExpiryStatus(doc.validTo);
      return status.status === 'expired';
    }).length;
    
    const totalValue = unifiedDocuments.reduce((sum, doc) => sum + (doc.price || 0), 0);
    
    return { total, validDocs, expiringDocs, expiredDocs, totalValue };
  }, [unifiedDocuments]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return unifiedDocuments.filter((doc) => {
      const vehicle = state.vehicles?.find(v => v.id === doc.vehicleId);
      const vehicleText = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.licensePlate}` : '';
      
      const matchesSearch = !searchQuery || 
        (doc.policyNumber && doc.policyNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.documentNumber && doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.company && doc.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        vehicleText.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesVehicle = !filterVehicle || doc.vehicleId === filterVehicle;
      const matchesCompany = !filterCompany || doc.company === filterCompany;
      const matchesType = !filterType || doc.type === filterType;
      
      const matchesStatus = !filterStatus || getExpiryStatus(doc.validTo).status === filterStatus;
      
      return matchesSearch && matchesVehicle && matchesCompany && matchesType && matchesStatus;
    });
  }, [unifiedDocuments, searchQuery, filterVehicle, filterCompany, filterType, filterStatus, state.vehicles]);

  const handleAdd = () => {
    setEditingDocument(null);
    setOpenDialog(true);
  };

  const handleEdit = (doc: UnifiedDocument) => {
    // Transform UnifiedDocument to form data format
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
      filePath: doc.filePath
    };
    setEditingDocument(formData as any);
    setOpenDialog(true);
  };

  const handleDelete = async (doc: UnifiedDocument) => {
    if (window.confirm('Naozaj chcete vymazať tento dokument?')) {
      try {
        if (doc.type === 'insurance') {
          dispatch({ type: 'DELETE_INSURANCE', payload: doc.id });
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
    console.log('🔍 HANDLE SAVE START - Received data:', data);
    console.log('🔍 HANDLE SAVE START - FilePath in data:', data.filePath);
    console.log('🔍 HANDLE SAVE START - Editing document:', editingDocument);
    
    try {
      if (editingDocument) {
        if (editingDocument.type === 'insurance') {
          // Transform UnifiedDocument to Insurance format
          const insuranceData = {
            id: editingDocument.id || '',
            vehicleId: data.vehicleId,
            type: data.policyNumber ? 'Havarijné poistenie' : 'Poistenie',
            policyNumber: data.policyNumber || '',
            validFrom: data.validFrom || new Date(),
            validTo: data.validTo,
            price: data.price || 0,
            company: data.company || '',
            paymentFrequency: data.paymentFrequency || 'yearly',
            filePath: data.filePath
          };
          console.log('🔍 HANDLE SAVE - Updating insurance with data:', insuranceData);
          console.log('🔍 HANDLE SAVE - Insurance filePath:', insuranceData.filePath);
          await updateInsurance(insuranceData);
        } else {
          // Transform UnifiedDocument to VehicleDocument format
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
          console.log('🔍 HANDLE SAVE - Updating vehicle document with data:', vehicleDocData);
          console.log('🔍 HANDLE SAVE - Vehicle document filePath:', vehicleDocData.filePath);
          await updateVehicleDocument(vehicleDocData);
        }
      } else {
        if (data.type === 'insurance') {
          // Transform UnifiedDocument to Insurance format
          const insuranceData = {
            id: '', // Will be generated by backend
            vehicleId: data.vehicleId,
            type: data.policyNumber ? 'Havarijné poistenie' : 'Poistenie',
            policyNumber: data.policyNumber || '',
            validFrom: data.validFrom || new Date(),
            validTo: data.validTo,
            price: data.price || 0,
            company: data.company || '',
            paymentFrequency: data.paymentFrequency || 'yearly',
            filePath: data.filePath
          };
          console.log('🔍 HANDLE SAVE - Creating insurance with data:', insuranceData);
          console.log('🔍 HANDLE SAVE - Insurance filePath:', insuranceData.filePath);
          await createInsurance(insuranceData);
        } else {
          // Transform UnifiedDocument to VehicleDocument format
          const vehicleDocData = {
            id: '', // Will be generated by backend
            vehicleId: data.vehicleId,
            documentType: data.type,
            validFrom: data.validFrom,
            validTo: data.validTo,
            documentNumber: data.documentNumber,
            price: data.price,
            notes: data.notes,
            filePath: data.filePath
          };
          console.log('🔍 HANDLE SAVE - Creating vehicle document with data:', vehicleDocData);
          console.log('🔍 HANDLE SAVE - Vehicle document filePath:', vehicleDocData.filePath);
          await createVehicleDocument(vehicleDocData);
        }
      }
      console.log('🔍 HANDLE SAVE - Save completed successfully');
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Modern Header */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Poistky/STK/Dialničné
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Správa všetkých dokumentov vozidiel
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

      {/* Statistics Cards - only for Documents tab */}
      {activeTab === 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    CELKOM DOKUMENTOV
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total}
                  </Typography>
                </Box>
                <ReportIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    PLATNÉ
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.validDocs}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    VYPRŠÍ ČOSKORO
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.expiringDocs}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    VYPRŠANÉ
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.expiredDocs}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      )}

      {/* Search and Filters - only for Documents tab */}
      {activeTab === 0 && (
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: showFilters ? 2 : 0, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Vyhľadať dokument..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ flex: 1, minWidth: '250px' }}
            />
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Filtre {hasActiveFilters && `(${Object.values({ searchQuery, filterVehicle, filterCompany, filterType, filterStatus }).filter(Boolean).length})`}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                startIcon={<CloseIcon />}
                onClick={clearFilters}
                color="secondary"
                sx={{ whiteSpace: 'nowrap' }}
              >
                Zrušiť filtre
              </Button>
            )}
          </Box>

          {showFilters && (
            <>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
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
                  <FormControl fullWidth>
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
                  <FormControl fullWidth>
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
                  <FormControl fullWidth>
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

      {/* Tab Navigation */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem'
            }
          }}
        >
          <Tab label="Dokumenty" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Poistné udalosti" icon={<WarningIcon />} iconPosition="start" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Alerts for Documents */}
          {stats.expiredDocs > 0 && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              icon={<WarningIcon />}
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Pozor! {stats.expiredDocs} dokumentov už vypršalo
              </Typography>
            </Alert>
          )}

          {stats.expiringDocs > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              icon={<ScheduleIcon />}
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Upozornenie: {stats.expiringDocs} dokumentov vyprší do 30 dní
              </Typography>
            </Alert>
          )}

          {/* Documents Table */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Vozidlo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Typ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Číslo/Polisa</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Spoločnosť</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Platné do</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Stav</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cena</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Súbor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Akcie</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((doc) => {
                                     const vehicle = state.vehicles?.find(v => v.id === doc.vehicleId);
                  const expiryStatus = getExpiryStatus(doc.validTo);
                  const typeInfo = getDocumentTypeInfo(doc.type);
                  
                  return (
                    <TableRow key={`${doc.type}-${doc.id}`} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CarIcon sx={{ color: '#1976d2', fontSize: 18 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {vehicle?.licensePlate}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {typeInfo.icon}
                          <Typography variant="body2" sx={{ color: typeInfo.color, fontWeight: 600 }}>
                            {typeInfo.label}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {doc.policyNumber || doc.documentNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {doc.company || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(typeof doc.validTo === 'string' ? parseISO(doc.validTo) : doc.validTo, 'dd.MM.yyyy', { locale: sk })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expiryStatus.text}
                          color={expiryStatus.color as any}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {doc.price ? `€${doc.price.toFixed(2)}` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {doc.filePath ? (
                          <Tooltip title="Zobraziť súbor">
                            <IconButton
                              size="small"
                              onClick={() => window.open(doc.filePath, '_blank')}
                              sx={{ color: '#1976d2' }}
                            >
                              <FileIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Upraviť">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(doc)}
                              sx={{ color: '#1976d2' }}
                            >
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Vymazať">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(doc)}
                              sx={{ color: '#d32f2f' }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredDocuments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Riadkov na stránku:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}–${to} z ${count !== -1 ? count : `viac ako ${to}`}`
          }
        />
      </Card>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 6, mt: 3 }}>
          <CardContent>
            <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {hasActiveFilters ? 'Žiadne dokumenty nevyhovujú filtrom' : 'Žiadne dokumenty'}
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
        </>
      )}

      {/* Insurance Claims Tab */}
      {activeTab === 1 && (
        <InsuranceClaimList />
      )}

      {/* Document Form Dialog */}
      {activeTab === 0 && (
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="lg"
          fullWidth
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