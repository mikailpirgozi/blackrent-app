import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  useMediaQuery,
  useTheme,

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
  FormGroup,
  Tabs,
  Tab,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  DirectionsCar as CarIcon,
  Build as MaintenanceIcon,
  CheckCircle as AvailableIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useApp } from '../../context/AppContext';
import { Vehicle, VehicleStatus, VehicleCategory } from '../../types';
import { Can } from '../common/PermissionGuard';
import VehicleForm from './VehicleForm';
import { apiService } from '../../services/api';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { getApiBaseUrl } from '../../utils/apiUrl';
import { EnhancedLoading } from '../common/EnhancedLoading';
import CompanyDocumentManager from '../companies/CompanyDocumentManager';

// 🆕 OWNER CARD COMPONENT - Rozbaliteľná karta majiteľa s vozidlami
interface OwnerCardProps {
  company: any; // Company type
  vehicles: Vehicle[];
  onVehicleUpdate: (vehicleId: string, companyId: string) => Promise<void>;
  onVehicleEdit: (vehicle: Vehicle) => void;
}

// 🤝 INVESTOR CARD COMPONENT - Rozbaliteľná karta spoluinvestora s podielmi
interface InvestorCardProps {
  investor: any; // CompanyInvestor type
  shares: any[]; // CompanyInvestorShare[]
  companies: any[]; // Company[]
  onShareUpdate: () => void;
  onAssignShare: (investor: any) => void;
}

const InvestorCard: React.FC<InvestorCardProps> = ({ investor, shares, companies, onShareUpdate, onAssignShare }) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    firstName: investor.firstName || '',
    lastName: investor.lastName || '',
    email: investor.email || '',
    phone: investor.phone || '',
    notes: investor.notes || ''
  });

  const handleSaveInvestorData = async () => {
    try {
      console.log('💾 Saving investor data:', investor.id, editData);
      
      const response = await fetch(`${getApiBaseUrl()}/company-investors/${investor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        },
        body: JSON.stringify(editData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Investor data saved successfully');
        setEditMode(false);
        onShareUpdate(); // Refresh data
      } else {
        console.error('❌ Failed to save investor data:', result.error);
        alert(`Chyba pri ukladaní: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving investor data:', error);
      alert('Chyba pri ukladaní údajov investora');
    }
  };

  const totalOwnership = shares.reduce((sum, share) => sum + share.ownershipPercentage, 0);

  return (
    <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
      {/* Header - Investor info */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: 'grey.50',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'grey.100' }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              👤 {investor.firstName} {investor.lastName}
              <Chip 
                label={`${shares.length} firiem • ${totalOwnership.toFixed(1)}% celkom`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Typography>
            
            <Box sx={{ mt: 1, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {investor.email && (
                <Typography variant="body2" color="text.secondary">
                  📧 {investor.email}
                </Typography>
              )}
              {investor.phone && (
                <Typography variant="body2" color="text.secondary">
                  📞 {investor.phone}
                </Typography>
              )}
              {shares.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  🏢 {shares.map(s => {
                    const company = companies.find(c => c.id === s.companyId);
                    return `${company?.name} (${s.ownershipPercentage}%)`;
                  }).join(', ')}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEditMode(!editMode);
              }}
              sx={{ bgcolor: editMode ? 'primary.main' : 'transparent', color: editMode ? 'white' : 'primary.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              {expanded ? '🔽' : '▶️'}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Edit Mode */}
      <Collapse in={editMode}>
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ✏️ Úprava spoluinvestora
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Meno"
                value={editData.firstName}
                onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={editData.lastName}
                onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefón"
                value={editData.phone}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Poznámky"
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                size="small"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => setEditMode(false)}
              size="small"
            >
              Zrušiť
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveInvestorData}
              size="small"
            >
              💾 Uložiť
            </Button>
          </Box>
        </Box>
      </Collapse>

      {/* Podiely vo firmách - Rozbaliteľné */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            💼 Podiely vo firmách ({shares.length})
          </Typography>
          
          {shares.length > 0 ? shares.map((share) => {
            const company = companies.find(c => c.id === share.companyId);
            return (
              <Box
                key={share.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">
                    🏢 {company?.name || 'Neznáma firma'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    💰 Podiel: {share.ownershipPercentage}%
                    {share.investmentAmount && ` • Investícia: ${share.investmentAmount}€`}
                    {share.isPrimaryContact && ' • Primárny kontakt'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${share.ownershipPercentage}%`}
                    color="primary"
                    size="small"
                    variant={share.isPrimaryContact ? 'filled' : 'outlined'}
                  />
                </Box>
              </Box>
            );
          }) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Žiadne podiely vo firmách. Investor nie je priradený k žiadnej firme.
            </Typography>
          )}
          
          {/* Tlačidlo pre pridanie nového podielu */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onAssignShare(investor)}
            >
              🏢 Priradiť k firme
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

const OwnerCard: React.FC<OwnerCardProps> = ({ company, vehicles, onVehicleUpdate, onVehicleEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [companyInvestors, setCompanyInvestors] = useState<any[]>([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);
  const [editData, setEditData] = useState({
    name: company.name || '',
    ownerName: company.ownerName || '',
    personalIban: company.personalIban || '',
    businessIban: company.businessIban || '',
    contactEmail: company.contactEmail || '',
    contactPhone: company.contactPhone || '',
    defaultCommissionRate: company.defaultCommissionRate || 20,
    protocolDisplayName: company.protocolDisplayName || ''
  });

  // 🔄 Aktualizuj editData keď sa company data zmenia
  useEffect(() => {
    setEditData({
      name: company.name || '',
      ownerName: company.ownerName || '',
      personalIban: company.personalIban || '',
      businessIban: company.businessIban || '',
      contactEmail: company.contactEmail || '',
      contactPhone: company.contactPhone || '',
      defaultCommissionRate: company.defaultCommissionRate || 20,
      protocolDisplayName: company.protocolDisplayName || ''
    });
  }, [company]);

  // 🤝 Načítanie investorov firmy
  const loadCompanyInvestors = async () => {
    try {
      setLoadingInvestors(true);
      
      const response = await fetch(`${getApiBaseUrl()}/company-investors/${company.id}/shares`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setCompanyInvestors(result.data);
      }
    } catch (error) {
      console.error('❌ Error loading company investors:', error);
    } finally {
      setLoadingInvestors(false);
    }
  };

  // Načítaj investorov pri rozbalení karty
  useEffect(() => {
    if (expanded) {
      loadCompanyInvestors();
    }
  }, [expanded]);

  const handleSaveOwnerData = async () => {
    try {
      console.log('💾 Saving owner data for company:', company.id, editData);
      
      const response = await fetch(`${getApiBaseUrl()}/companies/${company.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        },
        body: JSON.stringify(editData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Owner data saved successfully');
        setEditMode(false);
        // Refresh companies data cez callback
        if (onVehicleUpdate) {
          await onVehicleUpdate('', company.id); // Refresh company data
        }
      } else {
        console.error('❌ Failed to save owner data:', result.error);
        alert(`Chyba pri ukladaní: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving owner data:', error);
      alert('Chyba pri ukladaní údajov majiteľa');
    }
  };

  return (
    <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
      {/* Header - Majiteľ info */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: 'grey.50',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'grey.100' }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" />
              {company.name}
              <Chip 
                label={`${vehicles.length} vozidiel`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Typography>
            
            {/* Základné info o majiteľovi */}
            <Box sx={{ mt: 1, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {company.ownerName && (
                <Typography variant="body2" color="text.secondary">
                  👤 {company.ownerName}
                </Typography>
              )}
              {company.contactEmail && (
                <Typography variant="body2" color="text.secondary">
                  📧 {company.contactEmail}
                </Typography>
              )}
              {company.contactPhone && (
                <Typography variant="body2" color="text.secondary">
                  📞 {company.contactPhone}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                💰 Provízia: {company.defaultCommissionRate || 20}%
              </Typography>
              {company.protocolDisplayName && (
                <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'medium' }}>
                  📄 Fakturačná firma: {company.protocolDisplayName}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEditMode(!editMode);
              }}
              sx={{ bgcolor: editMode ? 'primary.main' : 'transparent', color: editMode ? 'white' : 'primary.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              {expanded ? '🔽' : '▶️'}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Edit Mode - Rozšírené informácie */}
      <Collapse in={editMode}>
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ✏️ Úprava informácií majiteľa
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov firmy/s.r.o."
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                size="small"
                required
                sx={{ bgcolor: 'primary.50' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Meno a priezvisko majiteľa"
                value={editData.ownerName}
                onChange={(e) => setEditData(prev => ({ ...prev, ownerName: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kontaktný email"
                type="email"
                value={editData.contactEmail}
                onChange={(e) => setEditData(prev => ({ ...prev, contactEmail: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kontaktný telefón"
                value={editData.contactPhone}
                onChange={(e) => setEditData(prev => ({ ...prev, contactPhone: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default provízia (%)"
                type="number"
                value={editData.defaultCommissionRate}
                onChange={(e) => setEditData(prev => ({ ...prev, defaultCommissionRate: parseFloat(e.target.value) || 20 }))}
                size="small"
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Súkromný IBAN"
                value={editData.personalIban}
                onChange={(e) => setEditData(prev => ({ ...prev, personalIban: e.target.value }))}
                size="small"
                placeholder="SK89 0000 0000 0000 0000 0000"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Firemný IBAN"
                value={editData.businessIban}
                onChange={(e) => setEditData(prev => ({ ...prev, businessIban: e.target.value }))}
                size="small"
                placeholder="SK89 0000 0000 0000 0000 0000"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fakturačná firma (pre protokoly)"
                value={editData.protocolDisplayName}
                onChange={(e) => setEditData(prev => ({ ...prev, protocolDisplayName: e.target.value }))}
                size="small"
                placeholder="Napr. P2 invest s.r.o."
                helperText="Názov firmy ktorý sa zobrazí na protokoloch namiesto interného názvu"
                sx={{ bgcolor: 'warning.50' }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => setEditMode(false)}
              size="small"
            >
              Zrušiť
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveOwnerData}
              size="small"
            >
              💾 Uložiť
            </Button>
          </Box>
        </Box>
      </Collapse>

      {/* Vozidlá majiteľa - Rozbaliteľné */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            🚗 Vozidlá majiteľa ({vehicles.length})
          </Typography>
          
          {vehicles.map((vehicle) => (
            <Box
              key={vehicle.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                mb: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">
                  {vehicle.brand} {vehicle.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ŠPZ: {vehicle.licensePlate}
                  {vehicle.year && ` • Rok: ${vehicle.year}`}
                </Typography>
                
                {/* Individuálna provízia vozidla */}
                <Typography variant="caption" color="text.secondary">
                  Provízia: {vehicle.commission?.value || company.defaultCommissionRate || 20}%
                  {vehicle.commission?.value !== company.defaultCommissionRate && (
                    <Chip label="Vlastná" size="small" sx={{ ml: 1, height: 16 }} />
                  )}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={getStatusText(vehicle.status)}
                  color={getStatusColor(vehicle.status)}
                  size="small"
                />
                
                {/* Quick actions */}
                <Can update="vehicles" context={{ resourceOwnerId: vehicle.assignedMechanicId, resourceCompanyId: vehicle.ownerCompanyId }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVehicleEdit(vehicle);
                    }}
                    sx={{ 
                      bgcolor: '#2196f3', 
                      color: 'white',
                      width: 28,
                      height: 28,
                      '&:hover': { bgcolor: '#1976d2' }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Can>
              </Box>
            </Box>
          ))}

          {/* Spoluinvestori firmy */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              🤝 Spoluinvestori firmy
            </Typography>
            
            {loadingInvestors ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <EnhancedLoading variant="page" showMessage={true} message="Načítavam investorov..." />
              </Box>
            ) : companyInvestors.length > 0 ? (
              companyInvestors.map((share) => (
                <Box
                  key={share.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'primary.50',
                    '&:hover': {
                      bgcolor: 'primary.100'
                    }
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">
                      👤 {share.investor?.firstName} {share.investor?.lastName}
                      {share.isPrimaryContact && (
                        <Chip label="Primárny kontakt" size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {share.investor?.email && `📧 ${share.investor.email}`}
                      {share.investor?.phone && ` • 📞 ${share.investor.phone}`}
                    </Typography>
                    {share.investmentAmount && (
                      <Typography variant="caption" color="text.secondary">
                        💰 Investícia: {share.investmentAmount}€
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${share.ownershipPercentage}%`}
                      color="primary"
                      size="small"
                      variant={share.isPrimaryContact ? 'filled' : 'outlined'}
                    />
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Žiadni spoluinvestori pre túto firmu.
              </Typography>
            )}
          </Box>

          {/* 📄 NOVÉ: Dokumenty majiteľa */}
          <CompanyDocumentManager 
            companyId={company.id}
            companyName={company.name}
          />
        </Box>
      </Collapse>
    </Card>
  );
};

const getStatusColor = (status: VehicleStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'available': return 'success';
    case 'rented': return 'warning';
    case 'maintenance': return 'error';
    case 'temporarily_removed': return 'info';
    case 'removed': return 'default';
    case 'transferred': return 'secondary';
    default: return 'default';
  }
};

const getStatusBgColor = (status: VehicleStatus) => {
  switch (status) {
    case 'available': return '#4caf50';
    case 'rented': return '#ff9800';
    case 'maintenance': return '#f44336';
    case 'temporarily_removed': return '#2196f3';
    case 'removed': return '#666';
    case 'transferred': return '#9c27b0';
    default: return '#666';
  }
};

const getStatusText = (status: VehicleStatus) => {
  switch (status) {
    case 'available': return 'Dostupné';
    case 'rented': return 'Prenajaté';
    case 'maintenance': return 'Údržba';
    case 'temporarily_removed': return 'Dočasne vyradené';
    case 'removed': return 'Vyradené';
    case 'transferred': return 'Prepisané';
    default: return status;
  }
};

const getStatusIcon = (status: VehicleStatus) => {
  switch (status) {
    case 'available': return <AvailableIcon fontSize="small" />;
    case 'rented': return <CarIcon fontSize="small" />;
    case 'maintenance': return <MaintenanceIcon fontSize="small" />;
    case 'temporarily_removed': return <InfoIcon fontSize="small" />;
    case 'removed': return <ErrorIcon fontSize="small" />;
    case 'transferred': return <BusinessIcon fontSize="small" />;
    default: return <CarIcon fontSize="small" />;
  }
};

export default function VehicleListNew() {
  const { state, createVehicle, updateVehicle, deleteVehicle, getFullyFilteredVehicles } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // States
  const [currentTab, setCurrentTab] = useState(0); // 🆕 Tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 🚀 INFINITE SCROLL STATES
  const [displayedVehicles, setDisplayedVehicles] = useState(20); // Start with 20 items
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // ✅ NOVÉ: State pre hromadné mazanie
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filters
  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState<VehicleCategory | 'all'>('all'); // 🚗 Category filter
  const [showAvailable, setShowAvailable] = useState(true);
  const [showRented, setShowRented] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [showOther, setShowOther] = useState(true);
  const [ownershipHistoryDialog, setOwnershipHistoryDialog] = useState(false);
  const [selectedVehicleHistory, setSelectedVehicleHistory] = useState<Vehicle | null>(null);
  const [ownershipHistory, setOwnershipHistory] = useState<any[]>([]);
  
  // 🆕 State pre vytvorenie novej firmy
  const [createCompanyDialogOpen, setCreateCompanyDialogOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    ownerName: '',
    personalIban: '',
    businessIban: '',
    contactEmail: '',
    contactPhone: '',
    defaultCommissionRate: 20,
    isActive: true
  });

  // 🤝 State pre spoluinvestorov
  const [createInvestorDialogOpen, setCreateInvestorDialogOpen] = useState(false);
  const [investors, setInvestors] = useState<any[]>([]);
  const [investorShares, setInvestorShares] = useState<any[]>([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);
  const [assignShareDialogOpen, setAssignShareDialogOpen] = useState(false);
  const [selectedInvestorForShare, setSelectedInvestorForShare] = useState<any>(null);
  const [newShareData, setNewShareData] = useState({
    companyId: '',
    ownershipPercentage: 0,
    investmentAmount: 0,
    isPrimaryContact: false
  });
  const [newInvestorData, setNewInvestorData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Handlers
  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setOpenDialog(true);
  };

  // 🏢 Handler pre vytvorenie novej firmy
  const handleCreateCompany = async () => {
    try {
      console.log('🏢 Creating new company:', newCompanyData);
      
      const response = await fetch(`${getApiBaseUrl()}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        },
        body: JSON.stringify(newCompanyData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Company created successfully');
        setCreateCompanyDialogOpen(false);
        setNewCompanyData({
          name: '',
          ownerName: '',
          personalIban: '',
          businessIban: '',
          contactEmail: '',
          contactPhone: '',
          defaultCommissionRate: 20,
          isActive: true
        });
        // Refresh companies data
        window.location.reload();
      } else {
        console.error('❌ Failed to create company:', result.error);
        alert(`Chyba pri vytváraní firmy: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating company:', error);
      alert('Chyba pri vytváraní firmy');
    }
  };

  // 🤝 Handler pre vytvorenie spoluinvestora
  const handleCreateInvestor = async () => {
    try {
      console.log('🤝 Creating new investor:', newInvestorData);
      
      const response = await fetch(`${getApiBaseUrl()}/company-investors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        },
        body: JSON.stringify(newInvestorData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Investor created successfully');
        setCreateInvestorDialogOpen(false);
        setNewInvestorData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          notes: ''
        });
        // Refresh data
        window.location.reload();
      } else {
        console.error('❌ Failed to create investor:', result.error);
        alert(`Chyba pri vytváraní spoluinvestora: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating investor:', error);
      alert('Chyba pri vytváraní spoluinvestora');
    }
  };

  // 🤝 Načítanie spoluinvestorov
  const loadInvestors = async () => {
    try {
      setLoadingInvestors(true);
      
      const response = await fetch(`${getApiBaseUrl()}/company-investors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setInvestors(result.data);
        
        // Načítaj shares pre všetkých investorov
        const allShares = [];
        for (const company of state.companies || []) {
          const sharesResponse = await fetch(`${getApiBaseUrl()}/company-investors/${company.id}/shares`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
            }
          });
          const sharesResult = await sharesResponse.json();
          if (sharesResult.success) {
            allShares.push(...sharesResult.data);
          }
        }
        setInvestorShares(allShares);
      }
    } catch (error) {
      console.error('❌ Error loading investors:', error);
    } finally {
      setLoadingInvestors(false);
    }
  };

  // Načítaj investorov pri zmene tabu
  useEffect(() => {
    if (currentTab === 2) {
      loadInvestors();
    }
  }, [currentTab]);

  // 🤝 Handler pre priradenie podielu
  const handleAssignShare = async () => {
    try {
      console.log('🤝 Assigning share:', newShareData);
      
      const response = await fetch(`${getApiBaseUrl()}/company-investors/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        },
        body: JSON.stringify({
          ...newShareData,
          investorId: selectedInvestorForShare.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Share assigned successfully');
        setAssignShareDialogOpen(false);
        setSelectedInvestorForShare(null);
        setNewShareData({
          companyId: '',
          ownershipPercentage: 0,
          investmentAmount: 0,
          isPrimaryContact: false
        });
        loadInvestors(); // Refresh data
      } else {
        console.error('❌ Failed to assign share:', result.error);
        alert(`Chyba pri priradzovaní podielu: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error assigning share:', error);
      alert('Chyba pri priradzovaní podielu');
    }
  };

  const handleShowOwnershipHistory = async (vehicle: Vehicle) => {
    try {
      setSelectedVehicleHistory(vehicle);
      // Použijem fetch API namiesto private request metódy
      const token = localStorage.getItem('token');
      const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/vehicles/${vehicle.id}/ownership-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setOwnershipHistory(data.data.ownershipHistory || []);
      setOwnershipHistoryDialog(true);
    } catch (error) {
      console.error('Error fetching ownership history:', error);
      alert('Chyba pri načítaní histórie transferov');
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (window.confirm('Naozaj chcete vymazať toto vozidlo?')) {
      try {
        setLoading(true);
        await deleteVehicle(vehicleId);
      } catch (error) {
        console.error('Error deleting vehicle:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVehicle(null);
  };

  const handleSubmit = async (vehicleData: Vehicle) => {
    try {
      setLoading(true);
      if (editingVehicle) {
        await updateVehicle(vehicleData);
      } else {
        await createVehicle(vehicleData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Tab handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // 👤 Save owner name - REMOVED (ownerName field no longer exists)

  // 🏢 Save company
  const handleSaveCompany = async (vehicleId: string, companyId: string) => {
    try {
      const vehicle = filteredVehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const updatedVehicle = { ...vehicle, ownerCompanyId: companyId };
      await updateVehicle(updatedVehicle);
      console.log('✅ Company saved:', companyId, 'for vehicle:', vehicleId);
    } catch (error) {
      console.error('❌ Error saving company:', error);
    }
  };



  // 🚀 ENHANCED: Filtered vehicles using new unified filter system
  const filteredVehicles = useMemo(() => {
    return getFullyFilteredVehicles({
      search: searchQuery,
      brand: filterBrand,
      model: filterModel,
      company: filterCompany,
      status: filterStatus as any, // Type casting for backwards compatibility
      category: filterCategory,
      // Status group filters (backwards compatibility)
      showAvailable,
      showRented,
      showMaintenance,
      showOther
    });
  }, [
    searchQuery,
    filterBrand,
    filterModel,
    filterCompany,
    filterStatus,
    filterCategory,
    showAvailable,
    showRented,
    showMaintenance,
    showOther,
    getFullyFilteredVehicles // 🎯 Enhanced filter function
  ]);

  // 🚀 INFINITE SCROLL LOGIC (after filteredVehicles definition)
  const loadMoreVehicles = useCallback(() => {
    if (isLoadingMore || displayedVehicles >= filteredVehicles.length) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedVehicles(prev => Math.min(prev + 20, filteredVehicles.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, displayedVehicles, filteredVehicles.length]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedVehicles(20);
  }, [searchQuery, filterBrand, filterModel, filterCompany, filterStatus, filterCategory, showAvailable, showRented, showMaintenance, showOther]);

  // Infinite scroll event handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Load more when user scrolls to 80% of the content
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      loadMoreVehicles();
    }
  }, [loadMoreVehicles]);

  // Get vehicles to display (limited by infinite scroll)
  const vehiclesToDisplay = useMemo(() => {
    return filteredVehicles.slice(0, displayedVehicles);
  }, [filteredVehicles, displayedVehicles]);

  const hasMore = displayedVehicles < filteredVehicles.length;

  // Get unique values for filters
  const uniqueBrands = [...new Set(state.vehicles.map(v => v.brand))].sort();
  const uniqueModels = [...new Set(state.vehicles.map(v => v.model))].sort();
  const uniqueCompanies = [...new Set(state.vehicles.map(v => v.company))].sort();
  const uniqueCategories = [...new Set(state.vehicles.map(v => v.category).filter(Boolean))].sort() as VehicleCategory[]; // 🚗 Unique categories

  // 🆕 TabPanel component
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`vehicle-tabpanel-${index}`}
        aria-labelledby={`vehicle-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
      </div>
    );
  }

  // CSV funkcionalita
  const handleExportCSV = async () => {
    try {
      const blob = await apiService.exportVehiclesCSV();
      const filename = `vozidla-${new Date().toISOString().split('T')[0]}.csv`;
      saveAs(blob, filename);
      
      alert('CSV export úspešný');
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Chyba pri CSV exporte');
    }
  };



  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Zobraz loading state
    setLoading(true);

    Papa.parse(file, {
      complete: async (results: any) => {
        try {
          // Zobraz počet riadkov na spracovanie
          const totalRows = results.data.length - 1; // -1 pre header
          console.log(`📊 Spracovávam ${totalRows} vozidiel z CSV...`);
          
          // Zobraz progress dialog
          const progressDialog = window.confirm(
            `📥 Začínam import ${totalRows} vozidiel z CSV súboru...\n\n` +
            'Tento proces môže trvať niekoľko sekúnd.\n' +
            'Chcete pokračovať?'
          );
          
          if (!progressDialog) {
            setLoading(false);
            return;
          }
          
          // 📦 BATCH PROCESSING: Priprav vozidlá pre batch import
          const batchVehicles = [];
          
          // Spracuj CSV dáta a vytvor vozidlá pre batch import
          const header = results.data[0];
          const dataRows = results.data.slice(1);
          
          for (const row of dataRows) {
            const fieldMap: { [key: string]: string } = {};
            header.forEach((headerName: string, index: number) => {
              fieldMap[headerName] = row[index] || '';
            });

            // Mapovanie základných polí
            const brand = fieldMap['brand'] || fieldMap['Značka'];
            const model = fieldMap['model'] || fieldMap['Model'];
            const licensePlate = fieldMap['licensePlate'] || fieldMap['ŠPZ'];
            const company = fieldMap['company'] || fieldMap['Firma'];
            const year = fieldMap['year'] || fieldMap['Rok'];
            const status = fieldMap['status'] || fieldMap['Status'];
            const stk = fieldMap['stk'] || fieldMap['STK'];

            if (!brand || !model || !company) {
              console.warn('⚠️ Preskakujem riadok - chýbajú povinné polia:', { brand, model, company });
              continue;
            }

            // Parsovanie cenotvorby
            const pricing: Array<{
              id: string;
              minDays: number;
              maxDays: number;
              pricePerDay: number;
            }> = [];
            
            const priceColumns = [
              { columns: ['cena_0_1', 'Cena_0-1_dni'], minDays: 0, maxDays: 1 },
              { columns: ['cena_2_3', 'Cena_2-3_dni'], minDays: 2, maxDays: 3 },
              { columns: ['cena_4_7', 'Cena_4-7_dni'], minDays: 4, maxDays: 7 },
              { columns: ['cena_8_14', 'Cena_8-14_dni'], minDays: 8, maxDays: 14 },
              { columns: ['cena_15_22', 'Cena_15-22_dni'], minDays: 15, maxDays: 22 },
              { columns: ['cena_23_30', 'Cena_23-30_dni'], minDays: 23, maxDays: 30 },
              { columns: ['cena_31_9999', 'Cena_31+_dni'], minDays: 31, maxDays: 365 }
            ];

            priceColumns.forEach((priceCol, index) => {
              let priceValue = '';
              for (const columnName of priceCol.columns) {
                if (fieldMap[columnName]) {
                  priceValue = fieldMap[columnName];
                  break;
                }
              }
              
              if (priceValue && !isNaN(parseFloat(priceValue))) {
                pricing.push({
                  id: (index + 1).toString(),
                  minDays: priceCol.minDays,
                  maxDays: priceCol.maxDays,
                  pricePerDay: parseFloat(priceValue)
                });
              }
            });

            // Parsovanie provízie
            const commissionType = (
              fieldMap['commissionType'] || 
              fieldMap['Provizia_typ'] || 
              'percentage'
            ) as 'percentage' | 'fixed';
            
            const commissionValue = fieldMap['commissionValue'] || fieldMap['Provizia_hodnota'] 
              ? parseFloat(fieldMap['commissionValue'] || fieldMap['Provizia_hodnota']) 
              : 20;

            // Vytvor vehicle data
            const vehicleData = {
              brand: brand.trim(),
              model: model.trim(),
              licensePlate: licensePlate?.trim() || '',
              company: company.trim(),
              year: year && year.trim() && !isNaN(parseInt(year)) ? parseInt(year) : 2024,
              status: (status?.trim() || 'available') as any,
              stk: stk && stk.trim() ? new Date(stk.trim()) : undefined,
              pricing: pricing,
              commission: { 
                type: commissionType, 
                value: commissionValue 
              }
            };

            batchVehicles.push(vehicleData);
          }

          console.log(`📦 Pripravených ${batchVehicles.length} vozidiel pre batch import`);
          
          // Použij batch import namiesto CSV importu
          const result = await apiService.batchImportVehicles(batchVehicles);
          
          console.log('📥 CSV Import result:', result);
          
          if (result.success) {
            const { created, updated, errorsCount, successRate, processed, total } = result.data;
            
            if (created > 0 || updated > 0) {
              alert(`🚀 BATCH IMPORT ÚSPEŠNÝ!\n\n📊 Výsledky:\n• Vytvorených: ${created}\n• Aktualizovaných: ${updated}\n• Spracovaných: ${processed}/${total}\n• Chýb: ${errorsCount}\n• Úspešnosť: ${successRate}\n\nStránka sa obnoví za 3 sekundy...`);
              setTimeout(() => window.location.reload(), 3000);
            } else if (errorsCount > 0) {
              alert(`⚠️ Import dokončený, ale žiadne vozidlá neboli pridané.\n\n📊 Výsledky:\n• Vytvorených: ${created}\n• Aktualizovaných: ${updated}\n• Chýb: ${errorsCount}\n• Úspešnosť: ${successRate}\n\nSkontrolujte formát CSV súboru.`);
            } else {
              alert(`⚠️ Import dokončený, ale žiadne vozidlá neboli pridané.\nSkontrolujte formát CSV súboru.`);
            }
          } else {
            alert(`❌ Chyba pri batch importe: ${result.error || result.message || 'Neznáma chyba'}`);
          }
        } catch (error) {
          console.error('❌ CSV import error:', error);
          // ✅ ZLEPŠENÉ ERROR HANDLING - menej dramatické
          alert(`⚠️ Import dokončený s upozornením: ${error instanceof Error ? error.message : 'Sieťová chyba'}\n\nSkontrolujte výsledok po obnovení stránky.`);
          // Aj tak skús refresh - možno sa import dokončil
          setTimeout(() => window.location.reload(), 2000);
        } finally {
          setLoading(false);
        }
      },
      header: false,
      skipEmptyLines: true,
      error: (error: any) => {
        console.error('❌ Papa Parse error:', error);
        alert(`❌ Chyba pri čítaní CSV súboru: ${error.message}`);
        setLoading(false);
      }
    });
    
    // Reset input
    event.target.value = '';
  };

  // ✅ NOVÉ: Funkcie pre hromadné mazanie
  const handleVehicleSelect = (vehicleId: string, checked: boolean) => {
    const newSelected = new Set(selectedVehicles);
    if (checked) {
      newSelected.add(vehicleId);
    } else {
      newSelected.delete(vehicleId);
    }
    setSelectedVehicles(newSelected);
    setShowBulkActions(newSelected.size > 0);
    
    // Update select all checkbox
    setIsSelectAllChecked(newSelected.size === filteredVehicles.length && filteredVehicles.length > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredVehicles.map(v => v.id));
      setSelectedVehicles(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedVehicles(new Set());
      setShowBulkActions(false);
    }
    setIsSelectAllChecked(checked);
  };

  const handleBulkDelete = async () => {
    if (selectedVehicles.size === 0) return;
    
    const confirmed = window.confirm(
      `Naozaj chcete zmazať ${selectedVehicles.size} vozidiel?\n\nTáto akcia sa nedá vrátiť späť.`
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    let deletedCount = 0;
    let errorCount = 0;
    
    try {
      // Mazanie po jednom - pre lepšiu kontrolu
      for (const vehicleId of selectedVehicles) {
        try {
          await deleteVehicle(vehicleId);
          deletedCount++;
          console.log(`✅ Deleted vehicle: ${vehicleId}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to delete vehicle: ${vehicleId}`, error);
        }
      }
      
      // Reset výber
      setSelectedVehicles(new Set());
      setShowBulkActions(false);
      setIsSelectAllChecked(false);
      
      // Zobraz výsledok
      if (errorCount === 0) {
        alert(`✅ Úspešne zmazaných ${deletedCount} vozidiel.`);
      } else {
        alert(`⚠️ Zmazaných ${deletedCount} vozidiel.\nChyby: ${errorCount} vozidiel sa nepodarilo zmazať.`);
      }
      
    } catch (error) {
      console.error('❌ Bulk delete error:', error);
      alert('❌ Chyba pri hromadnom mazaní vozidiel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          color: '#1976d2',
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}>
          🚗 Databáza vozidiel
        </Typography>
        
        {/* ✅ NOVÉ: Bulk Actions */}
        {showBulkActions && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            bgcolor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: 1,
            px: 2,
            py: 1
          }}>
            <Typography variant="body2" sx={{ color: '#856404' }}>
              Vybraných: {selectedVehicles.size}
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Mažem...' : 'Zmazať vybrané'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSelectedVehicles(new Set());
                setShowBulkActions(false);
                setIsSelectAllChecked(false);
              }}
            >
              Zrušiť výber
            </Button>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* ✅ NOVÉ: Select All Checkbox */}
          {filteredVehicles.length > 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={isSelectAllChecked}
                  indeterminate={selectedVehicles.size > 0 && selectedVehicles.size < filteredVehicles.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  Vybrať všetky ({filteredVehicles.length})
                </Typography>
              }
              sx={{ 
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                mr: 1
              }}
            />
          )}
          
          <Can create="vehicles">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                bgcolor: '#1976d2',
                '&:hover': { bgcolor: '#1565c0' },
                borderRadius: 2,
                px: 3,
                py: 1
              }}
            >
              Nové vozidlo
            </Button>
          </Can>
          
          {/* CSV Export/Import tlačidlá - len na desktope */}
          {!isMobile && (
            <>
              <Button
                variant="outlined"
                onClick={handleExportCSV}
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': { borderColor: '#1565c0', bgcolor: 'rgba(25, 118, 210, 0.04)' },
                  borderRadius: 2,
                  px: 3,
                  py: 1
                }}
              >
                📊 Export CSV
              </Button>
              
              <Button
                variant="outlined"
                component="label"
                sx={{
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': { borderColor: '#1565c0', bgcolor: 'rgba(25, 118, 210, 0.04)' },
                  borderRadius: 2,
                  px: 3,
                  py: 1
                }}
              >
                📥 Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  style={{ display: 'none' }}
                />
              </Button>
            </>
          )}


        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          {/* Search Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Hľadať vozidlá..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
              }}
              sx={{ flex: 1 }}
            />
            <IconButton
              onClick={() => setFiltersOpen(!filtersOpen)}
              sx={{ 
                bgcolor: filtersOpen ? '#1976d2' : '#f5f5f5',
                color: filtersOpen ? 'white' : '#666',
                '&:hover': { 
                  bgcolor: filtersOpen ? '#1565c0' : '#e0e0e0' 
                }
              }}
            >
              <FilterListIcon />
            </IconButton>
          </Box>

          {/* Filters */}
          <Collapse in={filtersOpen}>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Značka</InputLabel>
                  <Select
                    value={filterBrand}
                    label="Značka"
                    onChange={(e) => setFilterBrand(e.target.value)}
                  >
                    <MenuItem value="">Všetky značky</MenuItem>
                    {uniqueBrands.map(brand => (
                      <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={filterModel}
                    label="Model"
                    onChange={(e) => setFilterModel(e.target.value)}
                  >
                    <MenuItem value="">Všetky modely</MenuItem>
                    {uniqueModels.map(model => (
                      <MenuItem key={model} value={model}>{model}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Firma</InputLabel>
                  <Select
                    value={filterCompany}
                    label="Firma"
                    onChange={(e) => setFilterCompany(e.target.value)}
                  >
                    <MenuItem value="">Všetky firmy</MenuItem>
                    {uniqueCompanies.map(company => (
                      <MenuItem key={company} value={company}>{company}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">Všetky statusy</MenuItem>
                    <MenuItem value="available">Dostupné</MenuItem>
                    <MenuItem value="rented">Prenajaté</MenuItem>
                    <MenuItem value="maintenance">Údržba</MenuItem>
                    <MenuItem value="temporarily_removed">Dočasne vyradené</MenuItem>
                    <MenuItem value="removed">Vyradené</MenuItem>
                    <MenuItem value="transferred">Prepisané</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Kategória</InputLabel>
                  <Select
                    value={filterCategory}
                    label="Kategória"
                    onChange={(e) => setFilterCategory(e.target.value as VehicleCategory | 'all')}
                  >
                    <MenuItem value="all">Všetky kategórie</MenuItem>
                    <MenuItem value="nizka-trieda">🚗 Nízka trieda</MenuItem>
                    <MenuItem value="stredna-trieda">🚙 Stredná trieda</MenuItem>
                    <MenuItem value="vyssia-stredna">🚘 Vyššia stredná</MenuItem>
                    <MenuItem value="luxusne">💎 Luxusné</MenuItem>
                    <MenuItem value="sportove">🏎️ Športové</MenuItem>
                    <MenuItem value="suv">🚜 SUV</MenuItem>
                    <MenuItem value="viacmiestne">👨‍👩‍👧‍👦 Viacmiestne</MenuItem>
                    <MenuItem value="dodavky">📦 Dodávky</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Status Checkboxes */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                Zobraziť statusy:
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={<Checkbox checked={showAvailable} onChange={(e) => setShowAvailable(e.target.checked)} />}
                  label="Dostupné"
                />
                <FormControlLabel
                  control={<Checkbox checked={showRented} onChange={(e) => setShowRented(e.target.checked)} />}
                  label="Prenajaté"
                />
                <FormControlLabel
                  control={<Checkbox checked={showMaintenance} onChange={(e) => setShowMaintenance(e.target.checked)} />}
                  label="Údržba"
                />
                <FormControlLabel
                  control={<Checkbox checked={showOther} onChange={(e) => setShowOther(e.target.checked)} />}
                  label="Ostatné"
                />
              </FormGroup>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* 🎯 TABS NAVIGATION */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="vehicle tabs">
          <Tab label="Vozidlá" id="vehicle-tab-0" aria-controls="vehicle-tabpanel-0" />
          <Tab label="👤 Majitelia" id="vehicle-tab-1" aria-controls="vehicle-tabpanel-1" />
          <Tab label="🤝 Používatelia" id="vehicle-tab-2" aria-controls="vehicle-tabpanel-2" />
        </Tabs>
      </Box>

      {/* TAB 0 - VOZIDLÁ */}
      <TabPanel value={currentTab} index={0}>
        {/* Results Count */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Zobrazených {vehiclesToDisplay.length} z {filteredVehicles.length} vozidiel
          {filteredVehicles.length !== state.vehicles.length && ` (filtrovaných z ${state.vehicles.length})`}
        </Typography>
        {loading && (
          <EnhancedLoading 
            variant="inline" 
            message="Aktualizujem zoznam..." 
            showMessage={false} 
          />
        )}
        {isLoadingMore && (
          <EnhancedLoading 
            variant="inline" 
            message="Načítavam ďalšie..." 
            showMessage={true} 
          />
        )}
      </Box>

      {/* Vehicle List */}
      {isMobile ? (
        /* MOBILE CARDS VIEW */
        <Card sx={{ overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box 
              sx={{ maxHeight: '70vh', overflowY: 'auto' }}
              onScroll={handleScroll}
            >
              {vehiclesToDisplay.map((vehicle, index) => (
                <Box
                  key={vehicle.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 0,
                    borderBottom: index < vehiclesToDisplay.length - 1 ? '1px solid #e0e0e0' : 'none',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    minHeight: 80,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEdit(vehicle)}
                >
                  {/* ✅ NOVÉ: Checkbox pre výber vozidla */}
                  <Box sx={{ 
                    width: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: '1px solid #e0e0e0',
                    backgroundColor: '#fafafa'
                  }}>
                    <Checkbox
                      size="small"
                      checked={selectedVehicles.has(vehicle.id)}
                      onChange={(e) => {
                        e.stopPropagation(); // Zabráni kliknutiu na celý riadok
                        handleVehicleSelect(vehicle.id, e.target.checked);
                      }}
                      sx={{ 
                        p: 0.5,
                        '& .MuiSvgIcon-root': { fontSize: 18 }
                      }}
                    />
                  </Box>
                  
                  {/* Vehicle Info - sticky left */}
                  <Box sx={{ 
                    width: { xs: 140, sm: 160 },
                    maxWidth: { xs: 140, sm: 160 },
                    p: { xs: 1, sm: 1.5 },
                    borderRight: '2px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    overflow: 'hidden'
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      color: '#1976d2',
                      lineHeight: 1.2,
                      wordWrap: 'break-word',
                      mb: { xs: 0.25, sm: 0.5 }
                    }}>
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      fontSize: { xs: '0.6rem', sm: '0.65rem' },
                      mb: { xs: 0.25, sm: 0.5 },
                      fontWeight: 600
                    }}>
                      {vehicle.licensePlate}
                    </Typography>
                    {vehicle.vin && (
                      <Typography variant="caption" sx={{
                        color: '#888',
                        fontSize: { xs: '0.55rem', sm: '0.6rem' },
                        fontFamily: 'monospace'
                      }}>
                        VIN: {vehicle.vin.slice(-6)}
                      </Typography>
                    )}
                    <Chip
                      size="small"
                      label={getStatusText(vehicle.status)}
                      icon={getStatusIcon(vehicle.status)}
                      sx={{
                        height: { xs: 18, sm: 20 },
                        fontSize: { xs: '0.55rem', sm: '0.6rem' },
                        bgcolor: getStatusBgColor(vehicle.status),
                        color: 'white',
                        fontWeight: 700,
                        minWidth: 'auto',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        '& .MuiChip-icon': {
                          color: 'white',
                          fontSize: '0.8rem'
                        }
                      }}
                    />
                  </Box>
                  
                  {/* Vehicle Details - scrollable right */}
                  <Box sx={{ 
                    flex: 1,
                    p: { xs: 1, sm: 1.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    minWidth: 0
                  }}>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        color: '#333',
                        mb: { xs: 0.25, sm: 0.5 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        🏢 {vehicle.company}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: { xs: '0.6rem', sm: '0.65rem' },
                        display: 'block',
                        mb: { xs: 0.25, sm: 0.5 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        📊 Status: {getStatusText(vehicle.status)}
                      </Typography>
                    </Box>
                    
                    {/* Mobile Action Buttons */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 0.5, sm: 0.75 }, 
                      mt: { xs: 1, sm: 1.5 }, 
                      justifyContent: 'flex-start',
                      flexWrap: 'wrap'
                    }}>
                      {/* Edit Button */}
                      <Can update="vehicles" context={{ resourceOwnerId: vehicle.assignedMechanicId, resourceCompanyId: vehicle.ownerCompanyId }}>
                        <IconButton
                          size="small"
                          title="Upraviť vozidlo"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(vehicle);
                          }}
                          sx={{ 
                            bgcolor: '#2196f3', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: '#1976d2',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(33,150,243,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Can>
                      
                      {/* DEAKTIVOVANÉ - Transfer vlastníctva sa nepoužíva */}
                      {/* <IconButton
                        size="small"
                        title="História transferov vlastníctva"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowOwnershipHistory(vehicle);
                        }}
                        sx={{ 
                          bgcolor: '#9c27b0', 
                          color: 'white',
                          width: { xs: 36, sm: 32 },
                          height: { xs: 36, sm: 32 },
                          '&:hover': { 
                            bgcolor: '#7b1fa2',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(156,39,176,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton> */}
                      
                      {/* Delete Button */}
                      <Can delete="vehicles" context={{ resourceOwnerId: vehicle.assignedMechanicId, resourceCompanyId: vehicle.ownerCompanyId }}>
                        <IconButton
                          size="small"
                          title="Zmazať vozidlo"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(vehicle.id);
                          }}
                          sx={{ 
                            bgcolor: '#f44336', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: '#d32f2f',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(244,67,54,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Can>
                    </Box>
                  </Box>
                </Box>
              ))}
              
              {/* 🚀 INFINITE SCROLL: Load More Button */}
              {hasMore && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  p: 3,
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <Button
                    variant="outlined"
                    onClick={loadMoreVehicles}
                    disabled={isLoadingMore}
                    sx={{
                      minWidth: 200,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    {isLoadingMore ? 'Načítavam...' : `Načítať ďalších (${filteredVehicles.length - displayedVehicles} zostáva)`}
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        /* DESKTOP TABLE VIEW */
        <Card sx={{ overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Desktop Header */}
            <Box sx={{ 
              display: 'flex',
              bgcolor: '#f8f9fa',
              borderBottom: '2px solid #e0e0e0',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              minHeight: 56
            }}>
              {/* Vozidlo column */}
              <Box sx={{ 
                width: 200,
                minWidth: 200,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  🚗 Vozidlo
                </Typography>
              </Box>
              
              {/* ŠPZ a VIN column */}
              <Box sx={{ 
                width: 140,
                minWidth: 140,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  📋 ŠPZ / VIN
                </Typography>
              </Box>
              
              {/* Firma column */}
              <Box sx={{ 
                width: 150,
                minWidth: 150,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  🏢 Firma
                </Typography>
              </Box>
              
              {/* Status column */}
              <Box sx={{ 
                width: 140,
                minWidth: 140,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  📊 Status
                </Typography>
              </Box>
              
              {/* Ceny column */}
              <Box sx={{ 
                width: 200,
                minWidth: 200,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  💰 Ceny
                </Typography>
              </Box>
              
              {/* Akcie column */}
              <Box sx={{ 
                width: 120,
                minWidth: 120,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                  ⚡ Akcie
                </Typography>
              </Box>
            </Box>

            {/* Desktop Vehicle Rows */}
            <Box 
              sx={{ maxHeight: '70vh', overflowY: 'auto' }}
              onScroll={handleScroll}
            >
              {vehiclesToDisplay.map((vehicle, index) => (
                <Box 
                  key={vehicle.id}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    p: 0,
                    borderBottom: index < vehiclesToDisplay.length - 1 ? '1px solid #e0e0e0' : 'none',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    minHeight: 72,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEdit(vehicle)}
                >
                  {/* Vozidlo column */}
                  <Box sx={{ 
                    width: 200,
                    minWidth: 200,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      color: '#1976d2',
                      mb: 0.5
                    }}>
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#666',
                      fontSize: '0.7rem'
                    }}>
                      ID: {vehicle.id.slice(0, 8)}...
                    </Typography>
                  </Box>
                  
                  {/* ŠPZ a VIN column */}
                  <Box sx={{ 
                    width: 140,
                    minWidth: 140,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 600,
                      color: '#333',
                      fontFamily: 'monospace'
                    }}>
                      {vehicle.licensePlate}
                    </Typography>
                    {vehicle.vin && (
                      <Typography variant="caption" sx={{
                        color: '#666',
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        mt: 0.5
                      }}>
                        VIN: {vehicle.vin.slice(-8)}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Firma column */}
                  <Box sx={{ 
                    width: 150,
                    minWidth: 150,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" sx={{ 
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {vehicle.company}
                    </Typography>
                  </Box>
                  
                  {/* Status column */}
                  <Box sx={{ 
                    width: 140,
                    minWidth: 140,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Chip
                      size="small"
                      label={getStatusText(vehicle.status)}
                      icon={getStatusIcon(vehicle.status)}
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        bgcolor: getStatusBgColor(vehicle.status),
                        color: 'white',
                        fontWeight: 700,
                        '& .MuiChip-icon': {
                          color: 'white',
                          fontSize: '0.9rem'
                        }
                      }}
                    />
                  </Box>
                  
                  {/* Ceny column */}
                  <Box sx={{ 
                    width: 200,
                    minWidth: 200,
                    p: 2,
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    {vehicle.pricing && vehicle.pricing.length > 0 ? (
                      <>
                        <Typography variant="caption" sx={{ 
                          color: '#666',
                          fontSize: '0.65rem',
                          mb: 0.25
                        }}>
                          1 deň: {vehicle.pricing.find(p => p.minDays === 0 && p.maxDays === 1)?.pricePerDay || 0}€
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: '#666',
                          fontSize: '0.65rem'
                        }}>
                          7+ dní: {vehicle.pricing.find(p => p.minDays === 4 && p.maxDays === 7)?.pricePerDay || 0}€
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        Nezadané
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Akcie column */}
                  <Box sx={{ 
                    width: 120,
                    minWidth: 120,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5
                  }}>
                    {/* Edit Button */}
                    <Can update="vehicles" context={{ resourceOwnerId: vehicle.assignedMechanicId, resourceCompanyId: vehicle.ownerCompanyId }}>
                      <IconButton
                        size="small"
                        title="Upraviť vozidlo"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(vehicle);
                        }}
                        sx={{ 
                          bgcolor: '#2196f3', 
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': { 
                            bgcolor: '#1976d2',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(33,150,243,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Can>
                    
                    {/* History Button */}
                    <IconButton
                      size="small"
                      title="História vozidla"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement history view
                      }}
                      sx={{ 
                        bgcolor: '#9c27b0', 
                        color: 'white',
                        width: 28,
                        height: 28,
                        '&:hover': { 
                          bgcolor: '#7b1fa2',
                          transform: 'scale(1.1)',
                          boxShadow: '0 4px 12px rgba(156,39,176,0.4)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                    
                    {/* Delete Button */}
                    <Can delete="vehicles" context={{ resourceOwnerId: vehicle.assignedMechanicId, resourceCompanyId: vehicle.ownerCompanyId }}>
                      <IconButton
                        size="small"
                        title="Zmazať vozidlo"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(vehicle.id);
                        }}
                        sx={{ 
                          bgcolor: '#f44336', 
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': { 
                            bgcolor: '#d32f2f',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(244,67,54,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Can>
                  </Box>
                </Box>
              ))}
              
              {/* 🚀 INFINITE SCROLL: Load More Button */}
              {hasMore && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  p: 3,
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <Button
                    variant="outlined"
                    onClick={loadMoreVehicles}
                    disabled={isLoadingMore}
                    sx={{
                      minWidth: 200,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    {isLoadingMore ? 'Načítavam...' : `Načítať ďalších (${filteredVehicles.length - displayedVehicles} zostáva)`}
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
      </TabPanel>

      {/* TAB 1 - MAJITELIA */}
      <TabPanel value={currentTab} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            👤 Správa majiteľov vozidiel
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateCompanyDialogOpen(true)}
            sx={{ 
              bgcolor: '#2196f3', 
              '&:hover': { bgcolor: '#1976d2' },
              borderRadius: 2,
              px: 3
            }}
          >
            🏢 Pridať novú firmu
          </Button>
        </Box>
        
        {/* Owners List - Nový dizajn */}
        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Zoznam majiteľov vozidiel. Kliknite na majiteľa pre zobrazenie/skrytie jeho vozidiel.
              </Typography>
            </Box>
            
            {/* Zoznam majiteľov zoskupených podľa firmy */}
            {state.companies
              ?.filter(company => company.isActive !== false) // Filtrovanie aktívnych firiem
              ?.map((company) => {
                // Nájdi vozidlá pre túto firmu
                const companyVehicles = filteredVehicles.filter(v => v.ownerCompanyId === company.id);
                
                if (companyVehicles.length === 0) return null;
                
                return (
                  <OwnerCard 
                    key={company.id}
                    company={company}
                    vehicles={companyVehicles}
                    onVehicleUpdate={handleSaveCompany}
                    onVehicleEdit={handleEdit}
                  />
                );
              })
              ?.filter(Boolean)}
            
            {state.companies?.filter(c => c.isActive !== false).length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Žiadni aktívni majitelia vozidiel
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* TAB 2 - POUŽÍVATELIA (SPOLUINVESTORI) */}
      <TabPanel value={currentTab} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            🤝 Správa spoluinvestorov
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateInvestorDialogOpen(true)}
            sx={{ 
              bgcolor: '#2196f3', 
              '&:hover': { bgcolor: '#1976d2' },
              borderRadius: 2,
              px: 3
            }}
          >
            👤 Pridať spoluinvestora
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Spoluinvestori s % podielmi vo firmách. Môžu byť priradení k viacerým firmám.
        </Typography>

        {/* Investors List */}
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Zoznam všetkých spoluinvestorov a ich podiely vo firmách.
            </Typography>
            
            {loadingInvestors ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <EnhancedLoading variant="page" showMessage={true} message="Načítavam spoluinvestorov..." />
              </Box>
            ) : investors.length > 0 ? (
              investors.map((investor) => {
                // Nájdi podiely tohto investora
                const investorShares_filtered = investorShares.filter(share => share.investorId === investor.id);
                
                return (
                  <InvestorCard 
                    key={investor.id}
                    investor={investor}
                    shares={investorShares_filtered}
                    companies={state.companies || []}
                    onShareUpdate={loadInvestors}
                    onAssignShare={(investor) => {
                      setSelectedInvestorForShare(investor);
                      setAssignShareDialogOpen(true);
                    }}
                  />
                );
              })
            ) : (
              <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                Žiadni spoluinvestori. Kliknite na "Pridať spoluinvestora" pre vytvorenie nového.
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Vehicle Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingVehicle ? 'Upraviť vozidlo' : 'Nové vozidlo'}
        </DialogTitle>
        <DialogContent>
          <VehicleForm
            vehicle={editingVehicle}
            onSave={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Ownership History Dialog */}
      <Dialog 
        open={ownershipHistoryDialog} 
        onClose={() => setOwnershipHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          História transferov vlastníctva
          {selectedVehicleHistory && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedVehicleHistory.brand} {selectedVehicleHistory.model} ({selectedVehicleHistory.licensePlate})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {ownershipHistory.length === 0 ? (
            <Typography>Žiadna história transferov</Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              {ownershipHistory.map((record, index) => (
                <Card key={record.id} sx={{ mb: 2, bgcolor: index === 0 ? 'primary.50' : 'background.paper' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" color={index === 0 ? 'primary.main' : 'text.primary'}>
                        {record.ownerCompanyName}
                        {index === 0 && <Chip label="Aktuálny majiteľ" size="small" sx={{ ml: 1 }} />}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(record.validFrom), 'dd.MM.yyyy', { locale: sk })}
                        {record.validTo && ` - ${format(new Date(record.validTo), 'dd.MM.yyyy', { locale: sk })}`}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Dôvod: {record.transferReason === 'initial_setup' ? 'Počiatočné nastavenie' : 
                              record.transferReason === 'sale' ? 'Predaj' :
                              record.transferReason === 'transfer' ? 'Transfer' : record.transferReason}
                    </Typography>
                    {record.transferNotes && (
                      <Typography variant="body2" color="text.secondary">
                        Poznámka: {record.transferNotes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Company Dialog */}
      <Dialog 
        open={createCompanyDialogOpen} 
        onClose={() => setCreateCompanyDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>🏢 Pridať novú firmu</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov firmy/s.r.o."
                value={newCompanyData.name}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, name: e.target.value }))}
                required
                autoFocus
                sx={{ bgcolor: 'primary.50' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Meno a priezvisko majiteľa"
                value={newCompanyData.ownerName}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, ownerName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kontaktný email"
                type="email"
                value={newCompanyData.contactEmail}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, contactEmail: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kontaktný telefón"
                value={newCompanyData.contactPhone}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, contactPhone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default provízia (%)"
                type="number"
                value={newCompanyData.defaultCommissionRate}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, defaultCommissionRate: parseFloat(e.target.value) || 20 }))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Súkromný IBAN"
                value={newCompanyData.personalIban}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, personalIban: e.target.value }))}
                placeholder="SK89 0000 0000 0000 0000 0000"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Firemný IBAN"
                value={newCompanyData.businessIban}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, businessIban: e.target.value }))}
                placeholder="SK89 0000 0000 0000 0000 0000"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCompanyDialogOpen(false)}>
            Zrušiť
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateCompany}
            disabled={!newCompanyData.name.trim()}
            startIcon={<AddIcon />}
          >
            Vytvoriť firmu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Investor Dialog */}
      <Dialog 
        open={createInvestorDialogOpen} 
        onClose={() => setCreateInvestorDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>👤 Pridať spoluinvestora</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Meno"
                value={newInvestorData.firstName}
                onChange={(e) => setNewInvestorData(prev => ({ ...prev, firstName: e.target.value }))}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={newInvestorData.lastName}
                onChange={(e) => setNewInvestorData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newInvestorData.email}
                onChange={(e) => setNewInvestorData(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefón"
                value={newInvestorData.phone}
                onChange={(e) => setNewInvestorData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Poznámky"
                value={newInvestorData.notes}
                onChange={(e) => setNewInvestorData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateInvestorDialogOpen(false)}>
            Zrušiť
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateInvestor}
            disabled={!newInvestorData.firstName.trim() || !newInvestorData.lastName.trim()}
            startIcon={<AddIcon />}
          >
            Vytvoriť spoluinvestora
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Share Dialog */}
      <Dialog 
        open={assignShareDialogOpen} 
        onClose={() => setAssignShareDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          🏢 Priradiť podiel k firme
          {selectedInvestorForShare && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedInvestorForShare.firstName} {selectedInvestorForShare.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Firma</InputLabel>
                <Select
                  value={newShareData.companyId}
                  label="Firma"
                  onChange={(e) => setNewShareData(prev => ({ ...prev, companyId: e.target.value }))}
                >
                  <MenuItem value="">
                    <em>Vyberte firmu...</em>
                  </MenuItem>
                  {state.companies
                    ?.filter(c => c.isActive !== false)
                    ?.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vlastnícky podiel (%)"
                type="number"
                value={newShareData.ownershipPercentage}
                onChange={(e) => setNewShareData(prev => ({ ...prev, ownershipPercentage: parseFloat(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Suma investície (€)"
                type="number"
                value={newShareData.investmentAmount}
                onChange={(e) => setNewShareData(prev => ({ ...prev, investmentAmount: parseFloat(e.target.value) || 0 }))}
                inputProps={{ min: 0, step: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newShareData.isPrimaryContact}
                    onChange={(e) => setNewShareData(prev => ({ ...prev, isPrimaryContact: e.target.checked }))}
                  />
                }
                label="Primárny kontakt firmy"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignShareDialogOpen(false)}>
            Zrušiť
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAssignShare}
            disabled={!newShareData.companyId || newShareData.ownershipPercentage <= 0}
            startIcon={<AddIcon />}
          >
            Priradiť podiel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 