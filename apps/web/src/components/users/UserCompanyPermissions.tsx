import {
  Plus as AddIcon,
  Building2 as BusinessIcon,
  Check as CheckIcon,
  Trash2 as DeleteIcon,
  Eye as ReadIcon,
  Minus as RemoveIcon,
  Edit as WriteIcon,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Typography } from '../ui/typography';
import { Spinner } from '../ui/spinner';
import { useEffect, useState } from 'react';

import { apiService } from '../../services/api';
import type {
  Company,
  CompanyPermissions,
  ResourcePermission,
  UserCompanyAccess,
} from '../../types';

interface UserCompanyPermissionsProps {
  userId?: string; // undefined pre nového používateľa
  onPermissionsChange?: (_permissions: UserCompanyAccess[]) => void;
}

const RESOURCES = [
  { key: 'vehicles', label: 'Vozidlá', icon: '🚗' },
  { key: 'rentals', label: 'Prenájmy', icon: '📋' },
  { key: 'expenses', label: 'Náklady', icon: '💰' },
  { key: 'settlements', label: 'Vyúčtovanie', icon: '📊' },
  { key: 'customers', label: 'Zákazníci', icon: '👥' },
  { key: 'insurances', label: 'Poistky/STK', icon: '🛡️' },
  { key: 'maintenance', label: 'Údržba', icon: '🔧' },
  { key: 'protocols', label: 'Protokoly', icon: '📝' },
] as const;

const DEFAULT_PERMISSIONS: CompanyPermissions = {
  vehicles: { read: false, write: false, delete: false },
  rentals: { read: false, write: false, delete: false },
  expenses: { read: false, write: false, delete: false },
  settlements: { read: false, write: false, delete: false },
  customers: { read: false, write: false, delete: false },
  insurances: { read: false, write: false, delete: false },
  maintenance: { read: false, write: false, delete: false },
  protocols: { read: false, write: false, delete: false },
};

export default function UserCompanyPermissions({
  userId,
  onPermissionsChange,
}: UserCompanyPermissionsProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userAccess, setUserAccess] = useState<UserCompanyAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<string | false>(false);

  // Načítaj firmy
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesData = await apiService.getCompanies();
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setError('Chyba pri načítavaní firiem');
      }
    };

    fetchCompanies();
  }, []);

  // Načítaj oprávnenia používateľa
  useEffect(() => {
    if (!userId) {
      setUserAccess([]);
      return;
    }

    const fetchUserPermissions = async () => {
      try {
        setLoading(true);
        const accessData = await apiService.getUserCompanyAccess(userId);
        setUserAccess(accessData as unknown as UserCompanyAccess[]);
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        setError('Chyba pri načítavaní oprávnení');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [userId]);

  // Informuj rodičovský komponent o zmenách
  useEffect(() => {
    if (onPermissionsChange) {
      onPermissionsChange(userAccess);
    }
  }, [userAccess, onPermissionsChange]);

  const handleAddCompanyAccess = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    const existingAccess = userAccess.find(
      access => access.companyId === companyId
    );
    if (existingAccess) return;

    const newAccess: UserCompanyAccess = {
      companyId: company.id,
      companyName: company.name,
      permissions: DEFAULT_PERMISSIONS,
    };

    setUserAccess(prev => [...prev, newAccess]);
    setExpandedCompany(companyId);
  };

  const handleRemoveCompanyAccess = (companyId: string) => {
    setUserAccess(prev =>
      prev.filter(access => access.companyId !== companyId)
    );
    if (expandedCompany === companyId) {
      setExpandedCompany(false);
    }
  };

  const handlePermissionChange = (
    companyId: string,
    resource: keyof CompanyPermissions,
    action: keyof ResourcePermission,
    value: boolean
  ) => {
    setUserAccess(prev =>
      prev.map(access => {
        if (access.companyId === companyId) {
          return {
            ...access,
            permissions: {
              ...access.permissions,
              [resource]: {
                ...access.permissions[resource],
                [action]: value,
              },
            },
          };
        }
        return access;
      })
    );
  };

  const handleSetAllPermissions = (
    companyId: string,
    action: keyof ResourcePermission,
    value: boolean
  ) => {
    setUserAccess(prev =>
      prev.map(access => {
        if (access.companyId === companyId) {
          const newPermissions = { ...access.permissions };
          RESOURCES.forEach(resource => {
            newPermissions[resource.key as keyof CompanyPermissions] = {
              ...newPermissions[resource.key as keyof CompanyPermissions],
              [action]: value,
            };
          });
          return {
            ...access,
            permissions: newPermissions,
          };
        }
        return access;
      })
    );
  };

  const hasAnyPermission = (_permissions: CompanyPermissions): boolean => {
    return RESOURCES.some(resource => {
      const resourcePerms =
        _permissions[resource.key as keyof CompanyPermissions];
      return resourcePerms.read || resourcePerms.write || resourcePerms.delete;
    });
  };

  const getPermissionSummary = (permissions: CompanyPermissions): string => {
    let readCount = 0;
    let writeCount = 0;
    let deleteCount = 0;

    RESOURCES.forEach(resource => {
      const resourcePerms =
        permissions[resource.key as keyof CompanyPermissions];
      if (resourcePerms.read) readCount++;
      if (resourcePerms.write) writeCount++;
      if (resourcePerms.delete) deleteCount++;
    });

    const summary = [];
    if (readCount > 0) summary.push(`${readCount} čítanie`);
    if (writeCount > 0) summary.push(`${writeCount} úpravy`);
    if (deleteCount > 0) summary.push(`${deleteCount} mazanie`);

    return summary.join(', ') || 'Žiadne oprávnenia';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Spinner className="h-6 w-6" />
        <Typography variant="body2" className="ml-2">
          Načítavam oprávnenia...
        </Typography>
      </div>
    );
  }

  return (
    <div>
      <Typography
        variant="h6"
        className="mb-4 flex items-center gap-2"
      >
        <BusinessIcon className="h-6 w-6 text-primary" />
        Oprávnenia na firmy
      </Typography>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pridanie prístupu k firmám */}
      <Card className="mb-6">
        <CardHeader>
          <Typography variant="h6">Pridať prístup k firme</Typography>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {companies
              .filter(
                company =>
                  !userAccess.some(access => access.companyId === company.id)
              )
              .map(company => (
                <Button
                  key={company.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddCompanyAccess(company.id)}
                  className="mb-2"
                >
                  <AddIcon className="h-4 w-4 mr-2" />
                  {company.name}
                </Button>
              ))}
            {companies.filter(
              company =>
                !userAccess.some(access => access.companyId === company.id)
            ).length === 0 && (
              <Typography variant="body2" className="text-muted-foreground">
                Používateľ má prístup ku všetkým firmám
              </Typography>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zoznam firiem s oprávneniami */}
      <Accordion type="single" collapsible className="space-y-2">
        {userAccess.map(access => (
          <AccordionItem key={access.companyId} value={access.companyId}>
            <AccordionTrigger>
              <div className="flex items-center gap-4 w-full">
                <BusinessIcon className="h-5 w-5 text-primary" />
                <div className="flex-1 text-left">
                  <Typography variant="h6" className="font-semibold">
                    {access.companyName}
                  </Typography>
                  <Typography variant="caption" className="text-muted-foreground">
                    {getPermissionSummary(access.permissions)}
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  {hasAnyPermission(access.permissions) && (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleRemoveCompanyAccess(access.companyId);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <RemoveIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              {/* Hromadné akcie */}
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <Typography variant="h6" className="mb-3">
                  Hromadné nastavenie:
                </Typography>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleSetAllPermissions(access.companyId, 'read', true)
                    }
                  >
                    Všetko čítanie
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleSetAllPermissions(access.companyId, 'write', true)
                    }
                  >
                    Všetky úpravy
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      handleSetAllPermissions(access.companyId, 'read', false);
                      handleSetAllPermissions(access.companyId, 'write', false);
                      handleSetAllPermissions(access.companyId, 'delete', false);
                    }}
                  >
                    Zrušiť všetko
                  </Button>
                </div>
              </div>

              {/* Detailné oprávnenia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {RESOURCES.map(resource => {
                  const resourcePerms =
                    access.permissions[resource.key as keyof CompanyPermissions];
                  return (
                    <Card key={resource.key} className="h-full">
                      <CardContent className="p-4">
                        <Typography
                          variant="h6"
                          className="mb-4 flex items-center gap-2"
                        >
                          <span>{resource.icon}</span>
                          {resource.label}
                        </Typography>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                              <ReadIcon className="h-4 w-4 text-primary" />
                              <Typography variant="caption">
                                Čítanie
                              </Typography>
                            </Label>
                            <Switch
                              checked={resourcePerms.read}
                              onCheckedChange={(checked: boolean) =>
                                handlePermissionChange(
                                  access.companyId,
                                  resource.key as keyof CompanyPermissions,
                                  'read',
                                  checked
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                              <WriteIcon className="h-4 w-4 text-warning" />
                              <Typography variant="caption">
                                Úpravy
                              </Typography>
                            </Label>
                            <Switch
                              checked={resourcePerms.write}
                              onCheckedChange={(checked: boolean) =>
                                handlePermissionChange(
                                  access.companyId,
                                  resource.key as keyof CompanyPermissions,
                                  'write',
                                  checked
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                              <DeleteIcon className="h-4 w-4 text-destructive" />
                              <Typography variant="caption">
                                Mazanie
                              </Typography>
                            </Label>
                            <Switch
                              checked={resourcePerms.delete}
                              onCheckedChange={(checked: boolean) =>
                                handlePermissionChange(
                                  access.companyId,
                                  resource.key as keyof CompanyPermissions,
                                  'delete',
                                  checked
                                )
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {userAccess.length === 0 && (
        <Alert>
          <AlertDescription>
            Používateľ nemá prístup k žiadnej firme. Použite tlačidlá vyššie na
            pridanie prístupu k firmám.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
