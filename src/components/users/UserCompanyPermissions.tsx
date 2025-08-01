import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Visibility as ReadIcon,
  Edit as WriteIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { Company, UserCompanyAccess, CompanyPermissions, ResourcePermission } from '../../types';
import { apiService } from '../../services/api';

interface UserCompanyPermissionsProps {
  userId?: string; // undefined pre nového používateľa
  onPermissionsChange?: (permissions: UserCompanyAccess[]) => void;
}

const RESOURCES = [
  { key: 'vehicles', label: 'Vozidlá', icon: '🚗' },
  { key: 'rentals', label: 'Prenájmy', icon: '📋' },
  { key: 'expenses', label: 'Náklady', icon: '💰' },
  { key: 'settlements', label: 'Vyúčtovanie', icon: '📊' },
  { key: 'customers', label: 'Zákazníci', icon: '👥' },
  { key: 'insurances', label: 'Poistky/STK', icon: '🛡️' },
  { key: 'maintenance', label: 'Údržba', icon: '🔧' },
  { key: 'protocols', label: 'Protokoly', icon: '📝' }
] as const;

const DEFAULT_PERMISSIONS: CompanyPermissions = {
  vehicles: { read: false, write: false, delete: false },
  rentals: { read: false, write: false, delete: false },
  expenses: { read: false, write: false, delete: false },
  settlements: { read: false, write: false, delete: false },
  customers: { read: false, write: false, delete: false },
  insurances: { read: false, write: false, delete: false },
  maintenance: { read: false, write: false, delete: false },
  protocols: { read: false, write: false, delete: false }
};

export default function UserCompanyPermissions({ userId, onPermissionsChange }: UserCompanyPermissionsProps) {
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
        setUserAccess(accessData);
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

    const existingAccess = userAccess.find(access => access.companyId === companyId);
    if (existingAccess) return;

    const newAccess: UserCompanyAccess = {
      companyId: company.id,
      companyName: company.name,
      permissions: DEFAULT_PERMISSIONS
    };

    setUserAccess(prev => [...prev, newAccess]);
    setExpandedCompany(companyId);
  };

  const handleRemoveCompanyAccess = (companyId: string) => {
    setUserAccess(prev => prev.filter(access => access.companyId !== companyId));
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
    setUserAccess(prev => prev.map(access => {
      if (access.companyId === companyId) {
        return {
          ...access,
          permissions: {
            ...access.permissions,
            [resource]: {
              ...access.permissions[resource],
              [action]: value
            }
          }
        };
      }
      return access;
    }));
  };

  const handleSetAllPermissions = (companyId: string, action: keyof ResourcePermission, value: boolean) => {
    setUserAccess(prev => prev.map(access => {
      if (access.companyId === companyId) {
        const newPermissions = { ...access.permissions };
        RESOURCES.forEach(resource => {
          newPermissions[resource.key as keyof CompanyPermissions] = {
            ...newPermissions[resource.key as keyof CompanyPermissions],
            [action]: value
          };
        });
        return {
          ...access,
          permissions: newPermissions
        };
      }
      return access;
    }));
  };

  const hasAnyPermission = (permissions: CompanyPermissions): boolean => {
    return RESOURCES.some(resource => {
      const resourcePerms = permissions[resource.key as keyof CompanyPermissions];
      return resourcePerms.read || resourcePerms.write || resourcePerms.delete;
    });
  };

  const getPermissionSummary = (permissions: CompanyPermissions): string => {
    let readCount = 0;
    let writeCount = 0;
    let deleteCount = 0;

    RESOURCES.forEach(resource => {
      const resourcePerms = permissions[resource.key as keyof CompanyPermissions];
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
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Načítavam oprávnenia...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon color="primary" />
        Oprávnenia na firmy
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Pridanie prístupu k firmám */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Pridať prístup k firme"
          titleTypographyProps={{ variant: 'subtitle1' }}
        />
        <CardContent>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {companies
              .filter(company => !userAccess.some(access => access.companyId === company.id))
              .map(company => (
                <Button
                  key={company.id}
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddCompanyAccess(company.id)}
                  sx={{ mb: 1 }}
                >
                  {company.name}
                </Button>
              ))}
            {companies.filter(company => !userAccess.some(access => access.companyId === company.id)).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Používateľ má prístup ku všetkým firmám
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Zoznam firiem s oprávneniami */}
      {userAccess.map((access) => (
        <Accordion
          key={access.companyId}
          expanded={expandedCompany === access.companyId}
          onChange={(_, isExpanded) => setExpandedCompany(isExpanded ? access.companyId : false)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <BusinessIcon color="primary" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {access.companyName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getPermissionSummary(access.permissions)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {hasAnyPermission(access.permissions) && <CheckIcon color="success" fontSize="small" />}
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCompanyAccess(access.companyId);
                  }}
                >
                  <RemoveIcon />
                </IconButton>
              </Box>
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            {/* Hromadné akcie */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Hromadné nastavenie:
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  size="small"
                  onClick={() => handleSetAllPermissions(access.companyId, 'read', true)}
                >
                  Všetko čítanie
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSetAllPermissions(access.companyId, 'write', true)}
                >
                  Všetky úpravy
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    handleSetAllPermissions(access.companyId, 'read', false);
                    handleSetAllPermissions(access.companyId, 'write', false);
                    handleSetAllPermissions(access.companyId, 'delete', false);
                  }}
                >
                  Zrušiť všetko
                </Button>
              </Stack>
            </Box>

            {/* Detailné oprávnenia */}
            <Grid container spacing={2}>
              {RESOURCES.map((resource) => {
                const resourcePerms = access.permissions[resource.key as keyof CompanyPermissions];
                return (
                  <Grid item xs={12} sm={6} md={4} key={resource.key}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{resource.icon}</span>
                          {resource.label}
                        </Typography>
                        <Stack spacing={1}>
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={resourcePerms.read}
                                onChange={(e) => handlePermissionChange(
                                  access.companyId,
                                  resource.key as keyof CompanyPermissions,
                                  'read',
                                  e.target.checked
                                )}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ReadIcon fontSize="small" color="primary" />
                                <Typography variant="caption">Čítanie</Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={resourcePerms.write}
                                onChange={(e) => handlePermissionChange(
                                  access.companyId,
                                  resource.key as keyof CompanyPermissions,
                                  'write',
                                  e.target.checked
                                )}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <WriteIcon fontSize="small" color="warning" />
                                <Typography variant="caption">Úpravy</Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={resourcePerms.delete}
                                onChange={(e) => handlePermissionChange(
                                  access.companyId,
                                  resource.key as keyof CompanyPermissions,
                                  'delete',
                                  e.target.checked
                                )}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <DeleteIcon fontSize="small" color="error" />
                                <Typography variant="caption">Mazanie</Typography>
                              </Box>
                            }
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      {userAccess.length === 0 && (
        <Alert severity="info">
          Používateľ nemá prístup k žiadnej firme. Použite tlačidlá vyššie na pridanie prístupu k firmám.
        </Alert>
      )}
    </Box>
  );
} 