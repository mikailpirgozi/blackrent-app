import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  TableSortLabel,
  Collapse,
  Tooltip,
  TableFooter,
  CircularProgress,
  Grid,
  Fade,
  Alert,
  Divider,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  History as HistoryIcon,
  WarningAmber as WarningAmberIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Assignment as HandoverProtocolIcon,
  AssignmentReturn as ReturnProtocolIcon,
  AssignmentTurnedIn as ProtocolCompleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Rental, PaymentMethod, Vehicle } from '../../types';
import { format, differenceInCalendarDays, isAfter, isBefore } from 'date-fns';
import RentalForm from './RentalForm';
import HandoverProtocolForm from '../protocols/HandoverProtocolForm';
import ReturnProtocolForm from '../protocols/ReturnProtocolForm';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import useMediaQuery from '@mui/material/useMediaQuery';
import Fab from '@mui/material/Fab';

type SortField = 'vehicle' | 'company' | 'customerName' | 'startDate' | 'endDate' | 'totalPrice' | 'commission' | 'paymentMethod' | 'paid' | 'status';
type SortDirection = 'asc' | 'desc';

const getPaymentMethodText = (method: PaymentMethod) => {
  switch (method) {
    case 'cash':
      return 'Hotovosť';
    case 'bank_transfer':
      return 'Bankový prevod';
    case 'vrp':
      return 'VRP';
    case 'direct_to_owner':
      return 'Priamo majiteľovi';
    default:
      return method;
  }
};

const getPaymentMethodColor = (method: PaymentMethod) => {
  switch (method) {
    case 'cash':
      return 'success';
    case 'bank_transfer':
      return 'primary';
    case 'vrp':
      return 'info';
    case 'direct_to_owner':
      return 'warning';
    default:
      return 'default';
  }
};

const getRentalStatus = (rental: Rental) => {
  const now = new Date();
  const startDate = rental.startDate instanceof Date ? rental.startDate : new Date(rental.startDate);
  const endDate = rental.endDate instanceof Date ? rental.endDate : new Date(rental.endDate);
  
  if (isAfter(now, endDate)) {
    if (rental.paid && rental.confirmed) {
      return { label: 'Prenájom ukončený', color: 'success' as const };
    } else if (rental.paid && !rental.confirmed) {
      return { label: 'Čaká na potvrdenie', color: 'warning' as const };
    } else {
      return { label: 'Nezaplatený ukončený', color: 'error' as const };
    }
  } else if (isBefore(now, startDate)) {
    return { label: 'Budúci prenájom', color: 'info' as const };
  } else {
    return { label: 'Aktívny prenájom', color: 'primary' as const };
  }
};

export default function RentalListNew() {
  const { state, dispatch, createRental, updateRental, deleteRental } = useApp();
  const isMobile = useMediaQuery('(max-width:768px)');
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterPaid, setFilterPaid] = useState('');
  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selected, setSelected] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRental, setHistoryRental] = useState<Rental | null>(null);
  const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);
  const [protocolType, setProtocolType] = useState<'handover' | 'return'>('handover');
  const [protocolRental, setProtocolRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [fileInputRef] = useState(React.useRef<HTMLInputElement>(null));

  // Helper functions
  const formatPrice = useCallback((price: number | string | undefined): string => {
    if (typeof price === 'number') return price.toFixed(2);
    return (parseFloat(price as string) || 0).toFixed(2);
  }, []);

  const formatDate = useCallback((date: Date | string): string => {
    const d = date instanceof Date ? date : new Date(date);
    return !isNaN(d.getTime()) ? format(d, 'dd.MM.yyyy') : 'Neplatný dátum';
  }, []);

  // Filtered and sorted rentals
  const filteredRentals = useMemo(() => {
    let filtered = state.rentals;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rental => 
        rental.customerName?.toLowerCase().includes(term) ||
        rental.vehicle?.licensePlate?.toLowerCase().includes(term) ||
        rental.vehicle?.company?.toLowerCase().includes(term) ||
        rental.vehicle?.brand?.toLowerCase().includes(term) ||
        rental.vehicle?.model?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(rental => {
        const status = getRentalStatus(rental);
        return status.label.toLowerCase().includes(filterStatus.toLowerCase());
      });
    }

    // Payment method filter
    if (filterPaymentMethod) {
      filtered = filtered.filter(rental => rental.paymentMethod === filterPaymentMethod);
    }

    // Paid filter
    if (filterPaid) {
      filtered = filtered.filter(rental => {
        if (filterPaid === 'paid') return rental.paid;
        if (filterPaid === 'unpaid') return !rental.paid;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'vehicle':
          aValue = `${a.vehicle?.brand} ${a.vehicle?.model}`;
          bValue = `${b.vehicle?.brand} ${b.vehicle?.model}`;
          break;
        case 'company':
          aValue = a.vehicle?.company;
          bValue = b.vehicle?.company;
          break;
        case 'customerName':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        case 'startDate':
          aValue = a.startDate;
          bValue = b.startDate;
          break;
        case 'endDate':
          aValue = a.endDate;
          bValue = b.endDate;
          break;
        case 'totalPrice':
          aValue = a.totalPrice;
          bValue = b.totalPrice;
          break;
        case 'commission':
          aValue = a.commission;
          bValue = b.commission;
          break;
        case 'paymentMethod':
          aValue = a.paymentMethod;
          bValue = b.paymentMethod;
          break;
        case 'paid':
          aValue = a.paid;
          bValue = b.paid;
          break;
        default:
          aValue = a.startDate;
          bValue = b.startDate;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [state.rentals, searchTerm, filterStatus, filterPaymentMethod, filterPaid, sortField, sortDirection]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(filteredRentals.map(r => r.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelected(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (window.confirm(`Naozaj chcete vymazať ${selected.length} označených prenájmov?`)) {
      setIsLoading(true);
      try {
        for (const id of selected) {
          await deleteRental(id);
        }
        setSelected([]);
        setSuccessMessage(`${selected.length} prenájmov bolo úspešne vymazaných`);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } catch (error) {
        console.error('Chyba pri hromadnom mazaní prenájmov:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = async (rental: Rental) => {
    setIsLoading(true);
    try {
      if (editingRental) {
        await updateRental(rental);
        setSuccessMessage('Prenájom bol úspešne upravený');
      } else {
        await createRental(rental);
        setSuccessMessage('Prenájom bol úspešne vytvorený');
      }
      setShowForm(false);
      setEditingRental(null);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Chyba pri ukladaní prenájmu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDetail = (rental: Rental) => {
    setSelectedRental(rental);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedRental(null);
  };

  const handleShowHistory = (rental: Rental) => {
    setHistoryRental(rental);
    setShowHistory(true);
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setHistoryRental(null);
  };

  const handleCreateHandoverProtocol = (rental: Rental) => {
    setProtocolRental(rental);
    setProtocolType('handover');
    setProtocolDialogOpen(true);
  };

  const handleCreateReturnProtocol = (rental: Rental) => {
    setProtocolRental(rental);
    setProtocolType('return');
    setProtocolDialogOpen(true);
  };

  const handleCloseProtocolDialog = () => {
    setProtocolDialogOpen(false);
    setProtocolRental(null);
  };

  const handleProtocolSubmit = async (protocolData: any) => {
    try {
      // Handle protocol submission
      console.log('Protocol submitted:', protocolData);
      setProtocolDialogOpen(false);
      setSuccessMessage('Protokol bol úspešne vytvorený');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Chyba pri vytváraní protokolu:', error);
    }
  };

  // Export function
  const exportRentalsToCSV = (rentals: Rental[]) => {
    const csvData = rentals.map(rental => ({
      id: rental.id,
      licensePlate: rental.vehicle?.licensePlate || '',
      company: rental.vehicle?.company || '',
      brand: rental.vehicle?.brand || '',
      model: rental.vehicle?.model || '',
      customerName: rental.customerName || '',
      customerEmail: rental.customer?.email || '',
      startDate: rental.startDate ? new Date(rental.startDate).toISOString() : '',
      endDate: rental.endDate ? new Date(rental.endDate).toISOString() : '',
      totalPrice: rental.totalPrice || 0,
      commission: rental.commission || 0,
      paymentMethod: rental.paymentMethod || '',
      paid: rental.paid ? 'true' : 'false',
      status: getRentalStatus(rental).label,
      handoverPlace: rental.handoverPlace || '',
      orderNumber: rental.orderNumber || '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `prenajmy_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Render functions
  const renderRentalCard = (rental: Rental) => (
    <Fade in={true} timeout={500}>
      <Card 
        key={rental.id} 
        sx={{ 
          mb: 2, 
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          }
        }}
        onClick={() => handleShowDetail(rental)}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {rental.customerName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CarIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {rental.vehicle?.licensePlate} • {rental.vehicle?.company}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <Chip 
                label={getRentalStatus(rental).label} 
                color={getRentalStatus(rental).color}
                size="small"
              />
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {formatPrice(rental.totalPrice)} €
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Od</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(rental.startDate)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Do</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatDate(rental.endDate)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={getPaymentMethodText(rental.paymentMethod)} 
                color={getPaymentMethodColor(rental.paymentMethod) as any}
                size="small"
                variant="outlined"
              />
              <Chip 
                label={rental.paid ? 'Zaplatené' : 'Nezaplatené'} 
                color={rental.paid ? 'success' : 'error'} 
                size="small"
                variant="outlined"
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingRental(rental); setShowForm(true); }}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleShowHistory(rental); }}>
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  const renderRentalRow = (rental: Rental) => (
    <TableRow 
      key={rental.id} 
      selected={selected.includes(rental.id)}
      sx={{ cursor: 'pointer' }}
      onClick={() => handleShowDetail(rental)}
    >
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected.includes(rental.id)}
          onChange={(e) => { e.stopPropagation(); handleSelectOne(rental.id, e.target.checked); }}
        />
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {rental.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : 'Bez vozidla'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {rental.vehicle?.licensePlate || 'N/A'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>{rental.vehicle?.company || 'N/A'}</TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {rental.customerName}
          </Typography>
          {rental.customer && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              {rental.customer.phone && (
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); window.open(`tel:${rental.customer!.phone}`, '_blank'); }}
                  sx={{ p: 0.5, minWidth: 'auto' }}
                >
                  <PhoneIcon fontSize="small" />
                </IconButton>
              )}
              {rental.customer.email && (
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); window.open(`mailto:${rental.customer!.email}`, '_blank'); }}
                  sx={{ p: 0.5, minWidth: 'auto' }}
                >
                  <EmailIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
      </TableCell>
      <TableCell>{formatDate(rental.startDate)}</TableCell>
      <TableCell>{formatDate(rental.endDate)}</TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight="bold">
          {formatPrice(rental.totalPrice)} €
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="warning.main">
          {formatPrice(rental.commission)} €
        </Typography>
      </TableCell>
      <TableCell>
        {rental.paymentMethod ? (
          <Chip
            label={getPaymentMethodText(rental.paymentMethod)}
            color={getPaymentMethodColor(rental.paymentMethod) as any}
            size="small"
            variant="outlined"
          />
        ) : (
          'N/A'
        )}
      </TableCell>
      <TableCell>
        <Chip 
          label={rental.paid ? 'Zaplatené' : 'Nezaplatené'} 
          color={rental.paid ? 'success' : 'error'} 
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Chip 
          label={getRentalStatus(rental).label} 
          color={getRentalStatus(rental).color}
          size="small"
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingRental(rental); setShowForm(true); }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleShowHistory(rental); }}>
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );

  const renderSortableHeader = (field: SortField, label: string) => (
    <TableCell>
      <TableSortLabel
        active={sortField === field}
        direction={sortField === field ? sortDirection : 'asc'}
        onClick={() => handleSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  // Loading state
  if (state.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Načítavam prenájmy...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* Success Message */}
      <Collapse in={showSuccessMessage}>
        <Alert 
          severity="success" 
          sx={{ mb: 2 }} 
          onClose={() => setShowSuccessMessage(false)}
        >
          {successMessage}
        </Alert>
      </Collapse>

      {/* Modern Header */}
      <Card sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <ReceiptIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  Prenájmy
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {state.rentals.length} celkovo • {state.rentals.filter(r => getRentalStatus(r).label === 'Aktívny prenájom').length} aktívnych
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportRentalsToCSV(filteredRentals)}
                size="small"
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingRental(null);
                  setShowForm(true);
                }}
                size="small"
              >
                Nový prenájom
              </Button>
            </Box>
          </Box>

          {/* Search and Filters */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Hľadať prenájmy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon />
                  </IconButton>
                ),
              }}
              sx={{ minWidth: 250, flexGrow: 1 }}
            />
            
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              size="small"
            >
              Filtre
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterPaymentMethod('');
                setFilterPaid('');
              }}
              size="small"
            >
              Reset
            </Button>
          </Box>

          {/* Advanced Filters */}
          <Collapse in={showFilters}>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      <MenuItem value="aktívny">Aktívne</MenuItem>
                      <MenuItem value="ukončený">Ukončené</MenuItem>
                      <MenuItem value="budúci">Budúce</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Spôsob platby</InputLabel>
                    <Select
                      value={filterPaymentMethod}
                      onChange={(e) => setFilterPaymentMethod(e.target.value)}
                      label="Spôsob platby"
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      <MenuItem value="cash">Hotovosť</MenuItem>
                      <MenuItem value="card">Karta</MenuItem>
                      <MenuItem value="transfer">Bankový prevod</MenuItem>
                      <MenuItem value="invoice">Faktúra</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Platba</InputLabel>
                    <Select
                      value={filterPaid}
                      onChange={(e) => setFilterPaid(e.target.value)}
                      label="Platba"
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      <MenuItem value="paid">Zaplatené</MenuItem>
                      <MenuItem value="unpaid">Nezaplatené</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Zobrazenie</InputLabel>
                    <Select
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value as 'table' | 'cards')}
                      label="Zobrazenie"
                    >
                      <MenuItem value="table">Tabuľka</MenuItem>
                      <MenuItem value="cards">Karty</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <Card sx={{ mb: 2, backgroundColor: 'warning.light' }}>
          <CardContent sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                {selected.length} prenájmov označených
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleDeleteSelected}
                disabled={isLoading}
              >
                Vymazať označené
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {viewMode === 'cards' ? (
        <Grid container spacing={2}>
          {filteredRentals.map(renderRentalCard)}
        </Grid>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.length === filteredRentals.length && filteredRentals.length > 0}
                    indeterminate={selected.length > 0 && selected.length < filteredRentals.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                {renderSortableHeader('vehicle', 'Vozidlo')}
                {renderSortableHeader('company', 'Firma')}
                {renderSortableHeader('customerName', 'Zákazník')}
                {renderSortableHeader('startDate', 'Od')}
                {renderSortableHeader('endDate', 'Do')}
                {renderSortableHeader('totalPrice', 'Cena')}
                {renderSortableHeader('commission', 'Provízia')}
                {renderSortableHeader('paymentMethod', 'Platba')}
                {renderSortableHeader('paid', 'Stav')}
                {renderSortableHeader('status', 'Status')}
                <TableCell>Akcie</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRentals.map(renderRentalRow)}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Empty State */}
      {filteredRentals.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Žiadne prenájmy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {searchTerm || filterStatus || filterPaymentMethod || filterPaid 
                ? 'Neboli nájdené žiadne prenájmy s vybranými filtrami'
                : 'Zatiaľ neboli vytvorené žiadne prenájmy'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingRental(null);
                setShowForm(true);
              }}
            >
              Vytvoriť prvý prenájom
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {showForm && (
        <Dialog 
          open={showForm} 
          onClose={() => setShowForm(false)} 
          maxWidth="lg" 
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            {editingRental ? 'Upraviť prenájom' : 'Nový prenájom'}
          </DialogTitle>
          <DialogContent>
            <RentalForm
              rental={editingRental}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => {
            setEditingRental(null);
            setShowForm(true);
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
} 