// 🏢 Advanced User Management Component
// Complete UI for multi-tenant user management

import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  BarChart3,
  Shield,
  Building2,
  Trash2,
  Edit,
  Users,
  UserPlus,
  Lock,
  Clock,
  Eye,
} from 'lucide-react';

import { Alert, AlertDescription } from '../ui/alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Textarea } from '../ui/textarea';

import { useAuth } from '../../context/AuthContext';
import type { Company, User } from '../../types';

// Extended User type for advanced user management
interface ExtendedUser extends User {
  phone?: string;
  jobTitle?: string;
  roleId?: string;
  roleName?: string;
  departmentId?: string;
  departmentName?: string;
  teamId?: string;
  lastLoginAt?: Date;
}

// Role type for advanced user management
interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  permissions: Record<string, unknown>;
  isSystem?: boolean;
  isActive?: boolean;
}

// Department type for advanced user management
interface Department {
  id: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
  managerId?: string;
  monthlyBudget?: string;
  vehicleLimit?: string;
}

// Team type for advanced user management
interface Team {
  id: string;
  name: string;
  description?: string;
  teamLeadId?: string;
  isActive?: boolean;
}

// Activity Log type for advanced user management
interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resourceType?: string;
  ipAddress?: string;
  success?: boolean;
  createdAt: Date | string;
}

// User Permission type for advanced user management
interface UserPermissionEntry {
  companyId: string;
  companyName?: string;
  permissions: Record<
    string,
    { read?: boolean; write?: boolean; delete?: boolean }
  >;
}

// TabPanel je nahradený shadcn TabsContent

const AdvancedUserManagement: React.FC = () => {
  // const theme = useTheme();
  const { state } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle: string;
    roleId: string;
    departmentId: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    roleId: '',
    departmentId: '',
  });
  const [userPermissions, setUserPermissions] = useState<UserPermissionEntry[]>(
    []
  );
  const [companies, setCompanies] = useState<Company[]>([]);

  // API Base URL helper
  const getApiBaseUrl = () => {
    // V produkcii používame Railway URL
    if (process.env.NODE_ENV === 'production') {
      return 'https://blackrent-app-production-4d6f.up.railway.app/api';
    }

    // V developmente - automatická detekcia
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:3001/api`;
  };

  // State for different entities
  const [organization, setOrganization] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  // const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);

  // Auth token helper - musí byť pred useEffect
  const getAuthToken = useCallback(() => {
    return (
      state.token ||
      localStorage.getItem('blackrent_token') ||
      sessionStorage.getItem('blackrent_token')
    );
  }, [state.token]);

  // Form states
  const [userForm, setUserForm] = useState<{
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    jobTitle: string;
    employeeNumber: string;
    departmentId: string;
    roleId: string;
    managerId: string;
    salary: string;
  }>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    jobTitle: '',
    employeeNumber: '',
    departmentId: '',
    roleId: '',
    managerId: '',
    salary: '',
  });

  const [roleForm, setRoleForm] = useState<{
    name: string;
    displayName: string;
    description: string;
    level: number;
    permissions: Record<string, unknown>;
  }>({
    name: '',
    displayName: '',
    description: '',
    level: 1,
    permissions: {},
  });

  const [departmentForm, setDepartmentForm] = useState<{
    name: string;
    description: string;
    parentDepartmentId: string;
    managerId: string;
    monthlyBudget: string;
    vehicleLimit: string;
  }>({
    name: '',
    description: '',
    parentDepartmentId: '',
    managerId: '',
    monthlyBudget: '',
    vehicleLimit: '',
  });

  const [teamForm, setTeamForm] = useState<{
    name: string;
    description: string;
    teamLeadId: string;
  }>({
    name: '',
    description: '',
    teamLeadId: '',
  });

  const loadOrganizationStats = useCallback(async () => {
    const response = await fetch(
      `${getApiBaseUrl()}/advanced-users/organization/stats`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setStats(data.stats);
    }
  }, [getAuthToken]);

  const loadUsers = useCallback(async () => {
    const response = await fetch(`${getApiBaseUrl()}/advanced-users/users`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setUsers(data.users);
    }
  }, [getAuthToken]);

  const loadCompanies = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/companies`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // API vracia { success: true, data: [...] }
        setCompanies(data.data || []);
      } else {
        setCompanies([]);
      }
    } catch (_error) {
      console.warn('Chyba pri načítavaní firiem');
      setCompanies([]);
    }
  }, [getAuthToken]);

  const loadUserPermissions = async (userId: string) => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/permissions/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data.access || []);
      } else {
        setUserPermissions([]);
      }
    } catch (_error) {
      setUserPermissions([]);
    }
  };

  const loadRoles = useCallback(async () => {
    const response = await fetch(`${getApiBaseUrl()}/advanced-users/roles`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setRoles(data.roles);
    }
  }, [getAuthToken]);

  const loadDepartments = useCallback(async () => {
    const response = await fetch(
      `${getApiBaseUrl()}/advanced-users/departments`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setDepartments(data.departments);
    }
  }, [getAuthToken]);

  const loadTeams = useCallback(async () => {
    const response = await fetch(`${getApiBaseUrl()}/advanced-users/teams`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setTeams(data.teams);
    }
  }, [getAuthToken]);

  const loadActivityLog = useCallback(async () => {
    const response = await fetch(
      `${getApiBaseUrl()}/advanced-users/activity-log?limit=50`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setActivityLog(data.activityLog);
    }
  }, [getAuthToken]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load organization info
      const orgResponse = await fetch(
        `${getApiBaseUrl()}/advanced-users/organization`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganization(orgData.organization);
      }

      // Load data based on current tab
      switch (currentTab) {
        case 0: // Organization Overview
          await loadOrganizationStats();
          break;
        case 1: // Users
          await loadUsers();
          await loadCompanies();
          break;
        case 2: // Roles
          await loadRoles();
          break;
        case 3: // Departments
          await loadDepartments();
          break;
        case 4: // Teams
          await loadTeams();
          break;
        case 5: // Activity Log
          await loadActivityLog();
          break;
      }
    } catch (_error) {
      console.error('Error loading data:', error);
      setError('Chyba pri načítavaní dát');
    } finally {
      setLoading(false);
    }
  }, [
    currentTab,
    getAuthToken,
    loadOrganizationStats,
    loadUsers,
    loadCompanies,
    loadRoles,
    loadDepartments,
    loadTeams,
    loadActivityLog,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
  //   setCurrentTab(newValue);
  // };

  const handleCreateUser = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/advanced-users/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        setUserDialogOpen(false);
        resetUserForm();
        await loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Chyba pri vytváraní používateľa');
      }
    } catch (_error) {
      setError('Chyba pri vytváraní používateľa');
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/advanced-users/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(roleForm),
      });

      if (response.ok) {
        setRoleDialogOpen(false);
        resetRoleForm();
        await loadRoles();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Chyba pri vytváraní role');
      }
    } catch (_error) {
      setError('Chyba pri vytváraní role');
    }
  };

  const handleCreateDepartment = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/advanced-users/departments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(departmentForm),
        }
      );

      if (response.ok) {
        setDepartmentDialogOpen(false);
        resetDepartmentForm();
        await loadDepartments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Chyba pri vytváraní oddelenia');
      }
    } catch (_error) {
      setError('Chyba pri vytváraní oddelenia');
    }
  };

  const handleCreateTeam = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/advanced-users/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(teamForm),
      });

      if (response.ok) {
        setTeamDialogOpen(false);
        resetTeamForm();
        await loadTeams();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Chyba pri vytváraní tímu');
      }
    } catch (_error) {
      setError('Chyba pri vytváraní tímu');
    }
  };

  const handleViewUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      window.alert(
        `Zobrazenie používateľa: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nRola: ${user.roleName}`
      );
    }
  };

  const handleEditUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setEditingUser(user);
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        jobTitle: user.jobTitle || '',
        roleId: user.roleId || '',
        departmentId: user.departmentId || '',
      });

      // Load user permissions, roles and companies
      await Promise.all([
        loadUserPermissions(userId),
        loadRoles(), // Načítaj role pre editáciu
        loadCompanies(), // Ensure companies are loaded
      ]);

      setEditModalOpen(true);
    }
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;

    try {
      // 1. Update user basic info
      const userResponse = await fetch(
        `${getApiBaseUrl()}/advanced-users/users/${editingUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        setError(errorData.error || 'Chyba pri úprave používateľa');
        return;
      }

      // 2. Update user permissions
      for (const permission of userPermissions) {
        try {
          await fetch(
            `${getApiBaseUrl()}/permissions/user/${editingUser.id}/company/${permission.companyId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAuthToken()}`,
              },
              body: JSON.stringify({
                permissions: permission.permissions,
              }),
            }
          );
        } catch (permError) {
          console.warn(
            'Chyba pri ukladaní oprávnení pre firmu:',
            permission.companyName
          );
        }
      }

      setEditModalOpen(false);
      setEditingUser(null);
      setUserPermissions([]);
      await loadUsers(); // Reload users to show changes
    } catch (_error) {
      setError('Chyba pri úprave používateľa');
    }
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setUserPermissions([]);
    setEditForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      roleId: '',
      departmentId: '',
    });
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/advanced-users/users/${userId}/deactivate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        await loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Chyba pri deaktivácii používateľa');
      }
    } catch (_error) {
      setError('Chyba pri deaktivácii používateľa');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      jobTitle: '',
      employeeNumber: '',
      departmentId: '',
      roleId: '',
      managerId: '',
      salary: '',
    });
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      displayName: '',
      description: '',
      level: 1,
      permissions: {},
    });
  };

  const resetDepartmentForm = () => {
    setDepartmentForm({
      name: '',
      description: '',
      parentDepartmentId: '',
      managerId: '',
      monthlyBudget: '',
      vehicleLimit: '',
    });
  };

  const resetTeamForm = () => {
    setTeamForm({
      name: '',
      description: '',
      teamLeadId: '',
    });
  };

  const getRoleLevel = (level: number) => {
    const levels = {
      10: 'Super Admin',
      9: 'Admin',
      7: 'Manager',
      5: 'Employee',
      4: 'Sales Rep',
      3: 'Mechanic',
      1: 'Viewer',
    };
    return levels[level as keyof typeof levels] || `Level ${level}`;
  };

  // const getStatusColor = (isActive: boolean) => {
  //   return isActive ? 'success' : 'error';
  // };

  if (loading && currentTab === 0) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-3/5" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">
            Pokročilé správa používateľov
          </h1>
          <p className="text-muted-foreground">
            Multi-tenant user management s pokročilými rolami a oprávneniami
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Card>
          <Tabs
            value={currentTab.toString()}
            onValueChange={value => setCurrentTab(parseInt(value))}
          >
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="0" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organizácia
              </TabsTrigger>
              <TabsTrigger value="1" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Používatelia
              </TabsTrigger>
              <TabsTrigger value="2" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </TabsTrigger>
              <TabsTrigger value="3" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Oddelenia
              </TabsTrigger>
              <TabsTrigger value="4" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Tímy
              </TabsTrigger>
              <TabsTrigger value="5" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Audit Log
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {/* Tab Panels */}
        <Tabs value={currentTab.toString()}>
          {/* Organization Overview */}
          <TabsContent value="0" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informácie o organizácii
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {organization && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold">
                          {String(organization.name || 'Unknown')}
                        </h3>
                        <p className="text-muted-foreground">
                          {String(organization.slug || 'Unknown')}
                        </p>
                      </div>

                      <Badge variant="outline" className="text-sm">
                        {String(
                          organization.subscriptionPlan || 'Unknown'
                        ).toUpperCase()}
                      </Badge>

                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Email:</strong>{' '}
                          {String(organization.email || 'Nie je nastavený')}
                        </p>
                        <p>
                          <strong>Telefón:</strong>{' '}
                          {String(organization.phone || 'Nie je nastavený')}
                        </p>
                        <p>
                          <strong>Max. používateľov:</strong>{' '}
                          {String(organization.maxUsers || 'Unknown')}
                        </p>
                        <p>
                          <strong>Max. vozidiel:</strong>{' '}
                          {String(organization.maxVehicles || 'Unknown')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Štatistiky
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4">
                        <div className="text-3xl font-bold text-blue-600">
                          {String(stats.totalUsers || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Celkom používateľov
                        </p>
                      </div>
                      <div className="text-center p-4">
                        <div className="text-3xl font-bold text-green-600">
                          {String(stats.activeUsers || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Aktívnych
                        </p>
                      </div>
                      <div className="text-center p-4">
                        <div className="text-3xl font-bold text-blue-500">
                          {String(stats.totalDepartments || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Oddelení
                        </p>
                      </div>
                      <div className="text-center p-4">
                        <div className="text-3xl font-bold text-orange-500">
                          {String(stats.totalTeams || 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Tímov</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="1" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Používatelia ({users.length})
              </h2>
              <Button
                onClick={() => {
                  setUserDialogOpen(true);
                  loadRoles(); // Načítaj role pri otvorení dialógu
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Pridať používateľa
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Používateľ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rola</TableHead>
                    <TableHead>Oddelenie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posledné prihlásenie</TableHead>
                    <TableHead>Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.firstName?.[0] || user.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.jobTitle || user.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.roleName || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.departmentName || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? 'default' : 'destructive'}
                        >
                          {user.isActive ? 'Aktívny' : 'Neaktívny'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt
                          ? format(
                              new Date(user.lastLoginAt),
                              'dd.MM.yyyy HH:mm',
                              {
                                locale: sk,
                              }
                            )
                          : 'Nikdy'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewUser(user.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Zobraziť</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Upraviť</TooltipContent>
                          </Tooltip>
                          {user.isActive && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeactivateUser(user.id)}
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Deaktivovať</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Roles Management */}
          <TabsContent value="2" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Role ({roles.length})</h2>
              <Button onClick={() => setRoleDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Pridať rolu
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(role => (
                <Card key={role.id}>
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {role.displayName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {role.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getRoleLevel(role.level)}
                      </Badge>
                    </div>

                    <p className="text-sm min-h-[40px]">
                      {role.description || 'Bez popisu'}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">
                            Systémová
                          </Badge>
                        )}
                        {!role.isActive && (
                          <Badge variant="destructive" className="text-xs">
                            Neaktívna
                          </Badge>
                        )}
                      </div>

                      {!role.isSystem && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Departments Management */}
          <TabsContent value="3" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Oddelenia ({departments.length})
              </h2>
              <Button onClick={() => setDepartmentDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Pridať oddelenie
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map(department => (
                <Card key={department.id}>
                  <CardContent className="space-y-4">
                    <h3 className="font-semibold text-lg">{department.name}</h3>

                    {department.description && (
                      <p className="text-sm text-muted-foreground">
                        {department.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {department.monthlyBudget && (
                        <Badge variant="outline" className="text-xs">
                          Budget: {department.monthlyBudget}€
                        </Badge>
                      )}
                      {department.vehicleLimit && (
                        <Badge variant="outline" className="text-xs">
                          Vozidlá: {department.vehicleLimit}
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Teams Management */}
          <TabsContent value="4" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Tímy ({teams.length})</h2>
              <Button onClick={() => setTeamDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Pridať tím
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map(team => (
                <Card key={team.id}>
                  <CardContent className="space-y-4">
                    <h3 className="font-semibold text-lg">{team.name}</h3>

                    {team.description && (
                      <p className="text-sm text-muted-foreground">
                        {team.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <Badge
                        variant={team.isActive ? 'default' : 'destructive'}
                      >
                        {team.isActive ? 'Aktívny' : 'Neaktívny'}
                      </Badge>

                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Activity Log */}
          <TabsContent value="5" className="space-y-6">
            <h2 className="text-xl font-semibold">
              Audit Log ({activityLog.length})
            </h2>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Čas</TableHead>
                    <TableHead>Používateľ</TableHead>
                    <TableHead>Akcia</TableHead>
                    <TableHead>Zdroj</TableHead>
                    <TableHead>IP adresa</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLog.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(
                          new Date(log.createdAt),
                          'dd.MM.yyyy HH:mm:ss',
                          {
                            locale: sk,
                          }
                        )}
                      </TableCell>
                      <TableCell>{log.userId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.resourceType && (
                          <Badge variant="secondary">{log.resourceType}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{log.ipAddress || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={log.success ? 'default' : 'destructive'}
                        >
                          {log.success ? 'Úspech' : 'Chyba'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pridať používateľa</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Používateľské meno</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, username: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Meno</Label>
                <Input
                  id="firstName"
                  value={userForm.firstName}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Priezvisko</Label>
                <Input
                  id="lastName"
                  value={userForm.lastName}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, password: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefón</Label>
                <Input
                  id="phone"
                  value={userForm.phone}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rola</Label>
                <Select
                  value={userForm.roleId}
                  onValueChange={value =>
                    setUserForm(prev => ({ ...prev, roleId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte rolu" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Oddelenie</Label>
                <Select
                  value={userForm.departmentId}
                  onValueChange={value =>
                    setUserForm(prev => ({ ...prev, departmentId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte oddelenie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-department">Žiadne</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUserDialogOpen(false)}
              >
                Zrušiť
              </Button>
              <Button onClick={handleCreateUser}>Vytvoriť</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Pridať rolu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Názov role</Label>
                <Input
                  id="role-name"
                  value={roleForm.name}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-display-name">Zobrazovaný názov</Label>
                <Input
                  id="role-display-name"
                  value={roleForm.displayName}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setRoleForm(prev => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-description">Popis</Label>
                <Textarea
                  id="role-description"
                  rows={3}
                  value={roleForm.description}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setRoleForm(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-level">Úroveň (1-10)</Label>
                <Input
                  id="role-level"
                  type="number"
                  min="1"
                  max="10"
                  value={roleForm.level}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setRoleForm(prev => ({
                      ...prev,
                      level: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRoleDialogOpen(false)}
              >
                Zrušiť
              </Button>
              <Button onClick={handleCreateRole}>Vytvoriť</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Department Dialog */}
        <Dialog
          open={departmentDialogOpen}
          onOpenChange={setDepartmentDialogOpen}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Pridať oddelenie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dept-name">Názov oddelenia</Label>
                <Input
                  id="dept-name"
                  value={departmentForm.name}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setDepartmentForm(prev => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-description">Popis</Label>
                <Textarea
                  id="dept-description"
                  rows={3}
                  value={departmentForm.description}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setDepartmentForm(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dept-budget">Mesačný budget (€)</Label>
                  <Input
                    id="dept-budget"
                    type="number"
                    value={departmentForm.monthlyBudget}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >
                    ) =>
                      setDepartmentForm(prev => ({
                        ...prev,
                        monthlyBudget: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept-vehicles">Limit vozidiel</Label>
                  <Input
                    id="dept-vehicles"
                    type="number"
                    value={departmentForm.vehicleLimit}
                    onChange={(
                      e: React.ChangeEvent<
                        HTMLInputElement | HTMLTextAreaElement
                      >
                    ) =>
                      setDepartmentForm(prev => ({
                        ...prev,
                        vehicleLimit: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDepartmentDialogOpen(false)}
              >
                Zrušiť
              </Button>
              <Button onClick={handleCreateDepartment}>Vytvoriť</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Team Dialog */}
        <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Pridať tím</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Názov tímu</Label>
                <Input
                  id="team-name"
                  value={teamForm.name}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-description">Popis</Label>
                <Textarea
                  id="team-description"
                  rows={3}
                  value={teamForm.description}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setTeamForm(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-lead">Vedúci tímu</Label>
                <Select
                  value={teamForm.teamLeadId}
                  onValueChange={value =>
                    setTeamForm(prev => ({
                      ...prev,
                      teamLeadId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte vedúceho tímu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-team-lead">Žiadny</SelectItem>
                    {users
                      .filter(u => u.isActive)
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setTeamDialogOpen(false)}
              >
                Zrušiť
              </Button>
              <Button onClick={handleCreateTeam}>Vytvoriť</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editModalOpen} onOpenChange={handleCancelEdit}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upraviť používateľa</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Meno</Label>
                <Input
                  id="edit-firstName"
                  value={editForm.firstName}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Priezvisko</Label>
                <Input
                  id="edit-lastName"
                  value={editForm.lastName}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefón</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-jobTitle">Pozícia</Label>
                <Input
                  id="edit-jobTitle"
                  value={editForm.jobTitle}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rola</Label>
                <Select
                  value={editForm.roleId}
                  onValueChange={value =>
                    setEditForm({ ...editForm, roleId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte rolu" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Oddelenie</Label>
                <Select
                  value={editForm.departmentId}
                  onValueChange={value =>
                    setEditForm({ ...editForm, departmentId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte oddelenie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-department">Žiadne</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="space-y-4">
              <Separator />
              <h4 className="font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Oprávnenia pre firmy
              </h4>

              {companies.map(company => {
                const userCompanyAccess = userPermissions.find(
                  p => p.companyId === company.id
                );
                const permissions = userCompanyAccess?.permissions || {
                  vehicles: { read: false, write: false, delete: false },
                  rentals: { read: false, write: false, delete: false },
                  expenses: { read: false, write: false, delete: false },
                  customers: { read: false, write: false, delete: false },
                  insurances: { read: false, write: false, delete: false },
                  protocols: { read: false, write: false, delete: false },
                  settlements: { read: false, write: false, delete: false },
                  maintenance: { read: false, write: false, delete: false },
                  statistics: { read: false, write: false, delete: false },
                };

                return (
                  <Accordion key={company.id} type="single" collapsible>
                    <AccordionItem value={company.id}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{company.name}</span>
                          {userCompanyAccess && (
                            <Badge variant="outline" className="text-xs">
                              Má prístup
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          {Object.entries({
                            vehicles: '🚗 Vozidlá',
                            rentals: '📋 Prenájmy',
                            expenses: '💰 Náklady',
                            customers: '👥 Zákazníci',
                            insurances: '🛡️ Poistky',
                            protocols: '📝 Protokoly',
                            settlements: '📊 Vyúčtovania',
                            maintenance: '🔧 Údržba',
                            statistics: '📈 Štatistiky',
                          }).map(([resource, label]) => (
                            <div key={resource} className="space-y-2">
                              <p className="font-medium text-sm">{label}</p>
                              <div className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={
                                      permissions[resource]?.read || false
                                    }
                                    onCheckedChange={(checked: boolean) => {
                                      const newPermissions = [
                                        ...userPermissions,
                                      ];
                                      const existingIndex =
                                        newPermissions.findIndex(
                                          p => p.companyId === company.id
                                        );

                                      if (existingIndex >= 0) {
                                        const permissions =
                                          newPermissions[existingIndex]
                                            ?.permissions;
                                        if (
                                          permissions &&
                                          !permissions[resource]
                                        ) {
                                          permissions[resource] = {};
                                        }
                                        if (permissions) {
                                          (
                                            permissions[resource] as {
                                              read?: boolean;
                                            }
                                          ).read = checked;
                                        }
                                      } else {
                                        const newPerm = {
                                          companyId: company.id,
                                          companyName: company.name,
                                          permissions: {
                                            vehicles: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            rentals: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            expenses: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            customers: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            insurances: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            protocols: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            settlements: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            maintenance: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            statistics: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                          },
                                        };
                                        const permissionsObj =
                                          newPerm.permissions as Record<
                                            string,
                                            {
                                              read?: boolean;
                                              write?: boolean;
                                              delete?: boolean;
                                            }
                                          >;
                                        if (!permissionsObj[resource]) {
                                          permissionsObj[resource] = {
                                            read: false,
                                            write: false,
                                            delete: false,
                                          };
                                        }
                                        const resourcePerms =
                                          permissionsObj[resource];
                                        if (resourcePerms) {
                                          resourcePerms.read = checked;
                                        }
                                        newPermissions.push(newPerm);
                                      }

                                      setUserPermissions(newPermissions);
                                    }}
                                  />
                                  <Label className="text-sm">Čítanie</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={
                                      permissions[resource]?.write || false
                                    }
                                    onCheckedChange={(checked: boolean) => {
                                      const newPermissions = [
                                        ...userPermissions,
                                      ];
                                      const existingIndex =
                                        newPermissions.findIndex(
                                          p => p.companyId === company.id
                                        );

                                      if (existingIndex >= 0) {
                                        const permissions =
                                          newPermissions[existingIndex]
                                            ?.permissions;
                                        if (
                                          permissions &&
                                          !permissions[resource]
                                        ) {
                                          permissions[resource] = {};
                                        }
                                        if (permissions) {
                                          (
                                            permissions[resource] as {
                                              write?: boolean;
                                            }
                                          ).write = checked;
                                        }
                                      } else {
                                        const newPerm = {
                                          companyId: company.id,
                                          companyName: company.name,
                                          permissions: {
                                            vehicles: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            rentals: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            expenses: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            customers: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            insurances: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            protocols: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            settlements: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            maintenance: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            statistics: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                          },
                                        };
                                        const permissionsObj =
                                          newPerm.permissions as Record<
                                            string,
                                            {
                                              read?: boolean;
                                              write?: boolean;
                                              delete?: boolean;
                                            }
                                          >;
                                        if (!permissionsObj[resource]) {
                                          permissionsObj[resource] = {
                                            read: false,
                                            write: false,
                                            delete: false,
                                          };
                                        }
                                        const resourcePerms =
                                          permissionsObj[resource];
                                        if (resourcePerms) {
                                          resourcePerms.write = checked;
                                        }
                                        newPermissions.push(newPerm);
                                      }

                                      setUserPermissions(newPermissions);
                                    }}
                                  />
                                  <Label className="text-sm">Zápis</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={
                                      permissions[resource]?.delete || false
                                    }
                                    onCheckedChange={(checked: boolean) => {
                                      const newPermissions = [
                                        ...userPermissions,
                                      ];
                                      const existingIndex =
                                        newPermissions.findIndex(
                                          p => p.companyId === company.id
                                        );

                                      if (existingIndex >= 0) {
                                        const permissions =
                                          newPermissions[existingIndex]
                                            ?.permissions;
                                        if (
                                          permissions &&
                                          !permissions[resource]
                                        ) {
                                          permissions[resource] = {};
                                        }
                                        if (permissions) {
                                          (
                                            permissions[resource] as {
                                              delete?: boolean;
                                            }
                                          ).delete = checked;
                                        }
                                      } else {
                                        const newPerm = {
                                          companyId: company.id,
                                          companyName: company.name,
                                          permissions: {
                                            vehicles: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            rentals: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            expenses: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            customers: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            insurances: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            protocols: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            settlements: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            maintenance: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                            statistics: {
                                              read: false,
                                              write: false,
                                              delete: false,
                                            },
                                          },
                                        };
                                        const permissionsObj =
                                          newPerm.permissions as Record<
                                            string,
                                            {
                                              read?: boolean;
                                              write?: boolean;
                                              delete?: boolean;
                                            }
                                          >;
                                        if (!permissionsObj[resource]) {
                                          permissionsObj[resource] = {
                                            read: false,
                                            write: false,
                                            delete: false,
                                          };
                                        }
                                        const resourcePerms =
                                          permissionsObj[resource];
                                        if (resourcePerms) {
                                          resourcePerms.delete = checked;
                                        }
                                        newPermissions.push(newPerm);
                                      }

                                      setUserPermissions(newPermissions);
                                    }}
                                  />
                                  <Label className="text-sm">Mazanie</Label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Zrušiť
              </Button>
              <Button onClick={handleSaveEditUser}>Uložiť</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default AdvancedUserManagement;
