import {
  Building2 as BusinessIcon,
  Edit as EditIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useCallback, useEffect, useState } from 'react';

// import { Vehicle, VehicleStatus } from '../../../types'; // Nepoužívané
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
  const [companyInvestors, setCompanyInvestors] = useState<
    Array<{
      id: string;
      investor?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
      };
      isPrimaryContact?: boolean;
      investmentAmount?: number;
      ownershipPercentage?: number;
    }>
  >([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);
  const [editData, setEditData] = useState<{
    name: string;
    ownerName: string;
    personalIban: string;
    businessIban: string;
    contactEmail: string;
    contactPhone: string;
    defaultCommissionRate: number;
    protocolDisplayName: string;
  }>({
    name: String(company.name || ''),
    ownerName: String(company.ownerName || ''),
    personalIban: String(company.personalIban || ''),
    businessIban: String(company.businessIban || ''),
    contactEmail: String(company.contactEmail || ''),
    contactPhone: String(company.contactPhone || ''),
    defaultCommissionRate: Number(company.defaultCommissionRate) || 20,
    protocolDisplayName: String(company.protocolDisplayName || ''),
  });

  // 🔄 Aktualizuj editData keď sa company data zmenia
  useEffect(() => {
    setEditData({
      name: String(company.name || ''),
      ownerName: String(company.ownerName || ''),
      personalIban: String(company.personalIban || ''),
      businessIban: String(company.businessIban || ''),
      contactEmail: String(company.contactEmail || ''),
      contactPhone: String(company.contactPhone || ''),
      defaultCommissionRate: Number(company.defaultCommissionRate) || 20,
      protocolDisplayName: String(company.protocolDisplayName || ''),
    });
  }, [company]);

  // 🤝 Načítanie investorov firmy
  const loadCompanyInvestors = useCallback(async () => {
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
  }, [company.id]);

  // Načítaj investorov pri rozbalení karty
  useEffect(() => {
    if (expanded) {
      loadCompanyInvestors();
    }
  }, [expanded, loadCompanyInvestors]);

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
          await onVehicleUpdate('', String(company.id)); // Refresh company data
        }
      } else {
        console.error('❌ Failed to save owner data:', result.error);
        // TODO: Replace with proper toast notification
        window.alert(`Chyba pri ukladaní: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving owner data:', error);
      // TODO: Replace with proper toast notification
      window.alert('Chyba pri ukladaní údajov majiteľa');
    }
  };

  return (
    <Card className="mb-2 border border-border">
      {/* Header - Majiteľ info */}
      <div
        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BusinessIcon className="h-5 w-5 text-primary" />
              {String(company.name)}
              <Badge
                variant="outline"
                className="text-xs"
              >
                {vehicles.length} vozidiel
              </Badge>
            </h3>

            {/* Základné info o majiteľovi */}
            <div className="mt-2 flex gap-6 flex-wrap">
              {(company.ownerName as string) && (
                <p className="text-sm text-muted-foreground">
                  👤 {String(company.ownerName)}
                </p>
              )}
              {(company.contactEmail as string) && (
                <p className="text-sm text-muted-foreground">
                  📧 {String(company.contactEmail)}
                </p>
              )}
              {(company.contactPhone as string) && (
                <p className="text-sm text-muted-foreground">
                  📞 {String(company.contactPhone)}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                💰 Provízia: {String(company.defaultCommissionRate) || '20'}%
              </p>
              {(company.protocolDisplayName as string) && (
                <p className="text-sm text-yellow-600 font-medium">
                  📄 Fakturačná firma: {String(company.protocolDisplayName)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                setEditMode(!editMode);
              }}
              className={`${editMode ? 'bg-primary text-primary-foreground' : 'bg-transparent text-primary'}`}
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              {expanded ? '🔽' : '▶️'}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Mode - Rozšírené informácie */}
      <Collapsible open={editMode}>
        <CollapsibleContent>
          <div className="p-6 bg-background border-t border-border">
            <h4 className="text-lg font-semibold mb-4">
              ✏️ Úprava informácií majiteľa
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="company-name">Názov firmy/s.r.o.</Label>
              <Input
                id="company-name"
                value={editData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditData(prev => ({ ...prev, name: e.target.value }))
                }
                className="bg-primary/10"
                required
              />
            </div>
            <div>
              <Label htmlFor="owner-name">Meno a priezvisko majiteľa</Label>
              <Input
                id="owner-name"
                value={editData.ownerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditData(prev => ({ ...prev, ownerName: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Kontaktný email</Label>
              <Input
                id="contact-email"
                type="email"
                value={editData.contactEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditData(prev => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Kontaktný telefón</Label>
              <Input
                id="contact-phone"
                value={editData.contactPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditData(prev => ({
                    ...prev,
                    contactPhone: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="commission-rate">Default provízia (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                value={editData.defaultCommissionRate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditData(prev => ({
                    ...prev,
                    defaultCommissionRate: parseFloat(e.target.value) || 20,
                  }))
                }
                min={0}
                max={100}
                step={0.1}
              />
            </div>
            <div>
              <Label htmlFor="personal-iban">Súkromný IBAN</Label>
              <Input
                id="personal-iban"
                value={editData.personalIban}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditData(prev => ({
                    ...prev,
                    personalIban: e.target.value,
                  }))
                }
                placeholder="SK89 0000 0000 0000 0000 0000"
              />
            </div>
            <div>
              <Label htmlFor="business-iban">Firemný IBAN</Label>
              <Input
                id="business-iban"
                value={editData.businessIban}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditData(prev => ({
                    ...prev,
                    businessIban: e.target.value,
                  }))
                }
                placeholder="SK89 0000 0000 0000 0000 0000"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="protocol-name">Fakturačná firma (pre protokoly)</Label>
              <Input
                id="protocol-name"
                value={editData.protocolDisplayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditData(prev => ({
                    ...prev,
                    protocolDisplayName: e.target.value,
                  }))
                }
                placeholder="Napr. P2 invest s.r.o."
                className="bg-yellow-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Názov firmy ktorý sa zobrazí na protokoloch namiesto interného názvu
              </p>
            </div>
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditMode(false)}
                size="sm"
              >
                Zrušiť
              </Button>
              <Button
                variant="default"
                onClick={handleSaveOwnerData}
                size="sm"
              >
                💾 Uložiť
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Vozidlá majiteľa - Rozbaliteľné */}
      <Collapsible open={expanded}>
        <CollapsibleContent>
          <div className="p-4 border-t border-border">
            <h5 className="text-base font-medium mb-4 flex items-center gap-2">
              🚗 Vozidlá majiteľa ({vehicles.length})
            </h5>

          {vehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className="flex justify-between items-center p-4 mb-2 border border-border rounded-md bg-background hover:bg-muted/50"
            >
              <div className="flex-1">
                <h6 className="text-sm font-semibold">
                  {vehicle.brand} {vehicle.model}
                </h6>
                <p className="text-sm text-muted-foreground">
                  ŠPZ: {vehicle.licensePlate}
                  {vehicle.year && ` • Rok: ${vehicle.year}`}
                </p>

                {/* Individuálna provízia vozidla */}
                <p className="text-xs text-muted-foreground">
                  Provízia:{' '}
                  {vehicle.commission?.value ||
                    Number(company.defaultCommissionRate) ||
                    20}
                  %
                  {vehicle.commission?.value !==
                    Number(company.defaultCommissionRate) && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 text-xs"
                    >
                      Vlastná
                    </Badge>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={getStatusColor(vehicle.status) === 'success' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {getStatusText(vehicle.status)}
                </Badge>

                {/* Quick actions */}
                <Can
                  update="vehicles"
                  context={{
                    resourceOwnerId: vehicle.assignedMechanicId,
                    resourceCompanyId: vehicle.ownerCompanyId,
                  }}
                >
                  <Button
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      onVehicleEdit(vehicle);
                    }}
                    className="w-7 h-7 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <EditIcon className="h-3 w-3" />
                  </Button>
                </Can>
              </div>
            </div>
          ))}

          {/* Spoluinvestori firmy */}
          <div className="mt-6 pt-4 border-t border-border">
            <h6 className="text-base font-medium mb-4 flex items-center gap-2">
              🤝 Spoluinvestori firmy
            </h6>

            {loadingInvestors ? (
              <div className="flex justify-center py-4">
                <EnhancedLoading
                  variant="page"
                  showMessage={true}
                  message="Načítavam investorov..."
                />
              </div>
            ) : companyInvestors.length > 0 ? (
              companyInvestors.map(share => (
                <div
                  key={String(share.id)}
                  className="flex justify-between items-center p-4 mb-2 border border-border rounded-md bg-primary/5 hover:bg-primary/10"
                >
                  <div className="flex-1">
                    <h6 className="text-sm font-semibold">
                      👤 {share.investor?.firstName || ''}{' '}
                      {share.investor?.lastName || ''}
                      {share.isPrimaryContact && (
                        <Badge
                          variant="default"
                          className="ml-2 text-xs"
                        >
                          Primárny kontakt
                        </Badge>
                      )}
                    </h6>
                    <p className="text-sm text-muted-foreground">
                      {share.investor?.email && `📧 ${share.investor.email}`}
                      {share.investor?.phone && ` • 📞 ${share.investor.phone}`}
                    </p>
                    {share.investmentAmount && (
                      <p className="text-xs text-muted-foreground">
                        💰 Investícia: {share.investmentAmount}€
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={share.isPrimaryContact ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {share.ownershipPercentage || 0}%
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žiadni spoluinvestori pre túto firmu.
              </p>
            )}
          </div>

          {/* 📄 NOVÉ: Dokumenty majiteľa */}
          <CompanyDocumentManager
            companyId={String(company.id)}
            companyName={String(company.name)}
          />
        </div>
      </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default OwnerCard;
