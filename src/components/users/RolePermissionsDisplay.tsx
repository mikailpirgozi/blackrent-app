import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Work as EmployeeIcon,
  Build as TempWorkerIcon,
  Engineering as MechanicIcon,
  BusinessCenter as SalesIcon,
  Business as CompanyIcon
} from '@mui/icons-material';

// Definícia práv rolí (kópia z backend/src/middleware/permissions.ts)
const ROLE_PERMISSIONS = {
  admin: [
    {
      resource: '*',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: {}
    }
  ],
  user: [
    { resource: 'vehicles', actions: ['read'] },
    { resource: 'rentals', actions: ['read'] },
    { resource: 'customers', actions: ['read'] },
    { resource: 'expenses', actions: ['read'] },
    { resource: 'settlements', actions: ['read'] },
    { resource: 'insurances', actions: ['read'] },
    { resource: 'maintenance', actions: ['read'] },
    { resource: 'protocols', actions: ['read', 'create', 'update'] },
    { resource: 'statistics', actions: ['read'] }
  ],
  employee: [
    { resource: 'vehicles', actions: ['read', 'create', 'update'] },
    { resource: 'rentals', actions: ['read', 'create', 'update'] },
    { resource: 'customers', actions: ['read', 'create', 'update'] },
    { resource: 'maintenance', actions: ['read', 'create'] },
    { resource: 'protocols', actions: ['read', 'create', 'update'] }
  ],
  temp_worker: [
    { resource: 'vehicles', actions: ['read'] },
    { resource: 'rentals', actions: ['read', 'create'] },
    { resource: 'customers', actions: ['read', 'create'] },
    { resource: 'protocols', actions: ['read', 'create'] }
  ],
  mechanic: [
    { resource: 'vehicles', actions: ['read', 'update'], conditions: { ownOnly: true } },
    { resource: 'maintenance', actions: ['read', 'create', 'update', 'delete'], conditions: { ownOnly: true } },
    { resource: 'protocols', actions: ['read', 'create', 'update'], conditions: { ownOnly: true } }
  ],
  sales_rep: [
    { resource: 'vehicles', actions: ['read'] },
    { resource: 'rentals', actions: ['read', 'create', 'update'] },
    { resource: 'customers', actions: ['read', 'create', 'update'] },
    { resource: 'pricing', actions: ['read', 'update'], conditions: { maxAmount: 5000 } }
  ],
  company_owner: [
    { resource: 'vehicles', actions: ['read'], conditions: { companyOnly: true } },
    { resource: 'rentals', actions: ['read'], conditions: { companyOnly: true } },
    { resource: 'expenses', actions: ['read'], conditions: { companyOnly: true } },
    { resource: 'insurances', actions: ['read'], conditions: { companyOnly: true } },
    { resource: 'companies', actions: ['read'], conditions: { ownOnly: true } },
    { resource: 'finances', actions: ['read'], conditions: { companyOnly: true } },
    { resource: 'protocols', actions: ['read'], conditions: { companyOnly: true } }
  ]
};

const ROLE_INFO = {
  admin: { 
    name: 'Administrátor', 
    icon: AdminIcon, 
    color: 'error',
    description: 'Úplné práva na všetko'
  },
  user: { 
    name: 'Používateľ', 
    icon: UserIcon, 
    color: 'default',
    description: 'Základný používateľ s READ-ONLY právami'
  },
  employee: { 
    name: 'Zamestnanec', 
    icon: EmployeeIcon, 
    color: 'info',
    description: 'Základné operácie s vozidlami, prenájmami, zákazníkmi'
  },
  temp_worker: { 
    name: 'Brigádnik', 
    icon: TempWorkerIcon, 
    color: 'warning',
    description: 'Obmedzené práva, hlavne čítanie'
  },
  mechanic: { 
    name: 'Mechanik', 
    icon: MechanicIcon, 
    color: 'success',
    description: 'Špecializované práva na údržbu'
  },
  sales_rep: { 
    name: 'Obchodník', 
    icon: SalesIcon, 
    color: 'secondary',
    description: 'Obchodné operácie s limitmi'
  },
  company_owner: { 
    name: 'Majiteľ firmy', 
    icon: CompanyIcon, 
    color: 'primary',
    description: 'Len vlastné vozidlá a súvisiace dáta'
  }
};

const RESOURCE_LABELS = {
  '*': 'Všetko',
  vehicles: 'Vozidlá',
  rentals: 'Prenájmy', 
  customers: 'Zákazníci',
  expenses: 'Náklady',
  settlements: 'Vyúčtovanie',
  insurances: 'Poistky/STK',
  maintenance: 'Údržba',
  protocols: 'Protokoly',
  statistics: 'Štatistiky',
  pricing: 'Cenníky',
  companies: 'Firmy',
  finances: 'Financie'
};

const ACTION_LABELS = {
  read: 'Čítanie',
  create: 'Vytváranie',
  update: 'Úprava',
  delete: 'Mazanie'
};

interface RolePermissionsDisplayProps {
  selectedRole?: string;
  showAllRoles?: boolean;
}

export default function RolePermissionsDisplay({ 
  selectedRole, 
  showAllRoles = true 
}: RolePermissionsDisplayProps) {
  
  const rolesToShow = selectedRole 
    ? [selectedRole] 
    : Object.keys(ROLE_PERMISSIONS);

  const renderPermissionItem = (permission: any) => {
    const resourceLabel = RESOURCE_LABELS[permission.resource as keyof typeof RESOURCE_LABELS] || permission.resource;
    const actions = permission.actions.join(', ');
    const conditions = permission.conditions;
    
    let conditionText = '';
    if (conditions?.ownOnly) conditionText += ' (len vlastné)';
    if (conditions?.companyOnly) conditionText += ' (len vlastná firma)';
    if (conditions?.maxAmount) conditionText += ` (max ${conditions.maxAmount}€)`;
    if (conditions?.approvalRequired) conditionText += ' (vyžaduje schválenie)';

    return (
      <ListItem key={permission.resource} sx={{ py: 0.5 }}>
        <ListItemIcon sx={{ minWidth: 32 }}>
          <CheckIcon color="success" fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                {resourceLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({actions}){conditionText}
              </Typography>
            </Box>
          }
        />
      </ListItem>
    );
  };

  const renderRoleCard = (roleKey: string) => {
    const roleInfo = ROLE_INFO[roleKey as keyof typeof ROLE_INFO];
    const permissions = ROLE_PERMISSIONS[roleKey as keyof typeof ROLE_PERMISSIONS];
    const IconComponent = roleInfo.icon;

    if (!roleInfo || !permissions) return null;

    return (
      <Accordion key={roleKey} defaultExpanded={!showAllRoles}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <IconComponent color={roleInfo.color as any} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                {roleInfo.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {roleInfo.description}
              </Typography>
            </Box>
            <Chip 
              label={roleKey.toUpperCase()} 
              color={roleInfo.color as any}
              size="small"
              variant="outlined"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
              Oprávnenia:
            </Typography>
            
            {roleKey === 'admin' ? (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'error.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'error.200'
              }}>
                <Typography variant="body2" color="error.main" fontWeight={600}>
                  🔥 ÚPLNÉ PRÁVA NA VŠETKO
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Administrátor má neobmedzený prístup k celému systému
                </Typography>
              </Box>
            ) : (
              <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                {permissions.map((permission, index) => renderPermissionItem(permission))}
              </List>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        📋 Práva používateľských rolí
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Prehľad oprávnení pre jednotlivé role v BlackRent systéme
        </Typography>
      </Box>

      <Box>
        {rolesToShow.map(roleKey => renderRoleCard(roleKey))}
      </Box>
    </Box>
  );
}
