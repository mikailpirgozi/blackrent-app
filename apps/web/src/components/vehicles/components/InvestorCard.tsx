import { Plus as AddIcon, Edit as EditIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UnifiedTypography } from '@/components/ui/UnifiedTypography';
import React, { useState } from 'react';

import type { InvestorCardProps } from '../../../types/vehicle-types';
import { getApiBaseUrl } from '../../../utils/apiUrl';

// 🤝 INVESTOR CARD COMPONENT - Rozbaliteľná karta spoluinvestora s podielmi
const InvestorCard: React.FC<InvestorCardProps> = ({
  investor,
  shares,
  companies,
  onShareUpdate,
  onAssignShare,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    firstName: (investor.firstName as string) || '',
    lastName: (investor.lastName as string) || '',
    email: (investor.email as string) || '',
    phone: (investor.phone as string) || '',
    notes: (investor.notes as string) || '',
  });

  const handleSaveInvestorData = async () => {
    try {
      console.log('💾 Saving investor data:', investor.id, editData);

      const response = await fetch(
        `${getApiBaseUrl()}/company-investors/${investor.id}`,
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
        console.log('✅ Investor data saved successfully');
        setEditMode(false);
        onShareUpdate(); // Refresh data
      } else {
        console.error('❌ Failed to save investor data:', result.error);
        console.error(`Chyba pri ukladaní: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving investor data:', error);
      console.error('Chyba pri ukladaní údajov investora');
    }
  };

  const totalOwnership = shares.reduce(
    (sum, share) => sum + (share.ownershipPercentage as number),
    0
  );

  return (
    <Card className="mb-4 border border-gray-200">
      {/* Header - Investor info */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-gray-50 cursor-pointer hover:bg-gray-100 p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <UnifiedTypography
                  variant="h6"
                  className="flex items-center gap-2"
                >
                  👤 {investor.firstName as string} {investor.lastName as string}
                  <Badge variant="outline" className="text-xs">
                    {shares.length} firiem • {totalOwnership.toFixed(1)}% celkom
                  </Badge>
                </UnifiedTypography>

                <div className="mt-2 flex gap-6 flex-wrap">
                  {(investor.email as string) && (
                    <UnifiedTypography variant="body2" className="text-gray-600">
                      📧 {investor.email as string}
                    </UnifiedTypography>
                  )}
                  {(investor.phone as string) && (
                    <UnifiedTypography variant="body2" className="text-gray-600">
                      📞 {investor.phone as string}
                    </UnifiedTypography>
                  )}
                  {shares.length > 0 && (
                    <UnifiedTypography variant="body2" className="text-gray-600">
                      🏢{' '}
                      {shares
                        .map(s => {
                          const company = companies.find(c => c.id === s.companyId);
                          return `${(company?.name as string) || 'Neznáma firma'} (${s.ownershipPercentage as number}%)`;
                        })
                        .join(', ')}
                    </UnifiedTypography>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={editMode ? "default" : "ghost"}
                  onClick={e => {
                    e.stopPropagation();
                    setEditMode(!editMode);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  {expanded ? '🔽' : '▶️'}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        {/* Edit Mode */}
        {editMode && (
          <CardContent className="bg-white border-t border-gray-200">
            <UnifiedTypography variant="h6" className="mb-4">
              ✏️ Úprava spoluinvestora
            </UnifiedTypography>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-name">Meno *</Label>
                <Input
                  id="first-name"
                  value={editData.firstName || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData(prev => ({ ...prev, firstName: e.target.value }))
                  }
                  required
                  placeholder="Meno"
                />
              </div>
              
              <div>
                <Label htmlFor="last-name">Priezvisko *</Label>
                <Input
                  id="last-name"
                  value={editData.lastName || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData(prev => ({ ...prev, lastName: e.target.value }))
                  }
                  required
                  placeholder="Priezvisko"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editData.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefón</Label>
                <Input
                  id="phone"
                  value={editData.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData(prev => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+421 XXX XXX XXX"
                />
              </div>
              
              <div className="col-span-full">
                <Label htmlFor="notes">Poznámky</Label>
                <Textarea
                  id="notes"
                  value={editData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData(prev => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Poznámky..."
                  rows={2}
                />
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
                onClick={handleSaveInvestorData}
                size="sm"
              >
                💾 Uložiť
              </Button>
            </div>
          </CardContent>
        )}

        {/* Podiely vo firmách - Rozbaliteľné */}
        <CollapsibleContent>
          <CardContent className="border-t border-gray-200">
            <UnifiedTypography
              variant="subtitle1"
              className="mb-4 flex items-center gap-2"
            >
              💼 Podiely vo firmách ({shares.length})
            </UnifiedTypography>

            {shares.length > 0 ? (
              shares.map(share => {
                const company = companies.find(c => c.id === share.companyId);
                return (
                  <div
                    key={share.id as string}
                    className="flex justify-between items-center p-4 mb-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <UnifiedTypography variant="subtitle2">
                        🏢 {(company?.name as string) || 'Neznáma firma'}
                      </UnifiedTypography>
                      <UnifiedTypography variant="body2" className="text-gray-600 mt-1">
                        💰 Podiel: {share.ownershipPercentage as number}%
                        {(share.investmentAmount as number) &&
                          ` • Investícia: ${share.investmentAmount as number}€`}
                        {(share.isPrimaryContact as boolean) &&
                          ' • Primárny kontakt'}
                      </UnifiedTypography>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={(share.isPrimaryContact as boolean) ? 'default' : 'outline'}
                      >
                        {share.ownershipPercentage as number}%
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <UnifiedTypography
                variant="body2"
                className="text-gray-600 text-center py-4"
              >
                Žiadne podiely vo firmách. Investor nie je priradený k žiadnej
                firme.
              </UnifiedTypography>
            )}

            {/* Tlačidlo pre pridanie nového podielu */}
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignShare(investor)}
                className="gap-2"
              >
                <AddIcon className="h-4 w-4" />
                🏢 Priradiť k firme
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default InvestorCard;
