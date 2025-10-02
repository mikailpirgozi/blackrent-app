import { Add as AddIcon } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React from 'react';

import type { Vehicle } from '../../../types';
import VehicleForm from '../VehicleForm';

interface VehicleDialogsProps {
  // Vehicle Form Dialog
  openDialog: boolean;
  editingVehicle: Vehicle | null;
  onCloseDialog: () => void;
  onSubmit: (vehicle: Vehicle) => Promise<void>;

  // Ownership History Dialog
  ownershipHistoryDialog: boolean;
  selectedVehicleHistory: Vehicle | null;
  ownershipHistory: Record<string, unknown>[];
  onCloseOwnershipHistory: () => void;

  // Create Company Dialog
  createCompanyDialogOpen: boolean;
  newCompanyData: {
    name: string;
    ownerName: string;
    personalIban: string;
    businessIban: string;
    contactEmail: string;
    contactPhone: string;
    defaultCommissionRate: number;
    isActive: boolean;
  };
  onCloseCreateCompany: () => void;
  onCreateCompany: () => Promise<void>;
  onCompanyDataChange: (field: string, value: string) => void;

  // Create Investor Dialog
  createInvestorDialogOpen: boolean;
  newInvestorData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onCloseCreateInvestor: () => void;
  onCreateInvestor: () => Promise<void>;
  onInvestorDataChange: (field: string, value: string) => void;

  // Assign Share Dialog
  assignShareDialogOpen: boolean;
  selectedInvestorForShare: Record<string, unknown>;
  newShareData: {
    companyId: string;
    ownershipPercentage: number;
    investmentAmount: number;
    isPrimaryContact: boolean;
  };
  companies: Record<string, unknown>[];
  onCloseAssignShare: () => void;
  onAssignShare: () => Promise<void>;
  onShareDataChange: (field: string, value: string | number | boolean) => void;
}

const VehicleDialogs: React.FC<VehicleDialogsProps> = ({
  // Vehicle Form Dialog
  openDialog,
  editingVehicle,
  onCloseDialog,
  onSubmit,

  // Ownership History Dialog
  ownershipHistoryDialog,
  selectedVehicleHistory,
  ownershipHistory,
  onCloseOwnershipHistory,

  // Create Company Dialog
  createCompanyDialogOpen,
  newCompanyData,
  onCloseCreateCompany,
  onCreateCompany,
  onCompanyDataChange,

  // Create Investor Dialog
  createInvestorDialogOpen,
  newInvestorData,
  onCloseCreateInvestor,
  onCreateInvestor,
  onInvestorDataChange,

  // Assign Share Dialog
  assignShareDialogOpen,
  selectedInvestorForShare,
  newShareData,
  companies,
  onCloseAssignShare,
  onAssignShare,
  onShareDataChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      {/* Vehicle Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={onCloseDialog}
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
            onSave={onSubmit}
            onCancel={onCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Ownership History Dialog */}
      <Dialog
        open={ownershipHistoryDialog}
        onClose={onCloseOwnershipHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          História transferov vlastníctva
          {selectedVehicleHistory && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedVehicleHistory.brand} {selectedVehicleHistory.model} -{' '}
              {selectedVehicleHistory.licensePlate}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {ownershipHistory.length === 0 ? (
            <Typography>Žiadna história transferov</Typography>
          ) : (
            ownershipHistory.map((transfer, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '16px',
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                }}
              >
                <Typography variant="subtitle2">
                  Transfer #{index + 1}
                </Typography>
                <Typography variant="body2">
                  <>
                    <strong>Z:</strong> {transfer.fromCompany || 'N/A'}
                  </>
                </Typography>
                <Typography variant="body2">
                  <>
                    <strong>Na:</strong> {transfer.toCompany || 'N/A'}
                  </>
                </Typography>
                <Typography variant="body2">
                  <>
                    <strong>Dátum:</strong>{' '}
                    {transfer.transferDate
                      ? format(
                          new Date(transfer.transferDate as string),
                          'dd.MM.yyyy HH:mm',
                          { locale: sk }
                        )
                      : 'N/A'}
                  </>
                </Typography>
                <Typography variant="body2">
                  <>
                    <strong>Poznámka:</strong>{' '}
                    {transfer.notes || 'Žiadna poznámka'}
                  </>
                </Typography>
              </div>
            ))
          )}
        </DialogContent>
      </Dialog>

      {/* Create Company Dialog */}
      <Dialog
        open={createCompanyDialogOpen}
        onClose={onCloseCreateCompany}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>🏢 Pridať novú firmu</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov firmy"
                value={newCompanyData.name}
                onChange={e => onCompanyDataChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Meno majiteľa"
                value={newCompanyData.ownerName}
                onChange={e => onCompanyDataChange('ownerName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCompanyData.contactEmail}
                onChange={e =>
                  onCompanyDataChange('contactEmail', e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefón"
                value={newCompanyData.contactPhone}
                onChange={e =>
                  onCompanyDataChange('contactPhone', e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Osobný IBAN"
                value={newCompanyData.personalIban}
                onChange={e =>
                  onCompanyDataChange('personalIban', e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Firemný IBAN"
                value={newCompanyData.businessIban}
                onChange={e =>
                  onCompanyDataChange('businessIban', e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Provízia (%)"
                type="number"
                value={newCompanyData.defaultCommissionRate}
                onChange={e =>
                  onCompanyDataChange('defaultCommissionRate', e.target.value)
                }
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseCreateCompany}>Zrušiť</Button>
          <Button
            variant="contained"
            onClick={onCreateCompany}
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
        onClose={onCloseCreateInvestor}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>👤 Pridať spoluinvestora</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Krstné meno"
                value={newInvestorData.firstName}
                onChange={e =>
                  onInvestorDataChange('firstName', e.target.value)
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={newInvestorData.lastName}
                onChange={e => onInvestorDataChange('lastName', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newInvestorData.email}
                onChange={e => onInvestorDataChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefón"
                value={newInvestorData.phone}
                onChange={e => onInvestorDataChange('phone', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseCreateInvestor}>Zrušiť</Button>
          <Button
            variant="contained"
            onClick={onCreateInvestor}
            disabled={
              !newInvestorData.firstName.trim() ||
              !newInvestorData.lastName.trim()
            }
            startIcon={<AddIcon />}
          >
            Vytvoriť spoluinvestora
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Share Dialog */}
      <Dialog
        open={assignShareDialogOpen}
        onClose={onCloseAssignShare}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          🏢 Priradiť podiel k firme
          {selectedInvestorForShare && (
            <Typography variant="subtitle2" color="text.secondary">
              <>
                {selectedInvestorForShare.firstName}{' '}
                {selectedInvestorForShare.lastName}
              </>
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
                  onChange={e => onShareDataChange('companyId', e.target.value)}
                >
                  {companies
                    ?.filter(c => c.isActive !== false)
                    .map(company => (
                      <MenuItem
                        key={String(company.id)}
                        value={String(company.id)}
                      >
                        {String(company.name)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Podiel vlastníctva (%)"
                type="number"
                value={newShareData.ownershipPercentage}
                onChange={e =>
                  onShareDataChange(
                    'ownershipPercentage',
                    parseFloat(e.target.value) || 0
                  )
                }
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Investičná suma (€)"
                type="number"
                value={newShareData.investmentAmount}
                onChange={e =>
                  onShareDataChange(
                    'investmentAmount',
                    parseFloat(e.target.value) || 0
                  )
                }
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseAssignShare}>Zrušiť</Button>
          <Button
            variant="contained"
            onClick={onAssignShare}
            disabled={
              !newShareData.companyId || newShareData.ownershipPercentage <= 0
            }
            startIcon={<AddIcon />}
          >
            Priradiť podiel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VehicleDialogs;
