import {
  Shield as AdminIcon,
  Check as CheckIcon,
  Building2 as CompanyIcon,
  Briefcase as EmployeeIcon,
  Wrench as MechanicIcon,
  Store as SalesIcon,
  Hammer as TempWorkerIcon,
  User as UserIcon,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Typography } from '../ui/typography';

// Definícia typov pre oprávnenia
interface Permission {
  resource: string;
  actions: string[];
  conditions?: {
    ownOnly?: boolean;
    companyOnly?: boolean;
    maxAmount?: number;
    approvalRequired?: boolean;
  };
}

interface RolePermissions {
  [key: string]: Permission[];
}

// Definícia práv rolí (kópia z backend/src/middleware/permissions.ts)
const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    {
      resource: '*',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: {},
    },
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
    { resource: 'statistics', actions: ['read'] },
  ],
  employee: [
    { resource: 'vehicles', actions: ['read', 'create', 'update'] },
    { resource: 'rentals', actions: ['read', 'create', 'update'] },
    { resource: 'customers', actions: ['read', 'create', 'update'] },
    { resource: 'maintenance', actions: ['read', 'create'] },
    { resource: 'protocols', actions: ['read', 'create', 'update'] },
  ],
  temp_worker: [
    { resource: 'vehicles', actions: ['read'] },
    { resource: 'rentals', actions: ['read', 'create'] },
    { resource: 'customers', actions: ['read', 'create'] },
    { resource: 'protocols', actions: ['read', 'create'] },
  ],
  mechanic: [
    {
      resource: 'vehicles',
      actions: ['read', 'update'],
      conditions: { ownOnly: true },
    },
    {
      resource: 'maintenance',
      actions: ['read', 'create', 'update', 'delete'],
      conditions: { ownOnly: true },
    },
    {
      resource: 'protocols',
      actions: ['read', 'create', 'update'],
      conditions: { ownOnly: true },
    },
  ],
  sales_rep: [
    { resource: 'vehicles', actions: ['read'] },
    { resource: 'rentals', actions: ['read', 'create', 'update'] },
    { resource: 'customers', actions: ['read', 'create', 'update'] },
    {
      resource: 'pricing',
      actions: ['read', 'update'],
      conditions: { maxAmount: 5000 },
    },
  ],
  investor: [
    {
      resource: 'vehicles',
      actions: ['read'],
      conditions: { companyOnly: true },
    },
    {
      resource: 'rentals',
      actions: ['read'],
      conditions: { companyOnly: true },
    },
    {
      resource: 'expenses',
      actions: ['read'],
      conditions: { companyOnly: true },
    },
    {
      resource: 'insurances',
      actions: ['read'],
      conditions: { companyOnly: true },
    },
    { resource: 'companies', actions: ['read'], conditions: { ownOnly: true } },
    {
      resource: 'finances',
      actions: ['read'],
      conditions: { companyOnly: true },
    },
    {
      resource: 'protocols',
      actions: ['read'],
      conditions: { companyOnly: true },
    },
  ],
};

const ROLE_INFO = {
  admin: {
    name: 'Administrátor',
    icon: AdminIcon,
    color: 'error',
    description: 'Úplné práva na všetko',
  },
  user: {
    name: 'Používateľ',
    icon: UserIcon,
    color: 'inherit',
    description: 'Základný používateľ s READ-ONLY právami',
  },
  employee: {
    name: 'Zamestnanec',
    icon: EmployeeIcon,
    color: 'info',
    description: 'Základné operácie s vozidlami, prenájmami, zákazníkmi',
  },
  temp_worker: {
    name: 'Brigádnik',
    icon: TempWorkerIcon,
    color: 'warning',
    description: 'Obmedzené práva, hlavne čítanie',
  },
  mechanic: {
    name: 'Mechanik',
    icon: MechanicIcon,
    color: 'success',
    description: 'Špecializované práva na údržbu',
  },
  sales_rep: {
    name: 'Obchodník',
    icon: SalesIcon,
    color: 'secondary',
    description: 'Obchodné operácie s limitmi',
  },
  investor: {
    name: 'Investor',
    icon: CompanyIcon,
    color: 'primary',
    description: 'Read-only prístup k vlastným vozidlám a firmám',
  },
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
  finances: 'Financie',
};

// const ACTION_LABELS = {
//   read: 'Čítanie',
//   create: 'Vytváranie',
//   update: 'Úprava',
//   delete: 'Mazanie',
// }; // Nepoužívané

interface RolePermissionsDisplayProps {
  selectedRole?: string;
  showAllRoles?: boolean;
}

export default function RolePermissionsDisplay({
  selectedRole,
  // showAllRoles = true,
}: RolePermissionsDisplayProps) {
  const rolesToShow = selectedRole
    ? [selectedRole]
    : Object.keys(ROLE_PERMISSIONS);

  const renderPermissionItem = (permission: Permission) => {
    const resourceLabel =
      RESOURCE_LABELS[permission.resource as keyof typeof RESOURCE_LABELS] ||
      permission.resource;
    const actions = permission.actions.join(', ');
    const conditions = permission.conditions;

    let conditionText = '';
    if (conditions?.ownOnly) conditionText += ' (len vlastné)';
    if (conditions?.companyOnly) conditionText += ' (len vlastná firma)';
    if (conditions?.maxAmount)
      conditionText += ` (max ${conditions.maxAmount}€)`;
    if (conditions?.approvalRequired) conditionText += ' (vyžaduje schválenie)';

    return (
      <div key={permission.resource} className="flex items-start gap-3 py-2">
        <CheckIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Typography variant="body2" className="font-medium">
              {resourceLabel}
            </Typography>
            <Typography variant="caption" className="text-muted-foreground">
              ({actions}){conditionText}
            </Typography>
          </div>
        </div>
      </div>
    );
  };

  const renderRoleCard = (roleKey: string) => {
    const roleInfo = ROLE_INFO[roleKey as keyof typeof ROLE_INFO];
    const permissions =
      ROLE_PERMISSIONS[roleKey as keyof typeof ROLE_PERMISSIONS];
    const IconComponent = roleInfo.icon;

    if (!roleInfo || !permissions) return null;

    const getColorClass = (color: string) => {
      switch (color) {
        case 'primary': return 'text-primary';
        case 'secondary': return 'text-secondary';
        case 'error': return 'text-destructive';
        case 'info': return 'text-blue-600';
        case 'success': return 'text-green-600';
        case 'warning': return 'text-yellow-600';
        default: return 'text-foreground';
      }
    };

    const getBadgeVariant = (color: string) => {
      switch (color) {
        case 'primary': return 'default';
        case 'secondary': return 'secondary';
        case 'error': return 'destructive';
        case 'info': return 'default';
        case 'success': return 'default';
        case 'warning': return 'default';
        default: return 'outline';
      }
    };

    return (
      <AccordionItem key={roleKey} value={roleKey} className="mb-4">
        <AccordionTrigger>
          <div className="flex items-center gap-4 w-full">
            <IconComponent className={`h-6 w-6 ${getColorClass(roleInfo.color)}`} />
            <div className="flex-1 text-left">
              <Typography variant="h6" className="font-semibold">
                {roleInfo.name}
              </Typography>
              <Typography variant="body2" className="text-muted-foreground">
                {roleInfo.description}
              </Typography>
            </div>
            <Badge
              variant={getBadgeVariant(roleInfo.color)}
              className="text-xs"
            >
              {roleKey.toUpperCase()}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div>
            <Typography variant="h6" className="mb-4">
              Oprávnenia:
            </Typography>

            {roleKey === 'admin' ? (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <Typography variant="body2" className="text-destructive font-semibold">
                  🔥 ÚPLNÉ PRÁVA NA VŠETKO
                </Typography>
                <Typography variant="caption" className="text-muted-foreground">
                  Administrátor má neobmedzený prístup k celému systému
                </Typography>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                {permissions.map(permission =>
                  renderPermissionItem(permission)
                )}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div>
      <Typography variant="h4" className="mb-6">
        📋 Práva používateľských rolí
      </Typography>

      <div className="mb-4">
        <Typography variant="body2" className="text-muted-foreground">
          Prehľad oprávnení pre jednotlivé role v BlackRent systéme
        </Typography>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {rolesToShow.map(roleKey => renderRoleCard(roleKey))}
      </Accordion>
    </div>
  );
}
