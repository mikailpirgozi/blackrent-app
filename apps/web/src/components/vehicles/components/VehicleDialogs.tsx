import { Plus as AddIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { UnifiedTypography } from '@/components/ui/UnifiedTypography';
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
  onSubmit: (_vehicle: Vehicle) => Promise<void>;

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
  onCompanyDataChange: (_field: string, _value: string) => void;

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
  onInvestorDataChange: (_field: string, _value: string) => void;

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
  onShareDataChange: (_field: string, _value: string | number | boolean) => void;
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
  // Custom responsive logic - no MUI hooks needed
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Vehicle Form Dialog */}
      <Dialog open={openDialog} onOpenChange={(open) => !open && onCloseDialog()}>
        <DialogContent className={isMobile ? "w-full h-full max-w-none rounded-none overflow-y-auto" : "max-w-5xl w-full"}>
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Upraviť vozidlo' : 'Nové vozidlo'}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle ? 'Upravte údaje o vozidle' : 'Pridajte nové vozidlo do systému'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <VehicleForm
              vehicle={editingVehicle}
              onSave={onSubmit}
              onCancel={onCloseDialog}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Ownership History Dialog */}
      <Dialog open={ownershipHistoryDialog} onOpenChange={(open) => !open && onCloseOwnershipHistory()}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>História transferov vlastníctva</DialogTitle>
            {selectedVehicleHistory && (
              <DialogDescription>
                {selectedVehicleHistory.brand} {selectedVehicleHistory.model} -{' '}
                {selectedVehicleHistory.licensePlate}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="mt-4 max-h-96 overflow-y-auto">
            {ownershipHistory.length === 0 ? (
              <UnifiedTypography variant="body2">Žiadna história transferov</UnifiedTypography>
            ) : (
              ownershipHistory.map((transfer, index) => (
                <div
                  key={index}
                  className="mb-4 p-4 border border-gray-200 rounded-lg"
                >
                  <UnifiedTypography variant="subtitle2">
                    Transfer #{index + 1}
                  </UnifiedTypography>
                  <UnifiedTypography variant="body2" className="mt-1">
                    <strong>Z:</strong> {String(transfer.fromCompany || 'N/A')}
                  </UnifiedTypography>
                  <UnifiedTypography variant="body2">
                    <strong>Na:</strong> {String(transfer.toCompany || 'N/A')}
                  </UnifiedTypography>
                  <UnifiedTypography variant="body2">
                    <strong>Dátum:</strong>{' '}
                    {transfer.transferDate
                      ? format(
                          new Date(transfer.transferDate as string),
                          'dd.MM.yyyy HH:mm',
                          { locale: sk }
                        )
                      : 'N/A'}
                  </UnifiedTypography>
                  <UnifiedTypography variant="body2">
                    <strong>Poznámka:</strong>{' '}
                    {String(transfer.notes || 'Žiadna poznámka')}
                  </UnifiedTypography>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Company Dialog */}
      <Dialog open={createCompanyDialogOpen} onOpenChange={(open) => !open && onCloseCreateCompany()}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>🏢 Pridať novú firmu</DialogTitle>
            <DialogDescription>
              Vytvorte novú firmu ktorá bude môcť vlastniť vozidlá
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="col-span-full">
              <Label htmlFor="company-name">Názov firmy *</Label>
              <Input
                id="company-name"
                value={newCompanyData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCompanyDataChange('name', e.target.value)}
                required
                placeholder="Názov firmy"
              />
            </div>
            
            <div>
              <Label htmlFor="owner-name">Meno majiteľa</Label>
              <Input
                id="owner-name"
                value={newCompanyData.ownerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCompanyDataChange('ownerName', e.target.value)}
                placeholder="Meno majiteľa"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={newCompanyData.contactEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCompanyDataChange('contactEmail', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="contact-phone">Telefón</Label>
              <Input
                id="contact-phone"
                value={newCompanyData.contactPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCompanyDataChange('contactPhone', e.target.value)}
                placeholder="+421 XXX XXX XXX"
              />
            </div>
            
            <div>
              <Label htmlFor="personal-iban">Osobný IBAN</Label>
              <Input
                id="personal-iban"
                value={newCompanyData.personalIban}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCompanyDataChange('personalIban', e.target.value)}
                placeholder="SK89 XXXX XXXX XXXX XXXX XXXX"
              />
            </div>
            
            <div>
              <Label htmlFor="business-iban">Firemný IBAN</Label>
              <Input
                id="business-iban"
                value={newCompanyData.businessIban}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCompanyDataChange('businessIban', e.target.value)}
                placeholder="SK89 XXXX XXXX XXXX XXXX XXXX"
              />
            </div>
            
            <div className="col-span-full">
              <Label htmlFor="commission-rate">Provízia (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                value={newCompanyData.defaultCommissionRate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCompanyDataChange('defaultCommissionRate', e.target.value)}
                min="0"
                max="100"
                step="0.1"
                placeholder="0.0"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onCloseCreateCompany}>
              Zrušiť
            </Button>
            <Button
              onClick={onCreateCompany}
              disabled={!newCompanyData.name.trim()}
              className="gap-2"
            >
              <AddIcon className="w-4 h-4" />
              Vytvoriť firmu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Investor Dialog */}
      <Dialog open={createInvestorDialogOpen} onOpenChange={(open) => !open && onCloseCreateInvestor()}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>👤 Pridať spoluinvestora</DialogTitle>
            <DialogDescription>
              Pridajte nového spoluinvestora ktorý bude môcť vlastniť podiely vo vozidlách
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="first-name">Krstné meno *</Label>
              <Input
                id="first-name"
                value={newInvestorData.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInvestorDataChange('firstName', e.target.value)}
                required
                placeholder="Krstné meno"
              />
            </div>
            
            <div>
              <Label htmlFor="last-name">Priezvisko *</Label>
              <Input
                id="last-name"
                value={newInvestorData.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInvestorDataChange('lastName', e.target.value)}
                required
                placeholder="Priezvisko"
              />
            </div>
            
            <div>
              <Label htmlFor="investor-email">Email</Label>
              <Input
                id="investor-email"
                type="email"
                value={newInvestorData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInvestorDataChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="investor-phone">Telefón</Label>
              <Input
                id="investor-phone"
                value={newInvestorData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInvestorDataChange('phone', e.target.value)}
                placeholder="+421 XXX XXX XXX"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onCloseCreateInvestor}>
              Zrušiť
            </Button>
            <Button
              onClick={onCreateInvestor}
              disabled={
                !newInvestorData.firstName.trim() ||
                !newInvestorData.lastName.trim()
              }
              className="gap-2"
            >
              <AddIcon className="w-4 h-4" />
              Vytvoriť spoluinvestora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Share Dialog */}
      <Dialog open={assignShareDialogOpen} onOpenChange={(open) => !open && onCloseAssignShare()}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>🏢 Priradiť podiel k firme</DialogTitle>
            <DialogDescription>
              Priraďte podiel vo vozidle konkrétnej firme
            </DialogDescription>
            {selectedInvestorForShare && (
              <DialogDescription>
                {String(selectedInvestorForShare.firstName)}{' '}
                {String(selectedInvestorForShare.lastName)}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="col-span-full">
              <Label htmlFor="company-select">Firma *</Label>
              <Select 
                value={newShareData.companyId} 
                onValueChange={(value) => onShareDataChange('companyId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte firmu" />
                </SelectTrigger>
                <SelectContent>
                  {companies
                    ?.filter(c => c.isActive !== false)
                    .map(company => (
                      <SelectItem
                        key={String(company.id)}
                        value={String(company.id)}
                      >
                        {String(company.name)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="ownership-percentage">Podiel vlastníctva (%) *</Label>
              <Input
                id="ownership-percentage"
                type="number"
                value={newShareData.ownershipPercentage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onShareDataChange(
                    'ownershipPercentage',
                    parseFloat(e.target.value) || 0
                  )
                }
                min="0"
                max="100"
                step="0.1"
                required
                placeholder="0.0"
              />
            </div>
            
            <div>
              <Label htmlFor="investment-amount">Investičná suma (€)</Label>
              <Input
                id="investment-amount"
                type="number"
                value={newShareData.investmentAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onShareDataChange(
                    'investmentAmount',
                    parseFloat(e.target.value) || 0
                  )
                }
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onCloseAssignShare}>
              Zrušiť
            </Button>
            <Button
              onClick={onAssignShare}
              disabled={
                !newShareData.companyId || newShareData.ownershipPercentage <= 0
              }
              className="gap-2"
            >
              <AddIcon className="w-4 h-4" />
              Priradiť podiel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VehicleDialogs;
