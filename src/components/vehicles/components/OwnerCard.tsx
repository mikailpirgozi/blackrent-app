import {
  Edit as EditIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Card,
  CardContent,
  Collapse,
  TextField,
  Grid,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { Vehicle, VehicleStatus } from '../../../types';
import type { OwnerCardProps } from '../../../types/vehicle-types';
import { getApiBaseUrl } from '../../../utils/apiUrl';
import {
  getStatusColor,
  getStatusText,
} from '../../../utils/vehicles/vehicleHelpers';
import { EnhancedLoading } from '../../common/EnhancedLoading';
import { Can } from '../../common/PermissionGuard';
import CompanyDocumentManager from '../../companies/CompanyDocumentManager';

// 🆕 OWNER CARD COMPONENT - Rozbaliteľná karta majiteľa s vozidlami
const OwnerCard: React.FC<OwnerCardProps> = ({
  company,
  vehicles,
  onVehicleUpdate,
  onVehicleEdit,
}) => {
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
    protocolDisplayName: company.protocolDisplayName || '',
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
      protocolDisplayName: company.protocolDisplayName || '',
    });
  }, [company]);

  // 🤝 Načítanie investorov firmy
  const loadCompanyInvestors = async () => {
    try {
      setLoadingInvestors(true);

      const response = await fetch(
        `${getApiBaseUrl()}/company-investors/${company.id}/shares`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          },
        }
      );

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

      const response = await fetch(
        `${getApiBaseUrl()}/companies/${company.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          },
          body: JSON.stringify(editData),
        }
      );

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
          '&:hover': { bgcolor: 'grey.100' },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
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
                <Typography
                  variant="body2"
                  sx={{ color: 'warning.main', fontWeight: 'medium' }}
                >
                  📄 Fakturačná firma: {company.protocolDisplayName}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                setEditMode(!editMode);
              }}
              sx={{
                bgcolor: editMode ? 'primary.main' : 'transparent',
                color: editMode ? 'white' : 'primary.main',
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">{expanded ? '🔽' : '▶️'}</IconButton>
          </Box>
        </Box>
      </Box>

      {/* Edit Mode - Rozšírené informácie */}
      <Collapse in={editMode}>
        <Box
          sx={{
            p: 3,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            ✏️ Úprava informácií majiteľa
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov firmy/s.r.o."
                value={editData.name}
                onChange={e =>
                  setEditData(prev => ({ ...prev, name: e.target.value }))
                }
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
                onChange={e =>
                  setEditData(prev => ({ ...prev, ownerName: e.target.value }))
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kontaktný email"
                type="email"
                value={editData.contactEmail}
                onChange={e =>
                  setEditData(prev => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Kontaktný telefón"
                value={editData.contactPhone}
                onChange={e =>
                  setEditData(prev => ({
                    ...prev,
                    contactPhone: e.target.value,
                  }))
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default provízia (%)"
                type="number"
                value={editData.defaultCommissionRate}
                onChange={e =>
                  setEditData(prev => ({
                    ...prev,
                    defaultCommissionRate: parseFloat(e.target.value) || 20,
                  }))
                }
                size="small"
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Súkromný IBAN"
                value={editData.personalIban}
                onChange={e =>
                  setEditData(prev => ({
                    ...prev,
                    personalIban: e.target.value,
                  }))
                }
                size="small"
                placeholder="SK89 0000 0000 0000 0000 0000"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Firemný IBAN"
                value={editData.businessIban}
                onChange={e =>
                  setEditData(prev => ({
                    ...prev,
                    businessIban: e.target.value,
                  }))
                }
                size="small"
                placeholder="SK89 0000 0000 0000 0000 0000"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fakturačná firma (pre protokoly)"
                value={editData.protocolDisplayName}
                onChange={e =>
                  setEditData(prev => ({
                    ...prev,
                    protocolDisplayName: e.target.value,
                  }))
                }
                size="small"
                placeholder="Napr. P2 invest s.r.o."
                helperText="Názov firmy ktorý sa zobrazí na protokoloch namiesto interného názvu"
                sx={{ bgcolor: 'warning.50' }}
              />
            </Grid>
          </Grid>

          <Box
            sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}
          >
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
          <Typography
            variant="subtitle1"
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            🚗 Vozidlá majiteľa ({vehicles.length})
          </Typography>

          {vehicles.map(vehicle => (
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
                  bgcolor: 'action.hover',
                },
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
                  Provízia:{' '}
                  {vehicle.commission?.value ||
                    company.defaultCommissionRate ||
                    20}
                  %
                  {vehicle.commission?.value !==
                    company.defaultCommissionRate && (
                    <Chip
                      label="Vlastná"
                      size="small"
                      sx={{ ml: 1, height: 16 }}
                    />
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
                <Can
                  update="vehicles"
                  context={{
                    resourceOwnerId: vehicle.assignedMechanicId,
                    resourceCompanyId: vehicle.ownerCompanyId,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      onVehicleEdit(vehicle);
                    }}
                    sx={{
                      bgcolor: '#2196f3',
                      color: 'white',
                      width: 28,
                      height: 28,
                      '&:hover': { bgcolor: '#1976d2' },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Can>
              </Box>
            </Box>
          ))}

          {/* Spoluinvestori firmy */}
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              🤝 Spoluinvestori firmy
            </Typography>

            {loadingInvestors ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <EnhancedLoading
                  variant="page"
                  showMessage={true}
                  message="Načítavam investorov..."
                />
              </Box>
            ) : companyInvestors.length > 0 ? (
              companyInvestors.map(share => (
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
                      bgcolor: 'primary.100',
                    },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">
                      👤 {share.investor?.firstName} {share.investor?.lastName}
                      {share.isPrimaryContact && (
                        <Chip
                          label="Primárny kontakt"
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 2 }}
              >
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

export default OwnerCard;
