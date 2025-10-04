import { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usePlatforms,
  useAssignCompanyToPlatform,
} from '@/lib/react-query/hooks/usePlatforms';
import { useCompanies } from '@/lib/react-query/hooks/useCompanies';
import { useAuth } from '@/context/AuthContext';
import type { Company } from '@/types';

export default function CompanyAssignment() {
  const { isSuperAdmin, state } = useAuth();

  // 🛡️ HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  const { data: platforms, isLoading: platformsLoading } = usePlatforms();
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const assignCompany = useAssignCompanyToPlatform();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('');

  // 🛡️ SECURITY: Only super_admin or admin can access (AFTER ALL HOOKS)
  const isAdmin =
    state.user?.role === 'admin' || state.user?.role === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <p className="text-destructive">
            Prístup zamietnutý. Len super admin môže priraďovať firmy.
          </p>
        </Card>
      </div>
    );
  }

  const handleAssign = async () => {
    if (!selectedCompanyId || !selectedPlatformId) {
      alert('Vyber firmu aj platformu');
      return;
    }

    try {
      await assignCompany.mutateAsync({
        platformId: selectedPlatformId,
        companyId: selectedCompanyId,
      });
      alert('Firma úspešne priradená k platforme!');
      setSelectedCompanyId('');
      setSelectedPlatformId('');
    } catch (error) {
      console.error('Assign company error:', error);
      alert('Chyba pri priraďovaní firmy');
    }
  };

  if (platformsLoading || companiesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Group companies by platform
  const companiesByPlatform = companies?.reduce(
    (acc, company) => {
      const platformId = company.platformId || 'unassigned';
      if (!acc[platformId]) {
        acc[platformId] = [];
      }
      acc[platformId].push(company);
      return acc;
    },
    {} as Record<string, Company[]>
  );

  const unassignedCompanies = companiesByPlatform?.['unassigned'] || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🏢 Company Assignment</h1>
        <p className="text-muted-foreground mt-2">Prirad firmy k platformám</p>
      </div>

      {/* Assignment Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Priradenie firmy k platforme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vyber firmu</label>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyber firmu" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                      {company.platformId && (
                        <Badge variant="secondary" className="ml-2">
                          {
                            platforms?.find(p => p.id === company.platformId)
                              ?.name
                          }
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vyber platformu</label>
              <Select
                value={selectedPlatformId}
                onValueChange={setSelectedPlatformId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyber platformu" />
                </SelectTrigger>
                <SelectContent>
                  {platforms?.map(platform => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAssign}
            disabled={
              !selectedCompanyId ||
              !selectedPlatformId ||
              assignCompany.isPending
            }
            className="w-full"
          >
            {assignCompany.isPending ? 'Priraďuje sa...' : 'Priradiť'}
          </Button>
        </CardContent>
      </Card>

      {/* Companies by Platform */}
      <div className="space-y-6">
        {/* Unassigned Companies */}
        {unassignedCompanies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Nepriradené firmy ({unassignedCompanies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedCompanies.map(company => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Companies by Platform */}
        {platforms?.map(platform => {
          const platformCompanies = companiesByPlatform?.[platform.id] || [];
          if (platformCompanies.length === 0) return null;

          return (
            <Card key={platform.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {platform.name} ({platformCompanies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {platformCompanies.map(company => (
                    <CompanyCard key={company.id} company={company} />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Company Card Component
function CompanyCard({ company }: { company: Company }) {
  return (
    <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium">{company.name}</p>
          {company.businessId && (
            <p className="text-xs text-muted-foreground mt-1">
              IČO: {company.businessId}
            </p>
          )}
        </div>
        {company.isActive && (
          <Badge variant="default" className="text-xs">
            Aktívna
          </Badge>
        )}
      </div>
    </div>
  );
}
